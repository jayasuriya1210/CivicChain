// backend/routes/vote.js
const express = require('express');
const router = express.Router();
const { verifyToken, voters } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const VOTE_COOLDOWN_MS = 5 * 60 * 1000;

// Load candidates from file (persistent storage)
const candidatesFile = path.join(__dirname, '..', 'data', 'candidates.json');
let candidates = [];

function loadCandidates() {
  try {
    if (fs.existsSync(candidatesFile)) {
      const raw = fs.readFileSync(candidatesFile, 'utf8');
      candidates = JSON.parse(raw || '[]');
    } else {
      candidates = [];
    }
  } catch (err) {
    console.error('Error loading candidates from file:', err.message);
    candidates = [];
  }
}

function saveCandidates() {
  try {
    fs.writeFileSync(candidatesFile, JSON.stringify(candidates, null, 2));
  } catch (err) {
    console.error('Error saving candidates file:', err.message);
  }
}

// Load candidates on startup
loadCandidates();

// Get all candidates
router.get('/candidates', async (req, res) => {
  try {
    // Reload candidates from file
    loadCandidates();
    
    res.json({
      candidates: candidates,
      total: candidates.length
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ 
      message: 'Error fetching candidates', 
      error: error.message,
      candidates: []
    });
  }
});

// Get single candidate
router.get('/candidates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Reload candidates from file
    loadCandidates();
    
    const candidate = candidates.find(c => c.id == id);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ message: 'Error fetching candidate', error: error.message });
  }
});

// Cast vote
router.post('/cast-vote', verifyToken, async (req, res) => {
  try {
    const { candidateId } = req.body;
    const voter = voters[req.user.voterId];

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    if (!voter.qrVerified) {
      return res.status(403).json({ message: 'QR verification required before face verification' });
    }

    if (!voter.isVerified) {
      return res.status(403).json({ message: 'Face verification required to vote' });
    }

    if (voter.hasVoted) {
      const lastVotedAt = voter.votedAt ? new Date(voter.votedAt).getTime() : null;
      const now = Date.now();
      if (lastVotedAt && now - lastVotedAt < VOTE_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((VOTE_COOLDOWN_MS - (now - lastVotedAt)) / 1000);
        return res.status(403).json({
          message: `You have already voted. Try again after ${waitSeconds} seconds.`,
          retryAfterSeconds: waitSeconds
        });
      }
      voter.hasVoted = false;
    }

    // Reload candidates to get latest data
    loadCandidates();

    // Validate candidate exists
    const candidate = candidates.find(c => c.id == candidateId);
    if (!candidate) {
      return res.status(400).json({ message: 'Invalid candidate ID' });
    }

    // Update vote count for candidate
    candidate.voteCount = (candidate.voteCount || 0) + 1;

    // Mark voter as voted
    voter.hasVoted = true;
    voter.votedFor = candidateId;
    voter.votedAt = new Date();

    // Persist changes to files
    saveCandidates();
    const { saveVoters } = require('../middleware/auth');
    saveVoters();

    console.log(`Vote recorded: Voter ${req.user.voterId} voted for candidate ${candidateId}`);

    // Broadcast vote update to all connected clients
    if (global.broadcastUpdate) {
      global.broadcastUpdate('vote-cast', {
        voterId: req.user.voterId,
        candidateId: candidateId,
        candidateName: candidate.name,
        updatedVoteCount: candidate.voteCount
      });
    }

    res.json({
      message: 'Vote cast successfully!',
      candidateId: candidateId,
      candidateName: candidate.name,
      voterId: req.user.voterId,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Vote casting error:', error);
    res.status(500).json({ message: 'Error casting vote', error: error.message });
  }
});

// Get voting results
router.get('/results', async (req, res) => {
  try {
    // Reload candidates to get latest voting data
    loadCandidates();

    // Calculate results from local candidates data
    let results = [];
    let totalVotes = 0;

    candidates.forEach(candidate => {
      const voteCount = candidate.voteCount || 0;
      totalVotes += voteCount;

      results.push({
        id: candidate.id,
        name: candidate.name,
        party: candidate.party,
        symbol: candidate.symbol,
        voteCount: voteCount,
        percentage: 0 // Will be calculated below
      });
    });

    // Calculate percentages
    results.forEach(result => {
      result.percentage = totalVotes > 0 ? ((result.voteCount / totalVotes) * 100).toFixed(2) : 0;
    });

    // Sort by vote count descending (highest first)
    results.sort((a, b) => b.voteCount - a.voteCount);

    res.json({
      results: results,
      totalVotes: totalVotes,
      totalCandidates: candidates.length,
      winner: results.length > 0 ? {
        name: results[0].name,
        party: results[0].party,
        symbol: results[0].symbol,
        voteCount: results[0].voteCount,
        percentage: results[0].percentage
      } : null
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ 
      message: 'Error fetching results', 
      error: error.message,
      results: []
    });
  }
});

// Check voter's voting status
router.get('/voter-status', verifyToken, async (req, res) => {
  try {
    const voter = voters[req.user.voterId];
    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    let hasVoted = !!voter.hasVoted;
    let retryAfterSeconds = 0;
    if (hasVoted && voter.votedAt) {
      const elapsed = Date.now() - new Date(voter.votedAt).getTime();
      if (elapsed >= VOTE_COOLDOWN_MS) {
        hasVoted = false;
      } else {
        retryAfterSeconds = Math.ceil((VOTE_COOLDOWN_MS - elapsed) / 1000);
      }
    }

    res.json({
      voterId: voter.voterId,
      isVerified: voter.isVerified,
      qrVerified: voter.qrVerified === true,
      hasVoted: hasVoted,
      retryAfterSeconds: retryAfterSeconds,
      canVote: voter.qrVerified === true && voter.isVerified && !hasVoted
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching voter status', error: error.message });
  }
});

module.exports = router;
