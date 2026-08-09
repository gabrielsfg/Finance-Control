import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_motion.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../../../shared/widgets/chart_reveal.dart';
import '../../providers/analytics_provider.dart';

class BalanceEvolutionChart extends ConsumerWidget {
  const BalanceEvolutionChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(balanceEvolutionProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (items) {
        if (items.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);
        final spots = items.indexed
            .map((e) => FlSpot(e.$1.toDouble(), e.$2.balance / 100))
            .toList();

        final minY = spots.map((s) => s.y).reduce((a, b) => a < b ? a : b);
        final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
        final pad = ((maxY - minY) * 0.15).clamp(1.0, double.infinity);
        final color = t.accent;

        return SizedBox(
          height: compact ? 160 : 220,
          child: ChartReveal(
            mode: ChartRevealMode.draw,
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
                      showTitles: !compact && items.length <= 31,
                      interval: (items.length / 5).ceilToDouble(),
                      getTitlesWidget: (val, _) {
                        final i = val.toInt();
                        if (i < 0 || i >= items.length) return const SizedBox();
                        final d = items[i].date;
                        return Text(
                          '${d.day}/${d.month}',
                          style: AppTextStyles.mono(t.txtTertiary, fontSize: 9),
                        );
                      },
                    ),
                  ),
                ),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) => t.surface,
                    getTooltipItems: (spots) => spots.map((s) {
                      final item = items[s.x.toInt()];
                      final d = item.date;
                      return LineTooltipItem(
                        '${d.day}/${d.month}/${d.year}\n${fmt.formatCurrency(item.balance)}',
                        AppTextStyles.bodySm(t.txtPrimary)
                            .copyWith(fontWeight: FontWeight.w600),
                      );
                    }).toList(),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: color,
                    barWidth: 2,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          color.withValues(alpha: 0.18),
                          color.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              duration: AppMotion.slow,
              curve: AppMotion.settle,
            ),
          ),
        );
      },
    );
  }
}

Widget _loader(bool compact) =>
    SizedBox(height: compact ? 160 : 220, child: const Center(child: CircularProgressIndicator()));

Widget _err(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Não foi possível carregar os dados', style: AppTextStyles.bodySm(t.txtTertiary))));

Widget _empty(AppThemeTokens t) => SizedBox(
    height: 80,
    child: Center(child: Text('Sem dados para este período', style: AppTextStyles.bodySm(t.txtTertiary))));
