import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'hero_panel.dart';
import 'money.dart';

/// The canonical totalizador used across screens. A [HeroPanel] with:
///   • an [eyebrow] label,
///   • one big hero [valueCents] (optionally coloured / signed),
///   • an optional [belowHero] widget (e.g. a progress bar), and
///   • a divided row of secondary [stats].
///
/// Screens differ in the numbers they show (and may pass a larger [valueSize]),
/// but they all read as the same component: same dark panel, same colours,
/// same money typography.
class SummaryPanel extends StatelessWidget {
  const SummaryPanel({
    super.key,
    required this.eyebrow,
    required this.valueCents,
    this.valueSize = 40,
    this.valueColor,
    this.signed = false,
    this.belowHero,
    this.stats = const [],
  });

  final String eyebrow;
  final int valueCents;
  final double valueSize;
  final Color? valueColor;
  final bool signed;
  final Widget? belowHero;
  final List<SummaryStat> stats;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return HeroPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(eyebrow, style: AppTextStyles.eyebrow(t.panelMuted)),
          const SizedBox(height: 10),
          Money(
            valueCents,
            size: valueSize,
            weight: FontWeight.w600,
            color: valueColor ?? t.panelText,
            symbolColor: t.panelMuted,
            symbolScale: 0.36,
            centsScale: 0.46,
            signed: signed,
            animate: true,
          ),
          if (belowHero != null) ...[
            const SizedBox(height: 14),
            belowHero!,
          ],
          if (stats.isNotEmpty) ...[
            const SizedBox(height: 20),
            SummaryStatRow(stats: stats),
          ],
        ],
      ),
    );
  }
}

/// A single stat inside a [SummaryPanel]/[SummaryStatRow]: an eyebrow label and
/// a money value, rendered on the dark panel.
class SummaryStat {
  const SummaryStat({
    required this.label,
    required this.valueCents,
    this.valueColor,
    this.signed = false,
  });

  final String label;
  final int valueCents;
  final Color? valueColor;
  final bool signed;
}

/// Lays out [SummaryStat]s in a row separated by thin vertical dividers, to sit
/// on a [HeroPanel].
class SummaryStatRow extends StatelessWidget {
  const SummaryStatRow({super.key, required this.stats});

  final List<SummaryStat> stats;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final children = <Widget>[];

    for (var i = 0; i < stats.length; i++) {
      final s = stats[i];
      children.add(
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                s.label,
                style: AppTextStyles.eyebrow(t.panelMuted, fontSize: 10),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 6),
              Money(
                s.valueCents,
                size: 16,
                color: s.valueColor ?? t.panelText,
                symbolColor: t.panelMuted,
                signed: s.signed,
                animate: true,
              ),
            ],
          ),
        ),
      );
      if (i != stats.length - 1) {
        children.add(
          Container(
            width: 1,
            height: 40,
            color: Colors.white.withValues(alpha: 0.12),
            margin: const EdgeInsets.symmetric(horizontal: 14),
          ),
        );
      }
    }

    return Row(children: children);
  }
}
