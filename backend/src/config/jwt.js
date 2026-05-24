const jwt = require('jsonwebtoken');
const config = require('./env');

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = (userId) => {
  const expiresAt = new Date();
  const expiryMs = parseDuration(config.jwt.refreshExpiry);
  expiresAt.setTime(expiresAt.getTime() + expiryMs);

  const token = jwt.sign(
    { userId, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  return { token, expiresAt };
};

/**
 * Generate admin access token
 */
const generateAdminAccessToken = (adminId, role) => {
  return jwt.sign(
    { adminId, isAdmin: true, role },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};

/**
 * Generate admin refresh token
 */
const generateAdminRefreshToken = (adminId) => {
  return jwt.sign(
    { adminId, isAdmin: true, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: '1d' }
  );
};

/**
 * Generate partner token
 */
const generatePartnerToken = (partnerId, adminId) => {
  return jwt.sign(
    { partnerId, adminId, isPartner: true, role: 'partner' },
    config.jwt.secret,
    { expiresIn: '2h' }
  );
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    return null;
  }
};

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration) {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 min

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 15 * 60 * 1000;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateAdminAccessToken,
  generateAdminRefreshToken,
  generatePartnerToken,
  verifyRefreshToken,
};
