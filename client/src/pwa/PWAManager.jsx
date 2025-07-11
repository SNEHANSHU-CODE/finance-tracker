// Updated PWAManager.jsx
import React from 'react'
import { usePWA } from './usePWA';
import InstallPrompt from './InstallPrompt';
import UpdatePrompt from './UpdatePrompt';
import OfflineIndicator from './OfflineIndicator';
import './styles/PWAManager.css';

const PWAManager = () => {
  const { isInstallable, updateAvailable, isOnline } = usePWA()

  return (
    <div className="pwa-manager">
      {!isOnline && <OfflineIndicator />}
      {isInstallable && <InstallPrompt />}
      {updateAvailable && <UpdatePrompt />}
    </div>
  )
}

export default PWAManager;