const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const VOTING_SECRET = process.env.VOTING_SECRET || 'your-voting-secret-key-change-in-production';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';
const VOTING_TOKEN_EXPIRY = process.env.VOTING_TOKEN_EXPIRY || '10m';

/**
 * Generate QR verification token for voter
 */
const generateQRToken = (voter) => {
  try {
    const token = jwt.sign(
      {
        voterId: voter.voterId,
        constituency: voter.constituency,
        boothId: voter.boothId,
        name: voter.name,
        type: 'voter-verification'
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );
    return token;
  } catch (error) {
    console.error('Error generating QR token:', error);
    throw error;
  }
};

/**
 * Generate voting rights token after admin verification
 */
const generateVotingToken = (session) => {
  try {
    const token = jwt.sign(
      {
        sessionId: session.sessionId,
        voterId: session.voterId,
        constituency: session.voterDetails.constituency,
        boothId: session.boothId,
        type: 'voting-rights'
      },
      VOTING_SECRET,
      { expiresIn: VOTING_TOKEN_EXPIRY }
    );
    return token;
  } catch (error) {
    console.error('Error generating voting token:', error);
    throw error;
  }
};

/**
 * Verify QR token
 */
const verifyQRToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying QR token:', error.message);
    throw new Error('Invalid or expired QR code');
  }
};

/**
 * Verify voting token
 */
const verifyVotingToken = (token) => {
  try {
    const decoded = jwt.verify(token, VOTING_SECRET);
    return decoded;
  } catch (error) {
    console.error('Error verifying voting token:', error.message);
    throw new Error('Invalid or expired voting token');
  }
};

/**
 * Decode token without verification (use with caution)
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateQRToken,
  generateVotingToken,
  verifyQRToken,
  verifyVotingToken,
  decodeToken,
  JWT_SECRET,
  VOTING_SECRET
};
