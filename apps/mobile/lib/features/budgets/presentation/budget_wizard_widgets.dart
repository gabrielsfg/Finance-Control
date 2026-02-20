import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

/// Step indicator shared across the 3 budget creation steps.
class BudgetStepIndicator extends StatelessWidget {
  final int current; // 1-based

  const BudgetStepIndicator({super.key, required this.current});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(3, (i) {
        final step = i + 1;
        final isDone = step < current;
        final isActive = step == current;
        final color = (isDone || isActive) ? t.primary : t.txtDisabled;
        final bg = isDone
            ? t.primary
            : isActive
                ? t.primary.withValues(alpha: 0.15)
                : t.isDark
                    ? Colors.white.withValues(alpha: 0.05)
                    : t.primary.withValues(alpha: 0.06);

        return Row(
          children: [
            if (i > 0)
              Container(
                width: 40,
                height: 1.5,
                color: isDone
                    ? t.primary
                    : t.isDark
                        ? Colors.white.withValues(alpha: 0.1)
                        : t.primary.withValues(alpha: 0.15),
              ),
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: bg,
                border: Border.all(
                  color: color.withValues(alpha: isActive ? 0.5 : 0.3),
                ),
              ),
              child: Center(
                child: isDone
                    ? const Icon(Icons.check, size: 14, color: Colors.white)
                    : Text(
                        '$step',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: color,
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
