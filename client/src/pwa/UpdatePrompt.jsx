import React, { useState } from 'react'
import { usePWA } from './usePWA';

const UpdatePrompt = () => {
  const { updateApp } = usePWA()
  const [isVisible, setIsVisible] = useState(true)

  const handleUpdate = () => {
    updateApp()
    setIsVisible(false)
  }

  const handleLater = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="update-prompt">
      <div className="update-content">
        <h3>Update Available</h3>
        <p>A new version with improvements is ready</p>
        <div className="update-actions">
          <button onClick={handleUpdate} className="update-btn-primary">
            Update Now
          </button>
          <button onClick={handleLater} className="update-btn-secondary">
            Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdatePrompt;