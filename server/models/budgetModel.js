// models/budgetModel.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Profile ID is required'],
    index: true
  },
  category: {
    type: String,
    required: [true, 'Budget category is required'],
    enum: ['Food', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Education', 'Travel', 'Insurance', 'Rent', 'Other']
  },
  budgetAmount: {
    type: Number,
    required: [true, 'Budget amount is required'],
    min: [0, 'Budget amount cannot be negative']
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount cannot be negative']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020
  },
  alertThreshold: {
    type: Number,
    default: 80, // Alert when 80% of budget is used
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Compound index to ensure one budget per category per month/year per profile
budgetSchema.index({ profileId: 1, category: 1, month: 1, year: 1 }, { unique: true });
budgetSchema.index({ profileId: 1, month: 1, year: 1 });

// Virtual for remaining budget
budgetSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.budgetAmount - this.spentAmount);
});

// Virtual for budget utilization percentage
budgetSchema.virtual('utilizationPercentage').get(function() {
  if (this.budgetAmount <= 0) return 0;
  return Math.round((this.spentAmount / this.budgetAmount) * 100);
});

// Virtual for budget status
budgetSchema.virtual('status').get(function() {
  const utilization = this.utilizationPercentage;
  if (utilization >= 100) return 'Over Budget';
  if (utilization >= this.alertThreshold) return 'Warning';
  if (utilization >= 50) return 'On Track';
  return 'Under Budget';
});

// Virtual for alert status
budgetSchema.virtual('shouldAlert').get(function() {
  return this.utilizationPercentage >= this.alertThreshold;
});

// Method to update spent amount
budgetSchema.methods.updateSpentAmount = function(amount) {
  this.spentAmount += Math.abs(amount);
  return this.save();
};

// Method to reset budget (for new month)
budgetSchema.methods.reset = function() {
  this.spentAmount = 0;
  return this.save();
};

// Static method to get budgets by profile and period
budgetSchema.statics.getByProfileAndPeriod = function(profileId, month, year) {
  return this.find({ 
    profileId, 
    month, 
    year,
    isActive: true 
  }).sort({ category: 1 });
};

// Static method to get budget summary
budgetSchema.statics.getBudgetSummary = async function(profileId, month, year) {
  const budgets = await this.find({ profileId, month, year, isActive: true });
  
  const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalRemaining = totalBudget - totalSpent;
  
  const overBudgetCategories = budgets.filter(b => b.spentAmount > b.budgetAmount);
  const warningCategories = budgets.filter(b => b.shouldAlert && b.spentAmount <= b.budgetAmount);
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    utilizationPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
    budgetCount: budgets.length,
    overBudgetCount: overBudgetCategories.length,
    warningCount: warningCategories.length,
    status: totalSpent > totalBudget ? 'Over Budget' : 
            totalSpent > (totalBudget * 0.8) ? 'Warning' : 'On Track',
    budgets: budgets.map(b => ({
      category: b.category,
      budgetAmount: b.budgetAmount,
      spentAmount: b.spentAmount,
      remainingAmount: b.remainingAmount,
      utilizationPercentage: b.utilizationPercentage,
      status: b.status
    }))
  };
};

// Static method to create default budgets for a new period
budgetSchema.statics.createDefaultBudgets = async function(profileId, month, year, defaultAmounts = {}) {
  const defaultCategories = {
    'Food': defaultAmounts.Food || 500,
    'Transportation': defaultAmounts.Transportation || 300,
    'Shopping': defaultAmounts.Shopping || 200,
    'Entertainment': defaultAmounts.Entertainment || 150,
    'Utilities': defaultAmounts.Utilities || 200,
    'Healthcare': defaultAmounts.Healthcare || 100,
    'Other': defaultAmounts.Other || 100
  };
  
  const budgets = [];
  for (const [category, amount] of Object.entries(defaultCategories)) {
    try {
      const budget = new this({
        profileId,
        category,
        budgetAmount: amount,
        month,
        year
      });
      budgets.push(await budget.save());
    } catch (error) {
      // Skip if budget already exists for this category/period
      if (error.code !== 11000) throw error;
    }
  }
  
  return budgets;
};

// Static method to copy budgets from previous month
budgetSchema.statics.copyFromPreviousMonth = async function(profileId, currentMonth, currentYear) {
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }
  
  const previousBudgets = await this.find({ 
    profileId, 
    month: prevMonth, 
    year: prevYear,
    isActive: true 
  });
  
  const newBudgets = [];
  for (const prevBudget of previousBudgets) {
    try {
      const newBudget = new this({
        profileId,
        category: prevBudget.category,
        budgetAmount: prevBudget.budgetAmount,
        month: currentMonth,
        year: currentYear,
        alertThreshold: prevBudget.alertThreshold
      });
      newBudgets.push(await newBudget.save());
    } catch (error) {
      // Skip if budget already exists
      if (error.code !== 11000) throw error;
    }
  }
  
  return newBudgets;
};

// Static method to get budget efficiency rating
budgetSchema.statics.getBudgetEfficiency = async function(profileId, month, year) {
  const budgets = await this.find({ profileId, month, year, isActive: true });
  
  if (budgets.length === 0) return 'No Data';
  
  const avgUtilization = budgets.reduce((sum, b) => sum + b.utilizationPercentage, 0) / budgets.length;
  const overBudgetCount = budgets.filter(b => b.utilizationPercentage > 100).length;
  
  if (overBudgetCount > budgets.length * 0.5) return 'Poor';
  if (avgUtilization > 90) return 'Good';
  if (avgUtilization > 70) return 'Excellent';
  return 'Under-utilized';
};

module.exports = mongoose.model('Budget', budgetSchema);