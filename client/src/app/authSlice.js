// Selectors
export const selectGuestId = (state) => state.auth.user?.isGuest ? state.auth.user.userId || 'guest' : null;
export const selectAuth = (state) => ({ loading: state.auth.loading, formError: state.auth.formError, oauthError: state.auth.oauthError });
// Import Google OAuth thunks
import { initiateGoogleOAuth, handleOAuthCallback } from '../utils/auth/googleAuth';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';
import sessionManager from '../utils/sessionManager';

// Existing auth async thunks
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      // Create session on successful login
      sessionManager.createSession(response.user, response.accessToken);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.refreshToken();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Destroy session first
      sessionManager.destroySession();
      // Then logout from server
      await authService.logout();
      return {};
    } catch (error) {
      // Still destroy session even if logout fails
      sessionManager.destroySession();
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.getProfile();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      return await authService.updateProfile(profileData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPassword = createAsyncThunk(
  'auth/updatePassword',
  async (newPassword, { rejectWithValue }) => {
    try {
      return await authService.updateUserPassword(newPassword);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteUserAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (accountData, { rejectWithValue }) => {
    try {
      return await authService.deleteUserAccount(accountData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const verifyAuthToken = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.verifyToken();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Migrate guest data after login/register
export const migrateGuestData = createAsyncThunk(
  'auth/migrateGuestData',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { guestStorage } = await import('../utils/guestStorage');
      
      if (guestStorage.isDataMigrated()) {
        return { message: 'Data already migrated' };
      }

      const guestData = guestStorage.getAllGuestData();
      
      if (guestData.transactions.length === 0 && guestData.goals.length === 0) {
        return { message: 'No guest data to migrate' };
      }

      // Import services dynamically to avoid circular imports
      const { default: transactionService } = await import('../services/transactionService');
      const { default: goalService } = await import('../services/goalService');

      const results = { transactions: null, goals: null };

      // Migrate transactions
      if (guestData.transactions.length > 0) {
        results.transactions = await transactionService.migrateGuestData({
          transactions: guestData.transactions
        });
      }

      // Migrate goals
      if (guestData.goals.length > 0) {
        results.goals = await goalService.migrateGuestData({
          goals: guestData.goals
        });
      }

      // Mark as migrated
      guestStorage.setDataMigrated(true);
      
      return {
        message: 'Guest data migrated successfully',
        results
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// New preferences async thunks
export const fetchUserPreferences = createAsyncThunk(
  'auth/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsService.getPreferences();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'auth/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      return await settingsService.updatePreferences(preferences);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resetUserPreferences = createAsyncThunk(
  'auth/resetPreferences',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsService.resetPreferences();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Session async thunks
export const fetchActiveSessions = createAsyncThunk(
  'auth/fetchActiveSessions',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsService.getActiveSessions();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const terminateSessionAction = createAsyncThunk(
  'auth/terminateSession',
  async (sessionId, { rejectWithValue, getState, dispatch }) => {
    try {
      // Determine if the session being terminated is the current one from state
      const state = getState();
      const session = state.auth.sessions.find(s => s._id === sessionId);
      const wasCurrent = !!session?.isCurrent;

      const response = await settingsService.terminateSession(sessionId);

      // If current session is terminated, force logout on client immediately
      if (wasCurrent || response?.data?.currentSessionTerminated || response?.currentSessionTerminated) {
        await dispatch(logoutUser());
      }

      return { sessionId, wasCurrent: wasCurrent || response?.currentSessionTerminated };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const terminateAllSessionsAction = createAsyncThunk(
  'auth/terminateAllSessions',
  async (_, { rejectWithValue }) => {
    try {
      return await settingsService.terminateAllSessions();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Auth slice with preferences support
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isGuest: false,
    loading: false,
    formError: null, // For email/password login/signup errors
    oauthError: null, // For Google OAuth errors
    profileLoading: false,
    isInitialized: false,
    // Google OAuth additions
    guestId: localStorage.getItem('guestId') || null,
    sessionId: null,
    authMethod: 'email', // 'email' or 'google'
    googleRefreshToken: null,
    // Preferences state
    preferences: {
      currency: 'INR',
      language: 'en',
      theme: 'light'
    },
    preferencesLoading: false,
    preferencesError: null,
    // Sessions state
    sessions: [],
    sessionsLoading: false,
    sessionsError: null,
  },
  reducers: {
    clearError: (state) => {
      state.formError = null;
      state.oauthError = null;
      state.preferencesError = null;
    },
    clearFormError: (state) => {
      state.formError = null;
    },
    clearOAuthError: (state) => {
      state.oauthError = null;
    },
    setCredentials: (state, action) => {
      state.user = {
        ...action.payload.user,
        userId: action.payload.user._id,
      };
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isGuest = false;
      state.isInitialized = true;
      
      // Set preferences from user data if available
      if (action.payload.user.preferences) {
        state.preferences = {
          ...state.preferences,
          ...action.payload.user.preferences
        };
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isGuest = false;
      state.formError = null;
      state.oauthError = null;
      state.preferencesError = null;
      // Reset preferences to default
      state.preferences = {
        currency: 'INR',
        language: 'en',
        theme: 'light'
      };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
      // Also update user preferences if user exists
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
      }
    },
    clearPreferencesError: (state) => {
      state.preferencesError = null;
    },
    setGuestMode: (state) => {
      state.isGuest = true;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.user = { username: 'Guest', isGuest: true };
    },
    clearGuestMode: (state) => {
      state.isGuest = false;
      state.isAuthenticated = false;
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Google OAuth
      .addCase(initiateGoogleOAuth.pending, (state) => {
        state.loading = true;
        state.oauthError = null;
      })
      .addCase(initiateGoogleOAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.oauthError = null;
        // State preserved until callback
      })
      .addCase(initiateGoogleOAuth.rejected, (state, action) => {
        state.loading = false;
        state.oauthError = action.payload;
      })
      .addCase(handleOAuthCallback.pending, (state) => {
        state.loading = true;
        state.oauthError = null;
      })
      .addCase(handleOAuthCallback.fulfilled, (state, action) => {
        state.loading = false;
        state.oauthError = null;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.sessionId = action.payload.sessionId;
        state.authMethod = action.payload.authMethod;
        // Guest ID persists in localStorage separately
      })
      .addCase(handleOAuthCallback.rejected, (state, action) => {
        state.loading = false;
        state.oauthError = action.payload;
        // Guest mode remains intact on failure
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.formError = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.formError = null;
        state.user = {
          ...action.payload.user,
          userId: action.payload.user._id,
        };
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.isInitialized = true;
        
        // Set preferences from user data
        if (action.payload.user.preferences) {
          state.preferences = {
            ...state.preferences,
            ...action.payload.user.preferences
          };
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.formError = action.payload;
        state.isInitialized = true;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.formError = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.formError = null;
        state.user = {
          ...action.payload.user,
          userId: action.payload.user._id,
        };
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isGuest = false;
        state.isInitialized = true;
        
        // Set preferences from user data
        if (action.payload.user.preferences) {
          state.preferences = {
            ...state.preferences,
            ...action.payload.user.preferences
          };
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.formError = action.payload;
        state.isInitialized = true;
      })
      // Refresh
      .addCase(refreshToken.pending, (state) => {
        // Don't set loading for refresh to avoid UI flicker
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = {
          ...action.payload.user,
          userId: action.payload.user._id,
        };
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.formError = null;
        state.oauthError = null;
        
        // Set preferences from user data
        if (action.payload.user.preferences) {
          state.preferences = {
            ...state.preferences,
            ...action.payload.user.preferences
          };
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        // Reset preferences to default
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light'
        };
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.formError = null;
        state.oauthError = null;
        state.preferencesError = null;
        // Reset preferences to default
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light'
        };
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails on server, clear client state
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light'
        };
      })
      // Verify token
      .addCase(verifyAuthToken.fulfilled, (state, action) => {
        state.user = {
          ...action.payload.user,
          userId: action.payload.user._id,
        };
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
        
        // Set preferences from user data
        if (action.payload.user.preferences) {
          state.preferences = {
            ...state.preferences,
            ...action.payload.user.preferences
          };
        }
      })
      .addCase(verifyAuthToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light'
        };
      })
      // Profile actions
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = { ...state.user, ...action.payload.user };
        
        // Update preferences if included in profile
        if (action.payload.user.preferences) {
          state.preferences = {
            ...state.preferences,
            ...action.payload.user.preferences
          };
        }
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.formError = action.payload;
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = { ...state.user, ...action.payload.user };
        
        // Update preferences if included in profile update
        if (action.payload.user.preferences) {
          state.preferences = {
            ...state.preferences,
            ...action.payload.user.preferences
          };
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.formError = action.payload;
      })
      // Preferences actions
      .addCase(fetchUserPreferences.pending, (state) => {
        state.preferencesLoading = true;
        state.preferencesError = null;
      })
      .addCase(fetchUserPreferences.fulfilled, (state, action) => {
        state.preferencesLoading = false;
        state.preferences = {
          ...state.preferences,
          ...action.payload.preferences
        };
        
        // Also update user preferences
        if (state.user) {
          state.user.preferences = {
            ...state.user.preferences,
            ...action.payload.preferences
          };
        }
      })
      .addCase(fetchUserPreferences.rejected, (state, action) => {
        state.preferencesLoading = false;
        state.preferencesError = action.payload;
      })
      .addCase(updateUserPreferences.pending, (state) => {
        state.preferencesLoading = true;
        state.preferencesError = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.preferencesLoading = false;
        state.preferences = {
          ...state.preferences,
          ...action.payload.preferences
        };
        
        // Also update user preferences
        if (state.user) {
          state.user.preferences = {
            ...state.user.preferences,
            ...action.payload.preferences
          };
        }
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.preferencesLoading = false;
        state.preferencesError = action.payload;
      })
      .addCase(resetUserPreferences.pending, (state) => {
        state.preferencesLoading = true;
        state.preferencesError = null;
      })
      .addCase(resetUserPreferences.fulfilled, (state, action) => {
        state.preferencesLoading = false;
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light',
          ...action.payload.preferences
        };
        
        // Also update user preferences
        if (state.user) {
          state.user.preferences = {
            currency: 'INR',
            language: 'en',
            theme: 'light',
            ...action.payload.preferences
          };
        }
      })
      .addCase(resetUserPreferences.rejected, (state, action) => {
        state.preferencesLoading = false;
        state.preferencesError = action.payload;
      })
      // Update Password - Clear auth state on success
      .addCase(updateUserPassword.pending, (state) => {
        state.loading = true;
        state.formError = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.formError = null;
        state.oauthError = null;
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light'
        };
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.formError = action.payload;
      })
      // Delete Account - Clear all state
      .addCase(deleteUserAccount.pending, (state) => {
        state.loading = true;
        state.formError = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.formError = null;
        state.oauthError = null;
        state.profileLoading = false;
        state.preferencesLoading = false;
        state.preferencesError = null;
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light'
        };
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.loading = false;
        state.formError = action.payload;
      })
      // Migrate guest data
      .addCase(migrateGuestData.pending, (state) => {
        state.loading = true;
      })
      .addCase(migrateGuestData.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(migrateGuestData.rejected, (state, action) => {
        state.loading = false;
        state.formError = action.payload;
      })
      // Fetch active sessions
      .addCase(fetchActiveSessions.pending, (state) => {
        state.sessionsLoading = true;
        state.sessionsError = null;
      })
      .addCase(fetchActiveSessions.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        state.sessions = action.payload.sessions || [];
      })
      .addCase(fetchActiveSessions.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.sessionsError = action.payload;
      })
      // Terminate session
      .addCase(terminateSessionAction.pending, (state) => {
        state.sessionsLoading = true;
        state.sessionsError = null;
      })
      .addCase(terminateSessionAction.fulfilled, (state, action) => {
        state.sessionsLoading = false;
        const removedId = action.payload?.sessionId || action.payload;
        state.sessions = state.sessions.filter(s => s._id !== removedId);
        // If current session was terminated, the logout thunk will clear auth state
      })
      .addCase(terminateSessionAction.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.sessionsError = action.payload;
      })
      // Terminate all sessions
      .addCase(terminateAllSessionsAction.pending, (state) => {
        state.sessionsLoading = true;
        state.sessionsError = null;
      })
      .addCase(terminateAllSessionsAction.fulfilled, (state) => {
        state.sessionsLoading = false;
        state.sessions = [];
      })
      .addCase(terminateAllSessionsAction.rejected, (state, action) => {
        state.sessionsLoading = false;
        state.sessionsError = action.payload;
      });
  },
});

export const {
  clearError,
  clearFormError,
  clearOAuthError,
  setCredentials,
  clearCredentials,
  setLoading,
  setInitialized,
  updateUser,
  updatePreferences,
  clearPreferencesError,
  setGuestMode,
  clearGuestMode,
} = authSlice.actions;

// Re-export Google OAuth thunks for use in components
export { initiateGoogleOAuth, handleOAuthCallback };
export default authSlice.reducer;