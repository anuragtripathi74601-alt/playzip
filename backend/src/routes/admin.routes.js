const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { adminAuth, requirePermission } = require('../middleware/adminAuth');

// Auth
router.post('/login', adminController.adminLogin);

// All routes below require admin auth
router.use(adminAuth);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Users
router.get('/users', requirePermission('manage_users'), adminController.getUsers);
router.get('/users/:id', requirePermission('manage_users'), adminController.getUserDetail);
router.post('/users/:id/block', requirePermission('manage_users'), adminController.blockUser);
router.post('/users/:id/unblock', requirePermission('manage_users'), adminController.unblockUser);

// Games
router.get('/games/config', requirePermission('manage_games'), adminController.getGameConfigs);
router.put('/games/config/:game_type', requirePermission('edit_entry_fees'), adminController.updateGameConfig);
router.put('/games/:game_type/lock', requirePermission('lock_unlock_games'), adminController.toggleGameLock);
router.get('/games/live-matches', adminController.getLiveMatches);
router.post('/games/cancel-match/:id', requirePermission('manage_games'), adminController.cancelMatch);

// Payments
router.get('/payments/deposits', requirePermission('manage_payments'), adminController.getDeposits);
router.get('/payments/withdrawals', requirePermission('manage_payments'), adminController.getWithdrawals);
router.post('/payments/approve-withdrawal/:id', requirePermission('manage_withdrawals'), adminController.approveWithdrawal);
router.post('/payments/reject-withdrawal/:id', requirePermission('manage_withdrawals'), adminController.rejectWithdrawal);

// Payment Gateway
router.get('/payments/gateway', requirePermission('manage_payment_gateway'), adminController.getPaymentGateways);
router.put('/payments/gateway/:gateway_name', requirePermission('manage_payment_gateway'), adminController.updatePaymentGateway);

// Partners
router.get('/partners', requirePermission('manage_partners'), adminController.getPartners);
router.post('/partners', requirePermission('manage_partners'), adminController.createPartner);

// Security
router.get('/security/cheat-reports', requirePermission('manage_security'), adminController.getAntiCheatReports);
router.post('/security/cheat-reports/:id/resolve', requirePermission('manage_security'), adminController.resolveCheatReport);

// Reports
router.get('/reports/revenue', requirePermission('view_reports'), adminController.getRevenueReports);
router.get('/reports/game-wise', requirePermission('view_reports'), adminController.getGameWiseEarnings);

module.exports = router;
