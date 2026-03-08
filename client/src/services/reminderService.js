import apiClient from '../utils/axiosConfigs';

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
  
  async updateReminder(id, data) {
    const response = await apiClient.put(`/reminders/${id}`, data);
    return response.data;
  },
  
  async googleConnect() {
    const response = await apiClient.post('/google');
    return response.data;
  }
};

export default reminderService;