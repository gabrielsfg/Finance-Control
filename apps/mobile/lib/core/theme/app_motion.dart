import 'package:flutter/material.dart';

/// Quantia motion scale — one curve, three durations.
///
/// The rule the whole app follows: motion should *register*, never delay. Every
/// entrance and every value change lands inside 500 ms, and they all decelerate
/// on the same curve, so a number counting up on Home and a bar growing in
/// Análises read as the same product gesture.
class AppMotion {
  AppMotion._();

  /// The settle curve — fast out of the gate, soft landing. No overshoot: money
  /// figures that bounce past their value and come back read as a glitch.
  static const Curve settle = Curves.easeOutCubic;

  /// For things leaving the screen (sheets, dialogs) — accelerate away.
  static const Curve exit = Curves.easeInCubic;

  /// Taps, colour and opacity swaps.
  static const Duration fast = Duration(milliseconds: 180);

  /// Sheets, cards and structural entrances.
  static const Duration base = Duration(milliseconds: 260);

  /// Chart reveals and page transitions.
  static const Duration slow = Duration(milliseconds: 420);

  /// Money and percentage counters travelling to a new value. Longer than the
  /// structural durations on purpose: a count-up is the one animation the eye
  /// actually *reads*, so the digits need time to be legible on the way up.
  /// Kept in sync with NUMBER_ANIM_DURATION on the web.
  static const Duration number = Duration(milliseconds: 900);

  /// Delay between siblings in a staggered list/grid entrance.
  static const Duration stagger = Duration(milliseconds: 55);

  /// True when the platform asks for reduced motion (iOS "Reduce Motion",
  /// Android "Remove animations"). Callers should collapse to the end state.
  static bool reduced(BuildContext context) =>
      MediaQuery.maybeOf(context)?.disableAnimations ?? false;

  /// [d], or [Duration.zero] when the platform asks for reduced motion.
  static Duration duration(BuildContext context, Duration d) =>
      reduced(context) ? Duration.zero : d;
}
