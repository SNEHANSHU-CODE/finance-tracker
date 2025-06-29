import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { settingsService } from '../services/settingsService';

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
      return await authService.login(credentials);
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
      await authService.logout();
      return {};
    } catch (error) {
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

// Auth slice with preferences support
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    profileLoading: false,
    isInitialized: false,
    // Preferences state
    preferences: {
      currency: 'INR',
      language: 'en',
      theme: 'light'
    },
    preferencesLoading: false,
    preferencesError: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.preferencesError = null;
    },
    setCredentials: (state, action) => {
      state.user = {
        ...action.payload.user,
        userId: action.payload.user._id,
      };
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
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
      state.error = null;
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
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
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
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isInitialized = true;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
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
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.error = null;
        
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
        state.error = null;
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
        state.error = action.payload;
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
        state.error = action.payload;
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
        state.error = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.preferences = {
          currency: 'INR',
          language: 'en',
          theme: 'light'
        };
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Account - Clear all state
      .addCase(deleteUserAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
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
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCredentials,
  clearCredentials,
  setLoading,
  setInitialized,
  updateUser,
  updatePreferences,
  clearPreferencesError,
} = authSlice.actions;

export default authSlice.reducer;