import 'dart:ui';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;

  const GlassCard({super.key, required this.child, this.padding, this.borderRadius});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final br = borderRadius ?? AppRadius.xlAll;
    return ClipRRect(
      borderRadius: br,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: padding ?? AppSpacing.cardPadding,
          decoration: BoxDecoration(
            color: t.isDark
                ? const Color(0xFF1C1830).withValues(alpha: 0.72)
                : Colors.white.withValues(alpha: 0.82),
            borderRadius: br,
            border: Border.all(
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.07)
                  : const Color(0xFF7C3AED).withValues(alpha: 0.13),
            ),
            boxShadow: t.isDark ? [] : AppShadows.cardLight,
          ),
          child: child,
        ),
      ),
    );
  }
}
