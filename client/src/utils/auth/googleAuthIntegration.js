import { initiateGoogleOAuth, handleOAuthCallback } from './googleAuth';

// Add these selectors
export const selectGuestId = (state) => state.auth.guestId;
export const selectAuthMethod = (state) => state.auth.authMethod;

// Add these to existing extraReducers in createSlice:
const extraReducersAdditions = {
  [initiateGoogleOAuth.pending]: (state) => {
    state.loading = true;
    state.error = null;
  },
  [initiateGoogleOAuth.fulfilled]: (state, action) => {
    state.loading = false;
    // State preserved until callback
  },
  [initiateGoogleOAuth.rejected]: (state, action) => {
    state.loading = false;
    state.error = action.payload;
  },

  [handleOAuthCallback.pending]: (state) => {
    state.loading = true;
    state.error = null;
  },
  [handleOAuthCallback.fulfilled]: (state, action) => {
    state.loading = false;
    state.isAuthenticated = true;
    state.user = action.payload.user;
    state.accessToken = action.payload.accessToken;
    state.sessionId = action.payload.sessionId;
    state.authMethod = action.payload.authMethod;
    // Guest ID persists in localStorage separately
  },
  [handleOAuthCallback.rejected]: (state, action) => {
    state.loading = false;
    state.error = action.payload;
    // Guest mode remains intact on failure
  }
};

// Initial state additions for auth slice
const authStateAdditions = {
  guestId: localStorage.getItem('guestId') || null,
  sessionId: null,
  authMethod: 'email', // 'email' or 'google'
  googleRefreshToken: null
};

// INTEGRATION INSTRUCTIONS:
//
// 1. In existing authSlice.js, add these fields to initialState:
//    ...authStateAdditions
//
// 2. Add to createSlice extraReducers:
//    ...extraReducersAdditions
//
// 3. Add middleware to handle guest ID:
//    - On logout: Clear guestId from localStorage
//    - On register: Generate new guestId
//    - On login success: Keep guestId for merge tracking
//
// 4. Existing auth logic remains unchanged
//    Google OAuth is additive, not replacing

export { extraReducersAdditions, authStateAdditions };
