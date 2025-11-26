const { Server } = require('socket.io');
const { getChatbotResponse } = require('../services/llmService');

// Import userService - adjust path based on your structure
let userService;
try {
  userService = require('../services/userService');
} catch (error) {
  console.warn('userService not found, guest mode only');
  userService = null;
}

let io;

// Initialize Socket.IO
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle authentication
    socket.on('authenticate', async (data) => {
      try {
        const { userId, token } = data;
        
        if (userId && token) {
          // TODO: Verify JWT token here if you have auth middleware
          // const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          socket.userId = userId;
          socket.isAuthenticated = true;
          
          console.log(`✅ User ${userId} authenticated`);
          
          socket.emit('authenticated', {
            success: true,
            message: 'Authentication successful',
            userId: userId
          });
        } else {
          socket.isAuthenticated = false;
          
          console.log(`👤 Guest user connected`);
          
          socket.emit('authenticated', {
            success: true,
            isGuest: true,
            message: 'Guest mode active'
          });
        }
      } catch (error) {
        console.error('Authentication error:', error);
        socket.emit('error', {
          message: 'Authentication failed',
          error: error.message
        });
      }
    });

    // Handle chat messages
    socket.on('send_message', async (data) => {
      try {
        const { message, conversationHistory = [] } = data;

        if (!message || typeof message !== 'string') {
          socket.emit('error', {
            message: 'Invalid message format'
          });
          return;
        }

        // Send typing indicator
        socket.emit('bot_typing', { isTyping: true });

        let userData = null;

        // Get user data if authenticated
        if (socket.isAuthenticated && socket.userId) {
          try {
            const user = await userService.getUserById(socket.userId);
            
            // You can extend this to fetch transactions
            userData = {
              name: user.name,
              email: user.email,
              balance: user.balance,
              // Add transactions if needed
            };
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }

        // Get AI response
        const result = await getChatbotResponse(
          message,
          userData,
          conversationHistory
        );

        // Stop typing indicator
        socket.emit('bot_typing', { isTyping: false });

        // Send response
        socket.emit('bot_response', {
          messageId: Date.now().toString(),
          message: result.response,
          provider: result.provider,
          timestamp: new Date().toISOString(),
          success: result.success
        });

        // Send smart suggestions based on context
        const suggestions = generateContextualSuggestions(message, userData);
        socket.emit('suggestions_update', { suggestions });

      } catch (error) {
        console.error('Chat error:', error);
        
        socket.emit('bot_typing', { isTyping: false });
        socket.emit('bot_response', {
          messageId: Date.now().toString(),
          message: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          success: false,
          isError: true
        });
      }
    });

    // Handle get suggestions
    socket.on('get_suggestions', async () => {
      try {
        let userData = null;
        
        if (socket.isAuthenticated && socket.userId && userService) {
          try {
            const user = await userService.getUserById(socket.userId);
            userData = { isAuthenticated: true };
          } catch (error) {
            console.error('Error fetching user for suggestions:', error.message);
          }
        }

        const suggestions = getSmartSuggestions(userData);
        socket.emit('suggestions_update', { suggestions });
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    });

    // Handle rate message
    socket.on('rate_message', (data) => {
      const { messageId, rating } = data;
      
      // Log rating (you can save to database)
      console.log(`Message ${messageId} rated: ${rating}`);
      
      socket.emit('rating_received', {
        messageId,
        rating,
        success: true
      });
    });

    // Handle clear chat
    socket.on('clear_chat', () => {
      socket.emit('chat_cleared', {
        success: true,
        message: 'Chat history cleared'
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

// Generate contextual suggestions
const generateContextualSuggestions = (message, userData) => {
  const msg = message.toLowerCase();
  
  if (msg.includes('budget')) {
    return [
      "How do I create a monthly budget?",
      "What's the 50/30/20 budgeting rule?",
      "How can I stick to my budget?"
    ];
  } else if (msg.includes('save') || msg.includes('saving')) {
    return [
      "What are the best savings strategies?",
      "How much should I save each month?",
      "Where should I keep my emergency fund?"
    ];
  } else if (msg.includes('invest')) {
    return [
      "What are beginner-friendly investments?",
      "How much should I invest?",
      "What's the difference between stocks and bonds?"
    ];
  } else if (msg.includes('debt')) {
    return [
      "What's the debt snowball method?",
      "Should I pay off debt or invest?",
      "How can I negotiate with creditors?"
    ];
  }
  
  if (userData) {
    return [
      "Show me my spending breakdown",
      "How can I save more money?",
      "What are my top expenses?"
    ];
  }
  
  return [
    "How do I start budgeting?",
    "What are some money-saving tips?",
    "Tell me about emergency funds"
  ];
};

// Get initial suggestions
const getSmartSuggestions = (userData) => {
  const authenticated = [
    "What's my current balance?",
    "Show me my recent transactions",
    "How am I doing financially?",
    "Give me budgeting advice",
    "Where am I spending the most?"
  ];
  
  const guest = [
    "What are some good budgeting tips?",
    "How can I save more money?",
    "What's the best way to track expenses?",
    "How do I set financial goals?",
    "What are some investment basics?"
  ];
  
  return userData?.isAuthenticated ? authenticated : guest;
};

// Get Socket.IO instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};