const mongoose = require('mongoose');

const paymentGatewaySchema = new mongoose.Schema({
  gateway_name: {
    type: String,
    enum: ['razorpay', 'phonepe', 'paytm'],
    required: true,
    unique: true,
  },
  display_name: String,
  is_active: {
    type: Boolean,
    default: false,
  },
  api_key: {
    type: String,
    encrypted: true,
  },
  api_secret: {
    type: String,
    encrypted: true,
  },
  merchant_id: String,
  upi_id: String,
  bank_account_details: {
    account_number: String,
    ifsc: String,
    bank_name: String,
    holder_name: String,
  },
  webhook_secret: String,
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  last_used_at: Date,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
});

paymentGatewaySchema.index({ gateway_name: 1 });
paymentGatewaySchema.index({ is_active: 1 });

module.exports = mongoose.model('PaymentGateway', paymentGatewaySchema);
