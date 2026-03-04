const mongoose = require('mongoose');

const categoryLimitSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  limit: { type: Number, required: true, min: [1, 'Limit must be greater than 0'] }
}, { _id: false });

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  month: { type: Number, required: true, min: 1, max: 12 },
  year:  { type: Number, required: true, min: 2020 },
  categories:  { type: [categoryLimitSchema], required: true },
  totalBudget: { type: Number, required: true, min: 0 }
}, { timestamps: true });

// One budget doc per user per month/year
budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);