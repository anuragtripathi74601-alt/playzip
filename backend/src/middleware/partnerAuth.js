const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Admin = require('../models/Admin');
const Partner = require('../models/Partner');

/**
 * Authenticate partner via JWT
 */
const partnerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Partner access denied. No token provided.',
        code: 'PARTNER_NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Partner session expired.',
          code: 'PARTNER_TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        error: 'Invalid partner token.',
        code: 'PARTNER_INVALID_TOKEN',
      });
    }

    if (!decoded.isPartner && decoded.role !== 'partner') {
      return res.status(403).json({
        error: 'Not authorized as partner.',
        code: 'NOT_PARTNER',
      });
    }

    const partner = await Partner.findById(decoded.partnerId);
    if (!partner || !partner.is_active) {
      return res.status(401).json({
        error: 'Partner account not found or deactivated.',
        code: 'PARTNER_NOT_FOUND',
      });
    }

    req.partner = partner;
    req.partnerId = partner._id;
    req.partnerPermissions = partner.permissions;

    next();
  } catch (error) {
    console.error('Partner auth error:', error);
    return res.status(500).json({
      error: 'Partner authentication error.',
      code: 'PARTNER_AUTH_ERROR',
    });
  }
};

module.exports = { partnerAuth };
