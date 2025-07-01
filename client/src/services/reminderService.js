// services/reminderService.js (Frontend - Fixed)
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let getCurrentToken = null;
export const setTokenGetter = (getter) => { getCurrentToken = getter };

apiClient.interceptors.request.use(
  (config) => {
    if (getCurrentToken) {
      const token = getCurrentToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

const reminderService = {
  async getReminders() {
    const response = await apiClient.get('/reminders');
    return response.data;
  },
  
  async createReminder(data) {
    const response = await apiClient.post('/reminders', data);
    return response.data;
  },
  
  async deleteReminder(id) {
    const response = await apiClient.delete(`/reminders/${id}`);
    return response.data;
  },
  
  async updateReminder(id, data) { // Fixed: Added id parameter
    const response = await apiClient.put(`/reminders/${id}`, data);
    return response.data;
  },
  
  async googleConnect() {
    const response = await apiClient.post('/google');
    return response.data;
  }
};

export default reminderService;

