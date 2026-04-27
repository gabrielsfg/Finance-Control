import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTextStyles {
  AppTextStyles._();

  // Primary font: Inter
  // Monetary font: JetBrains Mono

  static TextStyle display(Color color) => GoogleFonts.inter(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.25,
      );

  static TextStyle h1(Color color) => GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.33,
      );

  static TextStyle h2(Color color) => GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.40,
      );

  static TextStyle h3(Color color) => GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.33,
      );

  static TextStyle body(Color color) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.47,
      );

  static TextStyle bodySm(Color color) => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.54,
      );

  static TextStyle caption(Color color) => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.45,
      );

  static TextStyle moneyLg(Color color) => GoogleFonts.jetBrainsMono(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.29,
      );

  static TextStyle moneyMd(Color color) => GoogleFonts.jetBrainsMono(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.40,
      );

  static TextStyle mono(Color color, {double fontSize = 14}) =>
      GoogleFonts.jetBrainsMono(
        fontSize: fontSize,
        color: color,
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
