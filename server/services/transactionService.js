// services/transactionService.js
const Transaction = require('../models/transactionModel');
const user = require('../models/userModel');
const mongoose = require('mongoose');

class TransactionService {
  // Create a new transaction
  async createTransaction(profileId, transactionData) {
    try {
      // Validate profile exists
      const profileExists = await user.findById(profileId);
      if (!profileExists) {
        throw new Error('Profile not found');
      }

      // Ensure amount has correct sign based on type
      if (transactionData.type === 'Expense' && transactionData.amount > 0) {
        transactionData.amount = -Math.abs(transactionData.amount);
      } else if (transactionData.type === 'Income' && transactionData.amount < 0) {
        transactionData.amount = Math.abs(transactionData.amount);
      }

      const transaction = new Transaction({
        profileId,
        ...transactionData
      });

      await transaction.save();
      await transaction.populate('goalId', 'name category');
      
      return {
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  // Get transactions by profile with filters
  async getTransactions(profileId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        category,
        startDate,
        endDate,
        paymentMethod,
        tags,
        sortBy = 'date',
        sortOrder = 'desc'
      } = options;

      const query = { profileId };

      // Apply filters
      if (type) query.type = type;
      if (category) query.category = category;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (tags && tags.length > 0) query.tags = { $in: tags };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const skip = (page - 1) * limit;
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const transactions = await Transaction.find(query)
        .populate('goalId', 'name category')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Transaction.countDocuments(query);

      return {
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          }
        }
      };
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  // Get single transaction by ID
  async getTransactionById(transactionId, profileId) {
    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        profileId
      }).populate('goalId', 'name category');

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  // Update transaction
  async updateTransaction(transactionId, profileId, updateData) {
    try {
      // Ensure amount has correct sign based on type
      if (updateData.type === 'Expense' && updateData.amount > 0) {
        updateData.amount = -Math.abs(updateData.amount);
      } else if (updateData.type === 'Income' && updateData.amount < 0) {
        updateData.amount = Math.abs(updateData.amount);
      }

      const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, profileId },
        updateData,
        { new: true, runValidators: true }
      ).populate('goalId', 'name category');

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
    }
  }

  // Delete transaction
  async deleteTransaction(transactionId, profileId) {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: transactionId,
        profileId
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      return {
        success: true,
        message: 'Transaction deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw error;
    }
  }

  // Get monthly summary
  async getMonthlySummary(profileId, month, year) {
    try {
      const summary = await Transaction.getMonthlySummary(profileId, month, year);
      
      return {
        success: true,
        data: summary
      };
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      throw error;
    }
  }

  // Get category analysis
  async getCategoryAnalysis(profileId, startDate, endDate) {
    try {
      const analysis = await Transaction.getCategoryAnalysis(profileId, startDate, endDate);
      
      return {
        success: true,
        data: analysis
      };
    } catch (error) {
      console.error('Error getting category analysis:', error);
      throw error;
    }
  }

  // Get recent transactions
  async getRecentTransactions(profileId, limit = 5) {
    try {
      const transactions = await Transaction.getRecent(profileId, limit);
      
      return {
        success: true,
        data: transactions
      };
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw error;
    }
  }

  // Get dashboard stats
  async getDashboardStats(profileId) {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // Get current month summary
      const monthlyStats = await this.getMonthlySummary(profileId, currentMonth, currentYear);
      
      // Get recent transactions
      const recentTransactions = await this.getRecentTransactions(profileId, 5);
      
      // Get year-to-date stats
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);
      
      const yearlyTransactions = await Transaction.find({
        profileId,
        date: { $gte: yearStart, $lte: yearEnd }
      });
      
      const yearlyIncome = yearlyTransactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);
        
      const yearlyExpenses = yearlyTransactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return {
        success: true,
        data: {
          monthly: monthlyStats.data,
          recent: recentTransactions.data,
          yearly: {
            totalIncome: yearlyIncome,
            totalExpenses: yearlyExpenses,
            netSavings: yearlyIncome - yearlyExpenses,
            transactionCount: yearlyTransactions.length
          }
        }
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Set transaction as recurring
  async setRecurring(transactionId, profileId, frequency, endDate = null) {
    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        profileId
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      await transaction.setRecurring(frequency, endDate);

      return {
        success: true,
        message: 'Transaction set as recurring successfully',
        data: transaction
      };
    } catch (error) {
      console.error('Error setting recurring transaction:', error);
      throw error;
    }
  }

  // Bulk delete transactions
  async bulkDeleteTransactions(transactionIds, profileId) {
    try {
      const result = await Transaction.deleteMany({
        _id: { $in: transactionIds },
        profileId
      });

      return {
        success: true,
        message: `${result.deletedCount} transactions deleted successfully`,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      console.error('Error bulk deleting transactions:', error);
      throw error;
    }
  }

  // Get spending trends (last 6 months)
  async getSpendingTrends(profileId) {
    try {
      const currentDate = new Date();
      const trends = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        
        const summary = await Transaction.getMonthlySummary(profileId, month, year);
        trends.push({
          month: date.toLocaleString('default', { month: 'long' }),
          year,
          ...summary
        });
      }

      return {
        success: true,
        data: trends
      };
    } catch (error) {
      console.error('Error getting spending trends:', error);
      throw error;
    }
  }
}

module.exports = new TransactionService();