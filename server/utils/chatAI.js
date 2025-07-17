// chatAI.js - Advanced AI Model Integration
const { SYSTEM_PROMPTS } = require('../config/chat.config');
const Transaction = require('../models/transactionModel');
const Goal = require('../models/goalModel');
const Reminder = require('../models/reminderModel');

class ChatAI {
  constructor(aiClients, config) {
    this.clients = aiClients;
    this.config = config;
    this.functionRegistry = this.initializeFunctionRegistry();
    this.conversationCache = new Map();
    this.modelHealth = new Map();
    this.requestQueue = [];
    this.processing = false;
    
    // Initialize model health monitoring
    this.initializeHealthMonitoring();
  }

  // Initialize function registry with enhanced financial functions
  initializeFunctionRegistry() {
    return {
      // Transaction analysis functions
      get_transaction_summary: this.getTransactionSummary.bind(this),
      get_spending_analysis: this.getSpendingAnalysis.bind(this),
      get_category_breakdown: this.getCategoryBreakdown.bind(this),
      get_transaction_trends: this.getTransactionTrends.bind(this),
      find_unusual_transactions: this.findUnusualTransactions.bind(this),
      
      // Goal management functions
      get_goal_progress: this.getGoalProgress.bind(this),
      create_financial_goal: this.createFinancialGoal.bind(this),
      update_goal_progress: this.updateGoalProgress.bind(this),
      get_goal_recommendations: this.getGoalRecommendations.bind(this),
      
      // Budget functions
      create_budget_plan: this.createBudgetPlan.bind(this),
      analyze_budget_performance: this.analyzeBudgetPerformance.bind(this),
      get_budget_recommendations: this.getBudgetRecommendations.bind(this),
      optimize_spending: this.optimizeSpending.bind(this),
      
      // Financial insights
      detect_financial_patterns: this.detectFinancialPatterns.bind(this),
      generate_financial_forecast: this.generateFinancialForecast.bind(this),
      analyze_financial_health: this.analyzeFinancialHealth.bind(this),
      get_investment_insights: this.getInvestmentInsights.bind(this),
      
      // Alerts and notifications
      create_spending_alert: this.createSpendingAlert.bind(this),
      get_financial_alerts: this.getFinancialAlerts.bind(this),
      update_alert_preferences: this.updateAlertPreferences.bind(this),
      
      // Utility functions
      calculate_savings_rate: this.calculateSavingsRate.bind(this),
      get_financial_ratios: this.getFinancialRatios.bind(this),
      generate_financial_report: this.generateFinancialReport.bind(this)
    };
  }

  // Initialize health monitoring for AI models
  initializeHealthMonitoring() {
    Object.keys(this.clients).forEach(provider => {
      this.modelHealth.set(provider, {
        status: 'healthy',
        responseTime: 0,
        errorRate: 0,
        lastChecked: Date.now(),
        requests: 0,
        errors: 0
      });
    });
  }

  // Main message processing function
  async processMessage(messageData) {
    const { message, user, conversationId, context, history, model, preferences } = messageData;
    
    try {
      // Build conversation context
      const conversationContext = this.buildConversationContext(history, context);
      
      // Select and prepare system prompt
      const systemPrompt = this.selectSystemPrompt(message, context, preferences);
      
      // Prepare function definitions
      const functions = this.prepareFunctionDefinitions();
      
      // Process with selected model
      const response = await this.processWithModel(model, {
        message,
        systemPrompt,
        conversationContext,
        functions,
        user,
        conversationId
      });
      
      // Update model health
      this.updateModelHealth(model.provider, response.responseTime, response.success);
      
      return response;
      
    } catch (error) {
      console.error('Message Processing Error:', error);
      
      // Try fallback models
      const fallbackResponse = await this.tryFallbackModels(messageData, error);
      return fallbackResponse || {
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        success: false,
        error: error.message
      };
    }
  }

  // Process with specific AI model
  async processWithModel(model, data) {
    const startTime = Date.now();
    
    try {
      let response;
      
      switch (model.provider) {
        case 'openai':
          response = await this.processWithOpenAI(model, data);
          break;
        case 'anthropic':
          response = await this.processWithAnthropic(model, data);
          break;
        case 'google':
          response = await this.processWithGoogle(model, data);
          break;
        default:
          throw new Error(`Unsupported model provider: ${model.provider}`);
      }
      
      return {
        ...response,
        responseTime: Date.now() - startTime,
        success: true,
        model: model.model
      };
      
    } catch (error) {
      return {
        response: null,
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime,
        model: model.model
      };
    }
  }

  // OpenAI processing
  async processWithOpenAI(model, data) {
    const { message, systemPrompt, conversationContext, functions } = data;
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationContext,
      { role: 'user', content: message }
    ];

    const completion = await this.clients.openai.chat.completions.create({
      model: model.model,
      messages,
      functions: functions.length > 0 ? functions : undefined,
      function_call: functions.length > 0 ? 'auto' : undefined,
      max_tokens: model.maxTokens,
      temperature: model.temperature,
      top_p: model.topP,
      frequency_penalty: model.frequencyPenalty,
      presence_penalty: model.presencePenalty
    });

    const choice = completion.choices[0];
    let response = choice.message.content;
    let functionCalls = [];

    // Handle function calls
    if (choice.message.function_call) {
      const functionResult = await this.executeFunctionCall(choice.message.function_call);
      functionCalls.push(functionResult);
      
      // Get follow-up response with function result
      const followUpMessages = [
        ...messages,
        choice.message,
        {
          role: 'function',
          name: choice.message.function_call.name,
          content: JSON.stringify(functionResult.result)
        }
      ];
      
      const followUpCompletion = await this.clients.openai.chat.completions.create({
        model: model.model,
        messages: followUpMessages,
        max_tokens: model.maxTokens,
        temperature: model.temperature
      });
      
      response = followUpCompletion.choices[0].message.content;
    }

    return {
      response,
      functionCalls,
      tokens: completion.usage.total_tokens,
      confidence: this.calculateConfidence(completion)
    };
  }

  // Anthropic processing
  async processWithAnthropic(model, data) {
    const { message, systemPrompt, conversationContext } = data;
    
    // Convert conversation context to Claude format
    const claudeMessages = conversationContext.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));
    
    claudeMessages.push({ role: 'user', content: message });

    const completion = await this.clients.anthropic.messages.create({
      model: model.model,
      max_tokens: model.maxTokens,
      temperature: model.temperature,
      top_p: model.topP,
      system: systemPrompt,
      messages: claudeMessages
    });

    // Handle function calls for Claude (if tools are available)
    let functionCalls = [];
    if (completion.content[0].type === 'tool_use') {
      const toolUse = completion.content[0];
      const functionResult = await this.executeFunctionCall({
        name: toolUse.name,
        arguments: JSON.stringify(toolUse.input)
      });
      functionCalls.push(functionResult);
    }

    return {
      response: completion.content[0].text || completion.content[0].content,
      functionCalls,
      tokens: completion.usage.output_tokens + completion.usage.input_tokens,
      confidence: 0.95 // Claude typically has high confidence
    };
  }

  // Google AI processing
  async processWithGoogle(model, data) {
    const { message, systemPrompt, conversationContext } = data;
    
    const geminiModel = this.clients.google.getGenerativeModel({ model: model.model });
    
    // Build conversation for Gemini
    const chat = geminiModel.startChat({
      history: conversationContext.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
    const response = await result.response;

    return {
      response: response.text(),
      functionCalls: [],
      tokens: response.usage?.totalTokens || 0,
      confidence: 0.85
    };
  }

  // Execute function calls
  async executeFunctionCall(functionCall) {
    const { name, arguments: args } = functionCall;
    
    try {
      const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
      const functionHandler = this.functionRegistry[name];
      
      if (!functionHandler) {
        throw new Error(`Function ${name} not found`);
      }
      
      const result = await functionHandler(parsedArgs);
      
      return {
        name,
        arguments: parsedArgs,
        result,
        success: true
      };
      
    } catch (error) {
      console.error(`Function execution error for ${name}:`, error);
      return {
        name,
        arguments: args,
        result: { error: error.message },
        success: false
      };
    }
  }

  // Function implementations
  async getTransactionSummary(args) {
    const { userId, startDate, endDate, limit = 10 } = args;
    
    const transactions = await Transaction.find({
      userId,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
    .sort({ date: -1 })
    .limit(limit);
    
    const summary = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      income: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      expenses: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
      transactions: transactions.slice(0, limit)
    };
    
    return summary;
  }

  async getSpendingAnalysis(args) {
    const { userId, period = 'month', categories } = args;
    
    const dateRange = this.calculateDateRange(period);
    const query = {
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end },
      amount: { $lt: 0 } // Only expenses
    };
    
    if (categories && categories.length > 0) {
      query.category = { $in: categories };
    }
    
    const transactions = await Transaction.find(query);
    
    const analysis = {
      totalSpent: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      averageTransaction: transactions.length > 0 ? 
        transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length : 0,
      transactionCount: transactions.length,
      topCategories: this.getTopCategories(transactions),
      dailyAverage: this.calculateDailyAverage(transactions, dateRange),
      trends: this.calculateSpendingTrends(transactions)
    };
    
    return analysis;
  }

  async getCategoryBreakdown(args) {
    const { userId, period = 'month' } = args;
    
    const dateRange = this.calculateDateRange(period);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    const categoryBreakdown = {};
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          total: 0,
          count: 0,
          income: 0,
          expenses: 0
        };
      }
      
      categoryBreakdown[category].total += transaction.amount;
      categoryBreakdown[category].count++;
      
      if (transaction.amount > 0) {
        categoryBreakdown[category].income += transaction.amount;
      } else {
        categoryBreakdown[category].expenses += Math.abs(transaction.amount);
      }
    });
    
    return categoryBreakdown;
  }

  async getTransactionTrends(args) {
    const { userId, period = 'month', groupBy = 'week' } = args;
    
    const dateRange = this.calculateDateRange(period);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    }).sort({ date: 1 });
    
    const trends = this.groupTransactionsByPeriod(transactions, groupBy);
    
    return {
      period,
      groupBy,
      trends,
      summary: {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        avgPerPeriod: trends.length > 0 ? 
          trends.reduce((sum, t) => sum + t.amount, 0) / trends.length : 0
      }
    };
  }

  async findUnusualTransactions(args) {
    const { userId, threshold = 2, period = 'month' } = args;
    
    const dateRange = this.calculateDateRange(period);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    // Calculate statistics for anomaly detection
    const amounts = transactions.map(t => Math.abs(t.amount));
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    const unusualTransactions = transactions.filter(transaction => {
      const amount = Math.abs(transaction.amount);
      return Math.abs(amount - mean) > threshold * stdDev;
    });
    
    return {
      unusual: unusualTransactions,
      statistics: { mean, stdDev, threshold },
      totalAnalyzed: transactions.length
    };
  }

  async getGoalProgress(args) {
    const { userId, goalId } = args;
    
    const query = { userId };
    if (goalId) query._id = goalId;
    
    const goals = await Goal.find(query);
    
    const progressData = goals.map(goal => ({
      id: goal._id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress: (goal.currentAmount / goal.targetAmount) * 100,
      daysRemaining: Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24)),
      status: goal.status,
      onTrack: this.isGoalOnTrack(goal)
    }));
    
    return { goals: progressData };
  }

  async createFinancialGoal(args) {
    const { userId, name, targetAmount, targetDate, category, description } = args;
    
    const goal = new Goal({
      userId,
      name,
      targetAmount,
      targetDate: new Date(targetDate),
      category,
      description,
      currentAmount: 0,
      status: 'active'
    });
    
    await goal.save();
    
    return {
      success: true,
      goal: {
        id: goal._id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate,
        category: goal.category
      }
    };
  }

  async updateGoalProgress(args) {
    const { goalId, amount, note } = args;
    
    const goal = await Goal.findById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    goal.currentAmount += amount;
    goal.lastUpdated = new Date();
    
    if (note) {
      goal.notes = goal.notes || [];
      goal.notes.push({
        date: new Date(),
        note,
        amount
      });
    }
    
    // Update status if goal is reached
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
      goal.completedDate = new Date();
    }
    
    await goal.save();
    
    return {
      success: true,
      goal: {
        id: goal._id,
        currentAmount: goal.currentAmount,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        status: goal.status
      }
    };
  }

  async getGoalRecommendations(args) {
    const { userId } = args;
    
    // Get user's transaction history for analysis
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(100);
    const goals = await Goal.find({ userId, status: 'active' });
    
    const recommendations = [];
    
    // Analyze spending patterns
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    const savingsRate = (monthlyIncome - monthlyExpenses) / monthlyIncome;
    
    // Generate recommendations based on analysis
    if (savingsRate < 0.1) {
      recommendations.push({
        type: 'savings_rate',
        priority: 'high',
        title: 'Increase Your Savings Rate',
        description: 'Consider increasing your savings rate to at least 10% of income',
        action: 'Review expenses and identify areas to cut back'
      });
    }
    
    if (goals.length === 0) {
      recommendations.push({
        type: 'emergency_fund',
        priority: 'high',
        title: 'Create an Emergency Fund',
        description: 'Build an emergency fund covering 3-6 months of expenses',
        action: 'Set up automatic transfers to a high-yield savings account'
      });
    }
    
    return { recommendations };
  }

  // Budget management functions
  async createBudgetPlan(args) {
    const { userId, categories, totalIncome, period = 'monthly' } = args;
    
    const budgetPlan = {
      userId,
      period,
      totalIncome,
      categories: categories.map(cat => ({
        name: cat.name,
        allocated: cat.allocated,
        spent: 0,
        remaining: cat.allocated,
        percentage: (cat.allocated / totalIncome) * 100
      })),
      createdDate: new Date(),
      status: 'active'
    };
    
    return {
      success: true,
      budget: budgetPlan
    };
  }

  async analyzeBudgetPerformance(args) {
    const { userId, period = 'current' } = args;
    
    // Get current spending data
    const dateRange = this.calculateDateRange('month');
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    const categorySpending = this.getCategorySpending(transactions);
    
    // Mock budget data (in real implementation, fetch from Budget model)
    const budgetCategories = {
      'Food': 500,
      'Transportation': 200,
      'Entertainment': 150,
      'Utilities': 100,
      'Shopping': 300
    };
    
    const performance = Object.keys(budgetCategories).map(category => {
      const spent = categorySpending[category] || 0;
      const allocated = budgetCategories[category];
      const remaining = allocated - spent;
      const percentage = (spent / allocated) * 100;
      
      return {
        category,
        allocated,
        spent,
        remaining,
        percentage,
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    });
    
    return {
      period,
      performance,
      summary: {
        totalAllocated: Object.values(budgetCategories).reduce((sum, amt) => sum + amt, 0),
        totalSpent: Object.values(categorySpending).reduce((sum, amt) => sum + amt, 0),
        overBudgetCategories: performance.filter(p => p.status === 'over').length
      }
    };
  }

  async getBudgetRecommendations(args) {
    const { userId } = args;
    
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(100);
    const categorySpending = this.getCategorySpending(transactions);
    
    const recommendations = [];
    
    // Analyze spending patterns
    Object.entries(categorySpending).forEach(([category, amount]) => {
      if (amount > 500) {
        recommendations.push({
          type: 'reduce_spending',
          category,
          priority: 'medium',
          title: `Reduce ${category} spending`,
          description: `You've spent $${amount} on ${category} this month`,
          action: 'Review and optimize your spending in this category'
        });
      }
    });
    
    return { recommendations };
  }

  async optimizeSpending(args) {
    const { userId, targetReduction = 10 } = args;
    
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(100);
    const categorySpending = this.getCategorySpending(transactions);
    
    // Find optimization opportunities
    const optimizations = [];
    
    Object.entries(categorySpending).forEach(([category, amount]) => {
      const potentialSavings = amount * (targetReduction / 100);
      if (potentialSavings > 20) {
        optimizations.push({
          category,
          currentSpending: amount,
          targetReduction: targetReduction,
          potentialSavings: potentialSavings,
          suggestions: this.getSpendingOptimizationSuggestions(category)
        });
      }
    });
    
    return {
      optimizations,
      totalPotentialSavings: optimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0)
    };
  }

  // Financial insights functions
  async detectFinancialPatterns(args) {
    const { userId, period = 'month' } = args;
    
    const dateRange = this.calculateDateRange(period);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    const patterns = {
      recurringTransactions: this.findRecurringTransactions(transactions),
      seasonalSpending: this.detectSeasonalSpending(transactions),
      spendingHabits: this.analyzeSpendingHabits(transactions),
      incomePatterns: this.analyzeIncomePatterns(transactions)
    };
    
    return patterns;
  }

  async generateFinancialForecast(args) {
    const { userId, period = 'month', forecastMonths = 3 } = args;
    
    const dateRange = this.calculateDateRange(period);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    const forecast = {
      projectedIncome: this.projectIncome(transactions, forecastMonths),
      projectedExpenses: this.projectExpenses(transactions, forecastMonths),
      projectedSavings: 0,
      assumptions: [
        'Based on historical spending patterns',
        'Does not account for seasonal variations',
        'Assumes current income trends continue'
      ]
    };
    
    forecast.projectedSavings = forecast.projectedIncome - forecast.projectedExpenses;
    
    return forecast;
  }

  async analyzeFinancialHealth(args) {
    const { userId } = args;
    
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(100);
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    
    const healthMetrics = {
      savingsRate: (monthlyIncome - monthlyExpenses) / monthlyIncome,
      debtToIncomeRatio: 0, // Would need debt data
      expenseRatio: monthlyExpenses / monthlyIncome,
      emergencyFundRatio: 0, // Would need savings data
      score: 0
    };
    
    // Calculate overall health score
    let score = 0;
    if (healthMetrics.savingsRate > 0.2) score += 25;
    else if (healthMetrics.savingsRate > 0.1) score += 15;
    else if (healthMetrics.savingsRate > 0.05) score += 10;
    
    if (healthMetrics.expenseRatio < 0.8) score += 25;
    else if (healthMetrics.expenseRatio < 0.9) score += 15;
    else if (healthMetrics.expenseRatio < 0.95) score += 10;
    
    healthMetrics.score = score;
    
    return {
      metrics: healthMetrics,
      recommendations: this.getHealthRecommendations(healthMetrics)
    };
  }

  async getInvestmentInsights(args) {
    const { userId } = args;
    
    // Mock investment data (in real implementation, fetch from Investment model)
    const insights = {
      portfolioValue: 50000,
      monthlyReturn: 2.5,
      riskLevel: 'moderate',
      diversificationScore: 75,
      recommendations: [
        {
          type: 'rebalancing',
          priority: 'medium',
          description: 'Consider rebalancing your portfolio to maintain target allocation'
        },
        {
          type: 'diversification',
          priority: 'low',
          description: 'Your portfolio is well-diversified'
        }
      ]
    };
    
    return insights;
  }

  // Alert functions
  async createSpendingAlert(args) {
    const { userId, category, threshold, period = 'monthly' } = args;
    
    const alert = {
      userId,
      type: 'spending_threshold',
      category,
      threshold,
      period,
      active: true,
      createdDate: new Date()
    };
    
    return {
      success: true,
      alert
    };
  }

  async getFinancialAlerts(args) {
    const { userId } = args;
    
    // Mock alerts (in real implementation, fetch from Alert model)
    const alerts = [
      {
        id: '1',
        type: 'spending_threshold',
        category: 'Food',
        message: 'You\'ve exceeded your monthly food budget by $50',
        priority: 'high',
        date: new Date()
      },
      {
        id: '2',
        type: 'goal_reminder',
        message: 'You\'re behind on your vacation savings goal',
        priority: 'medium',
        date: new Date()
      }
    ];
    
    return { alerts };
  }

  async updateAlertPreferences(args) {
    const { userId, preferences } = args;
    
    return {
      success: true,
      preferences: {
        emailNotifications: preferences.emailNotifications || true,
        pushNotifications: preferences.pushNotifications || true,
        weeklyReports: preferences.weeklyReports || true,
        budgetAlerts: preferences.budgetAlerts || true
      }
    };
  }

  // Utility functions
  async calculateSavingsRate(args) {
    const { userId, period = 'month' } = args;
    
    const dateRange = this.calculateDateRange(period);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    
    return {
      income,
      expenses,
      savings,
      savingsRate,
      period
    };
  }

  async getFinancialRatios(args) {
    const { userId } = args;
    
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(100);
    const monthlyIncome = this.calculateMonthlyIncome(transactions);
    const monthlyExpenses = this.calculateMonthlyExpenses(transactions);
    
    const ratios = {
      expenseRatio: monthlyExpenses / monthlyIncome,
      savingsRate: (monthlyIncome - monthlyExpenses) / monthlyIncome,
      housingRatio: 0, // Would need housing expense data
      transportationRatio: 0, // Would need transportation expense data
      discretionaryRatio: 0 // Would need discretionary expense data
    };
    
    return ratios;
  }

  async generateFinancialReport(args) {
    const { userId, period = 'month' } = args;
    
    const dateRange = this.calculateDateRange(period);
    const transactions = await Transaction.find({
      userId,
      date: { $gte: dateRange.start, $lte: dateRange.end }
    });

    const goals = await Goal.find({ userId });
    
    const report = {
      period,
      dateRange,
      summary: {
        totalIncome: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0),
        netCashFlow: 0,
        transactionCount: transactions.length
      },
      categoryBreakdown: this.getCategoryBreakdown(transactions),
      topExpenses: this.getTopExpenses(transactions, 5),
      goalProgress: goals.map(goal => ({
        name: goal.name,
        progress: (goal.currentAmount / goal.targetAmount) * 100,
        status: goal.status
      })),
      insights: this.generateFinancialInsights(transactions),
      recommendations: this.generateReportRecommendations(transactions)
    };

    report.summary.netCashFlow = report.summary.totalIncome - report.summary.totalExpenses;
    
    return report;
  }

  // Helper methods for data processing
  calculateDateRange(period) {
    const now = new Date();
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getFullYear(), now.getMonth(), 1),
      quarter: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1),
      year: new Date(now.getFullYear(), 0, 1)
    };

    return {
      start: ranges[period] || ranges.month,
      end: now
    };
  }

  calculateMonthlyIncome(transactions) {
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    });

    return monthlyTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  calculateMonthlyExpenses(transactions) {
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      const now = new Date();
      return transactionDate.getMonth() === now.getMonth() && 
             transactionDate.getFullYear() === now.getFullYear();
    });

    return monthlyTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  getCategorySpending(transactions) {
    const spending = {};
    transactions.filter(t => t.amount < 0).forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      spending[category] = (spending[category] || 0) + Math.abs(transaction.amount);
    });
    return spending;
  }

  getTopCategories(transactions, limit = 5) {
    const categoryTotals = {};
    transactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(transaction.amount);
    });

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([category, amount]) => ({ category, amount }));
  }

  getTopExpenses(transactions, limit = 5) {
    return transactions
      .filter(t => t.amount < 0)
      .sort((a, b) => a.amount - b.amount)
      .slice(0, limit)
      .map(t => ({
        description: t.description,
        amount: Math.abs(t.amount),
        category: t.category,
        date: t.date
      }));
  }

  calculateDailyAverage(transactions, dateRange) {
    const days = Math.ceil((dateRange.end - dateRange.start) / (1000 * 60 * 60 * 24));
    const totalAmount = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return totalAmount / days;
  }

  calculateSpendingTrends(transactions) {
    const sortedTransactions = transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
    const trends = [];
    
    let weeklySpending = 0;
    let weekStart = null;
    
    sortedTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const weekOfYear = this.getWeekOfYear(transactionDate);
      
      if (!weekStart || weekOfYear !== this.getWeekOfYear(weekStart)) {
        if (weekStart) {
          trends.push({
            period: weekStart.toISOString().split('T')[0],
            amount: weeklySpending
          });
        }
        weekStart = transactionDate;
        weeklySpending = 0;
      }
      
      weeklySpending += Math.abs(transaction.amount);
    });
    
    if (weekStart) {
      trends.push({
        period: weekStart.toISOString().split('T')[0],
        amount: weeklySpending
      });
    }
    
    return trends;
  }

  getWeekOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diff / oneWeek);
  }

  groupTransactionsByPeriod(transactions, groupBy) {
    const grouped = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key;
      
      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          amount: 0,
          count: 0,
          transactions: []
        };
      }
      
      grouped[key].amount += transaction.amount;
      grouped[key].count++;
      grouped[key].transactions.push(transaction);
    });
    
    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  }

  isGoalOnTrack(goal) {
    const now = new Date();
    const targetDate = new Date(goal.targetDate);
    const totalDays = Math.ceil((targetDate - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24));
    const expectedProgress = (daysPassed / totalDays) * 100;
    const actualProgress = (goal.currentAmount / goal.targetAmount) * 100;
    
    return actualProgress >= expectedProgress * 0.9; // 10% tolerance
  }

  getSpendingOptimizationSuggestions(category) {
    const suggestions = {
      'Food': [
        'Cook meals at home more often',
        'Use grocery store loyalty programs',
        'Buy generic brands',
        'Plan meals in advance'
      ],
      'Entertainment': [
        'Look for free local events',
        'Use streaming services instead of cable',
        'Take advantage of happy hour deals',
        'Find group discounts'
      ],
      'Transportation': [
        'Use public transportation',
        'Carpool or rideshare',
        'Walk or bike for short distances',
        'Combine errands into one trip'
      ],
      'Shopping': [
        'Wait 24 hours before non-essential purchases',
        'Use cashback apps and coupons',
        'Buy during sales and clearances',
        'Consider buying used items'
      ],
      'Utilities': [
        'Adjust thermostat settings',
        'Use energy-efficient appliances',
        'Unplug devices when not in use',
        'Consider solar panels or green energy'
      ]
    };
    
    return suggestions[category] || [
      'Review and eliminate unnecessary subscriptions',
      'Compare prices before making purchases',
      'Set spending limits for this category',
      'Look for alternative lower-cost options'
    ];
  }

  findRecurringTransactions(transactions) {
    const recurring = [];
    const transactionGroups = {};
    
    transactions.forEach(transaction => {
      const key = `${transaction.description}_${Math.abs(transaction.amount)}`;
      if (!transactionGroups[key]) {
        transactionGroups[key] = [];
      }
      transactionGroups[key].push(transaction);
    });
    
    Object.entries(transactionGroups).forEach(([key, group]) => {
      if (group.length >= 3) {
        const dates = group.map(t => new Date(t.date)).sort((a, b) => a - b);
        const intervals = [];
        
        for (let i = 1; i < dates.length; i++) {
          const interval = Math.ceil((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
          intervals.push(interval);
        }
        
        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
        
        if (avgInterval >= 28 && avgInterval <= 32) { // Monthly
          recurring.push({
            description: group[0].description,
            amount: group[0].amount,
            frequency: 'Monthly',
            avgInterval: Math.round(avgInterval),
            occurrences: group.length
          });
        } else if (avgInterval >= 6 && avgInterval <= 8) { // Weekly
          recurring.push({
            description: group[0].description,
            amount: group[0].amount,
            frequency: 'Weekly',
            avgInterval: Math.round(avgInterval),
            occurrences: group.length
          });
        }
      }
    });
    
    return recurring;
  }

  detectSeasonalSpending(transactions) {
    const seasonalData = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = date.getMonth();
      const season = this.getSeason(month);
      
      if (!seasonalData[season]) {
        seasonalData[season] = {
          totalSpending: 0,
          avgTransaction: 0,
          transactionCount: 0
        };
      }
      
      seasonalData[season].totalSpending += Math.abs(transaction.amount);
      seasonalData[season].transactionCount++;
    });
    
    Object.keys(seasonalData).forEach(season => {
      seasonalData[season].avgTransaction = 
        seasonalData[season].totalSpending / seasonalData[season].transactionCount;
    });
    
    return seasonalData;
  }

  getSeason(month) {
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  analyzeSpendingHabits(transactions) {
    const habits = {
      mostActiveDay: null,
      mostActiveHour: null,
      avgTransactionSize: 0,
      impulseSpending: 0,
      plannedSpending: 0
    };
    
    const dayFrequency = {};
    const hourFrequency = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const day = date.getDay();
      const hour = date.getHours();
      
      dayFrequency[day] = (dayFrequency[day] || 0) + 1;
      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
    });
    
    habits.mostActiveDay = Object.entries(dayFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    habits.mostActiveHour = Object.entries(hourFrequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    habits.avgTransactionSize = transactions.length > 0 ? 
      transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length : 0;
    
    return habits;
  }

  analyzeIncomePatterns(transactions) {
    const incomeTransactions = transactions.filter(t => t.amount > 0);
    
    const patterns = {
      totalIncome: incomeTransactions.reduce((sum, t) => sum + t.amount, 0),
      avgIncome: incomeTransactions.length > 0 ? 
        incomeTransactions.reduce((sum, t) => sum + t.amount, 0) / incomeTransactions.length : 0,
      incomeFrequency: incomeTransactions.length,
      mainSources: this.getMainIncomeSources(incomeTransactions),
      stability: this.calculateIncomeStability(incomeTransactions)
    };
    
    return patterns;
  }

  getMainIncomeSources(incomeTransactions) {
    const sources = {};
    
    incomeTransactions.forEach(transaction => {
      const description = transaction.description || 'Unknown';
      sources[description] = (sources[description] || 0) + transaction.amount;
    });
    
    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source, amount]) => ({ source, amount }));
  }

  calculateIncomeStability(incomeTransactions) {
    if (incomeTransactions.length < 2) return 0;
    
    const amounts = incomeTransactions.map(t => t.amount);
    const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    return Math.max(0, 1 - coefficientOfVariation); // Higher value = more stable
  }

  projectIncome(transactions, months) {
    const incomeTransactions = transactions.filter(t => t.amount > 0);
    const monthlyIncome = this.calculateMonthlyIncome(incomeTransactions);
    return monthlyIncome * months;
  }

  projectExpenses(transactions, months) {
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const monthlyExpenses = this.calculateMonthlyExpenses(expenseTransactions);
    return monthlyExpenses * months;
  }

  getHealthRecommendations(healthMetrics) {
    const recommendations = [];
    
    if (healthMetrics.savingsRate < 0.1) {
      recommendations.push({
        type: 'savings',
        priority: 'high',
        title: 'Increase Savings Rate',
        description: 'Aim to save at least 10% of your income'
      });
    }
    
    if (healthMetrics.expenseRatio > 0.9) {
      recommendations.push({
        type: 'expenses',
        priority: 'high',
        title: 'Reduce Expenses',
        description: 'Your expenses are too high relative to income'
      });
    }
    
    return recommendations;
  }

  generateFinancialInsights(transactions) {
    const insights = [];
    
    const currentMonthSpending = this.calculateMonthlyExpenses(transactions);
    const previousMonthSpending = this.calculatePreviousMonthExpenses(transactions);
    
    if (currentMonthSpending > previousMonthSpending * 1.1) {
      insights.push({
        type: 'spending_increase',
        message: `Your spending increased by ${Math.round(((currentMonthSpending - previousMonthSpending) / previousMonthSpending) * 100)}% this month`,
        severity: 'warning'
      });
    }
    
    const topCategory = this.getTopCategories(transactions, 1)[0];
    if (topCategory) {
      insights.push({
        type: 'top_category',
        message: `Your highest spending category is ${topCategory.category} at $${topCategory.amount.toFixed(2)}`,
        severity: 'info'
      });
    }
    
    return insights;
  }

  calculatePreviousMonthExpenses(transactions) {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return transactions
      .filter(t => {
        const date = new Date(t.date);
        return date >= previousMonth && date <= previousMonthEnd && t.amount < 0;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  generateReportRecommendations(transactions) {
    const recommendations = [];
    const categorySpending = this.getCategorySpending(transactions);
    
    // Find categories with high spending
    Object.entries(categorySpending).forEach(([category, amount]) => {
      if (amount > 500) {
        recommendations.push({
          type: 'category_optimization',
          category,
          message: `Consider reviewing your ${category} expenses ($${amount.toFixed(2)})`
        });
      }
    });
    
    return recommendations;
  }

  // System prompt selection
  selectSystemPrompt(message, context, preferences) {
    const messageType = this.classifyMessage(message);
    
    switch (messageType) {
      case 'transaction_analysis':
        return SYSTEM_PROMPTS.TRANSACTION_ANALYSIS;
      case 'goal_management':
        return SYSTEM_PROMPTS.GOAL_MANAGEMENT;
      case 'budget_planning':
        return SYSTEM_PROMPTS.BUDGET_PLANNING;
      case 'investment_advice':
        return SYSTEM_PROMPTS.INVESTMENT_ADVICE;
      case 'general_financial':
        return SYSTEM_PROMPTS.GENERAL_FINANCIAL;
      default:
        return SYSTEM_PROMPTS.DEFAULT;
    }
  }

  classifyMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('transaction') || lowerMessage.includes('spending') || lowerMessage.includes('expense')) {
      return 'transaction_analysis';
    } else if (lowerMessage.includes('goal') || lowerMessage.includes('save') || lowerMessage.includes('target')) {
      return 'goal_management';
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('plan') || lowerMessage.includes('allocate')) {
      return 'budget_planning';
    } else if (lowerMessage.includes('invest') || lowerMessage.includes('portfolio') || lowerMessage.includes('stock')) {
      return 'investment_advice';
    } else if (lowerMessage.includes('money') || lowerMessage.includes('financial') || lowerMessage.includes('finance')) {
      return 'general_financial';
    }
    
    return 'general';
  }

  // Function definitions for AI models
  prepareFunctionDefinitions() {
    return Object.keys(this.functionRegistry).map(funcName => ({
      name: funcName,
      description: this.getFunctionDescription(funcName),
      parameters: this.getFunctionParameters(funcName)
    }));
  }

  getFunctionDescription(funcName) {
    const descriptions = {
      get_transaction_summary: 'Get a summary of transactions for a specific period',
      get_spending_analysis: 'Analyze spending patterns and trends',
      get_category_breakdown: 'Get spending breakdown by category',
      get_transaction_trends: 'Analyze transaction trends over time',
      find_unusual_transactions: 'Find transactions that are unusual or anomalous',
      get_goal_progress: 'Get progress information for financial goals',
      create_financial_goal: 'Create a new financial goal',
      update_goal_progress: 'Update progress on an existing goal',
      get_goal_recommendations: 'Get recommendations for financial goals',
      create_budget_plan: 'Create a new budget plan',
      analyze_budget_performance: 'Analyze budget performance and adherence',
      get_budget_recommendations: 'Get budget optimization recommendations',
      optimize_spending: 'Get spending optimization suggestions',
      detect_financial_patterns: 'Detect patterns in financial behavior',
      generate_financial_forecast: 'Generate financial forecasts and projections',
      analyze_financial_health: 'Analyze overall financial health',
      get_investment_insights: 'Get investment analysis and insights',
      create_spending_alert: 'Create a new spending alert',
      get_financial_alerts: 'Get active financial alerts',
      update_alert_preferences: 'Update alert preferences',
      calculate_savings_rate: 'Calculate savings rate for a period',
      get_financial_ratios: 'Get important financial ratios',
      generate_financial_report: 'Generate comprehensive financial report'
    };
    
    return descriptions[funcName] || 'Financial function';
  }

  getFunctionParameters(funcName) {
    const parameterSchemas = {
      get_transaction_summary: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          limit: { type: 'number', default: 10 }
        },
        required: ['userId', 'startDate', 'endDate']
      },
      get_spending_analysis: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          period: { type: 'string', enum: ['week', 'month', 'quarter', 'year'] },
          categories: { type: 'array', items: { type: 'string' } }
        },
        required: ['userId']
      },
      create_financial_goal: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          name: { type: 'string' },
          targetAmount: { type: 'number' },
          targetDate: { type: 'string' },
          category: { type: 'string' },
          description: { type: 'string' }
        },
        required: ['userId', 'name', 'targetAmount', 'targetDate']
      }
    };
    
    return parameterSchemas[funcName] || {
      type: 'object',
      properties: {
        userId: { type: 'string' }
      },
      required: ['userId']
    };
  }

  // Build conversation context
  buildConversationContext(history, context) {
    const conversationContext = [];
    
    // Add relevant context information
    if (context.financialProfile) {
      conversationContext.push({
        role: 'system',
        content: `User's financial profile: ${JSON.stringify(context.financialProfile)}`
      });
    }
    
    // Add conversation history
    if (history && history.length > 0) {
      conversationContext.push(...history.slice(-10)); // Keep last 10 messages
    }
    
    return conversationContext;
  }

  // Fallback model handling
  async tryFallbackModels(messageData, originalError) {
    const fallbackModels = [
      { provider: 'anthropic', model: 'claude-3-sonnet-20240229' },
      { provider: 'openai', model: 'gpt-3.5-turbo' },
      { provider: 'google', model: 'gemini-pro' }
    ];
    
    for (const model of fallbackModels) {
      try {
        console.log(`Trying fallback model: ${model.provider}/${model.model}`);
        const response = await this.processWithModel(model, messageData);
        if (response.success) {
          return response;
        }
      } catch (error) {
        console.error(`Fallback model ${model.provider}/${model.model} failed:`, error);
      }
    }
    
    return null;
  }

  // Model health monitoring
  updateModelHealth(provider, responseTime, success) {
    const health = this.modelHealth.get(provider);
    if (health) {
      health.requests++;
      health.responseTime = (health.responseTime + responseTime) / 2;
      health.lastChecked = Date.now();
      
      if (!success) {
        health.errors++;
        health.errorRate = health.errors / health.requests;
      }
      
      health.status = health.errorRate > 0.1 ? 'degraded' : 'healthy';
      this.modelHealth.set(provider, health);
    }
  }

  // Confidence calculation
  calculateConfidence(completion) {
    // Simple confidence calculation based on response characteristics
    let confidence = 0.8; // Base confidence
    
    if (completion.usage && completion.usage.total_tokens) {
      const tokenRatio = completion.usage.completion_tokens / completion.usage.total_tokens;
      confidence += tokenRatio * 0.1; // Higher completion ratio = higher confidence
    }
    
    if (completion.choices && completion.choices[0].finish_reason === 'stop') {
      confidence += 0.1; // Natural completion
    }
    
    return Math.min(confidence, 1.0);
  }

  // Get model health status
  getModelHealth() {
    const healthStatus = {};
    this.modelHealth.forEach((health, provider) => {
      healthStatus[provider] = {
        ...health,
        uptime: Date.now() - health.lastChecked < 60000 ? 'up' : 'down'
      };
    });
    return healthStatus;
  }
}

module.exports = ChatAI;