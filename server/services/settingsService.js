const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const settingsService = {
  // Get user preferences
  getUserPreferences: async (userId) => {
    try {
      const user = await User.findById(userId).select('preferences');
      if (!user) {
        throw new Error('User not found');
      }
      
      return user.preferences;
    } catch (error) {
      throw new Error(`Failed to fetch user preferences: ${error.message}`);
    }
  },

  // Update user preferences
  updateUserPreferences: async (userId, preferencesData) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate preference values
      const allowedCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'];
      const allowedLanguages = ['en', 'hi', 'es', 'fr', 'de', 'it'];
      const allowedThemes = ['light', 'dark', 'auto'];

      const updateData = {};

      if (preferencesData.currency !== undefined) {
        if (!allowedCurrencies.includes(preferencesData.currency)) {
          throw new Error(`Invalid currency. Allowed values: ${allowedCurrencies.join(', ')}`);
        }
        updateData['preferences.currency'] = preferencesData.currency;
      }

      if (preferencesData.language !== undefined) {
        if (!allowedLanguages.includes(preferencesData.language)) {
          throw new Error(`Invalid language. Allowed values: ${allowedLanguages.join(', ')}`);
        }
        updateData['preferences.language'] = preferencesData.language;
      }

      if (preferencesData.theme !== undefined) {
        if (!allowedThemes.includes(preferencesData.theme)) {
          throw new Error(`Invalid theme. Allowed values: ${allowedThemes.join(', ')}`);
        }
        updateData['preferences.theme'] = preferencesData.theme;
      }

      // Update user preferences
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('preferences');

      return updatedUser.preferences;
    } catch (error) {
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  },

  // Reset user preferences to default
  resetUserPreferences: async (userId) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const defaultPreferences = {
        currency: 'INR',
        language: 'en',
        theme: 'light'
      };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { preferences: defaultPreferences } },
        { new: true, runValidators: true }
      ).select('preferences');

      return updatedUser.preferences;
    } catch (error) {
      throw new Error(`Failed to reset preferences: ${error.message}`);
    }
  },

  // Get active sessions (refresh tokens)
  getActiveSessions: async (userId) => {
    try {
      const user = await User.findById(userId).select('refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      // Format sessions with decoded info
      const sessions = user.refreshTokens.map((tokenObj, index) => {
        try {
          // Decode token to get session info (without verification for display purposes)
          const decoded = jwt.decode(tokenObj.token);
          return {
            id: tokenObj._id,
            sessionIndex: index,
            createdAt: tokenObj.createdAt,
            expiresAt: new Date(tokenObj.createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 days
            userAgent: decoded?.userAgent || 'Unknown',
            ip: decoded?.ip || 'Unknown',
            isCurrentSession: false // Will be set by comparing with current token
          };
        } catch (error) {
          return {
            id: tokenObj._id,
            sessionIndex: index,
            createdAt: tokenObj.createdAt,
            expiresAt: new Date(tokenObj.createdAt.getTime() + (7 * 24 * 60 * 60 * 1000)),
            userAgent: 'Unknown',
            ip: 'Unknown',
            isCurrentSession: false
          };
        }
      });

      return sessions;
    } catch (error) {
      throw new Error(`Failed to fetch active sessions: ${error.message}`);
    }
  },

  // Terminate specific session
  terminateSession: async (userId, sessionId) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove the specific refresh token
      user.refreshTokens = user.refreshTokens.filter(
        tokenObj => tokenObj._id.toString() !== sessionId
      );

      await user.save();
      
      return { message: 'Session terminated successfully' };
    } catch (error) {
      throw new Error(`Failed to terminate session: ${error.message}`);
    }
  },

  // Terminate all sessions except current
  terminateAllSessions: async (userId, currentToken) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Keep only the current refresh token
      if (currentToken) {
        user.refreshTokens = user.refreshTokens.filter(
          tokenObj => tokenObj.token === currentToken
        );
      } else {
        // If no current token provided, clear all sessions
        user.refreshTokens = [];
      }

      await user.save();
      
      return {
        message: 'All other sessions terminated successfully',
        remainingSessions: user.refreshTokens.length
      };
    } catch (error) {
      throw new Error(`Failed to terminate sessions: ${error.message}`);
    }
  },

  // Export user data
  exportUserData: async (userId) => {
    try {
      const user = await User.findById(userId).select('-password -refreshTokens');
      if (!user) {
        throw new Error('User not found');
      }

      // Include basic user info and preferences
      const exportData = {
        userInfo: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        preferences: user.preferences,
        // Add more data sections as needed
        // transactions: [], // Would come from transaction service
        // categories: [], // Would come from category service
        // etc.
      };

      return exportData;
    } catch (error) {
      throw new Error(`Failed to export user data: ${error.message}`);
    }
  }
};

module.exports = { settingsService };