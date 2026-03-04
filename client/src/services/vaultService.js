import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // longer for file uploads
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let getCurrentToken = null;
export const setTokenGetter = (getter) => { getCurrentToken = getter; };

apiClient.interceptors.request.use((config) => {
  if (getCurrentToken) {
    const token = getCurrentToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
    const res = await apiClient.post('/vault/upload', payload);
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