const express = require('express');
const router = express.Router();
const { partnerAuth } = require('../middleware/partnerAuth');

// Partner dashboard
router.get('/dashboard', partnerAuth, async (req, res) => {
  try {
    const Match = require('../models/Match');
    const matches = await Match.countDocuments({
      game_type: { $in: req.partner.allowed_games },
      level: { $in: req.partner.allowed_levels },
      status: 'completed',
    });
    res.json({ 
      partner: req.partner,
      stats: { total_matches: matches }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Partner managed games
router.get('/games/config', partnerAuth, async (req, res) => {
  try {
    const GameConfig = require('../models/GameConfig');
    const configs = await GameConfig.find({
      game_type: { $in: req.partner.allowed_games },
    });
    res.json({ games: configs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game configs' });
  }
});

// Partner update game config (if permitted)
router.put('/games/config/:game_type', partnerAuth, async (req, res) => {
  try {
    if (!req.partner.permissions.can_edit_entry_fees) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    const GameConfig = require('../models/GameConfig');
    const { levels } = req.body;
    const config = await GameConfig.findOneAndUpdate(
      { game_type: req.params.game_type },
      { levels, updated_by: req.adminId },
      { new: true }
    );
    res.json({ message: 'Updated', config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

module.exports = router;
