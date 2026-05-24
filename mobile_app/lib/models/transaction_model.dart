class TransactionModel {
  final String id;
  final String type; // 'deposit', 'withdrawal', 'match_fee', 'match_win', 'bonus', 'refund'
  final double amount;
  final String status; // 'completed', 'pending', 'failed'
  final DateTime timestamp;
  final String? description;
  final String? upiRef;

  TransactionModel({
    required this.id,
    required this.type,
    required this.amount,
    this.status = 'completed',
    DateTime? timestamp,
    this.description,
    this.upiRef,
  }) : timestamp = timestamp ?? DateTime.now();

  String get typeIcon {
    switch (type) {
      case 'deposit':
        return '📥';
      case 'withdrawal':
        return '📤';
      case 'match_fee':
        return '🎮';
      case 'match_win':
        return '🏆';
      case 'bonus':
        return '🎁';
      case 'refund':
        return '↩️';
      default:
        return '💳';
    }
  }

  String get formattedAmount {
    final prefix = type == 'deposit' || type == 'match_win' || type == 'bonus' || type == 'refund'
        ? '+'
        : '-';
    return '$prefix₹${amount.toStringAsFixed(0)}';
  }

  bool get isCredit =>
      type == 'deposit' || type == 'match_win' || type == 'bonus' || type == 'refund';

  Map<String, dynamic> toJson() => {
        'id': id,
        'type': type,
        'amount': amount,
        'status': status,
        'timestamp': timestamp.toIso8601String(),
        'description': description,
        'upiRef': upiRef,
      };

  factory TransactionModel.fromJson(Map<String, dynamic> json) => TransactionModel(
        id: json['id'] ?? '',
        type: json['type'] ?? '',
        amount: (json['amount'] ?? 0).toDouble(),
        status: json['status'] ?? 'completed',
        timestamp: json['timestamp'] != null
            ? DateTime.parse(json['timestamp'])
            : DateTime.now(),
        description: json['description'],
        upiRef: json['upiRef'],
      );
}
