const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { redisService } = require('./config/redis');
const emailService = require('./services/emailService');

// Importing all Routes
const authRoutes = require('./routes/authRoutes');
const resetPasswordRoutes = require('./routes/resetPasswordRoute');
const transactionRoutes = require('./routes/transactionRoutes');
const goalRouter = require('./routes/goalRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');

// Load .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://finance-tracker-ialp.onrender.com'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reset', resetPasswordRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/goals', goalRouter);
app.use('/api/analytics', analyticsRouter);

// Initialize Redis and start server
async function initializeRedis() {
  try {
    // Connect to Redis
    await redisService.connect();
    console.log('Redis connected successfully');

    // Verify email service
    const emailConnected = await emailService.verifyConnection();
    if (!emailConnected) {
      console.warn('Email service verification failed, but server will continue');
    }

  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    process.exit(1);
  }
}

// Setup graceful shutdown for Redis
redisService.setupGracefulShutdown();

// Initialize Redis when server starts
initializeRedis();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));