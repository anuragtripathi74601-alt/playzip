const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/kyc', userController.submitKYC);
router.get('/stats', userController.getUserStats);
router.get('/history', userController.getMatchHistory);

module.exports = router;
