import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';

class FutureCommitmentsChart extends ConsumerWidget {
  const FutureCommitmentsChart({super.key, this.compact = false});

  final bool compact;

  static const _monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(futureCommitmentsProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (items) {
        if (items.isEmpty) {
          return SizedBox(
            height: 80,
            child: Center(
              child: Text('No upcoming commitments',
                  style: AppTextStyles.bodySm(t.txtTertiary)),
            ),
          );
        }

        final fmt = AppLocaleScope.of(context);
        final maxVal = items.map((e) => e.totalCommitted).reduce((a, b) => a > b ? a : b).toDouble();

        final groups = items.indexed.map((entry) {
          final (i, item) = entry;
          return BarChartGroupData(
            x: i,
            barRods: [
              BarChartRodData(
                toY: item.totalCommitted.toDouble(),
                color: t.warning,
                width: compact ? 20.0 : 28.0,
                borderRadius: BorderRadius.circular(4),
              ),
            ],
          );
        }).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: compact ? 140 : 200,
              child: BarChart(
                BarChartData(
                  maxY: maxVal * 1.15,
                  barGroups: groups,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) =>
                        FlLine(color: t.divider.withValues(alpha: 0.5), strokeWidth: 1),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: const AxisTitles(),
                    rightTitles: const AxisTitles(),
                    topTitles: const AxisTitles(),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (val, _) {
                          final i = val.toInt();
                          if (i < 0 || i >= items.length) return const SizedBox();
                          return Text(
                            _monthNames[items[i].month - 1],
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
                      getTooltipItem: (group, groupIndex, rod, rodIndex) => BarTooltipItem(
                        '${_monthNames[items[group.x].month - 1]}\n${fmt.formatCurrency(items[group.x].totalCommitted)}',
                        AppTextStyles.bodySm(t.txtPrimary)
                            .copyWith(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 16),
              ...items.map((item) => _MonthDetail(item: item, fmt: fmt, t: t)),
            ],
          ],
        );
      },
    );
  }
}

class _MonthDetail extends StatelessWidget {
  const _MonthDetail({required this.item, required this.fmt, required this.t});

  final dynamic item;
  final dynamic fmt;
  final AppThemeTokens t;

  @override
  Widget build(BuildContext context) {
    final monthName = FutureCommitmentsChart._monthNames[item.month - 1];
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: AppSpacing.cardPaddingSm,
      decoration: BoxDecoration(
        color: t.isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.black.withValues(alpha: 0.03),
        borderRadius: AppRadius.baseAll,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('$monthName ${item.year}',
                  style: AppTextStyles.body(t.txtPrimary)
                      .copyWith(fontWeight: FontWeight.w600, fontSize: 13)),
              const Spacer(),
              Text(fmt.formatCurrency(item.totalCommitted),
                  style: AppTextStyles.body(t.warning)
                      .copyWith(fontWeight: FontWeight.w700, fontSize: 13)),
            ],
          ),
          if (item.installments.isNotEmpty) ...[
            const SizedBox(height: 6),
            ...item.installments.map<Widget>((c) => Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: Row(
                    children: [
                      Text('• ${c.description}',
                          style: AppTextStyles.bodySm(t.txtSecondary)
                              .copyWith(fontSize: 12)),
                      const Spacer(),
                      Text(fmt.formatCurrency(c.value),
                          style: AppTextStyles.bodySm(t.txtSecondary)
                              .copyWith(fontSize: 12)),
                    ],
                  ),
                )),
          ],
        ],
      ),
    );
  }
}

Widget _loader(bool compact) =>
    SizedBox(height: compact ? 140 : 200, child: const Center(child: CircularProgressIndicator()));

Widget _err(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Could not load data', style: AppTextStyles.bodySm(t.txtTertiary))));
