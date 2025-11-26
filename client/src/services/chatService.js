import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // Connect to socket server
  connect(userId = null, token = null) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    console.log('Connecting to socket server...');
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
      autoConnect: true
    });

    this.setupEventListeners(userId, token);
    
    return this.socket;
  }

  // Setup socket event listeners
  setupEventListeners(userId, token) {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Authenticate after connection
      this.authenticate(userId, token);
      
      // Emit to custom listeners
      this.emitToListeners('connected', { socketId: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      
      this.emitToListeners('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.emitToListeners('error', { 
          message: 'Failed to connect to chat service. Please refresh the page.' 
        });
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed');
      this.emitToListeners('error', { 
        message: 'Unable to reconnect to chat service' 
      });
    });

    // Server error event
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emitToListeners('error', error);
    });
  }

  // Authenticate user
  authenticate(userId, token) {
    if (!this.socket?.connected) {
      console.warn('Cannot authenticate: socket not connected');
      return;
    }

    // If no token provided, try to get from token getter
    if (!token && typeof getCurrentAuthToken === 'function') {
      token = getCurrentAuthToken();
    }

    console.log('Authenticating...', { userId: userId ? 'present' : 'guest' });
    
    this.socket.emit('authenticate', { 
      userId, 
      token,
      timestamp: new Date().toISOString()
    });
  }

  // Send message to bot
  sendMessage(message, conversationHistory = []) {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected. Please wait...'));
        return;
      }

      if (!message || typeof message !== 'string') {
        reject(new Error('Invalid message'));
        return;
      }

      // Set timeout for response
      const timeout = setTimeout(() => {
        this.socket.off('bot_response', responseHandler);
        reject(new Error('Request timeout. The AI is taking too long to respond.'));
      }, 30000);

      // Listen for bot response (one-time listener)
      const responseHandler = (data) => {
        clearTimeout(timeout);
        resolve(data);
      };

      this.socket.once('bot_response', responseHandler);

      // Send message
      this.socket.emit('send_message', {
        message,
        conversationHistory,
        timestamp: new Date().toISOString()
      });

      console.log('📤 Message sent:', message.substring(0, 50) + '...');
    });
  }

  // Get suggestions
  getSuggestions() {
    if (!this.socket?.connected) {
      console.warn('Cannot get suggestions: socket not connected');
      return;
    }
    
    this.socket.emit('get_suggestions');
    console.log('📋 Requested suggestions');
  }

  // Rate message
  rateMessage(messageId, rating, feedback = null) {
    if (!this.socket?.connected) {
      console.warn('Cannot rate message: socket not connected');
      return;
    }
    
    this.socket.emit('rate_message', { 
      messageId, 
      rating, 
      feedback,
      timestamp: new Date().toISOString()
    });
    
    console.log('⭐ Message rated:', { messageId, rating });
  }

  // Clear chat
  clearChat() {
    if (!this.socket?.connected) {
      console.warn('Cannot clear chat: socket not connected');
      return;
    }
    
    this.socket.emit('clear_chat', {
      timestamp: new Date().toISOString()
    });
    
    console.log('🗑️ Chat clear requested');
  }

  // Listen to events
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket not initialized. Call connect() first.');
      return;
    }

    // Store listener reference for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Add socket listener
    this.socket.on(event, callback);
    
    console.log('👂 Listener added for:', event);
  }

  // Remove event listener
  off(event, callback) {
    if (!this.socket) return;

    this.socket.off(event, callback);

    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }
    
    console.log('👂 Listener removed for:', event);
  }

  // Emit to custom listeners (not socket events)
  emitToListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket...');
      
      // Clean up all listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket.off(event, callback);
        });
      });
      this.listeners.clear();

      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      
      console.log('✅ Socket disconnected and cleaned up');
    }
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Manually reconnect
  reconnect() {
    if (this.socket) {
      console.log('🔄 Manual reconnect triggered');
      this.socket.connect();
    }
  }
}

// Create singleton instance
const chatService = new ChatService();

// Store reference to get current token (for compatibility with store.js)
let getCurrentToken = null;

// Method to set token getter (called from store setup)
export const setTokenGetter = (tokenGetter) => {
  getCurrentToken = tokenGetter;
};

// Get current token (used internally when needed)
export const getCurrentAuthToken = () => {
  return getCurrentToken ? getCurrentToken() : null;
};

export default chatService;