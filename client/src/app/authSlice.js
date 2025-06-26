import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../services/authService';

// Async thunks using authService
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

// Auth slice - NO localStorage usage
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null, // Only stored in Redux, not localStorage
    isAuthenticated: false,
    loading: false,
    error: null,
    profileLoading: false,
    isInitialized: false, // Track if we've attempted initial auth check
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.user = {
        ...action.payload.user,
        userId: action.payload.user._id,
      };
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
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
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
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
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails on server, clear client state
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
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
      })
      .addCase(verifyAuthToken.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      })
      // Profile actions
      .addCase(fetchUserProfile.pending, (state) => {
        state.profileLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        state.user = { ...state.user, ...action.payload.user };
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
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      })
      // Update Password - Clear auth state on success (user needs to login again)
      .addCase(updateUserPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        // Clear authentication state - user needs to login again with new password
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Account - Clear all auth state on success
      .addCase(deleteUserAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        // Clear all authentication state - account is deleted
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.profileLoading = false;
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
} = authSlice.actions;

export default authSlice.reducer;