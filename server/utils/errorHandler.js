// utils/errorHandler.js

/**
 * Custom Application Error Class
 * Extends the built-in Error class to provide structured error handling
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode = null, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error Class
 * For handling input validation errors
 */
class ValidationError extends AppError {
  constructor(message, field = null, value = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
  }
}

/**
 * Database Error Class
 * For handling database-related errors
 */
class DatabaseError extends AppError {
  constructor(message, operation = null, collection = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.operation = operation;
    this.collection = collection;
  }
}

/**
 * Authentication Error Class
 * For handling authentication-related errors
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

/**
 * Authorization Error Class
 * For handling authorization-related errors
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

/**
 * Not Found Error Class
 * For handling resource not found errors
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.resource = resource;
  }
}

/**
 * Rate Limit Error Class
 * For handling rate limiting errors
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

/**
 * External Service Error Class
 * For handling third-party service errors
 */
class ExternalServiceError extends AppError {
  constructor(message, service = null, statusCode = 502) {
    super(message, statusCode, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Error Logger Utility
 * Handles logging of errors with different levels and formats
 */
class ErrorLogger {
  static log(error, req = null, additionalInfo = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode || 500,
      errorCode: error.errorCode || 'UNKNOWN_ERROR',
      isOperational: error.isOperational || false,
      ...additionalInfo
    };

    if (req) {
      logEntry.request = {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      };
    }

    // Log based on error severity
    if (error.statusCode >= 500) {
      console.error('CRITICAL ERROR:', JSON.stringify(logEntry, null, 2));
    } else if (error.statusCode >= 400) {
      console.warn('CLIENT ERROR:', JSON.stringify(logEntry, null, 2));
    } else {
      console.log('INFO:', JSON.stringify(logEntry, null, 2));
    }

    return logEntry;
  }

  static sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  static sanitizeBody(body) {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'pin'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}

/**
 * Error Handler Middleware
 * Express middleware for centralized error handling
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  const logEntry = ErrorLogger.log(err, req);

  // Handle different error types
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID format';
    error = new ValidationError(message, 'id', err.value);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field: ${field}`;
    error = new ValidationError(message, field, err.keyValue[field]);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    error = new ValidationError('Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('File size too large');
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message,
      code: error.errorCode || 'INTERNAL_SERVER_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error 
      })
    },
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  });
};

/**
 * Async Error Handler Wrapper
 * Wraps async functions to catch and forward errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error Response Helper
 * Standardizes error responses across the application
 */
class ErrorResponse {
  static badRequest(message, field = null, value = null) {
    return new ValidationError(message, field, value);
  }

  static unauthorized(message = 'Authentication required') {
    return new AuthenticationError(message);
  }

  static forbidden(message = 'Access denied') {
    return new AuthorizationError(message);
  }

  static notFound(resource = 'Resource') {
    return new NotFoundError(resource);
  }

  static conflict(message) {
    return new AppError(message, 409, 'CONFLICT_ERROR');
  }

  static tooManyRequests(message = 'Too many requests') {
    return new RateLimitError(message);
  }

  static internalServer(message = 'Internal server error') {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR', false);
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', false);
  }

  static badGateway(message = 'Bad gateway', service = null) {
    return new ExternalServiceError(message, service, 502);
  }
}

/**
 * Analytics-specific Error Handlers
 * Custom error handlers for common analytics service errors
 */
class AnalyticsErrorHandler {
  static invalidDateRange(startDate, endDate) {
    return new ValidationError(
      'Invalid date range: start date must be before end date',
      'dateRange',
      { startDate, endDate }
    );
  }

  static invalidPeriod(period) {
    return new ValidationError(
      'Invalid period specified',
      'period',
      period
    );
  }

  static insufficientData(operation) {
    return new AppError(
      `Insufficient data to perform ${operation}`,
      422,
      'INSUFFICIENT_DATA'
    );
  }

  static calculationError(operation, details = null) {
    return new AppError(
      `Error performing calculation: ${operation}`,
      500,
      'CALCULATION_ERROR',
      false
    );
  }

  static profileNotFound(profileId) {
    return new NotFoundError(`Profile with ID ${profileId}`);
  }

  static aggregationError(pipeline, collection) {
    return new DatabaseError(
      'Database aggregation failed',
      'aggregate',
      collection
    );
  }
}

/**
 * Validation Helper Functions
 */
const ValidationHelpers = {
  isValidObjectId(id) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  },

  isValidDateString(dateString) {
    const date = new Date(dateString);
    return this.isValidDate(date);
  },

  isValidPeriod(period) {
    const validPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    return validPeriods.includes(period);
  },

  isValidGranularity(granularity) {
    const validGranularities = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];
    return validGranularities.includes(granularity);
  },

  validateDateRange(startDate, endDate) {
    if (!this.isValidDateString(startDate)) {
      throw new ValidationError('Invalid start date format', 'startDate', startDate);
    }
    
    if (!this.isValidDateString(endDate)) {
      throw new ValidationError('Invalid end date format', 'endDate', endDate);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      throw AnalyticsErrorHandler.invalidDateRange(startDate, endDate);
    }

    return { startDate: start, endDate: end };
  },

  validateProfileId(profileId) {
    if (!profileId) {
      throw new ValidationError('Profile ID is required', 'profileId');
    }

    if (!this.isValidObjectId(profileId)) {
      throw new ValidationError('Invalid profile ID format', 'profileId', profileId);
    }

    return profileId;
  },

  validatePaginationParams(page, limit) {
    const parsedPage = parseInt(page) || 1;
    const parsedLimit = parseInt(limit) || 10;

    if (parsedPage < 1) {
      throw new ValidationError('Page must be greater than 0', 'page', page);
    }

    if (parsedLimit < 1 || parsedLimit > 100) {
      throw new ValidationError('Limit must be between 1 and 100', 'limit', limit);
    }

    return { page: parsedPage, limit: parsedLimit };
  }
};

/**
 * Error Recovery Utilities
 * Helper functions for error recovery and retry logic
 */
class ErrorRecovery {
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          break;
        }
        
        await this.sleep(delay * attempt);
      }
    }
    
    throw lastError;
  }

  static isRetryableError(error) {
    // Define which errors are retryable
    const retryableErrors = [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT'
    ];
    
    return retryableErrors.includes(error.code) || 
           error.statusCode >= 500 ||
           error.name === 'MongoNetworkError';
  }

  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ExternalServiceError,
  ErrorLogger,
  errorHandler,
  asyncHandler,
  ErrorResponse,
  AnalyticsErrorHandler,
  ValidationHelpers,
  ErrorRecovery
};