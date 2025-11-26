import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from '../services/chatService';

// Connect to socket server
export const connectSocket = createAsyncThunk(
  'chat/connectSocket',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth?.user;
      const token = state.auth?.token;
      
      const userId = user?.id || user?.userId || user?._id;
      
      chatService.connect(userId, token);
      
      return { 
        connected: true,
        userId: userId || null,
        isGuest: !userId
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to connect');
    }
  }
);

// Disconnect from socket
export const disconnectSocket = createAsyncThunk(
  'chat/disconnectSocket',
  async (_, { rejectWithValue }) => {
    try {
      chatService.disconnect();
      return { disconnected: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Send message via socket
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData, { getState, rejectWithValue, dispatch }) => {
    try {
      // Check connection
      if (!chatService.isSocketConnected()) {
        throw new Error('Not connected to chat service');
      }

      // Add user message immediately (optimistic update)
      dispatch(addUserMessage(messageData));
      
      // Get conversation history from state
      const messages = getState().chat.messages;
      const conversationHistory = messages
        .filter(m => m.type === 'user' || m.type === 'bot')
        .filter(m => !m.isError)
        .slice(-10) // Last 10 messages for context
        .map(m => ({ 
          role: m.type === 'user' ? 'user' : 'assistant', 
          content: m.message 
        }));
      
      // Send via socket and wait for response
      const response = await chatService.sendMessage(
        messageData.message,
        conversationHistory
      );
      
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

// Get smart suggestions
export const getSmartSuggestions = createAsyncThunk(
  'chat/getSmartSuggestions',
  async (_, { rejectWithValue }) => {
    try {
      if (!chatService.isSocketConnected()) {
        throw new Error('Not connected to chat service');
      }
      
      chatService.getSuggestions();
      return { requested: true };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to get suggestions');
    }
  }
);

// Rate chat response
export const rateChatResponse = createAsyncThunk(
  'chat/rateChatResponse',
  async ({ messageId, rating, feedback = null }, { rejectWithValue }) => {
    try {
      if (!chatService.isSocketConnected()) {
        throw new Error('Not connected to chat service');
      }
      
      chatService.rateMessage(messageId, rating, feedback);
      return { messageId, rating, feedback };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to rate response');
    }
  }
);

// Clear chat history
export const clearChatHistory = createAsyncThunk(
  'chat/clearChatHistory',
  async (_, { rejectWithValue }) => {
    try {
      if (chatService.isSocketConnected()) {
        chatService.clearChat();
      }
      return { cleared: true };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to clear chat');
    }
  }
);

const initialState = {
  messages: [],
  suggestions: [],
  loading: false,
  isTyping: false,
  error: null,
  connected: false,
  lastMessageId: null,
  sessionStats: {
    messagesCount: 0,
    startTime: null,
    lastActivity: null
  }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Add user message immediately (optimistic update)
    addUserMessage: (state, action) => {
      const userMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        message: action.payload.message,
        timestamp: action.payload.timestamp || new Date().toISOString()
      };
      
      state.messages.push(userMessage);
      state.sessionStats.messagesCount += 1;
      state.sessionStats.lastActivity = userMessage.timestamp;
      
      if (!state.sessionStats.startTime) {
        state.sessionStats.startTime = userMessage.timestamp;
      }
    },

    // Add bot message from socket event
    addBotMessage: (state, action) => {
      const botMessage = {
        id: action.payload.messageId || `bot-${Date.now()}`,
        type: 'bot',
        message: action.payload.message || action.payload.response,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        provider: action.payload.provider || null,
        isError: action.payload.isError || false,
        metadata: action.payload.metadata || null
      };
      
      state.messages.push(botMessage);
      state.lastMessageId = botMessage.id;
      state.sessionStats.lastActivity = botMessage.timestamp;
      state.isTyping = false;
      state.loading = false;
    },

    // Set typing indicator
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },

    // Set connection status
    setConnected: (state, action) => {
      state.connected = action.payload;
      if (!action.payload) {
        state.isTyping = false;
        state.loading = false;
      }
    },

    // Update suggestions from socket
    setSuggestions: (state, action) => {
      state.suggestions = Array.isArray(action.payload) 
        ? action.payload 
        : action.payload.suggestions || [];
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear chat
    clearChat: (state) => {
      state.messages = [];
      state.error = null;
      state.isTyping = false;
      state.loading = false;
      state.lastMessageId = null;
      state.sessionStats = {
        messagesCount: 0,
        startTime: null,
        lastActivity: null
      };
    },

    // Set error
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.isTyping = false;
    },

    // Update message rating
    updateMessageRating: (state, action) => {
      const { messageId, rating } = action.payload;
      const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        state.messages[messageIndex].rating = rating;
        state.messages[messageIndex].rated = true;
      }
    },

    // Remove a message
    removeMessage: (state, action) => {
      const messageId = action.payload;
      state.messages = state.messages.filter(msg => msg.id !== messageId);
    },

    // Reset state
    resetChat: (state) => {
      return { ...initialState };
    }
  },

  extraReducers: (builder) => {
    builder
      // Connect socket
      .addCase(connectSocket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectSocket.fulfilled, (state, action) => {
        state.connected = true;
        state.loading = false;
        state.error = null;
      })
      .addCase(connectSocket.rejected, (state, action) => {
        state.connected = false;
        state.loading = false;
        state.error = action.payload || 'Failed to connect';
      })

      // Disconnect socket
      .addCase(disconnectSocket.fulfilled, (state) => {
        state.connected = false;
        state.isTyping = false;
        state.loading = false;
      })

      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        // Bot message will be added via socket listener (addBotMessage)
        // Just clear loading state
        state.loading = false;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.isTyping = false;
        state.error = action.payload || 'Failed to send message';
        
        // Add error message to chat
        const errorMessage = {
          id: `error-${Date.now()}`,
          type: 'bot',
          message: action.payload || 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true
        };
        
        state.messages.push(errorMessage);
      })

      // Get suggestions
      .addCase(getSmartSuggestions.fulfilled, (state) => {
        // Suggestions will be updated via socket listener (setSuggestions)
      })
      .addCase(getSmartSuggestions.rejected, (state, action) => {
        // Fail silently for suggestions
        console.error('Failed to load suggestions:', action.payload);
      })

      // Rate response
      .addCase(rateChatResponse.fulfilled, (state, action) => {
        const { messageId, rating } = action.payload;
        const messageIndex = state.messages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          state.messages[messageIndex].rating = rating;
          state.messages[messageIndex].rated = true;
        }
      })

      // Clear chat
      .addCase(clearChatHistory.fulfilled, (state) => {
        state.messages = [];
        state.error = null;
        state.isTyping = false;
        state.loading = false;
        state.sessionStats = initialState.sessionStats;
      });
  }
});

export const {
  addUserMessage,
  addBotMessage,
  setTyping,
  setConnected,
  setSuggestions,
  clearError,
  clearChat,
  setError,
  updateMessageRating,
  removeMessage,
  resetChat
} = chatSlice.actions;

export default chatSlice.reducer;