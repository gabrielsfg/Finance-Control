import 'package:flutter/material.dart';

class AppSpacing {
  AppSpacing._();

  static const double xs  = 4;
  static const double sm  = 6;
  static const double md  = 8;
  static const double lg  = 12;
  static const double xl  = 16;
  static const double xl2 = 20;
  static const double xl3 = 24;
  static const double xl4 = 28;
  static const double xl5 = 32;

  static const EdgeInsets screenPadding = EdgeInsets.symmetric(horizontal: 24);
  static const EdgeInsets cardPadding   = EdgeInsets.all(16);
  static const EdgeInsets cardPaddingSm = EdgeInsets.all(14);
}

class AppRadius {
  AppRadius._();

  static const double xs   = 6;
  static const double sm   = 8;
  static const double md   = 10;
  static const double lg   = 12;
  static const double xl   = 16;
  static const double xxl  = 44;
  static const double full = 999;

  static BorderRadius get xsAll   => BorderRadius.circular(xs);
  static BorderRadius get smAll   => BorderRadius.circular(sm);
  static BorderRadius get mdAll   => BorderRadius.circular(md);
  static BorderRadius get lgAll   => BorderRadius.circular(lg);
  static BorderRadius get xlAll   => BorderRadius.circular(xl);
  static BorderRadius get fullAll => BorderRadius.circular(full);
}

class AppShadows {
  AppShadows._();

  static List<BoxShadow> cardLight = [
    BoxShadow(
      color: const Color(0xFF6D28D9).withOpacity(0.07),
      blurRadius: 12,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> fabShadow = [
    BoxShadow(
      color: const Color(0xFF7C3AED).withOpacity(0.4),
      blurRadius: 20,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> primaryBtnShadow = [
    BoxShadow(
      color: const Color(0xFF7C3AED).withOpacity(0.3),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> logoShadow = [
    BoxShadow(
      color: const Color(0xFF7C3AED).withOpacity(0.3),
      blurRadius: 28,
      offset: const Offset(0, 8),
    ),
  ];
}