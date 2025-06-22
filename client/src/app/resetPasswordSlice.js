import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { resetPasswordService } from '../services/resetPasswordService';

// Send password reset email/code
export const sendPasswordReset = createAsyncThunk(
  'reset/sendopt',
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await resetPasswordService.sendPasswordReset(emailData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send password reset email');
    }
  }
);

// Verify password reset code/token
export const verifyPasswordReset = createAsyncThunk(
  'reset/verifyotp',
  async (verificationData, { rejectWithValue }) => {
    try {
      const response = await resetPasswordService.verifyPasswordReset(verificationData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to verify reset code');
    }
  }
);

// Set new password
export const setNewPassword = createAsyncThunk(
  'reset/setnewpassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await resetPasswordService.setNewPassword(passwordData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to reset password');
    }
  }
);

// Initial state
const initialState = {
  loading: false,
  error: null,
  // Step tracking
  currentStep: 1, 
  // Status flags
  emailSent: false,
  codeVerified: false,
  passwordResetSuccess: false,
  // Data
  email: null,
  resetToken: null,
  // Additional state for better UX
  lastEmailSentTime: null,
  resendAllowed: true,
};

// Password Reset Slice
const resetPasswordSlice = createSlice({
  name: 'passwordReset',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetFlow: (state) => {
      // ✅ Fixed: Return the actual initial state
      return { ...initialState };
    },
    setCurrentStep: (state, action) => {
      const step = action.payload;
      if (step >= 1 && step <= 3) {
        state.currentStep = step;
      }
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    goToNextStep: (state) => {
      if (state.currentStep < 3) {
        state.currentStep += 1;
      }
    },
    goToPreviousStep: (state) => {
      if (state.currentStep > 1) {
        state.currentStep -= 1;
        // Clear relevant state when going back
        if (state.currentStep === 1) {
          state.emailSent = false;
          state.codeVerified = false;
          state.resetToken = null;
        } else if (state.currentStep === 2) {
          state.codeVerified = false;
          state.resetToken = null;
        }
      }
    },
    // ✅ New action to handle resend timer
    setResendAllowed: (state, action) => {
      state.resendAllowed = action.payload;
    },
    // Action to handle successful password reset completion
    completePasswordReset: (state) => {
      return { ...initialState };
    },
  },
  extraReducers: (builder) => {
    builder
      // Send password reset
      .addCase(sendPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resendAllowed = false;
      })
      .addCase(sendPasswordReset.fulfilled, (state, action) => {
        state.loading = false;
        state.emailSent = true;
        state.currentStep = 2;
        state.lastEmailSentTime = Date.now();
        state.error = null;
        
        // Store email if returned from API
        if (action.payload?.email) {
          state.email = action.payload.email;
        }
        
        // ✅ Removed setTimeout - handle this in component instead
      })
      .addCase(sendPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.emailSent = false;
        state.resendAllowed = true;
      })
      
      // Verify password reset
      .addCase(verifyPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPasswordReset.fulfilled, (state, action) => {
        state.loading = false;
        state.codeVerified = true;
        state.currentStep = 3;
        state.error = null;
        
        // Store reset token if returned from API
        if (action.payload?.resetToken || action.payload?.token) {
          state.resetToken = action.payload.resetToken || action.payload.token;
        }
      })
      .addCase(verifyPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.codeVerified = false;
      })
      
      // Set new password
      .addCase(setNewPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setNewPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.passwordResetSuccess = true;
        state.error = null;
      })
      .addCase(setNewPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.passwordResetSuccess = false;
      });
  },
});

export const {
  clearError,
  resetFlow,
  setCurrentStep,
  setEmail,
  goToNextStep,
  goToPreviousStep,
  setResendAllowed,
  completePasswordReset,
} = resetPasswordSlice.actions;

export default resetPasswordSlice.reducer;