import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Step indicator shared across the 4 budget creation steps.
class BudgetStepIndicator extends StatelessWidget {
  final int current; // 1-based

  const BudgetStepIndicator({super.key, required this.current});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(4, (i) {
        final step = i + 1;
        final isDone = step < current;
        final isActive = step == current;
        // Active step reads in cobalt (accent); completed steps carry a solid
        // cobalt fill; upcoming steps stay recessed with a mist hairline.
        final numberColor = (isDone || isActive) ? t.accent : t.txtTertiary;
        final bg = isDone
            ? t.primary
            : isActive
                ? t.accent.withValues(alpha: t.isDark ? 0.18 : 0.10)
                : t.surfaceEl;
        final borderColor = isDone
            ? t.primary
            : isActive
                ? t.accent.withValues(alpha: t.isDark ? 0.6 : 0.45)
                : t.mist;

        return Row(
          children: [
            if (i > 0)
              Container(
                width: 40,
                height: 1.5,
                color: isDone ? t.primary : t.mist,
              ),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: bg,
                border: Border.all(color: borderColor),
              ),
              child: Center(
                child: isDone
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : Text(
                        '$step',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: numberColor,
                        ),
                      ),
              ),
            ),
          ],
        );
      }),
    );
  }
}
