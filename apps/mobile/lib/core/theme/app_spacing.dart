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

  static const EdgeInsets screenPadding   = EdgeInsets.symmetric(horizontal: 20);
  static const EdgeInsets topBarPadding   = EdgeInsets.symmetric(horizontal: 20);
  static const EdgeInsets cardPadding     = EdgeInsets.all(20);
  static const EdgeInsets cardPaddingSm   = EdgeInsets.all(14);
}

/// Quantia radius scale — intentional, not 16px on everything.
///   hero 26 · card 20 · button/input 13 · chip 9 · pill 999
/// Legacy names are kept (screens reference them) but remapped to the new scale.
class AppRadius {
  AppRadius._();

  static const double sm   = 9;   // chips, swatches, small badges (Quantia r-sm)
  static const double md   = 11;  // segment toggles, compact controls
  static const double base = 13;  // inputs, primary buttons, icons (Quantia r-md)
  static const double lg   = 16;  // mini cards, nested surfaces
  static const double xl   = 20;  // main cards (Quantia r-lg)
  static const double xl2  = 22;  // content sections
  static const double xl3  = 26;  // bottom sheets, hero panel (Quantia r-xl)
  static const double hero = 26;  // hero panel
  static const double card = 20;  // canonical card radius
  static const double full = 44;  // avatars, FAB
  static const double pill = 999; // chips, badges, progress bars

  static BorderRadius get smAll   => BorderRadius.circular(sm);
  static BorderRadius get mdAll   => BorderRadius.circular(md);
  static BorderRadius get baseAll => BorderRadius.circular(base);
  static BorderRadius get lgAll   => BorderRadius.circular(lg);
  static BorderRadius get xlAll   => BorderRadius.circular(xl);
  static BorderRadius get xl2All  => BorderRadius.circular(xl2);
  static BorderRadius get xl3All  => BorderRadius.circular(xl3);
  static BorderRadius get heroAll => BorderRadius.circular(hero);
  static BorderRadius get cardAll => BorderRadius.circular(card);
  static BorderRadius get fullAll => BorderRadius.circular(full);
  static BorderRadius get pillAll => BorderRadius.circular(pill);
}

/// Quantia shadows — soft, never a generic hard drop. Light uses a low-opacity
/// petroleum-ink shadow; dark cards lean on their border instead. Brand
/// controls (FAB, primary button, logo) carry a subtle cobalt-tinted glow.
class AppShadows {
  AppShadows._();

  // Petroleum ink #17211D
  static const _ink = Color(0xFF17211D);
  // Cobalt #1F3CE0
  static const _cobalt = Color(0xFF1F3CE0);

  static final List<BoxShadow> cardLight = [
    BoxShadow(
      color: _ink.withValues(alpha: 0.06),
      blurRadius: 24,
      spreadRadius: -16,
      offset: const Offset(0, 10),
    ),
  ];

  static final List<BoxShadow> cardMd = [
    BoxShadow(
      color: _ink.withValues(alpha: 0.10),
      blurRadius: 44,
      spreadRadius: -28,
      offset: const Offset(0, 24),
    ),
  ];

  static const List<BoxShadow> cardDark = [];

  static final List<BoxShadow> primaryBtnShadow = [
    BoxShadow(
      color: _cobalt.withValues(alpha: 0.35),
      blurRadius: 24,
      spreadRadius: -12,
      offset: const Offset(0, 12),
    ),
  ];

  static final List<BoxShadow> logoShadow = [
    BoxShadow(
      color: _cobalt.withValues(alpha: 0.28),
      blurRadius: 14,
      offset: const Offset(0, 6),
    ),
  ];

  static final List<BoxShadow> bottomSheet = [
    BoxShadow(
      color: _ink.withValues(alpha: 0.18),
      blurRadius: 40,
      offset: const Offset(0, -8),
    ),
  ];
}
