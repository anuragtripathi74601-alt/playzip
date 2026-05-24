const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation rules
const registerValidation = [
  body('phone').matches(/^\+?[1-9]\d{9,14}$/).withMessage('Valid phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('state').optional().isString(),
];

const loginValidation = [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// POST /api/auth/register
router.post('/register', registerValidation, authController.register);

// POST /api/auth/login — Fixed with proper error handling
router.post('/login', loginValidation, authController.login);

// POST /api/auth/refresh — Refresh token endpoint (fixes login bug)
router.post('/refresh', authController.refreshToken);

// POST /api/auth/logout
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me
router.get('/me', authenticate, authController.getProfile);

// POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
