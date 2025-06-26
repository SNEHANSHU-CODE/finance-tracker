// controllers/analyticsController.js
const analyticsService = require('../services/analyticsService');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { formatResponse } = require('../utils/responseFormatterUtils');
const { cacheResult, getCachedResult } = require('../utils/cacheUtils');

const analyticsController = {
  // Dashboard Analytics
  async getDashboardAnalytics(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period = 'monthly', startDate, endDate } = req.query;

      const cacheKey = `dashboard_analytics_${profileId}_${period}_${startDate}_${endDate}`;
      const cached = await getCachedResult(cacheKey);
      if (cached) {
        return res.status(200).json(formatResponse(cached, 'Dashboard analytics retrieved successfully'));
      }

      const analytics = await analyticsService.getDashboardAnalytics(profileId, {
        period,
        startDate,
        endDate
      });

      await cacheResult(cacheKey, analytics, 300); // Cache for 5 minutes

      res.status(200).json(formatResponse(analytics, 'Dashboard analytics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getFinancialOverview(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { startDate, endDate, includeProjections = false } = req.query;

      const overview = await analyticsService.getFinancialOverview(profileId, {
        startDate,
        endDate,
        includeProjections: includeProjections === 'true'
      });

      res.status(200).json(formatResponse(overview, 'Financial overview retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Expense Analytics
  async getExpenseSummary(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate, groupBy = 'category' } = req.query;

      const summary = await analyticsService.getExpenseSummary(profileId, {
        period,
        startDate,
        endDate,
        groupBy
      });

      res.status(200).json(formatResponse(summary, 'Expense summary retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getExpenseTrends(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate, granularity = 'daily' } = req.query;

      const trends = await analyticsService.getExpenseTrends(profileId, {
        period,
        startDate,
        endDate,
        granularity
      });

      res.status(200).json(formatResponse(trends, 'Expense trends retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getCategoryBreakdown(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate, includeSubcategories = false } = req.query;

      const breakdown = await analyticsService.getCategoryBreakdown(profileId, {
        period,
        startDate,
        endDate,
        includeSubcategories: includeSubcategories === 'true'
      });

      res.status(200).json(formatResponse(breakdown, 'Category breakdown retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getTopCategories(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { limit = 10, startDate, endDate, metric = 'amount' } = req.query;

      const topCategories = await analyticsService.getTopCategories(profileId, {
        limit: parseInt(limit),
        startDate,
        endDate,
        metric
      });

      res.status(200).json(formatResponse(topCategories, 'Top categories retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Income Analytics
  async getIncomeSummary(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate } = req.query;

      const summary = await analyticsService.getIncomeSummary(profileId, {
        period,
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(summary, 'Income summary retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getIncomeTrends(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate, granularity = 'monthly' } = req.query;

      const trends = await analyticsService.getIncomeTrends(profileId, {
        period,
        startDate,
        endDate,
        granularity
      });

      res.status(200).json(formatResponse(trends, 'Income trends retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getIncomeSourceAnalysis(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { startDate, endDate } = req.query;

      const analysis = await analyticsService.getIncomeSourceAnalysis(profileId, {
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(analysis, 'Income source analysis retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Budget Analytics
  async getBudgetPerformance(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate } = req.query;

      const performance = await analyticsService.getBudgetPerformance(profileId, {
        period,
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(performance, 'Budget performance retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getBudgetUtilization(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate } = req.query;

      const utilization = await analyticsService.getBudgetUtilization(profileId, {
        period,
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(utilization, 'Budget utilization retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getBudgetVariance(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate } = req.query;

      const variance = await analyticsService.getBudgetVariance(profileId, {
        period,
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(variance, 'Budget variance analysis retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Goal Analytics
  async getGoalProgressAnalytics(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { startDate, endDate, status } = req.query;

      const progress = await analyticsService.getGoalProgressAnalytics(profileId, {
        startDate,
        endDate,
        status
      });

      res.status(200).json(formatResponse(progress, 'Goal progress analytics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getGoalPerformanceMetrics(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { startDate, endDate } = req.query;

      const metrics = await analyticsService.getGoalPerformanceMetrics(profileId, {
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(metrics, 'Goal performance metrics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getGoalProjections(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { goalId } = req.params;
      const { months = 6 } = req.query;

      const projections = await analyticsService.getGoalProjections(profileId, {
        goalId,
        months: parseInt(months)
      });

      res.status(200).json(formatResponse(projections, 'Goal projections retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Savings Analytics
  async getSavingsRate(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate } = req.query;

      const savingsRate = await analyticsService.getSavingsRate(profileId, {
        period,
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(savingsRate, 'Savings rate retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getSavingsTrends(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate, granularity = 'monthly' } = req.query;

      const trends = await analyticsService.getSavingsTrends(profileId, {
        period,
        startDate,
        endDate,
        granularity
      });

      res.status(200).json(formatResponse(trends, 'Savings trends retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Cash Flow Analytics
  async getCashFlowAnalysis(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, startDate, endDate } = req.query;

      const analysis = await analyticsService.getCashFlowAnalysis(profileId, {
        period,
        startDate,
        endDate
      });

      res.status(200).json(formatResponse(analysis, 'Cash flow analysis retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getCashFlowForecast(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { months = 3 } = req.query;

      const forecast = await analyticsService.getCashFlowForecast(profileId, {
        months: parseInt(months)
      });

      res.status(200).json(formatResponse(forecast, 'Cash flow forecast retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Comparison Analytics
  async getPeriodComparison(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { 
        currentStartDate, 
        currentEndDate, 
        compareStartDate, 
        compareEndDate,
        metrics = ['income', 'expenses', 'savings']
      } = req.query;

      const comparison = await analyticsService.getPeriodComparison(profileId, {
        currentPeriod: { startDate: currentStartDate, endDate: currentEndDate },
        comparePeriod: { startDate: compareStartDate, endDate: compareEndDate },
        metrics: Array.isArray(metrics) ? metrics : [metrics]
      });

      res.status(200).json(formatResponse(comparison, 'Period comparison retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getYearOverYearComparison(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, year = new Date().getFullYear() } = req.query;

      const comparison = await analyticsService.getYearOverYearComparison(profileId, {
        period,
        year: parseInt(year)
      });

      res.status(200).json(formatResponse(comparison, 'Year-over-year comparison retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Custom Analytics
  async generateCustomAnalytics(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const customConfig = req.body;

      const analytics = await analyticsService.generateCustomAnalytics(profileId, customConfig);

      res.status(201).json(formatResponse(analytics, 'Custom analytics generated successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getCustomAnalytics(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { id } = req.params;

      const analytics = await analyticsService.getCustomAnalytics(profileId, id);

      if (!analytics) {
        throw new AppError('Custom analytics not found', 404);
      }

      res.status(200).json(formatResponse(analytics, 'Custom analytics retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Chart Data
  async getChartData(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { chartType } = req.params;
      const { startDate, endDate, metric, granularity = 'daily' } = req.query;

      const chartData = await analyticsService.getChartData(profileId, {
        chartType,
        startDate,
        endDate,
        metric,
        granularity
      });

      res.status(200).json(formatResponse(chartData, 'Chart data retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Export Analytics
  async exportAnalytics(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { format } = req.params;
      const { startDate, endDate, metrics = [] } = req.query;

      const exportData = await analyticsService.exportAnalytics(profileId, {
        format,
        startDate,
        endDate,
        metrics: Array.isArray(metrics) ? metrics : [metrics]
      });

      // Set appropriate headers for file download
      const filename = `analytics_${profileId}_${Date.now()}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', getContentType(format));

      res.send(exportData);
    } catch (error) {
      next(error);
    }
  },

  // Insights and Recommendations
  async getFinancialInsights(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { startDate, endDate, categories = [] } = req.query;

      const insights = await analyticsService.getFinancialInsights(profileId, {
        startDate,
        endDate,
        categories: Array.isArray(categories) ? categories : [categories]
      });

      res.status(200).json(formatResponse(insights, 'Financial insights retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  async getRecommendations(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { type = 'all', priority = 'all' } = req.query;

      const recommendations = await analyticsService.getRecommendations(profileId, {
        type,
        priority
      });

      res.status(200).json(formatResponse(recommendations, 'Recommendations retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Real-time Analytics
  async getRealtimeSummary(req, res, next) {
    try {
      const profileId = req.user.profileId;

      const summary = await analyticsService.getRealtimeSummary(profileId);

      res.status(200).json(formatResponse(summary, 'Real-time summary retrieved successfully'));
    } catch (error) {
      next(error);
    }
  },

  // Historical Analytics
  async getHistoricalSummary(req, res, next) {
    try {
      const profileId = req.user.profileId;
      const { period, months = 12 } = req.query;

      const summary = await analyticsService.getHistoricalSummary(profileId, {
        period,
        months: parseInt(months)
      });

      res.status(200).json(formatResponse(summary, 'Historical summary retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }
};

// Helper function to get content type for exports
function getContentType(format) {
  const contentTypes = {
    'csv': 'text/csv',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pdf': 'application/pdf',
    'json': 'application/json'
  };
  return contentTypes[format] || 'application/octet-stream';
}

module.exports = analyticsController;