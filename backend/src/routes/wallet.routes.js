const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/balance', walletController.getBalance);
router.post('/deposit', walletController.deposit);
router.post('/withdraw', walletController.requestWithdrawal);
router.get('/transactions', walletController.getTransactions);
router.post('/ad-reward', walletController.claimAdReward);

module.exports = router;
