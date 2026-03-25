const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const faceRoutes = require('./routes/face');
const voteRoutes = require('./routes/vote');
const adminRoutes = require('./routes/admin');
const qrRoutes = require('./routes/qr');

app.use('/api/auth', authRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/vote', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qr', qrRoutes);

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Catch-all route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔗 New WebSocket connection');
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

// Broadcast function to send updates to all connected clients
global.broadcastUpdate = (type, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: type,
        data: data,
        timestamp: new Date()
      }));
    }
  });
};

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔗 WebSocket ready at ws://localhost:${PORT}`);
  console.log(`📊 Backend ready for voting system`);
});
