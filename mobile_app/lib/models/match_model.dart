class MatchModel {
  final String id;
  final String gameType;
  final String opponentName;
  final String level;
  final double entryFee;
  final double prize;
  final String status; // 'pending', 'in_progress', 'completed', 'voided'
  final String? result; // 'win', 'loss', 'draw', null
  final DateTime timestamp;
  final int? playerScore;
  final int? opponentScore;

  MatchModel({
    required this.id,
    required this.gameType,
    required this.opponentName,
    required this.level,
    required this.entryFee,
    required this.prize,
    this.status = 'pending',
    this.result,
    DateTime? timestamp,
    this.playerScore,
    this.opponentScore,
  }) : timestamp = timestamp ?? DateTime.now();

  String get resultIcon {
    if (result == 'win') return '🏆';
    if (result == 'loss') return '💔';
    if (result == 'draw') return '🤝';
    return '⏳';
  }

  String get scoreDisplay {
    if (playerScore != null && opponentScore != null) {
      return '$playerScore - $opponentScore';
    }
    return '-';
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'gameType': gameType,
        'opponentName': opponentName,
        'level': level,
        'entryFee': entryFee,
        'prize': prize,
        'status': status,
        'result': result,
        'timestamp': timestamp.toIso8601String(),
        'playerScore': playerScore,
        'opponentScore': opponentScore,
      };

  factory MatchModel.fromJson(Map<String, dynamic> json) => MatchModel(
        id: json['id'] ?? '',
        gameType: json['gameType'] ?? '',
        opponentName: json['opponentName'] ?? '',
        level: json['level'] ?? '',
        entryFee: (json['entryFee'] ?? 0).toDouble(),
        prize: (json['prize'] ?? 0).toDouble(),
        status: json['status'] ?? 'pending',
        result: json['result'],
        timestamp: json['timestamp'] != null
            ? DateTime.parse(json['timestamp'])
            : DateTime.now(),
        playerScore: json['playerScore'],
        opponentScore: json['opponentScore'],
      );
}
