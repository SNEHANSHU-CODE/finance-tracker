const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/google/callback'
);


const getAuthUrl = (state) => {
  const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state
  });
};

module.exports = { oauth2Client, getAuthUrl };