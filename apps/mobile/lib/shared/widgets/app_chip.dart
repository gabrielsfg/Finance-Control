import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

class AppChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback? onTap;

  const AppChip({super.key, required this.label, this.active = false, this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        height: 32,
        decoration: BoxDecoration(
          borderRadius: AppRadius.pillAll,
          color: active
              ? t.primary.withValues(alpha: t.isDark ? 0.25 : 0.12)
              : t.surfaceEl.withValues(alpha: t.isDark ? 0.8 : 0.7),
          border: Border.all(
            color: active
                ? t.primary.withValues(alpha: t.isDark ? 0.55 : 0.45)
                : t.isDark
                    ? Colors.white.withValues(alpha: 0.08)
                    : t.primary.withValues(alpha: 0.18),
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: AppTextStyles.caption(active ? t.accent : t.txtTertiary)
                .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
          ),
        ),
      ),
    );
  }
}
