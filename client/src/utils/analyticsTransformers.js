/**
 * Analytics Data Transformers
 * 
 * Client-side utilities for validating and transforming analytics data
 * before rendering charts. Ensures data integrity and proper formatting.
 */

/**
 * Validate that a value is a valid number
 */
export const isValidNumber = (value) => {
  return value !== null && value !== undefined && !isNaN(Number(value)) && isFinite(Number(value));
};

/**
 * Safely convert to number with fallback
 */
export const toNumber = (value, fallback = 0) => {
  if (!isValidNumber(value)) return fallback;
  return Number(value);
};

/**
 * Default categories for spending analysis
 */
export const DEFAULT_CATEGORIES = [
  'Food', 'Transportation', 'Shopping', 'Entertainment', 'Utilities',
  'Healthcare', 'Education', 'Travel', 'Insurance', 'Rent', 'Other Expense'
];

/**
 * Default empty dashboard data
 */
export const getEmptyDashboard = () => ({
  monthly: {
    summary: {
      totalIncome: 0,
      totalExpenses: 0,
      netSavings: 0,
      savingsRate: 0,
    },
  },
  recent: [],
});

/**
 * Default empty spending trends
 */
export const getEmptySpendingTrends = () => ({
  trends: [],
  averageMonthlySpending: 0,
});

/**
 * Default empty category analysis
 */
export const getEmptyCategoryAnalysis = () => ({
  categories: [],
  totalAmount: 0,
});

/**
 * Default empty goals progress
 */
export const getEmptyGoalsProgress = () => ({
  goals: [],
  summary: {
    totalGoals: 0,
    onTrackGoals: 0,
    completedGoals: 0,
  },
});

/**
 * Validate dashboard data
 */
export const validateDashboard = (data) => {
  if (!data) return getEmptyDashboard();
  
  const summary = data?.monthly?.summary || {};
  
  return {
    monthly: {
      summary: {
        totalIncome: toNumber(summary.totalIncome),
        totalExpenses: toNumber(summary.totalExpenses),
        netSavings: toNumber(summary.netSavings),
        savingsRate: toNumber(summary.savingsRate),
      },
    },
    recent: Array.isArray(data?.recent) ? data.recent.map(validateTransaction) : [],
  };
};

/**
 * Validate a single transaction
 */
export const validateTransaction = (tx) => {
  if (!tx) return null;
  
  return {
    id: tx.id || tx._id || Math.random().toString(36),
    description: tx.description || 'Unknown',
    category: tx.category || 'Other',
    amount: toNumber(tx.amount),
    date: tx.date || new Date().toISOString(),
    type: tx.type || (toNumber(tx.amount) >= 0 ? 'income' : 'expense'),
  };
};

/**
 * Validate spending trends data
 */
export const validateSpendingTrends = (data) => {
  if (!data || !Array.isArray(data?.trends)) {
    return getEmptySpendingTrends();
  }
  
  const validatedTrends = data.trends
    .filter(trend => trend && (trend.monthYear || trend.month))
    .map(trend => ({
      monthYear: trend.monthYear || `${trend.month}-${trend.year}`,
      month: trend.month,
      year: trend.year,
      totalIncome: toNumber(trend.totalIncome),
      totalExpenses: toNumber(trend.totalExpenses),
      netSavings: toNumber(trend.netSavings),
    }));
  
  return {
    trends: validatedTrends,
    averageMonthlySpending: toNumber(data.averageMonthlySpending),
  };
};

/**
 * Validate category analysis data
 */
export const validateCategoryAnalysis = (data) => {
  if (!data || !Array.isArray(data?.categories)) {
    return getEmptyCategoryAnalysis();
  }
  
  const validatedCategories = data.categories
    .filter(cat => cat && cat.category)
    .map(cat => ({
      category: cat.category,
      amount: toNumber(cat.amount),
      percentage: toNumber(cat.percentage),
      transactionCount: toNumber(cat.transactionCount),
    }));
  
  return {
    categories: validatedCategories,
    totalAmount: toNumber(data.totalAmount),
  };
};

/**
 * Validate goals progress data
 */
export const validateGoalsProgress = (data) => {
  if (!data) return getEmptyGoalsProgress();
  
  const goals = Array.isArray(data.goals) 
    ? data.goals.map(goal => ({
        id: goal.id || goal._id,
        name: goal.name || 'Unnamed Goal',
        targetAmount: toNumber(goal.targetAmount),
        savedAmount: toNumber(goal.savedAmount || goal.currentAmount),
        progress: toNumber(goal.progress),
        deadline: goal.deadline,
        status: goal.status || 'in_progress',
      }))
    : [];
  
  return {
    goals,
    summary: {
      totalGoals: toNumber(data.summary?.totalGoals || goals.length),
      onTrackGoals: toNumber(data.summary?.onTrackGoals),
      completedGoals: toNumber(data.summary?.completedGoals),
    },
  };
};

/**
 * Ensure all categories are present in category data (for consistent charts)
 */
export const ensureAllCategories = (categoryData, categories = DEFAULT_CATEGORIES) => {
  if (!categoryData || !Array.isArray(categoryData.categories)) {
    return categories.map(cat => ({
      category: cat,
      amount: 0,
      percentage: 0,
    }));
  }
  
  return categories.map(categoryName => {
    const existing = categoryData.categories.find(c => c.category === categoryName);
    return existing || {
      category: categoryName,
      amount: 0,
      percentage: 0,
    };
  });
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current, previous) => {
  const curr = toNumber(current);
  const prev = toNumber(previous);
  
  if (prev === 0) return curr > 0 ? 100 : 0;
  
  const change = ((curr - prev) / Math.abs(prev)) * 100;
  return Math.round(change * 100) / 100;
};

/**
 * Get change values from spending trends
 */
export const getChangeValues = (trends) => {
  if (!Array.isArray(trends) || trends.length < 2) {
    return {
      incomeChange: 0,
      expenseChange: 0,
      savingsChange: 0,
      savingsRateChange: 0,
    };
  }
  
  const currentMonth = trends[trends.length - 1];
  const previousMonth = trends[trends.length - 2];
  
  const currentIncome = toNumber(currentMonth.totalIncome);
  const previousIncome = toNumber(previousMonth.totalIncome);
  const currentSavings = toNumber(currentMonth.netSavings);
  const previousSavings = toNumber(previousMonth.netSavings);
  
  const currentSavingsRate = currentIncome > 0 ? (currentSavings / currentIncome) * 100 : 0;
  const previousSavingsRate = previousIncome > 0 ? (previousSavings / previousIncome) * 100 : 0;
  
  return {
    incomeChange: calculatePercentageChange(currentIncome, previousIncome),
    expenseChange: calculatePercentageChange(
      currentMonth.totalExpenses,
      previousMonth.totalExpenses
    ),
    savingsChange: calculatePercentageChange(currentSavings, previousSavings),
    savingsRateChange: calculatePercentageChange(currentSavingsRate, previousSavingsRate),
  };
};

/**
 * Check if analytics data is empty/has no real data
 */
export const isAnalyticsEmpty = (analytics) => {
  if (!analytics) return true;
  
  const dashboard = analytics.dashboard;
  const trends = analytics.spendingTrends?.trends;
  const categories = analytics.categoryAnalysis?.categories;
  
  const hasNoSummary = !dashboard?.monthly?.summary?.totalIncome && 
                       !dashboard?.monthly?.summary?.totalExpenses;
  const hasNoTrends = !trends || trends.length === 0;
  const hasNoCategories = !categories || categories.length === 0;
  
  return hasNoSummary && hasNoTrends && hasNoCategories;
};

/**
 * Format trend data for charts (ensure consistent X-axis labels)
 */
export const formatTrendsForChart = (trends, dateFormat = 'MMM YYYY') => {
  if (!Array.isArray(trends) || trends.length === 0) return [];
  
  return trends.map(trend => ({
    ...trend,
    // Ensure monthYear is formatted consistently
    label: trend.monthYear || formatMonthYear(trend.month, trend.year),
    totalIncome: toNumber(trend.totalIncome),
    totalExpenses: toNumber(trend.totalExpenses),
    netSavings: toNumber(trend.netSavings),
  }));
};

/**
 * Format month/year to display string
 */
export const formatMonthYear = (month, year) => {
  if (!month || !year) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const monthIndex = typeof month === 'string' 
    ? parseInt(month, 10) - 1 
    : month - 1;
  
  if (monthIndex < 0 || monthIndex > 11) return `${month}/${year}`;
  
  return `${months[monthIndex]} ${year}`;
};

/**
 * Aggregate transactions by date for daily view
 */
export const aggregateByDay = (transactions, days = 30) => {
  if (!Array.isArray(transactions)) return [];
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);
  
  const dailyData = {};
  
  // Initialize all days with 0
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const key = date.toISOString().split('T')[0];
    dailyData[key] = { date: key, income: 0, expenses: 0 };
  }
  
  // Aggregate transactions
  transactions.forEach(tx => {
    const txDate = new Date(tx.date).toISOString().split('T')[0];
    if (dailyData[txDate]) {
      const amount = toNumber(tx.amount);
      if (amount >= 0) {
        dailyData[txDate].income += amount;
      } else {
        dailyData[txDate].expenses += Math.abs(amount);
      }
    }
  });
  
  return Object.values(dailyData).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

/**
 * Aggregate transactions by month for monthly view
 */
export const aggregateByMonth = (transactions, months = 12) => {
  if (!Array.isArray(transactions)) return [];
  
  const monthlyData = {};
  
  transactions.forEach(tx => {
    const date = new Date(tx.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[key]) {
      monthlyData[key] = {
        monthYear: formatMonthYear(date.getMonth() + 1, date.getFullYear()),
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        totalIncome: 0,
        totalExpenses: 0,
        netSavings: 0,
      };
    }
    
    const amount = toNumber(tx.amount);
    if (amount >= 0) {
      monthlyData[key].totalIncome += amount;
    } else {
      monthlyData[key].totalExpenses += Math.abs(amount);
    }
    monthlyData[key].netSavings = monthlyData[key].totalIncome - monthlyData[key].totalExpenses;
  });
  
  return Object.values(monthlyData)
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .slice(-months);
};
