import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import analyticsService from '../services/analyticsService';

// Async thunks for API calls
export const fetchDashboard = createAsyncThunk(
  'analytics/fetchDashboard',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getDashboard();
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch dashboard data' });
    }
  }
);

export const fetchMonthlyAnalytics = createAsyncThunk(
  'analytics/fetchMonthlyAnalytics',
  async ({ year, month }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getMonthlyAnalytics(year, month);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch monthly analytics' });
    }
  }
);

export const fetchCurrentMonthAnalytics = createAsyncThunk(
  'analytics/fetchCurrentMonthAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getCurrentMonthAnalytics();
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch current month analytics' });
    }
  }
);

export const fetchSpendingTrends = createAsyncThunk(
  'analytics/fetchSpendingTrends',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSpendingTrends(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch spending trends' });
    }
  }
);

export const fetchCategoryAnalysis = createAsyncThunk(
  'analytics/fetchCategoryAnalysis',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getCategoryAnalysis(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch category analysis' });
    }
  }
);

export const fetchSpendingComparison = createAsyncThunk(
  'analytics/fetchSpendingComparison',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSpendingComparison(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch spending comparison' });
    }
  }
);

export const fetchIncomeTrends = createAsyncThunk(
  'analytics/fetchIncomeTrends',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getIncomeTrends(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch income trends' });
    }
  }
);

export const fetchIncomeSources = createAsyncThunk(
  'analytics/fetchIncomeSources',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getIncomeSources(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch income sources' });
    }
  }
);

export const fetchGoalsProgress = createAsyncThunk(
  'analytics/fetchGoalsProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getGoalsProgress();
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch goals progress' });
    }
  }
);

export const fetchGoalsSummary = createAsyncThunk(
  'analytics/fetchGoalsSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getGoalsSummary();
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch goals summary' });
    }
  }
);

export const fetchTransactionInsights = createAsyncThunk(
  'analytics/fetchTransactionInsights',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getTransactionInsights(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transaction insights' });
    }
  }
);

export const fetchTransactionPatterns = createAsyncThunk(
  'analytics/fetchTransactionPatterns',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getTransactionPatterns(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch transaction patterns' });
    }
  }
);

export const fetchSavingsRate = createAsyncThunk(
  'analytics/fetchSavingsRate',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSavingsRate(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch savings rate' });
    }
  }
);

export const fetchSavingsTrends = createAsyncThunk(
  'analytics/fetchSavingsTrends',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getSavingsTrends(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch savings trends' });
    }
  }
);

export const fetchBudgetPerformance = createAsyncThunk(
  'analytics/fetchBudgetPerformance',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getBudgetPerformance(params);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch budget performance' });
    }
  }
);

export const fetchChartData = createAsyncThunk(
  'analytics/fetchChartData',
  async ({ chartType, params = {} }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getChartData(chartType, params);
      return { chartType, data: response.data?.data || response.data || response };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch chart data' });
    }
  }
);

export const fetchCustomAnalytics = createAsyncThunk(
  'analytics/fetchCustomAnalytics',
  async (customConfig, { rejectWithValue }) => {
    try {
      const response = await analyticsService.getCustomAnalytics(customConfig);
      return response.data?.data || response.data || response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch custom analytics' });
    }
  }
);

export const exportAnalytics = createAsyncThunk(
  'analytics/exportAnalytics',
  async ({ type, params = {} }, { rejectWithValue }) => {
    try {
      const response = await analyticsService.exportAnalytics(type, params);
      const filename = analyticsService.getExportFilename(type, params.format || 'csv');
      analyticsService.downloadExportedFile(response, filename);
      return { type, filename };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to export analytics' });
    }
  }
);

const initialState = {
  // Dashboard data
  dashboard: {
    monthly: null,
    recent: [],
    goals: null,
    savingsRate: null,
    generatedAt: null
  },
  
  // Monthly analytics
  monthlyAnalytics: null,
  currentMonthAnalytics: null,
  
  // Spending analytics
  spendingTrends: {
    trends: [],
    averageMonthlySpending: 0,
    totalSpending: 0,
    period: null
  },
  categoryAnalysis: {
    categories: [],
    totalAmount: 0,
    period: null
  },
  spendingComparison: {
    period1: null,
    period2: null,
    changes: null
  },
  
  // Income analytics
  incomeTrends: {
    trends: [],
    averageMonthlyIncome: 0
  },
  incomeSources: {
    sources: [],
    totalIncome: 0
  },
  
  // Goals analytics
  goalsProgress: {
    goals: [],
    summary: {
      totalGoals: 0,
      averageProgress: 0,
      onTrackGoals: 0,
      overdueGoals: 0
    }
  },
  goalsSummary: null,
  
  // Transaction analytics
  transactionInsights: {
    period: null,
    totalTransactions: 0,
    dailyAverage: 0,
    maxTransaction: 0,
    minTransaction: 0,
    averagePerDay: 0,
    mostUsedPaymentMethod: null,
    topCategory: null
  },
  transactionPatterns: {
    weeklyPattern: [],
    mostActiveDay: null,
    period: null
  },
  
  // Savings analytics
  savingsRate: {
    rate: 0,
    totalSavings: 0,
    totalIncome: 0,
    totalExpenses: 0,
    period: null
  },
  savingsTrends: {
    trends: [],
    averageMonthlySavings: 0,
    totalSavings: 0,
    bestMonth: null,
    period: null
  },
  
  // Budget analytics
  budgetPerformance: {
    message: null,
    categories: [],
    overallPerformance: 0,
    recommendations: []
  },
  
  // Chart data
  chartData: {},
  
  // Custom analytics
  customAnalytics: null,
  
  // Loading states
  loading: {
    dashboard: false,
    monthly: false,
    spending: false,
    income: false,
    goals: false,
    transactions: false,
    savings: false,
    budget: false,
    chart: false,
    custom: false,
    export: false
  },
  
  // Error states
  error: null,
  
  // Filters and settings
  filters: {
    period: 'monthly',
    startDate: null,
    endDate: null,
    categories: [],
    metric: 'amount'
  },
  
  // UI state
  lastUpdated: null,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetAnalytics: (state) => {
      return { ...initialState };
    },
    setChartData: (state, action) => {
      const { chartType, data } = action.payload;
      state.chartData[chartType] = data;
    },
    clearChartData: (state, action) => {
      if (action.payload) {
        delete state.chartData[action.payload];
      } else {
        state.chartData = {};
      }
    },
    updateLastUpdated: (state) => {
      state.lastUpdated = new Date().toISOString();
    },
    setLoadingState: (state, action) => {
      const { section, isLoading } = action.payload;
      state.loading[section] = isLoading;
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading.dashboard = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading.dashboard = false;
        state.dashboard = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading.dashboard = false;
        state.error = action.payload?.message || 'Failed to fetch dashboard data';
      })

      // Monthly analytics
      .addCase(fetchMonthlyAnalytics.pending, (state) => {
        state.loading.monthly = true;
        state.error = null;
      })
      .addCase(fetchMonthlyAnalytics.fulfilled, (state, action) => {
        state.loading.monthly = false;
        state.monthlyAnalytics = action.payload;
      })
      .addCase(fetchMonthlyAnalytics.rejected, (state, action) => {
        state.loading.monthly = false;
        state.error = action.payload?.message || 'Failed to fetch monthly analytics';
      })

      // Current month analytics
      .addCase(fetchCurrentMonthAnalytics.pending, (state) => {
        state.loading.monthly = true;
        state.error = null;
      })
      .addCase(fetchCurrentMonthAnalytics.fulfilled, (state, action) => {
        state.loading.monthly = false;
        state.currentMonthAnalytics = action.payload;
      })
      .addCase(fetchCurrentMonthAnalytics.rejected, (state, action) => {
        state.loading.monthly = false;
        state.error = action.payload?.message || 'Failed to fetch current month analytics';
      })

      // Spending trends
      .addCase(fetchSpendingTrends.pending, (state) => {
        state.loading.spending = true;
        state.error = null;
      })
      .addCase(fetchSpendingTrends.fulfilled, (state, action) => {
        state.loading.spending = false;
        state.spendingTrends = action.payload;
      })
      .addCase(fetchSpendingTrends.rejected, (state, action) => {
        state.loading.spending = false;
        state.error = action.payload?.message || 'Failed to fetch spending trends';
      })

      // Category analysis
      .addCase(fetchCategoryAnalysis.pending, (state) => {
        state.loading.spending = true;
        state.error = null;
      })
      .addCase(fetchCategoryAnalysis.fulfilled, (state, action) => {
        state.loading.spending = false;
        state.categoryAnalysis = action.payload;
      })
      .addCase(fetchCategoryAnalysis.rejected, (state, action) => {
        state.loading.spending = false;
        state.error = action.payload?.message || 'Failed to fetch category analysis';
      })

      // Spending comparison
      .addCase(fetchSpendingComparison.pending, (state) => {
        state.loading.spending = true;
        state.error = null;
      })
      .addCase(fetchSpendingComparison.fulfilled, (state, action) => {
        state.loading.spending = false;
        state.spendingComparison = action.payload;
      })
      .addCase(fetchSpendingComparison.rejected, (state, action) => {
        state.loading.spending = false;
        state.error = action.payload?.message || 'Failed to fetch spending comparison';
      })

      // Income trends
      .addCase(fetchIncomeTrends.pending, (state) => {
        state.loading.income = true;
        state.error = null;
      })
      .addCase(fetchIncomeTrends.fulfilled, (state, action) => {
        state.loading.income = false;
        state.incomeTrends = action.payload;
      })
      .addCase(fetchIncomeTrends.rejected, (state, action) => {
        state.loading.income = false;
        state.error = action.payload?.message || 'Failed to fetch income trends';
      })

      // Income sources
      .addCase(fetchIncomeSources.pending, (state) => {
        state.loading.income = true;
        state.error = null;
      })
      .addCase(fetchIncomeSources.fulfilled, (state, action) => {
        state.loading.income = false;
        state.incomeSources = action.payload;
      })
      .addCase(fetchIncomeSources.rejected, (state, action) => {
        state.loading.income = false;
        state.error = action.payload?.message || 'Failed to fetch income sources';
      })

      // Goals progress
      .addCase(fetchGoalsProgress.pending, (state) => {
        state.loading.goals = true;
        state.error = null;
      })
      .addCase(fetchGoalsProgress.fulfilled, (state, action) => {
        state.loading.goals = false;
        state.goalsProgress = action.payload;
      })
      .addCase(fetchGoalsProgress.rejected, (state, action) => {
        state.loading.goals = false;
        state.error = action.payload?.message || 'Failed to fetch goals progress';
      })

      // Goals summary
      .addCase(fetchGoalsSummary.pending, (state) => {
        state.loading.goals = true;
        state.error = null;
      })
      .addCase(fetchGoalsSummary.fulfilled, (state, action) => {
        state.loading.goals = false;
        state.goalsSummary = action.payload;
      })
      .addCase(fetchGoalsSummary.rejected, (state, action) => {
        state.loading.goals = false;
        state.error = action.payload?.message || 'Failed to fetch goals summary';
      })

      // Transaction insights
      .addCase(fetchTransactionInsights.pending, (state) => {
        state.loading.transactions = true;
        state.error = null;
      })
      .addCase(fetchTransactionInsights.fulfilled, (state, action) => {
        state.loading.transactions = false;
        state.transactionInsights = action.payload;
      })
      .addCase(fetchTransactionInsights.rejected, (state, action) => {
        state.loading.transactions = false;
        state.error = action.payload?.message || 'Failed to fetch transaction insights';
      })

      // Transaction patterns
      .addCase(fetchTransactionPatterns.pending, (state) => {
        state.loading.transactions = true;
        state.error = null;
      })
      .addCase(fetchTransactionPatterns.fulfilled, (state, action) => {
        state.loading.transactions = false;
        state.transactionPatterns = action.payload;
      })
      .addCase(fetchTransactionPatterns.rejected, (state, action) => {
        state.loading.transactions = false;
        state.error = action.payload?.message || 'Failed to fetch transaction patterns';
      })

      // Savings rate
      .addCase(fetchSavingsRate.pending, (state) => {
        state.loading.savings = true;
        state.error = null;
      })
      .addCase(fetchSavingsRate.fulfilled, (state, action) => {
        state.loading.savings = false;
        state.savingsRate = action.payload;
      })
      .addCase(fetchSavingsRate.rejected, (state, action) => {
        state.loading.savings = false;
        state.error = action.payload?.message || 'Failed to fetch savings rate';
      })

      // Savings trends
      .addCase(fetchSavingsTrends.pending, (state) => {
        state.loading.savings = true;
        state.error = null;
      })
      .addCase(fetchSavingsTrends.fulfilled, (state, action) => {
        state.loading.savings = false;
        state.savingsTrends = action.payload;
      })
      .addCase(fetchSavingsTrends.rejected, (state, action) => {
        state.loading.savings = false;
        state.error = action.payload?.message || 'Failed to fetch savings trends';
      })

      // Budget performance
      .addCase(fetchBudgetPerformance.pending, (state) => {
        state.loading.budget = true;
        state.error = null;
      })
      .addCase(fetchBudgetPerformance.fulfilled, (state, action) => {
        state.loading.budget = false;
        state.budgetPerformance = action.payload;
      })
      .addCase(fetchBudgetPerformance.rejected, (state, action) => {
        state.loading.budget = false;
        state.error = action.payload?.message || 'Failed to fetch budget performance';
      })

      // Chart data
      .addCase(fetchChartData.pending, (state) => {
        state.loading.chart = true;
        state.error = null;
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.loading.chart = false;
        const { chartType, data } = action.payload;
        state.chartData[chartType] = data;
      })
      .addCase(fetchChartData.rejected, (state, action) => {
        state.loading.chart = false;
        state.error = action.payload?.message || 'Failed to fetch chart data';
      })

      // Custom analytics
      .addCase(fetchCustomAnalytics.pending, (state) => {
        state.loading.custom = true;
        state.error = null;
      })
      .addCase(fetchCustomAnalytics.fulfilled, (state, action) => {
        state.loading.custom = false;
        state.customAnalytics = action.payload;
      })
      .addCase(fetchCustomAnalytics.rejected, (state, action) => {
        state.loading.custom = false;
        state.error = action.payload?.message || 'Failed to fetch custom analytics';
      })

      // Export analytics
      .addCase(exportAnalytics.pending, (state) => {
        state.loading.export = true;
        state.error = null;
      })
      .addCase(exportAnalytics.fulfilled, (state, action) => {
        state.loading.export = false;
        // Could store export history here if needed
      })
      .addCase(exportAnalytics.rejected, (state, action) => {
        state.loading.export = false;
        state.error = action.payload?.message || 'Failed to export analytics';
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  resetAnalytics,
  setChartData,
  clearChartData,
  updateLastUpdated,
  setLoadingState
} = analyticsSlice.actions;

export default analyticsSlice.reducer;
