import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';

class AppNavBar extends StatelessWidget {
  final int activeIndex;
  final ValueChanged<int>? onTap;

  const AppNavBar({super.key, this.activeIndex = 0, this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    const tabs = [
      (LucideIcons.layoutDashboard, 'Início'),
      (LucideIcons.arrowLeftRight, 'Extrato'),
      (LucideIcons.pieChart, 'Orçamento'),
      (LucideIcons.wallet, 'Contas'),
      (LucideIcons.menu, 'Menu'),
    ];

    return Container(
      height: 76,
      decoration: BoxDecoration(
        color: t.surface,
        border: Border(top: BorderSide(color: t.mist)),
      ),
      child: Row(
        children: tabs.asMap().entries.map((e) {
          final i = e.key;
          final (icon, label) = e.value;
          final isActive = i == activeIndex;
          final color = isActive ? t.accent : t.txtTertiary;
          return Expanded(
            child: GestureDetector(
              onTap: () => onTap?.call(i),
              behavior: HitTestBehavior.opaque,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    height: 3,
                    width: isActive ? 30 : 0,
                    decoration: BoxDecoration(
                      color: t.accent,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(3),
                        bottomRight: Radius.circular(3),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Icon(icon, size: 21, color: color),
                  const SizedBox(height: 4),
                  Text(
                    label,
                    style: GoogleFonts.hankenGrotesk(
                      fontSize: 10.5,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                      color: color,
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
