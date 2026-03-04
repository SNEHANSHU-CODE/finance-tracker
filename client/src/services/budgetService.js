import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let getCurrentToken = null;
export const setTokenGetter = (tokenGetter) => { getCurrentToken = tokenGetter; };

apiClient.interceptors.request.use((config) => {
  const token = getCurrentToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, Promise.reject);

const budgetService = {
  // FIX: param order was (month, year) in service but caller (budgetSlice) passed (year, month).
  // Standardised to (month, year) everywhere; slice thunk updated to match.
  async getBudget(month, year) {
    const res = await apiClient.get('/budget', { params: { month, year } });
    return res.data;
  },

  // FIX: was missing entirely — budgetSlice.fetchBudgetAnalysis called this and crashed at runtime.
  async getBudgetAnalysis(month, year) {
    const res = await apiClient.get('/budget/analysis', { params: { month, year } });
    return res.data;
  },

  async createBudget(data) {
    const res = await apiClient.post('/budget', data);
    return res.data;
  },
  async updateBudget(id, data) {
    const res = await apiClient.put(`/budget/${id}`, data);
    return res.data;
  },
  async deleteBudget(id) {
    const res = await apiClient.delete(`/budget/${id}`);
    return res.data;
  },
};

export default budgetService;