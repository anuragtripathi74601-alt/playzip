import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../services/game_service.dart';
import '../../models/game_model.dart';
import '../../app.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _service = PlayZipApp.gameService;

  @override
  void initState() {
    super.initState();
    _service.addListener(_onServiceChange);
    _service.loadDemoData();
  }

  @override
  void dispose() {
    _service.removeListener(_onServiceChange);
    super.dispose();
  }

  void _onServiceChange() => setState(() {});

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
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hello, ${user?.name ?? 'Player'} 👋',
                            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                        Text('Ready to play?',
                            style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 14)),
                      ],
                    ),
                    Row(
                      children: [
                        // Balance chip
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppTheme.accentColor.withOpacity(0.3)),
                          ),
                          child: Row(
                            children: [
                              const Text('🪙', style: TextStyle(fontSize: 16)),
                              const SizedBox(width: 4),
                              Text('₹${user?.balance.toStringAsFixed(0) ?? '0'}',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Profile
                        GestureDetector(
                          onTap: () => Navigator.pushNamed(context, '/profile'),
                          child: CircleAvatar(
                            radius: 18,
                            backgroundColor: AppTheme.accentColor,
                            child: Text(user?.name.isNotEmpty == true ? user!.name[0].toUpperCase() : 'P',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Games Grid
                const Text('Play Games', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ..._service.games.map((game) => _buildGameCard(game)),

                const SizedBox(height: 20),

                // Quick Actions
                const Text('Quick Actions', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _quickActionCard('💰', 'Deposit', () => Navigator.pushNamed(context, '/wallet')),
                    const SizedBox(width: 12),
                    _quickActionCard('👥', 'Friends', () => Navigator.pushNamed(context, '/friends')),
                    const SizedBox(width: 12),
                    _quickActionCard('📊', 'History', () => Navigator.pushNamed(context, '/profile')),
                  ],
                ),
                const SizedBox(height: 20),

                // Match History Preview
                const Text('Recent Matches', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                ..._service.matchHistory.take(3).map((m) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.06),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Text(m.resultIcon, style: const TextStyle(fontSize: 20)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${m.gameType} vs ${m.opponentName}',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
                            Text(m.level, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                          ],
                        ),
                      ),
                      Text(m.scoreDisplay,
                          style: TextStyle(color: Colors.white.withOpacity(0.7), fontWeight: FontWeight.bold)),
                    ],
                  ),
                )),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGameCard(GameConfig game) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [
            Color(int.parse(game.color.replaceFirst('#', 'FF'), radix: 16)),
            Color(int.parse(game.color.replaceFirst('#', 'FF'), radix: 16)).withOpacity(0.6),
          ],
        ),
        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 8, offset: const Offset(0, 4))],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => Navigator.pushNamed(context, '/game_lobby', arguments: game.key),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(child: Text(game.icon, style: const TextStyle(fontSize: 28))),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(game.name,
                          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text('Play & earn real money',
                          style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
                    ],
                  ),
                ),
                Icon(Icons.play_circle_fill, color: Colors.white.withOpacity(0.8), size: 32),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _quickActionCard(String icon, String label, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: Column(
            children: [
              Text(icon, style: const TextStyle(fontSize: 28)),
              const SizedBox(height: 6),
              Text(label, style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }
}
