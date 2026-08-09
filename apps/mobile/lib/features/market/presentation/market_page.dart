import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/market_models.dart';
import '../providers/market_provider.dart';

class MarketPage extends ConsumerWidget {
  const MarketPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(marketDashboardProvider);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                PageHeader(
                  eyebrow: 'MERCADO',
                  title: 'Cotações',
                  showBack: true,
                  onBack: () => context.pop(),
                ),
                const SizedBox(height: 18),
                async.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 120),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (e, _) => _Error(
                    onRetry: () =>
                        ref.read(marketDashboardProvider.notifier).refresh(),
                  ),
                  data: (d) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (d.macro.isNotEmpty) ...[
                        _MacroRow(indicators: d.macro),
                        const SizedBox(height: 24),
                      ],
                      _RankingSection(
                        title: 'Maiores altas',
                        assets: d.topGainers,
                        mode: _RankingMode.change,
                      ),
                      const SizedBox(height: 22),
                      _RankingSection(
                        title: 'Maiores quedas',
                        assets: d.topLosers,
                        mode: _RankingMode.change,
                      ),
                      const SizedBox(height: 22),
                      _RankingSection(
                        title: 'Maiores dividendos',
                        assets: d.topDividends,
                        mode: _RankingMode.dividend,
                      ),
                      SizedBox(height: bottomPad + 24),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Macro indicators ─────────────────────────────────────────────────────────

class _MacroRow extends StatelessWidget {
  const _MacroRow({required this.indicators});

  final List<MacroIndicator> indicators;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      clipBehavior: Clip.none,
      child: Row(
        children: indicators.map((m) => _MacroTile(indicator: m)).toList(),
      ),
    );
  }
}

class _MacroTile extends StatelessWidget {
  const _MacroTile({required this.indicator});

  final MacroIndicator indicator;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final unit = indicator.unit ?? '';
    final value = indicator.value == null
        ? '—'
        : '${indicator.value!.toStringAsFixed(2)}$unit';

    return Container(
      margin: const EdgeInsets.only(right: 10),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.mist),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(indicator.name.toUpperCase(),
              style: AppTextStyles.eyebrow(t.txtTertiary, fontSize: 10)),
          const SizedBox(height: 6),
          Text(value,
              style: AppTextStyles.mono(t.txtPrimary, fontSize: 16)
                  .copyWith(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

// ── Ranking section ──────────────────────────────────────────────────────────

enum _RankingMode { change, dividend }

class _RankingSection extends StatelessWidget {
  const _RankingSection({
    required this.title,
    required this.assets,
    required this.mode,
  });

  final String title;
  final List<MarketAsset> assets;
  final _RankingMode mode;

  @override
  Widget build(BuildContext context) {
    if (assets.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          child: Row(
            children: assets
                .map((a) => _AssetCard(asset: a, mode: mode))
                .toList(),
          ),
        ),
      ],
    );
  }
}

class _AssetCard extends StatelessWidget {
  const _AssetCard({required this.asset, required this.mode});

  final MarketAsset asset;
  final _RankingMode mode;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    Widget metric;
    if (mode == _RankingMode.dividend) {
      final dy = asset.dividendYield ?? 0;
      metric = Text('DY ${dy.toStringAsFixed(2)}%',
          style: AppTextStyles.mono(t.moss, fontSize: 12)
              .copyWith(fontWeight: FontWeight.w700));
    } else {
      final pct = asset.dayChangePct ?? 0;
      final up = pct >= 0;
      final color = up ? t.moss : t.clay;
      metric = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(up ? LucideIcons.trendingUp : LucideIcons.trendingDown,
              size: 13, color: color),
          const SizedBox(width: 4),
          Text('${up ? '+' : '−'}${pct.abs().toStringAsFixed(2)}%',
              style: AppTextStyles.mono(color, fontSize: 12)
                  .copyWith(fontWeight: FontWeight.w700)),
        ],
      );
    }

    return GestureDetector(
      onTap: () => context.push('/market/${asset.ticker}'),
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.cardAll,
          border: Border.all(color: t.mist),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(asset.ticker,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.body(t.txtPrimary)
                    .copyWith(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 2),
            Text(asset.displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTextStyles.bodySm(t.txtTertiary).copyWith(fontSize: 11)),
            const SizedBox(height: 14),
            Money(asset.currentPrice, size: 16, weight: FontWeight.w600),
            const SizedBox(height: 6),
            metric,
          ],
        ),
      ),
    );
  }
}

class _Error extends StatelessWidget {
  const _Error({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 80),
      child: Column(
        children: [
          Icon(LucideIcons.wifiOff, size: 44, color: t.txtTertiary),
          const SizedBox(height: 14),
          Text('Não foi possível carregar o mercado',
              style: AppTextStyles.h3(t.txtPrimary), textAlign: TextAlign.center),
          const SizedBox(height: 20),
          SizedBox(
            width: 170,
            child: PrimaryButton(label: 'Tentar de novo', onPressed: onRetry),
          ),
        ],
      ),
    );
  }
}
