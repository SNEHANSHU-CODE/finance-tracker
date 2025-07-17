// chat.config.js - Advanced AI Configuration
const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

// Multi-model configuration for maximum capability
const AI_MODELS = {
  // OpenAI GPT-4 Turbo (Latest)
  OPENAI_GPT4_TURBO: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    maxTokens: 4096,
    temperature: 0.3,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    capabilities: ['chat', 'analysis', 'functions', 'reasoning']
  },
  
  // OpenAI GPT-4 (Most reliable)
  OPENAI_GPT4: {
    provider: 'openai',
    model: 'gpt-4',
    maxTokens: 8192,
    temperature: 0.2,
    topP: 0.95,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    capabilities: ['chat', 'analysis', 'functions', 'complex_reasoning']
  },

  // Claude 3 Opus (Best for complex analysis)
  CLAUDE_OPUS: {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    maxTokens: 4096,
    temperature: 0.3,
    topP: 0.9,
    capabilities: ['chat', 'analysis', 'reasoning', 'financial_expertise']
  },

  // Claude 3 Sonnet (Balanced performance)
  CLAUDE_SONNET: {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    maxTokens: 4096,
    temperature: 0.4,
    topP: 0.9,
    capabilities: ['chat', 'analysis', 'speed']
  },

  // Gemini Pro (Google's latest)
  GEMINI_PRO: {
    provider: 'google',
    model: 'gemini-pro',
    maxTokens: 2048,
    temperature: 0.4,
    topP: 0.8,
    capabilities: ['chat', 'analysis', 'multimodal']
  }
};

// Model selection strategy
const MODEL_SELECTION = {
  // Primary model for general chat
  PRIMARY: AI_MODELS.OPENAI_GPT4_TURBO,
  
  // Fallback models in order of preference
  FALLBACKS: [
    AI_MODELS.CLAUDE_OPUS,
    AI_MODELS.OPENAI_GPT4,
    AI_MODELS.CLAUDE_SONNET
  ],
  
  // Specialized models for specific tasks
  SPECIALIZED: {
    complex_analysis: AI_MODELS.CLAUDE_OPUS,
    quick_responses: AI_MODELS.CLAUDE_SONNET,
    function_calling: AI_MODELS.OPENAI_GPT4_TURBO,
    financial_planning: AI_MODELS.CLAUDE_OPUS,
    anomaly_detection: AI_MODELS.OPENAI_GPT4,
    forecasting: AI_MODELS.CLAUDE_OPUS
  }
};

// Advanced configuration
const CHAT_CONFIG = {
  // Model configuration
  models: AI_MODELS,
  modelSelection: MODEL_SELECTION,
  
  // Conversation settings
  conversation: {
    maxHistoryLength: 20,
    contextWindowSize: 32000,
    summaryThreshold: 15, // Summarize after 15 messages
    memoryRetentionHours: 24,
    maxConcurrentChats: 5
  },
  
  // Response configuration
  response: {
    maxResponseTime: 30000, // 30 seconds
    streamingEnabled: true,
    typingIndicator: true,
    smartSuggestions: true,
    emotionalTone: 'professional_friendly'
  },
  
  // Function calling configuration
  functions: {
    enabled: true,
    maxConcurrentCalls: 3,
    timeoutMs: 15000,
    retryAttempts: 2,
    parallelExecution: true
  },
  
  // Safety and moderation
  safety: {
    contentFiltering: true,
    toxicityThreshold: 0.8,
    piThreshold: 0.7, // Personal information detection
    financialAdviceDisclaimer: true,
    riskAssessment: true
  },
  
  // Performance optimization
  performance: {
    caching: {
      enabled: true,
      ttl: 3600, // 1 hour
      maxSize: 1000
    },
    compression: true,
    batchProcessing: true,
    loadBalancing: true
  },
  
  // Analytics and monitoring
  analytics: {
    enabled: true,
    trackUsage: true,
    trackPerformance: true,
    trackSatisfaction: true,
    trackErrors: true
  },
  
  // Rate limiting
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
      message: 'Too many requests, please try again later.'
    },
    ai: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // AI requests per minute
      message: 'AI request limit exceeded. Please wait a moment.'
    },
    premium: {
      windowMs: 60 * 1000,
      max: 50, // Premium users get more requests
      message: 'Premium rate limit exceeded.'
    }
  }
};

// AI Provider clients initialization
const initializeAIClients = () => {
  const clients = {};
  
  // OpenAI client
  if (process.env.OPENAI_API_KEY) {
    clients.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
      project: process.env.OPENAI_PROJECT_ID,
      timeout: 30000,
      maxRetries: 2
    });
  }
  
  // Anthropic client
  if (process.env.ANTHROPIC_API_KEY) {
    clients.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      timeout: 30000,
      maxRetries: 2
    });
  }
  
  // Google AI client (if available)
  if (process.env.GOOGLE_AI_API_KEY) {
    // Initialize Google AI client
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    clients.google = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  }
  
  return clients;
};

// System prompts for different scenarios
const SYSTEM_PROMPTS = {
  FINANCIAL_EXPERT: `You are FinanceGPT, an expert AI financial advisor with deep expertise in:
- Personal finance management and budgeting
- Investment strategies and portfolio optimization
- Tax planning and optimization
- Retirement planning and wealth building
- Risk management and insurance
- Market analysis and economic trends
- Financial goal setting and achievement
- Debt management and credit optimization

You have access to the user's complete financial profile including:
- Transaction history and spending patterns
- Financial goals and progress tracking
- Investment portfolios and performance
- Budget allocations and savings rates
- Credit scores and debt obligations
- Insurance coverage and risk profile

Guidelines:
1. Always provide personalized, actionable advice based on real user data
2. Explain complex financial concepts in simple, accessible language
3. Prioritize user's financial security and long-term wellbeing
4. Suggest realistic and achievable financial strategies
5. Alert users to potential risks and opportunities
6. Maintain strict confidentiality and data security
7. Provide multiple options and explain trade-offs
8. Use data-driven insights to support recommendations
9. Encourage healthy financial habits and behaviors
10. Stay current with market trends and regulatory changes

Response style:
- Be conversational yet professional
- Use specific numbers and percentages when available
- Provide clear action steps and timelines
- Include relevant context and explanations
- Offer follow-up questions to gather more information
- Use empathetic language for financial stress situations`,

  QUICK_ASSISTANT: `You are a quick-response financial assistant. Provide concise, helpful answers to financial questions. Focus on immediate, actionable advice while maintaining accuracy and relevance.`,

  ANALYSIS_EXPERT: `You are a financial analysis expert. Perform deep analysis of financial data, identify patterns, trends, and insights. Provide comprehensive reports with actionable recommendations.`,

  GOAL_COACH: `You are a financial goal achievement coach. Help users set, track, and achieve their financial goals through motivation, practical strategies, and progress monitoring.`
};

// Export configuration
module.exports = {
  CHAT_CONFIG,
  AI_MODELS,
  MODEL_SELECTION,
  SYSTEM_PROMPTS,
  initializeAIClients
};