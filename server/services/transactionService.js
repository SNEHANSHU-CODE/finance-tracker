const Transaction = require('../models/transactionModel');
const User = require('../models/userModel'); // Fixed import name
const mongoose = require('mongoose');

class TransactionService {
  // Create a new transaction
  async createTransaction(userId, transactionData) {
    try {
      // Validate user exists
      const userExists = await User.findById(userId);
      if (!userExists) {
        throw new Error('User not found');
      }

      // Ensure amount has correct sign based on type
      if (transactionData.type === 'Expense' && transactionData.amount > 0) {
        transactionData.amount = -Math.abs(transactionData.amount);
      } else if (transactionData.type === 'Income' && transactionData.amount < 0) {
        transactionData.amount = Math.abs(transactionData.amount);
      }

      const transaction = new Transaction({
        userId,
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

  // Get transactions by user with filters
  async getTransactions(userId, options = {}) {
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
      searchTerm,
      sortBy = 'date',
      sortOrder = 'desc'
    } = options;

    const { ObjectId } = require('mongoose').Types;

    if (!userId || typeof userId !== 'string' || !ObjectId.isValid(userId)) {
      throw new Error('Invalid or missing userId');
    }

    const query = { userId: new ObjectId(userId) };

    // Helper function to check if value is valid and not empty
    const isValid = (val) => {
      if (val === undefined || val === null || val === '' || val === 'undefined') {
        return false;
      }
      // Handle arrays (from duplicate query params)
      if (Array.isArray(val)) {
        return val.length > 0 && val[0] !== '' && val[0] !== undefined && val[0] !== null;
      }
      return true;
    };

    // Type filter - handle both string and array
    const typeValue = Array.isArray(type) ? type[0] : type;
    if (typeValue && typeValue !== 'all' && (typeValue === 'Income' || typeValue === 'Expense')) {
      query.type = typeValue;
    }

    // Category filter
    if (isValid(category)) {
      const categoryValue = Array.isArray(category) ? category[0] : category;
      query.category = categoryValue;
    }

    // Payment method filter
    if (isValid(paymentMethod)) {
      const paymentMethodValue = Array.isArray(paymentMethod) ? paymentMethod[0] : paymentMethod;
      query.paymentMethod = paymentMethodValue;
    }

    // Tags filter
    if (Array.isArray(tags) && tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Date range filter - ONLY add if at least one valid date exists
    const hasValidStartDate = isValid(startDate);
    const hasValidEndDate = isValid(endDate);

    if (hasValidStartDate || hasValidEndDate) {
      const dateQuery = {};

      if (hasValidStartDate) {
        const startDateValue = Array.isArray(startDate) ? startDate[0] : startDate;
        const start = new Date(startDateValue);
        if (!isNaN(start.getTime())) {
          dateQuery.$gte = start;
        }
      }

      if (hasValidEndDate) {
        const endDateValue = Array.isArray(endDate) ? endDate[0] : endDate;
        const end = new Date(endDateValue);
        if (!isNaN(end.getTime())) {
          // Set to end of day
          end.setHours(23, 59, 59, 999);
          dateQuery.$lte = end;
        }
      }

      // Only add date filter if we have at least one valid date
      if (Object.keys(dateQuery).length > 0) {
        query.date = dateQuery;
      }
    }

    // Search functionality
    if (isValid(searchTerm)) {
      const searchValue = Array.isArray(searchTerm) ? searchTerm[0] : searchTerm;
      const searchRegex = new RegExp(searchValue, 'i');
      query.$or = [
        { description: searchRegex },
        { notes: searchRegex },
        { category: searchRegex },
        { paymentMethod: searchRegex }
      ];

      // If search term is a number, also search in amount
      if (!isNaN(searchValue)) {
        query.$or.push({ amount: parseFloat(searchValue) });
      }
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
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
  async getTransactionById(transactionId, userId) {
    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId
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
  async updateTransaction(transactionId, userId, updateData) {
    try {
      // Ensure amount has correct sign based on type
      if (updateData.type === 'Expense' && updateData.amount > 0) {
        updateData.amount = -Math.abs(updateData.amount);
      } else if (updateData.type === 'Income' && updateData.amount < 0) {
        updateData.amount = Math.abs(updateData.amount);
      }

      const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId },
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
  async deleteTransaction(transactionId, userId) {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: transactionId,
        userId
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
  async getMonthlySummary(userId, month, year) {
    try {
      const summary = await Transaction.getMonthlySummary(userId, month, year);

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
async getCategoryAnalysis(userId) {
  try {
    const analysis = await Transaction.getCategoryAnalysis(userId);

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
  async getRecentTransactions(userId, limit = 5) {
    try {
      const transactions = await Transaction.getRecent(userId, limit);

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
  async getDashboardStats(userId) {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get current month summary
      const monthlyStats = await this.getMonthlySummary(userId, currentMonth, currentYear);

      // Get recent transactions
      const recentTransactions = await this.getRecentTransactions(userId, 5);

      // Get year-to-date stats
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      const yearlyTransactions = await Transaction.find({
        userId,
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
  async setRecurring(transactionId, userId, frequency, endDate = null) {
    try {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        userId
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
  async bulkDeleteTransactions(transactionIds, userId) {
    try {
      const result = await Transaction.deleteMany({
        _id: { $in: transactionIds },
        userId
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
  async getSpendingTrends(userId) {
    try {
      const currentDate = new Date();
      const trends = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        const summary = await Transaction.getMonthlySummary(userId, month, year);
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

  // Check if user has already migrated guest data
  async checkGuestMigration(userId) {
    try {
      const existingTransaction = await Transaction.findOne({
        userId,
        isGuestMigrated: true
      });
      return !!existingTransaction;
    } catch (error) {
      console.error('Error checking guest migration:', error);
      return false;
    }
  }

  // Migrate guest data to user account
  async migrateGuestData(userId, transactions) {
    try {
      const migratedTransactions = [];

      for (const guestTransaction of transactions) {
        // Ensure amount has correct sign based on type
        let amount = guestTransaction.amount;
        if (guestTransaction.type === 'Expense' && amount > 0) {
          amount = -Math.abs(amount);
        } else if (guestTransaction.type === 'Income' && amount < 0) {
          amount = Math.abs(amount);
        }

        const transaction = new Transaction({
          userId,
          description: guestTransaction.description,
          amount,
          type: guestTransaction.type,
          category: guestTransaction.category,
          date: guestTransaction.date,
          paymentMethod: guestTransaction.paymentMethod,
          notes: guestTransaction.notes,
          tags: guestTransaction.tags,
          isGuestMigrated: true,
          migratedAt: new Date()
        });

        await transaction.save();
        migratedTransactions.push(transaction);
      }

      return {
        success: true,
        message: `${migratedTransactions.length} transactions migrated successfully`,
        data: {
          migratedCount: migratedTransactions.length,
          transactions: migratedTransactions
        }
      };
    } catch (error) {
      console.error('Error migrating guest data:', error);
      throw error;
    }
  }
}

module.exports = new TransactionService();