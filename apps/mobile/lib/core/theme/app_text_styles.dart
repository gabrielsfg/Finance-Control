import 'package:flutter/material.dart';

// Fontes usadas no design:
//   Primária : Inter
//   Monetária: JetBrains Mono
//
// Adicione no pubspec.yaml:
//   dependencies:
//     google_fonts: ^6.x
//
// Depois substitua TextStyle por GoogleFonts.inter() / GoogleFonts.jetBrainsMono()

class AppTextStyles {
  AppTextStyles._();

  static TextStyle display(Color color) => TextStyle(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.25,
      );

  static TextStyle h1(Color color) => TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.w700,
        color: color,
        height: 1.33,
      );

  static TextStyle h2(Color color) => TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.4,
      );

  static TextStyle h3(Color color) => TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: color,
        height: 1.33,
      );

  static TextStyle body(Color color) => TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.47,
      );

  static TextStyle bodySm(Color color) => TextStyle(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: color,
        height: 1.54,
      );

  static TextStyle caption(Color color) => TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w500,
        color: color,
        height: 1.45,
      );

  static TextStyle moneyLg(Color color) => TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: color,
        fontFamily: 'JetBrainsMono',
      );

  static TextStyle moneyMd(Color color) => TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: color,
        fontFamily: 'JetBrainsMono',
      );

  static TextStyle mono(Color color, {double fontSize = 14}) => TextStyle(
        fontSize: fontSize,
        fontFamily: 'JetBrainsMono',
        color: color,
      );
}