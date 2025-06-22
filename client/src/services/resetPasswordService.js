import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a separate axios instance for password reset service
const resetPasswordApiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Store reference to get current token (if needed for authenticated requests)
let getCurrentToken = null;

// Method to set token getter (called from store setup)
export const setTokenGetter = (tokenGetter) => {
    getCurrentToken = tokenGetter;
};

// Request interceptor to add auth token (for authenticated password reset requests)
resetPasswordApiClient.interceptors.request.use(
    (config) => {
        if (getCurrentToken) {
            const token = getCurrentToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const resetPasswordService = {
    // Send password reset email
    sendPasswordReset: async (emailData) => {
        try {
            const response = await resetPasswordApiClient.post('/reset/sendotp', emailData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to send password reset email'
            );
        }
    },

    // Verify password reset code/token
    verifyPasswordReset: async (verificationData) => {
        try {
            const response = await resetPasswordApiClient.post('/reset/verifyotp', verificationData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to verify reset code'
            );
        }
    },

    // Set new password
setNewPassword: async (passwordData) => {
  try {
    // passwordData should now contain { resetToken, newPassword }
    const response = await resetPasswordApiClient.post('/reset/setnewpassword', passwordData);
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to reset password'
    );
  }
},
};