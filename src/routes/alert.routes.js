const express = require('express');
const alertController = require('../controllers/alert.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

// Canonical: GET /api/alerts (OFFICER / ADMIN)
router.get(
  '/',
  authenticate,
  authorize('OFFICER', 'ADMIN'),
  alertController.listAlerts
);

// Canonical: PATCH /api/alerts/:id/status (OFFICER / ADMIN)
router.patch(
  '/:id/status',
  authenticate,
  authorize('OFFICER', 'ADMIN'),
  alertController.updateStatus
);

// Spec: POST /api/alerts/:id/ack (OFFICER / ADMIN)
router.post(
  '/:id/ack',
  authenticate,
  authorize('OFFICER', 'SCRUTINY_OFFICER', 'REGIONAL_DIRECTOR', 'ADMIN'),
  alertController.ackAlert
);

module.exports = router;
