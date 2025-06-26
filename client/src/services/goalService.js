import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${API_BASE_URL}/goals`;

// Token getter function - will be set by store
let getToken = () => null;

export const setTokenGetter = (tokenGetter) => {
  getToken = tokenGetter;
};

// Create axios instance with interceptor
const apiClient = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
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
apiClient.interceptors.response.use(
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
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
        params.append(key, filters[key]);
      }
    });

    const response = await apiClient.get(`/?${params.toString()}`);
    return response.data;
  }

  // Get goal by ID
  async getGoalById(goalId) {
    const response = await apiClient.get(`/${goalId}`);
    return response.data;
  }

  // Create new goal
  async createGoal(goalData) {
    const response = await apiClient.post('/', goalData);
    return response.data;
  }

  // Update goal
  async updateGoal(goalId, goalData) {
    const response = await apiClient.put(`/${goalId}`, goalData);
    return response.data;
  }

  // Delete goal
  async deleteGoal(goalId) {
    const response = await apiClient.delete(`/${goalId}`);
    return response.data;
  }

  // Add contribution to goal
  async addContribution(goalId, amount) {
    const response = await apiClient.post(`/${goalId}/contribute`, { amount });
    return response.data;
  }

  // Mark goal as complete
  async markGoalComplete(goalId) {
    const response = await apiClient.post(`/${goalId}/complete`);
    return response.data;
  }

  // Pause goal
  async pauseGoal(goalId) {
    const response = await apiClient.post(`/${goalId}/pause`);
    return response.data;
  }

  // Resume goal
  async resumeGoal(goalId) {
    const response = await apiClient.post(`/${goalId}/resume`);
    return response.data;
  }

  // Get goals by category
  async getGoalsByCategory(category) {
    const response = await apiClient.get(`/category/${category}`);
    return response.data;
  }

  // Get goals by priority
  async getGoalsByPriority(priority) {
    const response = await apiClient.get(`/priority/${priority}`);
    return response.data;
  }

  // Get overdue goals
  async getOverdueGoals() {
    const response = await apiClient.get('/overdue');
    return response.data;
  }

  // Get dashboard stats
  async getDashboardStats() {
    const response = await apiClient.get('/dashboard');
    return response.data;
  }

  // Get goals summary
  async getGoalsSummary() {
    const response = await apiClient.get('/summary');
    return response.data;
  }

  // Bulk delete goals
  async bulkDeleteGoals(goalIds) {
    const response = await apiClient.post('/bulk-delete', { goalIds });
    return response.data;
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
}

const goalService = new GoalService();
export default goalService;