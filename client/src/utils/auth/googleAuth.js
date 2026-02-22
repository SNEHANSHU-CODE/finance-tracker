import { createAsyncThunk } from '@reduxjs/toolkit';
import sessionManager from '../sessionManager';

// OAuth error mappings for user-friendly messages
const OAUTH_ERROR_MESSAGES = {
  invalid_code: 'Authorization code is invalid or expired',
  invalid_state: 'Security validation failed. Please try again',
  code_expired: 'Authorization code has expired. Please try again',
  token_exchange_failed: 'Failed to authenticate with Google',
  user_info_failed: 'Failed to retrieve user information',
  email_not_verified: 'Your Google email is not verified',
  duplicate_google_account: 'This Google account is already linked to another user',
  user_creation_failed: 'Failed to create user account',
  missing_parameters: 'Missing OAuth parameters',
  consent_denied: 'You denied the authorization request',
  server_error: 'Server error during authentication',
  popup_blocked: 'Popup blocked. Please allow popups for this site',
  network_error: 'Network error. Please check your connection',
  timeout: 'OAuth flow timed out. Please try again'
};

/**
 * Initiate Google OAuth Flow
 * Opens popup window and handles OAuth URL generation
 * @param {string} guestId - Optional guest user ID for data migration
 * @returns {Promise} - Resolves with popup window and state
 */
export const initiateGoogleOAuth = createAsyncThunk(
  'auth/googleOAuthStart',
  async (guestId, { rejectWithValue }) => {
    const timeoutId = setTimeout(() => {
      throw new Error('OAuth initialization timeout');
    }, 30000); // 30 second timeout

    try {
      // Validate API endpoint (Vite uses import.meta.env)
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      // Fetch OAuth URL from backend
      const queryParams = new URLSearchParams();
      if (guestId) {
        queryParams.append('guestId', String(guestId));
      }

      const response = await fetch(
        `${apiUrl}/auth/google/start?${queryParams.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OAuth start failed:', { status: response.status, body: errorText });
        throw new Error(`OAuth initialization failed: ${response.statusText}`);
      }

      const { authUrl, state } = await response.json();

      if (!authUrl || !state) {
        throw new Error('Invalid OAuth response from server');
      }

      // Store state in sessionStorage for CSRF validation
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_initTime', Date.now().toString());

      console.info('OAuth URL generated successfully');
      // Return authUrl and state - popup will be opened in component
      return { authUrl, state };
    } catch (error) {
      clearTimeout(timeoutId);
      const errorMessage = error.message || 'Unknown error';
      console.error('OAuth initiation error:', errorMessage);

      // Return user-friendly error message
      const friendlyMessage = Object.values(OAUTH_ERROR_MESSAGES).includes(errorMessage)
        ? errorMessage
        : OAUTH_ERROR_MESSAGES.server_error;

      return rejectWithValue(friendlyMessage);
    }
  }
);

/**
 * Handle OAuth Callback
 * Validates state and exchanges token for user data
 * @param {Object} params - { accessToken, sessionId }
 * @returns {Promise} - Resolves with user data and auth tokens
 */
export const handleOAuthCallback = createAsyncThunk(
  'auth/googleOAuthCallback',
  async ({ accessToken, sessionId }, { rejectWithValue }) => {
    try {
      // Validate input parameters
      if (!accessToken || typeof accessToken !== 'string') {
        throw new Error('Invalid access token');
      }

      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID');
      }

      // Validate stored OAuth state
      const storedState = sessionStorage.getItem('oauth_state');
      const initTime = sessionStorage.getItem('oauth_initTime');

      if (!storedState || !initTime) {
        throw new Error('OAuth state not found. Session may have expired.');
      }

      // Check for timeout (15 minute max)
      const elapsedTime = Date.now() - parseInt(initTime, 10);
      if (elapsedTime > 15 * 60 * 1000) {
        throw new Error(OAUTH_ERROR_MESSAGES.timeout);
      }

      // Fetch authenticated user data with timeout
      const apiUrl = import.meta.env.VITE_API_URL;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const userResponse = await fetch(
        `${apiUrl}/auth/profile`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          throw new Error('Authentication token invalid');
        }
        const errorData = await userResponse.text();
        console.error('Failed to fetch user profile:', errorData);
        throw new Error('Failed to fetch user profile');
      }

      const user = await userResponse.json();

      // Validate user object
      if (!user || !user._id) {
        throw new Error('Invalid user data from server');
      }

      // Clear OAuth state from session storage
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_initTime');

      console.info('OAuth callback successful:', { userId: user._id });

      // Create session for OAuth login
      const userData = {
        ...user,
        userId: user._id,
        authMethod: 'google',
        lastLogin: new Date().toISOString()
      };
      sessionManager.createSession(userData, accessToken);

      return {
        user: userData,
        accessToken,
        sessionId,
        authMethod: 'google'
      };
    } catch (error) {
      // Clear OAuth state on error
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('oauth_initTime');

      const errorMessage = error.message || 'Unknown error';
      console.error('OAuth callback error:', errorMessage);

      // Return user-friendly error message
      const friendlyMessage = OAUTH_ERROR_MESSAGES[errorMessage] || OAUTH_ERROR_MESSAGES.server_error;
      return rejectWithValue(friendlyMessage);
    }
  }
);

export { OAUTH_ERROR_MESSAGES };
