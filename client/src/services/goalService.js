import axios from 'axios';
import { guestStorage } from '../utils/guestStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance for goals API
const goalApiClient = axios.create({
    baseURL: `${API_BASE_URL}/goals`, // Note: includes /goals in baseURL
    timeout: 10000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token getter function - will be set by store
let getToken = () => null;
let isGuestMode = false;

export const setTokenGetter = (tokenGetter) => {
  getToken = tokenGetter;
};

export const setGuestMode = (guest) => {
  isGuestMode = guest;
};

// Request interceptor to add auth token
goalApiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
goalApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - could dispatch logout action here
      console.error('Authentication failed');
    }
    return Promise.reject(error);
  }
);

class GoalService {
  // Get all goals with optional filters
  async getGoals(filters = {}) {
    if (isGuestMode) {
      const goals = guestStorage.getGoals();
      let filtered = [...goals];
      
      if (filters.category) {
        filtered = filtered.filter(g => g.category === filters.category);
      }
      if (filters.status) {
        filtered = filtered.filter(g => g.status === filters.status);
      }
      if (filters.priority) {
        filtered = filtered.filter(g => g.priority === filters.priority);
      }
      
      return {
        data: {
          goals: filtered,
          total: filtered.length,
          page: 1,
          totalPages: 1
        }
      };
    }
    
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await goalApiClient.get(`/?${params.toString()}`);
    console.log('Fetched goals response:', response);
    return response;
  }

  // Get goal by ID
  async getGoalById(goalId) {
    const response = await goalApiClient.get(`/${goalId}`);
    return response;
  }

  // Create new goal
  async createGoal(goalData) {
    if (isGuestMode) {
      const goal = {
        ...goalData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        progress: 0,
      };
      guestStorage.addGoal(goal);
      return { data: goal };
    }
    
    const response = await goalApiClient.post('/', goalData);
    return response;
  }

  // Update goal
  async updateGoal(goalId, goalData) {
    if (isGuestMode) {
      const updated = {
        ...goalData,
        updatedAt: new Date().toISOString(),
      };
      guestStorage.updateGoal(goalId, updated);
      return { data: { ...guestStorage.getGoals().find(g => g.id === goalId), ...updated } };
    }
    
    const response = await goalApiClient.put(`/${goalId}`, goalData);
    return response;
  }

  // Delete goal
  async deleteGoal(goalId) {
    if (isGuestMode) {
      guestStorage.deleteGoal(goalId);
      return { data: { message: 'Goal deleted successfully' } };
    }
    
    const response = await goalApiClient.delete(`/${goalId}`);
    return response;
  }

  // Add contribution to goal
  async addContribution(goalId, amount) {
    const response = await goalApiClient.post(`/${goalId}/contribute`, { amount });
    return response;
  }

  // Mark goal as complete
  async markGoalComplete(goalId) {
    const response = await goalApiClient.post(`/${goalId}/complete`);
    return response;
  }

  // Pause goal
  async pauseGoal(goalId) {
    const response = await goalApiClient.post(`/${goalId}/pause`);
    return response;
  }

  // Resume goal
  async resumeGoal(goalId) {
    const response = await goalApiClient.post(`/${goalId}/resume`);
    return response;
  }

  // Get goals by category
  async getGoalsByCategory(category) {
    const response = await goalApiClient.get(`/category/${category}`);
    return response;
  }

  // Get goals by priority
  async getGoalsByPriority(priority) {
    const response = await goalApiClient.get(`/priority/${priority}`);
    return response;
  }

  // Get overdue goals
  async getOverdueGoals() {
    const response = await goalApiClient.get('/overdue');
    return response;
  }

  // Get dashboard stats
  async getDashboardStats() {
    const response = await goalApiClient.get('/dashboard');
    return response;
  }

  // Get goals summary
  async getGoalsSummary() {
    const response = await goalApiClient.get('/summary');
    return response;
  }

  // Bulk delete goals
  async bulkDeleteGoals(goalIds) {
    const response = await goalApiClient.post('/bulk-delete', { goalIds });
    return response;
  }

  // Helper methods for client-side calculations
  getProgressPercentage(savedAmount, targetAmount) {
    if (targetAmount <= 0) return 0;
    return Math.min((savedAmount / targetAmount) * 100, 100);
  }

  getDaysRemaining(targetDate) {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  getRemainingAmount(savedAmount, targetAmount) {
    return Math.max(0, targetAmount - savedAmount);
  }

  isOverdue(targetDate, status) {
    if (status === 'Completed') return false;
    const today = new Date();
    const target = new Date(targetDate);
    return target < today;
  }

  getProgressColor(percentage) {
    if (percentage >= 100) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'danger';
  }

  getStatusIcon(goal) {
    const percentage = this.getProgressPercentage(goal.savedAmount, goal.targetAmount);
    const daysRemaining = this.getDaysRemaining(goal.targetDate);
    
    if (percentage >= 100) {
      return 'check-circle';
    } else if (daysRemaining < 30 && percentage < 75) {
      return 'exclamation-triangle';
    } else {
      return 'clock';
    }
  }

  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Calculate monthly savings needed
  calculateMonthlySavingsNeeded(goal) {
    const remainingAmount = this.getRemainingAmount(goal.savedAmount, goal.targetAmount);
    const daysRemaining = this.getDaysRemaining(goal.targetDate);
    const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
    return remainingAmount / monthsRemaining;
  }

  // Validate goal data
  validateGoalData(goalData) {
    const errors = [];

    if (!goalData.name || goalData.name.trim().length === 0) {
      errors.push('Goal name is required');
    }

    if (!goalData.targetAmount || goalData.targetAmount <= 0) {
      errors.push('Target amount must be greater than 0');
    }

    if (!goalData.targetDate) {
      errors.push('Target date is required');
    } else {
      const targetDate = new Date(goalData.targetDate);
      const today = new Date();
      if (targetDate <= today) {
        errors.push('Target date must be in the future');
      }
    }

    if (!goalData.category) {
      errors.push('Category is required');
    }

    return errors;
  }

  // Sort goals by various criteria
  sortGoals(goals, sortBy = 'targetDate', sortOrder = 'asc') {
    return [...goals].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'targetDate':
          aValue = new Date(a.targetDate);
          bValue = new Date(b.targetDate);
          break;
        case 'targetAmount':
          aValue = a.targetAmount;
          bValue = b.targetAmount;
          break;
        case 'savedAmount':
          aValue = a.savedAmount;
          bValue = b.savedAmount;
          break;
        case 'progress':
          aValue = this.getProgressPercentage(a.savedAmount, a.targetAmount);
          bValue = this.getProgressPercentage(b.savedAmount, b.targetAmount);
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Filter goals by various criteria
  filterGoals(goals, filters) {
    return goals.filter(goal => {
      if (filters.status && goal.status !== filters.status) return false;
      if (filters.category && goal.category !== filters.category) return false;
      if (filters.priority && goal.priority !== filters.priority) return false;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!goal.name.toLowerCase().includes(searchTerm) && 
            !goal.category.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });
  }

  // Migrate guest data
  async migrateGuestData(data) {
    if (isGuestMode) {
      throw new Error('Cannot migrate data while in guest mode');
    }
    
    const response = await goalApiClient.post('/migrate-guest-data', data);
    return response.data;
  }
}

const goalService = new GoalService();
export default goalService;