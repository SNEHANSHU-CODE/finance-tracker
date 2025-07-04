const express = require('express');
const analyticsRouter = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/auth');

// Apply analyticsRouterhentication middleware to all routes
analyticsRouter.use(authenticateToken);

// Dashboard overview
analyticsRouter.get('/dashboard', analyticsController.getDashboard);

// Monthly analytics
analyticsRouter.get('/monthly/:year/:month', analyticsController.getMonthlyAnalytics);
analyticsRouter.get('/monthly/current', analyticsController.getCurrentMonthAnalytics);

// Spending analysis
analyticsRouter.get('/spending/trends', analyticsController.getSpendingTrends);
analyticsRouter.get('/spending/categories', analyticsController.getCategoryAnalysis);
analyticsRouter.get('/spending/comparison', analyticsController.getSpendingComparison);

// Income analysis
analyticsRouter.get('/income/trends', analyticsController.getIncomeTrends);
analyticsRouter.get('/income/sources', analyticsController.getIncomeSources);

// Goals analytics
analyticsRouter.get('/goals/progress', analyticsController.getGoalsProgress);
analyticsRouter.get('/goals/summary', analyticsController.getGoalsSummary);

// Transaction insights
analyticsRouter.get('/transactions/insights', analyticsController.getTransactionInsights);
analyticsRouter.get('/transactions/patterns', analyticsController.getTransactionPatterns);

// Savings analytics
analyticsRouter.get('/savings/rate', analyticsController.getSavingsRate);
analyticsRouter.get('/savings/trends', analyticsController.getSavingsTrends);

// Budget performance (for future budget feature)
analyticsRouter.get('/budget/performance', analyticsController.getBudgetPerformance);

// Export analytics data
analyticsRouter.get('/export/:type', analyticsController.exportAnalytics);

module.exports = analyticsRouter;