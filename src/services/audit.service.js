const { AuditLog } = require('../models');
const logger = require('../config/logger');

const SENSITIVE_FIELDS = ['password', 'token', 'jwt', 'aadhaar', 'pan', 'extractedText', 'secret'];

/**
 * Sanitizes metadata object to prevent any sensitive fields in audit log
 */
function sanitizeAuditMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((s) => lowerKey.includes(s))) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      clean[key] = sanitizeAuditMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Appends an audit event to the append-only AuditLog collection
 */
async function logEvent({
  actorUser = null,
  action,
  entityType,
  entityId = null,
  application = null,
  requestId = null,
  outcome = 'SUCCESS',
  metadata = {}
}) {
  try {
    const cleanMeta = sanitizeAuditMetadata(metadata);
    const auditRecord = await AuditLog.create({
      actorUser: actorUser?._id || actorUser || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      application: application?._id || application || null,
      requestId,
      outcome,
      metadata: cleanMeta
    });
    return auditRecord;
  } catch (err) {
    // Audit log failure should be logged privately but not crash primary business transaction
    logger.error('Failed to persist audit log record', {
      action,
      entityType,
      error: err.message,
      suppressInTest: process.env.NODE_ENV === 'test'
    });
    return null;
  }
}

module.exports = {
  logEvent,
  sanitizeAuditMetadata
};
