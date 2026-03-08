const mongoose = require('mongoose');

const vaultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    originalName: { type: String, required: true },
    mimeType: {
      type: String,
      required: true,
      enum: [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',                                          // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      ],
    },
    size: { type: Number, required: true }, // bytes
    data: { type: String, required: true }, // base64 encoded
    tags: [{ type: String, trim: true }],
    description: { type: String, trim: true, default: '' },

    // Reserved for RAG pipeline (handled by Python server)
    isProcessedForRAG: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Enforce 16MB limit at schema level
vaultSchema.pre('save', function (next) {
  const MAX_SIZE = 16 * 1024 * 1024; // 16MB
  if (this.size > MAX_SIZE) {
    return next(new Error('File size exceeds 16MB limit'));
  }
  next();
});

module.exports = mongoose.model('Vault', vaultSchema);