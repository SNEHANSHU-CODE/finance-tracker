import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FaHeadset, 
  FaTimes, 
  FaPaperPlane, 
  FaRobot, 
  FaUser, 
  FaThumbsUp, 
  FaThumbsDown,
  FaTrash,
  FaMinus,
  FaExpand,
  FaCompress,
  FaSpinner
} from 'react-icons/fa';
import { 
  sendMessage, 
  getSmartSuggestions, 
  clearError, 
  clearChat,
  rateChatResponse,
  connectSocket,
  disconnectSocket,
  addBotMessage,
  setTyping,
  setSuggestions,
  setConnected,
  setError
} from '../app/chatSlice';
import chatService from '../services/chatService';
import './styles/ChatBot.css';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const { 
    messages = [], 
    suggestions = [], 
    loading = false, 
    error = null, 
    isTyping = false, 
    connected = false 
  } = useSelector(state => state.chat || {});
  
  const { user = null } = useSelector(state => state.auth || {});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize socket connection
  useEffect(() => {
    // Connect socket when component mounts
    dispatch(connectSocket());

    // Setup socket event listeners
    chatService.on('authenticated', (data) => {
      console.log('Authenticated:', data);
      dispatch(setConnected(true));
    });

    chatService.on('bot_response', (data) => {
      dispatch(addBotMessage(data));
    });

    chatService.on('bot_typing', (data) => {
      dispatch(setTyping(data.isTyping));
    });

    chatService.on('suggestions_update', (data) => {
      dispatch(setSuggestions(data.suggestions || []));
    });

    chatService.on('error', (errorData) => {
      dispatch(setError(errorData.message || 'An error occurred'));
    });

    chatService.on('chat_cleared', () => {
      console.log('Chat cleared on server');
    });

    chatService.on('rating_received', (data) => {
      console.log('Rating received:', data);
    });

    // Cleanup on unmount
    return () => {
      dispatch(disconnectSocket());
    };
  }, [dispatch]);

  // Get suggestions when chat opens
  useEffect(() => {
    if (isOpen && suggestions.length === 0 && connected) {
      dispatch(getSmartSuggestions());
    }
  }, [isOpen, connected, dispatch, suggestions.length]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading || !connected) return;

    const messageData = {
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    dispatch(sendMessage(messageData));
    setMessage('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
    if (error) {
      dispatch(clearError());
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsMinimized(false);
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
      dispatch(clearChat());
      setShowSuggestions(true);
    }
  };

  const handleRateMessage = (messageId, rating) => {
    dispatch(rateChatResponse({ messageId, rating }));
  };

  const formatMessage = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  const getChatWindowClasses = () => {
    let classes = 'chat-window';
    if (isFullscreen) classes += ' fullscreen';
    if (isMinimized) classes += ' minimized';
    return classes;
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <div className="chat-toggle-button" onClick={toggleChat}>
          <FaHeadset className="chat-icon" />
          <span className="chat-tooltip">Need help? Chat with AI Assistant</span>
          {user?.isGuest && <span className="guest-indicator">Guest Mode</span>}
          {!connected && <span className="disconnected-indicator">●</span>}
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={getChatWindowClasses()}>
          {/* Chat Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <FaRobot className="bot-icon" />
              <div className="chat-title">
                <h4>Finance AI Assistant</h4>
                <span className="chat-status">
                  {!connected ? (
                    <span className="status-connecting">● Connecting...</span>
                  ) : user?.isGuest ? (
                    '🟢 Guest Mode - Limited Access'
                  ) : (
                    `🟢 Welcome, ${user?.name || 'User'}`
                  )}
                </span>
              </div>
            </div>
            <div className="chat-controls">
              {!isFullscreen && (
                <button 
                  className="control-btn minimize" 
                  onClick={minimizeChat}
                  title="Minimize"
                >
                  <FaMinus />
                </button>
              )}
              <button 
                className="control-btn fullscreen" 
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </button>
              <button 
                className="control-btn clear" 
                onClick={handleClearChat}
                title="Clear Chat"
                disabled={messages.length === 0}
              >
                <FaTrash />
              </button>
              <button 
                className="control-btn close" 
                onClick={toggleChat}
                title="Close Chat"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Chat Body */}
              <div className="chat-body">
                {/* Welcome Message */}
                {messages.length === 0 && (
                  <div className="welcome-message">
                    <FaRobot className="welcome-icon" />
                    <h3>Hi there! 👋</h3>
                    <p>I'm your Finance AI Assistant. I can help you with:</p>
                    <ul>
                      <li>💰 Budgeting and expense tracking</li>
                      <li>📈 Investment advice and strategies</li>
                      <li>🎯 Setting and achieving financial goals</li>
                      <li>💡 Money-saving tips and tricks</li>
                      {!user?.isGuest && <li>📊 Analyzing your personal financial data</li>}
                    </ul>
                    <p>What would you like to know?</p>
                  </div>
                )}

                {/* Messages */}
                <div className="messages-container">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.type} ${msg.isError ? 'error' : ''}`}>
                      <div className="message-avatar">
                        {msg.type === 'user' ? <FaUser /> : <FaRobot />}
                      </div>
                      <div className="message-content">
                        <div className="message-text">
                          {formatMessage(msg.message)}
                          {msg.provider && (
                            <span className="provider-badge">{msg.provider}</span>
                          )}
                        </div>
                        <div className="message-meta">
                          <span className="message-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {msg.type === 'bot' && !msg.isError && !msg.rated && (
                            <div className="message-rating">
                              <button 
                                className="rating-btn positive"
                                onClick={() => handleRateMessage(msg.id, 'positive')}
                                title="Helpful"
                              >
                                <FaThumbsUp />
                              </button>
                              <button 
                                className="rating-btn negative"
                                onClick={() => handleRateMessage(msg.id, 'negative')}
                                title="Not helpful"
                              >
                                <FaThumbsDown />
                              </button>
                            </div>
                          )}
                          {msg.rated && (
                            <span className="rated-indicator">
                              {msg.rating === 'positive' ? '👍 Helpful' : '👎 Not helpful'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="message bot typing">
                      <div className="message-avatar">
                        <FaRobot />
                      </div>
                      <div className="message-content">
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Error Display */}
                {error && (
                  <div className="error-message">
                    <span>⚠️ {error}</span>
                    <button onClick={() => dispatch(clearError())} className="error-close">
                      <FaTimes />
                    </button>
                  </div>
                )}

                {/* Smart Suggestions */}
                {showSuggestions && suggestions.length > 0 && messages.length === 0 && (
                  <div className="suggestions-container">
                    <h5>💡 Try asking about:</h5>
                    <div className="suggestions-grid">
                      {suggestions.slice(0, 4).map((suggestion, index) => (
                        <button
                          key={index}
                          className="suggestion-button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={!connected}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="chat-input-container">
                <form onSubmit={handleSendMessage} className="chat-form">
                  <div className="input-wrapper">
                    <input
                      ref={inputRef}
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        !connected 
                          ? "Connecting..." 
                          : user?.isGuest 
                          ? "Ask general finance questions..." 
                          : "Ask me anything about your finances..."
                      }
                      disabled={loading || !connected}
                      maxLength={500}
                      className="chat-input"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim() || loading || !connected}
                      className="send-button"
                      title="Send message"
                    >
                      {loading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                    </button>
                  </div>
                  <div className="input-footer">
                    <span className="character-count">
                      {message.length}/500
                    </span>
                    {!connected && (
                      <span className="connection-status">
                        ⚠️ Disconnected
                      </span>
                    )}
                    {user?.isGuest && connected && (
                      <span className="guest-notice">
                        Limited access • <a href="/login">Login for full features</a>
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;