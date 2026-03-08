import apiClient from '../utils/axiosConfigs';

const notificationService = {
  // Fetch all notifications for the user
  async getNotifications() {
    const res = await apiClient.get('/notifications');
    return res.data;
  },

  // Get unread count only (for badge on load)
  async getUnreadCount() {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data;
  },

  // Mark all as read
  async markAllRead() {
    const res = await apiClient.patch('/notifications/read-all');
    return res.data;
  },

  // Mark one as read
  async markOneRead(id) {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  // Delete one
  async deleteNotification(id) {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationService;