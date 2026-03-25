/**
 * In-Memory Database - Mock Storage for QR Voting System
 * Used when MongoDB is not available
 */

class InMemoryDB {
  constructor() {
    this.voters = {};
    this.voteRecords = {};
    this.verificationSessions = {};
    this.qrCodes = {};
    this.nextVoterId = 1;
    this.nextRecordId = 1;
    this.nextSessionId = 1;
  }

  // ===== VOTER OPERATIONS =====
  
  async createVoter(voterData) {
    const voterId = voterData.voterId || `VOTER-${this.nextVoterId++}`;
    const voter = {
      _id: voterId,
      voterId,
      name: voterData.name,
      phone: voterData.phone,
      email: voterData.email || '',
      photoUrl: voterData.photoUrl,
      constituency: voterData.constituency,
      boothId: voterData.boothId,
      hasVoted: voterData.hasVoted || false,
      status: voterData.status || 'registered',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.voters[voterId] = voter;
    return { ...voter };
  }

  async findVoterById(voterId) {
    return this.voters[voterId] ? { ...this.voters[voterId] } : null;
  }

  async findVoterByVoterId(voterId) {
    return this.voters[voterId] ? { ...this.voters[voterId] } : null;
  }

  async updateVoter(voterId, updateData) {
    if (!this.voters[voterId]) return null;
    this.voters[voterId] = { ...this.voters[voterId], ...updateData, updatedAt: new Date() };
    return { ...this.voters[voterId] };
  }

  async deleteVoter(voterId) {
    if (this.voters[voterId]) {
      delete this.voters[voterId];
      return true;
    }
    return false;
  }

  async getAllVoters() {
    return Object.values(this.voters).map(v => ({ ...v }));
  }

  async countVoters(filter = {}) {
    let voters = Object.values(this.voters);
    if (filter.constituency) {
      voters = voters.filter(v => v.constituency === filter.constituency);
    }
    if (filter.boothId) {
      voters = voters.filter(v => v.boothId === filter.boothId);
    }
    if (filter.hasVoted !== undefined) {
      voters = voters.filter(v => v.hasVoted === filter.hasVoted);
    }
    return voters.length;
  }

  // ===== VOTE RECORD OPERATIONS =====

  async createVoteRecord(recordData) {
    const recordId = `RECORD-${this.nextRecordId++}`;
    const record = {
      _id: recordId,
      sessionId: recordData.sessionId,
      voterId: recordData.voterId,
      constituency: recordData.constituency,
      boothId: recordData.boothId,
      candidateId: recordData.candidateId,
      candidateName: recordData.candidateName || '',
      partyName: recordData.partyName || '',
      timestamp: recordData.timestamp || new Date(),
      ipAddress: recordData.ipAddress || '',
      deviceInfo: recordData.deviceInfo || '',
      verificationHash: recordData.verificationHash || ''
    };
    this.voteRecords[recordId] = record;
    return { ...record };
  }

  async findVoteRecordBySessionId(sessionId) {
    const records = Object.values(this.voteRecords).filter(r => r.sessionId === sessionId);
    return records.length > 0 ? { ...records[0] } : null;
  }

  async findVoteRecordsByBoothId(boothId) {
    return Object.values(this.voteRecords)
      .filter(r => r.boothId === boothId)
      .map(r => ({ ...r }));
  }

  async countVotesByConstituency(constituency) {
    return Object.values(this.voteRecords)
      .filter(r => {
        const voter = this.voters[r.voterId];
        return voter && voter.constituency === constituency;
      }).length;
  }

  // ===== VERIFICATION SESSION OPERATIONS =====

  async createVerificationSession(sessionData) {
    const sessionId = sessionData.sessionId || `SESSION-${this.nextSessionId++}`;
    const session = {
      _id: sessionId,
      sessionId,
      voterId: sessionData.voterId,
      voterDetails: sessionData.voterDetails || {},
      boothId: sessionData.boothId,
      scannerId: sessionData.scannerId || `SCANNER-${sessionData.boothId || 'GEN'}`,
      status: sessionData.status || 'pending',
      adminId: sessionData.adminId || null,
      createdAt: sessionData.createdAt || new Date(),
      verifiedAt: sessionData.verifiedAt || null,
      rejectionReason: sessionData.rejectionReason || null,
      voteCastAt: sessionData.voteCastAt || null
    };
    this.verificationSessions[sessionId] = session;
    return { ...session };
  }

  async findVerificationSessionById(sessionId) {
    return this.verificationSessions[sessionId] ? { ...this.verificationSessions[sessionId] } : null;
  }

  async updateVerificationSession(sessionId, updateData) {
    if (!this.verificationSessions[sessionId]) return null;
    this.verificationSessions[sessionId] = { 
      ...this.verificationSessions[sessionId], 
      ...updateData 
    };
    return { ...this.verificationSessions[sessionId] };
  }

  async getPendingVerifications() {
    return Object.values(this.verificationSessions)
      .filter(s => s.status === 'pending' && s.expiresAt > new Date())
      .map(s => ({ ...s }));
  }

  // ===== QR CODE OPERATIONS =====

  async storeQRCode(voterId, qrCode, qrData) {
    this.qrCodes[voterId] = {
      voterId,
      qrCode,
      qrData,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    return true;
  }

  async getQRCode(voterId) {
    const qr = this.qrCodes[voterId];
    if (!qr || qr.expiresAt < new Date()) {
      delete this.qrCodes[voterId];
      return null;
    }
    return { ...qr };
  }

  // ===== STATISTICS =====

  async getStats() {
    const totalVoters = Object.keys(this.voters).length;
    const totalVotes = Object.keys(this.voteRecords).length;
    const totalSessions = Object.keys(this.verificationSessions).length;
    const votedVoters = Object.values(this.voters).filter(v => v.hasVoted).length;

    return {
      totalVoters,
      totalVotes,
      totalSessions,
      votedVoters,
      unvotedVoters: totalVoters - votedVoters,
      votingPercentage: totalVoters > 0 ? ((votedVoters / totalVoters) * 100).toFixed(2) : '0.00'
    };
  }

  async getConstituencyStats(constituency) {
    const voters = Object.values(this.voters).filter(v => v.constituency === constituency);
    const votes = Object.values(this.voteRecords).filter(r => {
      const voter = this.voters[r.voterId];
      return voter && voter.constituency === constituency;
    });
    const votedCount = voters.filter(v => v.hasVoted).length;

    return {
      constituency,
      totalVoters: voters.length,
      totalVotes: votes.length,
      votedVoters: votedCount,
      unvotedVoters: voters.length - votedCount,
      votingPercentage: voters.length > 0 ? ((votedCount / voters.length) * 100).toFixed(2) : '0.00'
    };
  }

  // ===== UTILITY METHODS =====

  clear() {
    this.voters = {};
    this.voteRecords = {};
    this.verificationSessions = {};
    this.qrCodes = {};
  }

  getSize() {
    return {
      voters: Object.keys(this.voters).length,
      voteRecords: Object.keys(this.voteRecords).length,
      verificationSessions: Object.keys(this.verificationSessions).length,
      qrCodes: Object.keys(this.qrCodes).length
    };
  }
}

// Singleton instance
let instance = null;

const getInMemoryDB = () => {
  if (!instance) {
    instance = new InMemoryDB();
  }
  return instance;
};

module.exports = { getInMemoryDB, InMemoryDB };
