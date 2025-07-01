const Reminder = require('../models/reminderModel');

class ReminderService {
  async getReminders(userId) {
    try {
      const reminders = await Reminder.find({ userId }).sort({ date: 1 });
      return reminders;
    } catch (error) {
      throw new Error(`Failed to fetch reminders: ${error.message}`);
    }
  }

  async createReminder(userId, data) {
    try {
      const { title, date, description } = data;
      
      // Validate required fields
      if (!title || !date) {
        throw new Error('Title and date are required');
      }

      // Create new reminder
      const reminder = new Reminder({
        userId,
        title: title.trim(),
        date: new Date(date),
        description: description ? description.trim() : ''
      });

      const savedReminder = await reminder.save();
      return savedReminder;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(`Validation error: ${messages.join(', ')}`);
      }
      throw new Error(`Failed to create reminder: ${error.message}`);
    }
  }

  async updateReminder(reminderId, userId, data) {
    try {
      const { title, date, description } = data;

      // Find reminder and check ownership
      const reminder = await Reminder.findOne({ _id: reminderId, userId });
      
      if (!reminder) {
        throw new Error('Reminder not found or access denied');
      }

      // Update fields if provided
      if (title !== undefined) reminder.title = title.trim();
      if (date !== undefined) reminder.date = new Date(date);
      if (description !== undefined) reminder.description = description.trim();

      const updatedReminder = await reminder.save();
      return updatedReminder;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        throw new Error(`Validation error: ${messages.join(', ')}`);
      }
      throw new Error(`Failed to update reminder: ${error.message}`);
    }
  }

  async deleteReminder(reminderId, userId) {
    try {
      // Find and delete reminder with ownership check
      const reminder = await Reminder.findOneAndDelete({ 
        _id: reminderId, 
        userId 
      });

      if (!reminder) {
        throw new Error('Reminder not found or access denied');
      }

      return reminder;
    } catch (error) {
      throw new Error(`Failed to delete reminder: ${error.message}`);
    }
  }

  async getUpcomingReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime());
    const windowEnd = new Date(now.getTime() + 5 * 60 * 1000);

    return await Reminder.find({
      date: {
        $gte: windowStart,
        $lte: windowEnd
      }
    }).populate('userId', 'email');
  }

}

module.exports = new ReminderService();