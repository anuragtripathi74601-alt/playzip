import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/game_service.dart';
import '../../models/transaction_model.dart';
import '../../app.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  final _service = PlayZipApp.gameService;
  final _upiController = TextEditingController();
  final _amountController = TextEditingController();
  String _tab = 'balance';

  @override
  void initState() {
    super.initState();
    _service.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _service.removeListener(() {});
    _upiController.dispose();
    _amountController.dispose();
    super.dispose();
  }

  void _showDepositDialog() {
    final amounts = [50, 100, 200, 500, 1000, 2000];
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.darkSurface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            const Text('Add Money', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            Wrap(
              spacing: 10, runSpacing: 10,
              children: amounts.map((a) => GestureDetector(
                onTap: () {
                  _service.deposit(a.toDouble());
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('₹$a added successfully!'), backgroundColor: Colors.green));
                },
                child: Container(
                  width: (MediaQuery.of(context).size.width - 68) / 3,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: AppTheme.accentColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.accentColor.withOpacity(0.3)),
                  ),
                  child: Text('₹$a', textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              )).toList(),
            ),
            const SizedBox(height: 16),
            Text('via UPI', style: TextStyle(color: Colors.white.withOpacity(0.5))),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  void _showWithdrawDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.darkSurface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)), margin: const EdgeInsets.only(bottom: 16)),
            const Text('Withdraw', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            Text('Amount (min ₹200)', style: TextStyle(color: Colors.white.withOpacity(0.6))),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.08), borderRadius: BorderRadius.circular(12)),
              child: TextField(
                controller: _amountController,
                keyboardType: TextInputType.number,
                style: const TextStyle(color: Colors.white, fontSize: 20),
                decoration: InputDecoration(border: InputBorder.none, hintText: '₹500', hintStyle: TextStyle(color: Colors.white.withOpacity(0.3))),
              ),
            ),
            const SizedBox(height: 12),
            Text('UPI ID', style: TextStyle(color: Colors.white.withOpacity(0.6))),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.08), borderRadius: BorderRadius.circular(12)),
              child: TextField(
                controller: _upiController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(border: InputBorder.none, hintText: 'example@upi', hintStyle: TextStyle(color: Colors.white.withOpacity(0.3))),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity, height: 48,
              child: ElevatedButton(
                onPressed: () {
                  final amount = double.tryParse(_amountController.text) ?? 0;
                  final upi = _upiController.text.trim();
                  if (amount >= 200 && upi.isNotEmpty) {
                    final success = _service.withdraw(amount, upi);
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text(success ? 'Withdrawal request submitted!' : 'Insufficient balance!'),
                      backgroundColor: success ? Colors.green : Colors.red,
                    ));
                    _amountController.clear();
                    _upiController.clear();
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentColor, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                child: const Text('Withdraw', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = _service.currentUser;
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.primaryColor, AppTheme.darkSurface],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                    const Spacer(),
                    const Text('Wallet', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    const SizedBox(width: 48),
                  ],
                ),
              ),

              // Balance card
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [AppTheme.accentColor, AppTheme.accentColor.withOpacity(0.7)]),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: AppTheme.accentColor.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 8))],
                ),
                child: Column(
                  children: [
                    Text('Total Balance', style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                    const SizedBox(height: 8),
                    Text('₹${user?.balance.toStringAsFixed(0) ?? '0'}',
                        style: const TextStyle(color: Colors.white, fontSize: 40, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _showDepositDialog,
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('Add Money'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: AppTheme.accentColor,
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _showWithdrawDialog,
                            icon: const Icon(Icons.arrow_upward, size: 18),
                            label: const Text('Withdraw'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: Colors.white,
                              side: const BorderSide(color: Colors.white38),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Tabs
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _tabChip('💰 Balance', 'balance'),
                    const SizedBox(width: 8),
                    _tabChip('📥 Deposit', 'deposit'),
                    const SizedBox(width: 8),
                    _tabChip('📤 Withdrawal', 'withdrawal'),
                    const SizedBox(width: 8),
                    _tabChip('🏆 Wins', 'wins'),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Transaction list
              Expanded(
                child: _service.transactions.isEmpty
                    ? Center(child: Text('No transactions yet', style: TextStyle(color: Colors.white.withOpacity(0.4))))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _service.transactions.length,
                        itemBuilder: (ctx, i) {
                          final t = _service.transactions[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(
                                    color: (t.isCredit ? Colors.green : Colors.red).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Center(child: Text(t.typeIcon, style: const TextStyle(fontSize: 18))),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(t.description ?? t.type, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                                      Text(t.status, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 11)),
                                    ],
                                  ),
                                ),
                                Text(t.formattedAmount, style: TextStyle(
                                  color: t.isCredit ? Colors.green : Colors.red,
                                  fontWeight: FontWeight.bold,
                                )),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tabChip(String label, String tab) {
    final selected = _tab == tab;
    return GestureDetector(
      onTap: () => setState(() => _tab = tab),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.accentColor : Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(label, style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
      ),
    );
  }
}
