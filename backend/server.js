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
const connectDB = require('./config/db');
const User = require('./models/User');
connectDB();

const app = express();
const server = http.createServer(app);

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
    return next(new Error('Authentication required'));
  }
  try {
    const admin = require('./config/firebase');
    const decodedFirebase = await admin.auth().verifyIdToken(token);
    const user = await User.findOne({ firebaseUID: decodedFirebase.uid }).select('_id');
    if (!user) {
      return next(new Error('User not found'));
    }
    socket.userId = user._id.toString();
    next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`Socket Connected (authenticated): ${userId}`);

  global.onlineUsers.set(userId, socket.id);

  User.findByIdAndUpdate(userId, { isOnline: true, lastActive: new Date() }).catch((err) =>
    console.error('Socket online status error:', err.message)
  );
  io.emit('userStatusChange', { userId, isOnline: true });

  socket.on('disconnect', async () => {
    for (const [uid, sid] of global.onlineUsers.entries()) {
      if (sid === socket.id) {
        global.onlineUsers.delete(uid);
        User.findByIdAndUpdate(uid, { isOnline: false, lastActive: new Date() }).catch((err) =>
          console.error('Socket offline status error:', err.message)
        );
        io.emit('userStatusChange', { userId: uid, isOnline: false });
        break;
      }
    }
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

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Social Media API is running smoothly',
    uptime: process.uptime(),
    dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][require('mongoose').connection.readyState],
  });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`Error: ${err.message}${err.stack ? '\n' + err.stack : ''}`);
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the conflicting process or set PORT to a different value.`);
    process.exit(1);
  }
  throw err;
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed');
    require('mongoose').connection.close(false).then(() => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
  setTimeout(() => {
    console.error('Forced shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
}
