const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

// Health route: /api/health
router.use('/health', healthRoutes);

// Additional domain routers will be mounted here in subsequent phases:
// router.use('/auth', authRoutes);
// router.use('/institutions', institutionRoutes);
// router.use('/applications', applicationRoutes);
// router.use('/documents', documentRoutes);
// router.use('/faculty', facultyRoutes);
// router.use('/forensics', forensicsRoutes);
// router.use('/score', scoreRoutes);
// router.use('/alerts', alertRoutes);
// router.use('/dashboard', dashboardRoutes);

module.exports = router;
