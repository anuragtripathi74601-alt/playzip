/**
 * Admin Controller
 * Complete admin management with REAL data only
 */

const User = require('../models/User');
const Admin = require('../models/Admin');
const Partner = require('../models/Partner');
const Match = require('../models/Match');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const GameConfig = require('../models/GameConfig');
const PaymentGateway = require('../models/PaymentGateway');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const AntiCheatReport = require('../models/AntiCheatReport');
const RevenueReport = require('../models/RevenueReport');
const jwtUtils = require('../config/jwt');

// ============ AUTH ============

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email, is_active: true });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    const valid = await admin.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    admin.last_login = new Date();
    await admin.save();
    
    const token = jwtUtils.generateAdminAccessToken(admin._id, admin.role);
    const refreshToken = jwtUtils.generateAdminRefreshToken(admin._id);
    
    res.json({ admin: admin.toJSON(), token, refreshToken });
  } catch (error) {
    res.status(500).json({ error: 'Admin login failed' });
  }
};

// ============ DASHBOARD (REAL DATA ONLY) ============

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalUsers, activeUsers, totalMatches, todayRevenue, 
      pendingWithdrawals, pendingWithdrawalAmount, depositsToday
    ] = await Promise.all([
      User.countDocuments({ is_deleted: false }),
      User.countDocuments({ is_online: true }),
      Match.countDocuments(),
      RevenueReport.findOne({ report_date: today }),
      WithdrawalRequest.countDocuments({ status: 'pending' }),
      WithdrawalRequest.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.countDocuments({ 
        type: 'deposit', 
        created_at: { $gte: today },
        status: 'completed',
      }),
    ]);
    
    res.json({
      total_users: totalUsers,
      active_users: activeUsers,
      active_matches: await Match.countDocuments({ status: 'in_progress' }),
      today_revenue: todayRevenue?.total_commission || 0,
      today_ad_revenue: todayRevenue?.ad_revenue || 0,
      pending_withdrawals: pendingWithdrawals,
      pending_withdrawal_amount: pendingWithdrawalAmount[0]?.total || 0,
      deposits_today: depositsToday,
      total_matches: totalMatches,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};

// ============ USERS ============

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const query = { is_deleted: false };
    
    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: 'i' } },
        { display_name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'blocked') query.is_blocked = true;
    if (status === 'active') query.is_blocked = false;
    
    const users = await User.find(query)
      .select('-password_hash -refresh_tokens -aadhaar_number -pan_number')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    // Get wallets for these users
    const userIds = users.map(u => u._id);
    const wallets = await Wallet.find({ user_id: { $in: userIds } });
    const walletMap = {};
    wallets.forEach(w => { walletMap[w.user_id.toString()] = w; });
    
    const usersWithWallet = users.map(u => ({
      ...u.toJSON(),
      balance: walletMap[u._id.toString()]?.balance || 0,
      locked: walletMap[u._id.toString()]?.locked_balance || 0,
    }));
    
    res.json({
      users: usersWithWallet,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getUserDetail = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password_hash -refresh_tokens');
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const wallet = await Wallet.findOne({ user_id: user._id });
    const matches = await Match.find({ 'players.user_id': user._id })
      .sort({ created_at: -1 }).limit(20);
    const transactions = await Transaction.find({ user_id: user._id })
      .sort({ created_at: -1 }).limit(20);
    
    res.json({ user: user.toJSON(), wallet, matches, transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

const blockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { is_blocked: true });
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to block user' });
  }
};

const unblockUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { is_blocked: false });
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// ============ GAMES ============

const getGameConfigs = async (req, res) => {
  try {
    let configs = await GameConfig.find();
    if (configs.length === 0) {
      // Create default configs
      for (const game of ['pool', 'snooker', 'chess']) {
        await GameConfig.create(GameConfig.getDefaults(game));
      }
      configs = await GameConfig.find();
    }
    res.json({ game_configs: configs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game configs' });
  }
};

const updateGameConfig = async (req, res) => {
  try {
    const { game_type } = req.params;
    const updates = req.body;
    
    const config = await GameConfig.findOneAndUpdate(
      { game_type },
      { ...updates, updated_by: req.adminId },
      { new: true }
    );
    
    if (!config) return res.status(404).json({ error: 'Game config not found' });
    res.json({ message: 'Game config updated', config });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
};

const toggleGameLock = async (req, res) => {
  try {
    const { game_type } = req.params;
    const config = await GameConfig.findOne({ game_type });
    if (!config) return res.status(404).json({ error: 'Game not found' });
    
    config.is_locked = !config.is_locked;
    config.updated_by = req.adminId;
    await config.save();
    
    res.json({ 
      message: `Game ${config.is_locked ? 'locked' : 'unlocked'}`, 
      is_locked: config.is_locked 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle game lock' });
  }
};

const getLiveMatches = async (req, res) => {
  try {
    const matches = await Match.find({ 
      status: { $in: ['waiting', 'starting', 'in_progress'] } 
    }).populate('players.user_id', 'display_name username').sort({ created_at: -1 });
    
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch live matches' });
  }
};

const cancelMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelled_by: req.adminId, cancel_reason: req.body.reason },
      { new: true }
    );
    
    // Refund coins to both players
    // Wallet service handles this
    
    res.json({ message: 'Match cancelled', match });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel match' });
  }
};

// ============ PAYMENTS ============

const getDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = { type: 'deposit' };
    if (status) query.status = status;
    
    const deposits = await Transaction.find(query)
      .populate('user_id', 'display_name username phone')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Transaction.countDocuments(query);
    res.json({ deposits, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
};

const getWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;
    
    const withdrawals = await WithdrawalRequest.find(query)
      .populate('user_id', 'display_name username phone upi_id')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await WithdrawalRequest.countDocuments(query);
    res.json({ withdrawals, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
};

const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await WithdrawalRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved', 
        admin_id: req.adminId,
        processed_at: new Date(),
        admin_notes: req.body.notes,
      },
      { new: true }
    );
    
    // In production: Initiate bank/UPI transfer
    
    res.json({ message: 'Withdrawal approved', withdrawal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
};

const rejectWithdrawal = async (req, res) => {
  try {
    const withdrawal = await WithdrawalRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected', 
        admin_id: req.adminId,
        rejected_reason: req.body.reason,
      },
      { new: true }
    );
    
    // Refund coins to user
    // Wallet service handles this
    
    res.json({ message: 'Withdrawal rejected', withdrawal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
};

// ============ PAYMENT GATEWAY ============

const getPaymentGateways = async (req, res) => {
  try {
    const gateways = await PaymentGateway.find();
    res.json({ gateways });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch gateways' });
  }
};

const updatePaymentGateway = async (req, res) => {
  try {
    const { gateway_name } = req.params;
    const updates = { ...req.body, updated_by: req.adminId };
    
    const gateway = await PaymentGateway.findOneAndUpdate(
      { gateway_name },
      updates,
      { new: true, upsert: true }
    );
    
    res.json({ message: 'Payment gateway updated', gateway });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update gateway' });
  }
};

// ============ PARTNERS ============

const getPartners = async (req, res) => {
  try {
    const partners = await Partner.find().sort({ created_at: -1 });
    res.json({ partners });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch partners' });
  }
};

const createPartner = async (req, res) => {
  try {
    const partner = await Partner.create({
      ...req.body,
      created_by: req.adminId,
    });
    
    // Create admin account for partner
    const admin = await Admin.create({
      username: `partner_${partner._id}`,
      email: partner.email,
      password_hash: 'Partner@123', // Should be sent via email
      role: 'partner',
      partner_id: partner._id,
      permissions: Admin.getDefaultPermissions('partner'),
    });
    
    partner.admin_id = admin._id;
    await partner.save();
    
    res.status(201).json({ message: 'Partner created', partner, admin });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create partner' });
  }
};

// ============ SECURITY ============

const getAntiCheatReports = async (req, res) => {
  try {
    const reports = await AntiCheatReport.find()
      .populate('user_id', 'display_name username phone')
      .sort({ created_at: -1 })
      .limit(50);
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const resolveCheatReport = async (req, res) => {
  try {
    const report = await AntiCheatReport.findByIdAndUpdate(
      req.params.id,
      { 
        status: req.body.status,
        action_taken: req.body.action,
        resolved_by: req.adminId,
        resolution_notes: req.body.notes,
        resolved_at: new Date(),
      },
      { new: true }
    );
    
    if (req.body.action === 'permanent_ban' || req.body.action === 'temporary_ban') {
      await User.findByIdAndUpdate(report.user_id, { is_blocked: true });
    }
    
    res.json({ message: 'Report resolved', report });
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve report' });
  }
};

// ============ REPORTS ============

const getRevenueReports = async (req, res) => {
  try {
    const { type = 'daily', from, to } = req.query;
    const query = { report_type: type };
    
    if (from && to) {
      query.report_date = { $gte: new Date(from), $lte: new Date(to) };
    }
    
    const reports = await RevenueReport.find(query)
      .sort({ report_date: -1 })
      .limit(90);
    
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

const getGameWiseEarnings = async (req, res) => {
  try {
    const earnings = await Match.aggregate([
      { $match: { status: 'completed', platform_commission: { $gt: 0 } } },
      { $group: {
        _id: '$game_type',
        total_commission: { $sum: '$platform_commission' },
        total_matches: { $sum: 1 },
        total_pool: { $sum: '$total_pool' },
      }},
    ]);
    res.json({ earnings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};

module.exports = {
  adminLogin, getDashboard, getUsers, getUserDetail, blockUser, unblockUser,
  getGameConfigs, updateGameConfig, toggleGameLock, getLiveMatches, cancelMatch,
  getDeposits, getWithdrawals, approveWithdrawal, rejectWithdrawal,
  getPaymentGateways, updatePaymentGateway,
  getPartners, createPartner,
  getAntiCheatReports, resolveCheatReport,
  getRevenueReports, getGameWiseEarnings,
};
