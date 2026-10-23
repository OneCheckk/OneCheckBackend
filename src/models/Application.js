const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      required: [true, 'Application number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution reference is required']
    },
    category: {
      type: String,
      required: [true, 'Application category is required'],
      trim: true
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      trim: true
    },
    status: {
      type: String,
      enum: {
        values: [
          'DRAFT',
          'SUBMITTED',
          'UNDER_SCRUTINY',
          'DEFICIENCY_RAISED',
          'VERIFIED',
          'APPROVED',
          'REJECTED'
        ],
        message: 'Invalid application status value'
      },
      default: 'DRAFT'
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    riskScore: {
      type: Number,
      min: [0, 'Risk score cannot be less than 0'],
      max: [100, 'Risk score cannot be greater than 100'],
      default: null
    },
    riskLevel: {
      type: String,
      enum: ['GREEN', 'YELLOW', 'RED'],
      default: null
    },
    totalDocuments: {
      type: Number,
      default: 0,
      min: 0
    },
    flaggedDocuments: {
      type: Number,
      default: 0,
      min: 0
    },
    currentRunId: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound and single query indexes
applicationSchema.index({ status: 1 });
applicationSchema.index({ riskLevel: 1 });
applicationSchema.index({ assignedOfficer: 1 });
applicationSchema.index({ institution: 1 });
applicationSchema.index({ createdAt: -1 });

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
