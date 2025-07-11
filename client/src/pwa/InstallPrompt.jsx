// Updated InstallPrompt.jsx
import React, { useState, useEffect } from 'react'
import { usePWA } from './usePWA';
import './styles/InstallPrompt.css';

const InstallPrompt = () => {
  const { installApp, isInstallable } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [dismissedAt, setDismissedAt] = useState(null)

  // Debug logging
  console.log('InstallPrompt render:', {
    isInstallable,
    isVisible,
    dismissedAt,
    isInstalling,
    component: 'InstallPrompt'
  })

  // Initialize dismissed timestamp from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('install-prompt-dismissed')
      console.log('InstallPrompt: Stored dismissed timestamp:', stored)
      if (stored) {
        setDismissedAt(parseInt(stored))
      }
    } catch (error) {
      console.error('InstallPrompt: Error reading from localStorage:', error)
    }
  }, [])

  // Show prompt logic
  useEffect(() => {
    console.log('InstallPrompt: Show prompt logic triggered:', { isInstallable, dismissedAt })
    
    if (!isInstallable) {
      console.log('InstallPrompt: Setting isVisible to false - not installable')
      setIsVisible(false)
      return
    }

    const weekAgo = 7 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const timeSinceDismissed = dismissedAt ? now - dismissedAt : null

    console.log('InstallPrompt: Dismissal check:', {
      dismissedAt,
      timeSinceDismissed,
      weekAgo,
      shouldShow: !dismissedAt || timeSinceDismissed >= weekAgo
    })

    if (dismissedAt && timeSinceDismissed < weekAgo) {
      console.log('InstallPrompt: Setting isVisible to false - dismissed recently')
      setIsVisible(false)
    } else {
      console.log('InstallPrompt: Setting isVisible to true - should show')
      setIsVisible(true)
    }
  }, [isInstallable, dismissedAt])

  const handleInstall = async () => {
    console.log('InstallPrompt: Install button clicked')
    setIsInstalling(true)
    try {
      const success = await installApp()
      console.log('InstallPrompt: Install success:', success)
      if (success) {
        setIsVisible(false)
      }
    } catch (error) {
      console.error('InstallPrompt: Install error:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    console.log('InstallPrompt: Dismiss button clicked')
    setIsVisible(false)
    const timestamp = Date.now()
    setDismissedAt(timestamp)
    try {
      localStorage.setItem('install-prompt-dismissed', timestamp.toString())
      console.log('InstallPrompt: Dismissed timestamp saved:', timestamp)
    } catch (error) {
      console.error('InstallPrompt: Error writing to localStorage:', error)
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="install-prompt">
      <div className="install-content">
        <h3>Install Finance Tracker</h3>
        <p>Get quick access to Finance Tracker</p>
        <div className="install-actions">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className={`install-btn install-btn-primary ${isInstalling ? 'installing' : ''}`}
          >
            {isInstalling ? 'Installing...' : 'Install App'}
          </button>
          <button
            onClick={handleDismiss}
            className="install-btn install-btn-secondary"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default InstallPrompt;