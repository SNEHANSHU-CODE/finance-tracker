// utils/rateLimiterUtils.js
const crypto = require('crypto');

/**
 * In-memory storage for rate limiting data
 * In production, use Redis for distributed rate limiting
 */
class RateLimitStore {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Get rate limit data for a key
   * @param {string} key - Rate limit key
   * @returns {Object|null} Rate limit data
   */
  get(key) {
    const data = this.store.get(key);
    if (!data) return null;

    // Check if expired
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }

    return data;
  }

  /**
   * Set rate limit data for a key
   * @param {string} key - Rate limit key
   * @param {Object} data - Rate limit data
   */
  set(key, data) {
    this.store.set(key, data);
  }

  /**
   * Delete rate limit data for a key
   * @param {string} key - Rate limit key
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (now > data.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get store statistics
   */
  getStats() {
    return {
      totalKeys: this.store.size,
      activeKeys: Array.from(this.store.values()).filter(data => Date.now() <= data.resetTime).length
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.store.clear();
  }

  /**
   * Destroy the store and cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Initialize rate limit store
const rateLimitStore = new RateLimitStore();

/**
 * Rate limit configurations
 */
const rateLimitConfig = {
  // Default limits
  default: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,                  // 100 requests per window
    message: 'Too many requests, please try again later'
  },

  // API endpoint specific limits
  api: {
    strict: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50,                   // 50 requests per window
      message: 'Rate limit exceeded for strict endpoints'
    },
    moderate: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200,                  // 200 requests per window
      message: 'Rate limit exceeded for moderate endpoints'
    },
    relaxed: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500,                  // 500 requests per window
      message: 'Rate limit exceeded for relaxed endpoints'
    }
  },

  // Analytics specific limits
  analytics: {
    dashboard: {
      windowMs: 5 * 60 * 1000,  // 5 minutes
      max: 30,                   // 30 requests per 5 minutes
      message: 'Dashboard analytics rate limit exceeded'
    },
    reports: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 20,                   // 20 requests per 10 minutes
      message: 'Reports generation rate limit exceeded'
    },
    exports: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,                    // 5 exports per hour
      message: 'Export rate limit exceeded'
    },
    realtime: {
      windowMs: 1 * 60 * 1000,  // 1 minute
      max: 60,                   // 60 requests per minute
      message: 'Real-time analytics rate limit exceeded'
    },
    charts: {
      windowMs: 5 * 60 * 1000,  // 5 minutes
      max: 50,                   // 50 chart requests per 5 minutes
      message: 'Chart data rate limit exceeded'
    }
  },

  // User tier based limits
  userTiers: {
    free: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50,                   // 50 requests per window
      message: 'Free tier rate limit exceeded. Please upgrade your plan.'
    },
    premium: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500,                  // 500 requests per window
      message: 'Premium tier rate limit exceeded'
    },
    enterprise: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 2000,                 // 2000 requests per window
      message: 'Enterprise tier rate limit exceeded'
    }
  },

  // Authentication based limits
  auth: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,                    // 5 login attempts per 15 minutes
      message: 'Too many login attempts. Please try again later.',
      skipSuccessfulRequests: true
    },
    signup: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,                    // 3 signup attempts per hour
      message: 'Too many signup attempts. Please try again later.'
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,                    // 3 password reset attempts per hour
      message: 'Too many password reset attempts. Please try again later.'
    }
  }
};

/**
 * Generate rate limit key
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {string} endpoint - Endpoint identifier
 * @param {Object} options - Additional options
 * @returns {string} Rate limit key
 */
function generateRateLimitKey(identifier, endpoint, options = {}) {
  const keyParts = [
    'ratelimit',
    identifier,
    endpoint,
    options.method || 'ALL',
    options.userTier || 'default'
  ];

  return keyParts.join(':');
}

/**
 * Check if request is rate limited
 * @param {string} key - Rate limit key
 * @param {Object} config - Rate limit configuration
 * @returns {Object} Rate limit result
 */
function checkRateLimit(key, config) {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  let rateLimitData = rateLimitStore.get(key);

  if (!rateLimitData) {
    // First request in window
    rateLimitData = {
      count: 1,
      resetTime: now + config.windowMs,
      firstRequest: now
    };
    rateLimitStore.set(key, rateLimitData);

    return {
      allowed: true,
      count: 1,
      remaining: config.max - 1,
      resetTime: rateLimitData.resetTime,
      retryAfter: 0
    };
  }

  // Increment counter
  rateLimitData.count++;
  rateLimitStore.set(key, rateLimitData);

  const remaining = Math.max(0, config.max - rateLimitData.count);
  const allowed = rateLimitData.count <= config.max;
  const retryAfter = allowed ? 0 : Math.ceil((rateLimitData.resetTime - now) / 1000);

  return {
    allowed,
    count: rateLimitData.count,
    remaining,
    resetTime: rateLimitData.resetTime,
    retryAfter
  };
}

/**
 * Create rate limiting middleware
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware
 */
function createRateLimit(options = {}) {
  const config = {
    ...rateLimitConfig.default,
    ...options
  };

  return async (req, res, next) => {
    try {
      // Generate identifier (IP address, user ID, or custom)
      const identifier = options.keyGenerator 
        ? options.keyGenerator(req)
        : req.user?.id || req.ip || req.connection.remoteAddress;

      // Generate endpoint identifier
      const endpoint = options.endpoint || `${req.method}:${req.route?.path || req.path}`;

      // Generate rate limit key
      const key = generateRateLimitKey(identifier, endpoint, {
        method: req.method,
        userTier: req.user?.tier || 'default'
      });

      // Check rate limit
      const result = checkRateLimit(key, config);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': config.max,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'X-RateLimit-Window': Math.floor(config.windowMs / 1000)
      });

      if (!result.allowed) {
        res.set('Retry-After', result.retryAfter);
        
        return res.status(429).json({
          success: false,
          error: {
            message: config.message,
            statusCode: 429,
            code: 'RATE_LIMIT_EXCEEDED',
            details: {
              limit: config.max,
              windowMs: config.windowMs,
              retryAfter: result.retryAfter,
              resetTime: new Date(result.resetTime).toISOString()
            }
          },
          timestamp: new Date().toISOString()
        });
      }

      // Skip successful requests if configured (useful for login attempts)
      if (config.skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function(data) {
          // If response is successful (2xx), don't count it
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const rateLimitData = rateLimitStore.get(key);
            if (rateLimitData) {
              rateLimitData.count = Math.max(0, rateLimitData.count - 1);
              rateLimitStore.set(key, rateLimitData);
            }
          }
          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next(); // Continue on error
    }
  };
}

/**
 * Analytics-specific rate limiters
 */
const analyticsRateLimiters = {
  dashboard: createRateLimit({
    ...rateLimitConfig.analytics.dashboard,
    endpoint: 'analytics:dashboard'
  }),

  reports: createRateLimit({
    ...rateLimitConfig.analytics.reports,
    endpoint: 'analytics:reports'
  }),

  exports: createRateLimit({
    ...rateLimitConfig.analytics.exports,
    endpoint: 'analytics:exports'
  }),

  realtime: createRateLimit({
    ...rateLimitConfig.analytics.realtime,
    endpoint: 'analytics:realtime'
  }),

  charts: createRateLimit({
    ...rateLimitConfig.analytics.charts,
    endpoint: 'analytics:charts'
  })
};

/**
 * User tier-based rate limiter
 * @param {Object} req - Express request object
 * @returns {Function} Rate limit middleware
 */
function createTierBasedRateLimit(req) {
  const userTier = req.user?.tier || 'free';
  const config = rateLimitConfig.userTiers[userTier] || rateLimitConfig.userTiers.free;
  
  return createRateLimit({
    ...config,
    endpoint: 'api:general',
    keyGenerator: (req) => `${req.user?.id || req.ip}:${userTier}`
  });
}

/**
 * Dynamic rate limiter based on endpoint and user
 * @param {string} endpointType - Type of endpoint (strict, moderate, relaxed)
 * @returns {Function} Rate limit middleware
 */
function createDynamicRateLimit(endpointType = 'moderate') {
  return (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    
    // Combine endpoint type and user tier configs
    const endpointConfig = rateLimitConfig.api[endpointType] || rateLimitConfig.api.moderate;
    const tierConfig = rateLimitConfig.userTiers[userTier] || rateLimitConfig.userTiers.free;
    
    // Use the more restrictive limit
    const config = {
      windowMs: Math.min(endpointConfig.windowMs, tierConfig.windowMs),
      max: Math.min(endpointConfig.max, tierConfig.max),
      message: `${endpointConfig.message} (${userTier} tier)`
    };

    const rateLimiter = createRateLimit({
      ...config,
      endpoint: `${endpointType}:${req.route?.path || req.path}`,
      keyGenerator: (req) => `${req.user?.id || req.ip}:${userTier}:${endpointType}`
    });

    rateLimiter(req, res, next);
  };
}

/**
 * Reset rate limit for a specific key
 * @param {string} identifier - Unique identifier
 * @param {string} endpoint - Endpoint identifier
 * @param {Object} options - Additional options
 * @returns {boolean} Success status
 */
function resetRateLimit(identifier, endpoint, options = {}) {
  try {
    const key = generateRateLimitKey(identifier, endpoint, options);
    rateLimitStore.delete(key);
    return true;
  } catch (error) {
    console.error('Reset rate limit error:', error);
    return false;
  }
}

/**
 * Get rate limit status for a key
 * @param {string} identifier - Unique identifier
 * @param {string} endpoint - Endpoint identifier
 * @param {Object} options - Additional options
 * @returns {Object|null} Rate limit status
 */
function getRateLimitStatus(identifier, endpoint, options = {}) {
  try {
    const key = generateRateLimitKey(identifier, endpoint, options);
    const data = rateLimitStore.get(key);
    
    if (!data) {
      return {
        count: 0,
        remaining: options.max || rateLimitConfig.default.max,
        resetTime: null,
        isLimited: false
      };
    }

    const remaining = Math.max(0, (options.max || rateLimitConfig.default.max) - data.count);
    
    return {
      count: data.count,
      remaining,
      resetTime: data.resetTime,
      isLimited: remaining === 0
    };
  } catch (error) {
    console.error('Get rate limit status error:', error);
    return null;
  }
}

/**
 * Whitelist middleware - bypass rate limiting for specific conditions
 * @param {Function} condition - Function that returns true to bypass rate limiting
 * @returns {Function} Express middleware
 */
function createWhitelist(condition) {
  return (req, res, next) => {
    if (condition(req)) {
      // Add header to indicate whitelisted request
      res.set('X-RateLimit-Whitelisted', 'true');
      return next();
    }
    next();
  };
}

/**
 * Rate limit monitoring and metrics
 */
const rateLimitMetrics = {
  /**
   * Get overall rate limit statistics
   */
  getStats() {
    return rateLimitStore.getStats();
  },

  /**
   * Get rate limit violations in the last period
   * @param {number} periodMs - Period in milliseconds
   * @returns {Array} Rate limit violations
   */
  getViolations(periodMs = 60 * 60 * 1000) {
    // This would typically be implemented with persistent storage
    // For now, return empty array as in-memory store doesn't track violations
    return [];
  },

  /**
   * Get top rate limited endpoints
   * @param {number} limit - Number of top endpoints to return
   * @returns {Array} Top rate limited endpoints
   */
  getTopLimitedEndpoints(limit = 10) {
    // This would typically be implemented with persistent storage
    // For now, return empty array as in-memory store doesn't track this
    return [];
  }
};

/**
 * Clean up rate limit store
 */
function cleanup() {
  rateLimitStore.cleanup();
}

/**
 * Destroy rate limiter and cleanup resources
 */
function destroy() {
  rateLimitStore.destroy();
}

module.exports = {
  // Core rate limiting
  createRateLimit,
  checkRateLimit,
  generateRateLimitKey,

  // Specialized rate limiters
  analyticsRateLimiters,
  createTierBasedRateLimit,
  createDynamicRateLimit,

  // Rate limit management
  resetRateLimit,
  getRateLimitStatus,
  createWhitelist,

  // Monitoring and metrics
  rateLimitMetrics,

  // Configuration
  rateLimitConfig,

  // Utility functions
  cleanup,
  destroy,

  // Direct store access (for advanced usage)
  rateLimitStore
};