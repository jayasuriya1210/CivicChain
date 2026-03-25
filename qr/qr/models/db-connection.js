const mongoose = require('mongoose');
const { getInMemoryDB } = require('./in-memory-db');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/voting-system';
let useInMemoryDB = process.env.USE_MEMORY_DB === 'true';
let inMemoryDB = null;

const connectDB = async () => {
  try {
    // Try MongoDB connection first
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });
    console.log('✓ MongoDB connected successfully');
    useInMemoryDB = false;
    return mongoose.connection;
  } catch (error) {
    console.warn('⚠ MongoDB connection failed:', error.message);
    console.log('💾 Falling back to in-memory storage...');
    
    // Fallback to in-memory database
    useInMemoryDB = true;
    inMemoryDB = getInMemoryDB();
    
    console.log('✓ In-memory database initialized');
    
    return {
      readyState: 1,
      collection: {},
      inMemoryDB: true
    };
  }
};

const isUsingMemoryDB = () => {
  return useInMemoryDB;
};

const getDB = () => {
  if (useInMemoryDB) {
    return getInMemoryDB();
  }
  return mongoose;
};

module.exports = { 
  connectDB, 
  mongoose,
  getInMemoryDB,
  isUsingMemoryDB,
  getDB
};
