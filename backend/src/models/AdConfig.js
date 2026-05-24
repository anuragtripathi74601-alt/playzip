const mongoose = require('mongoose');

const adConfigSchema = new mongoose.Schema({
  ad_type: {
    type: String,
    enum: ['banner', 'interstitial', 'rewarded', 'native'],
    required: true,
    unique: true,
  },
  placements: [{
    location: {
      type: String,
      enum: ['home', 'game_start', 'game_end', 'result_screen', 'matchmaking', 'leaderboard', 'login', 'profile'],
    },
    is_enabled: { type: Boolean, default: true },
    ad_unit_id_android: String,
    ad_unit_id_ios: String,
    frequency_cap: { type: Number, default: 0 }, // 0 = no cap
  }],
  rewarded_ad_config: {
    coins_min: { type: Number, default: 1 },
    coins_max: { type: Number, default: 5 },
    cooldown_minutes: { type: Number, default: 5 },
    daily_limit: { type: Number, default: 20 },
  },
  test_mode: {
    type: Boolean,
    default: process.env.NODE_ENV === 'development',
  },
  is_global_enabled: {
    type: Boolean,
    default: true,
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

adConfigSchema.index({ ad_type: 1 });

// Default ad configs
adConfigSchema.statics.getDefaults = function () {
  return [
    {
      ad_type: 'banner',
      placements: [
        { location: 'home', is_enabled: true },
        { location: 'matchmaking', is_enabled: true },
        { location: 'leaderboard', is_enabled: true },
      ],
    },
    {
      ad_type: 'interstitial',
      placements: [
        { location: 'game_start', is_enabled: true },
        { location: 'game_end', is_enabled: true },
        { location: 'result_screen', is_enabled: true },
        { location: 'login', is_enabled: true },
      ],
    },
    {
      ad_type: 'rewarded',
      placements: [
        { location: 'home', is_enabled: true },
      ],
      rewarded_ad_config: {
        coins_min: 1,
        coins_max: 5,
        cooldown_minutes: 5,
        daily_limit: 20,
      },
    },
    {
      ad_type: 'native',
      placements: [
        { location: 'home', is_enabled: true },
      ],
    },
  ];
};

module.exports = mongoose.model('AdConfig', adConfigSchema);
