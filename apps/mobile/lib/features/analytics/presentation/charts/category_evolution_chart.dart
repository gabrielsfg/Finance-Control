import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';
import '../../providers/home_filter_provider.dart';

class CategoryEvolutionChart extends ConsumerWidget {
  const CategoryEvolutionChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final filter = ref.watch(homeFilterProvider);
    final async = ref.watch(categoryEvolutionProvider);

    if (filter.categoryId == null) {
      return SizedBox(
        height: 80,
        child: Center(
          child: Text(
            'Selecione uma categoria no filtro para ver sua evolução',
            style: AppTextStyles.bodySm(t.txtTertiary),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (items) {
        if (items.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);
        final spots = items.indexed
            .map((e) => FlSpot(e.$1.toDouble(), e.$2.total / 100))
            .toList();
        final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
        final months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
            'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return SizedBox(
          height: compact ? 160 : 220,
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
                    final item = items[s.x.toInt()];
                    return LineTooltipItem(
                      '${months[item.month - 1]} ${item.year}\n${fmt.formatCurrency(item.total)}',
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
                  color: t.clay,
                  barWidth: 2.5,
                  dotData: FlDotData(
                    show: items.length <= 6,
                    getDotPainter: (spot, xPercentage, bar, index) =>
                        FlDotCirclePainter(radius: 4, color: t.clay, strokeWidth: 0),
                  ),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        t.clay.withValues(alpha: 0.15),
                        t.clay.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ),
              ],
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
    child: Center(child: Text('Sem dados para esta categoria', style: AppTextStyles.bodySm(t.txtTertiary))));
