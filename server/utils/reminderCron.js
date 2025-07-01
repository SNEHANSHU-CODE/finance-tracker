const reminderService = require('../services/reminderService');
const emailService = require('../services/emailService');

function shouldSendNow(reminderDate) {
  const now = new Date();
  const diffInMinutes = Math.floor((reminderDate - now) / (60 * 1000));

  const is30MinBefore = diffInMinutes >= 0 && diffInMinutes <= 5;
  const isToday = reminderDate.toDateString() === now.toDateString();
  const isLaterToday = reminderDate > new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30);
  const isNineAM = now.getHours() === 9 && now.getMinutes() < 5;

  return is30MinBefore || (isToday && isLaterToday && isNineAM);
}

async function sendReminderEmails() {
  try {
    const reminders = await reminderService.getUpcomingReminders();

    for (const reminder of reminders) {
      const { userId, title, date } = reminder;

      if (!userId?.email) continue;
      if (!shouldSendNow(date)) continue;

      await emailService.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: userId.email,
        subject: `Reminder: ${title}`,
        html: `<p>This is a reminder for: <strong>${title}</strong><br>Date: ${new Date(date).toLocaleString()}</p>`
      });

      console.log(`Email sent to ${userId.email} for reminder "${title}"`);
    }
  } catch (err) {
    console.error('Custom cron error:', err.message);
  }
}

// Run every 5 minutes (300000ms)
function startCustomReminderCron() {
  console.log('Reminder Cron Started');
  setInterval(sendReminderEmails, 5 * 60 * 1000);
}

module.exports = startCustomReminderCron;
