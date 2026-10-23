const asyncHandler = require('../utils/asyncHandler');
const { runGeofenceCheck } = require('../services/forensics.service');
const { Application } = require('../models');
const ApiError = require('../utils/ApiError');

const runGeoCheck = asyncHandler(async (req, res) => {
  const requestId = res.locals.requestId || req.id;
  const application = await Application.findById(req.params.appId);
  if (!application) {
    throw ApiError.notFound('Application not found');
  }

  const result = await runGeofenceCheck(
    application._id,
    application.institution,
    `manual_geo_check_${Date.now()}`
  );

  res.status(200).json({
    success: true,
    data: result,
    meta: {
      requestId
    }
  });
});

module.exports = {
  runGeoCheck
};
