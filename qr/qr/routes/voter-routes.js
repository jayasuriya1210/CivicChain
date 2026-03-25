const express = require('express');
const router = express.Router();
const Voter = require('../models/Voter');

/**
 * Register a new voter
 * POST /voter/register
 */
router.post('/register', async (req, res) => {
  try {
    const { voterId, name, phone, email, photoUrl, constituency, boothId } = req.body;

    // Validate required fields
    if (!voterId || !name || !phone || !photoUrl || !constituency || !boothId) {
      return res.status(400).json({
        error: 'Missing required fields: voterId, name, phone, photoUrl, constituency, boothId'
      });
    }

    // Check if voter already exists
    const existingVoter = await Voter.findOne({ voterId });
    if (existingVoter) {
      return res.status(409).json({ error: 'Voter with this ID already exists' });
    }

    // Create new voter using .create() method
    const voter = await Voter.create({
      voterId,
      name,
      phone,
      email: email || '',
      photoUrl,
      constituency,
      boothId,
      hasVoted: false,
      status: 'registered'
    });

    res.status(201).json({
      success: true,
      message: 'Voter registered successfully',
      voterId: voter.voterId,
      status: voter.status
    });
  } catch (error) {
    console.error('Error registering voter:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get voter details
 * GET /voter/:voterId
 */
router.get('/:voterId', async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    res.json({
      success: true,
      voter
    });
  } catch (error) {
    console.error('Error retrieving voter:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update voter details
 * PUT /voter/:voterId
 */
router.put('/:voterId', async (req, res) => {
  try {
    const { voterId } = req.params;
    const { name, phone, email, photoUrl, constituency, boothId } = req.body;

    const voter = await Voter.findOne({ voterId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    // Update fields if provided
    if (name) voter.name = name;
    if (phone) voter.phone = phone;
    if (email) voter.email = email;
    if (photoUrl) voter.photoUrl = photoUrl;
    if (constituency) voter.constituency = constituency;
    if (boothId) voter.boothId = boothId;

    await voter.save();

    res.json({
      success: true,
      message: 'Voter updated successfully',
      voter
    });
  } catch (error) {
    console.error('Error updating voter:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete voter (admin only)
 * DELETE /voter/:voterId
 */
router.delete('/:voterId', async (req, res) => {
  try {
    const { voterId } = req.params;

    const voter = await Voter.findOneAndDelete({ voterId });
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found' });
    }

    res.json({
      success: true,
      message: 'Voter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voter:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all voters (admin only)
 * GET /voter/list/all
 */
router.get('/list/all', async (req, res) => {
  try {
    const { boothId, constituency, limit = 100, skip = 0 } = req.query;

    let query = {};
    if (boothId) {
      query.boothId = boothId;
    }
    if (constituency) {
      query.constituency = constituency;
    }

    const voters = await Voter.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const totalCount = await Voter.countDocuments(query);

    res.json({
      success: true,
      count: voters.length,
      totalCount,
      voters
    });
  } catch (error) {
    console.error('Error retrieving voters:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get voter statistics
 * GET /voter/stats/summary
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const { boothId, constituency } = req.query;

    let query = {};
    if (boothId) {
      query.boothId = boothId;
    }
    if (constituency) {
      query.constituency = constituency;
    }

    const totalVoters = await Voter.countDocuments(query);
    const votersWhoVoted = await Voter.countDocuments({
      ...query,
      hasVoted: true
    });
    const votersNotVoted = await Voter.countDocuments({
      ...query,
      hasVoted: false
    });
    const rejectedVoters = await Voter.countDocuments({
      ...query,
      status: 'rejected'
    });

    res.json({
      success: true,
      stats: {
        totalVoters,
        votersWhoVoted,
        votersNotVoted,
        rejectedVoters,
        voterTurnout: totalVoters > 0 ? ((votersWhoVoted / totalVoters) * 100).toFixed(2) + '%' : '0%'
      }
    });
  } catch (error) {
    console.error('Error retrieving voter stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
