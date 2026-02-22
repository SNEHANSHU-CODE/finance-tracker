const GUEST_ID_KEY = 'financeTracker_guestId';

export const generateGuestId = () => {
  const guestId = `guest_${crypto.randomUUID()}`;
  try {
    localStorage.setItem(GUEST_ID_KEY, guestId);
  } catch (error) {
    console.warn('Failed to save guest ID to localStorage:', error);
  }
  return guestId;
};

export const getGuestId = () => {
  try {
    return localStorage.getItem(GUEST_ID_KEY);
  } catch (error) {
    console.warn('Failed to get guest ID from localStorage:', error);
    return null;
  }
};

export const clearGuestId = () => {
  try {
    localStorage.removeItem(GUEST_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear guest ID from localStorage:', error);
  }
};

export const migrateGuestData = (oldGuestId, newUserId) => {
  try {
    const stored = localStorage.getItem('financeTracker_transactions');
    if (!stored) return;

    const transactions = JSON.parse(stored);
    const migratedTransactions = transactions.map((t) =>
      t.userId === oldGuestId ? { ...t, userId: newUserId, synced: false } : t
    );

    localStorage.setItem('financeTracker_transactions', JSON.stringify(migratedTransactions));
  } catch (error) {
    console.warn('Failed to migrate guest data:', error);
  }
};
