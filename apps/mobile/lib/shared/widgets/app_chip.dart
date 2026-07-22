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
              ? t.accent.withValues(alpha: t.isDark ? 0.22 : 0.12)
              : t.surface,
          border: Border.all(
            color: active
                ? t.accent.withValues(alpha: t.isDark ? 0.6 : 0.5)
                : t.mist,
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
