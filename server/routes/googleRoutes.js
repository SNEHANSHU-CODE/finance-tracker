const express = require('express');
const { google } = require('googleapis');
const { oauth2Client, getAuthUrl } = require('../utils/googleOauth');
const { saveGoogleTokens } = require('../utils/googleTokenCache');
const User = require('../models/userModel');
const Reminder = require('../models/reminderModel');
const { authenticateToken } = require('../middleware/auth');

const googleRouter = express.Router();

// Save tokens to both Redis and MongoDB
const saveTokensComplete = async (userId, tokens) => {
  console.log('Saving tokens for user:', userId);
  console.log('Tokens received:', { 
    hasAccessToken: !!tokens.access_token,
    hasRefreshToken: !!tokens.refresh_token,
    expiryDate: tokens.expiry_date
  });

  try {
    // Save to Redis (access token + refresh token for quick access)
    if (tokens.access_token) {
      await saveGoogleTokens(userId, tokens);
    }

    // Save refresh token to MongoDB for persistence
    if (tokens.refresh_token) {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { googleRefreshToken: tokens.refresh_token },
        { new: true }
      );
      
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      console.log(`Refresh token saved to DB for user: ${userId}`);
    }
  } catch (error) {
    console.error('Error in saveTokensComplete:', error);
    throw error;
  }
};

const getAuthorizedClient = async (userId) => {
  try {
    // Try to get tokens from Redis first
    const { getGoogleTokens } = require('../utils/googleTokenCache');
    let tokens = await getGoogleTokens(userId);

    if (!tokens || !tokens.access_token) {
      console.log('No tokens in Redis, checking DB for refresh token...');
      
      // Fallback to DB refresh token
      const user = await User.findById(userId);
      if (!user || !user.googleRefreshToken) {
        throw new Error('Google tokens not found in Redis or DB. Please reconnect your Google account.');
      }

      // Use refresh token to get new access token
      oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken });
      
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        tokens = credentials;
        
        // Save the new tokens
        await saveGoogleTokens(userId, tokens);
        console.log('Access token refreshed and saved for user:', userId);
      } catch (refreshError) {
        console.error('Failed to refresh access token:', refreshError);
        throw new Error('Failed to refresh Google access token. Please reconnect your Google account.');
      }
    }

    // Set credentials and return calendar client
    oauth2Client.setCredentials(tokens);
    
    // Verify the token is still valid by making a test call
    try {
      await oauth2Client.getAccessToken();
    } catch (tokenError) {
      console.error('Token validation failed:', tokenError);
      throw new Error('Google access token is invalid. Please reconnect your Google account.');
    }

    return google.calendar({ version: 'v3', auth: oauth2Client });
  } catch (error) {
    console.error('Error in getAuthorizedClient:', error);
    throw error;
  }
};

const syncAllRemindersToGoogle = async (userId) => {
  try {
    console.log(`Starting Google Calendar sync for user: ${userId}`);
    const calendar = await getAuthorizedClient(userId);
    const reminders = await Reminder.find({ userId });

    console.log(`Found ${reminders.length} reminders to sync`);

    for (const reminder of reminders) {
      if (!reminder.calendarEventId) {
        try {
          const event = {
            summary: reminder.title,
            description: reminder.description || '',
            start: { 
              dateTime: new Date(reminder.date).toISOString(),
              timeZone: 'Asia/Kolkata'
            },
            end: { 
              dateTime: new Date(new Date(reminder.date).getTime() + 60 * 60 * 1000).toISOString(),
              timeZone: 'Asia/Kolkata'
            },
          };

          const { data } = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
          });

          reminder.calendarEventId = data.id;
          await reminder.save();
          
          console.log(`Synced reminder "${reminder.title}" to Google Calendar`);
        } catch (syncError) {
          console.error(`Failed to sync reminder "${reminder.title}":`, syncError.message);
        }
      }
    }
    
    console.log('Google Calendar sync completed');
  } catch (error) {
    console.error('Error in syncAllRemindersToGoogle:', error);
    throw error;
  }
};

// Step 1: Frontend requests Google OAuth URL
googleRouter.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.userId.toString(); // Convert ObjectId to string
    console.log('Generating OAuth URL for user:', userId);
    
    const url = getAuthUrl(userId); // userId goes into 'state'
    res.status(200).json({ success: true, url });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ success: false, message: 'Failed to generate OAuth URL' });
  }
});

// Optional: Server-initiated redirect
googleRouter.get('/auth', authenticateToken, (req, res) => {
  try {
    const userId = req.userId.toString(); // Convert ObjectId to string
    const url = getAuthUrl(userId);
    res.redirect(url);
  } catch (error) {
    console.error('Error in OAuth redirect:', error);
    res.status(500).json({ success: false, message: 'OAuth redirect failed' });
  }
});

// Step 2: Google redirects back after user grants access
googleRouter.get('/callback', async (req, res) => {
  try {
    const { code, state: userId, error: oauthError } = req.query;
    
    // Check for OAuth errors
    if (oauthError) {
      console.error('OAuth error:', oauthError);
      return res.redirect('http://localhost:5173/dashboard/reminders?googleConnected=false&error=oauth_denied');
    }

    if (!code) {
      console.error('No authorization code received');
      return res.redirect('http://localhost:5173/dashboard/reminders?googleConnected=false&error=no_code');
    }

    if (!userId) {
      console.error('No user ID in state parameter');
      return res.redirect('http://localhost:5173/dashboard/reminders?googleConnected=false&error=invalid_state');
    }

    console.log('Processing OAuth callback for user:', userId);
    console.log('State parameter received:', typeof userId, userId);

    // Validate that userId is a valid ObjectId string
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid user ID format in state parameter:', userId);
      return res.redirect('http://localhost:5173/dashboard/reminders?googleConnected=false&error=invalid_user_id');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Received tokens from Google:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    });

    // Save tokens to both Redis and DB
    await saveTokensComplete(userId, tokens);

    // Set credentials for immediate use
    oauth2Client.setCredentials(tokens);

    // Sync existing reminders to Google Calendar
    await syncAllRemindersToGoogle(userId);

    console.log('Google OAuth flow completed successfully for user:', userId);
    res.redirect('http://localhost:5173/dashboard/reminders?googleConnected=true');
    
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect(`http://localhost:5173/dashboard/reminders?googleConnected=false&error=${encodeURIComponent(error.message)}`);
  }
});

// Route to check Google connection status
googleRouter.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId.toString(); // Convert ObjectId to string
    const { getGoogleTokens } = require('../utils/googleTokenCache');
    
    // Check Redis for tokens
    const tokens = await getGoogleTokens(userId);
    const hasRedisTokens = !!(tokens && tokens.access_token);
    
    // Check DB for refresh token
    const user = await User.findById(userId);
    const hasRefreshToken = !!(user && user.googleRefreshToken);
    
    const isConnected = hasRedisTokens || hasRefreshToken;
    
    res.json({
      success: true,
      connected: isConnected,
      hasAccessToken: hasRedisTokens,
      hasRefreshToken: hasRefreshToken
    });
  } catch (error) {
    console.error('Error checking Google connection status:', error);
    res.status(500).json({ success: false, message: 'Failed to check connection status' });
  }
});

// Route to disconnect Google account
googleRouter.delete('/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId.toString(); // Convert ObjectId to string
    
    // Remove from Redis
    const { deleteGoogleTokens } = require('../utils/googleTokenCache');
    await deleteGoogleTokens(userId);
    
    // Remove refresh token from DB
    await User.findByIdAndUpdate(userId, { googleRefreshToken: null });
    
    console.log('Google account disconnected for user:', userId);
    res.json({ success: true, message: 'Google account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Google account:', error);
    res.status(500).json({ success: false, message: 'Failed to disconnect Google account' });
  }
});

module.exports = googleRouter;