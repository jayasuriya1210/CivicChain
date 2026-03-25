const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Data file for persistent voters
const dataDir = path.join(__dirname, '..', 'data');
const votersFile = path.join(dataDir, 'voters.json');

// Global storage for sessions
const sessions = {};
const voters = {};

// Ensure data directory exists and load voters from file
function loadVoters() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(votersFile)) {
      const raw = fs.readFileSync(votersFile, 'utf8');
      const parsed = JSON.parse(raw || '{}');
      Object.assign(voters, parsed);
      console.log('Loaded', Object.keys(voters).length, 'voters from disk');
    } else {
      // create empty file
      fs.writeFileSync(votersFile, JSON.stringify({}, null, 2));
      console.log('Created voters.json');
    }
  } catch (err) {
    console.error('Error loading voters file:', err.message);
  }
}

function saveVoters() {
  try {
    fs.writeFileSync(votersFile, JSON.stringify(voters, null, 2));
  } catch (err) {
    console.error('Error saving voters file:', err.message);
  }
}

// Load voters immediately
loadVoters();

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Admin token verification failed:', error.message);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = {
  verifyToken,
  adminAuth,
  sessions,
  voters,
  saveVoters,
  JWT_SECRET
};
