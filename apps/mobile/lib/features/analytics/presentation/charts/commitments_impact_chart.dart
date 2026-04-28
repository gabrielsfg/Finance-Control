import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';

class CommitmentsImpactChart extends ConsumerWidget {
  const CommitmentsImpactChart({super.key, this.compact = false});

  final bool compact;

  static const _monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(commitmentsImpactProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (impact) {
        if (impact.months.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);

        final spots = impact.months.indexed
            .map((e) => FlSpot(e.$1.toDouble(), e.$2.projectedBalance / 100))
            .toList();

        final allY = spots.map((s) => s.y).toList();
        final minY = allY.reduce((a, b) => a < b ? a : b);
        final maxY = allY.reduce((a, b) => a > b ? a : b);
        final pad = ((maxY - minY) * 0.2).clamp(1.0, double.infinity);

        final hasNegative = impact.months.any((m) => m.isNegative);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (hasNegative && !compact)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: AppSpacing.cardPaddingSm,
                decoration: BoxDecoration(
                  color: t.error.withValues(alpha: 0.10),
                  borderRadius: AppRadius.smAll,
                  border: Border.all(color: t.error.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning_rounded, color: t.error, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Your balance may go negative due to upcoming commitments.',
                        style: AppTextStyles.bodySm(t.error)
                            .copyWith(fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
            SizedBox(
              height: compact ? 140 : 200,
              child: LineChart(
                LineChartData(
                  minY: minY - pad,
                  maxY: maxY + pad,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (val) {
                      final isZero = val.abs() < 1;
                      return FlLine(
                        color: isZero
                            ? t.error.withValues(alpha: 0.5)
                            : t.divider.withValues(alpha: 0.4),
                        strokeWidth: isZero ? 1.5 : 1,
                        dashArray: isZero ? null : [4, 4],
                      );
                    },
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
                          if (i < 0 || i >= impact.months.length) {
                            return const SizedBox();
                          }
                          return Text(
                            _monthNames[impact.months[i].month - 1],
                            style: AppTextStyles.caption(t.txtTertiary)
                                .copyWith(fontSize: 10),
                          );
                        },
                      ),
                    ),
                  ),
                  lineTouchData: LineTouchData(
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipColor: (_) => t.surface,
                      getTooltipItems: (spots) => spots.map((s) {
                        final m = impact.months[s.x.toInt()];
                        final negative = m.isNegative;
                        return LineTooltipItem(
                          '${_monthNames[m.month - 1]} ${m.year}\n${fmt.formatCurrency(m.projectedBalance)}',
                          AppTextStyles.bodySm(negative ? t.error : t.txtPrimary)
                              .copyWith(fontWeight: FontWeight.w600),
                        );
                      }).toList(),
                    ),
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      gradient: LinearGradient(
                        colors: spots.any((s) => s.y < 0)
                            ? [t.success, t.error]
                            : [t.success, t.success],
                      ),
                      barWidth: 2.5,
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, xPercentage, bar, index) {
                          final m = impact.months[index];
                          return FlDotCirclePainter(
                            radius: 5,
                            color: m.isNegative ? t.error : t.success,
                            strokeWidth: 0,
                          );
                        },
                      ),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            t.success.withValues(alpha: 0.10),
                            t.success.withValues(alpha: 0.0),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 16),
              ...impact.months.map((m) => _MonthRow(m: m, fmt: fmt, t: t)),
            ],
          ],
        );
      },
    );
  }
}

class _MonthRow extends StatelessWidget {
  const _MonthRow({required this.m, required this.fmt, required this.t});

  final dynamic m;
  final dynamic fmt;
  final AppThemeTokens t;

  @override
  Widget build(BuildContext context) {
    final negative = m.isNegative as bool;
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      padding: AppSpacing.cardPaddingSm,
      decoration: BoxDecoration(
        color: negative
            ? t.error.withValues(alpha: 0.08)
            : (t.isDark
                ? Colors.white.withValues(alpha: 0.04)
                : Colors.black.withValues(alpha: 0.02)),
        borderRadius: AppRadius.smAll,
        border: negative
            ? Border.all(color: t.error.withValues(alpha: 0.25))
            : null,
      ),
      child: Row(
        children: [
          if (negative)
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: Icon(Icons.warning_amber_rounded, color: t.error, size: 14),
            ),
          Text(
            '${CommitmentsImpactChart._monthNames[m.month - 1]} ${m.year}',
            style: AppTextStyles.bodySm(t.txtPrimary)
                .copyWith(fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 8),
          Text(
            '−${fmt.formatCurrency(m.totalCommitments)}',
            style: AppTextStyles.bodySm(t.error).copyWith(fontSize: 11),
          ),
          const Spacer(),
          Text(
            fmt.formatCurrency(m.projectedBalance),
            style: AppTextStyles.body(negative ? t.error : t.success)
                .copyWith(fontWeight: FontWeight.w700, fontSize: 13),
          ),
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

Widget _empty(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('No commitments found', style: AppTextStyles.bodySm(t.txtTertiary))));
