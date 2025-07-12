import React from 'react'
import { MdWifiOff } from 'react-icons/md'
import './styles/OfflineIndicator.css';

const OfflineIndicator = () => {
  return (
    <div className="offline-indicator">
      <MdWifiOff size={16} className="offline-icon" />
      <span>You're offline. Some features may be limited.</span>
    </div>
  )
}

export default OfflineIndicator;