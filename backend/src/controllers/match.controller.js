const Match = require('../models/Match');
const GameConfig = require('../models/GameConfig');
const walletService = require('../services/wallet.service');
const { ChessEngine } = require('../games/chess/chessEngine');

const createMatch = async (req, res) => {
  try {
    const { game_type, match_type, level, opponent_id } = req.body;
    
    const config = await GameConfig.findOne({ game_type });
    if (!config || config.is_locked) {
      return res.status(400).json({ error: 'Game is currently locked' });
    }
    
    const levelConfig = config.levels.find(l => l.name === level);
    if (!levelConfig || !levelConfig.is_active) {
      return res.status(400).json({ error: 'Invalid level' });
    }
    
    // Check wallet balance for paid games
    if (levelConfig.entry_fee > 0) {
      const hasBalance = await walletService.hasSufficientBalance(req.userId, levelConfig.entry_fee);
      if (!hasBalance) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
    }
    
    const match = await Match.create({
      game_type,
      match_type,
      level,
      entry_fee_per_player: levelConfig.entry_fee,
      total_pool: levelConfig.entry_fee * 2,
      winner_payout: levelConfig.winner_payout,
      platform_commission: levelConfig.platform_cut,
      players: [{ user_id: req.userId, coins_at_stake: levelConfig.entry_fee }],
      player_count: 1,
    });
    
    // Lock wallet if paid
    if (levelConfig.entry_fee > 0) {
      await walletService.lockEntryFee(req.userId, levelConfig.entry_fee, match._id);
    }
    
    res.status(201).json({ match });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to create match' });
  }
};

const joinMatch = async (req, res) => {
  try {
    const { match_id } = req.body;
    const match = await Match.findById(match_id);
    
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.player_count >= 2) return res.status(400).json({ error: 'Match is full' });
    if (match.status !== 'waiting') return res.status(400).json({ error: 'Match not available' });
    if (match.players[0].user_id.toString() === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot join your own match' });
    }
    
    // Check wallet
    if (match.entry_fee_per_player > 0) {
      const hasBalance = await walletService.hasSufficientBalance(req.userId, match.entry_fee_per_player);
      if (!hasBalance) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      await walletService.lockEntryFee(req.userId, match.entry_fee_per_player, match._id);
    }
    
    match.players.push({ user_id: req.userId, coins_at_stake: match.entry_fee_per_player });
    match.player_count = 2;
    match.status = 'starting';
    
    // Initialize game engine
    match.game_state = { phase: 'ready' };
    await match.save();
    
    // Notify the match creator via socket
    const io = req.app.get('io');
    io.to(`user_${match.players[0].user_id}`).emit('match:joined', { matchId: match._id });
    
    res.json({ match });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to join match' });
  }
};

const makeMove = async (req, res) => {
  try {
    const { match_id, move_data } = req.body;
    const match = await Match.findById(match_id);
    
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status !== 'in_progress') return res.status(400).json({ error: 'Match not in progress' });
    
    // Process move through game engine
    // This is handled via WebSocket for real-time games
    // REST endpoint for backup
    
    match.move_history.push({
      player_id: req.userId,
      move_data,
      timestamp: new Date(),
    });
    await match.save();
    
    res.json({ success: true, move: move_data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process move' });
  }
};

const getMatchResult = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('players.user_id', 'display_name username avatar');
    
    if (!match) return res.status(404).json({ error: 'Match not found' });
    
    // Check if user is part of this match
    const isPlayer = match.players.some(p => p.user_id._id.toString() === req.userId.toString());
    if (!isPlayer) return res.status(403).json({ error: 'Not authorized' });
    
    res.json({ match });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match result' });
  }
};

const cancelMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    
    match.status = 'cancelled';
    match.cancelled_by = req.userId;
    await match.save();
    
    // Refund coins
    if (match.entry_fee_per_player > 0) {
      for (const player of match.players) {
        await walletService.releaseLockedAmount(player.user_id, match._id, 'refund');
      }
    }
    
    res.json({ message: 'Match cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel match' });
  }
};

const getLiveMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      'players.user_id': req.userId,
      status: { $in: ['waiting', 'starting', 'in_progress'] },
    }).populate('players.user_id', 'display_name username');
    
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

module.exports = { createMatch, joinMatch, makeMove, getMatchResult, cancelMatch, getLiveMatches };
