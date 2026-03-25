const express = require('express');
const router = express.Router();
const VerificationSession = require('../models/VerificationSession');
const VoteRecord = require('../models/VoteRecord');
const Voter = require('../models/Voter');
const { verifyVotingToken, generateVotingToken } = require('../utils/token-manager');

// Fixed candidate list for demo voting
const CANDIDATES = [
  { id: 'CAND-001', name: 'Asha Sharma', party: 'Jan Shakti Party', symbol: 'Hand' },
  { id: 'CAND-002', name: 'Ravi Kumar', party: 'Bharat Vikas Dal', symbol: 'Lotus' },
  { id: 'CAND-003', name: 'Priya Iyer', party: 'National People Front', symbol: 'Cycle' },
  { id: 'CAND-004', name: 'Arjun Singh', party: 'Lok Pragati Sangh', symbol: 'Star' }
];

function getVotingToken(req) {
  if (req.body && req.body.votingToken) return req.body.votingToken;
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

function applyTimeFilter(records, startDate, endDate) {
  let filtered = records;
  if (startDate) {
    const from = new Date(startDate).getTime();
    filtered = filtered.filter((r) => new Date(r.timestamp).getTime() >= from);
  }
  if (endDate) {
    const to = new Date(endDate).getTime();
    filtered = filtered.filter((r) => new Date(r.timestamp).getTime() <= to);
  }
  return filtered;
}

/**
 * Get voter info from voting token
 * GET /vote/voter-info
 */
router.get('/voter-info', async (req, res) => {
  try {
    const votingToken = getVotingToken(req);
    if (!votingToken) {
      return res.status(400).json({ error: 'Voting token is required' });
    }

    let decoded;
    try {
      decoded = verifyVotingToken(votingToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired voting token' });
    }

    const voter = await Voter.findOne({ voterId: decoded.voterId });

    res.json({
      success: true,
      voterId: decoded.voterId,
      constituency: decoded.constituency,
      boothId: decoded.boothId,
      name: voter ? voter.name : undefined
    });
  } catch (error) {
    console.error('Error retrieving voter info:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get candidate list for voting screen
 * GET /vote/candidates
 */
router.get('/candidates', async (req, res) => {
  try {
    const votingToken = getVotingToken(req);
    if (!votingToken) {
      return res.status(400).json({ error: 'Voting token is required' });
    }

    let decoded;
    try {
      decoded = verifyVotingToken(votingToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired voting token' });
    }

    res.json({
      success: true,
      constituency: decoded.constituency,
      candidates: CANDIDATES.map((candidate) => ({
        ...candidate,
        constituency: decoded.constituency
      }))
    });
  } catch (error) {
    console.error('Error retrieving candidates:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create voting token from verified session
 * GET /vote/session-token/:sessionId
 */
router.get('/session-token/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await VerificationSession.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status !== 'verified') {
      return res.status(403).json({ error: 'Session not approved for voting', status: session.status });
    }

    const votingToken = generateVotingToken(session);
    res.json({
      success: true,
      sessionId,
      votingToken
    });
  } catch (error) {
    console.error('Error generating session voting token:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Cast vote (after verification)
 * POST /vote/cast
 */
router.post('/cast', async (req, res) => {
  try {
    const votingToken = getVotingToken(req);
    const { candidateId, candidateName, partyName } = req.body;

    if (!votingToken || !candidateId) {
      return res.status(400).json({ error: 'votingToken and candidateId are required' });
    }

    let decoded;
    try {
      decoded = verifyVotingToken(votingToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired voting token' });
    }

    const session = await VerificationSession.findOne({ sessionId: decoded.sessionId });
    if (!session || session.status !== 'verified') {
      return res.status(403).json({ error: 'Invalid voting session' });
    }

    const existingVote = await VoteRecord.findOne({ sessionId: decoded.sessionId });
    if (existingVote) {
      return res.status(409).json({ error: 'Vote already recorded' });
    }

    const selected = CANDIDATES.find((candidate) => candidate.id === candidateId);

    const vote = await VoteRecord.create({
      sessionId: decoded.sessionId,
      voterId: decoded.voterId,
      constituency: decoded.constituency,
      boothId: session.boothId,
      candidateId,
      candidateName: candidateName || (selected ? selected.name : ''),
      partyName: partyName || (selected ? selected.party : ''),
      timestamp: new Date(),
      ipAddress: req.ip,
      deviceInfo: req.get('user-agent')
    });

    await Voter.updateOne(
      { voterId: decoded.voterId },
      { hasVoted: true, status: 'voted' }
    );

    session.status = 'completed';
    session.voteCastAt = new Date();
    await session.save();

    if (req.io) {
      req.io.to('admin-dashboard').emit('vote-cast', {
        sessionId: decoded.sessionId,
        voterId: decoded.voterId,
        constituency: decoded.constituency,
        boothId: session.boothId,
        candidateId,
        candidateName: vote.candidateName,
        partyName: vote.partyName,
        timestamp: vote.timestamp
      });
    }

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      receipt: vote._id,
      timestamp: vote.timestamp
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get vote statistics
 * GET /vote/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const { boothId, constituency, startDate, endDate } = req.query;

    const query = {};
    if (boothId) query.boothId = boothId;
    if (constituency) query.constituency = constituency;

    let votes = await VoteRecord.find(query);
    votes = applyTimeFilter(votes, startDate, endDate);

    const candidateMap = {};
    const boothMap = {};

    for (const vote of votes) {
      const cKey = vote.candidateId || 'UNKNOWN';
      if (!candidateMap[cKey]) {
        candidateMap[cKey] = {
          _id: cKey,
          candidateName: vote.candidateName || '',
          partyName: vote.partyName || '',
          votes: 0
        };
      }
      candidateMap[cKey].votes += 1;

      const bKey = vote.boothId || 'UNKNOWN';
      boothMap[bKey] = (boothMap[bKey] || 0) + 1;
    }

    const candidateVotes = Object.values(candidateMap).sort((a, b) => b.votes - a.votes);
    const boothVotes = Object.entries(boothMap)
      .map(([key, count]) => ({ _id: key, votes: count }))
      .sort((a, b) => b.votes - a.votes);

    res.json({
      success: true,
      totalVotes: votes.length,
      candidateVotes,
      boothVotes
    });
  } catch (error) {
    console.error('Error retrieving vote stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recent votes for monitoring dashboard
 * GET /vote/recent?limit=20
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit || '20', 10), 200));
    const boothId = req.query.boothId;

    const query = {};
    if (boothId) query.boothId = boothId;

    let votes = await VoteRecord.find(query);
    votes = votes
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      count: votes.length,
      votes
    });
  } catch (error) {
    console.error('Error retrieving recent votes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get vote record by session ID
 * GET /vote/record/:sessionId
 */
router.get('/record/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const vote = await VoteRecord.findOne({ sessionId });
    if (!vote) {
      return res.status(404).json({ error: 'Vote record not found' });
    }

    res.json({ success: true, vote });
  } catch (error) {
    console.error('Error retrieving vote record:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get vote statistics per constituency
 * GET /vote/constituency-stats
 */
router.get('/constituency-stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let votes = await VoteRecord.find({});
    votes = applyTimeFilter(votes, startDate, endDate);

    const map = {};
    for (const vote of votes) {
      const key = vote.constituency || 'UNKNOWN';
      if (!map[key]) {
        map[key] = { _id: key, totalVotes: 0, voters: new Set() };
      }
      map[key].totalVotes += 1;
      map[key].voters.add(vote.voterId);
    }

    const constituencyStats = Object.values(map)
      .map((x) => ({ _id: x._id, totalVotes: x.totalVotes, uniqueVoterCount: x.voters.size }))
      .sort((a, b) => b.totalVotes - a.totalVotes);

    res.json({
      success: true,
      constituencyStats
    });
  } catch (error) {
    console.error('Error retrieving constituency stats:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
