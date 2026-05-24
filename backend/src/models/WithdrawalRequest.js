const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
  },
  payment_method: {
    type: String,
    enum: ['upi', 'bank_transfer'],
    required: true,
  },
  upi_id: String,
  bank_account: {
    account_number: String,
    ifsc: String,
    bank_name: String,
    holder_name: String,
  },
  transaction_id: String,
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  admin_notes: String,
  user_notes: String,
  processed_at: Date,
  completed_at: Date,
  rejected_reason: String,
  tds_deducted: {
    type: Number,
    default: 0,
  },
  net_amount: {
    type: Number,
  },
  settlement_utr: String,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

withdrawalRequestSchema.index({ user_id: 1, created_at: -1 });
withdrawalRequestSchema.index({ status: 1, created_at: -1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
