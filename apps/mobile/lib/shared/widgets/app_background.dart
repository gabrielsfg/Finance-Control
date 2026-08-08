import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Page background — the calm, flat "paper" surface.
class AppBackground extends StatelessWidget {
  final Widget child;
  final bool scrollable;

  const AppBackground({super.key, required this.child, this.scrollable = true});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      color: t.bg,
      child: scrollable ? SingleChildScrollView(child: child) : child,
    );
  }
}
