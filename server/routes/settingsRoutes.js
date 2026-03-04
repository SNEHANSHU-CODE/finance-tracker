// routes/settingsRoutes.js
const express = require('express');
const { body, param } = require('express-validator');
const { settingsController } = require('../controllers/settingsControllers');
const { authenticateToken } = require('../middleware/auth');

const settingsRouter = express.Router();

// Validation middleware for preferences
const validatePreferences = [
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD'])
    .withMessage('Invalid currency. Allowed values: INR, USD, EUR, GBP, CAD, AUD'),
  
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'auto'])
    .withMessage('Invalid theme. Allowed values: light, dark, auto')
];

// Validation for session ID
const validateSessionId = [
  param('sessionId')
    .isMongoId()
    .withMessage('Invalid session ID format')
];

// Apply authentication middleware to all routes
settingsRouter.use(authenticateToken);

// Preferences routes
settingsRouter.get('/preferences', 
  settingsController.getPreferences
);

settingsRouter.patch('/preferences', 
  validatePreferences,
  settingsController.updatePreferences
);

settingsRouter.post('/preferences/reset', 
  settingsController.resetPreferences
);

// Session management routes
settingsRouter.get('/sessions', 
  settingsController.getActiveSessions
);

settingsRouter.delete('/sessions/all', 
  settingsController.terminateAllSessions
);

settingsRouter.delete('/sessions/:sessionId', 
  validateSessionId,
  settingsController.terminateSession
);

// Data export route
settingsRouter.get('/export', 
  settingsController.exportUserData
);

// MFA toggle route
settingsRouter.patch('/mfa',
  body('enabled').isBoolean().withMessage('enabled must be a boolean'),
  settingsController.toggleMFA
);

module.exports = settingsRouter;