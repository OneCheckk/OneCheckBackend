const asyncHandler = require('../utils/asyncHandler');
const { computeRiskScore } = require('../services/score.service');
const { Application } = require('../models');
const ApiError = require('../utils/ApiError');

const computeScore = asyncHandler(async (req, res) => {
  const requestId = res.locals.requestId || req.id;
  const application = await Application.findById(req.params.appId);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  const score = await computeRiskScore(
    application._id,
    `manual_score_${Date.now()}`
  );

  res.status(200).json({
    success: true,
    data: { score },
    meta: {
      requestId
    }
  });
});

module.exports = {
  computeScore
};
