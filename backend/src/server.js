const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const config = require('./config/env');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const walletRoutes = require('./routes/wallet.routes');
const gameRoutes = require('./routes/game.routes');
const matchRoutes = require('./routes/match.routes');
const friendRoutes = require('./routes/friend.routes');
const adminRoutes = require('./routes/admin.routes');
const partnerRoutes = require('./routes/partner.routes');
const paymentRoutes = require('./routes/payment.routes');

// Socket handlers
const { setupGameSocket } = require('./socket/gameSocket');
const { setupMatchSocket } = require('./socket/matchSocket');
const { setupNotificationSocket } = require('./socket/notificationSocket');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// Make io accessible in routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// Socket setup
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  setupGameSocket(io, socket);
  setupMatchSocket(io, socket);
  setupNotificationSocket(io, socket);
  
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(config.port, () => {
      console.log(`PlayZip Server running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
