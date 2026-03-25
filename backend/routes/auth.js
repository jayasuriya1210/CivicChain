// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Voter = require('../models/Voter');
const jwt = require('jsonwebtoken');
const { voters, sessions, JWT_SECRET, verifyToken, saveVoters } = require('../middleware/auth');
const axios = require('axios');

const QR_SERVICE_URL = (process.env.QR_SERVICE_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Validate and register voter with voter ID
router.post('/register', 
  body('voterId').isLength({ min: 12, max: 12 }).withMessage('Voter ID must be 12 digits'),
  body('walletAddress').optional().isString().withMessage('walletAddress must be a string'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { voterId, walletAddress } = req.body;

      // Validate voter ID format
      if (!Voter.validateVoterId(voterId)) {
        return res.status(400).json({ message: 'Invalid voter ID format. Must be 12 digits.' });
      }

      // Only allow registration for pre-registered voters (persistent list)
      if (!voters[voterId]) {
        return res.status(403).json({ message: 'Registration disabled. Invalid voter ID.' });
      }

      // If already has address, consider already registered
      const existing = voters[voterId];
      if (existing.address && existing.address.toString().trim() !== '') {
        return res.status(400).json({ message: 'Voter already registered' });
      }

      // Assign wallet address and persist
      existing.address = (walletAddress || existing.address || '').toString();
      existing.createdAt = existing.createdAt || new Date();
      try { saveVoters(); } catch (e) { console.warn('Could not save voters:', e.message); }

      const voter = existing;

      // Generate JWT token for session
      const token = jwt.sign({
        voterId: voterId,
        timestamp: Date.now()
      }, JWT_SECRET, { expiresIn: '4h' });

      sessions[voterId] = {
        token: token,
        walletAddress: existing.address || null,
        createdAt: new Date()
      };

      res.json({
        message: 'Voter registered successfully',
        token: token,
        voter: {
          voterId: voter.voterId,
          isVerified: voter.isVerified,
          qrVerified: voter.qrVerified === true,
          hasVoted: voter.hasVoted
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed', error: error.message });
    }
  }
);

// Login with voter ID
router.post('/login',
  body('voterId').isLength({ min: 12, max: 12 }).withMessage('Voter ID must be 12 digits'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { voterId } = req.body;

      // Check if voter exists locally, otherwise try QR module
      if (!voters[voterId]) {
        try {
          const qrResp = await axios.get(`${QR_SERVICE_URL}/voter/${voterId}`, { timeout: 8000 });
          if (qrResp.data && qrResp.data.voter) {
            voters[voterId] = {
              voterId: voterId,
              address: '',
              isVerified: false,
              hasVoted: false,
              qrVerified: false,
              createdAt: qrResp.data.voter.createdAt ? new Date(qrResp.data.voter.createdAt) : new Date()
            };
            try { saveVoters(); } catch (e) { console.warn('Could not save voters:', e.message); }
          }
        } catch (e) {
          // ignore, handled below
        }
      }

      if (!voters[voterId]) {
        return res.status(404).json({ message: 'Voter not found. Please register first.' });
      }

      const voter = voters[voterId];

      // Generate JWT token
      const token = jwt.sign({
        voterId: voterId,
        timestamp: Date.now()
      }, JWT_SECRET, { expiresIn: '4h' });

      sessions[voterId] = {
        token: token,
        walletAddress: voter.address,
        createdAt: new Date()
      };

      res.json({
        message: 'Login successful',
        token: token,
        voter: {
          voterId: voter.voterId,
          isVerified: voter.isVerified,
          qrVerified: voter.qrVerified === true,
          hasVoted: voter.hasVoted
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }
);

// Get voter info
router.get('/voter-info', verifyToken, (req, res) => {
  try {
    const voter = voters[req.user.voterId];
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    res.json({
      voterId: voter.voterId,
      walletAddress: voter.address,
      isVerified: voter.isVerified,
      qrVerified: voter.qrVerified === true,
      hasVoted: voter.hasVoted,
      createdAt: voter.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching voter info', error: error.message });
  }
});

// Logout
router.post('/logout', verifyToken, (req, res) => {
  try {
    delete sessions[req.user.voterId];
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

module.exports = router;
