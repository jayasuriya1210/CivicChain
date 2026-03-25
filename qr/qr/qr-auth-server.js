/**
 * QR Code Based Voting Authentication System
 * Main Server with Express and Socket.io
 */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const qrRoutes = require('./routes/qr-routes');
const boothRoutes = require('./routes/booth-routes');
const adminRoutes = require('./routes/admin-routes');
const votingRoutes = require('./routes/voting-routes');
const voterRoutes = require('./routes/voter-routes');

// Import Socket event handlers
const socketEvents = require('./utils/socket-events');

// Database connection
const { connectDB, isUsingMemoryDB } = require('./models/db-connection');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Attach IO to app for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ── Web page routes (serve HTML pages) ───────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/qr/display', (req, res) => res.sendFile(path.join(__dirname, 'public', 'qr-display.html')));
app.get('/booth/scanner', (req, res) => res.sendFile(path.join(__dirname, 'public', 'booth-scanner.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-login.html')));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html')));
app.get('/vote/screen', (req, res) => res.sendFile(path.join(__dirname, 'public', 'voting.html')));
app.get('/monitor/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'vote-monitor.html')));
app.get('/vote/success', (req, res) => res.sendFile(path.join(__dirname, 'public', 'vote-success.html')));

// ── Admin login (simple credential check) ────────────────────
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'admin123';
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ success: true, message: 'Login successful', token: 'admin-session-ok' });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// ── API Routes ────────────────────────────────────────────────
app.use('/qr', qrRoutes);
app.use('/booth', boothRoutes);
app.use('/admin', adminRoutes);
app.use('/vote', votingRoutes);
app.use('/voter', voterRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbMode = isUsingMemoryDB() ? 'In-Memory' : 'MongoDB';
  res.json({
    status: 'OK',
    timestamp: new Date(),
    database: dbMode,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mode: dbMode === 'In-Memory' ? 'Development (No persistence)' : 'Production (MongoDB)'
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket.io] New connection: ${socket.id}`);

  // Admin joins dashboard
  socketEvents.handleAdminJoinDashboard(io, socket);

  // Booth joins
  socketEvents.handleBoothJoin(io, socket);

  // Voter joins session
  socketEvents.handleVoterJoinSession(io, socket);

  // Handle disconnection
  socketEvents.handleDisconnect(io, socket);

  socket.on('error', (error) => {
    console.error(`[Socket.io] Error on ${socket.id}:`, error);
  });
});

// Custom middleware for emitting events to Socket.io
app.io = io;

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Server startup
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const startServer = async () => {
  try {
    // Initialize database connection (with fallback to in-memory)
    await connectDB();

    const dbMode = isUsingMemoryDB() ? 'In-Memory Database' : 'MongoDB';

    server.listen(PORT, HOST, () => {
      console.log(`
╔════════════════════════════════════════════════╗
║  QR Code Voting Authentication System Started  ║
╚════════════════════════════════════════════════╝

🚀 Server running at: http://${HOST}:${PORT}
📡 Socket.io enabled
🗄️  Database: ${dbMode}
🔐 Environment: ${process.env.NODE_ENV || 'development'}

${isUsingMemoryDB() ? '⚠️  WARNING: Using in-memory database. All data will be lost on server restart!' : '✓ Connected to MongoDB'}

Available endpoints:
  - POST   /qr/generate-qr
  - GET    /qr/get-qr/:voterId
  - POST   /qr/regenerate-qr/:voterId
  - POST   /booth/scan-qr
  - GET    /booth/session-status/:sessionId
  - GET    /booth/pending-verifications/:boothId
  - POST   /admin/verify
  - GET    /admin/pending-verifications
  - GET    /admin/stats
  - GET    /admin/booth-stats
  - POST   /vote/cast
  - GET    /vote/stats
  - GET    /vote/record/:sessionId
  - GET    /vote/constituency-stats
  - POST   /voter/register
  - GET    /voter/:voterId
  - PUT    /voter/:voterId
  - DELETE /voter/:voterId
  - GET    /voter/list/all
  - GET    /voter/stats/summary
  - GET    /health

Press Ctrl+C to stop the server
  `);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down gracefully...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

