import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

/// Quantia tag/badge (`.tagx` / `.st-pill`): mono, pill-shaped, with a
/// translucent tint of its own color (`color-mix` 14%) and full-color text.
/// Set [solid] for the "ink" variant (solid background, inverted text).
class TonalTag extends StatelessWidget {
  const TonalTag(
    this.label, {
    super.key,
    this.color,
    this.icon,
    this.solid = false,
    this.fontSize = 11,
  });

  final String label;
  final Color? color;
  final IconData? icon;
  final bool solid;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final c = color ?? t.accent;
    final bg = solid ? t.txtPrimary : c.withValues(alpha: 0.14);
    final fg = solid ? t.bg : c;

    return Container(
      padding: EdgeInsets.symmetric(horizontal: fontSize, vertical: fontSize * 0.36),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: fontSize + 2, color: fg),
            SizedBox(width: fontSize * 0.4),
          ],
          Text(
            label.toUpperCase(),
            style: AppTextStyles.eyebrow(fg, fontSize: fontSize)
                .copyWith(letterSpacing: fontSize * 0.06),
          ),
        ],
      ),
    );
  }
}
