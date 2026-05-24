import 'dart:math';
import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';
import '../../models/game_model.dart';
import '../../services/game_service.dart';
import '../../models/match_model.dart';
import '../../app.dart';

class ChessScreen extends StatefulWidget {
  final LevelConfig level;
  const ChessScreen({super.key, required this.level});

  @override
  State<ChessScreen> createState() => _ChessScreenState();
}

class _ChessScreenState extends State<ChessScreen> {
  static const List<String> _pieces = [
    '♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜',
    '♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '',
    '♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙',
    '♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖',
  ];

  static List<String> get _emptyBoard => List.filled(64, '');

  List<String> _board = List.from(_pieces);
  bool _isWhiteTurn = true;
  int? _selectedIndex;
  Set<int> _validMoves = {};
  String _status = "White's turn";
  bool _gameOver = false;
  int _whiteTime = 300;
  int _blackTime = 300;
  final List<String> _moveLog = [];

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted || _gameOver) return;
      setState(() {
        if (_isWhiteTurn) {
          _whiteTime--;
          if (_whiteTime <= 0) { _endGame('Black'); return; }
        } else {
          _blackTime--;
          if (_blackTime <= 0) { _endGame('White'); return; }
        }
      });
      _startTimer();
    });
  }

  void _onSquareTap(int index) {
    if (_gameOver) return;
    final piece = _board[index];

    if (_selectedIndex == null) {
      if (piece.isEmpty) return;
      final isWhite = piece.codeUnitAt(0) > 9812;
      if ((_isWhiteTurn && !isWhite) || (!_isWhiteTurn && isWhite)) return;
      _selectedIndex = index;
      _validMoves = _getValidMoves(index);
      setState(() {});
    } else {
      if (_validMoves.contains(index)) {
        _makeMove(_selectedIndex!, index);
      } else if (piece.isNotEmpty && ((_isWhiteTurn && piece.codeUnitAt(0) > 9812) || (!_isWhiteTurn && piece.codeUnitAt(0) < 9812))) {
        _selectedIndex = index;
        _validMoves = _getValidMoves(index);
        setState(() {});
      } else {
        _selectedIndex = null;
        _validMoves = {};
        setState(() {});
      }
    }
  }

  Set<int> _getValidMoves(int index) {
    final piece = _board[index];
    if (piece.isEmpty) return {};
    final isWhite = piece.codeUnitAt(0) > 9812;
    final row = index ~/ 8;
    final col = index % 8;
    final type = piece.toLowerCase();
    final Set<int> moves = {};

    bool isEnemy(int i) => _board[i].isNotEmpty && ((isWhite && _board[i].codeUnitAt(0) < 9812) || (!isWhite && _board[i].codeUnitAt(0) > 9812));
    bool isEmpty(int i) => _board[i].isEmpty;
    bool inBounds(int r, int c) => r >= 0 && r < 8 && c >= 0 && c < 8;

    if (type == '♟') {
      final dir = isWhite ? -1 : 1;
      final startRow = isWhite ? 6 : 1;
      if (inBounds(row + dir, col) && isEmpty((row + dir) * 8 + col)) {
        moves.add((row + dir) * 8 + col);
        if (row == startRow && isEmpty((row + 2 * dir) * 8 + col)) {
          moves.add((row + 2 * dir) * 8 + col);
        }
      }
      for (final dc in [-1, 1]) {
        if (inBounds(row + dir, col + dc) && isEnemy((row + dir) * 8 + col + dc)) {
          moves.add((row + dir) * 8 + col + dc);
        }
      }
    } else if (type == '♝' || type == '♛') {
      for (final d in [(-1, -1), (-1, 1), (1, -1), (1, 1)]) {
        for (int i = 1; i < 8; i++) {
          final nr = row + d.$1 * i, nc = col + d.$2 * i;
          if (!inBounds(nr, nc)) break;
          final idx = nr * 8 + nc;
          if (isEmpty(idx)) moves.add(idx);
          else { if (isEnemy(idx)) moves.add(idx); break; }
        }
      }
    }
    if (type == '♜' || type == '♛') {
      for (final d in [(-1, 0), (1, 0), (0, -1), (0, 1)]) {
        for (int i = 1; i < 8; i++) {
          final nr = row + d.$1 * i, nc = col + d.$2 * i;
          if (!inBounds(nr, nc)) break;
          final idx = nr * 8 + nc;
          if (isEmpty(idx)) moves.add(idx);
          else { if (isEnemy(idx)) moves.add(idx); break; }
        }
      }
    }
    if (type == '♞') {
      for (final d in [(-2, -1), (-2, 1), (-1, -2), (-1, 2), (1, -2), (1, 2), (2, -1), (2, 1)]) {
        final nr = row + d.$1, nc = col + d.$2;
        if (inBounds(nr, nc)) {
          final idx = nr * 8 + nc;
          if (isEmpty(idx) || isEnemy(idx)) moves.add(idx);
        }
      }
    }
    if (type == '♚') {
      for (final d in [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]) {
        final nr = row + d.$1, nc = col + d.$2;
        if (inBounds(nr, nc)) {
          final idx = nr * 8 + nc;
          if (isEmpty(idx) || isEnemy(idx)) moves.add(idx);
        }
      }
      // Castling
      if (piece == '♔' && row == 7 && col == 4) {
        if (_board[7] == '♖' && _board[5].isEmpty && _board[6].isEmpty) moves.add(6);
        if (_board[0] == '♖' && _board[1].isEmpty && _board[2].isEmpty && _board[3].isEmpty) moves.add(2);
      }
      if (piece == '♚' && row == 0 && col == 4) {
        if (_board[0] == '♜' && _board[1].isEmpty && _board[2].isEmpty && _board[3].isEmpty) moves.add(2);
        if (_board[7] == '♜' && _board[5].isEmpty && _board[6].isEmpty) moves.add(6);
      }
    }

    return moves;
  }

  void _makeMove(int from, int to) {
    final captured = _board[to];
    _board[to] = _board[from];
    _board[from] = '';
    
    // Pawn promotion
    final piece = _board[to];
    if (piece == '♟' && to ~/ 8 == 0) _board[to] = '♛';
    if (piece == '♙' && to ~/ 8 == 7) _board[to] = '♕';

    // Castling - move rook
    if (piece == '♔' && from == 60) {
      if (to == 62) { _board[61] = '♖'; _board[63] = ''; }
      if (to == 58) { _board[59] = '♖'; _board[56] = ''; }
    }
    if (piece == '♚' && from == 4) {
      if (to == 6) { _board[5] = '♜'; _board[7] = ''; }
      if (to == 2) { _board[3] = '♜'; _board[0] = ''; }
    }

    final pieceName = piece == '♟' || piece == '♙' ? '' : piece;
    final capStr = captured.isNotEmpty ? 'x' : '';
    _moveLog.add('$pieceName${String.fromCharCode(97 + to % 8)}${to ~/ 8 + 1}$capStr');

    _isWhiteTurn = !_isWhiteTurn;
    _selectedIndex = null;
    _validMoves = {};
    
    if (_isInCheckmate(!_isWhiteTurn ? _board : _board.map((p) => p.isEmpty ? '' : (p.codeUnitAt(0) > 9812 ? String.fromCharCode(p.codeUnitAt(0) - 6) : String.fromCharCode(p.codeUnitAt(0) + 6))).toList())) {
      _endGame(_isWhiteTurn ? 'White' : 'Black');
    } else if (_isStalemate()) {
      _endGame('Draw');
    } else {
      _status = _isWhiteTurn ? "White's turn" : "Black's turn";
      setState(() {});
    }
  }

  bool _isInCheckmate(List<String> board) {
    for (int i = 0; i < 64; i++) {
      if (board[i].isNotEmpty && ((_isWhiteTurn && board[i].codeUnitAt(0) > 9812) || (!_isWhiteTurn && board[i].codeUnitAt(0) < 9812))) {
        if (_getValidMoves(i).isNotEmpty) return false;
      }
    }
    return true;
  }

  bool _isStalemate() {
    for (int i = 0; i < 64; i++) {
      if (_board[i].isNotEmpty && ((_isWhiteTurn && _board[i].codeUnitAt(0) > 9812) || (!_isWhiteTurn && _board[i].codeUnitAt(0) < 9812))) {
        if (_getValidMoves(i).isNotEmpty) return false;
      }
    }
    return true;
  }

  void _endGame(String winner) {
    _gameOver = true;
    _status = winner == 'Draw' ? "🤝 Draw - Stalemate!" : "🏆 $winner wins!";
    _service.addMatch(MatchModel(
      id: 'ch_${DateTime.now().millisecondsSinceEpoch}',
      gameType: 'Chess',
      opponentName: 'AI',
      level: widget.level.name,
      entryFee: widget.level.entryFee,
      prize: widget.level.winnerGets,
      result: winner == 'Draw' ? 'draw' : (winner == 'White' ? 'win' : 'loss'),
    ));
    if (winner == 'White') _service.creditWin(widget.level.winnerGets);
  }

  final _service = PlayZipApp.gameService;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF1A237E), AppTheme.darkSurface],
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
                    const Spacer(),
                    Text(_status, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    Text('${(_isWhiteTurn ? _whiteTime : _blackTime) ~/ 60}:${((_isWhiteTurn ? _whiteTime : _blackTime) % 60).toString().padLeft(2, '0')}',
                        style: const TextStyle(color: Colors.white, fontSize: 16)),
                  ],
                ),
              ),

              // Black timer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                margin: const EdgeInsets.symmetric(horizontal: 32),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(children: [Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.black87, shape: BoxShape.circle)), const SizedBox(width: 8), const Text('Black', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500))]),
                    Text('${_blackTime ~/ 60}:${(_blackTime % 60).toString().padLeft(2, '0')}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFeatures: [FontFeature.tabularFigures()])),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Chess Board
              AspectRatio(
                aspectRatio: 1,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.brown.shade800, width: 3),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: GridView.builder(
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 8),
                      itemCount: 64,
                      itemBuilder: (context, index) {
                        final row = index ~/ 8;
                        final col = index % 8;
                        final isLight = (row + col) % 2 == 0;
                        final isSelected = _selectedIndex == index;
                        final isValid = _validMoves.contains(index);
                        final piece = _board[index];

                        return GestureDetector(
                          onTap: () => _onSquareTap(index),
                          child: Container(
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.yellow.shade600
                                  : isValid
                                      ? Colors.green.withOpacity(0.5)
                                      : isLight
                                          ? Colors.brown.shade100
                                          : Colors.brown.shade700,
                            ),
                            child: piece.isNotEmpty
                                ? Center(
                                    child: Text(piece, style: TextStyle(
                                      fontSize: 28,
                                      color: piece.codeUnitAt(0) > 9812 ? Colors.white : Colors.black87,
                                      shadows: [Shadow(color: Colors.black26, blurRadius: 2)],
                                    )),
                                  )
                                : isValid
                                    ? Center(
                                        child: Container(
                                          width: 10, height: 10,
                                          decoration: BoxDecoration(
                                            color: Colors.white.withOpacity(0.6),
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      )
                                    : null,
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),

              // White timer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                margin: const EdgeInsets.symmetric(horizontal: 32),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(children: [Container(width: 12, height: 12, decoration: const BoxDecoration(Colors.white87, shape: BoxShape.circle)), const SizedBox(width: 8), const Text('White', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w500))]),
                    Text('${_whiteTime ~/ 60}:${(_whiteTime % 60).toString().padLeft(2, '0')}', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFeatures: [FontFeature.tabularFigures()])),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // Move Log
              if (_moveLog.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(_moveLog.join(' '), style: const TextStyle(color: Colors.white54, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                ),

              if (_gameOver)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(backgroundColor: AppTheme.accentColor, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: const Text('Back to Lobby'),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
