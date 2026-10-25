const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const institutionRoutes = require('./institution.routes');
const applicationRoutes = require('./application.routes');
const documentRoutes = require('./document.routes');
const facultyRoutes = require('./faculty.routes');
const forensicsRoutes = require('./forensics.routes');
const scoreRoutes = require('./score.routes');
const alertRoutes = require('./alert.routes');
const dashboardRoutes = require('./dashboard.routes');
const claimRoutes = require('./claim.routes');

const router = express.Router();

// All Canonical & Spec REST Endpoints
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/institutions', institutionRoutes);
router.use('/applications', applicationRoutes);
router.use('/documents', documentRoutes);
router.use('/claims', claimRoutes);
router.use('/faculty', facultyRoutes);
router.use('/forensics', forensicsRoutes);
router.use('/score', scoreRoutes);
router.use('/alerts', alertRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
