const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  locked_balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  total_deposited: {
    type: Number,
    default: 0,
  },
  total_withdrawn: {
    type: Number,
    default: 0,
  },
  total_won: {
    type: Number,
    default: 0,
  },
  total_lost: {
    type: Number,
    default: 0,
  },
  total_commission_paid: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

walletSchema.index({ user_id: 1 });

// Virtual: available balance
walletSchema.virtual('available_balance').get(function () {
  return this.balance + this.locked_balance;
});

walletSchema.set('toJSON', { virtuals: true });
walletSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Wallet', walletSchema);
