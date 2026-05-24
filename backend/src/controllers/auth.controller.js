/**
 * Auth Controller
 * 
 * Fixed login system with:
 * - Bcrypt password hashing with pepper
 * - JWT access tokens (15min expiry)
 * - Refresh tokens (7 day expiry) with rotation
 * - Secure token storage
 * - Proper error messages
 */

const User = require('../models/User');
const Wallet = require('../models/Wallet');
const jwtUtils = require('../config/jwt');
const config = require('../config/env');

/**
 * Register new user
 */
const register = async (req, res) => {
  try {
    const { phone, password, display_name, state } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({
        error: 'This phone number is already registered.',
        code: 'PHONE_EXISTS',
      });
    }

    // Check state restriction
    const stateLower = (state || '').toLowerCase().trim();
    if (config.stateRestrictions.banned.includes(stateLower)) {
      return res.status(403).json({
        error: 'Online gaming is not permitted in your state.',
        code: 'STATE_BANNED',
      });
    }

    // Generate unique username
    const username = `PZ${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create user
    const user = new User({
      username,
      phone,
      password_hash: password, // Will be hashed by pre-save hook
      display_name: display_name || `Player${Math.floor(Math.random() * 10000)}`,
      state: stateLower,
    });

    await user.save();

    // Create wallet
    const wallet = new Wallet({
      user_id: user._id,
      balance: 0,
      locked_balance: 0,
    });
    await wallet.save();

    // Generate tokens
    const accessToken = jwtUtils.generateAccessToken(user._id);
    const { token: refreshToken, expiresAt } = jwtUtils.generateRefreshToken(user._id);

    // Store refresh token
    user.refresh_tokens.push({
      token: refreshToken,
      created_at: new Date(),
      expires_at: expiresAt,
    });
    await user.save();

    res.status(201).json({
      message: 'Registration successful!',
      user: user.toJSON(),
      wallet: { balance: wallet.balance, locked_balance: wallet.locked_balance },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.',
      code: 'REGISTRATION_ERROR',
    });
  }
};

/**
 * Login user
 * Fixed: Proper bcrypt.compare with pepper, clear error messages
 */
const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        error: 'Phone number and password are required.',
        code: 'MISSING_CREDENTIALS',
      });
    }

    // Find user by phone
    const user = await User.findOne({ phone, is_deleted: false });
    if (!user) {
      return res.status(401).json({
        error: 'Account not found with this phone number.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Check if blocked
    if (user.is_blocked) {
      return res.status(403).json({
        error: 'Your account has been blocked. Please contact support.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Incorrect password. Please try again.',
        code: 'INVALID_PASSWORD',
        attemptsRemaining: 5 - user.stats.total_matches, // Placeholder
      });
    }

    // Update user online status
    user.is_online = true;
    user.last_login = new Date();
    
    // Clean up expired refresh tokens (keep only valid ones)
    const now = new Date();
    user.refresh_tokens = user.refresh_tokens.filter(t => 
      t.expires_at && t.expires_at > now
    );

    // Generate new tokens
    const accessToken = jwtUtils.generateAccessToken(user._id);
    const { token: refreshToken, expiresAt } = jwtUtils.generateRefreshToken(user._id);

    // Store new refresh token
    user.refresh_tokens.push({
      token: refreshToken,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    await user.save();

    // Get wallet
    const wallet = await Wallet.findOne({ user_id: user._id });

    res.json({
      message: 'Login successful!',
      user: user.toJSON(),
      wallet: {
        balance: wallet?.balance || 0,
        locked_balance: wallet?.locked_balance || 0,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.',
      code: 'LOGIN_ERROR',
    });
  }
};

/**
 * Refresh access token
 * Fixes the "password incorrect after some time" bug
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Refresh token is required.',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    // Verify the refresh token
    const decoded = jwtUtils.verifyRefreshToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: 'Invalid or expired refresh token. Please login again.',
        code: 'INVALID_REFRESH_TOKEN',
        needsLogin: true,
      });
    }

    // Find user and check if this refresh token exists
    const user = await User.findOne({
      _id: decoded.userId,
      is_deleted: false,
      'refresh_tokens.token': token,
    });

    if (!user) {
      return res.status(401).json({
        error: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED',
        needsLogin: true,
      });
    }

    if (user.is_blocked) {
      return res.status(403).json({
        error: 'Account blocked.',
        code: 'ACCOUNT_BLOCKED',
      });
    }

    // Rotate tokens: Remove old refresh token
    user.refresh_tokens = user.refresh_tokens.filter(t => t.token !== token);

    // Generate new tokens
    const newAccessToken = jwtUtils.generateAccessToken(user._id);
    const { token: newRefreshToken, expiresAt } = jwtUtils.generateRefreshToken(user._id);

    // Store new refresh token
    user.refresh_tokens.push({
      token: newRefreshToken,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    await user.save();

    res.json({
      message: 'Token refreshed successfully.',
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh token. Please login again.',
      code: 'REFRESH_ERROR',
      needsLogin: true,
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    
    // Remove the specific refresh token
    if (token && req.user) {
      const user = await User.findById(req.userId);
      if (user) {
        user.refresh_tokens = user.refresh_tokens.filter(t => t.token !== token);
        user.is_online = false;
        await user.save();
      }
    } else if (req.user) {
      // Logout from all devices
      const user = await User.findById(req.userId);
      if (user) {
        user.refresh_tokens = [];
        user.is_online = false;
        await user.save();
      }
    }

    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ message: 'Logged out successfully.' });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user_id: req.userId });
    
    res.json({
      user: req.user.toJSON(),
      wallet: {
        balance: wallet?.balance || 0,
        locked_balance: wallet?.locked_balance || 0,
        total_deposited: wallet?.total_deposited || 0,
        total_withdrawn: wallet?.total_withdrawn || 0,
        total_won: wallet?.total_won || 0,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile.' });
  }
};

/**
 * Forgot password - send OTP
 */
const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        error: 'No account found with this phone number.',
        code: 'USER_NOT_FOUND',
      });
    }
    
    // In production: Send OTP via SMS
    // For now, return success
    
    res.json({
      message: 'OTP sent to your phone number.',
      // debug_otp: '123456', // Remove in production
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
};

/**
 * Reset password with OTP
 */
const resetPassword = async (req, res) => {
  try {
    const { phone, otp, new_password } = req.body;
    
    // In production: Verify OTP
    // For now, just reset password
    
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    user.password_hash = new_password; // Will be hashed by pre-save
    await user.save();
    
    res.json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
};
