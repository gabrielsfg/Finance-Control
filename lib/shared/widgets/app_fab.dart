import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';

class AppFAB extends StatelessWidget {
  final VoidCallback? onTap;

  const AppFAB({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56, height: 56,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: AppColors.primaryGradient,
          boxShadow: AppShadows.fabShadow,
        ),
        child: const Icon(LucideIcons.plus, color: Colors.white, size: 24),
      ),
    );
  }
}
