import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Quantia typography — three families, three roles.
///
/// - **Display** Bricolage Grotesque → page/card titles, big labels.
/// - **Text/UI** Hanken Grotesk → body, navigation, buttons, descriptions.
/// - **Data** IBM Plex Mono → all money, numbers, eyebrows, badges, axis labels.
///
/// The contrast between the display grotesque and the mono data face is part of
/// the personality — never render money in the sans face.
class AppTextStyles {
  AppTextStyles._();

  static const List<FontFeature> _tabular = [FontFeature.tabularFigures()];

  // ── Display (Bricolage Grotesque) ──────────────────────────────────────────
  static TextStyle display(Color color) => GoogleFonts.bricolageGrotesque(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.05,
        letterSpacing: -0.7,
      );

  static TextStyle h1(Color color) => GoogleFonts.bricolageGrotesque(
        fontSize: 27,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.05,
        letterSpacing: -0.6,
      );

  static TextStyle h2(Color color) => GoogleFonts.bricolageGrotesque(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.15,
        letterSpacing: -0.3,
      );

  static TextStyle h3(Color color) => GoogleFonts.bricolageGrotesque(
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.2,
        letterSpacing: -0.17,
      );

  // ── Body / UI (Hanken Grotesk) ──────────────────────────────────────────────
  static TextStyle body(Color color) => GoogleFonts.hankenGrotesk(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.5,
        letterSpacing: 0.08,
      );

  static TextStyle bodySm(Color color) => GoogleFonts.hankenGrotesk(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.45,
      );

  static TextStyle caption(Color color) => GoogleFonts.hankenGrotesk(
        fontSize: 11.5,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.4,
      );

  /// Mono uppercase section label — the "eyebrow" that sits above headings and
  /// card sections. `.18em` tracking at 11px ≈ 2px.
  static TextStyle eyebrow(Color color, {double fontSize = 11}) =>
      GoogleFonts.ibmPlexMono(
        fontSize: fontSize,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.4,
        letterSpacing: fontSize * 0.16,
      );

  // ── Data / Money (IBM Plex Mono) ────────────────────────────────────────────
  static TextStyle moneyLg(Color color) => GoogleFonts.ibmPlexMono(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.0,
        letterSpacing: -0.6,
        fontFeatures: _tabular,
      );

  static TextStyle moneyMd(Color color) => GoogleFonts.ibmPlexMono(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.2,
        letterSpacing: -0.2,
        fontFeatures: _tabular,
      );

  static TextStyle mono(Color color, {double fontSize = 14}) =>
      GoogleFonts.ibmPlexMono(
        fontSize: fontSize,
        color: color,
        fontFeatures: _tabular,
      );

  // Use for any Text widget that renders only emoji characters.
  // Setting fontFamily to empty string bypasses Flutter's font loader on iOS,
  // letting CoreText fall back to Apple Color Emoji automatically.
  static TextStyle emoji({double fontSize = 20, Color? color}) => TextStyle(
        fontFamily: '',
        fontSize: fontSize,
        color: color,
      );
}
