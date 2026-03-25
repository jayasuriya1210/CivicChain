const { mongoose, isUsingMemoryDB, getInMemoryDB } = require('./db-connection');

const verificationSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  voterId: {
    type: String,
    required: true,
    index: true
  },
  voterDetails: {
    name: String,
    voterId: String,
    photoUrl: String,
    constituency: String,
    boothId: String
  },
  boothId: {
    type: String,
    required: true,
    index: true
  },
  scannerId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'voting', 'completed'],
    default: 'pending',
    index: true
  },
  adminId: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  verifiedAt: {
    type: Date,
    required: false
  },
  rejectionReason: {
    type: String,
    required: false
  },
  voteCastAt: {
    type: Date,
    required: false
  }
});

// Index for faster queries
verificationSessionSchema.index({ sessionId: 1 });
verificationSessionSchema.index({ voterId: 1 });
verificationSessionSchema.index({ boothId: 1 });
verificationSessionSchema.index({ status: 1 });
verificationSessionSchema.index({ createdAt: -1 });

const MongoVerificationSession = mongoose.model('VerificationSession', verificationSessionSchema);

function matchesFilter(record, filter) {
  for (const key in filter) {
    const expected = filter[key];
    const actual = record[key];

    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('$in' in expected) {
        if (!expected.$in.includes(actual)) return false;
        continue;
      }
      if ('$gte' in expected && !(actual >= expected.$gte)) return false;
      if ('$lte' in expected && !(actual <= expected.$lte)) return false;
      continue;
    }

    if (actual !== expected) return false;
  }
  return true;
}

class InMemorySessionQueryBuilder {
  constructor(results) {
    this._results = results;
    this._limit = null;
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

  limit(n) {
    this._limit = parseInt(n, 10);
    return this;
  }

  then(resolve, reject) {
    try {
      let results = this._results;
      if (this._limit !== null && !Number.isNaN(this._limit)) {
        results = results.slice(0, this._limit);
      }
      resolve(results.map((s) => new VerificationSessionDocument(s)));
    } catch (error) {
      reject(error);
    }
  }
}

// Enhanced verification session object for in-memory DB with save() method
class VerificationSessionDocument {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const existing = await db.findVerificationSessionById(this.sessionId);
      if (existing) {
        await db.updateVerificationSession(this.sessionId, this);
      } else {
        await db.createVerificationSession(this);
      }
      return this;
    }
    return this;
  }

  toObject() {
    const obj = {};
    for (let key in this) {
      obj[key] = this[key];
    }
    return obj;
  }

  toJSON() {
    return this.toObject();
  }
}

// Wrapper class for both MongoDB and In-Memory DB
class VerificationSessionWrapper {
  static async findOne(filter) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      let session = null;
      if (filter.sessionId) {
        session = await db.findVerificationSessionById(filter.sessionId);
      } else {
        const sessions = Object.values(db.verificationSessions || {});
        for (const s of sessions) {
          if (matchesFilter(s, filter)) {
            session = s;
            break;
          }
        }
      }
      return session ? new VerificationSessionDocument(session) : null;
    }
    return await MongoVerificationSession.findOne(filter);
  }

  static find(filter = {}) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const sessions = Object.values(db.verificationSessions || {});
      let results = sessions;
      if (Object.keys(filter).length > 0) {
        results = sessions.filter((s) => matchesFilter(s, filter));
      }
      return new InMemorySessionQueryBuilder(results);
    }
    return MongoVerificationSession.find(filter);
  }

  static async countDocuments(filter = {}) {
    if (isUsingMemoryDB()) {
      const sessions = Object.values(getInMemoryDB().verificationSessions || {});
      if (Object.keys(filter).length === 0) return sessions.length;
      return sessions.filter((s) => matchesFilter(s, filter)).length;
    }
    return await MongoVerificationSession.countDocuments(filter);
  }

  static async create(data) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const session = await db.createVerificationSession(data);
      return new VerificationSessionDocument(session);
    }
    return await MongoVerificationSession.create(data);
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const updateData = update.$set || update;
      const session = await db.updateVerificationSession(id, updateData);
      return session ? new VerificationSessionDocument(session) : null;
    }
    return await MongoVerificationSession.findByIdAndUpdate(id, update, options);
  }

  static async updateOne(filter, update) {
    if (isUsingMemoryDB()) {
      const sessions = Object.values(getInMemoryDB().verificationSessions || {});
      const session = sessions.find((s) => matchesFilter(s, filter));
      if (session) {
        const updateData = update.$set || update;
        Object.assign(session, updateData);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
    return await MongoVerificationSession.updateOne(filter, update);
  }

  static async deleteMany(filter = {}) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const sessions = db.verificationSessions || {};
      let deleted = 0;
      for (const [id, session] of Object.entries(sessions)) {
        if (Object.keys(filter).length === 0 || matchesFilter(session, filter)) {
          delete sessions[id];
          deleted += 1;
        }
      }
      return { deletedCount: deleted };
    }
    return await MongoVerificationSession.deleteMany(filter);
  }
}

module.exports = VerificationSessionWrapper;
