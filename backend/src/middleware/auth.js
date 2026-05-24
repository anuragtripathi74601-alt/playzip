const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

/**
 * Authenticate user via JWT access token
 * Fixed: Proper token validation with expiry check
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED',
          needsRefresh: true,
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN',
        });
      }
      throw jwtError;
    }

    // Check if user exists and is not blocked
    const user = await User.findById(decoded.userId).select('-password_hash -refresh_tokens');
    
    if (!user) {
      return res.status(401).json({
        error: 'User not found. Please register again.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        error: 'Your account has been blocked. Contact support.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    if (user.is_deleted) {
      return res.status(401).json({
        error: 'Account deleted. Please contact support.',
        code: 'ACCOUNT_DELETED',
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.token = token;
    req.tokenExp = decoded.exp;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Authentication error. Please try again.',
      code: 'AUTH_ERROR',
    });
  }
};

/**
 * Optional auth - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.userId).select('-password_hash -refresh_tokens');
        if (user && !user.is_blocked && !user.is_deleted) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (e) {
        // Token invalid, continue without auth
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
