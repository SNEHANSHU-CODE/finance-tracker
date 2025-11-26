const grpc = require('@grpc/grpc-js');
const transactionService = require('../services/transactionService');
const reminderService = require('../services/reminderService');
const goalService = require('../services/goalService');
const analyticsService = require('../services/analyticsService');

// Helper function to convert MongoDB document to proto format
const convertTransactionToProto = (transaction) => {
  if (!transaction) return null;
  return {
    id: transaction._id?.toString() || transaction.id || '',
    description: transaction.description || '',
    amount: transaction.amount || 0,
    date: transaction.date?.toISOString() || '',
    category: transaction.category || '',
    type: transaction.type || '',
    payment_method: transaction.paymentMethod || '',
    is_recurring: transaction.isRecurring || false,
    recurring_frequency: transaction.recurringFrequency || '',
    created_at: transaction.createdAt?.toISOString() || '',
    updated_at: transaction.updatedAt?.toISOString() || '',
  };
};

const convertReminderToProto = (reminder) => {
  if (!reminder) return null;
  return {
    id: reminder._id?.toString() || reminder.id || '',
    title: reminder.title || '',
    date: reminder.date?.toISOString() || '',
    calendar_event_id: reminder.calendarEventId || '',
    created_at: reminder.createdAt?.toISOString() || '',
    updated_at: reminder.updatedAt?.toISOString() || '',
  };
};

const convertGoalToProto = (goal) => {
  if (!goal) return null;
  return {
    id: goal._id?.toString() || goal.id || '',
    name: goal.name || '',
    category: goal.category || '',
    priority: goal.priority || '',
    target_amount: goal.targetAmount || 0,
    saved_amount: goal.savedAmount || 0,
    target_date: goal.targetDate?.toISOString() || '',
    status: goal.status || '',
    completed_date: goal.completedDate?.toISOString() || '',
    description: goal.description || '',
    progress_percentage: goal.progressPercentage || 0,
    remaining_amount: goal.remainingAmount || 0,
    days_remaining: goal.daysRemaining || 0,
    is_overdue: goal.isOverdue || false,
    created_at: goal.createdAt?.toISOString() || '',
    updated_at: goal.updatedAt?.toISOString() || '',
  };
};

// Transaction Operations
const GetTransactions = async (call, callback) => {
  try {
    const { user_id, type, category, start_date, end_date, limit, skip } = call.request;

    const options = {
      limit: limit || 20,
      page: Math.floor((skip || 0) / (limit || 20)) + 1,
    };

    if (type) options.type = type;
    if (category) options.category = category;
    if (start_date) options.startDate = start_date;
    if (end_date) options.endDate = end_date;

    const result = await transactionService.getTransactions(user_id, options);

    callback(null, {
      transactions: result.data.transactions.map(convertTransactionToProto),
      total: result.data.pagination.totalItems,
      message: 'Transactions retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetRecentTransactions = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const result = await transactionService.getRecentTransactions(user_id, 10);

    callback(null, {
      transactions: result.data.map(convertTransactionToProto),
      total: result.data.length,
      message: 'Recent transactions retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetTransactionById = async (call, callback) => {
  try {
    const { user_id, transaction_id } = call.request;
    const result = await transactionService.getTransactionById(transaction_id, user_id);

    callback(null, {
      transaction: convertTransactionToProto(result.data),
      message: 'Transaction retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.NOT_FOUND,
      message: error.message,
    });
  }
};

const GetCurrentMonthSummary = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const result = await transactionService.getMonthlySummary(user_id, month, year);
    const summary = result.data;

    callback(null, {
      total_income: summary.totalIncome || 0,
      total_expense: summary.totalExpenses || 0,
      net_savings: summary.netSavings || 0,
      transaction_count: summary.transactionCount || 0,
      category_breakdown: summary.categoryBreakdown || {},
      message: 'Current month summary retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetMonthlySummary = async (call, callback) => {
  try {
    const { user_id, month, year } = call.request;
    const result = await transactionService.getMonthlySummary(user_id, month, year);
    const summary = result.data;

    callback(null, {
      total_income: summary.totalIncome || 0,
      total_expense: summary.totalExpenses || 0,
      net_savings: summary.netSavings || 0,
      transaction_count: summary.transactionCount || 0,
      category_breakdown: summary.categoryBreakdown || {},
      message: 'Monthly summary retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetSpendingTrends = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const result = await transactionService.getSpendingTrends(user_id);

    const trends = result.data.map(trend => ({
      month: trend.month || '',
      year: trend.year || 0,
      amount: trend.totalExpenses || 0,
    }));

    callback(null, {
      trends,
      message: 'Spending trends retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetCategoryAnalysis = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await transactionService.getCategoryAnalysis(
      user_id,
      startDate.toISOString(),
      endDate.toISOString()
    );

    const categories = result.data.categories?.map(cat => ({
      category: cat.category || '',
      amount: cat.totalAmount || 0,
      transaction_count: cat.transactionCount || 0,
      percentage: cat.percentage || 0,
    })) || [];

    callback(null, {
      categories,
      message: 'Category analysis retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

// Reminder Operations
const GetReminders = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const reminders = await reminderService.getReminders(user_id);

    callback(null, {
      reminders: reminders.map(convertReminderToProto),
      total: reminders.length,
      message: 'Reminders retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetReminderById = async (call, callback) => {
  try {
    const { user_id, reminder_id } = call.request;
    const reminders = await reminderService.getReminders(user_id);
    const reminder = reminders.find(r => r._id.toString() === reminder_id);

    if (!reminder) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Reminder not found',
      });
    }

    callback(null, {
      reminder: convertReminderToProto(reminder),
      message: 'Reminder retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

// Goal Operations
const GetGoals = async (call, callback) => {
  try {
    const { user_id, status } = call.request;
    const filters = status ? { status } : {};
    const goals = await goalService.getGoals(user_id, filters);

    callback(null, {
      goals: goals.map(convertGoalToProto),
      total: goals.length,
      message: 'Goals retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetGoalById = async (call, callback) => {
  try {
    const { user_id, goal_id } = call.request;
    const goal = await goalService.getGoalById(goal_id, user_id);

    if (!goal) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: 'Goal not found',
      });
    }

    callback(null, {
      goal: convertGoalToProto(goal),
      message: 'Goal retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetDashboardStats = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const stats = await goalService.getDashboardStats(user_id);

    const recentGoals = stats.upcomingDeadlines?.slice(0, 5).map(convertGoalToProto) || [];

    callback(null, {
      total_goals: stats.totalGoals || 0,
      active_goals: stats.activeGoals || 0,
      completed_goals: stats.completedGoals || 0,
      total_target_amount: stats.totalTargetAmount || 0,
      total_saved_amount: stats.totalSavedAmount || 0,
      overall_progress: stats.averageProgress || 0,
      recent_goals: recentGoals,
      message: 'Dashboard stats retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetGoalsSummary = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const summary = await goalService.getGoalsSummary(user_id);

    callback(null, {
      total_goals: summary.totalGoals || 0,
      active_goals: summary.activeGoals || 0,
      completed_goals: summary.completedGoals || 0,
      paused_goals: summary.pausedGoals || 0,
      total_target_amount: summary.totalTargetAmount || 0,
      total_saved_amount: summary.totalSavedAmount || 0,
      overall_progress: summary.averageProgress || 0,
      message: 'Goals summary retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetGoalsByCategory = async (call, callback) => {
  try {
    const { user_id, category } = call.request;
    const goals = await goalService.getGoalsByCategory(user_id, category);

    callback(null, {
      goals: goals.map(convertGoalToProto),
      total: goals.length,
      message: 'Goals by category retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetGoalsByPriority = async (call, callback) => {
  try {
    const { user_id, priority } = call.request;
    const goals = await goalService.getGoalsByPriority(user_id, priority);

    callback(null, {
      goals: goals.map(convertGoalToProto),
      total: goals.length,
      message: 'Goals by priority retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetOverdueGoals = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const goals = await goalService.getOverdueGoals(user_id);

    callback(null, {
      goals: goals.map(convertGoalToProto),
      total: goals.length,
      message: 'Overdue goals retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

// Analytics Operations
const GetDashboard = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const dashboard = await analyticsService.getDashboardData(user_id);

    const topCategories = {};
    if (dashboard.monthly?.categoryBreakdown) {
      const categories = Object.entries(dashboard.monthly.categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      categories.forEach(([key, value]) => {
        topCategories[key] = value;
      });
    }

    const recentTrends = [];

    callback(null, {
      total_income: dashboard.monthly?.totalIncome || 0,
      total_expense: dashboard.monthly?.totalExpenses || 0,
      net_savings: dashboard.monthly?.netSavings || 0,
      savings_rate: dashboard.savingsRate?.rate || 0,
      transaction_count: dashboard.monthly?.transactionCount || 0,
      active_goals: dashboard.goals?.activeGoals || 0,
      top_categories: topCategories,
      recent_trends: recentTrends,
      message: 'Dashboard data retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetMonthlyAnalytics = async (call, callback) => {
  try {
    const { user_id, year, month } = call.request;
    const summary = await transactionService.getMonthlySummary(user_id, month, year);
    const data = summary.data;

    callback(null, {
      month: month,
      year: year,
      total_income: data.totalIncome || 0,
      total_expense: data.totalExpenses || 0,
      net_savings: data.netSavings || 0,
      savings_rate: data.savingsRate || 0,
      expense_by_category: data.categoryBreakdown || {},
      income_by_source: {},
      transaction_count: data.transactionCount || 0,
      message: 'Monthly analytics retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetCurrentMonthAnalytics = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const summary = await transactionService.getMonthlySummary(user_id, month, year);
    const data = summary.data;

    callback(null, {
      month: month,
      year: year,
      total_income: data.totalIncome || 0,
      total_expense: data.totalExpenses || 0,
      net_savings: data.netSavings || 0,
      savings_rate: data.savingsRate || 0,
      expense_by_category: data.categoryBreakdown || {},
      income_by_source: {},
      transaction_count: data.transactionCount || 0,
      message: 'Current month analytics retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetSpendingTrendsAnalytics = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const trends = await analyticsService.getSpendingTrends(user_id, 6);

    const monthlyTrends = trends.trends?.map(t => ({
      month: t.month || '',
      year: t.year || 0,
      amount: t.totalExpenses || 0,
    })) || [];

    const expenses = monthlyTrends.map(t => t.amount);
    const avgSpending = expenses.length > 0 ? expenses.reduce((a, b) => a + b, 0) / expenses.length : 0;
    const highest = expenses.length > 0 ? Math.max(...expenses) : 0;
    const lowest = expenses.length > 0 ? Math.min(...expenses) : 0;

    callback(null, {
      monthly_trends: monthlyTrends,
      average_monthly_spending: avgSpending,
      highest_spending_month: highest,
      lowest_spending_month: lowest,
      message: 'Spending trends analytics retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetCategoryAnalysisAnalytics = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const analysis = await analyticsService.getCategoryAnalysis(
      user_id,
      startDate.toISOString(),
      endDate.toISOString()
    );

    const categories = analysis.categories?.map(cat => ({
      category: cat.category || '',
      amount: cat.totalAmount || 0,
      transaction_count: cat.transactionCount || 0,
      percentage: cat.percentage || 0,
    })) || [];

    const topCategory = categories.length > 0 ? categories[0] : null;

    callback(null, {
      categories,
      top_category: topCategory?.category || '',
      top_category_amount: topCategory?.amount || 0,
      message: 'Category analysis analytics retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetIncomeTrends = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const trends = await analyticsService.getIncomeTrends(user_id, 6);

    const monthlyIncome = trends.trends?.map(t => ({
      month: t.month || '',
      year: t.year || 0,
      amount: t.income || 0,
    })) || [];

    const totalIncome = monthlyIncome.reduce((sum, t) => sum + t.amount, 0);
    const avgIncome = monthlyIncome.length > 0 ? totalIncome / monthlyIncome.length : 0;

    callback(null, {
      monthly_income: monthlyIncome,
      average_monthly_income: avgIncome,
      total_income: totalIncome,
      message: 'Income trends retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetIncomeSources = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1);
    const endDate = new Date(now.getFullYear(), 11, 31);

    const sources = await analyticsService.getIncomeSources(
      user_id,
      startDate.toISOString(),
      endDate.toISOString()
    );

    const sourceMap = {};
    sources.categories?.forEach(cat => {
      sourceMap[cat.category] = cat.totalAmount || 0;
    });

    const topSource = sources.categories?.[0];

    callback(null, {
      sources: sourceMap,
      top_source: topSource?.category || '',
      top_source_amount: topSource?.totalAmount || 0,
      message: 'Income sources retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetGoalsProgress = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const progress = await analyticsService.getGoalsProgress(user_id);

    const goals = progress.goals?.map(g => ({
      goal_id: g.id?.toString() || '',
      goal_name: g.name || '',
      progress_percentage: g.progress || 0,
      amount_remaining: g.remainingAmount || 0,
      days_remaining: g.daysRemaining || 0,
      is_on_track: !g.isOverdue,
    })) || [];

    callback(null, {
      goals,
      overall_progress: progress.summary?.averageProgress || 0,
      on_track_count: progress.summary?.onTrackGoals || 0,
      behind_count: progress.summary?.overdueGoals || 0,
      message: 'Goals progress retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetSavingsRate = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const savingsData = await analyticsService.calculateSavingsRate(user_id, 6);

    const monthlyRates = [];

    callback(null, {
      current_rate: savingsData.rate || 0,
      average_rate: savingsData.rate || 0,
      monthly_rates: monthlyRates,
      message: 'Savings rate retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const GetSavingsTrends = async (call, callback) => {
  try {
    const { user_id } = call.request;
    const trends = await analyticsService.getSavingsTrends(user_id, 12);

    const monthlySavings = trends.trends?.map(t => ({
      month: t.month || '',
      year: t.year || 0,
      amount: t.savings || 0,
    })) || [];

    const totalSavings = trends.totalSavings || 0;
    const avgSavings = trends.averageMonthlySavings || 0;

    // Determine trend direction
    let trendDirection = 'stable';
    if (monthlySavings.length >= 2) {
      const recent = monthlySavings.slice(-3).map(m => m.amount);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const older = monthlySavings.slice(-6, -3).map(m => m.amount);
      const oldAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : avg;

      if (avg > oldAvg * 1.1) trendDirection = 'increasing';
      else if (avg < oldAvg * 0.9) trendDirection = 'decreasing';
    }

    callback(null, {
      monthly_savings: monthlySavings,
      average_monthly_savings: avgSavings,
      total_savings: totalSavings,
      trend_direction: trendDirection,
      message: 'Savings trends retrieved successfully',
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

// Export all gRPC service implementations
module.exports = {
  // Transaction Operations
  GetTransactions,
  GetRecentTransactions,
  GetTransactionById,
  GetCurrentMonthSummary,
  GetMonthlySummary,
  GetSpendingTrends,
  GetCategoryAnalysis,

  // Reminder Operations
  GetReminders,
  GetReminderById,

  // Goal Operations
  GetGoals,
  GetGoalById,
  GetDashboardStats,
  GetGoalsSummary,
  GetGoalsByCategory,
  GetGoalsByPriority,
  GetOverdueGoals,

  // Analytics Operations
  GetDashboard,
  GetMonthlyAnalytics,
  GetCurrentMonthAnalytics,
  GetSpendingTrendsAnalytics,
  GetCategoryAnalysisAnalytics,
  GetIncomeTrends,
  GetIncomeSources,
  GetGoalsProgress,
  GetSavingsRate,
  GetSavingsTrends,
};