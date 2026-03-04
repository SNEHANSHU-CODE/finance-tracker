import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let getCurrentToken = null;

export const setTokenGetter = (tokenGetter) => {
  getCurrentToken = tokenGetter;
};

api.interceptors.request.use(
  (config) => {
    if (getCurrentToken) {
      const token = getCurrentToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshResponse.data.data?.accessToken || refreshResponse.data.accessToken;
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed in settings service:', refreshError);
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
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch preferences');
    }
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await api.patch('/settings/preferences', preferences);
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update preferences');
    }
  },

  // Reset user preferences
  resetPreferences: async () => {
    try {
      const response = await api.post('/settings/preferences/reset');
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset preferences');
    }
  },

  // Toggle MFA enabled/disabled
  toggleMFA: async (enabled) => {
    try {
      const response = await api.patch('/settings/mfa', { enabled });
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to toggle MFA');
    }
  },

  // Get active sessions
  getActiveSessions: async () => {
    try {
      const response = await api.get('/settings/sessions');
      const sessions = response.data?.data?.sessions || response.data?.sessions || [];
      return { sessions };
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

  // Export user data
  exportUserData: async () => {
    try {
      const response = await api.get('/settings/export', { responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export user data');
    }
  },
};