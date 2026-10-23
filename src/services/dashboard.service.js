const { Application, Alert, Institution, CheckRun } = require('../models');

/**
 * Aggregates dashboard compliance metrics directly from persisted database state
 */
async function getDashboardSummary(user) {
  // 1. Applications by status
  const statusCountsRaw = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const applicationsByStatus = {
    DRAFT: 0,
    SUBMITTED: 0,
    UNDER_SCRUTINY: 0,
    DEFICIENCY_RAISED: 0,
    VERIFIED: 0,
    APPROVED: 0,
    REJECTED: 0
  };
  for (const item of statusCountsRaw) {
    if (item._id && applicationsByStatus[item._id] !== undefined) {
      applicationsByStatus[item._id] = item.count;
    }
  }

  // 2. Applications by risk level
  const riskCountsRaw = await Application.aggregate([
    { $match: { riskLevel: { $ne: null } } },
    { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
  ]);
  const applicationsByRiskLevel = {
    GREEN: 0,
    YELLOW: 0,
    RED: 0
  };
  for (const item of riskCountsRaw) {
    if (item._id && applicationsByRiskLevel[item._id] !== undefined) {
      applicationsByRiskLevel[item._id] = item.count;
    }
  }

  // 3. Open alerts by severity
  const alertCountsRaw = await Alert.aggregate([
    { $match: { status: 'OPEN' } },
    { $group: { _id: '$severity', count: { $sum: 1 } } }
  ]);
  const openAlertsBySeverity = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
    CRITICAL: 0
  };
  for (const item of alertCountsRaw) {
    if (item._id && openAlertsBySeverity[item._id] !== undefined) {
      openAlertsBySeverity[item._id] = item.count;
    }
  }

  // 4. Total institutions and applications count
  const totalInstitutions = await Institution.countDocuments();
  const totalApplications = await Application.countDocuments();

  // 5. Recent check runs
  const recentRuns = await CheckRun.find()
    .select('runId application status startedAt completedAt')
    .populate('application', 'applicationNumber')
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    overview: {
      totalInstitutions,
      totalApplications,
      totalOpenAlerts: Object.values(openAlertsBySeverity).reduce((a, b) => a + b, 0)
    },
    applicationsByStatus,
    applicationsByRiskLevel,
    openAlertsBySeverity,
    recentRuns
  };
}

module.exports = {
  getDashboardSummary
};
