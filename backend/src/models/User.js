const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config/env');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\+?[1-9]\d{9,14}$/,
  },
  email: {
    type: String,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  display_name: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  avatar: {
    type: String,
    default: 'default-avatar.png',
  },
  dob: Date,
  is_verified: {
    type: Boolean,
    default: false,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  is_online: {
    type: Boolean,
    default: false,
  },
  kyc_status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  aadhaar_number: {
    type: String,
    encrypted: true,
  },
  pan_number: {
    type: String,
    encrypted: true,
  },
  upi_id: String,
  bank_account: {
    account_number: { type: String, encrypted: true },
    ifsc: String,
    bank_name: String,
    holder_name: String,
  },
  state: String,
  device_info: {
    device_id: String,
    ip_address: String,
    platform: String,
    fcm_token: String,
  },
  stats: {
    total_matches: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    win_streak: { type: Number, default: 0 },
    best_win_streak: { type: Number, default: 0 },
    total_earnings: { type: Number, default: 0 },
    total_deposits: { type: Number, default: 0 },
  },
  refresh_tokens: [{
    token: String,
    created_at: { type: Date, default: Date.now },
    expires_at: Date,
  }],
  is_deleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ username: 1 });
userSchema.index({ state: 1 });
userSchema.index({ 'stats.total_matches': -1 });
userSchema.index({ created_at: -1 });

// Pre-save: Hash password with pepper
userSchema.pre('save', async function (next) {
  if (!this.isModified('password_hash')) return next();
  
  try {
    const pepperedPassword = this.password_hash + config.bcrypt.pepper;
    const salt = await bcrypt.genSalt(config.bcrypt.saltRounds);
    this.password_hash = await bcrypt.hash(pepperedPassword, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  const pepperedPassword = candidatePassword + config.bcrypt.pepper;
  return bcrypt.compare(pepperedPassword, this.password_hash);
};

// Clean sensitive data on toJSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password_hash;
  delete obj.refresh_tokens;
  delete obj.aadhaar_number;
  delete obj.pan_number;
  if (obj.bank_account) {
    delete obj.bank_account.account_number;
  }
  delete obj.device_info;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
