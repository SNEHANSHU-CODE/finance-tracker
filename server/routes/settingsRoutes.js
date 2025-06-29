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
  
  body('language')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'de', 'it'])
    .withMessage('Invalid language. Allowed values: en, hi, es, fr, de, it'),
  
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

settingsRouter.delete('/sessions/:sessionId', 
  validateSessionId,
  settingsController.terminateSession
);

settingsRouter.delete('/sessions/all', 
  settingsController.terminateAllSessions
);

// Data export route
settingsRouter.get('/export', 
  settingsController.exportUserData
);

module.exports = settingsRouter;