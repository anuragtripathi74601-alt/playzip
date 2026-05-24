const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  game_type: {
    type: String,
    enum: ['pool', 'snooker', 'chess'],
    required: true,
  },
  match_type: {
    type: String,
    enum: ['random', 'friend', 'practice', 'free'],
    required: true,
  },
  level: {
    type: String,
    enum: ['free', 'starter', 'standard', 'pro', 'advanced', 'elite'],
    required: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'starting', 'in_progress', 'completed', 'cancelled', 'void'],
    default: 'waiting',
  },
  players: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    score: { type: Number, default: 0 },
    result: {
      type: String,
      enum: ['win', 'lose', 'draw', null],
      default: null,
    },
    coins_at_stake: { type: Number, default: 0 },
    coins_locked: { type: Boolean, default: false },
    is_ready: { type: Boolean, default: false },
  }],
  entry_fee_per_player: {
    type: Number,
    default: 0,
  },
  total_pool: {
    type: Number,
    default: 0,
  },
  winner_payout: {
    type: Number,
    default: 0,
  },
  platform_commission: {
    type: Number,
    default: 0,
  },
  tds_deducted: {
    type: Number,
    default: 0,
  },
  winner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  game_state: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  move_history: [{
    player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    move_data: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
  }],
  timer_config: {
    type: {
      time_per_player: Number,  // in seconds, 0 = unlimited
      increment: Number,        // in seconds
      started_at: Date,
    },
    default: {},
  },
  timers: {
    type: Map,
    of: Number,
    default: {},
  },
  ads_shown: {
    before_game: { type: Boolean, default: false },
    after_game: { type: Boolean, default: false },
    on_result: { type: Boolean, default: false },
  },
  player_count: {
    type: Number,
    default: 0,
    min: 0,
    max: 2,
  },
  started_at: Date,
  ended_at: Date,
  winner_declared_at: Date,
  cancelled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  cancel_reason: String,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

matchSchema.index({ game_type: 1, status: 1 });
matchSchema.index({ 'players.user_id': 1, status: 1 });
matchSchema.index({ status: 1, created_at: -1 });
matchSchema.index({ winner_id: 1 });
matchSchema.index({ created_at: -1 });

module.exports = mongoose.model('Match', matchSchema);
