/**
 * Token Cleanup Job
 * Removes expired/old refresh tokens to prevent unbounded document growth
 * Runs daily at 2 AM
 */

const cron = require('node-cron');
const User = require('../models/userModel');

const initializeTokenCleanupJob = () => {
  // Run every day at 2 AM
  // Format: minute hour day month day-of-week
  const job = cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Starting token cleanup job...');
      
      // Keep only tokens from the last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const result = await User.updateMany(
        { refreshTokens: { $exists: true } },
        {
          $pull: {
            refreshTokens: {
              createdAt: { $lt: sevenDaysAgo }
            }
          }
        }
      );
      
      console.log(`✅ Token cleanup completed: ${result.modifiedCount} users updated`);
      console.log(`   Removed all tokens older than ${sevenDaysAgo.toISOString()}`);
      
    } catch (error) {
      console.error('❌ Token cleanup job failed:', error.message);
    }
  });

  return job;
};

module.exports = { initializeTokenCleanupJob };
