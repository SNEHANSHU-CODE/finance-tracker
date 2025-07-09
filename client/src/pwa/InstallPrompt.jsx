import React, { useState, useEffect } from 'react'
import { usePWA } from './usePWA';

const InstallPrompt = () => {
  const { installApp } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Check if user recently dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      setIsVisible(false)
    } else {
      setIsVisible(true)
    }
  }, [])

  const handleInstall = async () => {
    setIsInstalling(true)
    const success = await installApp()
    if (success) {
      setIsVisible(false)
    }
    setIsInstalling(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!isVisible) return null

  return (
    <div className="install-prompt">
      <div className="install-content">
        <h3>Install Finance Tracker</h3>
        <p>Get quick access and offline functionality</p>
        <div className="install-actions">
          <button 
            onClick={handleInstall}
            disabled={isInstalling}
            className="install-btn-primary"
          >
            {isInstalling ? 'Installing...' : 'Install App'}
          </button>
          <button 
            onClick={handleDismiss}
            className="install-btn-secondary"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt;