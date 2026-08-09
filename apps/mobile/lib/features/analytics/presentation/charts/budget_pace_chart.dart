import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_motion.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../../../shared/widgets/chart_reveal.dart';
import '../../data/analytics_repository.dart';
import '../../data/models/analytics_models.dart';

// BudgetPace requires a budgetId. We expose a provider keyed by budgetId.
final _budgetPaceFamily =
    FutureProvider.autoDispose.family<BudgetPace?, int>((ref, budgetId) {
  return ref.read(analyticsRepositoryProvider).getBudgetPace(budgetId);
});

class BudgetPaceChart extends ConsumerWidget {
  const BudgetPaceChart({super.key, this.compact = false, this.budgetId});

  final bool compact;
  final int? budgetId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);

    if (budgetId == null) {
      return SizedBox(
        height: 80,
        child: Center(
          child: Text(
            'Nenhum orçamento ativo selecionado',
            style: AppTextStyles.bodySm(t.txtTertiary),
          ),
        ),
      );
    }

    final async = ref.watch(_budgetPaceFamily(budgetId!));

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (pace) {
        if (pace == null || pace.actual.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);

        // Build actual cumulative spots
        final actualSpots = pace.actual.indexed
            .map((e) => FlSpot(e.$1.toDouble(), e.$2.accumulated / 100))
            .toList();

        // Build ideal line: dailyIdeal * day_index
        final dayCount = pace.actual.length;
        final idealSpots = List.generate(
          dayCount,
          (i) => FlSpot(i.toDouble(), pace.dailyIdeal * (i + 1)),
        );

        final maxY = [
          actualSpots.map((s) => s.y).reduce((a, b) => a > b ? a : b),
          idealSpots.map((s) => s.y).reduce((a, b) => a > b ? a : b),
        ].reduce((a, b) => a > b ? a : b);

        return SizedBox(
          height: compact ? 160 : 220,
          child: ChartReveal(
            mode: ChartRevealMode.draw,
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: maxY * 1.15,
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
                      interval: (dayCount / 5).ceilToDouble(),
                      getTitlesWidget: (val, _) {
                        final i = val.toInt();
                        if (i < 0 || i >= pace.actual.length) {
                          return const SizedBox();
                        }
                        final d = pace.actual[i].date;
                        return Text('${d.day}',
                            style: AppTextStyles.mono(t.txtTertiary, fontSize: 9));
                      },
                    ),
                  ),
                ),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) => t.surface,
                    getTooltipItems: (touchedSpots) =>
                        touchedSpots.map((s) {
                      final label = s.barIndex == 0 ? 'Real' : 'Ideal';
                      return LineTooltipItem(
                        '$label\n${fmt.formatCurrency((s.y * 100).toInt())}',
                        AppTextStyles.bodySm(t.txtPrimary)
                            .copyWith(fontWeight: FontWeight.w600),
                      );
                    }).toList(),
                  ),
                ),
                lineBarsData: [
                  // Actual spending
                  LineChartBarData(
                    spots: actualSpots,
                    isCurved: false,
                    color: t.clay,
                    barWidth: 2.5,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: t.clay.withValues(alpha: 0.10),
                    ),
                  ),
                  // Ideal pace (dashed look via dashArray)
                  LineChartBarData(
                    spots: idealSpots,
                    isCurved: false,
                    color: t.txtTertiary,
                    barWidth: 1.5,
                    dashArray: [6, 4],
                    dotData: const FlDotData(show: false),
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
    child: Center(child: Text('Sem dados de orçamento para este período', style: AppTextStyles.bodySm(t.txtTertiary))));
