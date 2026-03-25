// backend/routes/qr.js
const express = require('express');
const axios = require('axios');
const { verifyToken, voters, saveVoters } = require('../middleware/auth');

const router = express.Router();

const QR_SERVICE_URL = (process.env.QR_SERVICE_URL || 'http://localhost:3001').replace(/\/+$/, '');

function ensureLocalVoter(voterId) {
  if (!voters[voterId]) {
    voters[voterId] = {
      voterId,
      address: '',
      isVerified: false,
      hasVoted: false,
      qrVerified: false,
      createdAt: new Date()
    };
  }
  if (voters[voterId].qrVerified !== true) {
    voters[voterId].qrVerified = false;
  }
  return voters[voterId];
}

function forwardError(res, error) {
  const status = error?.response?.status || 500;
  const data = error?.response?.data || { error: error?.message || 'QR service error' };
  res.status(status).json(data);
}

// Register voter in QR system, and mirror locally
router.post('/register', async (req, res) => {
  try {
    const { voterId, name, phone, email, photoUrl, constituency, boothId } = req.body;
    if (!voterId || !name || !phone || !photoUrl || !constituency || !boothId) {
      return res.status(400).json({
        message: 'Missing required fields: voterId, name, phone, photoUrl, constituency, boothId'
      });
    }

    const response = await axios.post(`${QR_SERVICE_URL}/voter/register`, {
      voterId,
      name,
      phone,
      email: email || '',
      photoUrl,
      constituency,
      boothId
    }, { timeout: 15000 });

    ensureLocalVoter(voterId);
    try { saveVoters(); } catch (e) { console.warn('Could not save voters:', e.message); }

    res.status(response.status).json(response.data);
  } catch (error) {
    forwardError(res, error);
  }
});

// Generate QR code for voter
router.post('/generate', async (req, res) => {
  try {
    const { voterId } = req.body;
    if (!voterId) {
      return res.status(400).json({ message: 'voterId is required' });
    }

    const response = await axios.post(`${QR_SERVICE_URL}/qr/generate-qr`, { voterId }, { timeout: 15000 });
    res.status(response.status).json(response.data);
  } catch (error) {
    forwardError(res, error);
  }
});

// Scan QR token to create verification session (requires login token)
router.post('/scan', verifyToken, async (req, res) => {
  try {
    const { token, boothId, scannerId } = req.body;
    if (!token || !boothId) {
      return res.status(400).json({ message: 'token and boothId are required' });
    }

    const response = await axios.post(`${QR_SERVICE_URL}/booth/scan-qr`, {
      token,
      boothId,
      scannerId
    }, { timeout: 15000 });

    const voter = ensureLocalVoter(req.user.voterId);
    if (response.data?.sessionId) {
      voter.qrSessionId = response.data.sessionId;
      voter.qrStatus = response.data.status || 'pending';
      voter.qrVerified = false;
      try { saveVoters(); } catch (e) { console.warn('Could not save voters:', e.message); }
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    forwardError(res, error);
  }
});

// Get session status and mark local voter as QR-verified when approved
router.get('/session-status/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const response = await axios.get(`${QR_SERVICE_URL}/booth/session-status/${sessionId}`, { timeout: 15000 });

    const session = response.data;
    if (session?.voterId && session.voterId !== req.user.voterId) {
      return res.status(403).json({ message: 'Session does not belong to this voter' });
    }

    const voter = ensureLocalVoter(req.user.voterId);
    voter.qrSessionId = sessionId;
    voter.qrStatus = session?.status || voter.qrStatus || 'pending';

    if (session?.status === 'verified') {
      voter.qrVerified = true;
      voter.qrVerifiedAt = new Date();
    } else if (session?.status === 'rejected') {
      voter.qrVerified = false;
      voter.qrRejectedAt = new Date();
    }

    try { saveVoters(); } catch (e) { console.warn('Could not save voters:', e.message); }

    res.status(response.status).json({
      ...session,
      qrVerified: voter.qrVerified === true
    });
  } catch (error) {
    forwardError(res, error);
  }
});

// Confirm QR session and sync local voter state
router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const response = await axios.get(`${QR_SERVICE_URL}/booth/session-status/${sessionId}`, { timeout: 15000 });
    const session = response.data;

    if (!session || !session.voterId) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (session.voterId !== req.user.voterId) {
      return res.status(403).json({ message: 'Session does not belong to this voter' });
    }

    const voter = ensureLocalVoter(req.user.voterId);
    voter.qrSessionId = sessionId;
    voter.qrStatus = session.status || 'pending';

    if (session.status === 'verified') {
      voter.qrVerified = true;
      voter.qrVerifiedAt = new Date();
    } else if (session.status === 'rejected') {
      voter.qrVerified = false;
      voter.qrRejectedAt = new Date();
    }

    try { saveVoters(); } catch (e) { console.warn('Could not save voters:', e.message); }

    res.json({
      success: true,
      status: session.status,
      voterId: session.voterId,
      qrVerified: voter.qrVerified === true
    });
  } catch (error) {
    forwardError(res, error);
  }
});

// Local QR verification status
router.get('/status', verifyToken, (req, res) => {
  const voter = voters[req.user.voterId];
  if (!voter) {
    return res.status(404).json({ message: 'Voter not found' });
  }

  res.json({
    voterId: voter.voterId,
    qrVerified: voter.qrVerified === true,
    qrStatus: voter.qrStatus || null,
    qrSessionId: voter.qrSessionId || null
  });
});

module.exports = router;
