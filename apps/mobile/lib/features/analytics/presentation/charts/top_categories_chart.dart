import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';

class TopCategoriesChart extends ConsumerWidget {
  const TopCategoriesChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(expensesByCategoryProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (items) {
        if (items.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);
        final top = items.take(compact ? 5 : 8).toList();
        final maxVal = top.first.total.toDouble();

        final barHeight = compact ? 28.0 : 36.0;
        final height = top.length * (barHeight + 8) + 16;

        return SizedBox(
          height: height,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.center,
              maxY: maxVal * 1.15,
              barGroups: top.indexed.map((entry) {
                final (i, item) = entry;
                return BarChartGroupData(
                  x: i,
                  barRods: [
                    BarChartRodData(
                      toY: item.total.toDouble(),
                      color: t.primary,
                      width: barHeight,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ],
                );
              }).toList(),
              gridData: FlGridData(
                show: true,
                drawHorizontalLine: false,
                getDrawingVerticalLine: (_) =>
                    FlLine(color: t.divider.withValues(alpha: 0.5), strokeWidth: 1),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                topTitles: const AxisTitles(),
                rightTitles: const AxisTitles(),
                bottomTitles: const AxisTitles(),
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 100,
                    getTitlesWidget: (val, _) {
                      final i = val.toInt();
                      if (i < 0 || i >= top.length) return const SizedBox();
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Text(
                          top[i].categoryName,
                          style: AppTextStyles.bodySm(t.txtSecondary)
                              .copyWith(fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.right,
                        ),
                      );
                    },
                  ),
                ),
              ),
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipColor: (_) => t.surface,
                  getTooltipItem: (group, groupIndex, rod, rodIndex) => BarTooltipItem(
                    fmt.formatCurrency(top[group.x].total),
                    AppTextStyles.bodySm(t.txtPrimary)
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

Widget _loader(bool compact) =>
    SizedBox(height: compact ? 180 : 240, child: const Center(child: CircularProgressIndicator()));

Widget _err(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Não foi possível carregar os dados', style: AppTextStyles.bodySm(t.txtTertiary))));

Widget _empty(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Sem despesas para este período', style: AppTextStyles.bodySm(t.txtTertiary))));
