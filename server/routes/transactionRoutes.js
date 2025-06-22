const express = require('express');
const { param } = require('express-validator');
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/transactionValidation');
const {
  validateTransactionCreate,
  validateTransactionUpdate,
  validateBulkDelete,
  validateRecurringSetup,
  validateTransactionQuery,
  validateMonthlySummary
} = require('../middleware/transactionValidation');

const transactionRouter = express.Router();

// Apply authentication middleware to all routes
transactionRouter.use(authenticateToken);

// Transaction CRUD operations
transactionRouter.post('/', validateTransactionCreate, transactionController.createTransaction);
transactionRouter.get('/', transactionController.getTransactions);
transactionRouter.get('/recent', transactionController.getRecentTransactions);
transactionRouter.get('/dashboard', transactionController.getDashboardStats);
transactionRouter.get('/export', transactionController.exportTransactions);
transactionRouter.get('/trends', transactionController.getSpendingTrends);
transactionRouter.get('/current-month', transactionController.getCurrentMonthSummary);
transactionRouter.get('/summary/:month/:year', validateMonthlySummary, transactionController.getMonthlySummary);
transactionRouter.get('/analysis/category', transactionController.getCategoryAnalysis);
transactionRouter.get('/:id', param('id').isMongoId().withMessage('Invalid transaction ID'),
  handleValidationErrors, transactionController.getTransactionById);
transactionRouter.put('/:id', validateTransactionUpdate, transactionController.updateTransaction);
transactionRouter.delete('/:id', transactionController.deleteTransaction);

// Bulk operations
transactionRouter.post('/bulk-delete', validateBulkDelete, transactionController.bulkDeleteTransactions);

// Recurring transactions
transactionRouter.post('/:id/recurring', validateRecurringSetup, transactionController.setRecurring);

module.exports = transactionRouter;