const Transaction = require('../models/transactionModel');
const Goal = require('../models/goalModel');
const mongoose = require('mongoose');
const { redisService } = require('../config/redis');

class AnalyticsService {
  
  // Helper method to get data with Redis caching
  static async getWithCache(key, fn, ttl = 300) {
    try {
      // Try to get from cache first
      const cached = await redisService.get(key);
      if (cached) {
        console.log(`📦 Cache HIT for ${key}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn(`⚠️ Cache read error: ${error.message}`);
      // Continue without cache if Redis fails
    }

    // Cache miss or error - fetch fresh data
    const data = await fn();
    
    // Try to store in cache (don't fail if Redis is down)
    try {
      await redisService.setex(key, ttl, JSON.stringify(data));
      console.log(`💾 Cached ${key} for ${ttl}s`);
    } catch (error) {
      console.warn(`⚠️ Cache write error: ${error.message}`);
      // Still return data even if cache fails
    }
    
    return data;
  }
  
  // Dashboard overview data - with caching
  static async getDashboardData(userId) {
    const cacheKey = `analytics:dashboard:${userId}`;
    
    return this.getWithCache(cacheKey, async () => {
      const [
        monthlyData,
        recentTransactions,
        goalsData,
        savingsRate
      ] = await Promise.all([
        this.getCurrentMonthData(userId),
        this.getRecentTransactions(userId),
        this.getGoalsOverview(userId),
        this.calculateSavingsRate(userId)
      ]);

      return {
        monthly: monthlyData,
        recent: recentTransactions,
        goals: goalsData,
        savingsRate,
        generatedAt: new Date()
      };
    }, 300); // Cache for 5 minutes
  }

  // Get current month financial data - with caching
  static async getCurrentMonthData(userId) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const cacheKey = `analytics:current-month:${userId}:${currentYear}-${currentMonth}`;
    
    return this.getWithCache(cacheKey, 
      () => Transaction.getMonthlySummary(userId, currentMonth, currentYear),
      600 // Cache for 10 minutes
    );
  }

  // Get recent transactions
  static async getRecentTransactions(userId, limit = 10) {
    return await Transaction.getRecent(userId, limit);
  }

  // Get goals overview
  static async getGoalsOverview(userId) {
    return await Goal.getSummaryByProfile(userId);
  }

  // Calculate savings rate
  static async calculateSavingsRate(userId, months = 3) {
    const trends = await Transaction.getSpendingTrends(userId, months);
    const totalIncome = trends.trends.reduce((sum, t) => sum + t.totalIncome, 0);
    const totalExpenses = trends.trends.reduce((sum, t) => sum + t.totalExpenses, 0);
    const totalSavings = totalIncome - totalExpenses;
    
    return {
      rate: totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100 * 100) / 100 : 0,
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      period: `${months} months`
    };
  }

  // Get spending trends - with caching
  static async getSpendingTrends(userId, months = 6) {
    const cacheKey = `analytics:trends:${userId}:${months}months`;
    
    return this.getWithCache(cacheKey,
      () => Transaction.getSpendingTrends(userId, months),
      900 // Cache for 15 minutes
    );
  }

  // Get category analysis - with caching
  static async getCategoryAnalysis(userId, startDate, endDate, type = 'Expense') {
    const dateStr = `${new Date(startDate).toISOString()}-${new Date(endDate).toISOString()}`;
    const cacheKey = `analytics:category:${userId}:${type}:${dateStr}`;
    
    return this.getWithCache(cacheKey,
      () => Transaction.getCategoryAnalysis(userId, startDate, endDate, { type }),
      1800 // Cache for 30 minutes
    );
  }

  // Get spending comparison between periods
  static async getSpendingComparison(userId, period1, period2) {
    const [data1, data2] = await Promise.all([
      this.getPeriodData(userId, period1.startDate, period1.endDate),
      this.getPeriodData(userId, period2.startDate, period2.endDate)
    ]);

    const comparison = {
      period1: { ...period1, ...data1 },
      period2: { ...period2, ...data2 },
      changes: {}
    };

    // Calculate changes
    comparison.changes.expenses = this.calculateChange(data1.totalExpenses, data2.totalExpenses);
    comparison.changes.income = this.calculateChange(data1.totalIncome, data2.totalIncome);
    comparison.changes.savings = this.calculateChange(data1.netSavings, data2.netSavings);
    comparison.changes.transactions = this.calculateChange(data1.transactionCount, data2.transactionCount);

    return comparison;
  }

  // Get period data
  static async getPeriodData(userId, startDate, endDate) {
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, { $abs: '$amount' }, 0] } },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: { $abs: '$amount' } }
        }
      }
    ];

    const result = await Transaction.aggregate(pipeline);
    const data = result[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      transactionCount: 0,
      avgAmount: 0
    };

    return {
      ...data,
      netSavings: data.totalIncome - data.totalExpenses,
      savingsRate: data.totalIncome > 0 ? (data.netSavings / data.totalIncome) * 100 : 0
    };
  }

  // Calculate percentage change
  static calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }

  // Get income trends
  static async getIncomeTrends(userId, months = 6) {
    const trends = await Transaction.getSpendingTrends(userId, months);
    return {
      trends: trends.trends.map(t => ({
        month: t.month,
        year: t.year,
        monthYear: t.monthYear,
        income: t.totalIncome,
        monthOverMonthChange: t.monthOverMonthChange
      })),
      averageMonthlyIncome: trends.trends.length > 0 ? 
        Math.round((trends.trends.reduce((sum, t) => sum + t.totalIncome, 0) / trends.trends.length) * 100) / 100 : 0
    };
  }

  // Get income sources
  static async getIncomeSources(userId, startDate, endDate) {
    return await Transaction.getCategoryAnalysis(userId, startDate, endDate, { type: 'Income' });
  }

  // Get goals progress
  static async getGoalsProgress(userId) {
    const goals = await Goal.find({ userId, status: 'Active' });
    
    const progressData = goals.map(goal => ({
      id: goal._id,
      name: goal.name,
      category: goal.category,
      progress: goal.progressPercentage,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount,
      remainingAmount: goal.remainingAmount,
      daysRemaining: goal.daysRemaining,
      isOverdue: goal.isOverdue,
      priority: goal.priority
    }));

    return {
      goals: progressData,
      summary: {
        totalGoals: goals.length,
        averageProgress: goals.length > 0 ? 
          Math.round((goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length) * 100) / 100 : 0,
        onTrackGoals: goals.filter(g => !g.isOverdue).length,
        overdueGoals: goals.filter(g => g.isOverdue).length
      }
    };
  }

  // Get transaction insights
  static async getTransactionInsights(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          dailyAverage: { $avg: { $abs: '$amount' } },
          maxTransaction: { $max: { $abs: '$amount' } },
          minTransaction: { $min: { $abs: '$amount' } },
          mostUsedPaymentMethod: { $push: '$paymentMethod' },
          topCategories: { $push: '$category' }
        }
      }
    ];

    const result = await Transaction.aggregate(pipeline);
    const insights = result[0] || {
      totalTransactions: 0,
      dailyAverage: 0,
      maxTransaction: 0,
      minTransaction: 0,
      mostUsedPaymentMethod: [],
      topCategories: []
    };

    return {
      period: `${days} days`,
      totalTransactions: insights.totalTransactions,
      dailyAverage: Math.round(insights.dailyAverage * 100) / 100,
      maxTransaction: insights.maxTransaction,
      minTransaction: insights.minTransaction,
      averagePerDay: Math.round((insights.totalTransactions / days) * 100) / 100,
      mostUsedPaymentMethod: this.getMostFrequent(insights.mostUsedPaymentMethod),
      topCategory: this.getMostFrequent(insights.topCategories)
    };
  }

  // Get most frequent item from array
  static getMostFrequent(arr) {
    if (!arr || arr.length === 0) return null;
    
    const frequency = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return Object.entries(frequency).reduce((a, b) => 
      frequency[a[0]] > frequency[b[0]] ? a : b
    )[0];
  }

  // Get transaction patterns
  static async getTransactionPatterns(userId, days = 90) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$date' },
          avgAmount: { $avg: { $abs: '$amount' } },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ];

    const weeklyPattern = await Transaction.aggregate(pipeline);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const patterns = weeklyPattern.map(day => ({
      day: dayNames[day._id - 1],
      avgAmount: Math.round(day.avgAmount * 100) / 100,
      transactionCount: day.transactionCount
    }));

    return {
      weeklyPattern: patterns,
      mostActiveDay: patterns.reduce((max, day) => 
        day.transactionCount > max.transactionCount ? day : max
      , patterns[0] || { day: 'No data', transactionCount: 0 }),
      period: `${days} days`
    };
  }

  // Get savings trends
  static async getSavingsTrends(userId, months = 12) {
    const trends = await Transaction.getSpendingTrends(userId, months);
    
    const savingsTrends = trends.trends.map(trend => ({
      month: trend.month,
      year: trend.year,
      monthYear: trend.monthYear,
      savings: trend.netSavings,
      savingsRate: trend.savingsRate,
      income: trend.totalIncome,
      expenses: trend.totalExpenses
    }));

    return {
      trends: savingsTrends,
      averageMonthlySavings: savingsTrends.length > 0 ? 
        Math.round((savingsTrends.reduce((sum, t) => sum + t.savings, 0) / savingsTrends.length) * 100) / 100 : 0,
      totalSavings: savingsTrends.reduce((sum, t) => sum + t.savings, 0),
      bestMonth: savingsTrends.reduce((max, trend) => 
        trend.savings > max.savings ? trend : max
      , savingsTrends[0] || { savings: 0 }),
      period: `${months} months`
    };
  }

  // Placeholder for budget performance (future feature)
  static async getBudgetPerformance(userId) {
    return {
      message: 'Budget feature coming soon',
      categories: [],
      overallPerformance: 0,
      recommendations: []
    };
  }
}

module.exports = AnalyticsService;