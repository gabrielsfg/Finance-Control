import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/color_hex.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/investment_models.dart';
import '../providers/investment_provider.dart';

class InvestmentsPage extends ConsumerWidget {
  const InvestmentsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(portfolioProvider);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      floatingActionButton:
          AppFAB(onTap: () => context.push('/investments/register')),
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                PageHeader(
                  eyebrow: 'CARTEIRA',
                  title: 'Investimentos',
                  showBack: true,
                  onBack: () => context.pop(),
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: async.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Center(
                      child: _Error(
                        onRetry: () =>
                            ref.read(portfolioProvider.notifier).refresh(),
                      ),
                    ),
                    data: (p) {
                      if (p.investments.isEmpty) {
                        return Center(
                          child: _EmptyState(
                            onCreate: () =>
                                context.push('/investments/register'),
                          ),
                        );
                      }
                      return SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _PortfolioHero(portfolio: p),
                            const SizedBox(height: 20),
                            if (p.allocations.isNotEmpty) ...[
                              _AllocationBar(allocations: p.allocations),
                              const SizedBox(height: 24),
                            ],
                            const SectionHeader('Meus ativos'),
                            const SizedBox(height: 6),
                            ...List.generate(
                              p.investments.length,
                              (i) => _HoldingRow(
                                investment: p.investments[i],
                                showDivider: i < p.investments.length - 1,
                              ),
                            ),
                            SizedBox(height: bottomPad + 96),
                          ],
                        ),
                      );
                    },
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

// ── Portfolio hero (KPIs) ────────────────────────────────────────────────────

class _PortfolioHero extends StatelessWidget {
  const _PortfolioHero({required this.portfolio});

  final InvestmentPortfolio portfolio;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final gain = portfolio.totalReturn >= 0;
    final pctColor = gain ? t.mossLift : t.clayLift;

    return HeroPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text('PATRIMÔNIO TOTAL',
                    style: AppTextStyles.eyebrow(t.panelMuted)),
              ),
              _PercentBadge(percent: portfolio.totalReturnPercent, color: pctColor),
            ],
          ),
          const SizedBox(height: 10),
          Money(
            portfolio.currentValue,
            size: 40,
            weight: FontWeight.w600,
            color: t.panelText,
            symbolColor: t.panelMuted,
            symbolScale: 0.36,
            centsScale: 0.46,
          ),
          const SizedBox(height: 20),
          SummaryStatRow(
            stats: [
              SummaryStat(
                label: 'INVESTIDO',
                valueCents: portfolio.totalInvested,
              ),
              SummaryStat(
                label: 'RETORNO',
                valueCents: portfolio.totalReturn,
                valueColor: pctColor,
                signed: true,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PercentBadge extends StatelessWidget {
  const _PercentBadge({required this.percent, required this.color});

  final double percent;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final up = percent >= 0;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(AppRadius.pill),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(up ? LucideIcons.trendingUp : LucideIcons.trendingDown,
              size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            '${percent.abs().toStringAsFixed(1)}%',
            style: AppTextStyles.mono(color, fontSize: 12)
                .copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

// ── Allocation bar ───────────────────────────────────────────────────────────

class _AllocationBar extends StatelessWidget {
  const _AllocationBar({required this.allocations});

  final List<InvestmentAllocation> allocations;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ALOCAÇÃO', style: AppTextStyles.eyebrow(t.txtSecondary)),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppRadius.pill),
          child: Row(
            children: allocations.map((a) {
              final flex = (a.percent * 10).round().clamp(1, 1000);
              return Expanded(
                flex: flex,
                child: Container(
                  height: 12,
                  color: colorFromHex(a.color, fallback: t.accent),
                ),
              );
            }).toList(),
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 14,
          runSpacing: 8,
          children: allocations.map((a) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 9,
                  height: 9,
                  decoration: BoxDecoration(
                    color: colorFromHex(a.color, fallback: t.accent),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '${a.assetClass} ${a.percent.toStringAsFixed(0)}%',
                  style: AppTextStyles.bodySm(t.txtSecondary),
                ),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ── Holding row ──────────────────────────────────────────────────────────────

class _HoldingRow extends StatelessWidget {
  const _HoldingRow({required this.investment, this.showDivider = true});

  final Investment investment;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final gain = investment.totalReturn >= 0;
    final pctColor = gain ? t.moss : t.clay;
    final qty = investment.currentQuantity;
    final qtyLabel = qty == qty.roundToDouble()
        ? qty.toStringAsFixed(0)
        : qty.toStringAsFixed(2);

    return GestureDetector(
      onTap: () => context.push('/market/${investment.ticker}'),
      behavior: HitTestBehavior.opaque,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: t.accent.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(AppRadius.base),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    investment.ticker.isNotEmpty
                        ? investment.ticker.substring(0, 1)
                        : '?',
                    style: AppTextStyles.h3(t.accent),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        investment.ticker,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                            fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$qtyLabel · ${investment.assetClass}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: AppTextStyles.mono(t.txtTertiary, fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Money(investment.currentValue,
                        size: 14, weight: FontWeight.w600),
                    const SizedBox(height: 3),
                    Text(
                      '${gain ? '+' : '−'}${investment.totalReturnPercent.abs().toStringAsFixed(1)}%',
                      style: AppTextStyles.mono(pctColor, fontSize: 11)
                          .copyWith(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (showDivider) Container(height: 1, color: t.mist),
        ],
      ),
    );
  }
}

// ── Empty / error ────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.trendingUp, size: 48, color: t.txtTertiary),
        const SizedBox(height: 16),
        Text('Nenhum investimento ainda',
            style: AppTextStyles.h3(t.txtPrimary)),
        const SizedBox(height: 8),
        Text(
          'Registre sua primeira operação para\nacompanhar sua carteira.',
          textAlign: TextAlign.center,
          style: AppTextStyles.body(t.txtSecondary).copyWith(height: 1.5),
        ),
        const SizedBox(height: 26),
        SizedBox(
          width: 200,
          child: PrimaryButton(
            label: 'Registrar operação',
            onPressed: onCreate,
          ),
        ),
      ],
    );
  }
}

class _Error extends StatelessWidget {
  const _Error({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.wifiOff, size: 44, color: t.txtTertiary),
        const SizedBox(height: 14),
        Text('Não foi possível carregar a carteira',
            style: AppTextStyles.h3(t.txtPrimary), textAlign: TextAlign.center),
        const SizedBox(height: 20),
        SizedBox(
          width: 170,
          child: PrimaryButton(label: 'Tentar de novo', onPressed: onRetry),
        ),
      ],
    );
  }
}
