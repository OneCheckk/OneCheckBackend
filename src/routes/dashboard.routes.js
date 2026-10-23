const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// Canonical: GET /api/dashboard/summary (OFFICER / ADMIN)
router.get(
  '/summary',
  authenticate,
  authorize('OFFICER', 'ADMIN'),
  dashboardController.getSummary
);

module.exports = router;
