// utils/dashboardCalculations.js

/**
 * Frontend calculation utilities for dashboard data
 * Provides fallback calculations when backend data is unavailable
 */

export const dashboardCalculations = {
  /**
   * Calculate financial summary from transactions
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Financial summary with balance, income, expenses, etc.
   */
  calculateFinancialSummary: (transactions = []) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return {
        totalBalance: 0,
        monthlyIncome: 0,
        monthlyExpenses: 0,
        goalProgress: 0,
        savingsRate: 0
      };
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter transactions for current month
    const monthlyTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    // Calculate income and expenses
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'Income' || t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'Expense' || t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const totalBalance = monthlyIncome - monthlyExpenses;

    // Calculate savings rate
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

    return {
      totalBalance: Math.round(totalBalance * 100) / 100,
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
      goalProgress: 0, // This would need goals data
      savingsRate: Math.round(savingsRate * 100) / 100
    };
  },

  /**
   * Calculate category spending breakdown
   * @param {Array} transactions - Array of transaction objects
   * @returns {Array} Category spending data with percentages
   */
  calculateCategorySpending: (transactions = []) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter expense transactions for current month
    const monthlyExpenses = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (transaction.type === 'Expense' || transaction.type === 'expense') &&
             transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear;
    });

    // Group by category
    const categoryTotals = monthlyExpenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      acc[category] = (acc[category] || 0) + (parseFloat(transaction.amount) || 0);
      return acc;
    }, {});

    // Calculate total expenses
    const totalExpenses = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    if (totalExpenses === 0) {
      return [];
    }

    // Convert to array with percentages
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount: Math.round(amount * 100) / 100,
        percentage: Math.round((amount / totalExpenses) * 100 * 100) / 100,
        color: getCategoryColor(category)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8); // Top 8 categories
  },

  /**
   * Calculate spending trends over time
   * @param {Array} transactions - Array of transaction objects
   * @param {number} months - Number of months to analyze (default: 6)
   * @returns {Array} Monthly spending trends
   */
  calculateSpendingTrends: (transactions = [], months = 6) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    const trends = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = targetDate.toLocaleString('default', { month: 'short' });
      const year = targetDate.getFullYear();

      // Filter transactions for this month
      const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === targetDate.getMonth() &&
               transactionDate.getFullYear() === targetDate.getFullYear() &&
               (transaction.type === 'Expense' || transaction.type === 'expense');
      });

      const totalSpent = monthlyTransactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      trends.push({
        month: `${monthName} ${year}`,
        amount: Math.round(totalSpent * 100) / 100,
        transactions: monthlyTransactions.length
      });
    }

    return trends;
  },

  /**
   * Calculate recent transaction summary
   * @param {Array} transactions - Array of transaction objects
   * @param {number} limit - Number of recent transactions to return
   * @returns {Array} Recent transactions
   */
  getRecentTransactions: (transactions = [], limit = 5) => {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return [];
    }

    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit)
      .map(transaction => ({
        ...transaction,
        amount: parseFloat(transaction.amount) || 0,
        date: new Date(transaction.date).toLocaleDateString()
      }));
  }
};

/**
 * Get color for category visualization
 * @param {string} category - Category name
 * @returns {string} Color hex code
 */
const getCategoryColor = (category) => {
  const colorMap = {
    'Food': '#FF6B6B',
    'Transportation': '#4ECDC4',
    'Shopping': '#45B7D1',
    'Entertainment': '#96CEB4',
    'Utilities': '#FFEAA7',
    'Healthcare': '#DDA0DD',
    'Education': '#98D8C8',
    'Travel': '#F7DC6F',
    'Insurance': '#BB8FCE',
    'Rent': '#85C1E9',
    'Other': '#AEB6BF'
  };

  return colorMap[category] || colorMap['Other'];
};