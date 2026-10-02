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

/**
 * App
 * Object-Oriented Express Server application wrapper.
 * Encapsulates middleware registration, routing, websocket management, and lifecycle hooks.
 */
class App {
  constructor(port = process.env.PORT || 5000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.allowedOrigins = [
      'http://localhost:5173',
      'https://shoe-pos.vercel.app',
      process.env.CLIENT_URL,
    ].filter(Boolean);

    this.io = new Server(this.server, {
      cors: {
        origin: this.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
  }

  async initializeDatabase() {
    await connectDB();
  }

  initializeMiddlewares() {
    // Security & Utility Middleware
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
      })
    );

    this.app.use(
      cors({
        origin: this.allowedOrigins,
        credentials: true,
      })
    );

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    }

    this.app.use(requestLogger);
    this.app.use('/uploads', express.static('uploads'));

    // Apply rate limiter to all API endpoints
    this.app.use('/api', apiLimiter);
  }

  initializeSocket() {
    this.io.on('connection', (socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);
      socket.on('disconnect', () => logger.info(`🔌 Client disconnected: ${socket.id}`));
    });

    // Provide io on express app for easy access in controllers
    this.app.set('io', this.io);
  }

  initializeRoutes() {
    // API Routes
    this.app.use('/api/auth', require('./routes/auth'));
    this.app.use('/auth', require('./routes/auth')); // Alias for direct /auth requests
    this.app.use('/api/products', require('./routes/products'));
    this.app.use('/api/orders', require('./routes/orders'));
    this.app.use('/api/customers', require('./routes/customers'));
    this.app.use('/api/suppliers', require('./routes/suppliers'));
    this.app.use('/api/dashboard', require('./routes/dashboard'));
    this.app.use('/api/settings', require('./routes/settings'));
    this.app.use('/api/activity', require('./routes/activity'));
    this.app.use('/api/expenses', require('./routes/expenses'));

    // Health check
    this.app.get('/api/health', (req, res) =>
      res.json({ status: 'OK', timestamp: new Date().toISOString() })
    );
  }

  initializeErrorHandling() {
    this.app.use(errorHandler);
  }

  listen() {
    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${this.port} is already in use! The server is already running in another terminal or process.`);
      } else {
        logger.error(`❌ Server error: ${err.message}`);
      }
      process.exit(1);
    });

    return this.server.listen(this.port, () => {
      logger.info(`🚀 Server running on port ${this.port}`);
    });
  }

  async start() {
    await this.initializeDatabase();
    this.initializeMiddlewares();
    this.initializeSocket();
    this.initializeRoutes();
    this.initializeErrorHandling();
    return this.listen();
  }
}

module.exports = App;
