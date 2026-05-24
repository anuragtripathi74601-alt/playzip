class GameConfig {
  final String key;
  final String name;
  final String icon;
  final String color;
  final bool isEnabled;
  final List<LevelConfig> levels;

  GameConfig({
    required this.key,
    required this.name,
    required this.icon,
    required this.color,
    this.isEnabled = true,
    List<LevelConfig>? levels,
  }) : levels = levels ?? LevelConfig.defaultLevels;

  Map<String, dynamic> toJson() => {
        'key': key,
        'name': name,
        'icon': icon,
        'color': color,
        'isEnabled': isEnabled,
        'levels': levels.map((l) => l.toJson()).toList(),
      };

  factory GameConfig.fromJson(Map<String, dynamic> json) => GameConfig(
        key: json['key'] ?? '',
        name: json['name'] ?? '',
        icon: json['icon'] ?? '',
        color: json['color'] ?? '#6C63FF',
        isEnabled: json['isEnabled'] ?? true,
        levels: (json['levels'] as List?)
                ?.map((l) => LevelConfig.fromJson(l))
                .toList() ??
            LevelConfig.defaultLevels,
      );

  static final List<GameConfig> defaultGames = [
    GameConfig(
      key: 'chess',
      name: 'Chess',
      icon: '♟',
      color: '#1A237E',
    ),
    GameConfig(
      key: 'pool',
      name: 'Pool',
      icon: '🎱',
      color: '#00695C',
    ),
    GameConfig(
      key: 'snooker',
      name: 'Snooker',
      icon: '🔴',
      color: '#B71C1C',
    ),
  ];
}

class LevelConfig {
  final String name;
  final double entryFee;
  final double totalPool;
  final double winnerGets;
  final double platformCut;
  final bool isActive;

  LevelConfig({
    required this.name,
    required this.entryFee,
    required this.totalPool,
    required this.winnerGets,
    required this.platformCut,
    this.isActive = true,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'entryFee': entryFee,
        'totalPool': totalPool,
        'winnerGets': winnerGets,
        'platformCut': platformCut,
        'isActive': isActive,
      };

  factory LevelConfig.fromJson(Map<String, dynamic> json) => LevelConfig(
        name: json['name'] ?? '',
        entryFee: (json['entryFee'] ?? 0).toDouble(),
        totalPool: (json['totalPool'] ?? 0).toDouble(),
        winnerGets: (json['winnerGets'] ?? 0).toDouble(),
        platformCut: (json['platformCut'] ?? 0).toDouble(),
        isActive: json['isActive'] ?? true,
      );

  static final List<LevelConfig> defaultLevels = [
    LevelConfig(name: 'FREE', entryFee: 0, totalPool: 0, winnerGets: 0, platformCut: 0),
    LevelConfig(name: 'STARTER', entryFee: 50, totalPool: 100, winnerGets: 80, platformCut: 20),
    LevelConfig(name: 'STANDARD', entryFee: 100, totalPool: 200, winnerGets: 170, platformCut: 30),
    LevelConfig(name: 'PRO', entryFee: 200, totalPool: 400, winnerGets: 350, platformCut: 50),
    LevelConfig(name: 'ADVANCED', entryFee: 500, totalPool: 1000, winnerGets: 750, platformCut: 250),
    LevelConfig(name: 'ELITE', entryFee: 1000, totalPool: 2000, winnerGets: 1600, platformCut: 400),
  ];
}

enum GameMode { liveMatch, practice, free, friendMatch }
