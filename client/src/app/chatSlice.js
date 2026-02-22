import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatService from '../services/chatService';

// ==== ASYNC THUNKS ====

export const connectSocket = createAsyncThunk(
  'chat/connectSocket',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const user = state.auth?.user;
      const token = state.auth?.accessToken;
      const userId = user?.id || user?.userId || user?._id;

      chatService.connect(userId, token);

      return {
        connected: true,
        userId: userId || null,
        isGuest: !userId || !token,
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to connect');
    }
  }
);

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

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const messages = state.chat?.messages || [];

      const messageText = typeof messageData === 'string' ? messageData : messageData.message;

      if (!messageText || typeof messageText !== 'string' || !messageText.trim()) {
        throw new Error('Invalid message');
      }

      // Get last 10 messages for context
      const conversationHistory = messages
        .filter(m => (m.type === 'user' || m.type === 'bot') && !m.isError)
        .slice(-10)
        .map(m => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.message,
        }));

      // Ensure socket is connected
      if (!chatService.isSocketConnected()) {
        const user = state.auth?.user;
        const token = state.auth?.accessToken;
        const userId = user?.id || user?.userId || user?._id;
        chatService.connect(userId, token);

        let connected = false;
        for (let i = 0; i < 50; i++) {
          if (chatService.isSocketConnected()) {
            connected = true;
            break;
          }
          await new Promise(r => setTimeout(r, 100));
        }

        if (!connected) {
          throw new Error('Chat service not available');
        }
      }

      // Send message — resolves immediately with { sent: true }
      // Bot response arrives independently via the 'bot_response' socket event
      // and is handled in ChatBot.jsx via dispatch(addBotMessage(data))
      const result = await chatService.sendMessage(messageText, conversationHistory);
      return result;

    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

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
      return rejectWithValue(error.message);
    }
  }
);

export const rateChatResponse = createAsyncThunk(
  'chat/rateChatResponse',
  async ({ messageId, rating, feedback }, { rejectWithValue }) => {
    try {
      if (!chatService.isSocketConnected()) {
        throw new Error('Not connected to chat service');
      }
      if (!['up', 'down'].includes(rating)) {
        throw new Error('Invalid rating');
      }
      chatService.rateMessage(messageId, rating, feedback);
      return { messageId, rating, feedback };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const clearChatHistory = createAsyncThunk(
  'chat/clearChatHistory',
  async (_, { rejectWithValue }) => {
    try {
      if (chatService.isSocketConnected()) {
        chatService.clearChat();
      }
      return { cleared: true };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ==== INITIAL STATE ====

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
    lastActivity: null,
  },
};

// ==== SLICE ====

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage: (state, action) => {
      const userMessage = {
        id: `user-${Date.now()}-${Math.random()}`,
        type: 'user',
        message: action.payload.message,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        rated: false,
      };
      state.messages.push(userMessage);
      state.sessionStats.messagesCount += 1;
      state.sessionStats.lastActivity = userMessage.timestamp;
      if (!state.sessionStats.startTime) {
        state.sessionStats.startTime = userMessage.timestamp;
      }
    },

    // Bot messages arrive ONLY from socket events (bot_response).
    // chatService.sendMessage() resolves immediately; the actual response
    // comes asynchronously via ChatBot.jsx → dispatch(addBotMessage(data)).
    addBotMessage: (state, action) => {
      const botMessage = {
        id: action.payload.messageId || `bot-${Date.now()}`,
        type: 'bot',
        message: action.payload.message || action.payload.response,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        provider: action.payload.provider || null,
        isError: action.payload.isError || false,
        metadata: action.payload.metadata || null,
        rated: false,
        rating: null,
      };

      // Deduplication guard
      const exists = state.messages.some(m => m.id === botMessage.id);
      if (!exists) {
        state.messages.push(botMessage);
        state.lastMessageId = botMessage.id;
        state.sessionStats.lastActivity = botMessage.timestamp;
      } else {
        console.warn('[chatSlice] Duplicate bot message, skipping:', botMessage.id);
      }

      // Always clear typing/loading when a bot message arrives
      state.isTyping = false;
      state.loading = false;
    },

    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },

    setConnected: (state, action) => {
      state.connected = action.payload;
      if (!action.payload) {
        state.isTyping = false;
        state.loading = false;
      }
    },

    setSuggestions: (state, action) => {
      state.suggestions = Array.isArray(action.payload)
        ? action.payload
        : (action.payload?.suggestions || []);
    },

    clearError: (state) => {
      state.error = null;
    },

    clearChat: (state) => {
      state.messages = [];
      state.error = null;
      state.isTyping = false;
      state.loading = false;
      state.lastMessageId = null;
      state.sessionStats = { ...initialState.sessionStats };
    },

    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
      state.isTyping = false;
    },

    updateMessageRating: (state, action) => {
      const { messageId, rating } = action.payload;
      const message = state.messages.find(m => m.id === messageId);
      if (message) {
        message.rating = rating;
        message.rated = true;
      }
    },

    removeMessage: (state, action) => {
      state.messages = state.messages.filter(m => m.id !== action.payload);
    },

    resetChat: () => initialState,
  },

  extraReducers: (builder) => {
    builder
      // Connect socket
      .addCase(connectSocket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectSocket.fulfilled, (state) => {
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
      // fulfilled: message was emitted to server; loading stays true until
      //            bot_response arrives via socket and addBotMessage clears it.
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        // Message was sent successfully to the socket.
        // Do NOT clear loading/typing here — addBotMessage will do that
        // when the actual response arrives.
        // Do NOT add any bot message here — it arrives via socket.
      })
      .addCase(sendMessage.rejected, (state, action) => {
        // Only fires when the emit itself failed (not connected, invalid msg, etc.)
        // Do NOT add a bot error message here — show it in the error banner instead.
        state.loading = false;
        state.isTyping = false;
        state.error = action.payload || 'Failed to send message';
      })

      // Get suggestions — fail silently
      .addCase(getSmartSuggestions.rejected, () => {})

      // Rate response
      .addCase(rateChatResponse.fulfilled, (state, action) => {
        const { messageId, rating } = action.payload;
        const message = state.messages.find(m => m.id === messageId);
        if (message) {
          message.rating = rating;
          message.rated = true;
        }
      })

      // Clear chat
      .addCase(clearChatHistory.fulfilled, (state) => {
        state.messages = [];
        state.error = null;
        state.isTyping = false;
        state.loading = false;
        state.sessionStats = { ...initialState.sessionStats };
      });
  },
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
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;