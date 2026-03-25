// backend/models/Candidate.js
class Candidate {
  constructor(id, name, party, symbol = '') {
    this.id = id;
    this.name = name;
    this.party = party;
    this.symbol = symbol;
    this.voteCount = 0;
    this.createdAt = new Date();
  }

  // Validate candidate data
  static validateCandidate(name, party) {
    if (!name || name.trim() === '') {
      throw new Error('Candidate name is required');
    }
    if (!party || party.trim() === '') {
      throw new Error('Party name is required');
    }
    if (name.length > 100) {
      throw new Error('Candidate name too long');
    }
    if (party.length > 100) {
      throw new Error('Party name too long');
    }
    return true;
  }

  // Format party name (Indian political parties)
  static getPartySymbol(partyName) {
    const partySymbols = {
      'BJP': '🪷',
      'DMK': '🌄',
      'ADMK': '🍃'
    };
    return partySymbols[partyName] || '●';
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      party: this.party,
      symbol: this.symbol,
      voteCount: this.voteCount
    };
  }
}

module.exports = Candidate;
