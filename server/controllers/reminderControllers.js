// controllers/reminderControllers.js (Fixed)
const reminderService = require('../services/reminderService');

class ReminderController {
  async getReminders(req, res) {
    try {
      const userId = req.userId;
      const reminders = await reminderService.getReminders(userId);
      res.status(200).json({ success: true, reminders });
    } catch (error) {
      console.error('Get reminders error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async createReminder(req, res) {
    try {
      const userId = req.userId;
      const reminder = await reminderService.createReminder(userId, req.body);
      res.status(201).json({ success: true, reminder });
    } catch (error) {
      console.error('Create reminder error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateReminder(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const reminder = await reminderService.updateReminder(id, userId, req.body);
      res.status(200).json({ success: true, reminder });
    } catch (error) {
      console.error('Update reminder error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteReminder(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const reminder = await reminderService.deleteReminder(id, userId);
      res.status(200).json({ success: true, reminder });
    } catch (error) {
      console.error('Delete reminder error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new ReminderController();
