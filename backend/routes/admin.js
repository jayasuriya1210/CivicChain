// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { adminAuth, JWT_SECRET } = require('../middleware/auth');
const axios = require('axios');

const QR_SERVICE_URL = (process.env.QR_SERVICE_URL || 'http://localhost:3000').replace(/\/+$/, '');

// Admin credentials (in production, use a database)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'admin@123', 10);

// Persistent candidate storage
const dataDir = path.join(__dirname, '..', 'data');
const candidatesFile = path.join(dataDir, 'candidates.json');
let candidates = [];

// Load candidates from file
function loadCandidates() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(candidatesFile)) {
      const raw = fs.readFileSync(candidatesFile, 'utf8');
      candidates = JSON.parse(raw || '[]');
      console.log(`Loaded ${candidates.length} candidates from disk`);
    } else {
      candidates = [];
      fs.writeFileSync(candidatesFile, JSON.stringify([], null, 2));
    }
  } catch (err) {
    console.error('Error loading candidates:', err.message);
    candidates = [];
  }
}

function saveCandidates() {
  try {
    console.log(`[DEBUG] saveCandidates called. Candidates count: ${candidates.length}`);
    console.log(`[DEBUG] Writing to file: ${candidatesFile}`);
    fs.writeFileSync(candidatesFile, JSON.stringify(candidates, null, 2));
    console.log(`[DEBUG] Successfully saved candidates to file`);
  } catch (err) {
    console.error('Error saving candidates:', err.message);
  }
}

// Load candidates on startup
loadCandidates();

// Make candidates and saveCandidates available to other routes
router.getCandidates = () => candidates;
router.saveCandidates = saveCandidates;

// Admin login
router.post('/login',
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      // Verify admin credentials
      if (username !== ADMIN_USERNAME) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate admin token
      const token = jwt.sign({
        username: username,
        isAdmin: true,
        loginTime: Date.now()
      }, JWT_SECRET, { expiresIn: '8h' });

      res.json({
        message: 'Admin login successful',
        token: token,
        admin: {
          username: username
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  }
);

// Debug: verify a token payload (unprotected helper for debugging tokens)
router.post('/verify-token', (req, res) => {
  try {
    const token = req.body && req.body.token;
    if (!token) return res.status(400).json({ message: 'Token is required in body as { token: "..." }' });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return res.json({ valid: true, decoded });
    } catch (err) {
      return res.status(401).json({ valid: false, message: 'Invalid token', error: err.message });
    }
  } catch (error) {
    console.error('Error in /verify-token:', error.message);
    res.status(500).json({ message: 'Internal error', error: error.message });
  }
});

// Get all candidates (for debugging and admin dashboard)
router.get('/candidates', adminAuth, (req, res) => {
  try {
    loadCandidates();
    console.log(`Admin fetching ${candidates.length} candidates`);
    res.json({
      candidates: candidates,
      total: candidates.length,
      dataFile: candidatesFile
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ message: 'Error fetching candidates', error: error.message });
  }
});

// Add candidate
router.post('/add-candidate', adminAuth,
  body('name').trim().notEmpty().withMessage('Candidate name is required'),
  body('party').trim().notEmpty().withMessage('Party name is required'),
  body('symbol').trim().optional(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, party, symbol } = req.body;

      // Create and store candidate locally
      const candidateData = {
        id: Date.now(),
        name: name,
        party: party,
        symbol: symbol || '●',
        voteCount: 0,
        createdAt: new Date(),
        createdBy: req.user?.username || 'admin'
      };

      candidates.push(candidateData);
      saveCandidates();
      console.log(`✓ Candidate added: ${name} (${party})`);

      // Broadcast new candidate to all connected clients
      if (global.broadcastUpdate) {
        global.broadcastUpdate('candidate-added', candidateData);
      }

      res.json({
        message: 'Candidate added successfully',
        candidate: candidateData
      });
    } catch (error) {
      console.error('Error adding candidate:', error);
      res.status(500).json({ message: 'Error adding candidate', error: error.message });
    }
  }
);

// Set voting schedule
router.post('/set-voting-schedule', adminAuth,
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('endTime').isISO8601().withMessage('Valid end time required'),
  body('title').trim().notEmpty().withMessage('Election title is required'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { startTime, endTime, title } = req.body;
      const start = new Date(startTime).getTime() / 1000;
      const end = new Date(endTime).getTime() / 1000;

      if (start >= end) {
        return res.status(400).json({ message: 'Start time must be before end time' });
      }

      console.log('Admin user for schedule:', req.user);
      const scheduleData = {
        title: title,
        startTime: startTime,
        endTime: endTime,
        startTimestamp: start,
        endTimestamp: end,
        createdAt: new Date(),
        createdBy: req.user?.username || 'admin'
      };

      res.json({
        message: 'Voting schedule set successfully',
        schedule: scheduleData
      });
    } catch (error) {
      console.error('Error setting voting schedule:', error);
      res.status(500).json({ message: 'Error setting schedule', error: error.message });
    }
  }
);

// Get voting results (admin)
router.get('/results', adminAuth, async (req, res) => {
  try {
    loadCandidates();
    const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
    const sortedCandidates = [...candidates]
      .map((c) => ({
        id: c.id,
        name: c.name,
        party: c.party,
        symbol: c.symbol,
        voteCount: c.voteCount || 0
      }))
      .sort((a, b) => b.voteCount - a.voteCount);

    const results = {
      totalVotes: totalVotes,
      candidates: sortedCandidates,
      statistics: {
        totalVoters: 0,
        verifiedVoters: 0,
        votedVoters: 0,
        votingPercentage: 0
      },
      generatedAt: new Date()
    };

    res.json({
      message: 'Results retrieved successfully',
      ...results
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Error fetching results', error: error.message });
  }
});

// End voting
router.post('/end-voting', adminAuth, async (req, res) => {
  try {
    console.log('Admin user for end-voting:', req.user);
    res.json({
      message: 'Voting ended successfully',
      endedAt: new Date(),
      endedBy: req.user?.username || 'admin'
    });
  } catch (error) {
    console.error('Error ending voting:', error);
    res.status(500).json({ message: 'Error ending voting', error: error.message });
  }
});

// Reset voting (clear all votes)
router.post('/reset-voting', adminAuth, async (req, res) => {
  try {
    console.log('Resetting voting data...');

    candidates = candidates.map((c) => ({
      ...c,
      voteCount: 0
    }));

    fs.writeFileSync(candidatesFile, JSON.stringify(candidates, null, 2));
    console.log('Candidates reset');

    const votersFile = path.join(__dirname, '..', 'data', 'voters.json');
    let resetVotersCount = 0;
    if (fs.existsSync(votersFile)) {
      const votersRaw = fs.readFileSync(votersFile, 'utf8');
      const voters = JSON.parse(votersRaw || '{}');

      Object.keys(voters).forEach((voterId) => {
        voters[voterId].hasVoted = false;
        delete voters[voterId].votedFor;
        delete voters[voterId].votedAt;
      });
      resetVotersCount = Object.keys(voters).length;

      fs.writeFileSync(votersFile, JSON.stringify(voters, null, 2));
      console.log('Voters reset');
    }

    if (global.broadcastUpdate) {
      global.broadcastUpdate('voting-reset', {
        message: 'Voting data has been reset by admin',
        timestamp: new Date()
      });
    }

    let qrReset = null;
    try {
      const qrResp = await axios.post(`${QR_SERVICE_URL}/admin/reset-qr`, {}, { timeout: 10000 });
      qrReset = qrResp.data;
    } catch (e) {
      qrReset = { success: false, error: e?.response?.data || e?.message || 'QR reset failed' };
    }

    console.log('Admin user for reset:', req.user);
    res.json({
      message: 'Voting data reset successfully. All candidates have 0 votes and voters can vote again.',
      resetAt: new Date(),
      resetBy: req.user?.username || 'admin',
      candidatesReset: candidates.length,
      votersReset: resetVotersCount,
      qrReset: qrReset
    });
  } catch (error) {
    console.error('Error resetting voting:', error);
    res.status(500).json({ message: 'Error resetting voting data', error: error.message });
  }
});
// Get voting statistics
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    // Load actual data from files
    if (fs.existsSync(candidatesFile)) {
      const raw = fs.readFileSync(candidatesFile, 'utf8');
      candidates = JSON.parse(raw || '[]');
    }

    // Load voters (local fallback)
    let voters = {};
    const votersFile = path.join(__dirname, '..', 'data', 'voters.json');
    if (fs.existsSync(votersFile)) {
      const votersRaw = fs.readFileSync(votersFile, 'utf8');
      voters = JSON.parse(votersRaw || '{}');
    }

    // Prefer QR module for total registered voters
    let qrTotalRegistered = null;
    try {
      const qrResp = await axios.get(`${QR_SERVICE_URL}/voter/list/all?limit=1&skip=0`, { timeout: 8000 });
      if (qrResp.data && typeof qrResp.data.totalCount === 'number') {
        qrTotalRegistered = qrResp.data.totalCount;
      }
    } catch (e) {
      qrTotalRegistered = null;
    }

    // Calculate statistics
    const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
    const voterIds = Object.values(voters);
    const totalRegisteredVoters = typeof qrTotalRegistered === 'number' ? qrTotalRegistered : voterIds.length;
    const totalVerifiedVoters = voterIds.filter(v => v.isVerified).length;
    const totalVotedVoters = voterIds.filter(v => v.hasVoted).length;
    const votingPercentage = totalRegisteredVoters > 0 ? ((totalVotedVoters / totalRegisteredVoters) * 100).toFixed(2) : 0;

    // Find leading candidate
    const topCandidate = candidates.length > 0 
      ? candidates.reduce((max, c) => (c.voteCount || 0) > (max.voteCount || 0) ? c : max)
      : null;

    const stats = {
      totalCandidates: candidates.length,
      totalVotes: totalVotes,
      totalVerifiedVoters: totalVerifiedVoters,
      totalRegisteredVoters: totalRegisteredVoters,
      totalVotedVoters: totalVotedVoters,
      votingPercentage: votingPercentage,
      votingStatus: totalVotes > 0 ? 'active' : 'inactive',
      topCandidate: topCandidate,
      candidates: candidates,
      generatedAt: new Date()
    };

    res.json({
      message: 'Statistics retrieved successfully',
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

// Change admin password
router.post('/change-password', adminAuth,
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { oldPassword, newPassword } = req.body;

      // Verify old password (in production, store user-specific hash)
      const isOldPasswordValid = await bcrypt.compare(oldPassword, ADMIN_PASSWORD_HASH);
      if (!isOldPasswordValid) {
        return res.status(401).json({ message: 'Old password is incorrect' });
      }

      // In production: update in database
      // const newPasswordHash = await bcrypt.hash(newPassword, 10);

      res.json({
        message: 'Password changed successfully',
        changedAt: new Date()
      });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Error changing password', error: error.message });
    }
  }
);

module.exports = router;

