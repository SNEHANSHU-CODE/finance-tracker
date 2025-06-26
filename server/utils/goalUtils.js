//Calculate progress percentage for a goal
const calculateProgressPercentage = (savedAmount, targetAmount) => {
  if (targetAmount <= 0) return 0;
  return Math.min(100, Math.round((savedAmount / targetAmount) * 100));
};

//Calculate remaining amount needed to reach goal
const calculateRemainingAmount = (savedAmount, targetAmount) => {
  return Math.max(0, targetAmount - savedAmount);
};

//Calculate days remaining until target date
const calculateDaysRemaining = (targetDate) => {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

//Check if goal is overdue
const isGoalOverdue = (targetDate, status) => {
  if (status === 'Completed') return false;
  return new Date(targetDate) < new Date();
};

//Calculate monthly savings needed to reach goal
const calculateMonthlySavingsNeeded = (remainingAmount, daysRemaining) => {
  if (daysRemaining <= 0) return remainingAmount;
  const monthsRemaining = Math.max(1, daysRemaining / 30);
  return Math.round((remainingAmount / monthsRemaining) * 100) / 100;
};

//Calculate weekly savings needed to reach goal
const calculateWeeklySavingsNeeded = (remainingAmount, daysRemaining) => {
  if (daysRemaining <= 0) return remainingAmount;
  const weeksRemaining = Math.max(1, daysRemaining / 7);
  return Math.round((remainingAmount / weeksRemaining) * 100) / 100;
};

//Calculate daily savings needed to reach goal
const calculateDailySavingsNeeded = (remainingAmount, daysRemaining) => {
  if (daysRemaining <= 0) return remainingAmount;
  return Math.round((remainingAmount / daysRemaining) * 100) / 100;
};

//Get goal status color for UI purposes
const getGoalStatusColor = (status, isOverdue = false) => {
  if (status === 'Completed') return 'green';
  if (status === 'Paused') return 'orange';
  if (isOverdue) return 'red';
  return 'blue'; // Active
};

//Get goal priority color for UI purposes
const getGoalPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return 'red';
    case 'Medium': return 'orange';
    case 'Low': return 'green';
    default: return 'gray';
  }
};

//Format currency amount for display
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

//Format date for display
const formatDate = (date, locale = 'en-US') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

//Get relative time string (e.g., "in 30 days", "3 days ago")
const getRelativeTimeString = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffTime = target - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `In ${diffDays} days`;
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  
  return formatDate(date);
};

//Validate goal data
const validateGoalData = (goalData) => {
  const errors = [];
  
  if (!goalData.name || goalData.name.trim().length === 0) {
    errors.push('Goal name is required');
  }
  
  if (goalData.name && goalData.name.length > 50) {
    errors.push('Goal name cannot exceed 50 characters');
  }
  
  if (!goalData.targetAmount || goalData.targetAmount <= 0) {
    errors.push('Target amount must be greater than 0');
  }
  
  if (goalData.targetAmount && goalData.targetAmount > 10000000) {
    errors.push('Target amount is too large (max: 10,000,000)');
  }
  
  if (!goalData.category) {
    errors.push('Goal category is required');
  }
  
  const validCategories = ['Savings', 'Travel', 'Transportation', 'Technology', 'Emergency', 'Investment', 'Other'];
  if (goalData.category && !validCategories.includes(goalData.category)) {
    errors.push('Invalid goal category');
  }
  
  if (!goalData.targetDate) {
    errors.push('Target date is required');
  }
  
  if (goalData.targetDate) {
    const targetDate = new Date(goalData.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (targetDate <= today) {
      errors.push('Target date must be in the future');
    }
    
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10);
    
    if (targetDate > maxDate) {
      errors.push('Target date cannot be more than 10 years in the future');
    }
  }
  
  if (goalData.savedAmount && goalData.savedAmount < 0) {
    errors.push('Saved amount cannot be negative');
  }
  
  if (goalData.savedAmount && goalData.targetAmount && goalData.savedAmount > goalData.targetAmount) {
    errors.push('Saved amount cannot be greater than target amount');
  }
  
  if (goalData.priority) {
    const validPriorities = ['High', 'Medium', 'Low'];
    if (!validPriorities.includes(goalData.priority)) {
      errors.push('Invalid priority level');
    }
  }
  
  if (goalData.status) {
    const validStatuses = ['Active', 'Completed', 'Paused'];
    if (!validStatuses.includes(goalData.status)) {
      errors.push('Invalid goal status');
    }
  }
  
  if (goalData.description && goalData.description.length > 200) {
    errors.push('Description cannot exceed 200 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

//Calculate goal statistics for a set of goals
const calculateGoalStatistics = (goals) => {
  if (!goals || goals.length === 0) {
    return {
      totalGoals: 0,
      activeGoals: 0,
      completedGoals: 0,
      pausedGoals: 0,
      overdueGoals: 0,
      totalTargetAmount: 0,
      totalSavedAmount: 0,
      overallProgress: 0,
      averageProgress: 0
    };
  }

  const stats = {
    totalGoals: goals.length,
    activeGoals: 0,
    completedGoals: 0,
    pausedGoals: 0,
    overdueGoals: 0,
    totalTargetAmount: 0,
    totalSavedAmount: 0,
    overallProgress: 0,
    averageProgress: 0
  };

  let totalProgress = 0;

  goals.forEach(goal => {
    // Count by status
    if (goal.status === 'Active') stats.activeGoals++;
    else if (goal.status === 'Completed') stats.completedGoals++;
    else if (goal.status === 'Paused') stats.pausedGoals++;

    // Check if overdue
    if (isGoalOverdue(goal.targetDate, goal.status)) {
      stats.overdueGoals++;
    }

    // Sum amounts
    stats.totalTargetAmount += goal.targetAmount || 0;
    stats.totalSavedAmount += goal.savedAmount || 0;

    // Calculate progress
    const progress = calculateProgressPercentage(goal.savedAmount || 0, goal.targetAmount || 0);
    totalProgress += progress;
  });

  // Calculate overall progress
  stats.overallProgress = stats.totalTargetAmount > 0 
    ? Math.round((stats.totalSavedAmount / stats.totalTargetAmount) * 100)
    : 0;

  // Calculate average progress
  stats.averageProgress = Math.round(totalProgress / goals.length);

  return stats;
};

//Get goals by category with statistics
const getGoalsByCategory = (goals, category) => {
  const filteredGoals = goals.filter(goal => goal.category === category);
  const statistics = calculateGoalStatistics(filteredGoals);
  
  return {
    goals: filteredGoals,
    statistics,
    category
  };
};

//Get goals by priority with statistics
const getGoalsByPriority = (goals, priority) => {
  const filteredGoals = goals.filter(goal => goal.priority === priority);
  const statistics = calculateGoalStatistics(filteredGoals);
  
  return {
    goals: filteredGoals,
    statistics,
    priority
  };
};

//Sort goals by specified field and order
const sortGoals = (goals, sortBy = 'targetDate', sortOrder = 'asc') => {
  return goals.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle date fields
    if (sortBy === 'targetDate' || sortBy === 'createdAt') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle string fields
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'desc') {
      return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
    } else {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    }
  });
};

// Get overdue goals
const getOverdueGoals = (goals) => {
  return goals.filter(goal => isGoalOverdue(goal.targetDate, goal.status));
};

//Get upcoming goals (due within specified days)
const getUpcomingGoals = (goals, days = 30) => {
  return goals.filter(goal => {
    if (goal.status === 'Completed') return false;
    const daysRemaining = calculateDaysRemaining(goal.targetDate);
    return daysRemaining >= 0 && daysRemaining <= days;
  });
};

//Generate goal recommendations based on current goals
const generateGoalRecommendations = (goals) => {
  const recommendations = [];
  
  // Check for goals with no progress
  const noProgressGoals = goals.filter(goal => 
    goal.status === 'Active' && (goal.savedAmount || 0) === 0
  );
  
  if (noProgressGoals.length > 0) {
    recommendations.push({
      type: 'no_progress',
      message: `You have ${noProgressGoals.length} goal(s) with no progress. Consider making your first contribution!`,
      goals: noProgressGoals
    });
  }
  
  // Check for overdue goals
  const overdueGoals = getOverdueGoals(goals);
  if (overdueGoals.length > 0) {
    recommendations.push({
      type: 'overdue',
      message: `You have ${overdueGoals.length} overdue goal(s). Consider updating target dates or increasing contributions.`,
      goals: overdueGoals
    });
  }
  
  // Check for goals close to completion
  const nearCompletionGoals = goals.filter(goal => {
    const progress = calculateProgressPercentage(goal.savedAmount || 0, goal.targetAmount || 0);
    return goal.status === 'Active' && progress >= 90 && progress < 100;
  });
  
  if (nearCompletionGoals.length > 0) {
    recommendations.push({
      type: 'near_completion',
      message: `You're almost there! ${nearCompletionGoals.length} goal(s) are 90%+ complete.`,
      goals: nearCompletionGoals
    });
  }
  
  return recommendations;
};

module.exports = {
  calculateProgressPercentage,
  calculateRemainingAmount,
  calculateDaysRemaining,
  isGoalOverdue,
  calculateMonthlySavingsNeeded,
  calculateWeeklySavingsNeeded,
  calculateDailySavingsNeeded,
  getGoalStatusColor,
  getGoalPriorityColor,
  formatCurrency,
  formatDate,
  getRelativeTimeString,
  validateGoalData,
  calculateGoalStatistics,
  getGoalsByCategory,
  getGoalsByPriority,
  sortGoals,
  getOverdueGoals,
  getUpcomingGoals,
  generateGoalRecommendations
};