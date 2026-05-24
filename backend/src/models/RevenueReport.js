const mongoose = require('mongoose');

const revenueReportSchema = new mongoose.Schema({
  report_date: {
    type: Date,
    required: true,
    unique: true,
  },
  report_type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  },
  // Commission breakdown
  total_commission: { type: Number, default: 0 },
  pool_commission: { type: Number, default: 0 },
  snooker_commission: { type: Number, default: 0 },
  chess_commission: { type: Number, default: 0 },
  
  // Ad revenue
  ad_revenue: { type: Number, default: 0 },
  ad_impressions: { type: Number, default: 0 },
  ad_clicks: { type: Number, default: 0 },
  ad_cpm_earnings: { type: Number, default: 0 },
  ad_cpc_earnings: { type: Number, default: 0 },
  
  // Transaction stats
  total_deposits: { type: Number, default: 0 },
  total_deposit_count: { type: Number, default: 0 },
  total_withdrawals: { type: Number, default: 0 },
  total_withdrawal_count: { type: Number, default: 0 },
  
  // TDS/GST
  total_tds_collected: { type: Number, default: 0 },
  total_gst_collected: { type: Number, default: 0 },
  
  // User stats
  active_users: { type: Number, default: 0 },
  new_users: { type: Number, default: 0 },
  total_users: { type: Number, default: 0 },
  
  // Match stats
  total_matches: { type: Number, default: 0 },
  pool_matches: { type: Number, default: 0 },
  snooker_matches: { type: Number, default: 0 },
  chess_matches: { type: Number, default: 0 },
  cancelled_matches: { type: Number, default: 0 },
  
  // Level-wise
  level_wise_commission: {
    free: { type: Number, default: 0 },
    starter: { type: Number, default: 0 },
    standard: { type: Number, default: 0 },
    pro: { type: Number, default: 0 },
    advanced: { type: Number, default: 0 },
    elite: { type: Number, default: 0 },
  },
  
  partner_commissions: [{
    partner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    amount: Number,
    matches_count: Number,
  }],
  
  generated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

revenueReportSchema.index({ report_date: -1 });
revenueReportSchema.index({ report_type: 1, report_date: -1 });

module.exports = mongoose.model('RevenueReport', revenueReportSchema);
