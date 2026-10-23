const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const requiredKeys = ['JWT_SECRET', 'HMAC_SECRET'];

const missing = requiredKeys.filter((key) => !process.env[key]);
if (missing.length > 0 && process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.warn(`[Config Warning] Missing recommended environment variables: ${missing.join(', ')}`);
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onecheck',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_dev_secret_never_use_in_production_key_12345',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  VERIFICATION_SERVICE_URL: process.env.VERIFICATION_SERVICE_URL || 'http://127.0.0.1:8000',
  VERIFICATION_TIMEOUT_MS: parseInt(process.env.VERIFICATION_TIMEOUT_MS, 10) || 15000,
  UPLOAD_DIR: process.env.UPLOAD_DIR || './private_uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 15,
  MAX_FILES_PER_REQUEST: parseInt(process.env.MAX_FILES_PER_REQUEST, 10) || 10,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:5173'],
  HMAC_SECRET: process.env.HMAC_SECRET || 'fallback_hmac_secret_for_local_testing_key_12345',
  HMAC_KEY_VERSION: process.env.HMAC_KEY_VERSION || 'v1',
  MOCK_VERIFICATION_SERVICE: process.env.MOCK_VERIFICATION_SERVICE === 'true' || process.env.NODE_ENV === 'test'
};

module.exports = env;
