const GameConfig = require('../models/GameConfig');
const { ChessEngine } = require('../games/chess/chessEngine');
const { PoolEngine } = require('../games/pool/poolEngine');
const { SnookerEngine } = require('../games/snooker/snookerEngine');

const getGameConfigs = async (req, res) => {
  try {
    const configs = await GameConfig.find();
    res.json({ games: configs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game configs' });
  }
};

const getGameConfig = async (req, res) => {
  try {
    const config = await GameConfig.findOne({ game_type: req.params.type });
    if (!config) return res.status(404).json({ error: 'Game not found' });
    res.json({ game: config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game config' });
  }
};

const getGameRules = async (req, res) => {
  try {
    let rules;
    switch (req.params.type) {
      case 'chess':
        rules = ChessEngine.getRules();
        break;
      case 'pool':
        rules = PoolEngine.getRules();
        break;
      case 'snooker':
        rules = SnookerEngine.getRules();
        break;
      default:
        return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ rules });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
};

module.exports = { getGameConfigs, getGameConfig, getGameRules };
