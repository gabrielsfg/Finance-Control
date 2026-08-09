import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

/// Quantia section title (`.section-title`): a display heading, an optional
/// hairline rule that fills the remaining width, and an optional mono action
/// link on the right (e.g. "VER TUDO").
class SectionHeader extends StatelessWidget {
  const SectionHeader(
    this.title, {
    super.key,
    this.actionLabel,
    this.onAction,
    this.rule = false,
    this.eyebrow,
  });

  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  /// Draw the hairline rule between the title and the action.
  final bool rule;

  /// Optional mono uppercase eyebrow shown above the title.
  final String? eyebrow;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final titleRow = Row(
      children: [
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (eyebrow != null) ...[
                Text(eyebrow!.toUpperCase(),
                    style: AppTextStyles.eyebrow(t.txtSecondary)),
                const SizedBox(height: 4),
              ],
              Text(title, style: AppTextStyles.h2(t.txtPrimary)),
            ],
          ),
        ),
        if (rule) ...[
          const SizedBox(width: 14),
          Expanded(child: Container(height: 1, color: t.mist)),
        ] else
          const Spacer(),
        if (actionLabel != null) ...[
          const SizedBox(width: 14),
          GestureDetector(
            onTap: onAction,
            behavior: HitTestBehavior.opaque,
            child: Text(
              actionLabel!.toUpperCase(),
              style: AppTextStyles.eyebrow(t.accent)
                  .copyWith(letterSpacing: 1.0),
            ),
          ),
        ],
      ],
    );
    return titleRow;
  }
}
