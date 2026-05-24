const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  display_name: String,
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'partner'],
    default: 'admin',
  },
  permissions: [{
    type: String,
    enum: [
      'view_dashboard', 'manage_users', 'manage_games',
      'manage_payments', 'manage_withdrawals', 'manage_partners',
      'manage_security', 'manage_ads', 'view_reports',
      'manage_payment_gateway', 'edit_entry_fees', 'edit_payouts',
      'lock_unlock_games', 'export_reports',
    ],
  }],
  is_active: {
    type: Boolean,
    default: true,
  },
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
  },
  last_login: Date,
  refresh_tokens: [{
    token: String,
    created_at: { type: Date, default: Date.now },
    expires_at: Date,
  }],
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });

// Pre-save: Hash password
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password_hash = await bcrypt.hash(this.password_hash, salt);
  next();
});

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password_hash);
};

adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.refresh_tokens;
  return obj;
};

// Default permissions by role
const rolePermissions = {
  super_admin: [
    'view_dashboard', 'manage_users', 'manage_games',
    'manage_payments', 'manage_withdrawals', 'manage_partners',
    'manage_security', 'manage_ads', 'view_reports',
    'manage_payment_gateway', 'edit_entry_fees', 'edit_payouts',
    'lock_unlock_games', 'export_reports',
  ],
  admin: [
    'view_dashboard', 'manage_users', 'manage_games',
    'manage_payments', 'manage_withdrawals',
    'manage_security', 'manage_ads', 'view_reports',
    'edit_entry_fees', 'edit_payouts',
    'lock_unlock_games', 'export_reports',
  ],
  partner: [
    'view_dashboard', 'manage_games',
    'edit_entry_fees', 'edit_payouts',
    'view_reports',
  ],
};

adminSchema.statics.getDefaultPermissions = function (role) {
  return rolePermissions[role] || [];
};

module.exports = mongoose.model('Admin', adminSchema);
