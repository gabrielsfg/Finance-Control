import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_motion.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../../../shared/widgets/chart_reveal.dart';
import '../../providers/analytics_provider.dart';

class NetWorthChart extends ConsumerWidget {
  const NetWorthChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(netWorthEvolutionProvider);

    return async.when(
      loading: () => SizedBox(
        height: compact ? 160 : 220,
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
              child: Text('Sem dados para este período',
                  style: AppTextStyles.bodySm(t.txtTertiary)),
            ),
          );
        }

        final fmt = AppLocaleScope.of(context);
        final spots = items.indexed.map((entry) {
          final (i, item) = entry;
          return FlSpot(i.toDouble(), item.netWorth / 100);
        }).toList();

        final minY = spots.map((s) => s.y).reduce((a, b) => a < b ? a : b);
        final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
        final padding = (maxY - minY) * 0.15;
        final lineColor = t.accent;

        final months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return SizedBox(
          height: compact ? 160 : 220,
          child: ChartReveal(
            mode: ChartRevealMode.draw,
            child: LineChart(
              LineChartData(
                minY: minY - padding,
                maxY: maxY + padding,
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
                      interval: 1,
                      getTitlesWidget: (val, _) {
                        final i = val.toInt();
                        if (i < 0 || i >= items.length) return const SizedBox();
                        return Text(
                          months[items[i].month - 1],
                          style: AppTextStyles.mono(t.txtTertiary, fontSize: 10),
                        );
                      },
                    ),
                  ),
                ),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) => t.surface,
                    getTooltipItems: (spots) => spots.map((s) {
                      final i = s.x.toInt();
                      final item = items[i];
                      return LineTooltipItem(
                        '${months[item.month - 1]} ${item.year}\n${fmt.formatCurrency(item.netWorth)}',
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
                    color: lineColor,
                    barWidth: 2.5,
                    dotData: FlDotData(
                      show: items.length <= 6,
                      getDotPainter: (spot, xPercentage, bar, index) =>
                          FlDotCirclePainter(
                        radius: 4,
                        color: lineColor,
                        strokeWidth: 0,
                      ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          lineColor.withValues(alpha: 0.18),
                          lineColor.withValues(alpha: 0.0),
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
