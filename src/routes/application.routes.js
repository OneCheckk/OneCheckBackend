const express = require('express');
const applicationController = require('../controllers/application.controller');
const checkRunController = require('../controllers/checkRun.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const validate = require('../middleware/validate');
const {
  validateCreateApplication,
  validatePatchApplication
} = require('../validators/application.validator');

const router = express.Router();

// Canonical: POST /api/applications (INSTITUTION_USER / ADMIN)
router.post(
  '/',
  authenticate,
  authorize('INSTITUTION_USER', 'ADMIN'),
  validate(validateCreateApplication),
  applicationController.createApplication
);

// Canonical: GET /api/applications (OFFICER / ADMIN; institution user sees own)
router.get('/', authenticate, applicationController.listApplications);

// Canonical: GET /api/applications/:id (Role + ownership check)
router.get('/:id', authenticate, applicationController.getApplicationById);

// Canonical: PATCH /api/applications/:id (Owner before submission / authorized officer)
router.patch(
  '/:id',
  authenticate,
  validate(validatePatchApplication),
  applicationController.patchApplication
);

// Canonical: POST /api/applications/:id/submit (Institution owner / ADMIN)
router.post(
  '/:id/submit',
  authenticate,
  authorize('INSTITUTION_USER', 'INSTITUTION', 'ADMIN'),
  applicationController.submitApplication
);

// Spec: POST /api/applications/:id/documents (INSTITUTION)
const { upload } = require('../config/upload');
const documentController = require('../controllers/document.controller');
router.post(
  '/:id/documents',
  authenticate,
  authorize('INSTITUTION_USER', 'INSTITUTION', 'ADMIN'),
  upload.any(),
  documentController.uploadSpec
);

// Spec: GET /api/applications/:id/documents (scoped)
router.get(
  '/:id/documents',
  authenticate,
  documentController.listDocuments
);

// Spec: GET /api/applications/:id/claims (scoped)
const claimController = require('../controllers/claim.controller');
router.get(
  '/:id/claims',
  authenticate,
  claimController.getClaimsByApplication
);

// Canonical: POST /api/applications/:id/run-checks (OFFICER / ADMIN)
router.post(
  '/:id/run-checks',
  authenticate,
  authorize('OFFICER', 'ADMIN'),
  checkRunController.startChecks
);

// Canonical: GET /api/applications/:id/runs/:runId (Role + ownership check)
router.get('/:id/runs/:runId', authenticate, checkRunController.getRunStatus);

module.exports = router;
