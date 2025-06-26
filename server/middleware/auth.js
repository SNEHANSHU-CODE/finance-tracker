const User = require('../models/userModel');
const JWTUtils = require('../utils/jwt');
const ResponseUtils = require('../utils/response');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return ResponseUtils.unauthorized(res, 'Access token required');
    }

    const decoded = JWTUtils.verifyAccessToken(token);
    
    if (decoded.type !== 'access') {
      return ResponseUtils.unauthorized(res, 'Invalid token type');
    }

    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return ResponseUtils.unauthorized(res, 'User not found');
    }

    if (!user.isActive) {
      return ResponseUtils.forbidden(res, 'Account is deactivated');
    }
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return ResponseUtils.forbidden(res, 'Invalid or expired token');
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = JWTUtils.verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return ResponseUtils.forbidden(res, 'Admin access required');
  }
  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin
};