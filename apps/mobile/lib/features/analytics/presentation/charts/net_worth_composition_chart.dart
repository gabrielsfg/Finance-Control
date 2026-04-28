import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';

class NetWorthCompositionChart extends ConsumerWidget {
  const NetWorthCompositionChart({super.key, this.compact = false});

  final bool compact;

  static const _palette = [
    Color(0xFF7C3AED),
    Color(0xFF2563EB),
    Color(0xFF059669),
    Color(0xFFD97706),
    Color(0xFFDC2626),
    Color(0xFF0891B2),
    Color(0xFF65A30D),
    Color(0xFFDB2777),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(netWorthEvolutionProvider);

    return async.when(
      loading: () => _loader(compact),
      error: (e, _) => _err(t),
      data: (items) {
        if (items.isEmpty) return _empty(t);

        final fmt = AppLocaleScope.of(context);
        final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Collect all account names in order of appearance
        final accountNames = <String>[];
        for (final item in items) {
          for (final a in item.breakdown) {
            if (!accountNames.contains(a.accountName)) {
              accountNames.add(a.accountName);
            }
          }
        }

        // Build stacked bar groups
        final groups = items.indexed.map((entry) {
          final (i, item) = entry;
          double fromY = 0;
          final rods = accountNames.indexed.map((ae) {
            final (ai, name) = ae;
            final account = item.breakdown
                .where((a) => a.accountName == name)
                .firstOrNull;
            final value = (account?.balance ?? 0) / 100;
            final rod = BarChartRodData(
              fromY: fromY,
              toY: fromY + value.clamp(0, double.infinity),
              color: _palette[ai % _palette.length],
              width: compact ? 16.0 : 22.0,
              borderRadius: ai == 0
                  ? const BorderRadius.vertical(bottom: Radius.circular(4))
                  : BorderRadius.zero,
            );
            fromY += value.clamp(0, double.infinity);
            return rod;
          }).toList();

          return BarChartGroupData(x: i, barRods: rods, groupVertically: true);
        }).toList();

        final maxY = items
            .map((item) => item.breakdown
                .where((a) => a.balance > 0)
                .fold(0, (s, a) => s + a.balance))
            .fold(0, (a, b) => a > b ? a : b)
            .toDouble() / 100;

        return Column(
          children: [
            SizedBox(
              height: compact ? 160 : 220,
              child: BarChart(
                BarChartData(
                  maxY: maxY * 1.15,
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
                        if (rodIndex >= accountNames.length) return null;
                        final value = (rod.toY - rod.fromY) * 100;
                        return BarTooltipItem(
                          '${accountNames[rodIndex]}\n${fmt.formatCurrency(value.toInt())}',
                          AppTextStyles.bodySm(t.txtPrimary)
                              .copyWith(fontWeight: FontWeight.w600),
                        );
                      },
                    ),
                  ),
                ),
              ),
            ),
            if (!compact) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 4,
                children: accountNames.indexed.map((e) {
                  final (i, name) = e;
                  return Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: _palette[i % _palette.length],
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Text(name,
                          style: AppTextStyles.bodySm(t.txtSecondary)
                              .copyWith(fontSize: 11)),
                    ],
                  );
                }).toList(),
              ),
            ],
          ],
        );
      },
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
    child: Center(child: Text('No data for this period', style: AppTextStyles.bodySm(t.txtTertiary))));
