const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { redisService } = require('./config/redis');
const emailService = require('./services/emailService');
const reminderService = require('./services/reminderService');

// Importing all Routes
const authRoutes = require('./routes/authRoutes');
const resetPasswordRoutes = require('./routes/resetPasswordRoute');
const transactionRoutes = require('./routes/transactionRoutes');
const goalRouter = require('./routes/goalRoutes');
const analyticsRouter = require('./routes/analyticsRoutes');
const reminderRouter = require('./routes/reminderRoutes');
const googleRouter = require('./routes/googleRoutes');
const settingsRouter = require('./routes/settingsRoutes');

// Load .env
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://finance-tracker-ialp.onrender.com',
    'https://financetracker.space',
    'http://financetracker.space'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser()); 


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reset', resetPasswordRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/goals', goalRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reminders', reminderRouter);
app.use('/api/google', googleRouter);
app.use('/api/settings', settingsRouter);

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

//Send reminder in every 5 min
function startReminderChecker() {
  console.log('Reminder email service started...');
  setInterval(() => {
  try {
    reminderService.checkAndSendReminders();
  } catch (err) {
    console.error('Reminder check failed (unhandled):', err);
  }
}, 5 * 60 * 1000);
}

startReminderChecker();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));