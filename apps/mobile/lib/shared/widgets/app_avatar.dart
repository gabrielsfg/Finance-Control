import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/app_colors.dart';

/// Rounded-square cobalt avatar with display-font initials (Quantia `.avatar`).
class AppAvatar extends StatelessWidget {
  final String initials;
  final double size;

  const AppAvatar({super.key, this.initials = 'FC', this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.28),
        gradient: AppColors.avatarGradient,
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1F3CE0).withValues(alpha: 0.28),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Center(
        child: Text(
          initials,
          style: GoogleFonts.bricolageGrotesque(
            fontSize: size * 0.4,
            fontWeight: FontWeight.w700,
            color: Colors.white,
            height: 1.0,
          ),
        ),
      ),
    );
  }
}
