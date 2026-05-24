class UserModel {
  final String id;
  final String name;
  final String phone;
  final String? email;
  final String? upiId;
  double balance;
  int gamesPlayed;
  int wins;
  int losses;
  bool isKycVerified;
  bool isBlocked;
  final DateTime joinDate;
  List<String> friendIds;
  List<String> gameHistory;

  UserModel({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    this.upiId,
    this.balance = 0,
    this.gamesPlayed = 0,
    this.wins = 0,
    this.losses = 0,
    this.isKycVerified = false,
    this.isBlocked = false,
    DateTime? joinDate,
    List<String>? friendIds,
    List<String>? gameHistory,
  })  : joinDate = joinDate ?? DateTime.now(),
        friendIds = friendIds ?? [],
        gameHistory = gameHistory ?? [];

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'phone': phone,
        'email': email,
        'upiId': upiId,
        'balance': balance,
        'gamesPlayed': gamesPlayed,
        'wins': wins,
        'losses': losses,
        'isKycVerified': isKycVerified,
        'isBlocked': isBlocked,
        'joinDate': joinDate.toIso8601String(),
        'friendIds': friendIds,
        'gameHistory': gameHistory,
      };

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        phone: json['phone'] ?? '',
        email: json['email'],
        upiId: json['upiId'],
        balance: (json['balance'] ?? 0).toDouble(),
        gamesPlayed: json['gamesPlayed'] ?? 0,
        wins: json['wins'] ?? 0,
        losses: json['losses'] ?? 0,
        isKycVerified: json['isKycVerified'] ?? false,
        isBlocked: json['isBlocked'] ?? false,
        joinDate: json['joinDate'] != null
            ? DateTime.parse(json['joinDate'])
            : DateTime.now(),
        friendIds: List<String>.from(json['friendIds'] ?? []),
        gameHistory: List<String>.from(json['gameHistory'] ?? []),
      );

  double get winRate =>
      gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
}
