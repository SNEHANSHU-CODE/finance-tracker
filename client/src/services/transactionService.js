import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a separate axios instance for auth service
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Store reference to get current token
let getCurrentToken = null;

// Method to set token getter (called from store setup)
export const setTokenGetter = (tokenGetter) => {
    getCurrentToken = tokenGetter;
};


// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        if (getCurrentToken) {
            const token = getCurrentToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);


const transactionService = {
  // Get all transactions with filters and pagination
  async getTransactions(params = {}) {
    console.log('Getting transactions with params:', params);
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

  //Get resent transaction
  async getRecentTransactions() {
    const response = await apiClient.get('transaction/recent');
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
  async getCategoryAnalysis(startDate, endDate) {
    const response = await apiClient.get(`/transaction/analysis/category?startDate=${startDate}&endDate=${endDate}`);
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

  // Export transactions as CSV
  async exportTransactionsCSV(params = {}) {
    const queryString = new URLSearchParams({...params, format: 'csv'}).toString();
    const response = await apiClient.get(`/transaction/export?${queryString}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};

export default transactionService;