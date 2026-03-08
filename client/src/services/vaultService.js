import apiClient from '../utils/axiosConfigs';

const vaultService = {
  async getAll() {
    const res = await apiClient.get('/vault/');
    return res.data;
  },

  async getOne(id) {
    const res = await apiClient.get(`/vault/${id}`);
    return res.data;
  },

  async upload(payload) {
    const res = await apiClient.post('/vault/upload', payload, { timeout: 30000 });
    return res.data;
  },

  async remove(id) {
    const res = await apiClient.delete(`/vault/${id}`);
    return res.data;
  },

  async update(id, updates) {
    const res = await apiClient.put(`/vault/${id}`, updates);
    return res.data;
  },

  // Convert File to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

export default vaultService;