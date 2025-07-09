export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      let registration = await navigator.serviceWorker.getRegistration();

      // If not registered, register it manually
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent('sw-update-available'));
            }
          });
        }
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });

      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
};
