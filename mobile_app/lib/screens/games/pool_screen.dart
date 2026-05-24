import 'dart:math';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../models/game_model.dart';
import '../../services/game_service.dart';
import '../../models/match_model.dart';
import '../../app.dart';

class PoolScreen extends StatefulWidget {
  final LevelConfig level;
  const PoolScreen({super.key, required this.level});

  @override
  State<PoolScreen> createState() => _PoolScreenState();
}

class _PoolScreenState extends State<PoolScreen> {
  // Physics constants
  static const double _tableW = 700, _tableH = 350;
  static const double _ballR = 7, _friction = 0.985, _minSpeed = 0.1;
  static const double _cueX = 350, _cueY = 280;
  static const List<double> _pocketX = [25, 350, 675, 25, 350, 675];
  static const List<double> _pocketY = [25, 10, 25, 325, 340, 325];
  static const double _pocketR = 18;
  static const List<int> BALL_SOLIDS = [1, 2, 3, 4, 5, 6, 7];
  static const List<int> BALL_STRIPES = [9, 10, 11, 12, 13, 14, 15];

  late List<_Ball> _balls;
  bool _shooting = false;
  double _power = 0;
  double _angle = 0;
  int? _playerBalls; // null = none, 0 = solids, 1 = stripes
  int _turn = 0; // 0 = player, 1 = AI
  int _playerScore = 0, _aiScore = 0;
  bool _gameOver = false;
  String _status = 'Your turn - Break!';
  bool _aiThinking = false;

  final _service = PlayZipApp.gameService;

  @override
  void initState() {
    super.initState();
    _setupRack();
    _gameLoop();
  }

  void _setupRack() {
    _balls = [];
    _balls.add(_Ball(0, _cueX, _cueY)); // Cue ball

    // 8-ball rack
    final startX = 150.0, startY = 175.0;
    final rows = [1, 2, 3, 4, 5];
    int ballId = 1;
    for (int r = 0; r < rows.length; r++) {
      for (int c = 0; c <= r; c++) {
        final x = startX + r * _ballR * 2.1;
        final y = startY - r * _ballR * 1.05 + c * _ballR * 2.1;
        _balls.add(_Ball(ballId, x, y));
        ballId++;
      }
    }
    // Ensure 8-ball (id 8) is in center
    _balls[8].x = startX + 2 * _ballR * 2.1;
    _balls[8].y = startY;
  }

  void _gameLoop() {
    Future.delayed(const Duration(milliseconds: 16), () {
      if (!mounted || (_gameOver && _balls.every((b) => b.vx == 0 && b.vy == 0))) return;
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
            ball.potted = true;
            if (ball.id == 0) {
              ball.x = _cueX;
              ball.y = _cueY;
              ball.potted = false;
              ball.vx = ball.vy = 0;
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
        _checkPotted();
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
    _power = 0;
  }

  void _checkPotted() {
    final potted = _balls.where((b) => b.potted && b.id != 0).toList();
    if (potted.isEmpty && _turn == 1) {
      _turn = 0;
      _status = 'Your turn';
      setState(() {});
      return;
    }

    if (_playerBalls == null && potted.isNotEmpty) {
      // Determine player's group
      for (final ball in potted) {
        if (BALL_SOLIDS.contains(ball.id)) {
          _playerBalls = 0;
          break;
        } else if (BALL_STRIPES.contains(ball.id)) {
          _playerBalls = 1;
          break;
        }
      }
    }

    for (final ball in potted) {
      if (_playerBalls == 0 && BALL_SOLIDS.contains(ball.id)) _playerScore++;
      else if (_playerBalls == 1 && BALL_STRIPES.contains(ball.id)) _playerScore++;
      else if (ball.id == 8) {
        _gameOver = true;
        _status = '🏆 You potted the 8-ball! YOU WIN!';
        _endGame('win');
        return;
      }
    }
    _turn = 0;
    _status = 'Your turn';
    setState(() {});
  }

  void _aiShoot() {
    if (_gameOver || _aiThinking) return;
    _aiThinking = true;
    Future.delayed(const Duration(milliseconds: 800 + Random().nextInt(800)), () {
      if (!mounted) return;
      final cue = _balls[0];
      final targetBall = _balls.firstWhere(
        (b) => !b.potted && b.id != 0 && b.id != 8,
        orElse: () => _balls.firstWhere((b) => !b.potted && b.id != 0, orElse: () => _balls[0]),
      );
      final angle = atan2(targetBall.y - cue.y, targetBall.x - cue.x) + pi;
      final power = 3 + Random().nextDouble() * 2;
      cue.vx = cos(angle) * power;
      cue.vy = sin(angle) * power;
      _aiThinking = false;
      _turn = 1;
      setState(() => _status = 'AI thinking...');
      Future.delayed(const Duration(seconds: 2), () {
        if (!mounted) return;
        for (final ball in _balls.where((b) => b.potted && b.id != 0)) {
          if (_playerBalls == 0 && BALL_STRIPES.contains(ball.id)) _aiScore++;
          else if (_playerBalls == 1 && BALL_SOLIDS.contains(ball.id)) _aiScore++;
          else if (ball.id == 8) {
            _gameOver = true;
            _status = '💀 AI potted the 8-ball and wins!';
            _endGame('loss');
            return;
          }
        }
        _turn = 0;
        _status = 'Your turn';
        setState(() {});
      });
    });
  }

  void _endGame(String result) {
    _gameOver = true;
    _service.addMatch(MatchModel(
      id: 'pl_${DateTime.now().millisecondsSinceEpoch}',
      gameType: 'Pool',
      opponentName: 'AI',
      level: widget.level.name,
      entryFee: widget.level.entryFee,
      prize: result == 'win' ? widget.level.winnerGets : 0,
      result: result,
    ));
    if (result == 'win') _service.creditWin(widget.level.winnerGets);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF00695C), AppTheme.darkSurface],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Score Header
              Padding(
                padding: const EdgeInsets.all(12),
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white), onPressed: () => Navigator.pop(context)),
                    Expanded(child: Column(children: [
                      Text(_status, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14), textAlign: TextAlign.center),
                      Text('Level: ${widget.level.name}', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                      child: Text('$_playerScore - $_aiScore', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),

              // Pool Table
              Expanded(
                child: GestureDetector(
                  onPanStart: (d) => _shooting = true,
                  onPanUpdate: (d) {
                    if (_shooting && _turn == 0 && !_gameOver) {
                      final dx = d.localPosition.dx - MediaQuery.of(context).size.width / 2;
                      final dy = d.localPosition.dy - 200;
                      setState(() {
                        _angle = atan2(dy, dx) + pi;
                        _power = min(sqrt(dx * dx + dy * dy) / 100, 10);
                      });
                    }
                  },
                  onPanEnd: (_) {
                    if (_shooting && _turn == 0 && _power > 0.5) _shoot(_power, _angle);
                    setState(() => _shooting = false);
                  },
                  child: CustomPaint(
                    size: Size.infinite,
                    painter: _PoolTablePainter(_balls, _shooting, _power, _angle, _turn, _gameOver),
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
                        value: _power / 10,
                        backgroundColor: Colors.white24,
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

class _Ball {
  final int id;
  double x, y, vx, vy;
  bool potted;
  _Ball(this.id, this.x, this.y, {this.vx = 0, this.vy = 0, this.potted = false});
}

class _PoolTablePainter extends CustomPainter {
  final List<_Ball> balls;
  final bool shooting;
  final double power, angle;
  final int turn;
  final bool gameOver;

  _PoolTablePainter(this.balls, this.shooting, this.power, this.angle, this.turn, this.gameOver);

  static final Map<int, Color> _ballColors = {
    0: Colors.white, 1: Color(0xFFFFD700), 2: Color(0xFF0000FF), 3: Color(0xFFFF0000),
    4: Color(0xFF800080), 5: Color(0xFFFF8C00), 6: Color(0xFF006400), 7: Color(0xFF8B0000),
    8: Color(0xFF000000), 9: Color(0xFFFFD700), 10: Color(0xFF0000FF), 11: Color(0xFFFF0000),
    12: Color(0xFF800080), 13: Color(0xFFFF8C00), 14: Color(0xFF006400), 15: Color(0xFF8B0000),
  };

  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 710;
    final tableRect = Rect.fromLTWH(20 * scale, 20 * scale, 670 * scale, 310 * scale);
    
    // Table green
    canvas.drawRRect(RRect.fromRectAndRadius(tableRect, const Radius.circular(8)), Paint()..color = const Color(0xFF0D7A3E));
    
    // Table border
    canvas.drawRRect(RRect.fromRectAndRadius(tableRect, const Radius.circular(8)), Paint()
      ..style = PaintingStyle.stroke..strokeWidth = 8..color = const Color(0xFF5D3A1A));

    // Pockets
    for (int i = 0; i < 6; i++) {
      canvas.drawCircle(
        Offset(_PoolTablePainter._px(i) * scale, _PoolTablePainter._py(i) * scale),
        16 * scale,
        Paint()..color = const Color(0xFF1A1A1A),
      );
    }

    // Balls
    for (final ball in balls) {
      if (ball.potted) continue;
      final color = _ballColors[ball.id] ?? Colors.grey;
      canvas.drawCircle(
        Offset(ball.x * scale, ball.y * scale),
        7 * scale,
        Paint()..color = color..shader = null,
      );
      // Highlight
      canvas.drawCircle(
        Offset(ball.x * scale - 2, ball.y * scale - 2),
        2 * scale,
        Paint()..color = Colors.white.withOpacity(0.5),
      );
    }

    // Cue line
    if (shooting && turn == 0 && !gameOver) {
      final cue = balls[0];
      final endX = cue.x + cos(angle) * 80;
      final endY = cue.y + sin(angle) * 80;
      canvas.drawLine(
        Offset(cue.x * scale, cue.y * scale),
        Offset(endX * scale, endY * scale),
        Paint()..color = Colors.white.withOpacity(0.6)..strokeWidth = 2,
      );
    }
  }

  static double _px(int i) => [25, 350, 675, 25, 350, 675][i];
  static double _py(int i) => [25, 10, 25, 325, 340, 325][i];

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
