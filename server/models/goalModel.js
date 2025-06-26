// models/goalModel.js
const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Profile ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: [50, 'Goal name cannot exceed 50 characters']
  },
  category: {
    type: String,
    required: [true, 'Goal category is required'],
    enum: ['Savings', 'Travel', 'Transportation', 'Technology', 'Emergency', 'Investment', 'Other']
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0, 'Target amount cannot be negative']
  },
  savedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Saved amount cannot be negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Paused'],
    default: 'Active'
  },
  completedDate: {
    type: Date
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters']
  }
}, {
  timestamps: true
});

// Indexes for better performance
goalSchema.index({ profileId: 1, status: 1 });
goalSchema.index({ profileId: 1, targetDate: 1 });
goalSchema.index({ profileId: 1, category: 1 });

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  if (this.targetAmount <= 0) return 0;
  return Math.round((this.savedAmount / this.targetAmount) * 100);
});

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.targetAmount - this.savedAmount);
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const today = new Date();
  const targetDate = new Date(this.targetDate);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for overdue status
goalSchema.virtual('isOverdue').get(function() {
  return this.daysRemaining < 0 && this.status !== 'Completed';
});

// Method to update saved amount
goalSchema.methods.updateSavedAmount = function(amount) {
  this.savedAmount += amount;
  if (this.savedAmount >= this.targetAmount && this.status !== 'Completed') {
    this.status = 'Completed';
    this.completedDate = new Date();
  }
  return this.save();
};

// Method to check if goal is achieved
goalSchema.methods.isAchieved = function() {
  return this.savedAmount >= this.targetAmount;
};

// Static method to get goals by profile
goalSchema.statics.getByProfile = function(profileId, status = null) {
  const query = { profileId };
  if (status) query.status = status;
  return this.find(query).sort({ targetDate: 1 });
};

// Static method to get goal summary by profile
goalSchema.statics.getSummaryByProfile = async function(profileId) {
  const goals = await this.find({ profileId });
  
  return {
    totalGoals: goals.length,
    activeGoals: goals.filter(g => g.status === 'Active').length,
    completedGoals: goals.filter(g => g.status === 'Completed').length,
    pausedGoals: goals.filter(g => g.status === 'Paused').length,
    totalTargetAmount: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalSavedAmount: goals.reduce((sum, g) => sum + g.savedAmount, 0),
    overallProgress: goals.length > 0 ? 
      Math.round((goals.reduce((sum, g) => sum + g.savedAmount, 0) / 
                  goals.reduce((sum, g) => sum + g.targetAmount, 0)) * 100) : 0
  };
};

// Pre-save middleware to update completion status
goalSchema.pre('save', function(next) {
  if (this.savedAmount >= this.targetAmount && this.status !== 'Completed') {
    this.status = 'Completed';
    this.completedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Goal', goalSchema);