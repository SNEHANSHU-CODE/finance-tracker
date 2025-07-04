import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for analytics API
const analyticsApiClient = axios.create({
    baseURL: `${API_BASE_URL}/analytics`,
    timeout: 30000, // Longer timeout for analytics queries
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token getter function - will be set by store
let getToken = () => null;

export const setTokenGetter = (tokenGetter) => {
  getToken = tokenGetter;
};

// Request interceptor to add auth token
analyticsApiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timezone header
    config.headers['x-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
analyticsApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed');
    }
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    }
    return Promise.reject(error);
  }
);

class AnalyticsService {
  // Dashboard overview
  async getDashboard() {
    const response = await analyticsApiClient.get('/dashboard');
    return response;
  }

  // Monthly analytics
  async getMonthlyAnalytics(year, month) {
    const response = await analyticsApiClient.get(`/monthly/${year}/${month}`);
    return response;
  }

  async getCurrentMonthAnalytics() {
    const response = await analyticsApiClient.get('/monthly/current');
    return response;
  }

  // Spending analysis
  async getSpendingTrends(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/spending/trends?${queryParams.toString()}`);
    return response;
  }

  async getCategoryAnalysis(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/spending/categories?${queryParams.toString()}`);
    return response;
  }

  async getSpendingComparison(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/spending/comparison?${queryParams.toString()}`);
    return response;
  }

  // Income analysis
  async getIncomeTrends(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/income/trends?${queryParams.toString()}`);
    return response;
  }

  async getIncomeSources(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/income/sources?${queryParams.toString()}`);
    return response;
  }

  // Goals analytics
  async getGoalsProgress() {
    const response = await analyticsApiClient.get('/goals/progress');
    return response;
  }

  async getGoalsSummary() {
    const response = await analyticsApiClient.get('/goals/summary');
    return response;
  }

  // Transaction insights
  async getTransactionInsights(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/transactions/insights?${queryParams.toString()}`);
    return response;
  }

  async getTransactionPatterns(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/transactions/patterns?${queryParams.toString()}`);
    return response;
  }

  // Savings analytics
  async getSavingsRate(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/savings/rate?${queryParams.toString()}`);
    return response;
  }

  async getSavingsTrends(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/savings/trends?${queryParams.toString()}`);
    return response;
  }

  // Budget performance
  async getBudgetPerformance(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/budget/performance?${queryParams.toString()}`);
    return response;
  }

  // Export analytics data
  async exportAnalytics(type, params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/export/${type}?${queryParams.toString()}`, {
      responseType: 'blob'
    });
    return response;
  }

  // Chart data with specific formatting
  async getChartData(chartType, params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const response = await analyticsApiClient.get(`/chart/${chartType}?${queryParams.toString()}`);
    return response;
  }

  // Custom analytics (premium feature)
  async getCustomAnalytics(customConfig) {
    const response = await analyticsApiClient.post('/custom', customConfig);
    return response;
  }

  // Helper methods for client-side processing
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(value, decimals = 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  formatDate(dateString, format = 'short') {
    const date = new Date(dateString);
    const options = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      monthYear: { year: 'numeric', month: 'short' }
    };
    
    return date.toLocaleDateString('en-US', options[format] || options.short);
  }

  // Calculate period-over-period change
  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Get change color based on type and value
  getChangeColor(value, type = 'expense') {
    if (type === 'expense') {
      return value > 0 ? 'danger' : 'success'; // More expense = red, less = green
    } else if (type === 'income') {
      return value > 0 ? 'success' : 'danger'; // More income = green, less = red
    } else {
      return value > 0 ? 'success' : 'danger'; // General positive = green, negative = red
    }
  }

  // Get change icon based on value
  getChangeIcon(value) {
    if (value > 0) return 'arrow-up';
    if (value < 0) return 'arrow-down';
    return 'minus';
  }

  // Format trend data for charts
  formatTrendData(trends, valueKey = 'amount') {
    return trends.map(trend => ({
      ...trend,
      formattedValue: this.formatCurrency(trend[valueKey]),
      formattedDate: this.formatDate(trend.date || trend.monthYear, 'monthYear')
    }));
  }

  // Process category data for pie charts
  processCategoryData(categories, totalAmount) {
    return categories.map(category => ({
      ...category,
      percentage: (category.amount / totalAmount) * 100,
      formattedAmount: this.formatCurrency(category.amount),
      formattedPercentage: this.formatPercentage((category.amount / totalAmount) * 100)
    }));
  }

  // Generate date range options
  getDateRangeOptions() {
    const now = new Date();
    const ranges = {
      'last7days': {
        label: 'Last 7 Days',
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      'last30days': {
        label: 'Last 30 Days',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      'last90days': {
        label: 'Last 90 Days',
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      'thisMonth': {
        label: 'This Month',
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now
      },
      'lastMonth': {
        label: 'Last Month',
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0)
      },
      'thisYear': {
        label: 'This Year',
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now
      },
      'lastYear': {
        label: 'Last Year',
        startDate: new Date(now.getFullYear() - 1, 0, 1),
        endDate: new Date(now.getFullYear() - 1, 11, 31)
      }
    };

    return ranges;
  }

  // Validate date range
  validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      throw new Error('Start date must be before end date');
    }

    if (start > now) {
      throw new Error('Start date cannot be in the future');
    }

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 730) {
      throw new Error('Date range cannot exceed 2 years');
    }

    return true;
  }

  // Get analytics periods for comparison
  getComparisonPeriods(currentStartDate, currentEndDate) {
    const start = new Date(currentStartDate);
    const end = new Date(currentEndDate);
    const diffTime = end - start;

    const previousStart = new Date(start.getTime() - diffTime);
    const previousEnd = new Date(start.getTime() - 1);

    return {
      current: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: `${this.formatDate(start)} - ${this.formatDate(end)}`
      },
      previous: {
        startDate: previousStart.toISOString(),
        endDate: previousEnd.toISOString(),
        label: `${this.formatDate(previousStart)} - ${this.formatDate(previousEnd)}`
      }
    };
  }

  // Download exported file
  downloadExportedFile(response, filename) {
    const contentType = response.headers['content-type'];
    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Get export filename with timestamp
  getExportFilename(type, format = 'csv') {
    const timestamp = new Date().toISOString().split('T')[0];
    return `analytics_${type}_${timestamp}.${format}`;
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;