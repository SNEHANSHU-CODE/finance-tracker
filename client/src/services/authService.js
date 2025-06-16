import axios from 'axios';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create a separate axios instance for auth service to avoid circular dependency
const authApiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Simple request interceptor that gets token from Redux store
authApiClient.interceptors.request.use(
    (config) => {
        // Get token from Redux store if available
        if (typeof window !== 'undefined' && window.__REDUX_STORE__) {
            const state = window.__REDUX_STORE__.getState();
            const token = state.auth?.accessToken;
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authService = {
    // Register new user
    register: async (userData) => {
        try {
            const response = await authApiClient.post('/auth/register', userData);
            return response.data;
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
            return response.data;
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
            return response.data;
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
            await authApiClient.post('/auth/logout');
        } catch (error) {
            // Log error but don't throw - we want to clear local state anyway
            console.error('Logout request failed:', error);
        }
    },

    // Get current user profile
    getProfile: async () => {
        try {
            const response = await authApiClient.get('/auth/profile');
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to fetch profile'
            );
        }
    },

    // Update user profile
    updateProfile: async (profileData) => {
        try {
            const response = await authApiClient.put('/auth/profile', profileData);
            return response.data;
        } catch (error) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                'Failed to update profile'
            );
        }
    },

    // Verify token validity (check if user is still authenticated)
    verifyToken: async () => {
        try {
            const response = await authApiClient.get('/auth/verify');
            return response.data;
        } catch (error) {
            throw new Error('Token verification failed');
        }
    },
};