import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../models/transaction_model.dart';
import '../models/match_model.dart';
import '../models/game_model.dart';

class GameService extends ChangeNotifier {
  UserModel? _currentUser;
  List<TransactionModel> _transactions = [];
  List<MatchModel> _matchHistory = [];
  List<GameConfig> _games = GameConfig.defaultGames;
  bool _isLoading = false;
  String? _otp;

  UserModel? get currentUser => _currentUser;
  List<TransactionModel> get transactions => _transactions;
  List<MatchModel> get matchHistory => _matchHistory;
  List<GameConfig> get games => _games;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _currentUser != null;

  // --- Auth ---
  Future<bool> sendOtp(String phone) async {
    _isLoading = true;
    notifyListeners();
    await Future.delayed(const Duration(seconds: 1));
    _otp = '123456'; // Demo: auto-OTP
    _isLoading = false;
    notifyListeners();
    return true;
  }

  Future<bool> verifyOtp(String otp) async {
    _isLoading = true;
    notifyListeners();
    await Future.delayed(const Duration(milliseconds: 500));
    if (otp == _otp || otp == '123456') {
      if (_currentUser == null) {
        _currentUser = UserModel(
          id: 'user_${DateTime.now().millisecondsSinceEpoch}',
          name: 'Player',
          phone: '9876543210',
          balance: 50, // Welcome bonus
        );
        _addTransaction(TransactionModel(
          id: 'txn_bonus',
          type: 'bonus',
          amount: 50,
          description: 'Welcome bonus',
        ));
      }
      _isLoading = false;
      notifyListeners();
      return true;
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  void logout() {
    _currentUser = null;
    _transactions.clear();
    _matchHistory.clear();
    notifyListeners();
  }

  // --- Wallet ---
  void deposit(double amount) {
    if (_currentUser == null) return;
    _currentUser!.balance += amount;
    _addTransaction(TransactionModel(
      id: 'dep_${DateTime.now().millisecondsSinceEpoch}',
      type: 'deposit',
      amount: amount,
      description: 'UPI Deposit',
    ));
    notifyListeners();
  }

  bool withdraw(double amount, String upiId) {
    if (_currentUser == null || _currentUser!.balance < amount) return false;
    if (amount < 200) return false; // Min withdrawal
    _currentUser!.balance -= amount;
    _addTransaction(TransactionModel(
      id: 'wd_${DateTime.now().millisecondsSinceEpoch}',
      type: 'withdrawal',
      amount: amount,
      status: 'pending',
      description: 'Withdrawal to $upiId',
    ));
    notifyListeners();
    return true;
  }

  bool deductEntryFee(double fee) {
    if (_currentUser == null || _currentUser!.balance < fee) return false;
    _currentUser!.balance -= fee;
    _addTransaction(TransactionModel(
      id: 'fee_${DateTime.now().millisecondsSinceEpoch}',
      type: 'match_fee',
      amount: fee,
      description: 'Entry fee deducted',
    ));
    notifyListeners();
    return true;
  }

  void creditWin(double amount) {
    if (_currentUser == null) return;
    _currentUser!.balance += amount;
    _addTransaction(TransactionModel(
      id: 'win_${DateTime.now().millisecondsSinceEpoch}',
      type: 'match_win',
      amount: amount,
      description: 'Match won!',
    ));
    notifyListeners();
  }

  void _addTransaction(TransactionModel txn) {
    _transactions.insert(0, txn);
    if (_transactions.length > 50) _transactions.removeLast();
  }

  // --- Matches ---
  void addMatch(MatchModel match) {
    _matchHistory.insert(0, match);
    if (_currentUser != null) {
      _currentUser!.gamesPlayed++;
      if (match.result == 'win') _currentUser!.wins++;
      if (match.result == 'loss') _currentUser!.losses++;
    }
    notifyListeners();
  }

  // --- Friends ---
  void addFriend(String friendId) {
    if (_currentUser == null) return;
    if (!_currentUser!.friendIds.contains(friendId)) {
      _currentUser!.friendIds.add(friendId);
      notifyListeners();
    }
  }

  void removeFriend(String friendId) {
    if (_currentUser == null) return;
    _currentUser!.friendIds.remove(friendId);
    notifyListeners();
  }

  // --- Demo Data ---
  void loadDemoData() {
    if (_matchHistory.isNotEmpty) return;
    final demoMatches = [
      MatchModel(id: 'm1', gameType: 'Chess', opponentName: 'Rahul', level: 'STARTER', entryFee: 50, prize: 80, result: 'win', playerScore: 1, opponentScore: 0),
      MatchModel(id: 'm2', gameType: 'Pool', opponentName: 'Amit', level: 'STANDARD', entryFee: 100, prize: 170, result: 'loss', playerScore: 3, opponentScore: 5),
      MatchModel(id: 'm3', gameType: 'Snooker', opponentName: 'Vikram', level: 'FREE', entryFee: 0, prize: 0, result: 'draw', playerScore: 20, opponentScore: 20),
      MatchModel(id: 'm4', gameType: 'Chess', opponentName: 'Priya', level: 'PRO', entryFee: 200, prize: 350, result: 'win', playerScore: 1, opponentScore: 0),
    ];
    _matchHistory.addAll(demoMatches);
    if (_currentUser != null) {
      _currentUser!.gamesPlayed = 4;
      _currentUser!.wins = 2;
      _currentUser!.losses = 1;
    }
    notifyListeners();
  }
}
