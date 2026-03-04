const budgetService = require('../services/budgetService');

class BudgetController {
  async getBudget(req, res) {
    try {
      const userId = req.userId;
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ success: false, message: 'month and year are required' });
      }

      const result = await budgetService.getBudget(userId, parseInt(month), parseInt(year));
      res.status(200).json(result);
    } catch (error) {
      console.error('Get budget error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to get budget' });
    }
  }

  async createBudget(req, res) {
    try {
      const userId = req.userId;
      const { month, year, categories, totalBudget } = req.body;

      if (!month || !year || !categories?.length) {
        return res.status(400).json({ success: false, message: 'month, year and categories are required' });
      }

      const result = await budgetService.createBudget(userId, { month, year, categories, totalBudget });
      res.status(201).json(result);
    } catch (error) {
      console.error('Create budget error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to create budget' });
    }
  }

  async updateBudget(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { categories, totalBudget } = req.body;

      if (!categories?.length) {
        return res.status(400).json({ success: false, message: 'categories are required' });
      }

      const result = await budgetService.updateBudget(userId, id, { categories, totalBudget });
      res.status(200).json(result);
    } catch (error) {
      console.error('Update budget error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to update budget' });
    }
  }

  // FIX: new endpoint — returns per-category spend vs limit for the month
  async getBudgetAnalysis(req, res) {
    try {
      const userId = req.userId;
      const { month, year } = req.query;

      if (!month || !year) {
        return res.status(400).json({ success: false, message: 'month and year are required' });
      }

      const result = await budgetService.getBudgetAnalysis(userId, parseInt(month), parseInt(year));
      res.status(200).json(result);
    } catch (error) {
      console.error('Get budget analysis error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to get budget analysis' });
    }
  }

  async deleteBudget(req, res) {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const result = await budgetService.deleteBudget(userId, id);
      res.status(200).json(result);
    } catch (error) {
      console.error('Delete budget error:', error);
      res.status(400).json({ success: false, message: error.message || 'Failed to delete budget' });
    }
  }
}

module.exports = new BudgetController();