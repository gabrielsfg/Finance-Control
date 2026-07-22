import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/market_models.dart';
import '../providers/market_provider.dart';

class MarketAssetPage extends ConsumerWidget {
  const MarketAssetPage({super.key, required this.ticker});

  final String ticker;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(marketAssetProvider(ticker));
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: async.when(
              loading: () => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  PageHeader(
                    title: ticker,
                    showBack: true,
                    onBack: () => context.pop(),
                  ),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 120),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                ],
              ),
              error: (e, _) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 8),
                  PageHeader(
                    title: ticker,
                    showBack: true,
                    onBack: () => context.pop(),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 80),
                    child: Center(
                      child: Text('Não foi possível carregar o ativo',
                          style: AppTextStyles.bodySm(t.txtTertiary)),
                    ),
                  ),
                ],
              ),
              data: (asset) {
                final pct = asset.dayChangePct ?? 0;
                final up = pct >= 0;
                final pctColor = up ? t.moss : t.clay;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),
                    PageHeader(
                      eyebrow: asset.assetClass.toUpperCase(),
                      title: asset.ticker,
                      showBack: true,
                      onBack: () => context.pop(),
                    ),
                    const SizedBox(height: 6),
                    Text(asset.displayName,
                        style: AppTextStyles.body(t.txtSecondary)),
                    const SizedBox(height: 20),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Money(asset.currentPrice,
                            size: 34, weight: FontWeight.w600),
                        const SizedBox(width: 12),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                  up
                                      ? LucideIcons.trendingUp
                                      : LucideIcons.trendingDown,
                                  size: 16,
                                  color: pctColor),
                              const SizedBox(width: 4),
                              Text(
                                '${up ? '+' : '−'}${pct.abs().toStringAsFixed(2)}%',
                                style: AppTextStyles.mono(pctColor, fontSize: 14)
                                    .copyWith(fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _PriceChart(history: asset.priceHistory),
                    const SizedBox(height: 24),
                    _InfoRows(asset: asset),
                    SizedBox(height: bottomPad + 24),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}

// ── Price chart ──────────────────────────────────────────────────────────────

class _PriceChart extends StatelessWidget {
  const _PriceChart({required this.history});

  final List<MarketPricePoint> history;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    if (history.length < 2) {
      return SizedBox(
        height: 80,
        child: Center(
          child: Text('Sem histórico de preços disponível',
              style: AppTextStyles.bodySm(t.txtTertiary)),
        ),
      );
    }

    final fmt = AppLocaleScope.of(context);
    final spots = history.indexed
        .map((e) => FlSpot(e.$1.toDouble(), e.$2.priceCents / 100))
        .toList();
    final minY = spots.map((s) => s.y).reduce((a, b) => a < b ? a : b);
    final maxY = spots.map((s) => s.y).reduce((a, b) => a > b ? a : b);
    final pad = ((maxY - minY) * 0.15).clamp(0.01, double.infinity);
    final rising = history.last.priceCents >= history.first.priceCents;
    final color = rising ? t.moss : t.clay;

    return SizedBox(
      height: 220,
      child: LineChart(
        LineChartData(
          minY: minY - pad,
          maxY: maxY + pad,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (_) => FlLine(
                color: t.divider.withValues(alpha: 0.5), strokeWidth: 1),
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
              getTooltipItems: (touched) => touched.map((s) {
                final point = history[s.x.toInt()];
                final d = point.date;
                return LineTooltipItem(
                  '${d.day}/${d.month}/${d.year}\n${fmt.formatCurrency(point.priceCents)}',
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
      ),
    );
  }
}

// ── Info rows ────────────────────────────────────────────────────────────────

class _InfoRows extends StatelessWidget {
  const _InfoRows({required this.asset});

  final MarketAssetDetail asset;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);

    final rows = <(String, String)>[
      ('Tipo', asset.assetClass),
      ('Moeda', asset.currency),
      if (asset.previousClose != null)
        ('Fechamento anterior', fmt.formatCurrency(asset.previousClose!)),
      if (asset.lastPriceUpdate != null)
        (
          'Atualizado em',
          '${asset.lastPriceUpdate!.day}/${asset.lastPriceUpdate!.month}/${asset.lastPriceUpdate!.year}'
        ),
    ];

    return Container(
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: AppRadius.xlAll,
        border: Border.all(color: t.mist),
      ),
      child: Column(
        children: List.generate(rows.length, (i) {
          final (label, value) = rows[i];
          final isLast = i == rows.length - 1;
          return Column(
            children: [
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(label,
                          style: AppTextStyles.bodySm(t.txtSecondary)),
                    ),
                    Text(value,
                        style: AppTextStyles.body(t.txtPrimary)
                            .copyWith(fontWeight: FontWeight.w600, fontSize: 14)),
                  ],
                ),
              ),
              if (!isLast)
                Divider(
                  height: 1,
                  indent: 16,
                  endIndent: 16,
                  color: t.divider.withValues(alpha: 0.4),
                ),
            ],
          );
        }),
      ),
    );
  }
}
