import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';

class NetWorthProjectionChart extends ConsumerWidget {
  const NetWorthProjectionChart({super.key, this.compact = false});

  final bool compact;

  static const _monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(netWorthProjectionProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (proj) {
        if (proj.historical.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);

        final historicalSpots = proj.historical.indexed
            .map((e) => FlSpot(e.$1.toDouble(), e.$2.netWorth / 100))
            .toList();

        final projOffset = proj.historical.length.toDouble();
        final projSpots = [
          if (proj.historical.isNotEmpty)
            FlSpot(projOffset - 1, proj.historical.last.netWorth / 100),
          ...proj.projected.indexed
              .map((e) => FlSpot(projOffset + e.$1, e.$2.netWorth / 100)),
        ];

        final allY = [
          ...historicalSpots.map((s) => s.y),
          ...projSpots.map((s) => s.y),
        ];
        final minY = allY.reduce((a, b) => a < b ? a : b);
        final maxY = allY.reduce((a, b) => a > b ? a : b);
        final pad = ((maxY - minY) * 0.15).clamp(1.0, double.infinity);

        final growing = proj.monthlyAvgGrowth >= 0;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: compact ? 160 : 220,
              child: LineChart(
                LineChartData(
                  minY: minY - pad,
                  maxY: maxY + pad,
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
                        showTitles: !compact,
                        interval: (proj.historical.length / 4).ceilToDouble(),
                        getTitlesWidget: (val, _) {
                          final i = val.toInt();
                          if (i < 0 || i >= proj.historical.length) {
                            return const SizedBox();
                          }
                          final item = proj.historical[i];
                          return Text(
                            _monthNames[item.month - 1],
                            style: AppTextStyles.caption(t.txtTertiary)
                                .copyWith(fontSize: 9),
                          );
                        },
                      ),
                    ),
                  ),
                  lineTouchData: LineTouchData(
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipColor: (_) => t.surface,
                      getTooltipItems: (spots) => spots.map((s) {
                        final label =
                            s.barIndex == 0 ? 'Historical' : 'Projected';
                        return LineTooltipItem(
                          '$label\n${fmt.formatCurrency((s.y * 100).toInt())}',
                          AppTextStyles.bodySm(t.txtPrimary)
                              .copyWith(fontWeight: FontWeight.w600),
                        );
                      }).toList(),
                    ),
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: historicalSpots,
                      isCurved: true,
                      color: t.primary,
                      barWidth: 2.5,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            t.primary.withValues(alpha: 0.15),
                            t.primary.withValues(alpha: 0.0),
                          ],
                        ),
                      ),
                    ),
                    LineChartBarData(
                      spots: projSpots,
                      isCurved: true,
                      color: growing ? t.success : t.error,
                      barWidth: 2,
                      dashArray: [6, 4],
                      dotData: const FlDotData(show: false),
                    ),
                  ],
                ),
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 16),
              _InsightCard(proj: proj, fmt: fmt, t: t),
            ],
          ],
        );
      },
    );
  }
}

class _InsightCard extends StatelessWidget {
  const _InsightCard({required this.proj, required this.fmt, required this.t});

  final dynamic proj;
  final dynamic fmt;
  final AppThemeTokens t;

  @override
  Widget build(BuildContext context) {
    final growing = proj.monthlyAvgGrowth >= 0;

    return Column(
      children: [
        _Row(
          label: 'Current net worth',
          value: fmt.formatCurrency(proj.currentNetWorth),
          color: proj.currentNetWorth >= 0 ? t.success : t.error,
          t: t,
        ),
        const SizedBox(height: 6),
        _Row(
          label: 'Monthly avg growth',
          value:
              '${growing ? '+' : ''}${fmt.formatCurrency(proj.monthlyAvgGrowth.toInt())}',
          color: growing ? t.success : t.error,
          t: t,
        ),
        if (proj.monthsUntilZero != null) ...[
          const SizedBox(height: 6),
          _Row(
            label: 'Months until net worth reaches zero',
            value: '${proj.monthsUntilZero}',
            color: t.error,
            t: t,
          ),
        ],
        if (proj.monthsUntilTarget != null) ...[
          const SizedBox(height: 6),
          _Row(
            label: 'Months until target (${fmt.formatCurrency(proj.targetAmount ?? 0)})',
            value: '${proj.monthsUntilTarget}',
            color: t.success,
            t: t,
          ),
        ],
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(
      {required this.label,
      required this.value,
      required this.color,
      required this.t});

  final String label;
  final String value;
  final Color color;
  final AppThemeTokens t;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: AppSpacing.cardPaddingSm,
      decoration: BoxDecoration(
        color: t.isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.black.withValues(alpha: 0.02),
        borderRadius: AppRadius.smAll,
      ),
      child: Row(
        children: [
          Expanded(child: Text(label, style: AppTextStyles.bodySm(t.txtSecondary))),
          const SizedBox(width: 8),
          Text(value,
              style: AppTextStyles.body(color)
                  .copyWith(fontWeight: FontWeight.w700, fontSize: 14)),
        ],
      ),
    );
  }
}

Widget _loader(bool compact) =>
    SizedBox(height: compact ? 160 : 220, child: const Center(child: CircularProgressIndicator()));

Widget _err(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Could not load data', style: AppTextStyles.bodySm(t.txtTertiary))));

Widget _empty(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Not enough data to project', style: AppTextStyles.bodySm(t.txtTertiary))));
