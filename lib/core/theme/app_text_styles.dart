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
        height: 1.25, // 40px / 32px
      );

  static TextStyle h1(Color color) => GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.33, // 32px / 24px
      );

  static TextStyle h2(Color color) => GoogleFonts.inter(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.40, // 28px / 20px
      );

  static TextStyle h3(Color color) => GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.33, // 24px / 18px
      );

  static TextStyle body(Color color) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.47, // 22px / 15px
      );

  static TextStyle bodySm(Color color) => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.54, // 20px / 13px
      );

  static TextStyle caption(Color color) => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.45, // 16px / 11px
      );

  static TextStyle moneyLg(Color color) => GoogleFonts.jetBrainsMono(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.29, // 36px / 28px
      );

  static TextStyle moneyMd(Color color) => GoogleFonts.jetBrainsMono(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.40, // 28px / 20px
      );

  static TextStyle mono(Color color, {double fontSize = 14}) =>
      GoogleFonts.jetBrainsMono(
        fontSize: fontSize,
        color: color,
      );
}
