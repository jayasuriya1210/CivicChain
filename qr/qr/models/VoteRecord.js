const { mongoose, isUsingMemoryDB, getInMemoryDB } = require('./db-connection');

const voteRecordSchema = new mongoose.Schema({
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
  candidateId: {
    type: String,
    required: true,
    index: true
  },
  candidateName: {
    type: String,
    required: false
  },
  partyName: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  deviceInfo: {
    type: String,
    required: false
  },
  verificationHash: {
    type: String,
    required: false
  }
});

// Index for faster queries
voteRecordSchema.index({ sessionId: 1 });
voteRecordSchema.index({ voterId: 1 });
voteRecordSchema.index({ boothId: 1 });
voteRecordSchema.index({ timestamp: -1 });
voteRecordSchema.index({ constituency: 1 });

const MongoVoteRecord = mongoose.model('VoteRecord', voteRecordSchema);

// Enhanced vote record object for in-memory DB with save() method
class VoteRecordDocument {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      await db.createVoteRecord(this);
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
class VoteRecordWrapper {
  static async findOne(filter) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      let record = null;
      if (filter.sessionId) {
        record = await db.findVoteRecordBySessionId(filter.sessionId);
      } else {
        const records = Object.values(db.voteRecords || {});
        for (let r of records) {
          let match = true;
          for (let key in filter) {
            if (r[key] !== filter[key]) {
              match = false;
              break;
            }
          }
          if (match) {
            record = r;
            break;
          }
        }
      }
      return record ? new VoteRecordDocument(record) : null;
    }
    return await MongoVoteRecord.findOne(filter);
  }

  static async find(filter = {}) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      let records;
      if (filter.boothId) {
        records = await db.findVoteRecordsByBoothId(filter.boothId);
      } else {
        records = Object.values(db.voteRecords || {});
        if (Object.keys(filter).length > 0) {
          records = records.filter(r => {
            for (let key in filter) {
              if (r[key] !== filter[key]) return false;
            }
            return true;
          });
        }
      }
      return records.map(r => new VoteRecordDocument(r));
    }
    return await MongoVoteRecord.find(filter);
  }

  static async countDocuments(filter = {}) {
    if (isUsingMemoryDB()) {
      const records = Object.values(getInMemoryDB().voteRecords || {});
      if (Object.keys(filter).length === 0) return records.length;
      return records.filter(r => {
        for (let key in filter) {
          if (r[key] !== filter[key]) return false;
        }
        return true;
      }).length;
    }
    return await MongoVoteRecord.countDocuments(filter);
  }

  static async create(data) {
    if (isUsingMemoryDB()) {
      const db = getInMemoryDB();
      const record = await db.createVoteRecord(data);
      return new VoteRecordDocument(record);
    }
    return await MongoVoteRecord.create(data);
  }

  static async updateOne(filter, update) {
    if (isUsingMemoryDB()) {
      const records = Object.values(getInMemoryDB().voteRecords || {});
      const record = records.find(r => {
        for (let key in filter) {
          if (r[key] !== filter[key]) return false;
        }
        return true;
      });
      if (record) {
        const updateData = update.$set || update;
        Object.assign(record, updateData);
        return { modifiedCount: 1 };
      }
      return { modifiedCount: 0 };
    }
    return await MongoVoteRecord.updateOne(filter, update);
  }
}

module.exports = VoteRecordWrapper;
