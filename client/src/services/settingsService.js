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
      console.log('Get preferences response:', response.data);
      // Extract preferences from nested response data and wrap in preferences object for Redux
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      console.error('Get preferences error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch preferences');
    }
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    try {
      console.log('=== UPDATE PREFERENCES SERVICE ===');
      console.log('Sending preferences to server:', JSON.stringify(preferences, null, 2));
      console.log('Request URL:', `${API_URL}/settings/preferences`);
      console.log('Request method: PATCH');
      
      const response = await api.patch('/settings/preferences', preferences);
      
      console.log('Update preferences response received:', response.status);
      console.log('Response data structure:', {
        hasData: !!response.data,
        hasDataData: !!response.data?.data,
        hasDataDataPreferences: !!response.data?.data?.preferences,
        hasDataPreferences: !!response.data?.preferences,
        responseStructure: Object.keys(response.data || {})
      });
      console.log('Full response data:', JSON.stringify(response.data, null, 2));
      
      // Extract preferences from nested response data and wrap in preferences object for Redux
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      console.log('Extracted preferences:', JSON.stringify(pref, null, 2));
      
      return { preferences: pref };
    } catch (error) {
      console.error('=== UPDATE PREFERENCES ERROR ===');
      console.error('Error message:', error.message);
      console.error('Error response status:', error.response?.status);
      console.error('Error response data:', error.response?.data);
      console.error('Full error object:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to update preferences');
    }
  },

  // Reset user preferences
  resetPreferences: async () => {
    try {
      const response = await api.post('/settings/preferences/reset');
      // Extract preferences from nested response data and wrap in preferences object for Redux
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset preferences');
    }
  },

  // Get active sessions
  getActiveSessions: async () => {
    try {
      const response = await api.get('/settings/sessions');
      console.log('Get active sessions response:', response.data);
      // Extract sessions from nested response data
      const sessions = response.data?.data?.sessions || response.data?.sessions || [];
      return { sessions };
    } catch (error) {
      console.error('Get active sessions error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
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