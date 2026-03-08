// services/settingsService.js
import apiClient from '../utils/axiosConfigs';

export const settingsService = {
  // Get user preferences
  getPreferences: async () => {
    try {
      const response = await apiClient.get('/settings/preferences');
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch preferences');
    }
  },

  // Update user preferences
  updatePreferences: async (preferences) => {
    try {
      const response = await apiClient.patch('/settings/preferences', preferences);
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update preferences');
    }
  },

  // Reset user preferences
  resetPreferences: async () => {
    try {
      const response = await apiClient.post('/settings/preferences/reset');
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset preferences');
    }
  },

  // Toggle MFA enabled/disabled
  toggleMFA: async (enabled) => {
    try {
      const response = await apiClient.patch('/settings/mfa', { enabled });
      const pref = response.data?.data?.preferences || response.data?.preferences || response.data;
      return { preferences: pref };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to toggle MFA');
    }
  },

  // Get active sessions
  getActiveSessions: async () => {
    try {
      const response = await apiClient.get('/settings/sessions');
      const sessions = response.data?.data?.sessions || response.data?.sessions || [];
      return { sessions };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch active sessions');
    }
  },

  // Terminate a specific session
  terminateSession: async (sessionId) => {
    try {
      const response = await apiClient.delete(`/settings/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to terminate session');
    }
  },

  // Terminate all sessions except current
  terminateAllSessions: async () => {
    try {
      const response = await apiClient.delete('/settings/sessions/all');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to terminate all sessions');
    }
  },

  // Export user data
  exportUserData: async () => {
    try {
      const response = await apiClient.get('/settings/export', { responseType: 'blob' });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to export user data');
    }
  },
};