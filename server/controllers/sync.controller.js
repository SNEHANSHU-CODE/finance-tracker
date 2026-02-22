const Transaction = require('../models/Transaction');

const syncTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;
    const userId = req.user.userId;

    if (!Array.isArray(transactions)) {
      return res.status(400).json({ message: 'Transactions must be an array' });
    }

    if (transactions.length === 0) {
      return res.status(200).json({ syncedIds: [] });
    }

    const syncedIds = [];
    const errors = [];

    // Process transactions in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const batchResults = await processBatch(batch, userId);
      syncedIds.push(...batchResults.syncedIds);
      errors.push(...batchResults.errors);
    }

    // Log errors but don't fail the entire sync
    if (errors.length > 0) {
      console.warn('Sync errors:', errors);
    }

    res.status(200).json({ syncedIds });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Internal server error during sync' });
  }
};

const processBatch = async (batch, userId) => {
  const syncedIds = [];
  const errors = [];

  for (const transaction of batch) {
    try {
      await syncSingleTransaction(transaction, userId);
      syncedIds.push(transaction.clientId);
    } catch (error) {
      errors.push({
        clientId: transaction.clientId,
        error: error.message
      });
    }
  }

  return { syncedIds, errors };
};

const syncSingleTransaction = async (transactionData, userId) => {
  const { clientId, type, amount, note, date, updatedAt } = transactionData;

  // Validate required fields
  if (!clientId || !type || amount === undefined || !date || updatedAt === undefined) {
    throw new Error('Missing required fields');
  }

  if (!['income', 'expense'].includes(type)) {
    throw new Error('Invalid transaction type');
  }

  if (typeof amount !== 'number' || amount < 0) {
    throw new Error('Invalid amount');
  }

  // Check if transaction already exists
  const existingTransaction = await Transaction.findOne({
    userId,
    clientId
  });

  if (!existingTransaction) {
    // Insert new transaction
    await Transaction.create({
      clientId,
      userId,
      type,
      amount,
      note,
      date,
      updatedAt
    });
  } else {
    // Compare updatedAt timestamps
    if (updatedAt > existingTransaction.updatedAt) {
      // Client data is newer, update server
      await Transaction.findByIdAndUpdate(existingTransaction._id, {
        type,
        amount,
        note,
        date,
        updatedAt
      });
    }
    // If server data is newer or equal, ignore client data
  }
};

module.exports = {
  syncTransactions
};