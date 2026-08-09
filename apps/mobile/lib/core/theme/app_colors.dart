import 'package:flutter/material.dart';

/// Quantia design-system palette.
///
/// Thesis: money is the material — cobalt-on-osso in light, cobalt-on-graphite
/// in dark. Signals are never crayon: positive = moss (petrol green),
/// negative = clay (burnt orange). The hero panel is dark in BOTH themes and
/// owns its own tokens so it never collides with `--background`/`--foreground`;
/// in dark it is also the only tinted surface, which is what keeps the graphite
/// base calm without losing the petrol identity.
class AppColors {
  AppColors._();

  // ── Brand (shared, role-separated) ─────────────────────────────────────────
  // Cobalt as FILL (button bg, bar fill) vs cobalt as TEXT/mark (links, %).
  static const cobaltLight     = Color(0xFF1F3CE0);
  static const cobaltDark      = Color(0xFF3D5BFF);
  static const cobaltLift      = Color(0xFF8197FF); // cobalt over dark / gradient top
  static const accentLight     = Color(0xFF1F3CE0); // text/mark (light)
  static const accentDark      = Color(0xFF8197FF); // text/mark (dark)

  static const mossLight       = Color(0xFF2C6B57); // positive / income
  static const mossDark        = Color(0xFF5FC6A0);
  static const mossLiftLight   = Color(0xFF5FC6A0);
  static const mossLiftDark    = Color(0xFF7FE0BE);
  static const clayLight       = Color(0xFFB0451F); // negative / expense
  static const clayDark        = Color(0xFFFF8A5B);
  static const clayLiftLight   = Color(0xFFFF8A5B);
  static const clayLiftDark    = Color(0xFFFFB08A);
  static const goldLight       = Color(0xFFC8932B); // warm punctual highlight
  static const goldDark        = Color(0xFFE3B65A);

  // ── Light ("osso" — warm bone) ─────────────────────────────────────────────
  static const lightBg           = Color(0xFFEFEBE1); // paper
  static const lightSurface      = Color(0xFFFAF8F3); // card
  static const lightSurfaceEl    = Color(0xFFF3F0E8); // recessed / hover (surface-2)
  static const lightSurface3     = Color(0xFFE7E3D8);
  static const lightDivider      = Color(0xFFDCD7C9); // mist (hairline)
  static const lightPrimary      = cobaltLight;
  static const lightPrimaryDark  = Color(0xFF1A33C4); // cobalt hover
  static const lightSecondary    = cobaltLight;
  static const lightAccent       = accentLight;
  static const lightTxtPrimary   = Color(0xFF17211D); // petroleum ink
  static const lightTxtSecondary = Color(0xFF6B6657); // muted
  static const lightTxtTertiary  = Color(0xFF8A8578);
  static const lightTxtDisabled  = Color(0xFFA9A497);
  static const lightSuccess      = mossLight;
  static const lightError        = clayLight;
  static const lightWarning      = goldLight;
  static const lightInfo         = accentLight;
  static const lightIncomeBg     = Color(0x242C6B57); // moss @ ~14%
  static const lightExpenseBg    = Color(0x24B0451F); // clay @ ~14%
  static const lightBudgetNeutral = cobaltLight;

  // Hero panel — dark even in light theme.
  static const lightPanel        = Color(0xFF17211D);
  static const lightPanel2       = Color(0xFF1E2B26);
  static const lightPanelText    = Color(0xFFEFEBE1);
  static const lightPanelMuted   = Color(0xFFA7A293);

  // ── Dark ("grafite" — neutral graphite) ─────────────────────────────────────
  // One hue (220°) held at chroma 2-3 across the whole ramp, so the surfaces
  // read as grey and the hero panel is the ONLY tinted surface in the app.
  // That makes the petrol panel a deliberate accent instead of ambient tint,
  // and lets moss/clay/cobalt read as signals rather than blend into the base.
  static const darkBg            = Color(0xFF0E0F10); // paper
  // Cards sit clearly above the paper and the (darker) hero panel so the
  // primary/secondary hierarchy reads in dark mode.
  static const darkSurface       = Color(0xFF232325); // card
  static const darkSurfaceEl     = Color(0xFF2D2E2F); // recessed / hover
  static const darkSurface3      = Color(0xFF393A3C);
  static const darkDivider       = Color(0xFF323335); // mist
  static const darkPrimary       = cobaltDark;
  static const darkPrimaryDark   = Color(0xFF2E49E0);
  static const darkSecondary     = accentDark;
  static const darkAccent        = accentDark;
  static const darkTxtPrimary    = Color(0xFFECE7DA); // osso text
  static const darkTxtSecondary  = Color(0xFFA0A4A9); // muted — 6.3:1 on card
  static const darkTxtTertiary   = Color(0xFF8A8D92); // 4.7:1 on card
  // 4.1:1 on card — below AA, so disabled only (exempt from the requirement).
  static const darkTxtDisabled   = Color(0xFF7E8287);
  static const darkSuccess       = mossDark;
  static const darkError         = clayDark;
  static const darkWarning       = goldDark;
  static const darkInfo          = accentDark;
  static const darkIncomeBg      = Color(0x245FC6A0); // moss @ ~14%
  static const darkExpenseBg     = Color(0x24FF8A5B); // clay @ ~14%
  static const darkBudgetNeutral  = cobaltDark;

  // Hero panel — petrol-cobalt tint.
  static const darkPanel         = Color(0xFF12201E);
  static const darkPanel2        = Color(0xFF1A302C);
  static const darkPanelText     = Color(0xFFECE7DA);
  static const darkPanelMuted    = Color(0xFF8FA39A);

  // ── Gradients ───────────────────────────────────────────────────────────────
  // Cobalt fill — used on FAB, primary buttons, avatar, logo glyph.
  static const primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF3D5BFF), Color(0xFF1F3CE0)],
  );

  static const logoGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF3D5BFF), Color(0xFF152BB0)],
  );

  // Avatar — cobalt to deep cobalt (matches Quantia .avatar).
  static const avatarGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF1F3CE0), Color(0xFF0C1F9C)],
  );
}

/// Theme-aware token bundle. Screens read `AppThemeTokens.of(context)` and use
/// semantic fields so a single palette swap re-skins the whole app.
class AppThemeTokens {
  final Color bg;
  final Color surface;
  final Color surfaceEl;
  final Color surface3;
  final Color divider; // == mist
  final Color primary; // cobalt fill
  final Color primaryDark;
  final Color accent; // cobalt as text/mark
  final Color cobaltLift;
  final Color txtPrimary;
  final Color txtSecondary;
  final Color txtTertiary;
  final Color txtDisabled;
  final Color success; // moss
  final Color error; // clay
  final Color warning; // gold
  final Color info;
  final Color moss;
  final Color mossLift;
  final Color clay;
  final Color clayLift;
  final Color gold;
  final Color incomeBg;
  final Color expenseBg;
  final Color budgetNeutral;
  // Hero panel (dark in both themes).
  final Color panel;
  final Color panel2;
  final Color panelText;
  final Color panelMuted;
  final bool isDark;

  const AppThemeTokens._({
    required this.bg,
    required this.surface,
    required this.surfaceEl,
    required this.surface3,
    required this.divider,
    required this.primary,
    required this.primaryDark,
    required this.accent,
    required this.cobaltLift,
    required this.txtPrimary,
    required this.txtSecondary,
    required this.txtTertiary,
    required this.txtDisabled,
    required this.success,
    required this.error,
    required this.warning,
    required this.info,
    required this.moss,
    required this.mossLift,
    required this.clay,
    required this.clayLift,
    required this.gold,
    required this.incomeBg,
    required this.expenseBg,
    required this.budgetNeutral,
    required this.panel,
    required this.panel2,
    required this.panelText,
    required this.panelMuted,
    required this.isDark,
  });

  /// Alias — Quantia calls the hairline "mist".
  Color get mist => divider;

  /// Alias — Quantia calls the recessed surface "surface-2".
  Color get surface2 => surfaceEl;

  static const light = AppThemeTokens._(
    bg: AppColors.lightBg,
    surface: AppColors.lightSurface,
    surfaceEl: AppColors.lightSurfaceEl,
    surface3: AppColors.lightSurface3,
    divider: AppColors.lightDivider,
    primary: AppColors.lightPrimary,
    primaryDark: AppColors.lightPrimaryDark,
    accent: AppColors.lightAccent,
    cobaltLift: AppColors.cobaltLift,
    txtPrimary: AppColors.lightTxtPrimary,
    txtSecondary: AppColors.lightTxtSecondary,
    txtTertiary: AppColors.lightTxtTertiary,
    txtDisabled: AppColors.lightTxtDisabled,
    success: AppColors.lightSuccess,
    error: AppColors.lightError,
    warning: AppColors.lightWarning,
    info: AppColors.lightInfo,
    moss: AppColors.mossLight,
    mossLift: AppColors.mossLiftLight,
    clay: AppColors.clayLight,
    clayLift: AppColors.clayLiftLight,
    gold: AppColors.goldLight,
    incomeBg: AppColors.lightIncomeBg,
    expenseBg: AppColors.lightExpenseBg,
    budgetNeutral: AppColors.lightBudgetNeutral,
    panel: AppColors.lightPanel,
    panel2: AppColors.lightPanel2,
    panelText: AppColors.lightPanelText,
    panelMuted: AppColors.lightPanelMuted,
    isDark: false,
  );

  static const dark = AppThemeTokens._(
    bg: AppColors.darkBg,
    surface: AppColors.darkSurface,
    surfaceEl: AppColors.darkSurfaceEl,
    surface3: AppColors.darkSurface3,
    divider: AppColors.darkDivider,
    primary: AppColors.darkPrimary,
    primaryDark: AppColors.darkPrimaryDark,
    accent: AppColors.darkAccent,
    cobaltLift: AppColors.cobaltLift,
    txtPrimary: AppColors.darkTxtPrimary,
    txtSecondary: AppColors.darkTxtSecondary,
    txtTertiary: AppColors.darkTxtTertiary,
    txtDisabled: AppColors.darkTxtDisabled,
    success: AppColors.darkSuccess,
    error: AppColors.darkError,
    warning: AppColors.darkWarning,
    info: AppColors.darkInfo,
    moss: AppColors.mossDark,
    mossLift: AppColors.mossLiftDark,
    clay: AppColors.clayDark,
    clayLift: AppColors.clayLiftDark,
    gold: AppColors.goldDark,
    incomeBg: AppColors.darkIncomeBg,
    expenseBg: AppColors.darkExpenseBg,
    budgetNeutral: AppColors.darkBudgetNeutral,
    panel: AppColors.darkPanel,
    panel2: AppColors.darkPanel2,
    panelText: AppColors.darkPanelText,
    panelMuted: AppColors.darkPanelMuted,
    isDark: true,
  );

  static AppThemeTokens of(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark ? dark : light;
  }
}
