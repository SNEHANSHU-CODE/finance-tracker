import React from 'react'
import './styles/OfflineIndicator.css';

const OfflineIndicator = () => {
  return (
    <div className="offline-indicator">
      <span className="offline-icon">📱</span>
      <span>You're offline. Some features may be limited.</span>
    </div>
  )
}

export default OfflineIndicator;
