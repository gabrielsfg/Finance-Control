import 'package:flutter/material.dart';
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
      (LucideIcons.home, 'Início'),
      (LucideIcons.list, 'Extrato'),
      (LucideIcons.pieChart, 'Budget'),
      (LucideIcons.wallet, 'Contas'),
      (LucideIcons.user, 'Perfil'),
    ];

    return Container(
      height: 76,
      decoration: BoxDecoration(
        color: t.isDark
            ? const Color(0xFF110E1B).withValues(alpha: 0.97)
            : const Color(0xFFF7F4FF).withValues(alpha: 0.97),
        border: Border(
          top: BorderSide(
            color: t.isDark
                ? Colors.white.withValues(alpha: 0.06)
                : const Color(0xFF7C3AED).withValues(alpha: 0.12),
          ),
        ),
      ),
      child: Row(
        children: tabs.asMap().entries.map((e) {
          final i = e.key;
          final (icon, label) = e.value;
          final isActive = i == activeIndex;
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
                    width: isActive ? 32 : 0,
                    decoration: BoxDecoration(
                      color: t.primary,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(3),
                        bottomRight: Radius.circular(3),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Icon(icon, size: 22, color: isActive ? t.primary : t.txtDisabled),
                  const SizedBox(height: 3),
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                      color: isActive ? t.primary : t.txtDisabled,
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
