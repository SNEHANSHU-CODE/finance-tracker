const express = require('express');
const { oauth2Client, getAuthUrl } = require('../utils/googleOAuth');
const googleRouter = express.Router();

const { saveGoogleTokens } = require('../utils/googleTokenCache');
const { authenticateToken } = require('../middleware/auth');

googleRouter.post('/', authenticateToken, (req, res) => {
  const url = getAuthUrl();
  res.status(200).json({ url });
});

googleRouter.get('/auth', authenticateToken, (req, res) => {
  res.redirect(getAuthUrl());
});

googleRouter.get('/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);

    const userId = req.userId;
    console.log('User ID from token:', req.userId);

    oauth2Client.setCredentials(tokens);

    // ✅ Save access_token in Redis
    if (tokens.access_token) {
      await redisService.set(
        `google_access_token:${userId}`,
        tokens.access_token,
        3600 // expires in 1 hour
      );
    }

    // ✅ Save refresh_token in authModel
    if (tokens.refresh_token) {
      await Auth.findOneAndUpdate(
        { userId },
        { googleRefreshToken: tokens.refresh_token },
        { upsert: true }
      );
    }

    res.redirect('http://localhost:5173/reminders?googleConnected=true');
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect('http://localhost:5173/reminders?googleConnected=false');
  }
});


module.exports = googleRouter;
