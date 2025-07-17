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


function formatValidationErrorResponse(validationErrors, message = 'Validation failed') {
  const formattedErrors = validationErrors.map(error => ({
    field: error.param || error.field,
    message: error.msg || error.message,
    value: error.value,
    location: error.location || 'body'
  }));

  return formatErrorResponse(message, 400, 'VALIDATION_ERROR', formattedErrors);
}


function formatCreateResponse(data, resourceType = 'Resource', id = null) {
  const message = `${resourceType} created successfully`;
  const meta = {
    operation: 'create',
    resourceId: id || data.id || data._id
  };

  return formatResponse(data, message, meta);
}


function formatUpdateResponse(data, resourceType = 'Resource', id = null) {
  const message = `${resourceType} updated successfully`;
  const meta = {
    operation: 'update',
    resourceId: id || data.id || data._id,
    updatedAt: new Date().toISOString()
  };

  return formatResponse(data, message, meta);
}


function formatDeleteResponse(resourceType = 'Resource', id) {
  const message = `${resourceType} deleted successfully`;
  const meta = {
    operation: 'delete',
    resourceId: id,
    deletedAt: new Date().toISOString()
  };

  return formatResponse(null, message, meta);
}


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


function formatHealthResponse(healthData, status = 'healthy') {
  const message = `System status: ${status}`;
  const meta = {
    status,
    checkedAt: new Date().toISOString()
  };

  return formatResponse(healthData, message, meta);
}


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


function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}


function formatPercentage(value, decimals = 2) {
  return (value * 100).toFixed(decimals) + '%';
}


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