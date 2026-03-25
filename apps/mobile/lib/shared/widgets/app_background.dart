import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class AppBackground extends StatelessWidget {
  final Widget child;
  final bool scrollable;

  const AppBackground({super.key, required this.child, this.scrollable = true});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      color: t.bg,
      child: Stack(
        children: [
          Positioned(
            top: -80, right: -60,
            child: Container(
              width: 260, height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF8B5CF6).withValues(alpha: t.isDark ? 0.22 : 0.14),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          Positioned(
            bottom: 100, left: -100,
            child: Container(
              width: 320, height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  const Color(0xFF6D28D9).withValues(alpha: t.isDark ? 0.10 : 0.08),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          scrollable
              ? SingleChildScrollView(child: child)
              : child,
        ],
      ),
    );
  }
}
