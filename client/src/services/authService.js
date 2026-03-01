import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a separate axios instance for auth service
const authApiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Store reference to get current token
let getCurrentToken = null;

// Method to set token getter (called from store setup)
export const setTokenGetter = (tokenGetter) => {
    getCurrentToken = tokenGetter;
};

// Request retry logic
const retryRequest = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1 || error.response?.status < 500) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

// Request interceptor to add auth token
authApiClient.interceptors.request.use(
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

export const authService = {
    // Send OTP for registration
    sendRegistrationOTP: async (userData) => {
        try {
            const response = await authApiClient.post('/auth/register/send-otp', userData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to send OTP'
            );
        }
    },

    // Verify OTP for registration
    verifyRegistrationOTP: async (otpData) => {
        try {
            const response = await authApiClient.post('/auth/register/verify-otp', otpData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to verify OTP'
            );
        }
    },

    // Register new user - FIXED: Now sends empty body since registration token is in cookie
    register: async (userData = {}) => {
        try {
            // After OTP verification, the registration token is stored in httpOnly cookie
            // The backend will use this cookie to complete registration
            const response = await authApiClient.post('/auth/register', userData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Registration failed'
            );
        }
    },

    // Login user
    login: async (credentials) => {
        try {
            const response = await authApiClient.post('/auth/login', credentials);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Login failed'
            );
        }
    },

    // Refresh access token using httpOnly cookie
    refreshToken: async () => {
        try {
            const response = await authApiClient.post('/auth/refresh');
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Token refresh failed'
            );
        }
    },

    // Logout user
    logout: async () => {
        try {
            const response = await authApiClient.post('/auth/logout');
            return response.data;
        } catch (error) {
            // Don't throw error on logout failure - we want to clear local state anyway
            console.error('Logout request failed:', error);
            return { success: false, message: 'Logout request failed' };
        }
    },

    // Get current user profile
    getProfile: async (tokenOverride = null) => {
    try {
        const headers = tokenOverride 
            ? { Authorization: `Bearer ${tokenOverride}` } 
            : {};
        const response = await authApiClient.get('/auth/profile', { headers });
        return response.data.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch profile');
    }
},

    // Update user profile
    updateProfile: async (profileData) => {
        try {
            const response = await authApiClient.put('/auth/profile', profileData);
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to update profile'
            );
        }
    },

    //Update user Password
    updateUserPassword: async (newPassword) => {
        try {
            const response = await authApiClient.put('/auth/updatePassword', newPassword);
            return response.data.data;
        }
        catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message || 
                'Failed to update password'
            )
        }
    },

    //Delete user account
    deleteUserAccount: async (accountData) => {
        try {
            const response = await authApiClient.put('/auth/deleteaccount', accountData);
            return response.data.data;
        }
        catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message || 
                'Failed to delete account'
            )
        }
    },

    // Verify token validity
    verifyToken: async () => {
        try {
            const response = await authApiClient.get('/auth/verify');
            return response.data.data; // Return the data part of response
        } catch (error) {
            throw new Error('Token verification failed');
        }
    },

    // Google OAuth - Start authentication flow
    startGoogleOAuth: async (guestId = null) => {
        try {
            const params = guestId ? `?guestId=${guestId}` : '';
            const response = await authApiClient.get(`/auth/google/start${params}`);
            return response.data; // Returns { success: true, authUrl: "..." }
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to start Google OAuth'
            );
        }
    },
};