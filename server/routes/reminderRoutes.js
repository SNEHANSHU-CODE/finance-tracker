const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const reminderControllers = require('../controllers/reminderControllers');

const reminderRouter = express.Router();

reminderRouter.use(authenticateToken);

reminderRouter.get('/', reminderControllers.getReminders);
reminderRouter.post('/', reminderControllers.createReminder);
reminderRouter.delete('/:id', reminderControllers.deleteReminder);

module.exports = reminderRouter;
