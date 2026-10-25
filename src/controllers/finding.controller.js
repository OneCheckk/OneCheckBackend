/**
 * Finding Controller
 * Handles retrieval of regulatory findings and manual reconciliation triggers
 */

const { Finding, Application } = require('../models');
const { reconcileApplication } = require('../services/reconciliation.service');
const ApiError = require('../utils/ApiError');

async function getFindingsByApplication(req, res, next) {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      throw ApiError.notFound('Application not found');
    }

    if (req.user.role === 'INSTITUTION' || req.user.role === 'INSTITUTION_USER') {
      const userInstId = req.user.institutionId || req.user.institution?._id || req.user.institution;
      const appInstId = application.institutionId || application.institution?._id || application.institution;
      if (!userInstId || !appInstId || userInstId.toString() !== appInstId.toString()) {
        throw ApiError.forbidden('Access denied: You cannot view findings for another institution.');
      }
    }

    const query = { applicationId: application._id };
    if (req.query.status) query.status = req.query.status;
    if (req.query.severity) query.severity = req.query.severity.toUpperCase();

    const findings = await Finding.find(query).sort({ severity: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: findings
    });
  } catch (err) {
    next(err);
  }
}

async function getFindingById(req, res, next) {
  try {
    const finding = await Finding.findById(req.params.id);
    if (!finding) {
      throw ApiError.notFound('Finding not found');
    }

    const application = await Application.findById(finding.applicationId);
    if (application && (req.user.role === 'INSTITUTION' || req.user.role === 'INSTITUTION_USER')) {
      const userInstId = req.user.institutionId || req.user.institution?._id || req.user.institution;
      const appInstId = application.institutionId || application.institution?._id || application.institution;
      if (!userInstId || !appInstId || userInstId.toString() !== appInstId.toString()) {
        throw ApiError.forbidden('Access denied');
      }
    }

    res.status(200).json({
      success: true,
      data: finding
    });
  } catch (err) {
    next(err);
  }
}

async function triggerReconcile(req, res, next) {
  try {
    const result = await reconcileApplication(req.params.id, req.user, req.requestId);
    res.status(200).json({
      success: true,
      message: 'Application reconciled successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getFindingsByApplication,
  getFindingById,
  triggerReconcile
};
