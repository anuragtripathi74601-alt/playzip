const mongoose = require('mongoose');

const gameConfigSchema = new mongoose.Schema({
  game_type: {
    type: String,
    enum: ['pool', 'snooker', 'chess'],
    required: true,
    unique: true,
  },
  is_locked: {
    type: Boolean,
    default: false,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  display_name: String,
  icon_url: String,
  levels: [{
    name: {
      type: String,
      enum: ['free', 'starter', 'standard', 'pro', 'advanced', 'elite'],
    },
    entry_fee: { type: Number, default: 0 },
    winner_payout: { type: Number, default: 0 },
    platform_cut: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
  }],
  time_options: {
    type: [Number],
    default: [5, 10, 15, 0], // Chess time options in minutes, 0 = unlimited
  },
  rules_version: {
    type: String,
    default: '1.0.0',
  },
  min_players: {
    type: Number,
    default: 2,
  },
  max_players: {
    type: Number,
    default: 2,
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

gameConfigSchema.index({ game_type: 1 });

// Default configurations
gameConfigSchema.statics.getDefaults = function (gameType) {
  const defaults = {
    pool: {
      game_type: 'pool',
      display_name: 'Pool',
      is_locked: false,
      levels: [
        { name: 'free', entry_fee: 0, winner_payout: 0, platform_cut: 0 },
        { name: 'starter', entry_fee: 50, winner_payout: 80, platform_cut: 20 },
        { name: 'standard', entry_fee: 100, winner_payout: 170, platform_cut: 30 },
        { name: 'pro', entry_fee: 200, winner_payout: 350, platform_cut: 50 },
        { name: 'advanced', entry_fee: 500, winner_payout: 750, platform_cut: 250 },
        { name: 'elite', entry_fee: 1000, winner_payout: 1600, platform_cut: 400 },
      ],
    },
    snooker: {
      game_type: 'snooker',
      display_name: 'Snooker',
      is_locked: false,
      levels: [
        { name: 'free', entry_fee: 0, winner_payout: 0, platform_cut: 0 },
        { name: 'starter', entry_fee: 50, winner_payout: 80, platform_cut: 20 },
        { name: 'standard', entry_fee: 100, winner_payout: 170, platform_cut: 30 },
        { name: 'pro', entry_fee: 200, winner_payout: 350, platform_cut: 50 },
        { name: 'advanced', entry_fee: 500, winner_payout: 750, platform_cut: 250 },
        { name: 'elite', entry_fee: 1000, winner_payout: 1600, platform_cut: 400 },
      ],
    },
    chess: {
      game_type: 'chess',
      display_name: 'Chess',
      is_locked: false,
      time_options: [5, 10, 15, 0],
      levels: [
        { name: 'free', entry_fee: 0, winner_payout: 0, platform_cut: 0 },
        { name: 'starter', entry_fee: 50, winner_payout: 80, platform_cut: 20 },
        { name: 'standard', entry_fee: 100, winner_payout: 170, platform_cut: 30 },
        { name: 'pro', entry_fee: 200, winner_payout: 350, platform_cut: 50 },
        { name: 'advanced', entry_fee: 500, winner_payout: 750, platform_cut: 250 },
        { name: 'elite', entry_fee: 1000, winner_payout: 1600, platform_cut: 400 },
      ],
    },
  };
  return defaults[gameType] || null;
};

module.exports = mongoose.model('GameConfig', gameConfigSchema);
