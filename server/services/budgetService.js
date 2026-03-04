const Budget = require('../models/budgetModel');
const Transaction = require('../models/transactionModel');
const mongoose = require('mongoose');

class BudgetService {
  async getBudget(userId, month, year) {
    try {
      const budget = await Budget.findOne({ userId, month, year });
      return { success: true, data: budget }; // null data = no budget yet
    } catch (error) {
      console.error('Error getting budget:', error);
      throw error;
    }
  }

  // FIX: was missing — budgetSlice.fetchBudgetAnalysis called GET /budget/analysis but no handler existed.
  // Computes per-category actual spend for the month and flags unplanned categories.
  async getBudgetAnalysis(userId, month, year) {
    try {
      const budget = await Budget.findOne({ userId, month, year });
      if (!budget) return { success: true, data: null };

      const startDate = new Date(year, month - 1, 1);
      const endDate   = new Date(year, month, 0, 23, 59, 59);

      const spendRows = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'Expense',
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$category',
            spent: { $sum: { $abs: '$amount' } },
          },
        },
      ]);

      const spendMap    = Object.fromEntries(spendRows.map(r => [r._id, r.spent]));
      const budgetNames = new Set(budget.categories.map(c => c.name));

      const categorySpend = budget.categories.map(c => ({
        name:  c.name,
        limit: c.limit,
        spent: spendMap[c.name] || 0,
      }));

      const unplanned = spendRows
        .filter(r => !budgetNames.has(r._id))
        .map(r => ({ name: r._id, spent: r.spent }));

      return { success: true, data: { categorySpend, unplanned } };
    } catch (error) {
      console.error('Error getting budget analysis:', error);
      throw error;
    }
  }

  async createBudget(userId, { month, year, categories, totalBudget }) {
    try {
      const exists = await Budget.findOne({ userId, month, year });
      if (exists) throw new Error('Budget already exists for this month. Use update instead.');

      const budget = await Budget.create({ userId, month, year, categories, totalBudget });
      return { success: true, message: 'Budget created successfully', data: budget };
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  }

  async updateBudget(userId, budgetId, { categories, totalBudget }) {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: budgetId, userId },
        { categories, totalBudget },
        { new: true, runValidators: true }
      );
      if (!budget) throw new Error('Budget not found');
      return { success: true, message: 'Budget updated successfully', data: budget };
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  }

  async deleteBudget(userId, budgetId) {
    try {
      const budget = await Budget.findOneAndDelete({ _id: budgetId, userId });
      if (!budget) throw new Error('Budget not found');
      return { success: true, message: 'Budget deleted successfully' };
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  }
}

module.exports = new BudgetService();