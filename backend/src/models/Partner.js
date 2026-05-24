const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  allowed_games: [{
    type: String,
    enum: ['pool', 'snooker', 'chess'],
  }],
  allowed_levels: [{
    type: String,
    enum: ['free', 'starter', 'standard', 'pro', 'advanced', 'elite'],
  }],
  commission_share: {
    type: Number,
    default: 10,
    min: 0,
    max: 100,
  },
  permissions: {
    can_edit_entry_fees: { type: Boolean, default: false },
    can_edit_payouts: { type: Boolean, default: false },
    can_lock_unlock_games: { type: Boolean, default: false },
    can_view_reports: { type: Boolean, default: true },
  },
  total_earnings: {
    type: Number,
    default: 0,
  },
  this_month_earnings: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  notes: String,
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

partnerSchema.index({ email: 1 });
partnerSchema.index({ admin_id: 1 });
partnerSchema.index({ is_active: 1 });

partnerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  return obj;
};

module.exports = mongoose.model('Partner', partnerSchema);
