const express = require('express');
const chatService = require('../services/chatService');
const { authenticateToken } = require('../middleware/auth');

const chatRouter = express.Router();

// Apply middleware to all routes
chatRouter.use(authenticateToken);

// Chat route
chatRouter.post('/chat', async (req, res, next) => {
  try {
    const result = await chatService.processChat(req.body, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Smart suggestions route
chatRouter.get('/suggestions', async (req, res, next) => {
  try {
    const result = await chatService.getSmartSuggestions(req.query, req.user);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = chatRouter;