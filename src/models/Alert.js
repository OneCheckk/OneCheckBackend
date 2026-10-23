const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application reference is required']
    },
    runId: {
      type: String,
      required: [true, 'Run identifier is required'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Alert type is required'],
      trim: true,
      uppercase: true
    },
    severity: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        message: 'Severity must be LOW, MEDIUM, HIGH, or CRITICAL'
      },
      required: [true, 'Alert severity is required']
    },
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Alert message is required'],
      trim: true
    },
    sourceModel: {
      type: String,
      enum: ['Document', 'FacultyHash', 'InfraPhoto', 'Application'],
      required: [true, 'Source model is required']
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Source identifier is required']
    },
    status: {
      type: String,
      enum: {
        values: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE'],
        message: 'Alert status must be OPEN, ACKNOWLEDGED, RESOLVED, or FALSE_POSITIVE'
      },
      default: 'OPEN'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolutionReason: {
      type: String,
      default: null,
      trim: true
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

alertSchema.index({ application: 1, status: 1, severity: 1 });
alertSchema.index({ application: 1, type: 1, sourceModel: 1, sourceId: 1, status: 1 });

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;
