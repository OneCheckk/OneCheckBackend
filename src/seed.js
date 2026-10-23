const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./config/database');
const { User, Institution, Application } = require('./models');
const logger = require('./config/logger');

async function seedDatabase(uri) {
  try {
    await connectDB(uri);
    logger.info('Starting database seeding...');

    // 1. Seed Users (passwords hashed via User.hashPassword)
    const adminPassword = await User.hashPassword('Admin@123456');
    const officerPassword = await User.hashPassword('Officer@123456');
    const institutionUserPassword = await User.hashPassword('Institution@123456');

    let admin = await User.findOne({ email: 'admin@onecheck.gov.in' });
    if (!admin) {
      admin = await User.create({
        name: 'System Administrator',
        email: 'admin@onecheck.gov.in',
        passwordHash: adminPassword,
        role: 'ADMIN',
        isActive: true
      });
      logger.info('Created seed ADMIN user');
    }

    let officer = await User.findOne({ email: 'officer@onecheck.gov.in' });
    if (!officer) {
      officer = await User.create({
        name: 'Senior Scrutiny Officer',
        email: 'officer@onecheck.gov.in',
        passwordHash: officerPassword,
        role: 'OFFICER',
        isActive: true
      });
      logger.info('Created seed OFFICER user');
    }

    let institutionUser = await User.findOne({ email: 'director@apex-tech.edu.in' });
    if (!institutionUser) {
      institutionUser = await User.create({
        name: 'Dr. Ramesh Sharma',
        email: 'director@apex-tech.edu.in',
        passwordHash: institutionUserPassword,
        role: 'INSTITUTION_USER',
        isActive: true
      });
      logger.info('Created seed INSTITUTION_USER');
    }

    // 2. Seed Institution
    let institution = await Institution.findOne({ registrationId: 'AICTE-DEL-2026-01' });
    if (!institution) {
      institution = await Institution.create({
        name: 'Apex Institute of Technology',
        registrationId: 'AICTE-DEL-2026-01',
        address: 'Sector 62, Institutional Area, Noida',
        state: 'Uttar Pradesh',
        latitude: 28.628,
        longitude: 77.3649,
        verificationStatus: 'VERIFIED',
        createdBy: institutionUser._id
      });
      logger.info('Created seed Institution: Apex Institute of Technology');
    }

    // Link institution to user if not linked
    if (!institutionUser.institution) {
      institutionUser.institution = institution._id;
      await institutionUser.save();
    }

    // 3. Seed Application
    let app = await Application.findOne({ applicationNumber: 'APP-2026-000101' });
    if (!app) {
      app = await Application.create({
        applicationNumber: 'APP-2026-000101',
        institution: institution._id,
        category: 'EXTENSION_OF_APPROVAL',
        academicYear: '2026-2027',
        status: 'SUBMITTED',
        assignedOfficer: officer._id,
        riskScore: 82,
        riskLevel: 'GREEN',
        totalDocuments: 4,
        flaggedDocuments: 0
      });
      logger.info('Created seed Application: APP-2026-000101');
    }

    logger.info('Database seeding completed successfully.');
    return { admin, officer, institutionUser, institution, app };
  } catch (error) {
    logger.error('Seeding failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

if (require.main === module) {
  seedDatabase()
    .then(() => disconnectDB())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDatabase };
