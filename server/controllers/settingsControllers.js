const { settingsService } = require('../services/settingsService');
const { validationResult } = require('express-validator');
const ResponseUtils = require('../utils/response');

const settingsController = {
  // Get user preferences
  getPreferences: async (req, res) => {
    try {
      const userId = req.userId || req.user.userId;
      const preferences = await settingsService.getUserPreferences(userId);
      
      return ResponseUtils.success(res, 'Preferences retrieved successfully', {
        preferences
      });
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

      const userId = req.userId;
      const { currency, language, theme } = req.body;
      
      const updatedPreferences = await settingsService.updateUserPreferences(userId, {
        currency,
        language,
        theme
      });
      
      return ResponseUtils.success(res, 'Preferences updated successfully', {
        preferences: updatedPreferences
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to update preferences');
    }
  },

  // Reset preferences to default
  resetPreferences: async (req, res) => {
    try {
      const userId = req.userId;
      const defaultPreferences = await settingsService.resetUserPreferences(userId);
      
      return ResponseUtils.success(res, 'Preferences reset to default successfully', {
        preferences: defaultPreferences
      });
    } catch (error) {
      console.error('Reset preferences error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to reset preferences');
    }
  },

  // Get active sessions
  getActiveSessions: async (req, res) => {
    try {
      const userId = req.userId;
      const sessions = await settingsService.getActiveSessions(userId);
      
      return ResponseUtils.success(res, 'Active sessions retrieved successfully', {
        sessions
      });
    } catch (error) {
      console.error('Get active sessions error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to fetch active sessions');
    }
  },

  // Terminate specific session
  terminateSession: async (req, res) => {
    try {
      const userId = req.userId;
      const { sessionId } = req.params;
      
      await settingsService.terminateSession(userId, sessionId);
      
      return ResponseUtils.success(res, 'Session terminated successfully');
    } catch (error) {
      console.error('Terminate session error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to terminate session');
    }
  },

  // Terminate all sessions except current
  terminateAllSessions: async (req, res) => {
    try {
      const userId = req.userId;
      const currentToken = req.token; // From auth middleware
      
      const remainingSessions = await settingsService.terminateAllSessions(userId, currentToken);
      
      return ResponseUtils.success(res, 'All other sessions terminated successfully', {
        remainingSessions
      });
    } catch (error) {
      console.error('Terminate all sessions error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to terminate sessions');
    }
  },

  // Export user data
  exportUserData: async (req, res) => {
    try {
      const userId = req.userId;
      const userData = await settingsService.exportUserData(userId);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${userId}.json"`);
      
      return ResponseUtils.success(res, 'User data exported successfully', {
        data: userData,
        exportedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Export user data error:', error);
      return ResponseUtils.serverError(res, error.message || 'Failed to export user data');
    }
  }
};

module.exports = { settingsController };