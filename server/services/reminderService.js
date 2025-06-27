const Reminder = require('../models/reminderModel');
const User = require('../models/userModel');
const { google } = require('googleapis');
const { oauth2Client } = require('../utils/googleOAuth');
const { getGoogleTokens, saveGoogleTokens } = require('../utils/googleTokenCache');

class ReminderService {
    async getReminders(userId) {
        return await Reminder.find({ userId }).sort({ date: 1 });
    }

    async createReminder(userId, data) {
  const { title, date } = data;

  let accessToken = await redisService.get(`google_access_token:${userId}`);

  if (!accessToken) {
    // Token expired or not in cache, refresh it
    const auth = await Auth.findOne({ userId });
    if (!auth?.googleRefreshToken) {
      throw new Error('Google Calendar not connected.');
    }

    oauth2Client.setCredentials({
      refresh_token: auth.googleRefreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    accessToken = credentials.access_token;

    // ✅ Cache new access_token
    await redisService.set(
      `google_access_token:${userId}`,
      accessToken,
      3600
    );
  }

  // Set token for Google API
  oauth2Client.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: title,
    start: { dateTime: new Date(date).toISOString() },
    end: { dateTime: new Date(new Date(date).getTime() + 30 * 60 * 1000).toISOString() }
  };

  const { data: createdEvent } = await calendar.events.insert({
    calendarId: 'primary',
    resource: event
  });

  // Save reminder in DB
  const reminder = new Reminder({
    userId,
    title,
    date,
    calendarEventId: createdEvent.id
  });

  await reminder.save();
  return reminder;
}

    async deleteReminder(reminderId, userId) {
        const reminder = await Reminder.findOneAndDelete({ _id: reminderId, userId });
        if (!reminder) throw new Error('Reminder not found');
        return reminder;
    }
}

module.exports = new ReminderService();
