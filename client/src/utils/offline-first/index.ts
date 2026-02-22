// Offline-first setup utility
import { store } from '../../app/store';
import { hydrateFromLocalStorage } from '../../app/transactionSlice';
import { useOnline } from '../../hooks/useOnline';

export const initializeOfflineFirst = async () => {
  try {
    // Hydrate Redux state from localStorage
    await store.dispatch(hydrateFromLocalStorage());

    // Set up online/offline detection
    // This would typically be called in a React component that mounts early
    // For now, we'll just initialize the online status
    const isOnline = navigator.onLine;
    store.dispatch({ type: 'transactions/setOnlineStatus', payload: isOnline });

    console.log('Offline-first system initialized successfully');
  } catch (error) {
    console.error('Failed to initialize offline-first system:', error);
  }
};

// Hook to use in components
export { useOnline };

// Re-export store and actions for convenience
export { store } from '../../app/store';
export {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  syncTransactions,
  hydrateFromLocalStorage,
  selectTransactions,
  selectUnsyncedTransactions,
  selectIsOnline,
  selectLoading,
  selectError,
} from '../../app/transactionSlice';
export { generateGuestId, getGuestId, clearGuestId, migrateGuestData } from '../authGuest';
export { default as SyncManager } from '../syncManager';