/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const VOTING_SECRET = process.env.VOTING_SECRET || 'your-voting-secret-key';

/**
 * Verify QR Code Token (for verification endpoints)
 */
const verifyQRToken = (req, res, next) => {
  try {
    const token = req.params.token || req.body.token;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.voter = decoded;
    next();
  } catch (error) {
    console.error('Invalid QR token:', error);
    res.status(401).json({ error: 'Invalid or expired QR code' });
  }
};

/**
 * Verify Voting Token (for voting endpoints)
 */
const verifyVotingToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const decoded = jwt.verify(token, VOTING_SECRET);
    req.session = decoded;
    next();
  } catch (error) {
    console.error('Invalid voting token:', error);
    res.status(401).json({ error: 'Invalid or expired voting token' });
  }
};

/**
 * Check if user is admin
 */
const checkAdmin = (req, res, next) => {
  try {
    const adminToken = req.cookies.adminToken || req.body.adminToken;

    if (!adminToken) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const decoded = jwt.verify(adminToken, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Invalid admin token:', error);
    res.status(401).json({ error: 'Invalid or expired admin token' });
  }
};

module.exports = {
  verifyQRToken,
  verifyVotingToken,
  checkAdmin
};
