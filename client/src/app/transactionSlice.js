import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import transactionService from '../services/transactionService';

// Async thunks for API calls
export const fetchTransactions = createAsyncThunk(
  'transaction/fetchTransactions',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const userId = getState().auth.user?.userId;
      if (!userId) return rejectWithValue({ message: 'Missing userId' });
      const response = await transactionService.getTransactions({...params, userId});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const searchTransactions = createAsyncThunk(
  'transaction/searchTransactions',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const userId = getState().auth.user?.userId;
      if (!userId) return rejectWithValue({ message: 'Missing userId' });
      const response = await transactionService.getTransactions({...params, userId});
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const recentTransactions = createAsyncThunk(
  'transaction/recent',
  async (_, { getState, rejectWithValue }) => {
    try {
      const userId = getState().auth.user?.userId;
      if (!userId) return rejectWithValue({ message: 'Missing userId' });
      const response = await transactionService.getRecentTransactions({ userId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createTransaction = createAsyncThunk(
  'transaction/createTransaction',
  async (transactionData, { rejectWithValue }) => {
    try {
      const response = await transactionService.createTransaction(transactionData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transaction/updateTransaction',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await transactionService.updateTransaction(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transaction/deleteTransaction',
  async (id, { rejectWithValue }) => {
    try {
      await transactionService.deleteTransaction(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const bulkDeleteTransactions = createAsyncThunk(
  'transaction/bulkDeleteTransactions',
  async (transactionIds, { rejectWithValue }) => {
    try {
      const response = await transactionService.bulkDeleteTransactions(transactionIds);
      return { deletedIds: transactionIds, response: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'transaction/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await transactionService.getDashboardStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchMonthlySummary = createAsyncThunk(
  'transaction/fetchMonthlySummary',
  async ({ month, year }, { rejectWithValue }) => {
    try {
      const response = await transactionService.getMonthlySummary(month, year);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchCategoryAnalysis = createAsyncThunk(
  'transaction/fetchCategoryAnalysis',
  async (_, { rejectWithValue }) => {
    try {
      // Calculate dates for the past year
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - 1);
      
      const response = await transactionService.getCategoryAnalysis(
        startDate.toISOString(),
        endDate.toISOString()
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchSpendingTrends = createAsyncThunk(
  'transaction/fetchSpendingTrends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await transactionService.getSpendingTrends();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  transactions: [],
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  },
  dashboardStats: null,
  monthlySummary: null,
  categoryAnalysis: null,
  spendingTrends: null,
  loading: false,
  error: null,
  filters: {
    searchTerm: '',
    type: 'all',
    category: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortOrder: 'desc'
  }
};

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSearchTerm: (state, action) => {
      state.filters.searchTerm = action.payload;
    },
    clearSearch: (state) => {
      state.filters.searchTerm = '';
      state.searchResults = [];
      state.searchError = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    resetTransactions: (state) => {
      state.transactions = [];
      state.pagination = initialState.pagination;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create transaction
      .addCase(createTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions.unshift(action.payload);
        // Update pagination
        state.pagination.totalItems += 1;
        if (state.transactions.length > state.pagination.itemsPerPage) {
          state.transactions.pop();
        }
        })
      .addCase(createTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update transaction
      .addCase(updateTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.transactions.findIndex(t => t._id === action.payload._id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(t => t._id !== action.payload);
        // Update pagination
        state.pagination.totalItems = Math.max(0, state.pagination.totalItems - 1);
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Bulk delete transactions
      .addCase(bulkDeleteTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = state.transactions.filter(
          t => !action.payload.deletedIds.includes(t._id)
        );
      })
      .addCase(bulkDeleteTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Dashboard stats
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.dashboardStats = action.payload;
      })
      
      // Monthly summary
      .addCase(fetchMonthlySummary.fulfilled, (state, action) => {
        state.monthlySummary = action.payload;
      })
      
      // Category analysis
      .addCase(fetchCategoryAnalysis.fulfilled, (state, action) => {
        state.categoryAnalysis = action.payload;
      })
      
      // Spending trends
      .addCase(fetchSpendingTrends.fulfilled, (state, action) => {
        state.spendingTrends = action.payload;
      });
  }
});

export const { setFilters, clearFilters, clearError, setLoading } = transactionSlice.actions;
export default transactionSlice.reducer;