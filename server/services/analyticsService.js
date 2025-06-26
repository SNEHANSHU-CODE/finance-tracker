// services/analyticsService.js
const Transaction = require('../models/transactionModel');
const Budget = require('../models/budgetModel');
const Goal = require('../models/goalModel');
const Report = require('../models/reportModel');
const { 
  calculateDateRange, 
  formatCurrency, 
  calculatePercentageChange,
  aggregateByPeriod,
  calculateTrends,
  generateInsights
} = require('../utils/analyticsUitls');
const { AppError } = require('../utils/errorHandler');

const analyticsService = {
  // Dashboard Analytics
  async getDashboardAnalytics(userId, options = {}) {
    const { period = 'monthly', startDate, endDate } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    const [
      transactionSummary,
      budgetSummary,
      goalProgress,
      recentTransactions
    ] = await Promise.all([
      this.getTransactionSummary(userId, dateRange),
      this.getBudgetSummaryForPeriod(userId, dateRange),
      this.getGoalProgressSummary(userId),
      this.getRecentTransactions(userId, 5)
    ]);

    const savingsRate = transactionSummary.totalIncome > 0 
      ? ((transactionSummary.totalIncome - transactionSummary.totalExpenses) / transactionSummary.totalIncome) * 100
      : 0;

    return {
      period: dateRange,
      summary: {
        totalIncome: transactionSummary.totalIncome,
        totalExpenses: transactionSummary.totalExpenses,
        netSavings: transactionSummary.totalIncome - transactionSummary.totalExpenses,
        savingsRate: Math.round(savingsRate * 100) / 100,
        transactionCount: transactionSummary.transactionCount
      },
      budget: budgetSummary,
      goals: goalProgress,
      recentActivity: recentTransactions,
      insights: await this.generateDashboardInsights(userId, transactionSummary, budgetSummary, goalProgress)
    };
  },

  async getFinancialOverview(userId, options = {}) {
    const { startDate, endDate, includeProjections = false } = options;
    const dateRange = { startDate: new Date(startDate), endDate: new Date(endDate) };

    const [
      incomeData,
      expenseData,
      savingsData,
      budgetData,
      goalData
    ] = await Promise.all([
      this.getIncomeSummary(userId, { startDate, endDate }),
      this.getExpenseSummary(userId, { startDate, endDate }),
      this.getSavingsAnalysis(userId, dateRange),
      this.getBudgetPerformance(userId, { startDate, endDate }),
      this.getGoalProgressAnalytics(userId, { startDate, endDate })
    ]);

    const overview = {
      period: dateRange,
      income: incomeData,
      expenses: expenseData,
      savings: savingsData,
      budget: budgetData,
      goals: goalData,
      netWorth: await this.calculateNetWorth(userId, dateRange.endDate),
      cashFlow: await this.getCashFlowSummary(userId, dateRange)
    };

    if (includeProjections) {
      overview.projections = await this.generateFinancialProjections(userId, dateRange);
    }

    return overview;
  },

  // Expense Analytics
  async getExpenseSummary(userId, options = {}) {
    const { period, startDate, endDate, groupBy = 'category' } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    const pipeline = [
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: `$${groupBy}`,
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          maxAmount: { $max: '$amount' },
          minAmount: { $min: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];

    const summary = await Transaction.aggregate(pipeline);
    const totalExpenses = summary.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      period: dateRange,
      totalExpenses,
      categoryBreakdown: summary.map(item => ({
        category: item._id,
        amount: item.totalAmount,
        percentage: totalExpenses > 0 ? (item.totalAmount / totalExpenses) * 100 : 0,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount,
        maxAmount: item.maxAmount,
        minAmount: item.minAmount
      })),
      insights: this.generateExpenseInsights(summary, totalExpenses)
    };
  },

  async getExpenseTrends(userId, options = {}) {
    const { period, startDate, endDate, granularity = 'daily' } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    const groupByFormat = this.getDateGroupFormat(granularity);
    
    const pipeline = [
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupByFormat, date: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const trends = await Transaction.aggregate(pipeline);
    const trendAnalysis = calculateTrends(trends.map(t => t.totalAmount));

    return {
      period: dateRange,
      granularity,
      trends: trends.map(trend => ({
        date: trend._id,
        amount: trend.totalAmount,
        transactionCount: trend.transactionCount,
        categoryCount: trend.categories.length
      })),
      analysis: {
        averageDaily: trends.length > 0 ? trends.reduce((sum, t) => sum + t.totalAmount, 0) / trends.length : 0,
        highestDay: trends.length > 0 ? Math.max(...trends.map(t => t.totalAmount)) : 0,
        lowestDay: trends.length > 0 ? Math.min(...trends.map(t => t.totalAmount)) : 0,
        trend: trendAnalysis.direction,
        trendPercentage: trendAnalysis.percentage,
        volatility: trendAnalysis.volatility
      }
    };
  },

  async getCategoryBreakdown(userId, options = {}) {
    const { period, startDate, endDate, includeSubcategories = false } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    const pipeline = [
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            type: '$type',
            ...(includeSubcategories && { subcategory: '$subcategory' })
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];

    const breakdown = await Transaction.aggregate(pipeline);
    
    const expenses = breakdown.filter(item => item._id.type === 'expense');
    const income = breakdown.filter(item => item._id.type === 'income');
    
    const totalExpenses = expenses.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalIncome = income.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      period: dateRange,
      expenses: {
        total: totalExpenses,
        categories: expenses.map(item => ({
          category: item._id.category,
          subcategory: item._id.subcategory,
          amount: item.totalAmount,
          percentage: totalExpenses > 0 ? (item.totalAmount / totalExpenses) * 100 : 0,
          transactionCount: item.transactionCount,
          averageAmount: item.averageAmount
        }))
      },
      income: {
        total: totalIncome,
        categories: income.map(item => ({
          category: item._id.category,
          subcategory: item._id.subcategory,
          amount: item.totalAmount,
          percentage: totalIncome > 0 ? (item.totalAmount / totalIncome) * 100 : 0,
          transactionCount: item.transactionCount,
          averageAmount: item.averageAmount
        }))
      }
    };
  },

  async getTopCategories(userId, options = {}) {
    const { limit = 10, startDate, endDate, metric = 'amount' } = options;
    const dateRange = { startDate: new Date(startDate), endDate: new Date(endDate) };

    const sortField = metric === 'amount' ? 'totalAmount' : 'transactionCount';

    const pipeline = [
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          lastTransaction: { $max: '$date' }
        }
      },
      { $sort: { [sortField]: -1 } },
      { $limit: parseInt(limit) }
    ];

    const topCategories = await Transaction.aggregate(pipeline);
    const totalExpenses = await Transaction.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const total = totalExpenses[0]?.total || 0;

    return {
      period: dateRange,
      metric,
      categories: topCategories.map(category => ({
        category: category._id,
        amount: category.totalAmount,
        percentage: total > 0 ? (category.totalAmount / total) * 100 : 0,
        transactionCount: category.transactionCount,
        averageAmount: category.averageAmount,
        lastTransaction: category.lastTransaction
      })),
      insights: this.generateTopCategoryInsights(topCategories, total)
    };
  },

  // Income Analytics
  async getIncomeSummary(userId, options = {}) {
    const { period, startDate, endDate } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    const pipeline = [
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'income',
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          frequency: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];

    const incomeData = await Transaction.aggregate(pipeline);
    const totalIncome = incomeData.reduce((sum, item) => sum + item.totalAmount, 0);

    return {
      period: dateRange,
      totalIncome,
      sources: incomeData.map(item => ({
        source: item._id,
        amount: item.totalAmount,
        percentage: totalIncome > 0 ? (item.totalAmount / totalIncome) * 100 : 0,
        transactionCount: item.transactionCount,
        averageAmount: item.averageAmount
      })),
      analysis: {
        primarySource: incomeData[0]?.source || 'N/A',
        sourceCount: incomeData.length,
        averageTransaction: totalIncome / incomeData.reduce((sum, item) => sum + item.transactionCount, 0),
        consistency: this.calculateIncomeConsistency(incomeData)
      }
    };
  },

  async getIncomeTrends(userId, options = {}) {
    const { period, startDate, endDate, granularity = 'monthly' } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);
    const groupByFormat = this.getDateGroupFormat(granularity);

    const pipeline = [
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'income',
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupByFormat, date: '$date' }
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ];

    const trends = await Transaction.aggregate(pipeline);
    const trendAnalysis = calculateTrends(trends.map(t => t.totalAmount));

    return {
      period: dateRange,
      granularity,
      trends: trends.map(trend => ({
        date: trend._id,
        amount: trend.totalAmount,
        transactionCount: trend.transactionCount
      })),
      analysis: {
        averagePeriod: trends.length > 0 ? trends.reduce((sum, t) => sum + t.totalAmount, 0) / trends.length : 0,
        highestPeriod: trends.length > 0 ? Math.max(...trends.map(t => t.totalAmount)) : 0,
        lowestPeriod: trends.length > 0 ? Math.min(...trends.map(t => t.totalAmount)) : 0,
        trend: trendAnalysis.direction,
        growthRate: trendAnalysis.percentage,
        stability: trendAnalysis.stability
      }
    };
  },

  async getIncomeSourceAnalysis(userId, options = {}) {
    const { startDate, endDate } = options;
    const dateRange = { startDate: new Date(startDate), endDate: new Date(endDate) };

    const pipeline = [
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          type: 'income',
          date: { $gte: dateRange.startDate, $lte: dateRange.endDate }
        }
      },
      {
        $group: {
          _id: {
            source: '$category',
            month: { $dateToString: { format: '%Y-%m', date: '$date' } }
          },
          monthlyAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.source',
          totalAmount: { $sum: '$monthlyAmount' },
          monthlyAmounts: { $push: '$monthlyAmount' },
          averageMonthly: { $avg: '$monthlyAmount' },
          transactionCount: { $sum: '$transactionCount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ];

    const sources = await Transaction.aggregate(pipeline);
    const totalIncome = sources.reduce((sum, source) => sum + source.totalAmount, 0);

    return {
      period: dateRange,
      sources: sources.map(source => ({
        source: source._id,
        totalAmount: source.totalAmount,
        percentage: totalIncome > 0 ? (source.totalAmount / totalIncome) * 100 : 0,
        averageMonthly: source.averageMonthly,
        consistency: this.calculateSourceConsistency(source.monthlyAmounts),
        reliability: this.calculateSourceReliability(source.monthlyAmounts),
        transactionCount: source.transactionCount
      })),
      diversification: {
        herfindahlIndex: this.calculateHerfindahlIndex(sources.map(s => s.totalAmount)),
        primarySourceDependency: sources.length > 0 ? (sources[0].totalAmount / totalIncome) * 100 : 0,
        sourceCount: sources.length
      }
    };
  },

  // Budget Analytics
  async getBudgetPerformance(userId, options = {}) {
    const { period, startDate, endDate } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    // Get budget data for the period
    const budgets = await Budget.find({
      userId,
      month: { $gte: dateRange.startDate.getMonth() + 1, $lte: dateRange.endDate.getMonth() + 1 },
      year: { $gte: dateRange.startDate.getFullYear(), $lte: dateRange.endDate.getFullYear() },
      isActive: true
    });

    const performance = budgets.map(budget => ({
      category: budget.category,
      budgetAmount: budget.budgetAmount,
      spentAmount: budget.spentAmount,
      remainingAmount: budget.remainingAmount,
      utilizationPercentage: budget.utilizationPercentage,
      status: budget.status,
      variance: budget.spentAmount - budget.budgetAmount,
      variancePercentage: budget.budgetAmount > 0 ? ((budget.spentAmount - budget.budgetAmount) / budget.budgetAmount) * 100 : 0
    }));

    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);

    return {
      period: dateRange,
      overall: {
        totalBudget,
        totalSpent,
        totalRemaining: totalBudget - totalSpent,
        overallUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
        status: totalSpent > totalBudget ? 'Over Budget' : totalSpent > totalBudget * 0.8 ? 'Warning' : 'On Track'
      },
      categories: performance,
      summary: {
        onTrackCount: performance.filter(p => p.status === 'On Track').length,
        warningCount: performance.filter(p => p.status === 'Warning').length,
        overBudgetCount: performance.filter(p => p.status === 'Over Budget').length,
        underBudgetCount: performance.filter(p => p.status === 'Under Budget').length
      }
    };
  },

  async getBudgetUtilization(userId, options = {}) {
    const { period, startDate, endDate } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    const budgets = await Budget.find({
      userId,
      month: { $gte: dateRange.startDate.getMonth() + 1, $lte: dateRange.endDate.getMonth() + 1 },
      year: { $gte: dateRange.startDate.getFullYear(), $lte: dateRange.endDate.getFullYear() },
      isActive: true
    });

    const utilization = budgets.map(budget => ({
      category: budget.category,
      budgetAmount: budget.budgetAmount,
      spentAmount: budget.spentAmount,
      utilizationPercentage: budget.utilizationPercentage,
      efficiency: this.calculateBudgetEfficiency(budget.utilizationPercentage),
      daysIntoMonth: new Date().getDate(),
      projectedSpending: this.projectMonthlySpending(budget.spentAmount, new Date().getDate())
    }));

    return {
      period: dateRange,
      utilization,
      insights: this.generateUtilizationInsights(utilization)
    };
  },

  async getBudgetVariance(userId, options = {}) {
    const { period, startDate, endDate } = options;
    const dateRange = calculateDateRange(period, startDate, endDate);

    // Get current and previous period budgets for comparison
    const currentBudgets = await Budget.find({
      userId,
      month: dateRange.endDate.getMonth() + 1,
      year: dateRange.endDate.getFullYear(),
      isActive: true
    });

    const prevMonth = dateRange.startDate.getMonth() === 0 ? 12 : dateRange.startDate.getMonth();
    const prevYear = dateRange.startDate.getMonth() === 0 ? dateRange.startDate.getFullYear() - 1 : dateRange.startDate.getFullYear();

    const previousBudgets = await Budget.find({
      userId,
      month: prevMonth,
      year: prevYear,
      isActive: true
    });

    const variance = currentBudgets.map(current => {
      const previous = previousBudgets.find(p => p.category === current.category);
      const budgetChange = previous ? current.budgetAmount - previous.budgetAmount : current.budgetAmount;
      const spendingChange = previous ? current.spentAmount - previous.spentAmount : current.spentAmount;

      return {
        category: current.category,
        currentBudget: current.budgetAmount,
        previousBudget: previous?.budgetAmount || 0,
        budgetVariance: budgetChange,
        budgetVariancePercentage: previous?.budgetAmount > 0 ? (budgetChange / previous.budgetAmount) * 100 : 0,
        currentSpending: current.spentAmount,
        previousSpending: previous?.spentAmount || 0,
        spendingVariance: spendingChange,
        spendingVariancePercentage: previous?.spentAmount > 0 ? (spendingChange / previous.spentAmount) * 100 : 0,
        utilizationChange: current.utilizationPercentage - (previous?.utilizationPercentage || 0)
      };
    });

    return {
      period: dateRange,
      variance,
      summary: {
        categoriesWithIncreasedBudget: variance.filter(v => v.budgetVariance > 0).length,
        categoriesWithDecreasedBudget: variance.filter(v => v.budgetVariance < 0).length,
        categoriesWithIncreasedSpending: variance.filter(v => v.spendingVariance > 0).length,
        categoriesWithDecreasedSpending: variance.filter(v => v.spendingVariance < 0).length,
        averageBudgetChange: variance.reduce((sum, v) => sum + v.budgetVariancePercentage, 0) / variance.length,
        averageSpendingChange: variance.reduce((sum, v) => sum + v.spendingVariancePercentage, 0) / variance.length
      }
    };
  },

  // Helper methods
  getDateGroupFormat(granularity) {
    const formats = {
      daily: '%Y-%m-%d',
      weekly: '%Y-%U',
      monthly: '%Y-%m',
      quarterly: '%Y-Q%q',
      yearly: '%Y'
    };
    return formats[granularity] || formats.daily;
  },

  calculateIncomeConsistency(incomeData) {
    if (incomeData.length === 0) return 0;
    const amounts = incomeData.map(item => item.totalAmount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    return mean > 0 ? (1 - (stdDev / mean)) * 100 : 0;
  },

  calculateSourceConsistency(monthlyAmounts) {
    if (monthlyAmounts.length <= 1) return 100;
    const mean = monthlyAmounts.reduce((sum, amount) => sum + amount, 0) / monthlyAmounts.length;
    const variance = monthlyAmounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / monthlyAmounts.length;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 0;
    return Math.max(0, (1 - coefficientOfVariation) * 100);
  },

  calculateSourceReliability(monthlyAmounts) {
    const nonZeroMonths = monthlyAmounts.filter(amount => amount > 0).length;
    return (nonZeroMonths / monthlyAmounts.length) * 100;
  },

  calculateHerfindahlIndex(amounts) {
    const total = amounts.reduce((sum, amount) => sum + amount, 0);
    if (total === 0) return 0;
    return amounts.reduce((sum, amount) => sum + Math.pow(amount / total, 2), 0) * 10000;
  },

  calculateBudgetEfficiency(utilizationPercentage) {
    if (utilizationPercentage >= 90 && utilizationPercentage <= 100) return 'Excellent';
    if (utilizationPercentage >= 70 && utilizationPercentage < 90) return 'Good';
    if (utilizationPercentage >= 50 && utilizationPercentage < 70) return 'Fair';
    if (utilizationPercentage > 100) return 'Over Budget';
    return 'Under-utilized';
  },

  projectMonthlySpending(currentSpent, daysIntoMonth) {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    return (currentSpent / daysIntoMonth) * daysInMonth;
  },

  generateExpenseInsights(summary, totalExpenses) {
    const insights = [];
    if (summary.length > 0) {
      const topCategory = summary[0];
      insights.push({
        type: 'info',
        message: `${topCategory._id} is your highest expense category, accounting for ${((topCategory.totalAmount / totalExpenses) * 100).toFixed(1)}% of total expenses.`
      });
    }
    return insights;
  },

  generateTopCategoryInsights(categories, total) {
    const insights = [];
    if (categories.length > 0) {
      const topThreeTotal = categories.slice(0, 3).reduce((sum, cat) => sum + cat.totalAmount, 0);
      const topThreePercentage = total > 0 ? (topThreeTotal / total) * 100 : 0;
      insights.push({
        type: 'info',
        message: `Your top 3 spending categories account for ${topThreePercentage.toFixed(1)}% of total expenses.`
      });
    }
    return insights;
  },

  generateUtilizationInsights(utilization) {
    const insights = [];
    const overUtilized = utilization.filter(u => u.utilizationPercentage > 100);
    const underUtilized = utilization.filter(u => u.utilizationPercentage < 50);

    if (overUtilized.length > 0) {
      insights.push({
        type: 'warning',
        message: `${overUtilized.length} categories are over budget this month.`
      });
    }

    if (underUtilized.length > 0) {
      insights.push({
        type: 'info',
        message: `${underUtilized.length} categories are significantly under budget.`
      });
    }

    return insights;
  }
};

module.exports = analyticsService;