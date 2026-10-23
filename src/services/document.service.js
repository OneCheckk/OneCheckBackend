const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/ApiError');
const { Application, Document, InfraPhoto, Alert } = require('../models');
const verificationClient = require('./verificationClient.service');
const {
  validateFileSignature,
  computeSha256,
  savePrivateFile,
  getPrivateFilePath,
  deletePrivateFile
} = require('./storage.service');
const { logEvent } = require('./audit.service');

/**
 * Uploads one or more documents, validates magic bytes, computes checksums, and persists metadata
 */
async function uploadDocuments(user, applicationId, files, bodyData = {}, requestId = null) {
  if (!files || files.length === 0) {
    throw ApiError.badRequest('No files provided in multipart upload request');
  }

  const application = await Application.findById(applicationId);
  if (!application) {
    throw ApiError.notFound('Target application not found');
  }

  // Ownership verification: Institution user can only upload to their own application
  if (user.role === 'INSTITUTION_USER') {
    const userInstId = user.institution?._id || user.institution;
    if (!userInstId || userInstId.toString() !== application.institution.toString()) {
      throw ApiError.forbidden('Access denied: You cannot upload documents to another institution\'s application.');
    }

    if (!['DRAFT', 'DEFICIENCY_RAISED'].includes(application.status)) {
      throw ApiError.badRequest(
        `Cannot upload documents when application is in '${application.status}' status.`
      );
    }
  }

  const createdDocuments = [];
  const writtenStorageKeys = [];

  try {
    for (const file of files) {
      // 1. Validate magic bytes / file signature
      const isSignatureValid = validateFileSignature(file.buffer, file.mimetype);
      if (!isSignatureValid) {
        throw ApiError.unsupportedMediaType(
          `File signature does not match declared MIME type '${file.mimetype}' for file '${file.originalname}'. Spoofed file rejected.`
        );
      }

      // 2. Compute SHA-256 checksum
      const sha256FileHash = computeSha256(file.buffer);

      // 3. Save to private storage with random server UUID name
      const ext = path.extname(file.originalname);
      const { storageKey } = await savePrivateFile(file.buffer, ext);
      writtenStorageKeys.push(storageKey);

      // 4. Sanitize original filename (remove directory traversals)
      const sanitizedOriginalName = path.basename(file.originalname);

      // 5. Determine document type
      const documentType = (bodyData.documentType || file.fieldname || 'GENERAL_DOCUMENT')
        .toUpperCase()
        .trim();

      // 6. Persist Document record
      const docRecord = await Document.create({
        application: application._id,
        documentType,
        originalName: sanitizedOriginalName,
        storageKey,
        fileSize: file.size,
        mimeType: file.mimetype.toLowerCase(),
        sha256FileHash,
        uploadedBy: user._id,
        uploadStatus: 'STORED',
        verificationStatus: 'PENDING'
      });

      // If document is an infrastructure photo, link or create InfraPhoto record
      if (documentType === 'INFRA_PHOTO') {
        await InfraPhoto.create({
          application: application._id,
          document: docRecord._id,
          photoType: bodyData.photoType || 'CAMPUS_INFRA',
          storageKey
        });
      }

      createdDocuments.push(docRecord);
    }

    // Update total documents count on application
    const totalCount = await Document.countDocuments({
      application: application._id,
      uploadStatus: 'STORED'
    });
    application.totalDocuments = totalCount;
    await application.save();

    await logEvent({
      actorUser: user._id,
      action: 'DOCUMENT_UPLOAD',
      entityType: 'Document',
      entityId: createdDocuments[0]._id,
      application: application._id,
      requestId,
      outcome: 'SUCCESS',
      metadata: { count: createdDocuments.length, docTypes: createdDocuments.map((d) => d.documentType) }
    });

    return createdDocuments;
  } catch (err) {
    // If any error occurs during multi-file processing or DB write, clean up written files immediately
    for (const key of writtenStorageKeys) {
      await deletePrivateFile(key);
    }
    throw err;
  }
}

/**
 * Retrieves safe document metadata with access control
 */
async function getDocumentMetadata(user, documentId) {
  const document = await Document.findById(documentId).populate('application', 'institution status');
  if (!document || document.uploadStatus === 'DELETED') {
    throw ApiError.notFound('Document not found');
  }

  // Ownership verification
  if (user.role === 'INSTITUTION_USER') {
    const userInstId = user.institution?._id || user.institution;
    const appInstId = document.application?.institution;
    if (!userInstId || !appInstId || userInstId.toString() !== appInstId.toString()) {
      throw ApiError.forbidden('Access denied: You do not have permission to view this document.');
    }
  }

  return document;
}

/**
 * Retrieves document and verified physical file path for safe streaming download
 */
async function getDocumentForDownload(user, documentId) {
  const document = await Document.findById(documentId).populate('application', 'institution status');
  if (!document || document.uploadStatus === 'DELETED') {
    throw ApiError.notFound('Document not found');
  }

  // Role and ownership check
  if (user.role === 'INSTITUTION_USER') {
    const userInstId = user.institution?._id || user.institution;
    const appInstId = document.application?.institution;
    if (!userInstId || !appInstId || userInstId.toString() !== appInstId.toString()) {
      throw ApiError.forbidden('Access denied: You do not have permission to download this document.');
    }
  }

  const filePath = getPrivateFilePath(document.storageKey);
  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound('Physical file not found in storage');
  }

  return { document, filePath };
}

/**
 * Executes on-demand OCR on a specific document
 */
async function runDocumentOcr(user, documentId, requestId = null) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw ApiError.notFound('Document not found');
  }

  const ocrResult = await verificationClient.extractDocumentText(document.storageKey, document.documentType);
  if (ocrResult.status === 'SUCCEEDED') {
    document.extractedFields = ocrResult.fields;
    document.extractedText = ocrResult.text;
    document.verificationStatus = 'VERIFIED_AT_SOURCE';
    await document.save();
  }

  return {
    documentId: document._id,
    ocr: ocrResult
  };
}

/**
 * Executes on-demand ELA tamper analysis on a specific document
 */
async function runDocumentEla(user, documentId, requestId = null) {
  const document = await Document.findById(documentId);
  if (!document) {
    throw ApiError.notFound('Document not found');
  }

  const elaResult = await verificationClient.analyzeTampering(document.storageKey);
  if (elaResult.status === 'SUCCEEDED' && elaResult.suspected) {
    await Alert.create({
      application: document.application,
      runId: document.latestCheckRunId || 'standalone_check',
      type: 'TAMPER_SUSPECTED',
      severity: 'CRITICAL',
      title: 'Digital document tampering suspected',
      message: `Error Level Analysis detected pixel inconsistencies in '${document.originalName}'.`,
      sourceModel: 'Document',
      sourceId: document._id,
      status: 'OPEN'
    });
  }

  return {
    documentId: document._id,
    ela: elaResult
  };
}

module.exports = {
  uploadDocuments,
  getDocumentMetadata,
  getDocumentForDownload,
  runDocumentOcr,
  runDocumentEla
};
