import axios from "axios";
import { guestStorage } from '../utils/guestStorage';

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

// Store reference to get current token and guest mode
let getCurrentToken = null;
let isGuestMode = false;

// Method to set token getter (called from store setup)
export const setTokenGetter = (tokenGetter) => {
    getCurrentToken = tokenGetter;
};

// Method to set guest mode
export const setGuestMode = (guest) => {
    isGuestMode = guest;
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
    if (isGuestMode) {
      const transactions = guestStorage.getTransactions();
      // Apply basic filtering for guest mode
      let filtered = [...transactions];
      
      if (params.category) {
        filtered = filtered.filter(t => t.category === params.category);
      }
      if (params.type) {
        filtered = filtered.filter(t => t.type === params.type);
      }
      if (params.startDate) {
        filtered = filtered.filter(t => new Date(t.date) >= new Date(params.startDate));
      }
      if (params.endDate) {
        filtered = filtered.filter(t => new Date(t.date) <= new Date(params.endDate));
      }
      
      // Sort by date descending
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return {
        transactions: filtered,
        total: filtered.length,
        page: 1,
        totalPages: 1
      };
    }
    
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
    if (isGuestMode) {
      const transaction = {
        ...transactionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      guestStorage.addTransaction(transaction);
      return { data: transaction };
    }
    
    const response = await apiClient.post('/transaction/', transactionData);
    return response.data;
  },

  // Update transaction
  async updateTransaction(id, transactionData) {
    if (isGuestMode) {
      const updated = {
        ...transactionData,
        updatedAt: new Date().toISOString(),
      };
      guestStorage.updateTransaction(id, updated);
      return { data: { ...guestStorage.getTransactions().find(t => t._id === id), ...updated } };
    }
    
    const response = await apiClient.put(`/transaction/${id}`, transactionData);
    return response.data;
  },

  // Delete transaction
  async deleteTransaction(id) {
    if (isGuestMode) {
      guestStorage.deleteTransaction(id);
      return { message: 'Transaction deleted successfully' };
    }
    
    const response = await apiClient.delete(`/transaction/${id}`);
    return response.data;
  },

  // Get recent transactions
  async getRecentTransactions(limit = 5) {
    if (isGuestMode) {
      const transactions = guestStorage.getTransactions();
      return transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    }
    
    const response = await apiClient.get(`/transaction/recent?limit=${limit}`);
    return response.data;
  },

  // Get dashboard statistics
  async getDashboardStats() {
    if (isGuestMode) {
      const transactions = guestStorage.getTransactions();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      const totalIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const totalExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const balance = totalIncome - totalExpenses;
      
      return {
        totalIncome,
        totalExpenses,
        balance,
        transactionCount: monthlyTransactions.length
      };
    }
    
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
    if (isGuestMode) {
      const transactions = guestStorage.getTransactions();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
      
      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      return {
        month: currentMonth + 1,
        year: currentYear,
        income,
        expenses,
        balance: income - expenses,
        transactionCount: monthlyTransactions.length
      };
    }
    
    const response = await apiClient.get('/transaction/current-month');
    return response.data;
  },

  // Get category analysis
  async getCategoryAnalysis() {
  if (isGuestMode) {
    throw new Error('Analytics not available in guest mode');
  }
  const response = await apiClient.get(`/transaction/analysis/category`);
  return response.data;
},
  // Get spending trends
  async getSpendingTrends() {
    if (isGuestMode) {
      throw new Error('Analytics not available in guest mode');
    }
    
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

  // Migrate guest data
  async migrateGuestData(data) {
    if (isGuestMode) {
      throw new Error('Cannot migrate data while in guest mode');
    }
    
    const response = await apiClient.post('/transaction/migrate-guest-data', data);
    return response.data;
  }
};

export default transactionService;