import React from 'react'
import { usePWA } from './usePWA';
import InstallPrompt from './InstallPrompt';
import UpdatePrompt from './UpdatePrompt';
import OfflineIndicator from './OfflineIndicator';

const PWAManager = () => {
  const { isInstallable, updateAvailable, isOnline } = usePWA()

  return (
    <>
      {!isOnline && <OfflineIndicator />}
      {isInstallable && <InstallPrompt />}
      {updateAvailable && <UpdatePrompt />}
    </>
  )
}

export default PWAManager;