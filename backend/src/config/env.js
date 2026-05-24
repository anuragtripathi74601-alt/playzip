const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/playzip',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
    pepper: process.env.PASSWORD_PEPPER || 'default-pepper',
  },
  
  payment: {
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
    },
    phonepe: {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      apiKey: process.env.PHONEPE_API_KEY,
    },
    paytm: {
      merchantId: process.env.PAYTM_MERCHANT_ID,
      apiKey: process.env.PAYTM_API_KEY,
    },
    ownerUpiId: process.env.OWNER_UPI_ID,
    ownerBankAccount: process.env.OWNER_BANK_ACCOUNT,
    ownerBankIfsc: process.env.OWNER_BANK_IFSC,
  },
  
  tax: {
    tdsPercentage: parseFloat(process.env.TDS_PERCENTAGE) || 30,
    tdsThreshold: parseFloat(process.env.TDS_THRESHOLD) || 10000,
    gstPercentage: parseFloat(process.env.GST_PERCENTAGE) || 28,
  },
  
  stateRestrictions: {
    banned: (process.env.BANNED_STATES || '').split(',').map(s => s.trim().toLowerCase()),
    licenseRequired: (process.env.LICENSE_REQUIRED_STATES || '').split(',').map(s => s.trim().toLowerCase()),
    restricted: (process.env.RESTRICTED_STATES || '').split(',').map(s => s.trim().toLowerCase()),
  },
  
  masterAdmin: {
    email: process.env.MASTER_ADMIN_EMAIL || 'owner@playzip.com',
    phone: process.env.MASTER_ADMIN_PHONE || '+919999999999',
  },
};
