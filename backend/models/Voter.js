// backend/models/Voter.js
class Voter {
  constructor(voterId, address, isVerified = false, hasVoted = false) {
    this.voterId = voterId;
    this.address = address;
    this.isVerified = isVerified;
    this.hasVoted = hasVoted;
    this.createdAt = new Date();
  }

  // Validate voter ID (12 digits for Indian voters)
  static validateVoterId(voterId) {
    const voterIdRegex = /^[0-9]{12}$/;
    return voterIdRegex.test(voterId);
  }

  // Format voter ID
  static formatVoterId(voterId) {
    return voterId.toString().padStart(12, '0');
  }

  // Check if voter ID is valid
  isValidVoterId() {
    return Voter.validateVoterId(this.voterId);
  }
}

module.exports = Voter;
