const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const institutionRoutes = require('./institution.routes');
const applicationRoutes = require('./application.routes');
const documentRoutes = require('./document.routes');

const router = express.Router();

// Canonical API mounts
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/institutions', institutionRoutes);
router.use('/applications', applicationRoutes);
router.use('/documents', documentRoutes);

// Additional domain routers will be mounted in subsequent phases:
// router.use('/faculty', facultyRoutes);
// router.use('/forensics', forensicsRoutes);
// router.use('/score', scoreRoutes);
// router.use('/alerts', alertRoutes);
// router.use('/dashboard', dashboardRoutes);

module.exports = router;
