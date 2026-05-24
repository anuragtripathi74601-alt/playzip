import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/game_service.dart';
import '../../app.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _service = PlayZipApp.gameService;

  @override
  void initState() {
    super.initState();
    _service.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _service.removeListener(() {});
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = _service.currentUser;
    if (user == null) return const SizedBox();

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
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                // Header
                Row(
                  children: [
                    IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                    const Spacer(),
                    const Text('Profile', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    PopupMenuButton<String>(
                      icon: Icon(Icons.more_vert, color: Colors.white.withOpacity(0.7)),
                      color: AppTheme.darkSurface,
                      onSelected: (v) {
                        if (v == 'logout') {
                          _service.logout();
                          Navigator.pushNamedAndRemoveUntil(context, '/auth', (route) => false);
                        }
                      },
                      itemBuilder: (_) => [
                        const PopupMenuItem(value: 'logout', child: ListTile(leading: Icon(Icons.logout, color: Colors.red), title: Text('Logout', style: TextStyle(color: Colors.red)), dense: true)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Avatar
                Container(
                  width: 80, height: 80,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [AppTheme.accentColor, AppTheme.accentColor.withOpacity(0.6)]),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: AppTheme.accentColor.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 6))],
                  ),
                  child: Center(
                    child: Text(user.name[0].toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 12),
                Text(user.name, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                Text('+${user.phone}', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 14)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.verified, color: user.isKycVerified ? Colors.green : Colors.grey, size: 16),
                    const SizedBox(width: 4),
                    Text(user.isKycVerified ? 'KYC Verified' : 'KYC Pending',
                        style: TextStyle(color: user.isKycVerified ? Colors.green : Colors.white54, fontSize: 13)),
                  ],
                ),
                const SizedBox(height: 24),

                // Stats cards
                Row(
                  children: [
                    _statCard('🪙', 'Balance', '₹${user.balance.toStringAsFixed(0)}'),
                    const SizedBox(width: 8),
                    _statCard('🏆', 'Win Rate', '${user.winRate.toStringAsFixed(0)}%'),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _statCard('🎮', 'Games', '${user.gamesPlayed}'),
                    const SizedBox(width: 8),
                    _statCard('✅', 'Wins', '${user.wins}'),
                    const SizedBox(width: 8),
                    _statCard('💔', 'Losses', '${user.losses}'),
                  ],
                ),
                const SizedBox(height: 24),

                // Settings section
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Account Details', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      _infoRow('📱', 'Phone', user.phone),
                      _infoRow('🆔', 'User ID', user.id),
                      _infoRow('📅', 'Joined', '${user.joinDate.day}/${user.joinDate.month}/${user.joinDate.year}'),
                      if (user.upiId != null) _infoRow('💳', 'UPI ID', user.upiId!),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Match History
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Match History', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      ..._service.matchHistory.map((m) => Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05)))),
                        child: Row(
                          children: [
                            Text(m.resultIcon, style: const TextStyle(fontSize: 18)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('${m.gameType} - ${m.level}',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 13)),
                                  Text(m.opponentName,
                                      style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(m.scoreDisplay,
                                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                Text(m.result?.toUpperCase() ?? 'PENDING',
                                    style: TextStyle(
                                      color: m.result == 'win' ? Colors.green : m.result == 'loss' ? Colors.red : Colors.amber,
                                      fontSize: 10, fontWeight: FontWeight.bold,
                                    )),
                              ],
                            ),
                          ],
                        ),
                      )),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _statCard(String icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 24)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _infoRow(String icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 16)),
          const SizedBox(width: 8),
          SizedBox(width: 70, child: Text(label, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(color: Colors.white, fontSize: 13))),
        ],
      ),
    );
  }
}
