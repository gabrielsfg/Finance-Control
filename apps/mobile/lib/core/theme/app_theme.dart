import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Material theme wired to the Quantia tokens. Screens mostly read
/// `AppThemeTokens.of(context)` directly; this theme covers the Material
/// primitives (dialogs, inputs, buttons, text defaults, selection).
abstract class AppTheme {
  static InputDecorationTheme _input({
    required Color fill,
    required Color border,
    required Color focus,
  }) =>
      InputDecorationTheme(
        filled: true,
        fillColor: fill,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadiusValue.input),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadiusValue.input),
          borderSide: BorderSide(color: border, width: 1.2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadiusValue.input),
          borderSide: BorderSide(color: focus, width: 1.6),
        ),
      );

  static ThemeData get light {
    final scheme = const ColorScheme.light(
      primary: AppColors.lightPrimary,
      secondary: AppColors.lightAccent,
      surface: AppColors.lightSurface,
      error: AppColors.lightError,
      onPrimary: Colors.white,
      onSurface: AppColors.lightTxtPrimary,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.lightBg,
      dividerColor: AppColors.lightDivider,
      textTheme: GoogleFonts.hankenGroteskTextTheme(
        ThemeData.light().textTheme,
      ).apply(
        bodyColor: AppColors.lightTxtPrimary,
        displayColor: AppColors.lightTxtPrimary,
      ),
      cardTheme: const CardThemeData(
        elevation: 0,
        color: AppColors.lightSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
        ),
      ),
      inputDecorationTheme: _input(
        fill: AppColors.lightSurface,
        border: AppColors.lightDivider,
        focus: AppColors.lightPrimary,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(50),
          backgroundColor: AppColors.lightPrimary,
          foregroundColor: Colors.white,
          textStyle: GoogleFonts.hankenGrotesk(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadiusValue.input),
          ),
        ),
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: AppColors.lightPrimary,
        selectionColor: Color(0x331F3CE0),
        selectionHandleColor: AppColors.lightPrimary,
      ),
      progressIndicatorTheme:
          const ProgressIndicatorThemeData(color: AppColors.lightPrimary),
    );
  }

  static ThemeData get dark {
    final scheme = const ColorScheme.dark(
      primary: AppColors.darkPrimary,
      secondary: AppColors.darkAccent,
      surface: AppColors.darkSurface,
      error: AppColors.darkError,
      onPrimary: Colors.white,
      onSurface: AppColors.darkTxtPrimary,
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: AppColors.darkBg,
      dividerColor: AppColors.darkDivider,
      textTheme: GoogleFonts.hankenGroteskTextTheme(
        ThemeData.dark().textTheme,
      ).apply(
        bodyColor: AppColors.darkTxtPrimary,
        displayColor: AppColors.darkTxtPrimary,
      ),
      cardTheme: const CardThemeData(
        elevation: 0,
        color: AppColors.darkSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(20)),
        ),
      ),
      inputDecorationTheme: _input(
        fill: AppColors.darkSurface,
        border: AppColors.darkDivider,
        focus: AppColors.darkPrimary,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(50),
          backgroundColor: AppColors.darkPrimary,
          foregroundColor: Colors.white,
          textStyle: GoogleFonts.hankenGrotesk(
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadiusValue.input),
          ),
        ),
      ),
      textSelectionTheme: const TextSelectionThemeData(
        cursorColor: AppColors.darkPrimary,
        selectionColor: Color(0x443D5BFF),
        selectionHandleColor: AppColors.darkPrimary,
      ),
      progressIndicatorTheme:
          const ProgressIndicatorThemeData(color: AppColors.darkPrimary),
    );
  }
}

/// Small holder so the theme file doesn't import app_spacing (avoids a cycle
/// with widgets that import both). Mirrors the Quantia input/button radius.
class AppRadiusValue {
  AppRadiusValue._();
  static const double input = 13;
}
