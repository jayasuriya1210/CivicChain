/**
 * Socket.io event handlers
 */

module.exports = {
  /**
   * Admin joins dashboard room
   */
  handleAdminJoinDashboard: (io, socket) => {
    socket.on('join-dashboard', (adminId) => {
      socket.join('admin-dashboard');
      console.log(`Admin ${adminId} joined dashboard`);
    });
  },

  /**
   * Polling station joins booth room
   */
  handleBoothJoin: (io, socket) => {
    socket.on('join-booth', (boothId) => {
      socket.join(`booth-${boothId}`);
      console.log(`Booth ${boothId} joined`);
    });
  },

  /**
   * Voter joins session room
   */
  handleVoterJoinSession: (io, socket) => {
    socket.on('join-session', (sessionId) => {
      socket.join(`session-${sessionId}`);
      console.log(`Visitor joined session ${sessionId}`);
    });
  },

  /**
   * Emit new verification request to admin dashboard
   */
  emitNewVerificationRequest: (io, sessionData) => {
    io.to('admin-dashboard').emit('new-verification-request', {
      sessionId: sessionData.sessionId,
      voterDetails: sessionData.voterDetails,
      boothId: sessionData.boothId,
      scannerId: sessionData.scannerId,
      timestamp: sessionData.createdAt
    });
  },

  /**
   * Emit verification approved to session room
   */
  emitVerificationApproved: (io, sessionId, votingToken, voterDetails) => {
    io.to(`session-${sessionId}`).emit('verification-approved', {
      votingToken,
      sessionId,
      voterDetails,
      message: 'Verification successful. Proceed to vote.'
    });
  },

  /**
   * Emit verification rejected to session room
   */
  emitVerificationRejected: (io, sessionId, reason) => {
    io.to(`session-${sessionId}`).emit('verification-rejected', {
      sessionId,
      reason: reason || 'Verification failed',
      message: 'Please contact polling officer'
    });
  },

  /**
   * Emit vote cast notification to admin dashboard
   */
  emitVoteCast: (io, voteData) => {
    io.to('admin-dashboard').emit('vote-cast', {
      sessionId: voteData.sessionId,
      voterId: voteData.voterId,
      constituency: voteData.constituency,
      boothId: voteData.boothId,
      timestamp: voteData.timestamp
    });
  },

  /**
   * Emit statistics update to admin dashboard
   */
  emitStatsUpdate: (io, stats) => {
    io.to('admin-dashboard').emit('stats-update', stats);
  },

  /**
   * Handle disconnection
   */
  handleDisconnect: (io, socket) => {
    socket.on('disconnect', () => {
      console.log(`User ${socket.id} disconnected`);
    });
  }
};
