// routes/analyticsRoutes.js
const express = require('express');
const { param, query } = require('express-validator');
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/analytics');
const {
  validateAnalyticsQuery,
  validatePeriodParameter,
  validateMetricParameter,
  validateDateRange,
  sanitizeAnalyticsData,
  validateComparisonPeriod,
  validateChartType,
  validateExportFormat,
  logAnalyticsActivity,
  checkAnalyticsLimits,
  addAnalyticsComputedFields,
  validateCustomMetrics
} = require('../middleware/analytics');

const analyticsRouter = express.Router();

// Apply authentication middleware to all routes
analyticsRouter.use(authenticateToken);

// Apply computed fields middleware to all routes
analyticsRouter.use(addAnalyticsComputedFields);

// Dashboard Analytics
analyticsRouter.get('/dashboard', 
  validateAnalyticsQuery,
  logAnalyticsActivity('dashboard'),
  analyticsController.getDashboardAnalytics
);

analyticsRouter.get('/overview', 
  validateDateRange,
  logAnalyticsActivity('overview'),
  analyticsController.getFinancialOverview
);

// Expense Analytics
analyticsRouter.get('/expenses/summary', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('expense-summary'),
  analyticsController.getExpenseSummary
);

analyticsRouter.get('/expenses/trends', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('expense-trends'),
  analyticsController.getExpenseTrends
);

analyticsRouter.get('/expenses/category-breakdown', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('category-breakdown'),
  analyticsController.getCategoryBreakdown
);

analyticsRouter.get('/expenses/top-categories', 
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  validateDateRange,
  handleValidationErrors,
  logAnalyticsActivity('top-categories'),
  analyticsController.getTopCategories
);

// Income Analytics
analyticsRouter.get('/income/summary', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('income-summary'),
  analyticsController.getIncomeSummary
);

analyticsRouter.get('/income/trends', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('income-trends'),
  analyticsController.getIncomeTrends
);

analyticsRouter.get('/income/sources', 
  validateDateRange,
  logAnalyticsActivity('income-sources'),
  analyticsController.getIncomeSourceAnalysis
);

// Budget Analytics
analyticsRouter.get('/budget/performance', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('budget-performance'),
  analyticsController.getBudgetPerformance
);

analyticsRouter.get('/budget/utilization', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('budget-utilization'),
  analyticsController.getBudgetUtilization
);

analyticsRouter.get('/budget/variance', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('budget-variance'),
  analyticsController.getBudgetVariance
);

// Goal Analytics
analyticsRouter.get('/goals/progress', 
  validateDateRange,
  logAnalyticsActivity('goal-progress'),
  analyticsController.getGoalProgressAnalytics
);

analyticsRouter.get('/goals/performance', 
  validateDateRange,
  logAnalyticsActivity('goal-performance'),
  analyticsController.getGoalPerformanceMetrics
);

analyticsRouter.get('/goals/projection', 
  param('goalId').optional().isMongoId().withMessage('Invalid goal ID'),
  handleValidationErrors,
  logAnalyticsActivity('goal-projection'),
  analyticsController.getGoalProjections
);

// Savings Analytics
analyticsRouter.get('/savings/rate', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('savings-rate'),
  analyticsController.getSavingsRate
);

analyticsRouter.get('/savings/trends', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('savings-trends'),
  analyticsController.getSavingsTrends
);

// Cash Flow Analytics
analyticsRouter.get('/cashflow/analysis', 
  validatePeriodParameter,
  validateDateRange,
  logAnalyticsActivity('cashflow-analysis'),
  analyticsController.getCashFlowAnalysis
);

analyticsRouter.get('/cashflow/forecast', 
  query('months').optional().isInt({ min: 1, max: 12 }).withMessage('Months must be between 1 and 12'),
  handleValidationErrors,
  logAnalyticsActivity('cashflow-forecast'),
  analyticsController.getCashFlowForecast
);

// Comparison Analytics
analyticsRouter.get('/comparison/periods', 
  validateComparisonPeriod,
  validateDateRange,
  logAnalyticsActivity('period-comparison'),
  analyticsController.getPeriodComparison
);

analyticsRouter.get('/comparison/year-over-year', 
  validatePeriodParameter,
  logAnalyticsActivity('year-over-year'),
  analyticsController.getYearOverYearComparison
);

// Custom Analytics
analyticsRouter.post('/custom', 
  checkAnalyticsLimits,
  validateCustomMetrics,
  sanitizeAnalyticsData,
  logAnalyticsActivity('custom-analytics'),
  analyticsController.generateCustomAnalytics
);

analyticsRouter.get('/custom/:id', 
  param('id').isMongoId().withMessage('Invalid analytics ID'),
  handleValidationErrors,
  logAnalyticsActivity('get-custom'),
  analyticsController.getCustomAnalytics
);

// Chart Data
analyticsRouter.get('/charts/:chartType', 
  validateChartType,
  validateDateRange,
  validateMetricParameter,
  logAnalyticsActivity('chart-data'),
  analyticsController.getChartData
);

// Export Analytics
analyticsRouter.get('/export/:format', 
  validateExportFormat,
  validateDateRange,
  query('metrics').optional().isArray().withMessage('Metrics must be an array'),
  handleValidationErrors,
  logAnalyticsActivity('export'),
  analyticsController.exportAnalytics
);

// Insights and Recommendations
analyticsRouter.get('/insights', 
  validateDateRange,
  logAnalyticsActivity('insights'),
  analyticsController.getFinancialInsights
);

analyticsRouter.get('/recommendations', 
  logAnalyticsActivity('recommendations'),
  analyticsController.getRecommendations
);

// Real-time Analytics
analyticsRouter.get('/realtime/summary', 
  logAnalyticsActivity('realtime-summary'),
  analyticsController.getRealtimeSummary
);

// Historical Analytics
analyticsRouter.get('/historical/summary', 
  validatePeriodParameter,
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24'),
  handleValidationErrors,
  logAnalyticsActivity('historical-summary'),
  analyticsController.getHistoricalSummary
);

module.exports = analyticsRouter;