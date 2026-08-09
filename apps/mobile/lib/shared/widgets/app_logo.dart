import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

/// Cobalt brand tile (rounded square, Quantia glyph placeholder).
class AppLogo extends StatelessWidget {
  final double size;
  const AppLogo({super.key, this.size = 80});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: AppColors.logoGradient,
        boxShadow: AppShadows.logoShadow,
      ),
      child: Icon(LucideIcons.wallet, color: Colors.white, size: size * 0.44),
    );
  }
}
