const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
const Goal = require('../models/goalModel');
const Reminder = require('../models/reminderModel');

/**
 * Guest Data Service
 * Merges guest user data into authenticated user account
 */
class GuestService {
  /**
   * Merge guest data into user account
   * @param {string} guestId - Guest user identifier (from localStorage)
   * @param {string} userId - Authenticated user ID
   */
  static async mergeGuestData(guestId, userId) {
    if (!guestId || !userId) {
      return;
    }

    try {
      // Transactions
      await Transaction.updateMany(
        { guestId, userId: { $exists: false } },
        { userId, guestId: null }
      );

      // Goals
      await Goal.updateMany(
        { guestId, userId: { $exists: false } },
        { userId, guestId: null }
      );

      // Reminders
      await Reminder.updateMany(
        { guestId, userId: { $exists: false } },
        { userId, guestId: null }
      );

      console.log(`Guest data merged: ${guestId} -> ${userId}`);
    } catch (error) {
      console.error('Guest data merge error:', error);
      throw error;
    }
  }
}

module.exports = GuestService;