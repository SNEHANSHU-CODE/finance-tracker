const express = require('express');
const budgetController = require('../controllers/budgetController');
const { authenticateToken } = require('../middleware/auth');

const budgetRouter = express.Router();

budgetRouter.use(authenticateToken);

budgetRouter.get('/analysis', budgetController.getBudgetAnalysis);
budgetRouter.get('/',      budgetController.getBudget);
budgetRouter.post('/',     budgetController.createBudget);
budgetRouter.put('/:id',   budgetController.updateBudget);
budgetRouter.delete('/:id',budgetController.deleteBudget);

module.exports = budgetRouter;