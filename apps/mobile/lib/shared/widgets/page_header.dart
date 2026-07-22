import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_text_styles.dart';

/// The single, canonical page title used across every screen.
///
/// Always left-aligned: an optional small uppercase [eyebrow] above the [title]
/// (h1). Pushed pages set [showBack] to get the standard back chevron; tabs
/// leave it off. An optional [trailing] widget (e.g. a filter button) sits on
/// the right.
class PageHeader extends StatelessWidget {
  const PageHeader({
    super.key,
    required this.title,
    this.eyebrow,
    this.showBack = false,
    this.onBack,
    this.trailing,
  });

  final String title;
  final String? eyebrow;
  final bool showBack;
  final VoidCallback? onBack;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        if (showBack) ...[
          _HeaderIconButton(
            icon: LucideIcons.chevronLeft,
            onTap: onBack ?? () {},
          ),
          const SizedBox(width: 14),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (eyebrow != null) ...[
                Text(eyebrow!, style: AppTextStyles.eyebrow(t.txtSecondary)),
                const SizedBox(height: 3),
              ],
              Text(title, style: AppTextStyles.h1(t.txtPrimary)),
            ],
          ),
        ),
        ?trailing,
      ],
    );
  }
}

/// The square, bordered icon button used for header actions (back, filter…).
class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.baseAll,
          border: Border.all(color: t.mist),
        ),
        child: Icon(icon, size: 20, color: t.txtSecondary),
      ),
    );
  }
}

/// A header action button matching the header's back button, for use in the
/// [PageHeader.trailing] slot (e.g. a filter or customize button).
class HeaderActionButton extends StatelessWidget {
  const HeaderActionButton({super.key, required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return _HeaderIconButton(icon: icon, onTap: onTap);
  }
}
