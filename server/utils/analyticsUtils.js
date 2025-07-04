//Format date based on period type
function formatDateByPeriod(date, period) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const week = getWeekNumber(d);
  const quarter = Math.floor(d.getMonth() / 3) + 1;

  switch (period) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly':
      return `${year}-W${String(week).padStart(2, '0')}`;
    case 'monthly':
      return `${year}-${month}`;
    case 'quarterly':
      return `${year}-Q${quarter}`;
    case 'yearly':
      return `${year}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

//Get week number of the year
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

//Calculate date range based on period or custom dates
function calculateDateRange(period, startDate, endDate) {
  if (startDate && endDate) {
    return {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };
  }

  const now = new Date();
  let start, end;

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'weekly':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      end = now;
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    default:
      // Default to last 30 days
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      end = now;
  }

  return { startDate: start, endDate: end };
}

//Format currency values
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

//Calculate percentage change between two values
function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

// Aggregate data by time period
function aggregateByPeriod(data, period = 'daily', dateField = 'date') {
  const grouped = {};

  data.forEach(item => {
    const key = formatDateByPeriod(item[dateField], period);
    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        items: [],
        count: 0,
        total: 0
      };
    }
    grouped[key].items.push(item);
    grouped[key].count++;
    grouped[key].total += item.amount || 0;
  });

  return Object.values(grouped).sort((a, b) => new Date(a.period) - new Date(b.period));
}

//Calculate trends from time series data
function calculateTrends(values) {
  if (values.length < 2) {
    return {
      direction: 'stable',
      percentage: 0,
      volatility: 0,
      stability: 100
    };
  }

  // Calculate linear regression to determine trend
  const n = values.length;
  const xSum = values.reduce((sum, _, index) => sum + index, 0);
  const ySum = values.reduce((sum, value) => sum + value, 0);
  const xySum = values.reduce((sum, value, index) => sum + (index * value), 0);
  const x2Sum = values.reduce((sum, _, index) => sum + (index * index), 0);

  const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  const intercept = (ySum - slope * xSum) / n;

  // Calculate trend percentage
  const firstPredicted = intercept;
  const lastPredicted = slope * (n - 1) + intercept;
  const trendPercentage = firstPredicted !== 0 ? 
    ((lastPredicted - firstPredicted) / Math.abs(firstPredicted)) * 100 : 0;

  // Calculate volatility (coefficient of variation)
  const mean = ySum / n;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);
  const volatility = mean !== 0 ? (standardDeviation / Math.abs(mean)) * 100 : 0;

  // Determine direction
  let direction = 'stable';
  if (Math.abs(trendPercentage) > 5) {
    direction = trendPercentage > 0 ? 'increasing' : 'decreasing';
  }

  return {
    direction,
    percentage: Math.round(trendPercentage * 100) / 100,
    volatility: Math.round(volatility * 100) / 100,
    stability: Math.max(0, 100 - volatility),
    slope,
    correlation: calculateCorrelation(values)
  };
}

//Generate insights from data
function generateInsights(data, context = {}) {
  const insights = [];
  
  if (!data || data.length === 0) {
    return insights;
  }

  // Revenue/Income insights
  if (context.type === 'income') {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const average = total / data.length;
    const max = Math.max(...data.map(item => item.amount || 0));
    const min = Math.min(...data.map(item => item.amount || 0));

    if (max > average * 2) {
      insights.push({
        type: 'opportunity',
        title: 'High-Value Income Source',
        message: `Your highest income transaction was ${formatCurrency(max)}, which is significantly above average.`,
        actionable: true,
        suggestion: 'Consider strategies to replicate or increase this type of income.'
      });
    }

    if (data.length > 1) {
      const trend = calculateTrends(data.map(item => item.amount));
      if (trend.direction === 'increasing') {
        insights.push({
          type: 'positive',
          title: 'Growing Income',
          message: `Your income trend is increasing by ${trend.percentage.toFixed(1)}%.`,
          actionable: false
        });
      }
    }
  }

  // Expense insights
  if (context.type === 'expense') {
    const total = data.reduce((sum, item) => sum + (item.amount || 0), 0);
    const categories = groupByCategory(data);
    const topCategory = Object.keys(categories).reduce((a, b) => 
      categories[a].total > categories[b].total ? a : b
    );

    insights.push({
      type: 'info',
      title: 'Top Spending Category',
      message: `${topCategory} accounts for ${formatCurrency(categories[topCategory].total)} (${((categories[topCategory].total / total) * 100).toFixed(1)}%) of your expenses.`,
      actionable: true,
      suggestion: 'Review this category for potential savings opportunities.'
    });

    // Check for unusual spending
    const average = total / data.length;
    const unusualTransactions = data.filter(item => item.amount > average * 3);
    
    if (unusualTransactions.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Large Transactions Detected',
        message: `${unusualTransactions.length} transaction(s) are significantly above average.`,
        actionable: true,
        suggestion: 'Review these transactions to ensure they align with your budget.'
      });
    }
  }

  // Budget insights
  if (context.type === 'budget') {
    const overBudgetCategories = data.filter(item => item.utilizationPercentage > 100);
    const underBudgetCategories = data.filter(item => item.utilizationPercentage < 50);

    if (overBudgetCategories.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Over Budget Categories',
        message: `${overBudgetCategories.length} categories are over budget.`,
        actionable: true,
        suggestion: 'Consider adjusting spending or increasing budget allocations for these categories.'
      });
    }

    if (underBudgetCategories.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Under-utilized Budget',
        message: `${underBudgetCategories.length} categories have significant unused budget.`,
        actionable: true,
        suggestion: 'Consider reallocating these funds to other categories or savings goals.'
      });
    }
  }

  return insights;
}

//Helper function to get date format based on period
function getDateFormat(period) {
  const formats = {
    daily: 'YYYY-MM-DD',
    weekly: 'YYYY-[W]WW',
    monthly: 'YYYY-MM',
    quarterly: 'YYYY-[Q]Q',
    yearly: 'YYYY'
  };
  return formats[period] || formats.daily;
}

//Calculate correlation coefficient
function calculateCorrelation(values) {
  if (values.length < 2) return 0;
  
  const indices = values.map((_, index) => index);
  const n = values.length;
  
  const sumX = indices.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + (x * values[i]), 0);
  const sumX2 = indices.reduce((sum, x) => sum + (x * x), 0);
  const sumY2 = values.reduce((sum, y) => sum + (y * y), 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

//Group data by category
function groupByCategory(data) {
  return data.reduce((groups, item) => {
    const category = item.category || 'Uncategorized';
    if (!groups[category]) {
      groups[category] = {
        total: 0,
        count: 0,
        items: []
      };
    }
    groups[category].total += item.amount || 0;
    groups[category].count++;
    groups[category].items.push(item);
    return groups;
  }, {});
}

//Calculate moving average
function calculateMovingAverage(values, period = 7) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - period + 1);
    const slice = values.slice(start, i + 1);
    const average = slice.reduce((sum, val) => sum + val, 0) / slice.length;
    result.push(average);
  }
  return result;
}

//Detect anomalies in data
function detectAnomalies(values, threshold = 2) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  
  return values.map((value, index) => ({
    index,
    value,
    isAnomaly: Math.abs(value - mean) > threshold * stdDev,
    zScore: (value - mean) / stdDev
  }));
}

//Calculate seasonal patterns
function calculateSeasonality(data, period = 12) {
  const seasonal = {};
  
  data.forEach((item, index) => {
    const seasonIndex = index % period;
    if (!seasonal[seasonIndex]) {
      seasonal[seasonIndex] = [];
    }
    seasonal[seasonIndex].push(item.amount || 0);
  });
  
  // Calculate average for each seasonal period
  const seasonalPattern = Object.keys(seasonal).map(key => {
    const values = seasonal[key];
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  });
  
  return seasonalPattern;
}

//Generate forecasts based on historical data
function generateForecast(values, periods = 3, method = 'linear') {
  if (values.length < 2) {
    return new Array(periods).fill(values[0] || 0);
  }
  
  switch (method) {
    case 'linear':
      return generateLinearForecast(values, periods);
    case 'exponential':
      return generateExponentialForecast(values, periods);
    case 'seasonal':
      return generateSeasonalForecast(values, periods);
    default:
      return generateLinearForecast(values, periods);
  }
}

function generateLinearForecast(values, periods) {
  const trends = calculateTrends(values);
  const lastValue = values[values.length - 1];
  const forecast = [];
  
  for (let i = 1; i <= periods; i++) {
    const projectedValue = lastValue + (trends.slope * i);
    forecast.push(Math.max(0, projectedValue)); // Ensure non-negative
  }
  
  return forecast;
}

function generateExponentialForecast(values, periods) {
  const alpha = 0.3; // Smoothing parameter
  let smoothed = values[0];
  
  // Calculate exponential smoothing
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }
  
  // Generate forecast
  return new Array(periods).fill(smoothed);
}

function generateSeasonalForecast(values, periods) {
  const seasonalPeriod = Math.min(12, Math.floor(values.length / 2));
  const seasonality = calculateSeasonality(values.map(v => ({ amount: v })), seasonalPeriod);
  const trend = calculateTrends(values);
  
  const forecast = [];
  const lastValue = values[values.length - 1];
  
  for (let i = 1; i <= periods; i++) {
    const seasonalIndex = (values.length + i - 1) % seasonalPeriod;
    const seasonalFactor = seasonality[seasonalIndex] / (values.reduce((sum, v) => sum + v, 0) / values.length);
    const trendValue = lastValue + (trend.slope * i);
    forecast.push(Math.max(0, trendValue * seasonalFactor));
  }
  
  return forecast;
}

//Calculate financial ratios
function calculateFinancialRatios(income, expenses, savings = 0, debt = 0) {
  const totalIncome = income || 0;
  const totalExpenses = expenses || 0;
  const totalSavings = savings || 0;
  const totalDebt = debt || 0;

  return {
    savingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0,
    expenseRatio: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
    debtToIncomeRatio: totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0,
    netWorthGrowth: totalSavings - totalDebt,
    financialHealth: calculateFinancialHealthScore(totalIncome, totalExpenses, totalSavings, totalDebt)
  };
}

//Calculate financial health score (0-100)
function calculateFinancialHealthScore(income, expenses, savings, debt) {
  let score = 0;
  
  // Savings rate (30 points max)
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  if (savingsRate >= 20) score += 30;
  else if (savingsRate >= 10) score += 20;
  else if (savingsRate >= 5) score += 10;
  else if (savingsRate > 0) score += 5;
  
  // Expense ratio (25 points max)
  const expenseRatio = income > 0 ? (expenses / income) * 100 : 100;
  if (expenseRatio <= 50) score += 25;
  else if (expenseRatio <= 70) score += 15;
  else if (expenseRatio <= 90) score += 5;
  
  // Debt management (25 points max)
  const debtRatio = income > 0 ? (debt / income) * 100 : 0;
  if (debtRatio <= 20) score += 25;
  else if (debtRatio <= 40) score += 15;
  else if (debtRatio <= 60) score += 5;
  
  // Emergency fund (20 points max)
  const monthlyExpenses = expenses / 12; // Assuming annual expenses
  const emergencyFundMonths = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  if (emergencyFundMonths >= 6) score += 20;
  else if (emergencyFundMonths >= 3) score += 15;
  else if (emergencyFundMonths >= 1) score += 10;
  else if (emergencyFundMonths > 0) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

//Calculate budget efficiency metrics
function calculateBudgetEfficiency(budgetData) {
  const totalBudget = budgetData.reduce((sum, item) => sum + item.budgetAmount, 0);
  const totalSpent = budgetData.reduce((sum, item) => sum + item.spentAmount, 0);
  const totalVariance = budgetData.reduce((sum, item) => sum + Math.abs(item.budgetAmount - item.spentAmount), 0);
  
  return {
    utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    accuracyScore: totalBudget > 0 ? Math.max(0, 100 - (totalVariance / totalBudget) * 100) : 0,
    overBudgetCategories: budgetData.filter(item => item.spentAmount > item.budgetAmount).length,
    underBudgetCategories: budgetData.filter(item => item.spentAmount < item.budgetAmount * 0.8).length,
    efficiencyRating: calculateEfficiencyRating(totalBudget, totalSpent, totalVariance)
  };
}

//Calculate efficiency rating based on budget performance
function calculateEfficiencyRating(budget, spent, variance) {
  const utilizationRate = budget > 0 ? (spent / budget) * 100 : 0;
  const accuracyRate = budget > 0 ? Math.max(0, 100 - (variance / budget) * 100) : 0;
  
  const efficiency = (utilizationRate * 0.6 + accuracyRate * 0.4);
  
  if (efficiency >= 90) return 'Excellent';
  if (efficiency >= 80) return 'Very Good';
  if (efficiency >= 70) return 'Good';
  if (efficiency >= 60) return 'Fair';
  return 'Needs Improvement';
}

//Calculate cash flow patterns

function analyzeCashFlow(transactions, period = 'monthly') {
  const cashFlowData = aggregateByPeriod(transactions, period);
  
  const analysis = cashFlowData.map(periodData => {
    const income = periodData.items.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = periodData.items.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netFlow = income - expenses;
    
    return {
      period: periodData.period,
      income,
      expenses,
      netFlow,
      cashFlowRatio: income > 0 ? netFlow / income : 0
    };
  });
  
  const netFlows = analysis.map(a => a.netFlow);
  const trends = calculateTrends(netFlows);
  
  return {
    periods: analysis,
    summary: {
      averageNetFlow: netFlows.reduce((sum, flow) => sum + flow, 0) / netFlows.length,
      positiveFlowPeriods: netFlows.filter(flow => flow > 0).length,
      negativeFlowPeriods: netFlows.filter(flow => flow < 0).length,
      volatility: trends.volatility,
      trend: trends.direction,
      trendPercentage: trends.percentage
    }
  };
}

//Calculate investment performance metrics
function calculateInvestmentMetrics(investments, benchmarkReturns = []) {
  if (!investments || investments.length === 0) {
    return {
      totalReturn: 0,
      annualizedReturn: 0,
      volatility: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    };
  }
  
  const returns = investments.map(inv => inv.return || 0);
  const totalReturn = returns.reduce((sum, ret) => sum + ret, 0);
  const averageReturn = totalReturn / returns.length;
  const annualizedReturn = Math.pow(1 + averageReturn / 100, 12) - 1; // Assuming monthly data
  
  // Calculate volatility (standard deviation of returns)
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  // Calculate Sharpe ratio (assuming risk-free rate of 2%)
  const riskFreeRate = 2;
  const excessReturn = annualizedReturn - riskFreeRate / 100;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;
  
  // Calculate maximum drawdown
  let peak = investments[0]?.value || 0;
  let maxDrawdown = 0;
  
  investments.forEach(inv => {
    if (inv.value > peak) {
      peak = inv.value;
    } else {
      const drawdown = (peak - inv.value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  });
  
  return {
    totalReturn: totalReturn,
    annualizedReturn: annualizedReturn * 100,
    volatility: volatility,
    sharpeRatio: sharpeRatio,
    maxDrawdown: maxDrawdown * 100
  };
}

//Generate financial recommendations based on analysis
function generateRecommendations(financialData) {
  const recommendations = [];
  const { income, expenses, savings, debt, budgetPerformance } = financialData;
  
  // Savings recommendations
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;
  if (savingsRate < 10) {
    recommendations.push({
      category: 'Savings',
      priority: 'High',
      title: 'Increase Savings Rate',
      description: 'Your current savings rate is below the recommended 10-20%.',
      actionItems: [
        'Review and reduce non-essential expenses',
        'Set up automatic transfers to savings',
        'Consider increasing income through side activities'
      ]
    });
  }
  
  // Debt recommendations
  const debtToIncomeRatio = income > 0 ? (debt / income) * 100 : 0;
  if (debtToIncomeRatio > 40) {
    recommendations.push({
      category: 'Debt Management',
      priority: 'High',
      title: 'Reduce Debt Burden',
      description: 'Your debt-to-income ratio is above the recommended 40%.',
      actionItems: [
        'Create a debt payoff strategy (avalanche or snowball method)',
        'Consider debt consolidation options',
        'Avoid taking on additional debt'
      ]
    });
  }
  
  // Budget recommendations
  if (budgetPerformance && budgetPerformance.overBudgetCategories > 0) {
    recommendations.push({
      category: 'Budgeting',
      priority: 'Medium',
      title: 'Improve Budget Accuracy',
      description: `${budgetPerformance.overBudgetCategories} categories are over budget.`,
      actionItems: [
        'Review and adjust budget allocations',
        'Track spending more frequently',
        'Identify triggers for overspending'
      ]
    });
  }
  
  // Emergency fund recommendations
  const monthlyExpenses = expenses / 12;
  const emergencyFundMonths = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  if (emergencyFundMonths < 3) {
    recommendations.push({
      category: 'Emergency Fund',
      priority: 'High',
      title: 'Build Emergency Fund',
      description: 'You should have 3-6 months of expenses in emergency savings.',
      actionItems: [
        'Calculate exact emergency fund target',
        'Set up automatic savings specifically for emergencies',
        'Keep emergency funds in easily accessible accounts'
      ]
    });
  }
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

//Calculate goal progress and projections
function calculateGoalProgress(goal, currentAmount, monthlyContribution = 0) {
  const targetAmount = goal.targetAmount || 0;
  const targetDate = new Date(goal.targetDate);
  const today = new Date();
  const monthsRemaining = Math.max(0, (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth()));
  
  const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
  const amountRemaining = Math.max(0, targetAmount - currentAmount);
  const requiredMonthlyContribution = monthsRemaining > 0 ? amountRemaining / monthsRemaining : amountRemaining;
  
  const projectedAmount = currentAmount + (monthlyContribution * monthsRemaining);
  const projectedCompletion = monthlyContribution > 0 ? 
    Math.ceil(amountRemaining / monthlyContribution) : Infinity;
  
  return {
    currentAmount,
    targetAmount,
    progressPercentage: Math.min(100, progressPercentage),
    amountRemaining,
    monthsRemaining,
    requiredMonthlyContribution,
    currentMonthlyContribution: monthlyContribution,
    projectedAmount,
    projectedCompletion: projectedCompletion === Infinity ? 'Never at current rate' : `${projectedCompletion} months`,
    onTrack: monthlyContribution >= requiredMonthlyContribution,
    status: progressPercentage >= 100 ? 'Completed' : 
            progressPercentage >= 75 ? 'On Track' :
            progressPercentage >= 50 ? 'Behind' : 'Significantly Behind'
  };
}

module.exports = {
  formatDateByPeriod,
  getWeekNumber,
  calculateDateRange,
  formatCurrency,
  calculatePercentageChange,
  aggregateByPeriod,
  calculateTrends,
  generateInsights,
  getDateFormat,
  calculateCorrelation,
  groupByCategory,
  calculateMovingAverage,
  detectAnomalies,
  calculateSeasonality,
  generateForecast,
  generateLinearForecast,
  generateExponentialForecast,
  generateSeasonalForecast,
  calculateFinancialRatios,
  calculateFinancialHealthScore,
  calculateBudgetEfficiency,
  calculateEfficiencyRating,
  analyzeCashFlow,
  calculateInvestmentMetrics,
  generateRecommendations,
  calculateGoalProgress
};