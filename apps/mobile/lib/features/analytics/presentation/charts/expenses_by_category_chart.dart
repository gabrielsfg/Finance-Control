import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_motion.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../../../shared/widgets/chart_reveal.dart';
import '../../providers/analytics_provider.dart';

class ExpensesByCategoryChart extends ConsumerStatefulWidget {
  const ExpensesByCategoryChart({super.key, this.compact = false});

  final bool compact;

  @override
  ConsumerState<ExpensesByCategoryChart> createState() =>
      _ExpensesByCategoryChartState();
}

class _ExpensesByCategoryChartState
    extends ConsumerState<ExpensesByCategoryChart> {
  int? _touched;

  // Quantia categorical palette — cycled across the pie slices.
  List<Color> _paletteFor(AppThemeTokens t) => [
        t.accent,
        t.moss,
        t.clay,
        t.gold,
        t.cobaltLift,
        t.mossLift,
        t.clayLift,
        t.txtTertiary,
      ];

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final palette = _paletteFor(t);
    final async = ref.watch(expensesByCategoryProvider);

    return async.when(
      loading: () => SizedBox(
        height: widget.compact ? 160 : 220,
        child: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => SizedBox(
        height: 80,
        child: Center(
          child: Text('Não foi possível carregar os dados',
              style: AppTextStyles.bodySm(t.txtTertiary)),
        ),
      ),
      data: (items) {
        if (items.isEmpty) {
          return SizedBox(
            height: 80,
            child: Center(
              child: Text('Sem despesas para este período',
                  style: AppTextStyles.bodySm(t.txtTertiary)),
            ),
          );
        }

        final total = items.fold(0, (s, e) => s + e.total);
        final fmt = AppLocaleScope.of(context);

        final sections = items.indexed.map((entry) {
          final (i, item) = entry;
          final isTouched = _touched == i;
          final pct = total > 0 ? item.total / total : 0.0;
          return PieChartSectionData(
            value: item.total.toDouble(),
            color: palette[i % palette.length],
            radius: isTouched
                ? (widget.compact ? 52.0 : 68.0)
                : (widget.compact ? 44.0 : 60.0),
            title: isTouched ? '${(pct * 100).toStringAsFixed(1)}%' : '',
            titleStyle: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.white),
          );
        }).toList();

        final height = widget.compact ? 160.0 : 220.0;

        return Column(
          children: [
            SizedBox(
              height: height,
              child: Row(
                children: [
                  Expanded(
                    child: ChartReveal(
                      mode: ChartRevealMode.sweep,
                      child: PieChart(
                        PieChartData(
                          sections: sections,
                          centerSpaceRadius: widget.compact ? 32 : 44,
                          sectionsSpace: 2,
                          pieTouchData: PieTouchData(
                            touchCallback: (_, response) {
                              setState(() {
                                _touched = response?.touchedSection
                                    ?.touchedSectionIndex;
                              });
                            },
                          ),
                        ),
                        duration: AppMotion.slow,
                        curve: AppMotion.settle,
                      ),
                    ),
                  ),
                  if (!widget.compact) ...[
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: items.indexed.map((entry) {
                          final (i, item) = entry;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 6),
                            child: Row(
                              children: [
                                Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: palette[i % palette.length],
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    item.categoryName,
                                    style: AppTextStyles.bodySm(t.txtSecondary)
                                        .copyWith(fontSize: 11),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Text(
                                  fmt.formatCurrency(item.total),
                                  style: AppTextStyles.bodySm(t.txtPrimary)
                                      .copyWith(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600),
                                ),
                              ],
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (widget.compact && _touched != null && _touched! < items.length)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '${items[_touched!].categoryName}: ${fmt.formatCurrency(items[_touched!].total)}',
                  style: AppTextStyles.bodySm(t.txtSecondary)
                      .copyWith(fontWeight: FontWeight.w600),
                ),
              ),
          ],
        );
      },
    );
  }
}
