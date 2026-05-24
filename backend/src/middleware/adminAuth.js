const jwt = require('jsonwebtoken');
const config = require('../config/env');
const Admin = require('../models/Admin');

/**
 * Authenticate admin via JWT
 * Separates admin routes from user routes completely
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Admin access denied. No token provided.',
        code: 'ADMIN_NO_TOKEN',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Admin session expired. Please login again.',
          code: 'ADMIN_TOKEN_EXPIRED',
          needsRefresh: true,
        });
      }
      return res.status(401).json({
        error: 'Invalid admin token.',
        code: 'ADMIN_INVALID_TOKEN',
      });
    }

    // Verify it's an admin token
    if (!decoded.isAdmin) {
      return res.status(403).json({
        error: 'Not authorized as admin.',
        code: 'NOT_ADMIN',
      });
    }

    const admin = await Admin.findById(decoded.adminId).select('-password_hash -refresh_tokens');
    
    if (!admin || !admin.is_active) {
      return res.status(401).json({
        error: 'Admin account not found or deactivated.',
        code: 'ADMIN_NOT_FOUND',
      });
    }

    req.admin = admin;
    req.adminId = admin._id;
    req.adminRole = admin.role;
    req.adminPermissions = admin.permissions;

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({
      error: 'Admin authentication error.',
      code: 'ADMIN_AUTH_ERROR',
    });
  }
};

/**
 * Check if admin has specific permission
 */
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    // Super admin has all permissions
    if (req.adminRole === 'super_admin') {
      return next();
    }

    const hasPermission = permissions.some(p => req.adminPermissions.includes(p));
    
    if (!hasPermission) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action.',
        code: 'PERMISSION_DENIED',
        requiredPermissions: permissions,
      });
    }
    
    next();
  };
};

module.exports = { adminAuth, requirePermission };
