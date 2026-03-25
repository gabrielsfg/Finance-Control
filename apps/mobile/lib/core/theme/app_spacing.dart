import 'package:flutter/material.dart';

class AppSpacing {
  AppSpacing._();

  static const double xs   = 4;  // min gap between icons
  static const double sm   = 8;  // gap between chips, inline items
  static const double md   = 12; // compact card padding, list item gap
  static const double base = 16; // default card padding, inner margins
  static const double lg   = 20; // screen horizontal padding (TopBar)
  static const double xl   = 24; // main content horizontal padding
  static const double xl2  = 32; // spacing between sections
  static const double xl3  = 40; // outer page padding
  static const double xl4  = 48; // spacing between screen groups

  static const EdgeInsets screenPadding   = EdgeInsets.symmetric(horizontal: 24);
  static const EdgeInsets topBarPadding   = EdgeInsets.symmetric(horizontal: 20);
  static const EdgeInsets cardPadding     = EdgeInsets.all(16);
  static const EdgeInsets cardPaddingSm   = EdgeInsets.all(12);
}

class AppRadius {
  AppRadius._();

  static const double sm   = 6;   // small badges, compact buttons
  static const double md   = 8;   // chips, segment toggles
  static const double base = 10;  // inputs, primary buttons, inner cards
  static const double lg   = 12;  // mini income/expense cards
  static const double xl   = 16;  // glass cards, main cards
  static const double xl2  = 20;  // content sections
  static const double xl3  = 24;  // bottom sheets (top corners)
  static const double full = 44;  // phone frame, avatars, FAB
  static const double pill = 999; // chips, badges, progress bars

  static BorderRadius get smAll   => BorderRadius.circular(sm);
  static BorderRadius get mdAll   => BorderRadius.circular(md);
  static BorderRadius get baseAll => BorderRadius.circular(base);
  static BorderRadius get lgAll   => BorderRadius.circular(lg);
  static BorderRadius get xlAll   => BorderRadius.circular(xl);
  static BorderRadius get xl2All  => BorderRadius.circular(xl2);
  static BorderRadius get xl3All  => BorderRadius.circular(xl3);
  static BorderRadius get fullAll => BorderRadius.circular(full);
  static BorderRadius get pillAll => BorderRadius.circular(pill);
}

class AppShadows {
  AppShadows._();

  static List<BoxShadow> cardLight = [
    BoxShadow(
      color: const Color(0xFF6D28D9).withValues(alpha: 0.07),
      blurRadius: 12,
      offset: const Offset(0, 2),
    ),
  ];

  static const List<BoxShadow> cardDark = [];

  static List<BoxShadow> fabShadow = [
    BoxShadow(
      color: const Color(0xFF7C3AED).withValues(alpha: 0.4),
      blurRadius: 20,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> primaryBtnShadow = [
    BoxShadow(
      color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
      blurRadius: 16,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> logoShadow = [
    BoxShadow(
      color: const Color(0xFF7C3AED).withValues(alpha: 0.3),
      blurRadius: 28,
      offset: const Offset(0, 8),
    ),
  ];

  static List<BoxShadow> bottomSheet = [
    BoxShadow(
      color: const Color(0xFF6D28D9).withValues(alpha: 0.12),
      blurRadius: 40,
      offset: const Offset(0, -8),
    ),
  ];
}
