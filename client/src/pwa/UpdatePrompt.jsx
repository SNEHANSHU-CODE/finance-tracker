// Updated UpdatePrompt.jsx
import React, { useState } from 'react'
import { usePWA } from './usePWA';
import './styles/UpdatePrompt.css';

const UpdatePrompt = () => {
  const { updateApp, updateAvailable } = usePWA()
  const [isVisible, setIsVisible] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      await updateApp()
      setIsVisible(false)
    } catch (error) {
      console.error('Update error:', error)
      setIsUpdating(false)
    }
  }

  const handleLater = () => {
    setIsVisible(false)
  }

  if (!updateAvailable || !isVisible) return null

  return (
    <div className="update-prompt">
      <div className="update-content">
        <h3>Update Available</h3>
        <p>A new version with improvements is ready</p>
        <div className="update-actions">
          <button 
            onClick={handleUpdate} 
            className={`update-btn update-btn-primary ${isUpdating ? 'updating' : ''}`}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update Now'}
          </button>
          <button 
            onClick={handleLater} 
            className="update-btn update-btn-secondary"
            disabled={isUpdating}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdatePrompt;