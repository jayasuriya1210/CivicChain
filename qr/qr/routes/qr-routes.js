const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const { generateQRToken } = require('../utils/token-manager');
const { generateQRCodeDataUrl } = require('../utils/qr-helper');

const LOW_CAMERA_QR_OPTIONS = {
  width: 420,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
};
const VOTE_COOLDOWN_MS = 5 * 60 * 1000;
const QR_EXPIRY_MS = 20 * 60 * 60 * 1000;

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
 * Generate QR code for voter (Done during registration)
 * POST /qr/generate-qr
 */
router.post('/generate-qr', async (req, res) => {
  try {
    const { voterId } = req.body;

    if (!voterId) {
      return res.status(400).json({ error: 'Voter ID is required' });
    }

    // Verify voter exists and hasn't voted
    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    if (voter.hasVoted && isWithinVoteCooldown(voter)) {
      return res.status(403).json({ error: 'Voter has already cast vote in last 5 minutes' });
    }

    if (voter.status === 'rejected') {
      return res.status(403).json({ error: 'Voter verification was rejected' });
    }

    // Generate encrypted JWT token containing voter ID
    const token = generateQRToken(voter);

    // Keep URL for UI/debug, but encode only token in QR to reduce density.
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/qr/verify/${token}`;
    
    const qrDataUrl = await generateQRCodeDataUrl(token, LOW_CAMERA_QR_OPTIONS);

    // Save token to voter record
    voter.qrCodeToken = token;
    voter.qrCodeExpiry = new Date(Date.now() + QR_EXPIRY_MS);
    voter.status = 'qr-generated';
    await voter.save();

    res.json({
      success: true,
      qrCode: qrDataUrl,
      verificationUrl,
      voterId: voter.voterId,
      expiresAt: voter.qrCodeExpiry,
      message: 'QR code generated successfully'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get QR code for a voter
 * GET /qr/get-qr/:voterId
 */
router.get('/get-qr/:voterId', async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    if (!voter.qrCodeToken) {
      return res.status(400).json({ error: 'QR code not generated. Please generate first.' });
    }

    // Check if token is expired
    if (voter.qrCodeExpiry < new Date()) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Keep URL for UI/debug, but encode only token in QR to reduce density.
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/qr/verify/${voter.qrCodeToken}`;
    
    const qrDataUrl = await generateQRCodeDataUrl(voter.qrCodeToken, LOW_CAMERA_QR_OPTIONS);

    res.json({
      success: true,
      qrCode: qrDataUrl,
      voterId: voter.voterId,
      expiresAt: voter.qrCodeExpiry
    });
  } catch (error) {
    console.error('Error retrieving QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Regenerate QR code (token expired)
 * POST /qr/regenerate-qr/:voterId
 */
router.post('/regenerate-qr/:voterId', async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    if (voter.hasVoted && isWithinVoteCooldown(voter)) {
      return res.status(403).json({ error: 'Voter has already cast vote in last 5 minutes' });
    }

    // Generate new token
    const token = generateQRToken(voter);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/qr/verify/${token}`;
    
    const qrDataUrl = await generateQRCodeDataUrl(token, LOW_CAMERA_QR_OPTIONS);

    // Update voter record
    voter.qrCodeToken = token;
    voter.qrCodeExpiry = new Date(Date.now() + QR_EXPIRY_MS);
    voter.status = 'qr-generated';
    await voter.save();

    res.json({
      success: true,
      qrCode: qrDataUrl,
      verificationUrl,
      voterId: voter.voterId,
      expiresAt: voter.qrCodeExpiry,
      message: 'QR code regenerated successfully'
    });
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
