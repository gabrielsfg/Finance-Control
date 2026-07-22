import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../../../shared/widgets/app_widgets.dart';
import '../../providers/analytics_provider.dart';

class BalanceProjectionChart extends ConsumerWidget {
  const BalanceProjectionChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(balanceProjectionProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (proj) {
        final fmt = AppLocaleScope.of(context);

        final allPoints = [...proj.actual, ...proj.projected];
        if (allPoints.isEmpty) return _empty(t);

        final actualSpots = proj.actual.indexed
            .map((e) => FlSpot(e.$1.toDouble(), e.$2.balance / 100))
            .toList();

        final projOffset = proj.actual.length.toDouble();
        final projSpots = [
          if (proj.actual.isNotEmpty)
            FlSpot(projOffset - 1, proj.actual.last.balance / 100),
          ...proj.projected.indexed
              .map((e) => FlSpot(projOffset + e.$1, e.$2.balance / 100)),
        ];

        final allY = [
          ...actualSpots.map((s) => s.y),
          ...projSpots.map((s) => s.y),
        ];
        final minY = allY.reduce((a, b) => a < b ? a : b);
        final maxY = allY.reduce((a, b) => a > b ? a : b);
        final pad = ((maxY - minY) * 0.15).clamp(1.0, double.infinity);

        final projEndPositive = proj.projectedBalance >= 0;

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
                  titlesData: const FlTitlesData(
                    leftTitles: AxisTitles(),
                    rightTitles: AxisTitles(),
                    topTitles: AxisTitles(),
                    bottomTitles: AxisTitles(),
                  ),
                  lineTouchData: LineTouchData(
                    touchTooltipData: LineTouchTooltipData(
                      getTooltipColor: (_) => t.surface,
                      getTooltipItems: (spots) => spots.map((s) {
                        final label =
                            s.barIndex == 0 ? 'Real' : 'Projetado';
                        return LineTooltipItem(
                          '$label\n${fmt.formatCurrency((s.y * 100).toInt())}',
                          AppTextStyles.bodySm(t.txtPrimary)
                              .copyWith(fontWeight: FontWeight.w600),
                        );
                      }).toList(),
                    ),
                  ),
                  lineBarsData: [
                    // Actual line
                    LineChartBarData(
                      spots: actualSpots,
                      isCurved: true,
                      color: t.accent,
                      barWidth: 2.5,
                      dotData: const FlDotData(show: false),
                      belowBarData: BarAreaData(
                        show: true,
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            t.accent.withValues(alpha: 0.15),
                            t.accent.withValues(alpha: 0.0),
                          ],
                        ),
                      ),
                    ),
                    // Projected line (dashed)
                    LineChartBarData(
                      spots: projSpots,
                      isCurved: true,
                      color: projEndPositive ? t.moss : t.clay,
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
              _SummaryRow(
                label: 'Saldo atual',
                cents: proj.currentBalance,
              ),
              const SizedBox(height: 6),
              _SummaryRow(
                label: 'Projeção fim do mês',
                cents: proj.projectedBalance,
                color: projEndPositive ? t.moss : t.clay,
              ),
              const SizedBox(height: 6),
              _SummaryRow(
                label: 'Média diária de receitas',
                cents: proj.dailyAvgIncome.toInt(),
                color: t.moss,
              ),
              const SizedBox(height: 6),
              _SummaryRow(
                label: 'Média diária de despesas',
                cents: proj.dailyAvgExpense.toInt(),
                color: t.clay,
              ),
            ],
          ],
        );
      },
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow(
      {required this.label, required this.cents, this.color});

  final String label;
  final int cents;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: AppSpacing.cardPaddingSm,
      decoration: BoxDecoration(
        color: t.surfaceEl,
        borderRadius: AppRadius.smAll,
      ),
      child: Row(
        children: [
          Text(label, style: AppTextStyles.bodySm(t.txtSecondary)),
          const Spacer(),
          Money(cents, size: 14, weight: FontWeight.w700, color: color),
        ],
      ),
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
    child: Center(child: Text('Nenhum dado disponível', style: AppTextStyles.bodySm(t.txtTertiary))));
