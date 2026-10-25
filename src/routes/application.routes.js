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

// Spec: GET /api/applications/:id/checklist (scoped)
const checklistController = require('../controllers/checklist.controller');
router.get(
  '/:id/checklist',
  authenticate,
  checklistController.getChecklist
);

// Spec: POST /api/applications/:id/self-check (INSTITUTION / ADMIN)
router.post(
  '/:id/self-check',
  authenticate,
  authorize('INSTITUTION_USER', 'INSTITUTION', 'ADMIN'),
  checklistController.runSelfCheck
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

// Spec: GET /api/applications/:id/findings (scoped)
const findingController = require('../controllers/finding.controller');
router.get(
  '/:id/findings',
  authenticate,
  findingController.getFindingsByApplication
);

// Spec: POST /api/applications/:id/reconcile (INSTITUTION / OFFICER / ADMIN)
router.post(
  '/:id/reconcile',
  authenticate,
  authorize('INSTITUTION_USER', 'INSTITUTION', 'OFFICER', 'SCRUTINY_OFFICER', 'REGIONAL_DIRECTOR', 'ADMIN'),
  findingController.triggerReconcile
);

// Spec: GET /api/applications/:id/ledger (scoped)
const ledgerController = require('../controllers/ledger.controller');
router.get(
  '/:id/ledger',
  authenticate,
  ledgerController.getLedgerByApplication
);

// Spec: POST /api/applications/:id/decision (OFFICER / REGIONAL_DIRECTOR / ADMIN)
const { recordDecision } = require('../services/decision.service');
router.post(
  '/:id/decision',
  authenticate,
  authorize('OFFICER', 'SCRUTINY_OFFICER', 'REGIONAL_DIRECTOR', 'ADMIN'),
  async (req, res, next) => {
    try {
      const { outcome, reason } = req.body;
      const app = await recordDecision(req.user, req.params.id, { outcome, reason }, req.requestId);
      res.status(200).json({
        success: true,
        message: 'Decision recorded successfully',
        data: app
      });
    } catch (err) {
      next(err);
    }
  }
);

// Spec: POST & GET /api/applications/:id/letters
const letterController = require('../controllers/letter.controller');
router.post(
  '/:id/letters',
  authenticate,
  authorize('OFFICER', 'SCRUTINY_OFFICER', 'REGIONAL_DIRECTOR', 'ADMIN'),
  letterController.createLetter
);

router.get(
  '/:id/letters',
  authenticate,
  letterController.getLetters
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
