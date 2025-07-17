import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for analytics API
const analyticsApiClient = axios.create({
  baseURL: `${API_BASE_URL}/analytics`,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced error types
export const ERROR_TYPES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Token management
let getToken = () => null;
let onTokenExpired = () => {};

export const setTokenGetter = (tokenGetter) => {
  getToken = tokenGetter;
};

export const setTokenExpiredHandler = (handler) => {
  onTokenExpired = handler;
};

// Enhanced request interceptor
analyticsApiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add timezone and locale headers
    config.headers['x-timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    config.headers['x-locale'] = navigator.language || 'en-US';
    
    // Add request timestamp for debugging
    config.headers['x-request-timestamp'] = new Date().toISOString();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
analyticsApiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ Analytics API: ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    // Enhanced error handling
    const errorInfo = {
      type: ERROR_TYPES.UNKNOWN_ERROR,
      message: 'An unexpected error occurred',
      code: null,
      details: null,
      timestamp: new Date().toISOString()
    };

    if (error.code === 'ECONNABORTED') {
      errorInfo.type = ERROR_TYPES.TIMEOUT_ERROR;
      errorInfo.message = 'Request timed out. Please try again.';
    } else if (!error.response) {
      errorInfo.type = ERROR_TYPES.NETWORK_ERROR;
      errorInfo.message = 'Network error. Please check your connection.';
    } else {
      const { status, data } = error.response;
      errorInfo.code = status;
      errorInfo.details = data;

      switch (status) {
        case 401:
          errorInfo.type = ERROR_TYPES.AUTH_ERROR;
          errorInfo.message = 'Authentication failed. Please login again.';
          onTokenExpired();
          break;
        case 403:
          errorInfo.type = ERROR_TYPES.AUTH_ERROR;
          errorInfo.message = 'Access denied. You don\'t have permission for this action.';
          break;
        case 404:
          errorInfo.type = ERROR_TYPES.NOT_FOUND_ERROR;
          errorInfo.message = 'Requested resource not found.';
          break;
        case 422:
          errorInfo.type = ERROR_TYPES.VALIDATION_ERROR;
          errorInfo.message = data?.message || 'Validation failed. Please check your input.';
          break;
        case 429:
          errorInfo.type = ERROR_TYPES.RATE_LIMIT_ERROR;
          errorInfo.message = 'Too many requests. Please wait before trying again.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorInfo.type = ERROR_TYPES.SERVER_ERROR;
          errorInfo.message = 'Server error. Please try again later.';
          break;
        default:
          errorInfo.message = data?.message || `Request failed with status ${status}`;
      }
    }

    console.error('❌ Analytics API Error:', errorInfo);
    
    // Attach error info to the error object
    error.analyticsError = errorInfo;
    
    return Promise.reject(error);
  }
);

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Cache management
  getCacheKey(endpoint, params = {}) {
    const paramsStr = JSON.stringify(params);
    return `${endpoint}:${paramsStr}`;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  clearCache() {
    this.cache.clear();
  }

  // Enhanced API methods with caching and retry logic
  async makeRequest(endpoint, params = {}, options = {}) {
    const { useCache = true, retries = 2, retryDelay = 1000 } = options;
    
    // Check cache first
    if (useCache) {
      const cacheKey = this.getCacheKey(endpoint, params);
      const cached = this.getCache(cacheKey);
      if (cached) {
        return { data: cached };
      }
    }

    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });

    const url = queryParams.toString() ? `${endpoint}?${queryParams.toString()}` : endpoint;

    let lastError;
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await analyticsApiClient.get(url);
        
        // Cache successful responses
        if (useCache) {
          const cacheKey = this.getCacheKey(endpoint, params);
          this.setCache(cacheKey, response.data);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          break;
        }
        
        // Wait before retry
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)));
        }
      }
    }

    throw lastError;
  }

  // Dashboard overview
  async getDashboard(params = {}) {
    return this.makeRequest('/dashboard', params);
  }

  // Monthly analytics
  async getMonthlyAnalytics(year, month) {
    return this.makeRequest(`/monthly/${year}/${month}`);
  }

  async getCurrentMonthAnalytics() {
    return this.makeRequest('/monthly/current');
  }

  // Spending analysis
  async getSpendingTrends(params = {}) {
    return this.makeRequest('/spending/trends', params);
  }

  async getCategoryAnalysis(params = {}) {
    return this.makeRequest('/spending/categories', params);
  }

  async getSpendingComparison(params = {}) {
    return this.makeRequest('/spending/comparison', params);
  }

  async getSpendingPatterns(params = {}) {
    return this.makeRequest('/spending/patterns', params);
  }

  // Income analysis
  async getIncomeTrends(params = {}) {
    return this.makeRequest('/income/trends', params);
  }

  async getIncomeSources(params = {}) {
    return this.makeRequest('/income/sources', params);
  }

  async getIncomeProjections(params = {}) {
    return this.makeRequest('/income/projections', params);
  }

  // Goals analytics
  async getGoalsProgress() {
    return this.makeRequest('/goals/progress');
  }

  async getGoalsSummary() {
    return this.makeRequest('/goals/summary');
  }

  async getGoalsProjections() {
    return this.makeRequest('/goals/projections');
  }

  // Transaction insights
  async getTransactionInsights(params = {}) {
    return this.makeRequest('/transactions/insights', params);
  }

  async getTransactionPatterns(params = {}) {
    return this.makeRequest('/transactions/patterns', params);
  }

  async getTransactionAnomalies(params = {}) {
    return this.makeRequest('/transactions/anomalies', params);
  }

  // Savings analytics
  async getSavingsRate(params = {}) {
    return this.makeRequest('/savings/rate', params);
  }

  async getSavingsTrends(params = {}) {
    return this.makeRequest('/savings/trends', params);
  }

  async getSavingsProjections(params = {}) {
    return this.makeRequest('/savings/projections', params);
  }

  // Budget performance
  async getBudgetPerformance(params = {}) {
    return this.makeRequest('/budget/performance', params);
  }

  async getBudgetVariance(params = {}) {
    return this.makeRequest('/budget/variance', params);
  }

  async getBudgetRecommendations(params = {}) {
    return this.makeRequest('/budget/recommendations', params);
  }

  // Advanced analytics
  async getCashFlowAnalysis(params = {}) {
    return this.makeRequest('/advanced/cash-flow', params);
  }

  async getFinancialHealth(params = {}) {
    return this.makeRequest('/advanced/financial-health', params);
  }

  async getSpendingForecast(params = {}) {
    return this.makeRequest('/advanced/spending-forecast', params);
  }

  async getIncomeForecast(params = {}) {
    return this.makeRequest('/advanced/income-forecast', params);
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
    return this.makeRequest(`/chart/${chartType}`, params);
  }

  // Custom analytics (premium feature)
  async getCustomAnalytics(customConfig) {
    const response = await analyticsApiClient.post('/custom', customConfig);
    return response;
  }

  // Real-time analytics
  async getRealTimeUpdates(params = {}) {
    return this.makeRequest('/realtime/updates', params, { useCache: false });
  }

  // Batch operations
  async getBatchAnalytics(requests) {
    const response = await analyticsApiClient.post('/batch', { requests });
    return response;
  }

  // Helper methods for client-side processing
  formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    if (amount === null || amount === undefined) return 'N/A';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  }

  formatPercentage(value, decimals = 1, locale = 'en-US') {
    if (value === null || value === undefined) return 'N/A';
    
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  formatNumber(number, decimals = 0, locale = 'en-US') {
    if (number === null || number === undefined) return 'N/A';
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  }

  formatDate(dateString, format = 'short', locale = 'en-US') {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const options = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      monthYear: { year: 'numeric', month: 'short' },
      full: { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      }
    };
    
    return date.toLocaleDateString(locale, options[format] || options.short);
  }

  // Enhanced calculation methods
  calculateChange(current, previous) {
    if (previous === 0 || previous === null || previous === undefined) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  calculateGrowthRate(values) {
    if (!values || values.length < 2) return 0;
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const periods = values.length - 1;
    
    if (firstValue === 0) return 0;
    
    return (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
  }

  calculateMovingAverage(values, period = 3) {
    if (!values || values.length < period) return values;
    
    const result = [];
    for (let i = period - 1; i < values.length; i++) {
      const sum = values.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  // Color and icon helpers
  getChangeColor(value, type = 'general') {
    const colorMap = {
      expense: value > 0 ? 'danger' : 'success',
      income: value > 0 ? 'success' : 'danger',
      savings: value > 0 ? 'success' : 'danger',
      general: value > 0 ? 'success' : 'danger'
    };
    
    return colorMap[type] || colorMap.general;
  }

  getChangeIcon(value) {
    if (value > 0) return 'arrow-up';
    if (value < 0) return 'arrow-down';
    return 'minus';
  }

  getTrendIndicator(values) {
    if (!values || values.length < 2) return 'stable';
    
    const recentValues = values.slice(-3);
    const trend = recentValues.reduce((acc, val, i) => {
      if (i === 0) return acc;
      return acc + (val - recentValues[i - 1]);
    }, 0);
    
    if (trend > 0) return 'up';
    if (trend < 0) return 'down';
    return 'stable';
  }

  // Data processing methods
  formatTrendData(trends, valueKey = 'amount') {
    if (!trends || !Array.isArray(trends)) return [];
    
    return trends.map(trend => ({
      ...trend,
      formattedValue: this.formatCurrency(trend[valueKey]),
      formattedDate: this.formatDate(trend.date || trend.monthYear, 'monthYear')
    }));
  }

  processCategoryData(categories, totalAmount = null) {
    if (!categories || !Array.isArray(categories)) return [];
    
    const total = totalAmount || categories.reduce((sum, cat) => sum + (cat.amount || 0), 0);
    
    return categories.map(category => ({
      ...category,
      percentage: total > 0 ? (category.amount / total) * 100 : 0,
      formattedAmount: this.formatCurrency(category.amount),
      formattedPercentage: this.formatPercentage(total > 0 ? (category.amount / total) * 100 : 0)
    }));
  }

  processTimeSeriesData(data, dateKey = 'date', valueKey = 'amount') {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map((item, index) => ({
      ...item,
      formattedDate: this.formatDate(item[dateKey]),
      formattedValue: this.formatCurrency(item[valueKey]),
      change: index > 0 ? this.calculateChange(item[valueKey], data[index - 1][valueKey]) : 0
    }));
  }

  // Date range helpers
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
      'last6months': {
        label: 'Last 6 Months',
        startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      'last1year': {
        label: 'Last Year',
        startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
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

  validateDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

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

    return { start, end, diffDays };
  }

  getComparisonPeriods(currentStartDate, currentEndDate) {
    const { start, end, diffDays } = this.validateDateRange(currentStartDate, currentEndDate);
    
    const previousStart = new Date(start.getTime() - (diffDays * 24 * 60 * 60 * 1000));
    const previousEnd = new Date(start.getTime() - (24 * 60 * 60 * 1000));

    return {
      current: {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        label: `${this.formatDate(start)} - ${this.formatDate(end)}`
      },
      previous: {
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0],
        label: `${this.formatDate(previousStart)} - ${this.formatDate(previousEnd)}`
      }
    };
  }

  // Export helpers
  downloadExportedFile(response, filename) {
    try {
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  getExportFilename(type, format = 'csv') {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `analytics_${type}_${timestamp}.${format}`;
  }

  // Performance monitoring
  async measurePerformance(operation, ...args) {
    const startTime = performance.now();
    try {
      const result = await operation(...args);
      const endTime = performance.now();
      
      if (import.meta.env.DEV) {
        console.log(`⚡ Analytics Operation took ${endTime - startTime} milliseconds`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`❌ Analytics Operation failed after ${endTime - startTime} milliseconds:`, error);
      throw error;
    }
  }

  // Utility methods
  isValidAmount(amount) {
    return typeof amount === 'number' && !isNaN(amount) && isFinite(amount);
  }

  sanitizeParams(params) {
    const sanitized = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== '' && value !== null && value !== undefined) {
        sanitized[key] = value;
      }
    });
    return sanitized;
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Health check
  async healthCheck() {
    try {
      const response = await analyticsApiClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Analytics service is not available');
    }
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;