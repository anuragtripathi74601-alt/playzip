const mongoose = require('mongoose');

const antiCheatReportSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  match_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
  },
  report_type: {
    type: String,
    enum: [
      'suspicious_movement',
      'unusual_win_pattern',
      'multiple_accounts',
      'speed_hack',
      'automation',
      'collusion',
      'abnormal_score',
      'location_anomaly',
      'device_emulation',
    ],
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  description: String,
  evidence: {
    move_patterns: [mongoose.Schema.Types.Mixed],
    timestamps: [Date],
    ip_addresses: [String],
    device_ids: [String],
    screenshots: [String],
  },
  confidence_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved_guilty', 'resolved_innocent', 'false_positive'],
    default: 'open',
  },
  action_taken: {
    type: String,
    enum: ['none', 'warning', 'temporary_ban', 'permanent_ban', 'account_reset', 'coins_forfeit'],
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  resolution_notes: String,
  resolved_at: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

antiCheatReportSchema.index({ user_id: 1 });
antiCheatReportSchema.index({ status: 1, severity: -1 });
antiCheatReportSchema.index({ created_at: -1 });

module.exports = mongoose.model('AntiCheatReport', antiCheatReportSchema);
