require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');

const allowedOrigins = [
  'http://localhost:5173',
  'https://shoe-pos.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

// Connect DB
connectDB();

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use(requestLogger);
app.use('/uploads', express.static('uploads'));

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// Socket.io
io.on('connection', (socket) => {
  logger.info(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => logger.info(`🔌 Client disconnected: ${socket.id}`));
});
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/expenses', require('./routes/expenses'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`❌ Port ${PORT} is already in use! The server is already running in another terminal or process.`);
  } else {
    logger.error(`❌ Server error: ${err.message}`);
  }
  process.exit(1);
});

server.listen(PORT, () => logger.info(`🚀 Server running on port ${PORT}`));
