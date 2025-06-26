const { body, query, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Validation for creating a new goal
const validateGoalCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Goal name is required')
    .isLength({ max: 50 })
    .withMessage('Goal name cannot exceed 50 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Goal category is required')
    .isIn(['Savings', 'Travel', 'Transportation', 'Technology', 'Emergency', 'Investment', 'Other'])
    .withMessage('Invalid goal category'),
  
  body('priority')
    .optional()
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Priority must be High, Medium, or Low'),
  
  body('targetAmount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isNumeric()
    .withMessage('Target amount must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Target amount must be greater than 0');
      }
      if (parseFloat(value) > 10000000) {
        throw new Error('Target amount is too large (max: 10,000,000)');
      }
      return true;
    }),
  
  body('savedAmount')
    .optional()
    .isNumeric()
    .withMessage('Saved amount must be a number')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Saved amount cannot be negative');
      }
      return true;
    }),
  
  body('targetDate')
    .notEmpty()
    .withMessage('Target date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const targetDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate <= today) {
        throw new Error('Target date must be in the future');
      }
      
      // Check if target date is not more than 10 years in the future
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 10);
      
      if (targetDate > maxDate) {
        throw new Error('Target date cannot be more than 10 years in the future');
      }
      
      return true;
    }),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Completed', 'Paused'])
    .withMessage('Status must be Active, Completed, or Paused'),

  handleValidationErrors
];

// Validation for updating a goal
const validateGoalUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Goal name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Goal name cannot exceed 50 characters'),
  
  body('category')
    .optional()
    .isIn(['Savings', 'Travel', 'Transportation', 'Technology', 'Emergency', 'Investment', 'Other'])
    .withMessage('Invalid goal category'),
  
  body('priority')
    .optional()
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Priority must be High, Medium, or Low'),
  
  body('targetAmount')
    .optional()
    .isNumeric()
    .withMessage('Target amount must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Target amount must be greater than 0');
      }
      if (parseFloat(value) > 10000000) {
        throw new Error('Target amount is too large (max: 10,000,000)');
      }
      return true;
    }),
  
  body('savedAmount')
    .optional()
    .isNumeric()
    .withMessage('Saved amount must be a number')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Saved amount cannot be negative');
      }
      return true;
    }),
  
  body('targetDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const targetDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (targetDate <= today) {
        throw new Error('Target date must be in the future');
      }
      
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 10);
      
      if (targetDate > maxDate) {
        throw new Error('Target date cannot be more than 10 years in the future');
      }
      
      return true;
    }),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  
  body('status')
    .optional()
    .isIn(['Active', 'Completed', 'Paused'])
    .withMessage('Status must be Active, Completed, or Paused'),

  handleValidationErrors
];

// Validation for goal contribution
const validateGoalContribution = [
  param('id')
    .isMongoId()
    .withMessage('Invalid goal ID'),
  
  body('amount')
    .notEmpty()
    .withMessage('Contribution amount is required')
    .isNumeric()
    .withMessage('Contribution amount must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Contribution amount must be greater than 0');
      }
      if (parseFloat(value) > 1000000) {
        throw new Error('Contribution amount is too large (max: 1,000,000)');
      }
      return true;
    }),

  handleValidationErrors
];

// Validation for bulk delete operations
const validateBulkDelete = [
  body('goalIds')
    .isArray({ min: 1 })
    .withMessage('Goal IDs array is required and must not be empty')
    .custom((goalIds) => {
      if (goalIds.length > 100) {
        throw new Error('Cannot delete more than 100 goals at once');
      }
      
      for (const id of goalIds) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid goal ID: ${id}`);
        }
      }
      return true;
    }),

  handleValidationErrors
];

// Validation for goal query parameters
const validateGoalQuery = [
  query('status')
    .optional()
    .isIn(['Active', 'Completed', 'Paused'])
    .withMessage('Status must be Active, Completed, or Paused'),
  
  query('category')
    .optional()
    .isIn(['Savings', 'Travel', 'Transportation', 'Technology', 'Emergency', 'Investment', 'Other'])
    .withMessage('Invalid goal category'),
  
  query('priority')
    .optional()
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Priority must be High, Medium, or Low'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'targetAmount', 'savedAmount', 'targetDate', 'createdAt', 'priority'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),

  handleValidationErrors
];

// Validation for category parameter
const validateCategoryParam = [
  param('category')
    .isIn(['Savings', 'Travel', 'Transportation', 'Technology', 'Emergency', 'Investment', 'Other'])
    .withMessage('Invalid goal category'),

  handleValidationErrors
];

// Validation for priority parameter
const validatePriorityParam = [
  param('priority')
    .isIn(['High', 'Medium', 'Low'])
    .withMessage('Invalid priority level'),

  handleValidationErrors
];

// Custom validation for target amount vs saved amount
const validateAmountConsistency = (req, res, next) => {
  const { targetAmount, savedAmount } = req.body;
  
  if (targetAmount && savedAmount) {
    if (parseFloat(savedAmount) > parseFloat(targetAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Saved amount cannot be greater than target amount'
      });
    }
  }
  
  next();
};

// Validation for goal ID parameter
const validateGoalId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid goal ID'),

  handleValidationErrors
];

// Middleware to sanitize goal data
const sanitizeGoalData = (req, res, next) => {
  if (req.body.name) {
    req.body.name = req.body.name.trim();
  }
  
  if (req.body.description) {
    req.body.description = req.body.description.trim();
  }
  
  // Convert string numbers to actual numbers
  if (req.body.targetAmount) {
    req.body.targetAmount = parseFloat(req.body.targetAmount);
  }
  
  if (req.body.savedAmount) {
    req.body.savedAmount = parseFloat(req.body.savedAmount);
  }
  
  next();
};

// Validation for date range queries
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format')
    .custom((endDate, { req }) => {
      if (req.query.startDate && endDate) {
        const start = new Date(req.query.startDate);
        const end = new Date(endDate);
        
        if (end <= start) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  handleValidationErrors
];

// Check if user owns the goal
const checkGoalOwnership = async (req, res, next) => {
  try {
    const Goal = require('../models/goalModel');
    const goal = await Goal.findById(req.params.id);
    
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }
    
    if (goal.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this goal'
      });
    }
    
    req.goal = goal;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while checking goal ownership'
    });
  }
};

// Check if goal can be modified
const checkGoalModifiable = (req, res, next) => {
  if (req.goal && req.goal.status === 'Completed') {
    return res.status(400).json({
      success: false,
      message: 'Cannot modify a completed goal'
    });
  }
  next();
};

// Validate contribution amount against goal
const validateContributionAmount = (req, res, next) => {
  const { amount } = req.body;
  const goal = req.goal;
  
  if (goal && parseFloat(amount) + goal.savedAmount > goal.targetAmount) {
    return res.status(400).json({
      success: false,
      message: 'Contribution would exceed target amount'
    });
  }
  next();
};

// Validate goal completion
const validateGoalCompletion = (req, res, next) => {
  const goal = req.goal;
  
  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }
  
  if (goal.status === 'Completed') {
    return res.status(400).json({
      success: false,
      message: 'Goal is already completed'
    });
  }
  
  next();
};

// Validate goal pause
const validateGoalPause = (req, res, next) => {
  const goal = req.goal;
  
  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }
  
  if (goal.status !== 'Active') {
    return res.status(400).json({
      success: false,
      message: 'Only active goals can be paused'
    });
  }
  
  next();
};

// Validate goal resume
const validateGoalResume = (req, res, next) => {
  const goal = req.goal;
  
  if (!goal) {
    return res.status(404).json({
      success: false,
      message: 'Goal not found'
    });
  }
  
  if (goal.status !== 'Paused') {
    return res.status(400).json({
      success: false,
      message: 'Only paused goals can be resumed'
    });
  }
  
  next();
};

// Validate bulk operations
const validateBulkOperation = async (req, res, next) => {
  try {
    const { goalIds } = req.body;
    const Goal = require('../models/goalModel');
    
    // Check if all goals belong to the user
    const goals = await Goal.find({
      _id: { $in: goalIds },
      userId: req.user.userId
    });
    
    if (goals.length !== goalIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some goals do not belong to you or do not exist'
      });
    }
    
    req.bulkGoals = goals;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during bulk operation validation'
    });
  }
};

// Log goal activity
const logGoalActivity = (action) => {
  return (req, res, next) => {
    // Add logging logic here
    console.log(`Goal ${action} action by user ${req.user.userId} at ${new Date()}`);
    next();
  };
};

// Check goal limits
const checkGoalLimits = async (req, res, next) => {
  try {
    const Goal = require('../models/goalModel');
    const goalCount = await Goal.countDocuments({ userId: req.user.userId });
    
    const MAX_GOALS = 100; // Set your limit
    
    if (goalCount >= MAX_GOALS) {
      return res.status(400).json({
        success: false,
        message: `Maximum goal limit reached (${MAX_GOALS} goals)`
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error while checking goal limits'
    });
  }
};

// Validate category parameter (alias for existing function)
const validateCategoryParameter = validateCategoryParam;

// Validate priority parameter (alias for existing function)
const validatePriorityParameter = validatePriorityParam;

// Add computed fields to goals
const addGoalComputedFields = (req, res, next) => {
  // This middleware can add computed fields to request/response
  // For now, just pass through
  next();
};

module.exports = {
  validateGoalCreate,
  validateGoalUpdate,
  validateGoalContribution,
  validateBulkDelete,
  validateGoalQuery,
  validateCategoryParam,
  validatePriorityParam,
  validateGoalId,
  validateDateRange,
  validateAmountConsistency,
  sanitizeGoalData,
  handleValidationErrors,
  checkGoalOwnership,
  checkGoalModifiable,
  validateContributionAmount,
  validateGoalCompletion,
  validateGoalPause,
  validateGoalResume,
  validateBulkOperation,
  logGoalActivity,
  checkGoalLimits,
  validateCategoryParameter,
  validatePriorityParameter,
  addGoalComputedFields
};