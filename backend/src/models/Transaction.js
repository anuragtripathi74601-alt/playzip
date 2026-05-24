const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'match_entry', 'match_win', 'match_loss', 'commission', 'refund', 'ad_reward', 'bonus', 'tds_deduction'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  balance_before: Number,
  balance_after: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  reference_id: String,
  payment_gateway: {
    type: String,
    enum: ['razorpay', 'phonepe', 'paytm', 'upi', 'system', 'admob'],
  },
  gateway_transaction_id: String,
  match_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
  },
  payment_method: {
    type: String,
    enum: ['upi', 'card', 'wallet', 'netbanking', 'system', 'admob', 'bonus'],
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  is_tds_applicable: {
    type: Boolean,
    default: false,
  },
  tds_amount: {
    type: Number,
    default: 0,
  },
  gst_amount: {
    type: Number,
    default: 0,
  },
  settled_at: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

transactionSchema.index({ user_id: 1, created_at: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ match_id: 1 });
transactionSchema.index({ reference_id: 1 });
transactionSchema.index({ created_at: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
