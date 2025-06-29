// routes/goalRoutes.js
const express = require('express');
const { param } = require('express-validator');
const goalController = require('../controllers/goalControllers');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/goal');
const {
  validateGoalCreate,
  validateGoalUpdate,
  validateGoalContribution,
  validateBulkDelete,
  validateGoalQuery,
  sanitizeGoalData,
  validateAmountConsistency
} = require('../middleware/goal');
const {
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
} = require('../middleware/goal');

const goalRouter = express.Router();

// Apply authentication middleware to all routes
goalRouter.use(authenticateToken);

// Apply computed fields middleware to all routes
goalRouter.use(addGoalComputedFields);

// Goal CRUD operations
goalRouter.post('/', 
  checkGoalLimits,
  validateGoalCreate, 
  sanitizeGoalData,
  validateAmountConsistency,
  logGoalActivity('create'),
  goalController.createGoal
);

goalRouter.get('/', validateGoalQuery, goalController.getGoals);

goalRouter.get('/dashboard', goalController.getDashboardStats);

goalRouter.get('/summary', goalController.getGoalsSummary);

goalRouter.get('/category/:category', 
  validateCategoryParameter,
  goalController.getGoalsByCategory
);

goalRouter.get('/priority/:priority', 
  validatePriorityParameter,
  goalController.getGoalsByPriority
);

goalRouter.get('/overdue', goalController.getOverdueGoals);

goalRouter.get('/:id', 
  param('id').isMongoId().withMessage('Invalid goal ID'),
  handleValidationErrors, 
  checkGoalOwnership,
  goalController.getGoalById
);

goalRouter.put('/:id', 
  handleValidationErrors,
  validateGoalUpdate,
  sanitizeGoalData,
  validateAmountConsistency,
  checkGoalOwnership,
  checkGoalModifiable,
  logGoalActivity('update'),
  goalController.updateGoal
);

goalRouter.delete('/:id', 
  checkGoalOwnership,
  logGoalActivity('delete'),
  goalController.deleteGoal
);

// Goal specific operations
goalRouter.post('/:id/contribute', 
  validateGoalContribution,
  checkGoalOwnership,
  validateContributionAmount,
  logGoalActivity('contribute'),
  goalController.addContribution
);

goalRouter.post('/:id/complete', 
  checkGoalOwnership,
  validateGoalCompletion,
  logGoalActivity('complete'),
  goalController.markGoalComplete
);

goalRouter.post('/:id/pause', 
  checkGoalOwnership,
  validateGoalPause,
  logGoalActivity('pause'),
  goalController.pauseGoal
);

goalRouter.post('/:id/resume', 
  checkGoalOwnership,
  validateGoalResume,
  logGoalActivity('resume'),
  goalController.resumeGoal
);

// Bulk operations
goalRouter.post('/bulk-delete', 
  validateBulkDelete,
  validateBulkOperation,
  logGoalActivity('bulk-delete'),
  goalController.bulkDeleteGoals
);

module.exports = goalRouter;