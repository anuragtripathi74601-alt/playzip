import 'dart:math';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../models/game_model.dart';
import '../../services/game_service.dart';
import '../../models/match_model.dart';
import '../../app.dart';

class SnookerScreen extends StatefulWidget {
  final LevelConfig level;
  const SnookerScreen({super.key, required this.level});

  @override
  State<SnookerScreen> createState() => _SnookerScreenState();
}

class _SnookerScreenState extends State<SnookerScreen> {
  static const double _tableW = 700, _tableH = 350;
  static const double _ballR = 6, _friction = 0.985, _minSpeed = 0.1;

  late List<_SnookerBall> _balls;
  double _power = 0, _angle = 0;
  bool _shooting = false, _gameOver = false, _aiThinking = false;
  String _phase = 'reds'; // 'reds', 'colors'
  int _playerScore = 0, _aiScore = 0;
  int _turn = 0; // 0 = player, 1 = AI
  String _status = 'Your turn - Pot a red!';
  final Map<String, bool> _reSpotted = {};
  final Map<String, bool> _pottedColors = {};

  final _service = PlayZipApp.gameService;

  @override
  void initState() {
    super.initState();
    _setupBalls();
    _gameLoop();
  }

  void _setupBalls() {
    _balls = [];
    _balls.add(_SnookerBall('cue', 350, 280)); // Cue ball
    // Reds - triangle
    double rx = 160, ry = 175;
    for (int r = 0; r < 5; r++) {
      for (int c = 0; c <= r; c++) {
        _balls.add(_SnookerBall('red', rx + r * _ballR * 2.1, ry - r * _ballR * 1.05 + c * _ballR * 2.1));
      }
    }
    // Colors
    _balls.add(_SnookerBall('yellow', 25, 25));
    _balls.add(_SnookerBall('green', 25, 325));
    _balls.add(_SnookerBall('brown', 350, 25));
    _balls.add(_SnookerBall('blue', 350, 175));
    _balls.add(_SnookerBall('pink', 250, 175));
    _balls.add(_SnookerBall('black', 200, 175));
  }

  final Map<String, int> _colorPts = {
    'yellow': 2, 'green': 3, 'brown': 4, 'blue': 5, 'pink': 6, 'black': 7,
  };

  static const List<double> _pocketX = [25, 350, 675, 25, 350, 675];
  static const List<double> _pocketY = [25, 10, 25, 325, 340, 325];
  static const double _pocketR = 16;

  void _gameLoop() {
    Future.delayed(const Duration(milliseconds: 16), () {
      if (!mounted) return;
      bool moving = false;

      for (final ball in _balls) {
        if (ball.potted) continue;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= _friction;
        ball.vy *= _friction;
        if (ball.vx.abs() < _minSpeed && ball.vy.abs() < _minSpeed) {
          ball.vx = 0;
          ball.vy = 0;
        } else moving = true;

        // Walls
        if (ball.x - _ballR < 25) { ball.x = 25 + _ballR; ball.vx = -ball.vx * 0.8; }
        if (ball.x + _ballR > 675) { ball.x = 675 - _ballR; ball.vx = -ball.vx * 0.8; }
        if (ball.y - _ballR < 25) { ball.y = 25 + _ballR; ball.vy = -ball.vy * 0.8; }
        if (ball.y + _ballR > 325) { ball.y = 325 - _ballR; ball.vy = -ball.vy * 0.8; }

        // Pockets
        for (int p = 0; p < 6; p++) {
          final dx = ball.x - _pocketX[p], dy = ball.y - _pocketY[p];
          if (dx * dx + dy * dy < _pocketR * _pocketR) {
            if (ball.name == 'cue') {
              ball.x = 350; ball.y = 280;
              ball.vx = ball.vy = 0;
              ball.potted = false;
            } else if (ball.name == 'red' && _phase == 'reds') {
              ball.potted = true;
              _balls.where((b) => b.name == 'red' && b.potted).length; // count
            } else if (_colorPts.containsKey(ball.name)) {
              if (_phase == 'reds') {
                _reSpotted[ball.name] = true;
                // Re-spot
                ball.potted = false;
                ball.x = _homeX(ball.name);
                ball.y = _homeY(ball.name);
                ball.vx = ball.vy = 0;
              } else {
                ball.potted = true;
                _pottedColors[ball.name] = true;
              }
            }
          }
        }
      }

      // Ball collisions
      for (int i = 0; i < _balls.length; i++) {
        for (int j = i + 1; j < _balls.length; j++) {
          if (_balls[i].potted || _balls[j].potted) continue;
          final dx = _balls[j].x - _balls[i].x;
          final dy = _balls[j].y - _balls[i].y;
          final dist = sqrt(dx * dx + dy * dy);
          if (dist < _ballR * 2 && dist > 0) {
            final nx = dx / dist, ny = dy / dist;
            final overlap = _ballR * 2 - dist;
            _balls[i].x -= nx * overlap / 2;
            _balls[i].y -= ny * overlap / 2;
            _balls[j].x += nx * overlap / 2;
            _balls[j].y += ny * overlap / 2;
            final dvx = _balls[i].vx - _balls[j].vx;
            final dvy = _balls[i].vy - _balls[j].vy;
            final dvn = dvx * nx + dvy * ny;
            if (dvn > 0) {
              _balls[i].vx -= dvn * nx;
              _balls[i].vy -= dvn * ny;
              _balls[j].vx += dvn * nx;
              _balls[j].vy += dvn * ny;
            }
          }
        }
      }

      if (!moving) {
        _checkScoring();
        if (_turn == 1 && !_gameOver) _aiShoot();
      }

      setState(() {});
      _gameLoop();
    });
  }

  void _shoot(double power, double angle) {
    if (_gameOver || _turn != 0) return;
    final cue = _balls[0];
    cue.vx = -cos(angle) * power;
    cue.vy = -sin(angle) * power;
    _shooting = false;
  }

  void _checkScoring() {
    final pottedReds = _balls.where((b) => b.name == 'red' && b.potted).length;
    final pottedColor = _balls.firstWhere(
      (b) => _colorPts.containsKey(b.name) && b.potted && !_reSpotted.containsKey(b.name),
      orElse: () => _SnookerBall('', 0, 0),
    );

    if (_turn == 0) {
      if (pottedReds > 0) _playerScore++;
      if (pottedColor.name.isNotEmpty) _playerScore += _colorPts[pottedColor.name] ?? 0;
    } else {
      if (pottedReds > 0) _aiScore++;
      if (pottedColor.name.isNotEmpty) _aiScore += _colorPts[pottedColor.name] ?? 0;
    }

    // Check phase transition
    if (_phase == 'reds' && _balls.where((b) => b.name == 'red' && !b.potted).isEmpty) {
      _phase = 'colors';
      _status = 'Final colors phase!';
    }

    // Check game over
    if (_phase == 'colors' && _pottedColors.length == 6) {
      _gameOver = true;
      final winner = _playerScore > _aiScore ? 'Player' : 'AI';
      _status = '🏆 $winner wins! $_playerScore - $_aiScore';
      _endGame(winner == 'Player' ? 'win' : 'loss');
    }

    _turn = 0;
    if (!_gameOver) _status = 'Your turn!';
    setState(() {});
  }

  void _aiShoot() {
    if (_gameOver || _aiThinking) return;
    _aiThinking = true;
    Future.delayed(const Duration(milliseconds: 1000 + Random().nextInt(1000)), () {
      if (!mounted) return;
      final cue = _balls[0];
      final targets = _balls.where((b) => !b.potted && (b.name == 'red' || _colorPts.containsKey(b.name))).toList();
      if (targets.isEmpty) { _aiThinking = false; return; }
      final target = targets[Random().nextInt(targets.length)];
      final angle = atan2(target.y - cue.y, target.x - cue.x) + pi;
      final power = 2 + Random().nextDouble() * 3;
      cue.vx = cos(angle) * power;
      cue.vy = sin(angle) * power;
      _aiThinking = false;
      _turn = 1;
      setState(() => _status = 'AI thinking...');
      Future.delayed(const Duration(seconds: 2), () {
        if (!mounted) return;
        _turn = 0;
        if (!_gameOver) _status = 'Your turn!';
        setState(() {});
      });
    });
  }

  void _endGame(String result) {
    _service.addMatch(MatchModel(
      id: 'sn_${DateTime.now().millisecondsSinceEpoch}',
      gameType: 'Snooker',
      opponentName: 'AI',
      level: widget.level.name,
      entryFee: widget.level.entryFee,
      prize: result == 'win' ? widget.level.winnerGets : 0,
      result: result,
      playerScore: _playerScore,
      opponentScore: _aiScore,
    ));
    if (result == 'win') _service.creditWin(widget.level.winnerGets);
  }

  double _homeX(String name) {
    switch (name) {
      case 'yellow': return 25;
      case 'green': return 25;
      case 'brown': return 350;
      case 'blue': return 350;
      case 'pink': return 250;
      case 'black': return 200;
      default: return 350;
    }
  }

  double _homeY(String name) {
    switch (name) {
      case 'yellow': return 25;
      case 'green': return 325;
      case 'brown': return 25;
      case 'blue': return 175;
      case 'pink': return 175;
      case 'black': return 175;
      default: return 175;
    }
  }

  Color _ballColor(String name) {
    switch (name) {
      case 'cue': return Colors.white;
      case 'red': return Colors.red;
      case 'yellow': return Colors.amber;
      case 'green': return Colors.green;
      case 'brown': return Colors.brown;
      case 'blue': return Colors.blue;
      case 'pink': return Colors.pink;
      case 'black': return Colors.black87;
      default: return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1B5E20), AppTheme.darkSurface],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                    Expanded(child: Text(_status, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold), textAlign: TextAlign.center)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.person, color: Colors.white70, size: 14),
                        Text('$_playerScore', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        const Text(' - ', style: TextStyle(color: Colors.white54)),
                        Text('$_aiScore', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        const Icon(Icons.computer, color: Colors.white70, size: 14),
                      ]),
                    ),
                  ],
                ),
              ),

              // Phase indicator
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: _phase == 'reds' ? Colors.red.withOpacity(0.2) : Colors.amber.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_phase == 'reds' ? '🔴 Reds Phase' : '🌈 Colors Phase',
                    style: TextStyle(color: Colors.white, fontSize: 11)),
              ),

              // Table
              Expanded(
                child: GestureDetector(
                  onPanStart: (_) => _shooting = true,
                  onPanUpdate: (d) {
                    if (_shooting && _turn == 0 && !_gameOver) {
                      setState(() {
                        _angle = atan2(d.localPosition.dy - 180, d.localPosition.dx - MediaQuery.of(context).size.width / 2) + pi;
                        _power = min(sqrt(pow(d.localPosition.dx - MediaQuery.of(context).size.width / 2, 2) + pow(d.localPosition.dy - 180, 2)) / 100, 10);
                      });
                    }
                  },
                  onPanEnd: (_) {
                    if (_shooting && _turn == 0 && _power > 0.5) _shoot(_power, _angle);
                    _shooting = false;
                  },
                  child: CustomPaint(
                    size: Size.infinite,
                    painter: _SnookerTablePainter(_balls, _shooting, _power, _angle, _turn, _gameOver, _phase, _pottedColors, _reSpotted, _ballColor),
                  ),
                ),
              ),

              // Power bar
              if (_shooting && _turn == 0 && !_gameOver)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 8),
                  child: Column(children: [
                    Text('Power: ${(_power * 10).toStringAsFixed(0)}%', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 4),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _power / 10, backgroundColor: Colors.white24,
                        valueColor: AlwaysStoppedAnimation<Color>(_power > 6 ? Colors.red : _power > 3 ? Colors.orange : Colors.green),
                        minHeight: 6,
                      ),
                    ),
                  ]),
                ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _SnookerBall {
  final String name;
  double x, y, vx, vy;
  bool potted;
  _SnookerBall(this.name, this.x, this.y, {this.vx = 0, this.vy = 0, this.potted = false});
}

class _SnookerTablePainter extends CustomPainter {
  final List<_SnookerBall> balls;
  final bool shooting, gameOver;
  final double power, angle;
  final int turn;
  final String phase;
  final Map<String, bool> pottedColors, reSpotted;
  final Color Function(String) ballColor;

  _SnookerTablePainter(this.balls, this.shooting, this.power, this.angle, this.turn, this.gameOver, this.phase, this.pottedColors, this.reSpotted, this.ballColor);

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 720;
    final rect = RRect.fromRectAndRadius(Rect.fromLTWH(15 * scale, 15 * scale, 690 * scale, 320 * scale), const Radius.circular(8));
    canvas.drawRRect(rect, Paint()..color = const Color(0xFF0D7A3E));
    canvas.drawRRect(rect, Paint()..style = PaintingStyle.stroke..strokeWidth = 8..color = const Color(0xFF5D3A1A));

    for (final ball in balls) {
      if (ball.potted) continue;
      if (pottedColors.containsKey(ball.name) && phase == 'colors') continue;
      canvas.drawCircle(Offset(ball.x * scale, ball.y * scale), 6 * scale, Paint()..color = ballColor(ball.name));
      if (ball.name == 'cue') canvas.drawCircle(Offset(ball.x * scale - 1.5, ball.y * scale - 1.5), 2 * scale, Paint()..color = Colors.white.withOpacity(0.5));
    }

    if (shooting && turn == 0 && !gameOver && balls.isNotEmpty) {
      final cue = balls[0];
      canvas.drawLine(Offset(cue.x * scale, cue.y * scale), Offset((cue.x + cos(angle) * 80) * scale, (cue.y + sin(angle) * 80) * scale), Paint()..color = Colors.white.withOpacity(0.6)..strokeWidth = 2);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
