import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

/// The base card. Quantia is flat and editorial (no frosted glass): a calm
/// surface with a hairline `mist` border and a soft shadow in light mode; in
/// dark mode the border alone separates it from the background.
///
/// Kept the `GlassCard` name so existing screens re-skin without edits.
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;
  final Color? color;
  final VoidCallback? onTap;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius,
    this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final br = borderRadius ?? AppRadius.cardAll;
    final card = Container(
      padding: padding ?? AppSpacing.cardPadding,
      decoration: BoxDecoration(
        color: color ?? t.surface,
        borderRadius: br,
        border: Border.all(color: t.mist),
        boxShadow: t.isDark ? AppShadows.cardDark : AppShadows.cardLight,
      ),
      child: child,
    );
    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      borderRadius: br,
      child: InkWell(
        onTap: onTap,
        borderRadius: br,
        child: card,
      ),
    );
  }
}
