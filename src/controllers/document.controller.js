const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const documentService = require('../services/document.service');
const ApiError = require('../utils/ApiError');

const upload = asyncHandler(async (req, res) => {
  const requestId = res.locals.requestId || req.id;
  const files = req.files || (req.file ? [req.file] : []);

  if (files.length === 0) {
    throw ApiError.badRequest('No files found in upload payload. Attach file using form-data.');
  }

  const documents = await documentService.uploadDocuments(
    req.user,
    req.params.appId,
    files,
    req.body,
    requestId
  );

  res.status(201).json({
    success: true,
    data: { documents },
    meta: {
      requestId
    }
  });
});

const getMetadata = asyncHandler(async (req, res) => {
  const requestId = res.locals.requestId || req.id;
  const document = await documentService.getDocumentMetadata(req.user, req.params.docId);

  res.status(200).json({
    success: true,
    data: { document },
    meta: {
      requestId
    }
  });
});

const download = asyncHandler(async (req, res) => {
  const { document, filePath } = await documentService.getDocumentForDownload(
    req.user,
    req.params.docId
  );

  // Set safe headers
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(document.originalName)}"`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
});

const runOcr = asyncHandler(async (req, res) => {
  const requestId = res.locals.requestId || req.id;
  const result = await documentService.runDocumentOcr(req.user, req.params.docId, requestId);

  res.status(200).json({
    success: true,
    data: result,
    meta: {
      requestId
    }
  });
});

const runEla = asyncHandler(async (req, res) => {
  const requestId = res.locals.requestId || req.id;
  const result = await documentService.runDocumentEla(req.user, req.params.docId, requestId);

  res.status(200).json({
    success: true,
    data: result,
    meta: {
      requestId
    }
  });
});

module.exports = {
  upload,
  getMetadata,
  download,
  runOcr,
  runEla
};
