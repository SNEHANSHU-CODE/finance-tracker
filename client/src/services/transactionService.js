import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/transaction`,
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
  console.log('Transaction service token getter set'); // Debug log
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('Transaction service interceptor called'); // Debug log
    
    if (getCurrentToken) {
      const token = getCurrentToken();
      console.log('Token retrieved:', token ? 'Token exists' : 'No token'); // Debug log
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Authorization header set'); // Debug log
      } else {
        console.log('No token available'); // Debug log
      }
    } else {
      console.log('getCurrentToken function not available'); // Debug log
    }
    
    console.log('Final request headers:', config.headers); // Debug log
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error); // Debug log
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Transaction service response error:', error.response?.status, error.response?.data); // Debug log
    
    if (error.response?.status === 401) {
      console.error('Unauthorized access - token may be expired');
    }
    return Promise.reject(error);
  }
);

const transactionService = {
  // Get all transactions with filters and pagination
  async getTransactions(params = {}) {
    console.log('Getting transactions with params:', params); // Debug log
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/?${queryString}`);
    return response.data;
  },

  // Get single transaction by ID
  async getTransactionById(id) {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  // Create new transaction
  async createTransaction(transactionData) {
    const response = await api.post('/', transactionData);
    return response.data;
  },

  // Update transaction
  async updateTransaction(id, transactionData) {
    const response = await api.put(`/${id}`, transactionData);
    return response.data;
  },

  // Delete transaction
  async deleteTransaction(id) {
    const response = await api.delete(`/${id}`);
    return response.data;
  },

  // Get recent transactions
  async getRecentTransactions(limit = 5) {
    const response = await api.get(`/recent?limit=${limit}`);
    return response.data;
  },

  // Get dashboard statistics
  async getDashboardStats() {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // Get monthly summary
  async getMonthlySummary(month, year) {
    const response = await api.get(`/summary/${month}/${year}`);
    return response.data;
  },

  // Get current month summary
  async getCurrentMonthSummary() {
    const response = await api.get('/current-month');
    return response.data;
  },

  // Get category analysis
  async getCategoryAnalysis(startDate, endDate) {
    const response = await api.get(`/analysis/category?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get spending trends
  async getSpendingTrends() {
    const response = await api.get('/trends');
    return response.data;
  },

  // Set transaction as recurring
  async setRecurring(id, frequency, endDate = null) {
    const response = await api.post(`/${id}/recurring`, { frequency, endDate });
    return response.data;
  },

  // Bulk delete transactions
  async bulkDeleteTransactions(transactionIds) {
    const response = await api.post('/bulk-delete', { transactionIds });
    return response.data;
  },

  // Export transactions
  async exportTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/export?${queryString}`);
    return response.data;
  },

  // Export transactions as CSV
  async exportTransactionsCSV(params = {}) {
    const queryString = new URLSearchParams({...params, format: 'csv'}).toString();
    const response = await api.get(`/export?${queryString}`, {
      responseType: 'blob',
    });
    return response.data;
  }
};

export default transactionService;