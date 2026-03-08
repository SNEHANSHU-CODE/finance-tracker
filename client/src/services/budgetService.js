import apiClient from '../utils/axiosConfigs';

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