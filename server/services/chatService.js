// chatService.js - Advanced Chat Service
const { CHAT_CONFIG, MODEL_SELECTION, SYSTEM_PROMPTS, initializeAIClients } = require('../config/chat.config');
const ChatAI = require('./chatAI');
const Redis = require('redis');
const EventEmitter = require('events');

class ChatService extends EventEmitter {
  constructor() {
    super();
    this.config = CHAT_CONFIG;
    this.aiClients = initializeAIClients();
    this.chatAI = new ChatAI(this.aiClients, this.config);
    this.cache = this.initializeCache();
    this.conversationMemory = new Map();
    this.activeChats = new Map();
    this.userPreferences = new Map();
    this.analytics = {
      totalChats: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
      errorRate: 0
    };
    
    this.initializeEventHandlers();
  }

  // Initialize Redis cache
  initializeCache() {
    if (process.env.REDIS_URL) {
      const client = Redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Redis retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });
      
      client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });
      
      return client;
    }
    return null;
  }

  // Initialize event handlers
  initializeEventHandlers() {
    this.on('chat_started', this.handleChatStarted.bind(this));
    this.on('chat_completed', this.handleChatCompleted.bind(this));
    this.on('error', this.handleError.bind(this));
    this.on('user_feedback', this.handleUserFeedback.bind(this));
  }

  // Main chat processing function
  async processChat(requestData, user) {
    const startTime = Date.now();
    const chatId = this.generateChatId(user.id);
    
    try {
      // Validate request
      const validationResult = this.validateChatRequest(requestData);
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      // Emit chat started event
      this.emit('chat_started', { chatId, user: user.id, timestamp: startTime });

      // Extract and prepare data
      const { message, conversationId, context, preferences } = requestData;
      const userContext = await this.buildUserContext(user, context);
      
      // Get conversation history
      const conversationHistory = await this.getConversationHistory(
        user.id, 
        conversationId || 'default'
      );

      // Update user preferences
      if (preferences) {
        await this.updateUserPreferences(user.id, preferences);
      }

      // Determine optimal AI model
      const selectedModel = await this.selectOptimalModel(message, userContext, conversationHistory);

      // Process with AI
      const aiResponse = await this.chatAI.processMessage({
        message,
        user: user.id,
        conversationId: conversationId || 'default',
        context: userContext,
        history: conversationHistory,
        model: selectedModel,
        preferences: this.getUserPreferences(user.id)
      });

      // Generate smart suggestions
      const suggestions = await this.generateSmartSuggestions(
        message,
        aiResponse,
        userContext
      );

      // Update conversation history
      await this.updateConversationHistory(
        user.id,
        conversationId || 'default',
        message,
        aiResponse.response
      );

      // Prepare response
      const response = {
        success: true,
        response: aiResponse.response,
        conversationId: conversationId || 'default',
        suggestions,
        metadata: {
          model: selectedModel.model,
          responseTime: Date.now() - startTime,
          functionCalls: aiResponse.functionCalls || [],
          confidence: aiResponse.confidence || 0.95,
          tokens: aiResponse.tokens || 0
        },
        followUp: aiResponse.followUp || null,
        timestamp: new Date()
      };

      // Emit completion event
      this.emit('chat_completed', {
        chatId,
        user: user.id,
        responseTime: Date.now() - startTime,
        success: true
      });

      // Update analytics
      this.updateAnalytics(Date.now() - startTime, true);

      return response;

    } catch (error) {
      console.error('Chat Processing Error:', error);
      
      // Emit error event
      this.emit('error', {
        chatId,
        user: user.id,
        error: error.message,
        timestamp: Date.now()
      });

      // Update analytics
      this.updateAnalytics(Date.now() - startTime, false);

      // Return error response
      return {
        success: false,
        error: error.message,
        conversationId: requestData.conversationId || 'default',
        suggestions: await this.getErrorRecoverySuggestions(error),
        timestamp: new Date()
      };
    }
  }

  // Smart suggestions generation
  async getSmartSuggestions(queryData, user) {
    try {
      const userContext = await this.buildUserContext(user);
      const cacheKey = `suggestions:${user.id}:${JSON.stringify(queryData)}`;

      // Check cache first
      if (this.cache) {
        const cached = await this.cache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Generate context-aware suggestions
      const suggestions = await this.generateContextualSuggestions(userContext, queryData);

      // Cache suggestions
      if (this.cache) {
        await this.cache.setex(cacheKey, 1800, JSON.stringify(suggestions)); // 30 minutes
      }

      return {
        success: true,
        suggestions,
        context: queryData.context || 'general',
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Smart Suggestions Error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: this.getDefaultSuggestions(),
        timestamp: new Date()
      };
    }
  }

  // Build comprehensive user context
  async buildUserContext(user, additionalContext = {}) {
    try {
      const context = {
        userId: user.id,
        userProfile: {
          name: user.name,
          email: user.email,
          tier: user.tier || 'free',
          timezone: user.timezone || 'UTC',
          language: user.language || 'en',
          currency: user.currency || 'USD'
        },
        preferences: this.getUserPreferences(user.id),
        ...additionalContext
      };

      // Add financial data context (if available)
      if (user.financialProfile) {
        context.financialProfile = user.financialProfile;
      }

      return context;

    } catch (error) {
      console.error('Context Building Error:', error);
      return { userId: user.id, error: 'Context unavailable' };
    }
  }

  // Select optimal AI model based on context
  async selectOptimalModel(message, userContext, conversationHistory) {
    try {
      // Analyze message complexity and requirements
      const analysis = await this.analyzeMessageRequirements(message, userContext);
      
      // Select model based on analysis
      if (analysis.requiresComplexAnalysis) {
        return MODEL_SELECTION.SPECIALIZED.complex_analysis;
      } else if (analysis.requiresFunctionCalling) {
        return MODEL_SELECTION.SPECIALIZED.function_calling;
      } else if (analysis.requiresQuickResponse) {
        return MODEL_SELECTION.SPECIALIZED.quick_responses;
      } else if (analysis.isFinancialPlanning) {
        return MODEL_SELECTION.SPECIALIZED.financial_planning;
      } else {
        return MODEL_SELECTION.PRIMARY;
      }

    } catch (error) {
      console.error('Model Selection Error:', error);
      return MODEL_SELECTION.PRIMARY;
    }
  }

  // Analyze message requirements
  async analyzeMessageRequirements(message, userContext) {
    const analysis = {
      requiresComplexAnalysis: false,
      requiresFunctionCalling: false,
      requiresQuickResponse: false,
      isFinancialPlanning: false,
      complexity: 'medium'
    };

    // Complex analysis keywords
    const complexKeywords = [
      'analyze', 'comparison', 'forecast', 'predict', 'trend', 'pattern',
      'optimization', 'strategy', 'portfolio', 'risk assessment'
    ];

    // Function calling keywords
    const functionKeywords = [
      'show me', 'get my', 'calculate', 'find', 'search', 'update',
      'create', 'delete', 'modify', 'transactions', 'goals', 'budget'
    ];

    // Quick response keywords
    const quickKeywords = [
      'what is', 'how much', 'when', 'quick', 'simple', 'brief'
    ];

    // Financial planning keywords
    const planningKeywords = [
      'retirement', 'investment', 'savings', 'goal', 'plan', 'budget',
      'debt', 'mortgage', 'insurance', 'taxes'
    ];

    const lowerMessage = message.toLowerCase();

    analysis.requiresComplexAnalysis = complexKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    analysis.requiresFunctionCalling = functionKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    analysis.requiresQuickResponse = quickKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    analysis.isFinancialPlanning = planningKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    // Determine complexity
    if (message.length > 200 || analysis.requiresComplexAnalysis) {
      analysis.complexity = 'high';
    } else if (message.length < 50 && analysis.requiresQuickResponse) {
      analysis.complexity = 'low';
    }

    return analysis;
  }

  // Generate contextual suggestions
  async generateContextualSuggestions(userContext, queryData) {
    const suggestions = [];
    const context = queryData.context || 'general';

    switch (context) {
      case 'dashboard':
        suggestions.push(
          "Show me my spending summary for this month",
          "What are my financial goals progress?",
          "Analyze my recent transaction patterns",
          "Give me budget recommendations"
        );
        break;

      case 'transactions':
        suggestions.push(
          "Categorize my recent expenses",
          "Find unusual spending patterns",
          "Show me my biggest expenses this month",
          "Compare my spending to last month"
        );
        break;

      case 'goals':
        suggestions.push(
          "How am I doing on my savings goals?",
          "Create a new financial goal",
          "Adjust my existing goals",
          "What's the best strategy to reach my goals?"
        );
        break;

      case 'budget':
        suggestions.push(
          "Create a personalized budget",
          "Review my budget performance",
          "Suggest ways to reduce expenses",
          "Optimize my spending allocation"
        );
        break;

      case 'investments':
        suggestions.push(
          "Analyze my investment portfolio",
          "Suggest investment strategies",
          "Review my risk tolerance",
          "Rebalance my portfolio"
        );
        break;

      default:
        suggestions.push(
          "How can I improve my financial health?",
          "What should I focus on this month?",
          "Help me create a budget",
          "Show me my spending trends"
        );
    }

    return suggestions;
  }

  // Generate smart suggestions based on message and response
  async generateSmartSuggestions(message, aiResponse, userContext) {
    const suggestions = [];

    // Analyze response to generate follow-up suggestions
    if (aiResponse.functionCalls && aiResponse.functionCalls.length > 0) {
      const functionCall = aiResponse.functionCalls[0];
      
      switch (functionCall.name) {
        case 'get_transaction_summary':
          suggestions.push(
            "Show me spending by category",
            "Analyze my spending trends",
            "Find ways to reduce expenses"
          );
          break;

        case 'get_goal_progress':
          suggestions.push(
            "Adjust my savings goals",
            "Create a new financial goal",
            "Optimize my goal timeline"
          );
          break;

        case 'get_spending_analysis':
          suggestions.push(
            "Create a budget based on this analysis",
            "Set spending limits for categories",
            "Get personalized saving tips"
          );
          break;
      }
    }

    // Add general helpful suggestions
    suggestions.push(
      "Get financial tips for this month",
      "Help me plan my next financial move",
      "Show me opportunities to save money"
    );

    return suggestions.slice(0, 4); // Return top 4 suggestions
  }

  // Conversation history management
  async getConversationHistory(userId, conversationId) {
    const key = `${userId}_${conversationId}`;
    
    if (this.conversationMemory.has(key)) {
      return this.conversationMemory.get(key);
    }

    // Try to load from cache
    if (this.cache) {
      const cached = await this.cache.get(`history:${key}`);
      if (cached) {
        const history = JSON.parse(cached);
        this.conversationMemory.set(key, history);
        return history;
      }
    }

    return [];
  }

  async updateConversationHistory(userId, conversationId, userMessage, aiResponse) {
    const key = `${userId}_${conversationId}`;
    const history = await this.getConversationHistory(userId, conversationId);
    
    // Add new messages
    history.push(
      { role: 'user', content: userMessage, timestamp: new Date() },
      { role: 'assistant', content: aiResponse, timestamp: new Date() }
    );

    // Keep only recent messages
    const maxLength = this.config.conversation.maxHistoryLength;
    if (history.length > maxLength) {
      history.splice(0, history.length - maxLength);
    }

    // Update memory
    this.conversationMemory.set(key, history);

    // Update cache
    if (this.cache) {
      await this.cache.setex(
        `history:${key}`,
        this.config.conversation.memoryRetentionHours * 3600,
        JSON.stringify(history)
      );
    }
  }

  // User preferences management
  getUserPreferences(userId) {
    return this.userPreferences.get(userId) || {
      responseStyle: 'detailed',
      showSuggestions: true,
      financialDisclaimer: true,
      language: 'en',
      timezone: 'UTC'
    };
  }

  async updateUserPreferences(userId, preferences) {
    const current = this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    
    this.userPreferences.set(userId, updated);

    // Persist to cache
    if (this.cache) {
      await this.cache.setex(
        `preferences:${userId}`,
        86400, // 24 hours
        JSON.stringify(updated)
      );
    }
  }

  // Utility methods
  generateChatId(userId) {
    return `chat_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateChatRequest(requestData) {
    if (!requestData.message) {
      return { valid: false, error: 'Message is required' };
    }

    if (requestData.message.length > 5000) {
      return { valid: false, error: 'Message too long' };
    }

    return { valid: true };
  }

  updateAnalytics(responseTime, success) {
    this.analytics.totalChats++;
    this.analytics.averageResponseTime = (
      (this.analytics.averageResponseTime * (this.analytics.totalChats - 1) + responseTime) / 
      this.analytics.totalChats
    );
    
    if (!success) {
      this.analytics.errorRate = (
        (this.analytics.errorRate * (this.analytics.totalChats - 1) + 1) / 
        this.analytics.totalChats
      );
    }
  }

  getDefaultSuggestions() {
    return [
      "How can I improve my financial health?",
      "Show me my spending summary",
      "Help me create a budget",
      "What are my financial goals?"
    ];
  }

  async getErrorRecoverySuggestions(error) {
    return [
      "Try asking a simpler question",
      "Check your financial data",
      "Contact support if the issue persists",
      "Refresh and try again"
    ];
  }

  // Event handlers
  handleChatStarted(data) {
    console.log(`Chat started: ${data.chatId} for user: ${data.user}`);
  }

  handleChatCompleted(data) {
    console.log(`Chat completed: ${data.chatId} in ${data.responseTime}ms`);
  }

  handleError(data) {
    console.error(`Chat error: ${data.chatId} - ${data.error}`);
  }

  handleUserFeedback(data) {
    console.log(`User feedback: ${data.chatId} - Rating: ${data.rating}`);
    // Update satisfaction analytics
    this.analytics.userSatisfaction = (
      (this.analytics.userSatisfaction * (this.analytics.totalChats - 1) + data.rating) / 
      this.analytics.totalChats
    );
  }

  // Health check
  getHealthStatus() {
    return {
      status: 'healthy',
      analytics: this.analytics,
      activeChats: this.activeChats.size,
      cacheStatus: this.cache ? 'connected' : 'disabled',
      timestamp: new Date()
    };
  }
}

module.exports = new ChatService();