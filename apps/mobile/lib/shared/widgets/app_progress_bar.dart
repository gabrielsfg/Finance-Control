import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';

class AppProgressBar extends StatelessWidget {
  final double percent; // 0.0 to 1.0
  final Color? color;

  /// Grows the fill from empty on mount and slides it whenever [percent]
  /// changes. On by default — a bar that snaps reads as a layout glitch.
  final bool animate;

  const AppProgressBar({
    super.key,
    required this.percent,
    this.color,
    this.animate = true,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final c = percent >= 1.0
        ? t.error
        : percent >= 0.8
        ? t.warning
        : (color ?? t.primary);
    final trackColor = t.surfaceEl;
    final target = percent.clamp(0.0, 1.0);

    return SizedBox(
      height: 6,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: AppRadius.pillAll,
          color: trackColor,
        ),
        child: ClipRRect(
          borderRadius: AppRadius.pillAll,
          child: Align(
            alignment: Alignment.centerLeft,
            child: animate && !AppMotion.reduced(context)
                ? TweenAnimationBuilder<double>(
                    // begin: 0 so the fill grows on mount, not just on change.
                    tween: Tween(begin: 0, end: target),
                    duration: AppMotion.slow,
                    curve: AppMotion.settle,
                    builder: (_, value, _) => _fill(value, c),
                  )
                : _fill(target, c),
          ),
        ),
      ),
    );
  }

  Widget _fill(double fraction, Color fillColor) => FractionallySizedBox(
    widthFactor: fraction,
    child: DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: AppRadius.pillAll,
        color: fillColor,
      ),
      // FractionallySizedBox needs a sized child to lay the fill out.
      child: const SizedBox(height: 6),
    ),
  );
}
