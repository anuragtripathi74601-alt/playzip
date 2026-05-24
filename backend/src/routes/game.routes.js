const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.get('/config', authenticate, gameController.getGameConfigs);
router.get('/config/:type', authenticate, gameController.getGameConfig);
router.get('/:type/rules', optionalAuth, gameController.getGameRules);

module.exports = router;
