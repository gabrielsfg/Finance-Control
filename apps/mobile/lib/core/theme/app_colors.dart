import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Light
  static const lightBg           = Color(0xFFF7F4FF);
  static const lightSurface      = Color(0xFFFFFFFF);
  static const lightSurfaceEl    = Color(0xFFEDE9FE);
  static const lightDivider      = Color(0xFFDDD6FE);
  static const lightPrimary      = Color(0xFF7C3AED);
  static const lightPrimaryDark  = Color(0xFF6D28D9);
  static const lightSecondary    = Color(0xFF6D28D9);
  static const lightAccent       = Color(0xFF5B21B6);
  static const lightTxtPrimary   = Color(0xFF1E1B4B);
  static const lightTxtSecondary = Color(0xFF4B5563);
  static const lightTxtTertiary  = Color(0xFF6B7280);
  static const lightTxtDisabled  = Color(0xFF9CA3AF);
  static const lightSuccess      = Color(0xFF15803D);
  static const lightError        = Color(0xFFB91C1C);
  static const lightWarning      = Color(0xFFB45309);
  static const lightInfo         = Color(0xFF1D4ED8);
  static const lightIncomeBg     = Color(0xFFDCFCE7);
  static const lightExpenseBg    = Color(0xFFFEE2E2);

  // Dark
  static const darkBg            = Color(0xFF110E1B);
  static const darkSurface       = Color(0xFF1C1830);
  static const darkSurfaceEl     = Color(0xFF2D1B4E);
  static const darkDivider       = Color(0xFF3B2F5C);
  static const darkPrimary       = Color(0xFF8B5CF6);
  static const darkPrimaryDark   = Color(0xFF7C3AED);
  static const darkSecondary     = Color(0xFFA78BFA);
  static const darkAccent        = Color(0xFFC4B5FD);
  static const darkTxtPrimary    = Color(0xFFF8FAFC);
  static const darkTxtSecondary  = Color(0xFFCBD5E1);
  static const darkTxtTertiary   = Color(0xFF94A3B8);
  static const darkTxtDisabled   = Color(0xFF64748B);
  static const darkSuccess       = Color(0xFF22C55E);
  static const darkError         = Color(0xFFEF4444);
  static const darkWarning       = Color(0xFFF59E0B);
  static const darkInfo          = Color(0xFF3B82F6);
  static const darkIncomeBg      = Color(0xFF14532D);
  static const darkExpenseBg     = Color(0xFF7F1D1D);

  // Gradients
  static const primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
  );

  static const logoGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
  );
}

class AppThemeTokens {
  final Color bg;
  final Color surface;
  final Color surfaceEl;
  final Color divider;
  final Color primary;
  final Color primaryDark;
  final Color accent;
  final Color txtPrimary;
  final Color txtSecondary;
  final Color txtTertiary;
  final Color txtDisabled;
  final Color success;
  final Color error;
  final Color warning;
  final Color info;
  final Color incomeBg;
  final Color expenseBg;
  final bool isDark;

  const AppThemeTokens._({
    required this.bg,
    required this.surface,
    required this.surfaceEl,
    required this.divider,
    required this.primary,
    required this.primaryDark,
    required this.accent,
    required this.txtPrimary,
    required this.txtSecondary,
    required this.txtTertiary,
    required this.txtDisabled,
    required this.success,
    required this.error,
    required this.warning,
    required this.info,
    required this.incomeBg,
    required this.expenseBg,
    required this.isDark,
  });

  static const light = AppThemeTokens._(
    bg: AppColors.lightBg,
    surface: AppColors.lightSurface,
    surfaceEl: AppColors.lightSurfaceEl,
    divider: AppColors.lightDivider,
    primary: AppColors.lightPrimary,
    primaryDark: AppColors.lightPrimaryDark,
    accent: AppColors.lightAccent,
    txtPrimary: AppColors.lightTxtPrimary,
    txtSecondary: AppColors.lightTxtSecondary,
    txtTertiary: AppColors.lightTxtTertiary,
    txtDisabled: AppColors.lightTxtDisabled,
    success: AppColors.lightSuccess,
    error: AppColors.lightError,
    warning: AppColors.lightWarning,
    info: AppColors.lightInfo,
    incomeBg: AppColors.lightIncomeBg,
    expenseBg: AppColors.lightExpenseBg,
    isDark: false,
  );

  static const dark = AppThemeTokens._(
    bg: AppColors.darkBg,
    surface: AppColors.darkSurface,
    surfaceEl: AppColors.darkSurfaceEl,
    divider: AppColors.darkDivider,
    primary: AppColors.darkPrimary,
    primaryDark: AppColors.darkPrimaryDark,
    accent: AppColors.darkAccent,
    txtPrimary: AppColors.darkTxtPrimary,
    txtSecondary: AppColors.darkTxtSecondary,
    txtTertiary: AppColors.darkTxtTertiary,
    txtDisabled: AppColors.darkTxtDisabled,
    success: AppColors.darkSuccess,
    error: AppColors.darkError,
    warning: AppColors.darkWarning,
    info: AppColors.darkInfo,
    incomeBg: AppColors.darkIncomeBg,
    expenseBg: AppColors.darkExpenseBg,
    isDark: true,
  );

  static AppThemeTokens of(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark ? dark : light;
  }
}