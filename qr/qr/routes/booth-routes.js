const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const VerificationSession = require('../models/VerificationSession');
const { verifyQRToken } = require('../utils/token-manager');
const { generateSessionId, generateScannerId } = require('../utils/qr-helper');
const VOTE_COOLDOWN_MS = 5 * 60 * 1000;

function getLastVoteTime(voter) {
  if (!voter || !voter.hasVoted) return null;
  const updatedAt = voter.updatedAt ? new Date(voter.updatedAt).getTime() : null;
  return Number.isFinite(updatedAt) ? updatedAt : null;
}

function isWithinVoteCooldown(voter) {
  const last = getLastVoteTime(voter);
  if (!last) return false;
  return Date.now() - last < VOTE_COOLDOWN_MS;
}

/**
 * Handle QR scan at polling station
 * POST /booth/scan-qr
 */
router.post('/scan-qr', async (req, res) => {
  try {
    const { token, boothId, scannerId } = req.body;

    if (!token || !boothId) {
      return res.status(400).json({ error: 'Token and boothId are required' });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyQRToken(token);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired QR code' });
    }

    // Check if voter already has pending session
    const existingSession = await VerificationSession.findOne({
      voterId: decoded.voterId,
      status: { $in: ['pending', 'verified', 'voting'] }
    });

    if (existingSession) {
      return res.status(409).json({
        error: 'Voter already in verification queue or voting',
        sessionId: existingSession.sessionId
      });
    }

    // Check if already voted
    const voter = await Voter.findOne({ voterId: decoded.voterId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    if (voter.hasVoted && isWithinVoteCooldown(voter)) {
      return res.status(403).json({ error: 'Voter has already cast vote in last 5 minutes' });
    }

    if (voter.status === 'rejected') {
      return res.status(403).json({ error: 'Voter verification was rejected' });
    }

    // Create verification session
    const sessionId = generateSessionId();
    const finalScannerId = scannerId || generateScannerId(boothId);
    
    const session = await VerificationSession.create({
      sessionId,
      voterId: decoded.voterId,
      voterDetails: {
        name: voter.name,
        voterId: voter.voterId,
        photoUrl: voter.photoUrl,
        constituency: voter.constituency,
        boothId: voter.boothId
      },
      boothId,
      scannerId: finalScannerId,
      status: 'pending',
      createdAt: new Date()
    });

    await Voter.updateOne(
      { voterId: decoded.voterId },
      { status: 'verified' }
    );

    res.json({
      success: true,
      sessionId,
      message: 'Verification request sent to admin',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error processing QR scan:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get verification session status
 * GET /booth/session-status/:sessionId
 */
router.get('/session-status/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await VerificationSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      sessionId: session.sessionId,
      status: session.status,
      voterId: session.voterId,
      voterDetails: session.voterDetails,
      createdAt: session.createdAt,
      verifiedAt: session.verifiedAt
    });
  } catch (error) {
    console.error('Error retrieving session status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending verifications for a booth
 * GET /booth/pending-verifications/:boothId
 */
router.get('/pending-verifications/:boothId', async (req, res) => {
  try {
    const { boothId } = req.params;

    const pendingSessions = await VerificationSession.find({
      boothId,
      status: 'pending'
    }).sort({ createdAt: 1 });

    res.json({
      success: true,
      count: pendingSessions.length,
      sessions: pendingSessions
    });
  } catch (error) {
    console.error('Error retrieving pending verifications:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
