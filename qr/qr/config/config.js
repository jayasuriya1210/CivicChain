/**
 * Configuration file with environment variables and constants
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || 'localhost',
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/voting-system',
    useMemoryDB: process.env.USE_MEMORY_DB === 'true'
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production',
    expiry: process.env.TOKEN_EXPIRY || '24h'
  },

  // Voting Token Configuration
  votingToken: {
    secret: process.env.VOTING_SECRET || 'your-voting-secret-key-change-in-production',
    expiry: process.env.VOTING_TOKEN_EXPIRY || '10m'
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-key-change-in-production'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },

  // Feature Flags
  features: {
    realTimeNotifications: process.env.ENABLE_REAL_TIME_NOTIFICATIONS === 'true',
    socketIO: process.env.ENABLE_SOCKET_IO === 'true'
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // QR Code Configuration
  qrCode: {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'H'
  },

  // Admin Configuration
  admin: {
    defaultUsername: process.env.ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_PASSWORD || 'admin123'
  }
};

module.exports = config;
