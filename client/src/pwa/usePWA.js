import { useState, useEffect, useCallback } from 'react'

// Global storage to persist across re-mounts
if (!window.pwaState) {
  window.pwaState = {
    deferredPrompt: null,
    isInstallable: false,
    eventReceived: false
  }
}

export const usePWA = () => {
  const [isInstallable, setIsInstallable] = useState(window.pwaState.isInstallable)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(window.pwaState.deferredPrompt)

  // Debug logging
  console.log('usePWA initialized with global state:', {
    isInstallable: window.pwaState.isInstallable,
    hasDeferredPrompt: !!window.pwaState.deferredPrompt,
    eventReceived: window.pwaState.eventReceived
  })

  // Check if app is already installed
  useEffect(() => {
    const checkInstallation = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isPWA = window.navigator.standalone === true
      const isInstalled = isStandalone || isPWA

      console.log('Installation check:', {
        isStandalone,
        isPWA,
        isInstalled
      })

      setIsInstalled(isInstalled)
    }

    checkInstallation()
  }, [])

  // Handle install prompt - only set up once globally
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event received:', e)
      e.preventDefault()
      
      // Store globally
      window.pwaState.deferredPrompt = e
      window.pwaState.isInstallable = true
      window.pwaState.eventReceived = true
      
      // Update local state
      setDeferredPrompt(e)
      setIsInstallable(true)
      
      console.log('Install prompt captured and stored globally')
    }

    const handleAppInstalled = () => {
      console.log('App installed event received')
      
      // Clear global state
      window.pwaState.deferredPrompt = null
      window.pwaState.isInstallable = false
      
      // Update local state
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    // Only add listeners if not already added
    if (!window.pwaListenersAdded) {
      console.log('Adding global event listeners for install prompt')
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)
      window.pwaListenersAdded = true
    } else {
      console.log('Event listeners already added, using existing global state')
      // If listeners already exist, sync with global state
      if (window.pwaState.deferredPrompt) {
        setDeferredPrompt(window.pwaState.deferredPrompt)
        setIsInstallable(window.pwaState.isInstallable)
      }
    }

    return () => {
      // Don't remove listeners on every cleanup to prevent issues with re-mounts
      console.log('usePWA cleanup (listeners kept for persistence)')
    }
  }, [])

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Handle SW updates
  useEffect(() => {
    const handleSWUpdate = () => setUpdateAvailable(true)

    window.addEventListener('sw-update-available', handleSWUpdate)

    return () => {
      window.removeEventListener('sw-update-available', handleSWUpdate)
    }
  }, [])

  // Install app function
  const installApp = useCallback(async () => {
    console.log('installApp called, deferredPrompt:', !!deferredPrompt)
    
    const promptToUse = deferredPrompt || window.pwaState.deferredPrompt
    
    if (!promptToUse) {
      console.warn('No deferred prompt available')
      return false
    }

    try {
      console.log('Showing install prompt...')
      await promptToUse.prompt()
      console.log('Prompt shown, waiting for user choice...')
      
      const { outcome } = await promptToUse.userChoice
      console.log('User choice outcome:', outcome)

      if (outcome === 'accepted') {
        console.log('User accepted install')
        
        // Clear global state
        window.pwaState.deferredPrompt = null
        window.pwaState.isInstallable = false
        
        // Update local state
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      } else {
        console.log('User dismissed install')
        return false
      }
    } catch (error) {
      console.error('Install failed:', error)
      return false
    }
  }, [deferredPrompt])

  // Update app function
  const updateApp = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      } catch (error) {
        console.error('Service worker update failed:', error)
        throw error
      }
    }
  }, [])

  // Log state changes
  useEffect(() => {
    console.log('PWA State changed:', {
      isInstallable,
      isInstalled,
      isOnline,
      updateAvailable,
      hasDeferredPrompt: !!deferredPrompt,
      globalState: {
        hasGlobalPrompt: !!window.pwaState.deferredPrompt,
        globalInstallable: window.pwaState.isInstallable
      }
    })
  }, [isInstallable, isInstalled, isOnline, updateAvailable, deferredPrompt])

  return {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    installApp,
    updateApp
  }
}