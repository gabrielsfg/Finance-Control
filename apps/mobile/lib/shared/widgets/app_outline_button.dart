import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

class AppOutlineButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final Widget? icon;
  final bool danger;
  final bool dashed;

  const AppOutlineButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.danger = false,
    this.dashed = false,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final borderColor = danger
        ? t.error
        : t.isDark
            ? const Color(0xFF8B5CF6).withValues(alpha: 0.5)
            : const Color(0xFF7C3AED).withValues(alpha: 0.4);
    final bgColor = danger
        ? t.error.withValues(alpha: t.isDark ? 0.0 : 0.04)
        : t.primary.withValues(alpha: t.isDark ? 0.0 : 0.04);

    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 48,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: AppRadius.baseAll,
          border: Border.all(color: borderColor, width: 1.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[icon!, const SizedBox(width: 6)],
            Text(
              label,
              style: AppTextStyles.body(danger ? t.error : t.primary).copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
