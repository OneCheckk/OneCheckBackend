const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application reference is required']
    },
    documentType: {
      type: String,
      required: [true, 'Document type is required'],
      trim: true,
      uppercase: true
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storageKey: {
      type: String,
      required: [true, 'Storage key is required'],
      unique: true,
      trim: true
    },
    fileSize: {
      type: Number,
      required: [true, 'File size in bytes is required'],
      min: [1, 'File size must be greater than 0']
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true
    },
    sha256FileHash: {
      type: String,
      required: [true, 'SHA-256 file checksum is required'],
      trim: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader user reference is required']
    },
    uploadStatus: {
      type: String,
      enum: ['UPLOADING', 'STORED', 'REJECTED', 'DELETED'],
      default: 'STORED'
    },
    verificationStatus: {
      type: String,
      enum: [
        'PENDING',
        'VERIFIED_AT_SOURCE',
        'MISMATCH_DETECTED',
        'EXPIRED',
        'UNAVAILABLE',
        'MANUAL_REVIEW'
      ],
      default: 'PENDING'
    },
    extractedFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    extractedText: {
      type: String,
      select: false, // Omit raw text from standard list responses
      default: null
    },
    expiryDate: {
      type: Date,
      default: null
    },
    isExpired: {
      type: Boolean,
      default: false
    },
    latestCheckRunId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.extractedText; // Never expose sensitive full text in DTOs
        delete ret.__v;
        return ret;
      }
    }
  }
);

documentSchema.index({ application: 1, documentType: 1 });

const Document = mongoose.model('Document', documentSchema);

module.exports = Document;
