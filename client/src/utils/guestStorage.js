// utils/guestStorage.js
const GUEST_TRANSACTIONS_KEY = 'guest_transactions';
const GUEST_GOALS_KEY = 'guest_goals';
const GUEST_DATA_MIGRATED_KEY = 'guest_data_migrated';

export const guestStorage = {
  // Transactions
  getTransactions: () => {
    try {
      const data = localStorage.getItem(GUEST_TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting guest transactions:', error);
      return [];
    }
  },

  setTransactions: (transactions) => {
    try {
      localStorage.setItem(GUEST_TRANSACTIONS_KEY, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error setting guest transactions:', error);
    }
  },

  addTransaction: (transaction) => {
    const transactions = guestStorage.getTransactions();
    transactions.push({ ...transaction, _id: Date.now().toString() });
    guestStorage.setTransactions(transactions);
    return transactions;
  },

  updateTransaction: (id, updatedTransaction) => {
    const transactions = guestStorage.getTransactions();
    const index = transactions.findIndex(t => t._id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updatedTransaction };
      guestStorage.setTransactions(transactions);
    }
    return transactions;
  },

  deleteTransaction: (id) => {
    const transactions = guestStorage.getTransactions();
    const filtered = transactions.filter(t => t._id !== id);
    guestStorage.setTransactions(filtered);
    return filtered;
  },

  // Goals
  getGoals: () => {
    try {
      const data = localStorage.getItem(GUEST_GOALS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting guest goals:', error);
      return [];
    }
  },

  setGoals: (goals) => {
    try {
      localStorage.setItem(GUEST_GOALS_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('Error setting guest goals:', error);
    }
  },

  addGoal: (goal) => {
    const goals = guestStorage.getGoals();
    goals.push({ ...goal, id: Date.now().toString() });
    guestStorage.setGoals(goals);
    return goals;
  },

  updateGoal: (id, updatedGoal) => {
    const goals = guestStorage.getGoals();
    const index = goals.findIndex(g => g.id === id);
    if (index !== -1) {
      goals[index] = { ...goals[index], ...updatedGoal };
      guestStorage.setGoals(goals);
    }
    return goals;
  },

  deleteGoal: (id) => {
    const goals = guestStorage.getGoals();
    const filtered = goals.filter(g => g.id !== id);
    guestStorage.setGoals(filtered);
    return filtered;
  },

  // Migration tracking
  isDataMigrated: () => {
    return localStorage.getItem(GUEST_DATA_MIGRATED_KEY) === 'true';
  },

  setDataMigrated: (migrated = true) => {
    localStorage.setItem(GUEST_DATA_MIGRATED_KEY, migrated.toString());
  },

  // Clear all guest data
  clearAllGuestData: () => {
    localStorage.removeItem(GUEST_TRANSACTIONS_KEY);
    localStorage.removeItem(GUEST_GOALS_KEY);
    localStorage.removeItem(GUEST_DATA_MIGRATED_KEY);
  },

  // Get all guest data for migration
  getAllGuestData: () => {
    return {
      transactions: guestStorage.getTransactions(),
      goals: guestStorage.getGoals(),
    };
  },
};