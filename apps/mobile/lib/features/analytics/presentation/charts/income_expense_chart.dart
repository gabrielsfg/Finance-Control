import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';

class IncomeExpenseChart extends ConsumerWidget {
  const IncomeExpenseChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(incomeExpenseProvider);

    return async.when(
      loading: () => _placeholder(compact),
      error: (e, _) => _error(context, t),
      data: (items) {
        if (items.isEmpty) return _empty(context, t);

        final maxVal = items
            .expand((e) => [e.totalIncome, e.totalExpense])
            .fold(0, (a, b) => a > b ? a : b)
            .toDouble();

        final groups = items.indexed.map((entry) {
          final (i, item) = entry;
          return BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: item.totalIncome / 100,
                color: t.success,
                width: compact ? 8 : 12,
                borderRadius: BorderRadius.circular(4),
              ),
              BarChartRodData(
                toY: item.totalExpense / 100,
                color: t.error,
                width: compact ? 8 : 12,
                borderRadius: BorderRadius.circular(4),
              ),
            ],
          );
        }).toList();

        final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        return SizedBox(
          height: compact ? 160 : 220,
          child: BarChart(
            BarChartData(
              maxY: maxVal / 100 * 1.15,
              barGroups: groups,
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                getDrawingHorizontalLine: (_) => FlLine(
                  color: t.divider.withValues(alpha: 0.5),
                  strokeWidth: 1,
                ),
              ),
              borderData: FlBorderData(show: false),
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(),
                rightTitles: const AxisTitles(),
                topTitles: const AxisTitles(),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: !compact,
                    getTitlesWidget: (val, _) {
                      final i = val.toInt();
                      if (i < 0 || i >= items.length) return const SizedBox();
                      return Text(
                        months[items[i].month - 1],
                        style: AppTextStyles.caption(t.txtTertiary)
                            .copyWith(fontSize: 10),
                      );
                    },
                  ),
                ),
              ),
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipColor: (_) => t.surface,
                  getTooltipItem: (group, _, rod, rodIndex) {
                    final item = items[group.x];
                    final fmt = AppLocaleScope.of(context);
                    final label = rodIndex == 0 ? 'Income' : 'Expense';
                    final value = rodIndex == 0
                        ? item.totalIncome
                        : item.totalExpense;
                    return BarTooltipItem(
                      '$label\n${fmt.formatCurrency(value)}',
                      AppTextStyles.bodySm(t.txtPrimary)
                          .copyWith(fontWeight: FontWeight.w600),
                    );
                  },
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

Widget _placeholder(bool compact) => SizedBox(
      height: compact ? 160 : 220,
      child: const Center(child: CircularProgressIndicator()),
    );

Widget _error(BuildContext context, AppThemeTokens t) => SizedBox(
      height: 80,
      child: Center(
        child: Text('Could not load data',
            style: AppTextStyles.bodySm(t.txtTertiary)),
      ),
    );

Widget _empty(BuildContext context, AppThemeTokens t) => SizedBox(
      height: 80,
      child: Center(
        child: Text('No data for this period',
            style: AppTextStyles.bodySm(t.txtTertiary)),
      ),
    );
