const AnalyticsService = require('../services/analyticsService');
const { validationResult } = require('express-validator');

class AnalyticsController {
  
  // Get dashboard overview
  static async getDashboard(req, res) {
    try {
      const userId = req.user.id;
      const data = await AnalyticsService.getDashboardData(userId);
      
      res.json({
        success: true,
        data,
        message: 'Dashboard data retrieved successfully'
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve dashboard data',
        error: error.message
      });
    }
  }

  // Get monthly analytics
  static async getMonthlyAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { year, month } = req.params;
      
      if (!year || !month || isNaN(year) || isNaN(month)) {
        return res.status(400).json({
          success: false,
          message: 'Valid year and month are required'
        });
      }

      const data = await AnalyticsService.getCurrentMonthData(userId);
      
      res.json({
        success: true,
        data,
        message: 'Monthly analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Monthly analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve monthly analytics',
        error: error.message
      });
    }
  }

  // Get current month analytics
  static async getCurrentMonthAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const data = await AnalyticsService.getCurrentMonthData(userId);
      
      res.json({
        success: true,
        data,
        message: 'Current month analytics retrieved successfully'
      });
    } catch (error) {
      console.error('Current month analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current month analytics',
        error: error.message
      });
    }
  }

  // Get spending trends
  static async getSpendingTrends(req, res) {
    try {
      const userId = req.user.id;
      const months = parseInt(req.query.months) || 6;
      
      const data = await AnalyticsService.getSpendingTrends(userId, months);
      
      res.json({
        success: true,
        data,
        message: 'Spending trends retrieved successfully'
      });
    } catch (error) {
      console.error('Spending trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve spending trends',
        error: error.message
      });
    }
  }

  // Get category analysis
  // Get category analysis
static async getCategoryAnalysis(req, res) {
  try {
    const userId = req.user.id;
    let { startDate, endDate, type = 'Expense' } = req.query;
    
    // If no dates provided, default to current month
    if (!startDate || !endDate) {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      startDate = firstDayOfMonth.toISOString().split('T')[0];
      endDate = lastDayOfMonth.toISOString().split('T')[0];
    }

    const data = await AnalyticsService.getCategoryAnalysis(userId, startDate, endDate, type);
    
    res.json({
      success: true,
      data,
      message: 'Category analysis retrieved successfully'
    });
  } catch (error) {
    console.error('Category analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category analysis',
      error: error.message
    });
  }
}

  // Get spending comparison
  static async getSpendingComparison(req, res) {
    try {
      const userId = req.user.id;
      const { period1Start, period1End, period2Start, period2End } = req.query;
      
      if (!period1Start || !period1End || !period2Start || !period2End) {
        return res.status(400).json({
          success: false,
          message: 'All period dates are required'
        });
      }

      const period1 = { startDate: period1Start, endDate: period1End };
      const period2 = { startDate: period2Start, endDate: period2End };
      
      const data = await AnalyticsService.getSpendingComparison(userId, period1, period2);
      
      res.json({
        success: true,
        data,
        message: 'Spending comparison retrieved successfully'
      });
    } catch (error) {
      console.error('Spending comparison error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve spending comparison',
        error: error.message
      });
    }
  }

  // Get income trends
  static async getIncomeTrends(req, res) {
    try {
      const userId = req.user.id;
      const months = parseInt(req.query.months) || 6;
      
      const data = await AnalyticsService.getIncomeTrends(userId, months);
      
      res.json({
        success: true,
        data,
        message: 'Income trends retrieved successfully'
      });
    } catch (error) {
      console.error('Income trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve income trends',
        error: error.message
      });
    }
  }

  // Get income sources
  static async getIncomeSources(req, res) {
    try {
      const userId = req.user.id;
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const data = await AnalyticsService.getIncomeSources(userId, startDate, endDate);
      
      res.json({
        success: true,
        data,
        message: 'Income sources retrieved successfully'
      });
    } catch (error) {
      console.error('Income sources error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve income sources',
        error: error.message
      });
    }
  }

  // Get goals progress
  static async getGoalsProgress(req, res) {
    try {
      const userId = req.user.id;
      const data = await AnalyticsService.getGoalsProgress(userId);
      
      res.json({
        success: true,
        data,
        message: 'Goals progress retrieved successfully'
      });
    } catch (error) {
      console.error('Goals progress error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goals progress',
        error: error.message
      });
    }
  }

  // Get goals summary
  static async getGoalsSummary(req, res) {
    try {
      const userId = req.user.id;
      const data = await AnalyticsService.getGoalsOverview(userId);
      
      res.json({
        success: true,
        data,
        message: 'Goals summary retrieved successfully'
      });
    } catch (error) {
      console.error('Goals summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goals summary',
        error: error.message
      });
    }
  }

  // Get transaction insights
  static async getTransactionInsights(req, res) {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 30;
      
      const data = await AnalyticsService.getTransactionInsights(userId, days);
      
      res.json({
        success: true,
        data,
        message: 'Transaction insights retrieved successfully'
      });
    } catch (error) {
      console.error('Transaction insights error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction insights',
        error: error.message
      });
    }
  }

  // Get transaction patterns
  static async getTransactionPatterns(req, res) {
    try {
      const userId = req.user.id;
      const days = parseInt(req.query.days) || 90;
      
      const data = await AnalyticsService.getTransactionPatterns(userId, days);
      
      res.json({
        success: true,
        data,
        message: 'Transaction patterns retrieved successfully'
      });
    } catch (error) {
      console.error('Transaction patterns error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction patterns',
        error: error.message
      });
    }
  }

  // Get savings rate
  static async getSavingsRate(req, res) {
    try {
      const userId = req.user.id;
      const months = parseInt(req.query.months) || 3;
      
      const data = await AnalyticsService.calculateSavingsRate(userId, months);
      
      res.json({
        success: true,
        data,
        message: 'Savings rate retrieved successfully'
      });
    } catch (error) {
      console.error('Savings rate error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve savings rate',
        error: error.message
      });
    }
  }

  // Get savings trends
  static async getSavingsTrends(req, res) {
    try {
      const userId = req.user.id;
      const months = parseInt(req.query.months) || 12;
      
      const data = await AnalyticsService.getSavingsTrends(userId, months);
      
      res.json({
        success: true,
        data,
        message: 'Savings trends retrieved successfully'
      });
    } catch (error) {
      console.error('Savings trends error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve savings trends',
        error: error.message
      });
    }
  }

  // Get budget performance (placeholder)
  static async getBudgetPerformance(req, res) {
    try {
      const userId = req.user.id;
      const data = await AnalyticsService.getBudgetPerformance(userId);
      
      res.json({
        success: true,
        data,
        message: 'Budget performance retrieved successfully'
      });
    } catch (error) {
      console.error('Budget performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve budget performance',
        error: error.message
      });
    }
  }

  // Export analytics data
  static async exportAnalytics(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.params;
      const format = req.query.format || 'json';
      
      let data;
      
      switch (type) {
        case 'dashboard':
          data = await AnalyticsService.getDashboardData(userId);
          break;
        case 'spending':
          data = await AnalyticsService.getSpendingTrends(userId);
          break;
        case 'income':
          data = await AnalyticsService.getIncomeTrends(userId);
          break;
        case 'goals':
          data = await AnalyticsService.getGoalsProgress(userId);
          break;
        case 'savings':
          data = await AnalyticsService.getSavingsTrends(userId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }
      
      if (format === 'csv') {
        // TODO: Implement CSV export
        return res.status(501).json({
          success: false,
          message: 'CSV export not yet implemented'
        });
      }
      
      res.json({
        success: true,
        data,
        exportType: type,
        format,
        exportedAt: new Date(),
        message: 'Analytics data exported successfully'
      });
    } catch (error) {
      console.error('Export analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics data',
        error: error.message
      });
    }
  }
}

module.exports = AnalyticsController;