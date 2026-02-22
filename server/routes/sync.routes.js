const express = require('express');
const { body } = require('express-validator');
const syncController = require('../controllers/sync.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Validation middleware for sync transactions
const validateSyncTransactions = [
  body('transactions')
    .isArray({ min: 0 })
    .withMessage('Transactions must be an array'),
  body('transactions.*.clientId')
    .isString()
    .notEmpty()
    .withMessage('Each transaction must have a clientId'),
  body('transactions.*.type')
    .isIn(['income', 'expense'])
    .withMessage('Transaction type must be income or expense'),
  body('transactions.*.amount')
    .isNumeric()
    .withMessage('Amount must be a number'),
  body('transactions.*.date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('Date must be in YYYY-MM-DD format'),
  body('transactions.*.updatedAt')
    .isNumeric()
    .withMessage('updatedAt must be a number')
];

// POST /api/sync/transactions
router.post(
  '/transactions',
  authMiddleware,
  validateSyncTransactions,
  syncController.syncTransactions
);

module.exports = router;