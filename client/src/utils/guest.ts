const GUEST_ID_KEY = 'financeTracker_guestId';

export const generateGuestId = (): string => {
  const guestId = `guest_${crypto.randomUUID()}`;
  try {
    localStorage.setItem(GUEST_ID_KEY, guestId);
  } catch (error) {
    console.warn('Failed to save guest ID to localStorage:', error);
  }
  return guestId;
};

export const getGuestId = (): string | null => {
  try {
    return localStorage.getItem(GUEST_ID_KEY);
  } catch (error) {
    console.warn('Failed to get guest ID from localStorage:', error);
    return null;
  }
};

export const clearGuestId = (): void => {
  try {
    localStorage.removeItem(GUEST_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear guest ID from localStorage:', error);
  }
};

export const migrateGuestData = (oldGuestId: string, newUserId: string): void => {
  try {
    const stored = localStorage.getItem('financeTracker_transactions');
    if (!stored) return;

    const transactions = JSON.parse(stored);
    const migratedTransactions = transactions.map((t: any) =>
      t.userId === oldGuestId ? { ...t, userId: newUserId, synced: false } : t
    );

    localStorage.setItem('financeTracker_transactions', JSON.stringify(migratedTransactions));
    clearGuestId();
  } catch (error) {
    console.error('Failed to migrate guest data:', error);
  }
};