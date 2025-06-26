// utils/responseFormatterUtils.js

/**
 * Standard response formatter for API responses
 * @param {any} data - The data to be returned
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata (pagination, etc.)
 * @returns {Object} Formatted response object
 */
function formatResponse(data, message = 'Operation successful', meta = {}) {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };

  // Add metadata if provided
  if (Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return response;
}

/**
 * Error response formatter
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} errorCode - Internal error code
 * @param {any} details - Additional error details
 * @returns {Object} Formatted error response
 */
function formatErrorResponse(message, statusCode = 500, errorCode = null, details = null) {
  const response = {
    success: false,
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString()
    }
  };

  if (errorCode) {
    response.error.code = errorCode;
  }

  if (details) {
    response.error.details = details;
  }

  return response;
}

/**
 * Paginated response formatter
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @param {string} message - Success message
 * @returns {Object} Formatted paginated response
 */
function formatPaginatedResponse(data, pagination, message = 'Data retrieved successfully') {
  const meta = {
    pagination: {
      currentPage: pagination.page || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || data.length,
      itemsPerPage: pagination.limit || data.length,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    }
  };

  return formatResponse(data, message, meta);
}

/**
 * Analytics specific response formatter
 * @param {Object} analyticsData - Analytics data
 * @param {string} message - Success message
 * @param {Object} filters - Applied filters
 * @param {Object} summary - Summary statistics
 * @returns {Object} Formatted analytics response
 */
function formatAnalyticsResponse(analyticsData, message, filters = {}, summary = {}) {
  const meta = {};

  // Add filter information
  if (Object.keys(filters).length > 0) {
    meta.filters = filters;
  }

  // Add summary statistics
  if (Object.keys(summary).length > 0) {
    meta.summary = summary;
  }

  // Add data processing timestamp
  meta.processedAt = new Date().toISOString();

  return formatResponse(analyticsData, message, meta);
}

/**
 * Chart data response formatter
 * @param {Object} chartData - Chart data
 * @param {string} chartType - Type of chart
 * @param {Object} config - Chart configuration
 * @param {string} message - Success message
 * @returns {Object} Formatted chart response
 */
function formatChartResponse(chartData, chartType, config = {}, message = 'Chart data retrieved successfully') {
  const meta = {
    chartType,
    config: {
      granularity: config.granularity || 'daily',
      metric: config.metric || 'amount',
      ...config
    }
  };

  return formatResponse(chartData, message, meta);
}

/**
 * Export response formatter
 * @param {string} filename - Export filename
 * @param {string} format - Export format
 * @param {number} recordCount - Number of records exported
 * @param {string} message - Success message
 * @returns {Object} Formatted export response
 */
function formatExportResponse(filename, format, recordCount, message = 'Export generated successfully') {
  const meta = {
    export: {
      filename,
      format,
      recordCount,
      generatedAt: new Date().toISOString()
    }
  };

  return formatResponse({ filename }, message, meta);
}

/**
 * Validation error response formatter
 * @param {Array} validationErrors - Array of validation errors
 * @param {string} message - Error message
 * @returns {Object} Formatted validation error response
 */
function formatValidationErrorResponse(validationErrors, message = 'Validation failed') {
  const formattedErrors = validationErrors.map(error => ({
    field: error.param || error.field,
    message: error.msg || error.message,
    value: error.value,
    location: error.location || 'body'
  }));

  return formatErrorResponse(message, 400, 'VALIDATION_ERROR', formattedErrors);
}

/**
 * Success response for create operations
 * @param {any} data - Created resource data
 * @param {string} resourceType - Type of resource created
 * @param {string} id - Resource ID
 * @returns {Object} Formatted create response
 */
function formatCreateResponse(data, resourceType = 'Resource', id = null) {
  const message = `${resourceType} created successfully`;
  const meta = {
    operation: 'create',
    resourceId: id || data.id || data._id
  };

  return formatResponse(data, message, meta);
}

/**
 * Success response for update operations
 * @param {any} data - Updated resource data
 * @param {string} resourceType - Type of resource updated
 * @param {string} id - Resource ID
 * @returns {Object} Formatted update response
 */
function formatUpdateResponse(data, resourceType = 'Resource', id = null) {
  const message = `${resourceType} updated successfully`;
  const meta = {
    operation: 'update',
    resourceId: id || data.id || data._id,
    updatedAt: new Date().toISOString()
  };

  return formatResponse(data, message, meta);
}

/**
 * Success response for delete operations
 * @param {string} resourceType - Type of resource deleted
 * @param {string} id - Resource ID
 * @returns {Object} Formatted delete response
 */
function formatDeleteResponse(resourceType = 'Resource', id) {
  const message = `${resourceType} deleted successfully`;
  const meta = {
    operation: 'delete',
    resourceId: id,
    deletedAt: new Date().toISOString()
  };

  return formatResponse(null, message, meta);
}

/**
 * Bulk operation response formatter
 * @param {Object} results - Bulk operation results
 * @param {string} operation - Operation type (create, update, delete)
 * @param {string} resourceType - Type of resource
 * @returns {Object} Formatted bulk response
 */
function formatBulkResponse(results, operation, resourceType = 'Resources') {
  const { successful = 0, failed = 0, errors = [] } = results;
  const total = successful + failed;
  
  const message = `Bulk ${operation} completed. ${successful}/${total} ${resourceType.toLowerCase()} processed successfully`;
  
  const meta = {
    operation: `bulk_${operation}`,
    statistics: {
      total,
      successful,
      failed,
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%'
    }
  };

  const responseData = {
    summary: meta.statistics,
    errors: errors.length > 0 ? errors : undefined
  };

  return formatResponse(responseData, message, meta);
}

/**
 * Cache response formatter
 * @param {any} data - Cached data
 * @param {string} message - Success message
 * @param {boolean} fromCache - Whether data was served from cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Object} Formatted cache response
 */
function formatCacheResponse(data, message, fromCache = false, ttl = null) {
  const meta = {
    cache: {
      hit: fromCache,
      ttl: ttl
    }
  };

  if (fromCache) {
    meta.cache.servedAt = new Date().toISOString();
  }

  return formatResponse(data, message, meta);
}

/**
 * Health check response formatter
 * @param {Object} healthData - Health check data
 * @param {string} status - Overall status (healthy, degraded, unhealthy)
 * @returns {Object} Formatted health response
 */
function formatHealthResponse(healthData, status = 'healthy') {
  const message = `System status: ${status}`;
  const meta = {
    status,
    checkedAt: new Date().toISOString()
  };

  return formatResponse(healthData, message, meta);
}

/**
 * File upload response formatter
 * @param {Object} fileData - File upload data
 * @param {string} filename - Uploaded filename
 * @param {number} size - File size in bytes
 * @returns {Object} Formatted upload response
 */
function formatUploadResponse(fileData, filename, size) {
  const message = 'File uploaded successfully';
  const meta = {
    file: {
      originalName: filename,
      size: size,
      sizeFormatted: formatFileSize(size),
      uploadedAt: new Date().toISOString()
    }
  };

  return formatResponse(fileData, message, meta);
}

/**
 * Search results response formatter
 * @param {Array} results - Search results
 * @param {string} query - Search query
 * @param {Object} filters - Applied filters
 * @param {number} totalResults - Total number of results
 * @param {number} searchTime - Search execution time in ms
 * @returns {Object} Formatted search response
 */
function formatSearchResponse(results, query, filters = {}, totalResults = null, searchTime = null) {
  const message = `Search completed. Found ${totalResults || results.length} results`;
  
  const meta = {
    search: {
      query,
      filters,
      resultCount: results.length,
      totalResults: totalResults || results.length,
      executionTime: searchTime ? `${searchTime}ms` : null
    }
  };

  return formatResponse(results, message, meta);
}

/**
 * Helper function to format file sizes
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Helper function to format currency values
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

/**
 * Helper function to format percentages
 * @param {number} value - Value to format as percentage
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
function formatPercentage(value, decimals = 2) {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Response wrapper for async route handlers
 * @param {Function} handler - Async route handler function
 * @returns {Function} Wrapped handler with error catching
 */
function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

module.exports = {
  // Main formatters
  formatResponse,
  formatErrorResponse,
  formatPaginatedResponse,
  formatAnalyticsResponse,
  formatChartResponse,
  formatExportResponse,
  formatValidationErrorResponse,
  
  // CRUD operation formatters
  formatCreateResponse,
  formatUpdateResponse,
  formatDeleteResponse,
  formatBulkResponse,
  
  // Specialized formatters
  formatCacheResponse,
  formatHealthResponse,
  formatUploadResponse,
  formatSearchResponse,
  
  // Helper functions
  formatFileSize,
  formatCurrency,
  formatPercentage,
  asyncHandler
};