// Converted from TypeScript to JavaScript
// Note: Remove type annotations and interfaces

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncQueue = [];
  }

  async sync(transactions) {
    if (this.isSyncing) {
      // Queue the sync request
      return new Promise((resolve) => {
        this.syncQueue.push(...transactions);
        // For now, resolve immediately - in production you'd want to wait for the queued sync
        resolve({ synced: [], failed: transactions, errors: ['Sync already in progress'] });
      });
    }

    this.isSyncing = true;

    try {
      const result = await this.performSync(transactions);

      // Process queued syncs
      if (this.syncQueue.length > 0) {
        const queuedTransactions = [...this.syncQueue];
        this.syncQueue = [];
        // Fire and forget - don't wait for queued syncs
        this.performSync(queuedTransactions).catch(error =>
          console.error('Queued sync failed:', error)
        );
      }

      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  async performSync(transactions) {
    // Placeholder: Replace with actual sync logic (API call, etc.)
    // Simulate all transactions as synced
    return {
      synced: transactions,
      failed: [],
      errors: []
    };
  }
}

export default SyncManager;
