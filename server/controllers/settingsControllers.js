const { settingsService } = require('../services/settingsService');
const { validationResult } = require('express-validator');
const ResponseUtils = require('../utils/response');

const settingsController = {
  // Get user preferences
  getPreferences: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      const preferences = await settingsService.getUserPreferences(userId);
      
      return ResponseUtils.success(res, { preferences }, 'Preferences retrieved successfully');
    } catch (error) {
      console.error('Get preferences error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to fetch preferences');
    }
  },

  // Update user preferences
  updatePreferences: async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseUtils.badRequest(res, 'Validation failed', {
          errors: errors.array()
        });
      }

      const userId = req.userId || req.user.userId;
      const { currency, theme } = req.body;
      
      const updatedPreferences = await settingsService.updateUserPreferences(userId, {
        currency,
        theme
      });
      
      return ResponseUtils.success(res, { preferences: updatedPreferences }, 'Preferences updated successfully');
    } catch (error) {
      console.error('Update preferences error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to update preferences');
    }
  },

  // Reset preferences to default
  resetPreferences: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      const defaultPreferences = await settingsService.resetUserPreferences(userId);
      
      return ResponseUtils.success(res, { preferences: defaultPreferences }, 'Preferences reset to default successfully');
    } catch (error) {
      console.error('Reset preferences error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to reset preferences');
    }
  },

  // Get active sessions
  getActiveSessions: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      const currentToken = req.cookies?.refreshToken;
      const sessions = await settingsService.getActiveSessions(userId, currentToken);
      
      return ResponseUtils.success(res, { sessions }, 'Active sessions retrieved successfully');
    } catch (error) {
      console.error('Get active sessions error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to fetch active sessions');
    }
  },

  // Terminate specific session
  terminateSession: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      const { sessionId } = req.params;
      const currentToken = req.cookies?.refreshToken;

      const result = await settingsService.terminateSession(userId, sessionId, currentToken);

      // If the current session was terminated, clear the refresh token cookie
      if (result.wasCurrent) {
        res.clearCookie('refreshToken', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'None'
        });
      }

      return ResponseUtils.success(res, { currentSessionTerminated: !!result.wasCurrent }, 'Session terminated successfully');
    } catch (error) {
      console.error('Terminate session error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to terminate session');
    }
  },

  // Terminate all sessions except current
  terminateAllSessions: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      // Use refresh token cookie as the current session identifier
      const currentToken = req.cookies?.refreshToken;
      
      const remainingSessions = await settingsService.terminateAllSessions(userId, currentToken);
      
      return ResponseUtils.success(res, { remainingSessions }, 'All other sessions terminated successfully');
    } catch (error) {
      console.error('Terminate all sessions error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to terminate sessions');
    }
  },

  // Toggle MFA
  toggleMFA: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return ResponseUtils.badRequest(res, 'enabled must be a boolean');
      }

      const preferences = await settingsService.toggleMFA(userId, enabled);
      return ResponseUtils.success(
        res,
        { preferences },
        `MFA ${enabled ? 'enabled' : 'disabled'} successfully`
      );
    } catch (error) {
      console.error('Toggle MFA error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to toggle MFA');
    }
  },

  // Export user data
  exportUserData: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      const userData = await settingsService.exportUserData(userId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
      
      return ResponseUtils.success(res, {
        data: userData,
        exportedAt: new Date().toISOString()
      }, 'User data exported successfully');
    } catch (error) {
      console.error('Export user data error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to export user data');
    }
  }
};

module.exports = { settingsController };