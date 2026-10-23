const express = require('express');
const documentController = require('../controllers/document.controller');
const authenticate = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { upload } = require('../config/upload');

const router = express.Router();

// Canonical: POST /api/documents/:appId/upload (Institution owner / ADMIN)
router.post(
  '/:appId/upload',
  authenticate,
  authorize('INSTITUTION_USER', 'ADMIN'),
  upload.any(),
  documentController.upload
);

// Canonical: GET /api/documents/:docId (Authorized user)
router.get('/:docId', authenticate, documentController.getMetadata);

// Canonical: GET /api/documents/:docId/download (Authorized user)
router.get('/:docId/download', authenticate, documentController.download);

module.exports = router;
