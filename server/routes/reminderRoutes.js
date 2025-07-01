const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const reminderControllers = require('../controllers/reminderControllers');

const reminderRouter = express.Router();

// Apply authentication middleware to all routes
reminderRouter.use(authenticateToken);

// Routes
reminderRouter.get('/', reminderControllers.getReminders);
reminderRouter.post('/', reminderControllers.createReminder);
reminderRouter.put('/:id', reminderControllers.updateReminder);
reminderRouter.delete('/:id', reminderControllers.deleteReminder);

module.exports = reminderRouter;