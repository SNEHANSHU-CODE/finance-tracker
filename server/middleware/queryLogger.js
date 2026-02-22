/**
 * Query Performance Logger Middleware
 * Logs requests that take longer than 1 second
 * Helps identify slow endpoints for optimization
 */

module.exports = (req, res, next) => {
  const startTime = Date.now();
  
  // Intercept response to measure total time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log only slow queries (> 1 second)
    if (duration > 1000) {
      const statusColor = res.statusCode >= 400 ? '❌' : '⚠️';
      console.warn(`${statusColor} SLOW QUERY [${duration}ms]: ${req.method} ${req.path} (Status: ${res.statusCode})`);
      
      // Log request body for POST/PUT if available
      if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
        console.warn(`   Body: ${JSON.stringify(req.body).substring(0, 100)}...`);
      }
    } else if (duration > 500) {
      console.log(`⏱️  MODERATE QUERY [${duration}ms]: ${req.method} ${req.path}`);
    }
  });
  
  next();
};
