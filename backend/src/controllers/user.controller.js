const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Match = require('../models/Match');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password_hash -refresh_tokens');
    const wallet = await Wallet.findOne({ user_id: req.userId });
    
    res.json({
      user: user.toJSON(),
      wallet: wallet ? { balance: wallet.balance, locked: wallet.locked_balance } : { balance: 0, locked: 0 },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const updates = {};
    if (req.body.display_name) updates.display_name = req.body.display_name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.dob) updates.dob = req.body.dob;
    
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true })
      .select('-password_hash -refresh_tokens');
    
    res.json({ message: 'Profile updated', user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const submitKYC = async (req, res) => {
  try {
    const { aadhaar_number, pan_number, upi_id } = req.body;
    
    const user = await User.findByIdAndUpdate(req.userId, {
      aadhaar_number,
      pan_number,
      upi_id,
      kyc_status: 'pending',
    }, { new: true });
    
    res.json({ message: 'KYC submitted for verification', kyc_status: 'pending' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
};

const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const recentMatches = await Match.find({ 'players.user_id': req.userId })
      .sort({ created_at: -1 }).limit(10);
    
    res.json({ stats: user.stats, recentMatches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const getMatchHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const matches = await Match.find({ 'players.user_id': req.userId })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Match.countDocuments({ 'players.user_id': req.userId });
    
    res.json({
      matches,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
};

module.exports = { getProfile, updateProfile, submitKYC, getUserStats, getMatchHistory };
