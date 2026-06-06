require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
connectDB();

const app = express();
const server = http.createServer(app);

// MongoDB Connection Event Logging
mongoose.connection.on('connected', () => {
  console.log('[MongoDB] Connected to database');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected from database');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected to database');
});

// Handle MongoDB save failures globally
mongoose.connection.on('close', () => {
  console.warn('[MongoDB] Connection closed');
});

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

global.io = io;
global.onlineUsers = new Map();

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    console.error('[Socket Auth] No token provided');
    return next(new Error('Authentication required'));
  }
  try {
    const admin = require('./config/firebase');
    const decodedFirebase = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUID: decodedFirebase.uid }).select('_id');
    if (!user) {
      console.error('[Socket Auth] User not found for Firebase UID:', decodedFirebase.uid);
      return next(new Error('User not found'));
    }
    socket.userId = user._id.toString();
    next();
  } catch (err) {
    console.error('[Socket Auth] Token verification failed:', err.message);
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`[Socket] User connected: ${userId} (socket: ${socket.id})`);

  socket.join(`user:${userId}`)
  global.onlineUsers.set(userId, socket.id);

  User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() }).catch((err) =>
    console.error('[Socket] Online status update error:', err.message)
  );
  io.emit('userStatusChange', { userId, isOnline: true });

  socket.on('disconnect', async (reason) => {
    console.log(`[Socket] User disconnected: ${userId} (reason: ${reason})`);
    for (const [uid, sid] of global.onlineUsers.entries()) {
      if (sid === socket.id) {
        global.onlineUsers.delete(uid);
        User.findByIdAndUpdate(uid, { isOnline: false, lastActive: new Date() }).catch((err) =>
          console.error('[Socket] Offline status update error:', err.message)
        );
        io.emit('userStatusChange', { userId: uid, isOnline: false });
        break;
      }
    }
  });

  socket.on('joinConversation', ({ conversationId }) => {
    if (conversationId) {
      socket.join(`conversation:${conversationId}`);
    }
  });

  socket.on('leaveConversation', ({ conversationId }) => {
    if (conversationId) {
      socket.leave(`conversation:${conversationId}`);
    }
  });

  socket.on('typingStart', ({ conversationId }) => {
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('typingStart', {
        conversationId,
        userId,
      });
    }
  });

  socket.on('typingStop', ({ conversationId }) => {
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('typingStop', {
        conversationId,
        userId,
      });
    }
  });

  socket.on('messageSeen', ({ conversationId }) => {
    if (conversationId) {
      socket.to(`conversation:${conversationId}`).emit('messageSeen', {
        conversationId,
        userId,
      });
    }
  });

  socket.on('error', (err) => {
    console.error('[Socket] Error:', err.message);
  });
});

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(compression());

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(mongoSanitize());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[Slow Request] ${req.method} ${req.originalUrl} - ${duration}ms`);
    }
  });
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Social Media API is running smoothly',
    uptime: process.uptime(),
    dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
  });
});

// Error handling for MongoDB save failures
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    console.error('[MongoDB Validation Error]', err.message);
    return res.status(400).json({ message: 'Validation error', details: err.message });
  }
  if (err.name === 'MongoServerError' && err.code === 11000) {
    console.error('[MongoDB Duplicate Key Error]', err.message);
    return res.status(409).json({ message: 'Duplicate entry', field: Object.keys(err.keyValue)[0] });
  }
  if (err.name === 'CastError') {
    console.error('[MongoDB Cast Error]', err.message);
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next(err);
});

app.use((req, res) => {
  console.warn(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global error handler with comprehensive logging
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const errorLog = {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };
  
  // Log different error types differently
  if (err.name === 'UnauthorizedError' || err.message.includes('Unauthorized')) {
    console.warn('[Auth Error]', errorLog);
  } else if (err.name === 'MongoError' || err.name === 'MongooseError') {
    console.error('[MongoDB Error]', errorLog);
  } else if (err.message.includes('Socket') || err.message.includes('socket')) {
    console.error('[Socket Error]', errorLog);
  } else {
    console.error(`[Server Error ${statusCode}]`, errorLog);
  }
  
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[Server] Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server] Port ${PORT} is already in use. Stop the conflicting process or set PORT to a different value.`);
    process.exit(1);
  }
  console.error('[Server] Fatal error:', err);
  throw err;
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

function gracefulShutdown(signal) {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    mongoose.connection.close(false).then(() => {
      console.log('[Server] MongoDB connection closed');
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error('[Server] Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
}
