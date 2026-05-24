const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/create', matchController.createMatch);
router.post('/join', matchController.joinMatch);
router.post('/:id/move', matchController.makeMove);
router.get('/:id/result', matchController.getMatchResult);
router.post('/:id/cancel', matchController.cancelMatch);
router.get('/live', matchController.getLiveMatches);

module.exports = router;
