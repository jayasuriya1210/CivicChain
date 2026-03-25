const { mongoose, isUsingMemoryDB, getInMemoryDB } = require('./db-connection');

const voterSchema = new mongoose.Schema(
  {
    voterId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false,
      default: ''
    },
    photoUrl: {
      type: String,
      required: false
    },
    constituency: {
      type: String,
      required: true,
      index: true
    },
    boothId: {
      type: String,
      required: true,
      index: true
    },
    hasVoted: {
      type: Boolean,
      default: false,
      index: true
    },
    status: {
      type: String,
      enum: ['registered', 'qr-generated', 'verified', 'voted', 'rejected'],
      default: 'registered',
      index: true
    },
    qrCodeToken: {
      type: String,
      required: false
    },
    qrCodeExpiry: {
      type: Date,
      required: false
    }
  },
  { timestamps: true }
);

voterSchema.index({ voterId: 1 });
voterSchema.index({ constituency: 1 });
voterSchema.index({ boothId: 1 });
voterSchema.index({ hasVoted: 1 });
voterSchema.index({ status: 1 });
voterSchema.index({ createdAt: -1 });

const MongoVoter = mongoose.model('Voter', voterSchema);

// ----------------------------------------------------------
// Document class: adds .save() and toObject/toJSON helpers
// ----------------------------------------------------------
class VoterDocument {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const existing = await db.findVoterByVoterId(this.voterId);
      if (existing) {
        await db.updateVoter(this.voterId, this);
      } else {
        await db.createVoter(this);
      }
      return this;
    }
    // For MongoDB, delegate to the Mongoose model
    const doc = await MongoVoter.findOneAndUpdate(
      { voterId: this.voterId },
      this,
      { new: true, upsert: true }
    );
    Object.assign(this, doc.toObject());
    return this;
  }

  toObject() {
    const obj = {};
    for (const key in this) {
      if (typeof this[key] !== 'function') {
        obj[key] = this[key];
      }
    }
    return obj;
  }

  toJSON() {
    return this.toObject();
  }
}

// ----------------------------------------------------------
// Helper: build a simple chainable query object for in-memory
// ----------------------------------------------------------
class InMemoryQueryBuilder {
  constructor(results) {
    this._results = results;
  }

  limit(n) {
    this._limit = parseInt(n);
    return this;
  }

  skip(n) {
    this._skip = parseInt(n);
    return this;
  }

  sort(sortObj) {
    if (sortObj && typeof sortObj === 'object') {
      const [key, order] = Object.entries(sortObj)[0];
      this._results = this._results.sort((a, b) => {
        if (a[key] < b[key]) return order === 1 ? -1 : 1;
        if (a[key] > b[key]) return order === 1 ? 1 : -1;
        return 0;
      });
    }
    return this;
  }

  // Make it thenable so `await builder` works
  then(resolve, reject) {
    try {
      let results = this._results;
      if (this._skip) results = results.slice(this._skip);
      if (this._limit) results = results.slice(0, this._limit);
      resolve(results.map(v => new VoterDocument(v)));
    } catch (e) {
      reject(e);
    }
  }
}

// ----------------------------------------------------------
// Wrapper: transparent MongoDB ↔ in-memory switch
// ----------------------------------------------------------
class VoterWrapper {
  static async findOne(filter) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      // Fast path for voterId lookups
      if (filter.voterId) {
        const voter = await db.findVoterByVoterId(filter.voterId);
        return voter ? new VoterDocument(voter) : null;
      }
      // Generic filter scan
      const voters = Object.values(db.voters || {});
      const found = voters.find(v => {
        for (const key in filter) {
          if (v[key] !== filter[key]) return false;
        }
        return true;
      });
      return found ? new VoterDocument(found) : null;
    }
    return await MongoVoter.findOne(filter);
  }

  static find(filter = {}) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      let voters = Object.values(db.voters || {});
      if (Object.keys(filter).length > 0) {
        voters = voters.filter(v => {
          for (const key in filter) {
            if (v[key] !== filter[key]) return false;
          }
          return true;
        });
      }
      return new InMemoryQueryBuilder(voters);
    }
    return MongoVoter.find(filter);
  }

  static async countDocuments(filter = {}) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const voters = Object.values(db.voters || {});
      if (Object.keys(filter).length === 0) return voters.length;
      return voters.filter(v => {
        for (const key in filter) {
          if (v[key] !== filter[key]) return false;
        }
        return true;
      }).length;
    }
    return await MongoVoter.countDocuments(filter);
  }

  static async create(data) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const voter = await db.createVoter(data);
      return new VoterDocument(voter);
    }
    return await MongoVoter.create(data);
  }

  static async updateOne(filter, update) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const voters = Object.values(db.voters || {});
      const voter = voters.find(v => {
        for (const key in filter) {
          if (v[key] !== filter[key]) return false;
        }
        return true;
      });
      if (voter) {
        const updateData = update.$set || update;
        await db.updateVoter(voter.voterId, updateData);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
    return await MongoVoter.updateOne(filter, update);
  }

  static async updateMany(filter, update) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const voters = Object.values(db.voters || {});
      let modifiedCount = 0;
      for (const voter of voters) {
        let match = true;
        for (const key in filter) {
          if (voter[key] !== filter[key]) {
            match = false;
            break;
          }
        }
        if (match) {
          const updateData = update.$set || update;
          await db.updateVoter(voter.voterId, updateData);
          modifiedCount += 1;
        }
      }
      return { modifiedCount };
    }
    return await MongoVoter.updateMany(filter, update);
  }

  static async findOneAndDelete(filter) {
    if (isUsingMemoryDB()) {
      const found = await VoterWrapper.findOne(filter);
      if (found) {
        const db = getInMemoryDB();
        await db.deleteVoter(found.voterId);
        return found;
      }
      return null;
    }
    return await MongoVoter.findOneAndDelete(filter);
  }
}

module.exports = VoterWrapper;
