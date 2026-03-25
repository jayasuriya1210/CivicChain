const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');
const VerificationSession = require('../models/VerificationSession');
const { generateVotingToken } = require('../utils/token-manager');
const { isUsingMemoryDB, getInMemoryDB } = require('../models/db-connection');

/**
 * Admin verifies voter
 * POST /admin/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { sessionId, action, adminId, reason } = req.body;
    // action: 'approve' or 'reject'

    if (!sessionId || !action || !adminId) {
      return res.status(400).json({
        error: 'sessionId, action, and adminId are required'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        error: 'action must be either "approve" or "reject"'
      });
    }

    const session = await VerificationSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({
        error: 'Session already processed',
        currentStatus: session.status
      });
    }

    if (action === 'approve') {
      // Generate one-time voting token
      const votingToken = generateVotingToken(session);

      session.status = 'verified';
      session.verifiedAt = new Date();
      session.adminId = adminId;
      await session.save();

      // Update voter status
      await Voter.updateOne(
        { voterId: session.voterId },
        { status: 'verified' }
      );

      res.json({
        success: true,
        sessionId,
        status: 'verified',
        votingToken,
        voterDetails: session.voterDetails,
        message: 'Voter verified successfully'
      });
    } else {
      // Rejected
      session.status = 'rejected';
      session.adminId = adminId;
      session.rejectionReason = reason || 'Verification failed';
      await session.save();

      // Update voter status
      await Voter.updateOne(
        { voterId: session.voterId },
        { status: 'rejected' }
      );

      res.json({
        success: true,
        sessionId,
        status: 'rejected',
        reason: session.rejectionReason,
        message: 'Voter verification rejected'
      });
    }
  } catch (error) {
    console.error('Error verifying voter:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending verifications for admin
 * GET /admin/pending-verifications
 */
router.get('/pending-verifications', async (req, res) => {
  try {
    const { boothId, limit = 50 } = req.query;

    let query = { status: 'pending' };
    if (boothId) {
      query.boothId = boothId;
    }

    const pendingSessions = await VerificationSession.find(query)
      .sort({ createdAt: 1 })
      .limit(parseInt(limit));

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

/**
 * Get verification stats for dashboard
 * GET /admin/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { boothId, startDate, endDate } = req.query;

    let query = {};
    if (boothId) {
      query.boothId = boothId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const totalSessions = await VerificationSession.countDocuments(query);
    const verifiedCount = await VerificationSession.countDocuments({
      ...query,
      status: 'verified'
    });
    const rejectedCount = await VerificationSession.countDocuments({
      ...query,
      status: 'rejected'
    });
    const pendingCount = await VerificationSession.countDocuments({
      ...query,
      status: 'pending'
    });
    const completedCount = await VerificationSession.countDocuments({
      ...query,
      status: 'completed'
    });

    res.json({
      success: true,
      stats: {
        totalSessions,
        verifiedCount,
        rejectedCount,
        pendingCount,
        completedCount,
        verificationRate:
          totalSessions > 0
            ? ((verifiedCount / totalSessions) * 100).toFixed(2) + '%'
            : '0%'
      }
    });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get booth statistics
 * GET /admin/booth-stats
 */
router.get('/booth-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    const boothStats = await VerificationSession.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$boothId',
          totalVerifications: { $sum: 1 },
          verified: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      boothStats
    });
  } catch (error) {
    console.error('Error retrieving booth stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reset QR verification state (restart scanning)
 * POST /admin/reset-qr
 */
router.post('/reset-qr', async (req, res) => {
  try {
    const sessionResult = await VerificationSession.deleteMany({});

    const voterResult = await Voter.updateMany({}, {
      $set: {
        hasVoted: false,
        status: 'registered',
        qrCodeToken: null,
        qrCodeExpiry: null
      }
    });

    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      if (db && db.qrCodes) {
        db.qrCodes = {};
      }
    }

    res.json({
      success: true,
      message: 'QR verification state reset successfully',
      sessionsCleared: sessionResult?.deletedCount || 0,
      votersReset: voterResult?.modifiedCount || 0
    });
  } catch (error) {
    console.error('Error resetting QR state:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
