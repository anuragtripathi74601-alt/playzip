import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../models/game_model.dart';
import '../../services/game_service.dart';
import '../../app.dart';

class GameLobbyScreen extends StatefulWidget {
  final String gameKey;
  const GameLobbyScreen({super.key, required this.gameKey});

  @override
  State<GameLobbyScreen> createState() => _GameLobbyScreenState();
}

class _GameLobbyScreenState extends State<GameLobbyScreen> {
  final _service = PlayZipApp.gameService;
  late GameConfig _game;
  GameMode _selectedMode = GameMode.liveMatch;
  bool _matching = false;

  @override
  void initState() {
    super.initState();
    _game = _service.games.firstWhere(
      (g) => g.key == widget.gameKey,
      orElse: () => GameConfig(key: widget.gameKey, name: widget.gameKey.toUpperCase(), icon: '🎮', color: '#6C63FF'),
    );
    _service.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _service.removeListener(() {});
    super.dispose();
  }

  void _startMatch(LevelConfig level) {
    if (_selectedMode == GameMode.free) {
      Navigator.pushNamed(context, '/game/${widget.gameKey}', arguments: level);
      return;
    }
    if (_service.currentUser == null) return;
    if (_service.currentUser!.balance < level.entryFee) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Insufficient balance! Please deposit.'), backgroundColor: Colors.red),
      );
      return;
    }
    setState(() => _matching = true);
    Future.delayed(const Duration(seconds: 3), () {
      if (!mounted) return;
      _service.deductEntryFee(level.entryFee);
      setState(() => _matching = false);
      Navigator.pushNamed(context, '/game/${widget.gameKey}', arguments: level);
    });
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
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(child: Text(_game.icon, style: const TextStyle(fontSize: 22))),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_game.name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                          Text('Select mode & play', style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('₹${user?.balance.toStringAsFixed(0) ?? '0'}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),

              // Mode Selector
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    _modeChip('⚔️ Live', GameMode.liveMatch),
                    const SizedBox(width: 8),
                    _modeChip('🎯 Free', GameMode.free),
                    const SizedBox(width: 8),
                    _modeChip('👥 Friend', GameMode.friendMatch),
                    const SizedBox(width: 8),
                    _modeChip('📖 Practice', GameMode.practice),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Matchmaking overlay
              if (_matching)
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(width: 60, height: 60, child: CircularProgressIndicator(color: AppTheme.accentColor, strokeWidth: 3)),
                        const SizedBox(height: 20),
                        const Text('Finding opponent...', style: TextStyle(color: Colors.white, fontSize: 18)),
                        const SizedBox(height: 8),
                        Text('Searching for players at your level', style: TextStyle(color: Colors.white.withOpacity(0.5))),
                      ],
                    ),
                  ),
                )
              else
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: _game.levels.map((level) => _buildLevelCard(level)).toList(),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modeChip(String label, GameMode mode) {
    final selected = _selectedMode == mode;
    return GestureDetector(
      onTap: () => setState(() => _selectedMode = mode),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.accentColor : Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(20),
          border: selected ? null : Border.all(color: Colors.white.withOpacity(0.15)),
        ),
        child: Text(label, style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: selected ? FontWeight.bold : FontWeight.normal)),
      ),
    );
  }

  Widget _buildLevelCard(LevelConfig level) {
    final isFree = _selectedMode == GameMode.free || level.entryFee == 0;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.06),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _getLevelColor(level.name).withOpacity(0.3)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _startMatch(level),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48, height: 48,
                  decoration: BoxDecoration(
                    color: _getLevelColor(level.name).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(_getLevelBadge(level.name),
                        style: TextStyle(fontSize: 20, color: _getLevelColor(level.name))),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(level.name, style: TextStyle(
                            color: _getLevelColor(level.name),
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          )),
                          const SizedBox(width: 8),
                          if (!isFree)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.accentColor.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text('${level.platformCut.toStringAsFixed(0)}% cut',
                                  style: const TextStyle(color: AppTheme.accentColor, fontSize: 10)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          if (!isFree) ...[
                            Text('Fee: ₹${level.entryFee.toStringAsFixed(0)}',
                                style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
                            const SizedBox(width: 12),
                          ],
                          Text('Win: ₹${level.winnerGets.toStringAsFixed(0)}',
                              style: const TextStyle(color: AppTheme.successColor, fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, color: Colors.white.withOpacity(0.4), size: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Color _getLevelColor(String name) {
    switch (name) {
      case 'FREE': return Colors.grey;
      case 'STARTER': return Colors.green;
      case 'STANDARD': return Colors.blue;
      case 'PRO': return Colors.orange;
      case 'ADVANCED': return Colors.purple;
      case 'ELITE': return Colors.amber;
      default: return Colors.white;
    }
  }

  String _getLevelBadge(String name) {
    switch (name) {
      case 'FREE': return '🆓';
      case 'STARTER': return '🌟';
      case 'STANDARD': return '⚡';
      case 'PRO': return '🔥';
      case 'ADVANCED': return '💎';
      case 'ELITE': return '👑';
      default: return '🎯';
    }
  }
}
