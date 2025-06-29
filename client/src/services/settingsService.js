// services/settingsService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with interceptors for token handling
const api = axios.create({
  baseURL: API_URL,
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

// Request interceptor to add access token
api.interceptors.request.use(
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

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newToken = refreshResponse.data.data?.accessToken || refreshResponse.data.accessToken;
        
        // Update the original request with new token
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login or handle accordingly
        console.error('Token refresh failed in settings service:', refreshError);
        
        // You might want to dispatch a logout action here instead of direct redirect
        // For now, we'll just reject the promise
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const settingsService = {
  // Get user preferences
  getPreferences: async () => {
    try {
      const response = await api.get('/settings/preferences');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch preferences');
    }
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await api.patch('/settings/preferences', preferences);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update preferences');
    }
  },

  // Get active sessions
  getActiveSessions: async () => {
    try {
      const response = await api.get('/settings/sessions');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active sessions');
    }
  },

  // Terminate a specific session
  terminateSession: async (sessionId) => {
    try {
      const response = await api.delete(`/settings/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to terminate session');
    }
  },

  // Terminate all sessions except current
  terminateAllSessions: async () => {
    try {
      const response = await api.delete('/settings/sessions/all');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to terminate all sessions');
    }
  },

  // Reset preferences to default
  resetPreferences: async () => {
    try {
      const response = await api.post('/settings/preferences/reset');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset preferences');
    }
  },

  // Export user data
  exportUserData: async () => {
    try {
      const response = await api.get('/settings/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export user data');
    }
  }
};