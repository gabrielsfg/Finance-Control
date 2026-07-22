import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Page background — the calm "paper" surface with two very subtle tints
/// (cobalt top-left, moss bottom-right), matching the Quantia body texture.
class AppBackground extends StatelessWidget {
  final Widget child;
  final bool scrollable;

  const AppBackground({super.key, required this.child, this.scrollable = true});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    const cobalt = Color(0xFF1F3CE0);
    const moss = Color(0xFF2C6B57);
    return Container(
      color: t.bg,
      child: Stack(
        children: [
          Positioned(
            top: -120,
            left: -80,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  cobalt.withValues(alpha: t.isDark ? 0.10 : 0.06),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            right: -110,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(colors: [
                  moss.withValues(alpha: t.isDark ? 0.09 : 0.055),
                  Colors.transparent,
                ]),
              ),
            ),
          ),
          scrollable ? SingleChildScrollView(child: child) : child,
        ],
      ),
    );
  }
}
