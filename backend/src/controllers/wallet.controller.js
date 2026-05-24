const walletService = require('../services/wallet.service');
const WithdrawalRequest = require('../models/WithdrawalRequest');

const getBalance = async (req, res) => {
  try {
    const wallet = await walletService.getWallet(req.userId);
    res.json({
      balance: wallet.balance,
      locked_balance: wallet.locked_balance,
      available_balance: wallet.balance + wallet.locked_balance,
      total_deposited: wallet.total_deposited,
      total_withdrawn: wallet.total_withdrawn,
      total_won: wallet.total_won,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
};

const deposit = async (req, res) => {
  try {
    const { amount, payment_method, gateway } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    
    // In production: Create payment order with gateway
    // const order = await paymentGateway.createOrder(amount);
    
    const wallet = await walletService.addCoins(
      req.userId, 
      amount, 
      payment_method, 
      `order_${Date.now()}`,
      gateway
    );
    
    res.json({ 
      message: 'Deposit successful', 
      balance: wallet.balance 
    });
  } catch (error) {
    res.status(500).json({ error: 'Deposit failed' });
  }
};

const requestWithdrawal = async (req, res) => {
  try {
    const { amount, upi_id } = req.body;
    
    const wallet = await walletService.getWallet(req.userId);
    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Create withdrawal request
    const withdrawal = await WithdrawalRequest.create({
      user_id: req.userId,
      amount,
      payment_method: 'upi',
      upi_id,
      status: 'pending',
    });
    
    // Deduct from balance (will be released on approval/rejection)
    wallet.balance -= amount;
    await wallet.save();
    
    res.json({ 
      message: 'Withdrawal request submitted. 24 hours processing time.', 
      withdrawal 
    });
  } catch (error) {
    res.status(500).json({ error: 'Withdrawal request failed' });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await walletService.getTransactionHistory(
      req.userId, 
      parseInt(page) || 1, 
      parseInt(limit) || 20
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const claimAdReward = async (req, res) => {
  try {
    const { coins } = req.body;
    const rewardAmount = Math.min(Math.max(coins || 1, 1), 5);
    
    const wallet = await walletService.addAdReward(req.userId, rewardAmount);
    
    res.json({ 
      message: `You earned ₹${rewardAmount} coins!`, 
      balance: wallet.balance,
      reward: rewardAmount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to claim reward' });
  }
};

module.exports = { getBalance, deposit, requestWithdrawal, getTransactions, claimAdReward };
