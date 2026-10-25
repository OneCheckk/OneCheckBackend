/**
 * Claim Service
 * Manages extracted claims, confidence confirmation, corrections, and scoping
 */

const { Claim, Application } = require('../models');
const ApiError = require('../utils/ApiError');
const { logEvent } = require('./audit.service');

/**
 * Retrieves claims for an application with access control and filtering
 */
async function getClaims(user, applicationId, filters = {}) {
  const application = await Application.findById(applicationId);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  // Ownership verification for institution user
  if (user.role === 'INSTITUTION' || user.role === 'INSTITUTION_USER') {
    const userInstId = user.institutionId || user.institution?._id || user.institution;
    const appInstId = application.institutionId || application.institution?._id || application.institution;
    if (!userInstId || !appInstId || userInstId.toString() !== appInstId.toString()) {
      throw ApiError.forbidden('Access denied: You cannot view claims for another institution.');
    }
  }

  const query = { applicationId: application._id };

  if (filters.predicate) {
    query.predicate = filters.predicate;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.docId) {
    query['source.docId'] = filters.docId;
  }

  return Claim.find(query).sort({ createdAt: -1 });
}

/**
 * Confirms a claim (e.g. for low-confidence claims needing manual verification)
 */
async function confirmClaim(user, claimId, requestId = null) {
  const claim = await Claim.findOne({ claimId });
  if (!claim) {
    throw ApiError.notFound(`Claim '${claimId}' not found`);
  }

  const application = await Application.findById(claim.applicationId);
  if (!application) {
    throw ApiError.notFound('Associated application not found');
  }

  // Ownership check
  if (user.role === 'INSTITUTION' || user.role === 'INSTITUTION_USER') {
    const userInstId = user.institutionId || user.institution?._id || user.institution;
    const appInstId = application.institutionId || application.institution?._id || application.institution;
    if (!userInstId || !appInstId || userInstId.toString() !== appInstId.toString()) {
      throw ApiError.forbidden('Access denied: You cannot confirm claims for another institution.');
    }
  }

  const previousStatus = claim.status;
  claim.status = 'CONFIRMED';
  await claim.save();

  await logEvent({
    actorUser: user._id,
    action: 'CLAIM_CONFIRMED',
    entityType: 'Claim',
    entityId: claim._id,
    application: application._id,
    requestId,
    outcome: 'SUCCESS',
    metadata: {
      claimId: claim.claimId,
      predicate: claim.predicate,
      previousStatus,
      newStatus: 'CONFIRMED'
    }
  });

  return claim;
}

/**
 * Corrects a claim's extracted value with audit trail
 */
async function correctClaim(user, claimId, { newValue, reason }, requestId = null) {
  if (newValue === undefined || newValue === null) {
    throw ApiError.badRequest('newValue is required for claim correction');
  }

  if (!reason || reason.trim().length < 5) {
    throw ApiError.badRequest('Correction reason must be at least 5 characters');
  }

  const claim = await Claim.findOne({ claimId });
  if (!claim) {
    throw ApiError.notFound(`Claim '${claimId}' not found`);
  }

  const application = await Application.findById(claim.applicationId);
  if (!application) {
    throw ApiError.notFound('Associated application not found');
  }

  // Scoping check
  if (user.role === 'INSTITUTION' || user.role === 'INSTITUTION_USER') {
    const userInstId = user.institutionId || user.institution?._id || user.institution;
    const appInstId = application.institutionId || application.institution?._id || application.institution;
    if (!userInstId || !appInstId || userInstId.toString() !== appInstId.toString()) {
      throw ApiError.forbidden('Access denied: You cannot correct claims for another institution.');
    }
  }

  const oldValue = claim.value;
  claim.previousValue = oldValue;
  claim.value = newValue;
  claim.status = 'CORRECTED';
  claim.correctedBy = user._id;
  claim.correctionReason = reason.trim();
  claim.version = (claim.version || 1) + 1;

  await claim.save();

  await logEvent({
    actorUser: user._id,
    action: 'CLAIM_CORRECTED',
    entityType: 'Claim',
    entityId: claim._id,
    application: application._id,
    requestId,
    outcome: 'SUCCESS',
    metadata: {
      claimId: claim.claimId,
      predicate: claim.predicate,
      oldValue,
      newValue,
      reason: claim.correctionReason,
      version: claim.version
    }
  });

  return claim;
}

module.exports = {
  getClaims,
  confirmClaim,
  correctClaim
};
