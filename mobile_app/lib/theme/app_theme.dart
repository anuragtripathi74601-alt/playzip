import 'package:flutter/material.dart';

class AppTheme {
  // Brand Colors
  static const Color primaryColor = Color(0xFF1A1A2E);
  static const Color secondaryColor = Color(0xFF16213E);
  static const Color accentColor = Color(0xFFC9A84C);    // Gold accent
  static const Color darkSurface = Color(0xFF0A0A0F);
  static const Color successColor = Color(0xFF3ABE7A);
  static const Color errorColor = Color(0xFFE25C3A);
  static const Color warningColor = Color(0xFFF0C96A);

  // Legacy / Additional
  static const Color gold = accentColor;
  static const Color goldLight = Color(0xFFF0C96A);
  static const Color goldDark = Color(0xFF8B6914);
  static const Color bg = darkSurface;
  static const Color bg2 = Color(0xFF12121A);
  static const Color bg3 = Color(0xFF1A1A26);
  static const Color bg4 = Color(0xFF222233);
  static const Color text = Color(0xFFF0EBD8);
  static const Color text2 = Color(0xFF8A8578);
  static const Color text3 = Color(0xFF5A5650);
  static const Color border = Color(0x1EC9A84C);
  static const Color red = errorColor;
  static const Color green = successColor;
  static const Color blue = Color(0xFF5B99F0);
  static const Color purple = Color(0xFFA78BFA);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: gold,
      scaffoldBackgroundColor: darkSurface,
      colorScheme: const ColorScheme.dark(
        primary: gold,
        secondary: goldLight,
        surface: bg2,
        error: errorColor,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: bg2,
        foregroundColor: text,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: bg2,
        selectedItemColor: gold,
        unselectedItemColor: text3,
        type: BottomNavigationBarType.fixed,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: gold,
          foregroundColor: Colors.black,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: bg3,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: gold),
        ),
        labelStyle: const TextStyle(color: text2),
        hintStyle: const TextStyle(color: text3),
      ),
      cardTheme: CardTheme(
        color: bg2,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border),
        ),
      ),
      dividerTheme: const DividerThemeData(color: border, thickness: 1),
    );
  }

  // Common gradients
  static const LinearGradient goldGradient = LinearGradient(
    colors: [goldLight, gold],
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
  );

  // Styles
  static const TextStyle heading1 = TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: text, letterSpacing: -0.5);
  static const TextStyle heading2 = TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: text);
  static const TextStyle heading3 = TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: text);
  static const TextStyle body = TextStyle(fontSize: 14, color: text);
  static const TextStyle body2 = TextStyle(fontSize: 12, color: text2);
  static const TextStyle caption = TextStyle(fontSize: 10, color: text3);
  static const TextStyle goldText = TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: gold);
  static const TextStyle mono = TextStyle(fontFamily: 'monospace', fontSize: 12, color: text2);
}
