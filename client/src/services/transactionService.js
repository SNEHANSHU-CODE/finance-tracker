import apiClient from '../utils/axiosConfigs';
import chatServerClient from '../utils/chatServerAxiosConfig';

const transactionService = {
  // Get all transactions with filters and pagination
  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/transaction/?${queryString}`);
    return response.data;
  },

  // Get single transaction by ID
  async getTransactionById(id) {
    const response = await apiClient.get(`/transaction/${id}`);
    return response.data;
  },

  // Create new transaction
  async createTransaction(transactionData) {
    const response = await apiClient.post('/transaction/', transactionData);
    return response.data;
  },

  // Update transaction
  async updateTransaction(id, transactionData) {
    const response = await apiClient.put(`/transaction/${id}`, transactionData);
    return response.data;
  },

  // Delete transaction
  async deleteTransaction(id) {
    const response = await apiClient.delete(`/transaction/${id}`);
    return response.data;
  },

  // Get recent transactions
  async getRecentTransactions(limit = 5) {
    const response = await apiClient.get(`/transaction/recent?limit=${limit}`);
    return response.data;
  },

  // Get dashboard statistics
  async getDashboardStats() {
    const response = await apiClient.get('/transaction/dashboard');
    return response.data;
  },

  // Get monthly summary
  async getMonthlySummary(month, year) {
    const response = await apiClient.get(`/transaction/summary/${month}/${year}`);
    return response.data;
  },

  // Get current month summary
  async getCurrentMonthSummary() {
    const response = await apiClient.get('/transaction/current-month');
    return response.data;
  },

  // Get category analysis
  async getCategoryAnalysis() {
    const response = await apiClient.get(`/transaction/analysis/category`);
    return response.data;
  },

  // Get spending trends
  async getSpendingTrends() {
    const response = await apiClient.get('/transaction/trends');
    return response.data;
  },

  // Set transaction as recurring
  async setRecurring(id, frequency, endDate = null) {
    const response = await apiClient.post(`/transaction/${id}/recurring`, { frequency, endDate });
    return response.data;
  },

  // Bulk delete transactions
  async bulkDeleteTransactions(transactionIds) {
    const response = await apiClient.post('/transaction/bulk-delete', { transactionIds });
    return response.data;
  },

  // Export transactions
  async exportTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/transaction/export?${queryString}`);
    return response.data;
  },

  // Upload file to chatServer and get extracted transactions back
  // format: 'pdf' | 'csv' | 'excel'
  // password: optional string for encrypted PDFs
  async uploadFileToExtract(file, format = 'pdf', password = null) {
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);
    const response = await chatServerClient.post(
      `/api/import/${format}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data; // { success, count, transactions, message, needs_password }
  },

  // Bulk insert transactions into mainServer
  async bulkInsertTransactions(transactions) {
    const response = await apiClient.post('/transaction/bulk-insert', { transactions });
    return response.data;
  },

};

export default transactionService;