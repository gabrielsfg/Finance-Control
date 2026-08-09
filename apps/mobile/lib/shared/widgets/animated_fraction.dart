import 'package:flutter/material.dart';

import '../../core/theme/app_motion.dart';

/// A [FractionallySizedBox] that *travels* to its new width instead of
/// snapping: it grows from empty on mount and slides whenever [widthFactor]
/// changes (a filter, a new period, a fresh fetch).
///
/// Drop-in replacement wherever a bar fill is expressed as a fraction and
/// [AppProgressBar] is not the right shape (gradient fills, stacked tracks,
/// bars living on the dark hero panel).
class AnimatedFraction extends StatelessWidget {
  const AnimatedFraction({
    super.key,
    required this.widthFactor,
    required this.child,
    this.alignment = Alignment.centerLeft,
    this.duration,
  });

  final double widthFactor;
  final Widget child;
  final AlignmentGeometry alignment;

  /// Defaults to [AppMotion.slow].
  final Duration? duration;

  @override
  Widget build(BuildContext context) {
    final target = widthFactor.clamp(0.0, 1.0);
    if (AppMotion.reduced(context)) {
      return FractionallySizedBox(
        alignment: alignment,
        widthFactor: target,
        child: child,
      );
    }
    return TweenAnimationBuilder<double>(
      // begin: 0 — without it the bar paints full on mount instead of growing
      // (TweenAnimationBuilder only animates when begin != end).
      tween: Tween(begin: 0, end: target),
      duration: duration ?? AppMotion.slow,
      curve: AppMotion.settle,
      child: child,
      builder: (_, value, animatedChild) => FractionallySizedBox(
        alignment: alignment,
        widthFactor: value,
        child: animatedChild,
      ),
    );
  }
}
