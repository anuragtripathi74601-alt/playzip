/**
 * Wallet Service
 * 
 * Handles wallet operations including:
 * - Balance checking
 * - Entry fee locking for matches
 * - Locked amount release on match completion
 * - Deposit/Withdrawal management
 */

const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

class WalletService {
  /**
   * Get wallet by user ID
   */
  async getWallet(userId) {
    let wallet = await Wallet.findOne({ user_id: userId });
    if (!wallet) {
      wallet = new Wallet({ user_id: userId });
      await wallet.save();
    }
    return wallet;
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId, amount) {
    const wallet = await this.getWallet(userId);
    return wallet.balance >= amount;
  }

  /**
   * Lock entry fee for a match
   * Amount moves from balance → locked_balance
   */
  async lockEntryFee(userId, amount, matchId) {
    const wallet = await this.getWallet(userId);
    
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    wallet.balance -= amount;
    wallet.locked_balance += amount;
    await wallet.save();

    // Create transaction record
    await Transaction.create({
      user_id: userId,
      type: 'match_entry',
      amount: -amount,
      balance_before: wallet.balance + amount,
      balance_after: wallet.balance,
      status: 'completed',
      match_id: matchId,
      description: `Entry fee locked for match`,
    });

    return wallet;
  }

  /**
   * Release locked amount after match
   * Handles: win, lose, refund scenarios
   */
  async releaseLockedAmount(userId, matchId, result, payout = 0, commission = 0) {
    const wallet = await this.getWallet(userId);

    switch (result) {
      case 'win': {
        // Release lock + add payout
        const lockedAmount = wallet.locked_balance;
        wallet.locked_balance = 0;
        wallet.balance += payout;
        wallet.total_won += payout;
        
        await wallet.save();

        await Transaction.create({
          user_id: userId,
          type: 'match_win',
          amount: payout,
          balance_before: wallet.balance - payout,
          balance_after: wallet.balance,
          status: 'completed',
          match_id: matchId,
          description: `Match win payout: ₹${payout}`,
        });
        break;
      }

      case 'lose': {
        // Entry fee is lost (goes to platform/winner)
        const lostAmount = wallet.locked_balance;
        wallet.locked_balance = 0;
        wallet.total_lost += lostAmount;
        
        await wallet.save();

        await Transaction.create({
          user_id: userId,
          type: 'match_loss',
          amount: -lostAmount,
          balance_before: wallet.balance + lostAmount,
          balance_after: wallet.balance,
          status: 'completed',
          match_id: matchId,
          description: `Match loss: entry fee forfeited`,
        });
        break;
      }

      case 'refund':
      case 'cancelled': {
        // Full refund of locked amount
        const refundAmount = wallet.locked_balance;
        wallet.locked_balance = 0;
        wallet.balance += refundAmount;
        
        await wallet.save();

        await Transaction.create({
          user_id: userId,
          type: 'refund',
          amount: refundAmount,
          balance_before: wallet.balance - refundAmount,
          balance_after: wallet.balance,
          status: 'completed',
          match_id: matchId,
          description: `Match cancelled: ₹${refundAmount} refunded`,
        });
        break;
      }

      default: {
        // Just unlock without changes
        const unlockAmount = wallet.locked_balance;
        wallet.locked_balance = 0;
        wallet.balance += unlockAmount;
        await wallet.save();
      }
    }

    return wallet;
  }

  /**
   * Add coins (deposit)
   */
  async addCoins(userId, amount, paymentMethod, referenceId, gateway) {
    const wallet = await this.getWallet(userId);
    
    wallet.balance += amount;
    wallet.total_deposited += amount;
    await wallet.save();

    await Transaction.create({
      user_id: userId,
      type: 'deposit',
      amount,
      balance_before: wallet.balance - amount,
      balance_after: wallet.balance,
      status: 'completed',
      reference_id: referenceId,
      payment_gateway: gateway,
      payment_method: paymentMethod,
      description: `Deposit of ₹${amount}`,
    });

    return wallet;
  }

  /**
   * Deduct coins (withdrawal)
   */
  async deductCoins(userId, amount, referenceId) {
    const wallet = await this.getWallet(userId);
    
    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    wallet.balance -= amount;
    wallet.total_withdrawn += amount;
    await wallet.save();

    await Transaction.create({
      user_id: userId,
      type: 'withdrawal',
      amount: -amount,
      balance_before: wallet.balance + amount,
      balance_after: wallet.balance,
      status: 'completed',
      reference_id: referenceId,
      description: `Withdrawal of ₹${amount}`,
    });

    return wallet;
  }

  /**
   * Add ad reward coins
   */
  async addAdReward(userId, amount) {
    const wallet = await this.getWallet(userId);
    
    wallet.balance += amount;
    await wallet.save();

    await Transaction.create({
      user_id: userId,
      type: 'ad_reward',
      amount,
      balance_before: wallet.balance - amount,
      balance_after: wallet.balance,
      status: 'completed',
      payment_method: 'admob',
      description: `Ad reward: ₹${amount}`,
    });

    return wallet;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId, page = 1, limit = 20) {
    const transactions = await Transaction.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Transaction.countDocuments({ user_id: userId });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new WalletService();
