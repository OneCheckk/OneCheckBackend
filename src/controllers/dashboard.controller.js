const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboard.service');

const getSummary = asyncHandler(async (req, res) => {
  const requestId = res.locals.requestId || req.id;
  const summary = await dashboardService.getDashboardSummary(req.user);

  res.status(200).json({
    success: true,
    data: summary,
    meta: {
      requestId
    }
  });
});

module.exports = {
  getSummary
};
