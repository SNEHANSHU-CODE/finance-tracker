const express = require('express');
const GoogleOAuthController = require('../controllers/google.controller');
const { authenticateToken } = require('../../middleware/auth');

const googleRouter = express.Router();

// --- Google OAuth Routes ---

/**
 * GET /auth/google/start
 * Initiates Google OAuth flow
 * @query {string} guestId - Optional guest user ID for data migration
 * @returns {Object} - authUrl and state for OAuth validation
 */
googleRouter.get('/start', GoogleOAuthController.startOAuth);

/**
 * GET /auth/google
 * Handles OAuth callback from Google (root route)
 * Exchanges authorization code for tokens and creates/updates user
 * @query {string} code - Authorization code from Google
 * @query {string} state - CSRF protection state parameter
 * @query {string} error - Error code if user denied consent
 */
googleRouter.get('/', GoogleOAuthController.handleCallback);

module.exports = googleRouter;