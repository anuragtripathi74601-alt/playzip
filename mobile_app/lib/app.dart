import 'package:flutter/material.dart';
import 'theme/app_theme.dart';
import 'services/game_service.dart';
import 'models/game_model.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/games/game_lobby_screen.dart';
import 'screens/games/chess_screen.dart';
import 'screens/games/pool_screen.dart';
import 'screens/games/snooker_screen.dart';
import 'screens/wallet/wallet_screen.dart';
import 'screens/friends/friends_screen.dart';
import 'screens/profile/profile_screen.dart';

class PlayZipApp {
  static final GameService gameService = GameService();
}

class PlayZipAppWidget extends StatelessWidget {
  const PlayZipAppWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PlayZip',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      initialRoute: '/splash',
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/splash':
            return MaterialPageRoute(builder: (_) => const SplashScreen());
          case '/auth':
            return MaterialPageRoute(builder: (_) => const AuthScreen());
          case '/home':
            return MaterialPageRoute(builder: (_) => const HomeScreen());
          case '/wallet':
            return MaterialPageRoute(builder: (_) => const WalletScreen());
          case '/friends':
            return MaterialPageRoute(builder: (_) => const FriendsScreen());
          case '/profile':
            return MaterialPageRoute(builder: (_) => const ProfileScreen());
          case '/game_lobby':
            final gameKey = settings.arguments as String? ?? 'chess';
            return MaterialPageRoute(
              builder: (_) => GameLobbyScreen(gameKey: gameKey),
            );
          default:
            if (settings.name?.startsWith('/game/') ?? false) {
              final gameKey = settings.name!.split('/').last;
              final level = settings.arguments as LevelConfig? ?? LevelConfig.defaultLevels[0];
              switch (gameKey) {
                case 'chess':
                  return MaterialPageRoute(builder: (_) => ChessScreen(level: level));
                case 'pool':
                  return MaterialPageRoute(builder: (_) => PoolScreen(level: level));
                case 'snooker':
                  return MaterialPageRoute(builder: (_) => SnookerScreen(level: level));
              }
            }
            return MaterialPageRoute(builder: (_) => const SplashScreen());
        }
      },
    );
  }
}
