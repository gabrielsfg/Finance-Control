import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

class AppProgressBar extends StatelessWidget {
  final double percent; // 0.0 to 1.0
  final Color? color;

  const AppProgressBar({super.key, required this.percent, this.color});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final c = percent >= 1.0
        ? t.error
        : percent >= 0.8
            ? t.warning
            : (color ?? t.primary);
    final trackColor = t.isDark
        ? Colors.white.withValues(alpha: 0.1)
        : const Color(0xFF7C3AED).withValues(alpha: 0.12);
    return LayoutBuilder(
      builder: (_, constraints) {
        final totalWidth = constraints.maxWidth;
        final fillWidth =
            (totalWidth * percent.clamp(0.0, 1.0)).clamp(0.0, totalWidth);
        return SizedBox(
          height: 6,
          width: totalWidth,
          child: Stack(
            children: [
              Container(
                width: totalWidth,
                height: 6,
                decoration: BoxDecoration(
                  borderRadius: AppRadius.pillAll,
                  color: trackColor,
                ),
              ),
              if (fillWidth > 0)
                Container(
                  width: fillWidth,
                  height: 6,
                  decoration: BoxDecoration(
                    borderRadius: AppRadius.pillAll,
                    color: c,
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
