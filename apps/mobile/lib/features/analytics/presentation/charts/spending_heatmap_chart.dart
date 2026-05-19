import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../../../core/utils/app_locale.dart';
import '../../providers/analytics_provider.dart';

class SpendingHeatmapChart extends ConsumerWidget {
  const SpendingHeatmapChart({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(spendingHeatmapProvider);

    return async.when(
      loading: () => SizedBox(
        height: compact ? 160 : 220,
        child: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => SizedBox(
        height: 80,
        child: Center(
            child: Text('Could not load data',
                style: AppTextStyles.bodySm(t.txtTertiary))),
      ),
      data: (items) {
        if (items.isEmpty) {
          return SizedBox(
            height: 80,
            child: Center(
                child: Text('No spending data for this period',
                    style: AppTextStyles.bodySm(t.txtTertiary))),
          );
        }

        final fmt = AppLocaleScope.of(context);
        final maxTotal = items.map((e) => e.total).reduce((a, b) => a > b ? a : b);
        final byDate = {for (final i in items) i.date: i.total};

        // Build a calendar grid — group by month
        final months = <DateTime, List<DateTime>>{};
        for (final item in items) {
          final key = DateTime(item.date.year, item.date.month);
          months.putIfAbsent(key, () => []).add(item.date);
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: months.entries.map((entry) {
            return _MonthGrid(
              month: entry.key,
              spending: byDate,
              maxTotal: maxTotal,
              baseColor: t.primary,
              t: t,
              fmt: fmt,
              compact: compact,
            );
          }).toList(),
        );
      },
    );
  }
}

class _MonthGrid extends StatelessWidget {
  const _MonthGrid({
    required this.month,
    required this.spending,
    required this.maxTotal,
    required this.baseColor,
    required this.t,
    required this.fmt,
    required this.compact,
  });

  final DateTime month;
  final Map<DateTime, int> spending;
  final int maxTotal;
  final Color baseColor;
  final AppThemeTokens t;
  final dynamic fmt;
  final bool compact;

  static const _dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  static const _monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateTime(month.year, month.month + 1, 0).day;
    // weekday: 1=Mon, 7=Sun
    final firstWeekday = DateTime(month.year, month.month, 1).weekday;
    final cellSize = compact ? 28.0 : 36.0;
    const gap = 3.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Text(
            '${_monthNames[month.month - 1]} ${month.year}',
            style: AppTextStyles.bodySm(t.txtSecondary)
                .copyWith(fontWeight: FontWeight.w600),
          ),
        ),
        // Day labels row
        Row(
          children: _dayLabels
              .map((d) => SizedBox(
                    width: cellSize,
                    child: Text(d,
                        textAlign: TextAlign.center,
                        style: AppTextStyles.caption(t.txtTertiary)
                            .copyWith(fontSize: 8)),
                  ))
              .toList(),
        ),
        const SizedBox(height: 4),
        // Calendar cells
        Wrap(
          spacing: gap,
          runSpacing: gap,
          children: [
            // Empty cells before first day
            ...List.generate(firstWeekday - 1,
                (_) => SizedBox(width: cellSize, height: cellSize)),
            // Day cells
            ...List.generate(daysInMonth, (i) {
              final date = DateTime(month.year, month.month, i + 1);
              final total = spending[date] ?? 0;
              final intensity =
                  maxTotal > 0 ? (total / maxTotal).clamp(0.0, 1.0) : 0.0;
              final cellColor = total == 0
                  ? (t.isDark
                      ? Colors.white.withValues(alpha: 0.05)
                      : Colors.black.withValues(alpha: 0.04))
                  : baseColor.withValues(alpha: 0.15 + intensity * 0.75);

              return Tooltip(
                message: total > 0
                    ? '${date.day}/${date.month}: ${fmt.formatCurrency(total)}'
                    : '${date.day}/${date.month}: No spending',
                child: Container(
                  width: cellSize,
                  height: cellSize,
                  decoration: BoxDecoration(
                    color: cellColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: compact
                      ? null
                      : Center(
                          child: Text(
                            '${i + 1}',
                            style: AppTextStyles.caption(
                              total > 0 ? Colors.white : t.txtDisabled,
                            ).copyWith(fontSize: 9),
                          ),
                        ),
                ),
              );
            }),
          ],
        ),
        const SizedBox(height: 16),
      ],
    );
  }
}
