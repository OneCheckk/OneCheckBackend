const express = require('express');
const findingController = require('../controllers/finding.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// GET /api/findings/:id (Role & ownership check)
router.get('/:id', authenticate, findingController.getFindingById);

module.exports = router;
