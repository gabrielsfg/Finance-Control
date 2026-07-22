import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/chart_config.dart';
import '../providers/analytics_provider.dart';
import 'charts/balance_evolution_chart.dart';
import 'charts/balance_projection_chart.dart';
import 'charts/budget_pace_chart.dart';
import 'charts/category_evolution_chart.dart';
import 'charts/category_projection_chart.dart';
import 'charts/commitments_impact_chart.dart';
import 'charts/expenses_by_category_chart.dart';
import 'charts/future_commitments_chart.dart';
import 'charts/income_expense_chart.dart';
import 'charts/net_worth_chart.dart';
import 'charts/net_worth_composition_chart.dart';
import 'charts/net_worth_projection_chart.dart';
import 'charts/spending_heatmap_chart.dart';
import 'charts/top_categories_chart.dart';

/// Compact analytics view shown inside Home — displays the 3 default enabled
/// charts and a "See full analysis" button.
class HomeAnalyticsView extends ConsumerWidget {
  const HomeAnalyticsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final configAsync = ref.watch(chartConfigProvider);

    return configAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 60),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => const SizedBox.shrink(),
      data: (configs) {
        final enabled = configs
            .where((c) => c.enabled)
            .toList()
          ..sort((a, b) => a.order.compareTo(b.order));

        if (enabled.isEmpty) {
          return _EmptySelection(
            onCustomize: () => context.push('/analytics'),
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ...enabled.map((c) => _ChartCard(config: c)),
            const SizedBox(height: 8),
            _SeeFullButton(onTap: () => context.push('/analytics')),
          ],
        );
      },
    );
  }
}

class _EmptySelection extends StatelessWidget {
  const _EmptySelection({required this.onCustomize});
  final VoidCallback onCustomize;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Icon(Icons.bar_chart_rounded, size: 48, color: t.txtDisabled),
          const SizedBox(height: 12),
          Text('Nenhum gráfico selecionado',
              style: AppTextStyles.body(t.txtSecondary)
                  .copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text('Toque em "Ver análise completa" para personalizar seus gráficos',
              style: AppTextStyles.bodySm(t.txtTertiary),
              textAlign: TextAlign.center),
          const SizedBox(height: 20),
          SizedBox(
            width: 200,
            child: PrimaryButton(label: 'Personalizar', onPressed: onCustomize),
          ),
        ],
      ),
    );
  }
}

class _SeeFullButton extends StatelessWidget {
  const _SeeFullButton({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          border: Border.all(color: t.primary.withValues(alpha: 0.4)),
          borderRadius: AppRadius.baseAll,
        ),
        child: Text(
          'Ver análise completa →',
          textAlign: TextAlign.center,
          style: AppTextStyles.body(t.primary)
              .copyWith(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _ChartCard extends ConsumerWidget {
  const _ChartCard({required this.config});
  final ChartConfig config;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: AppSpacing.cardPadding,
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: AppRadius.xlAll,
        border: Border.all(color: t.mist),
        boxShadow: t.isDark ? AppShadows.cardDark : AppShadows.cardLight,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(config.chartId.label, style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 4),
          Text(config.chartId.description,
              style: AppTextStyles.bodySm(t.txtTertiary)),
          const SizedBox(height: 16),
          _chartWidget(config.chartId),
        ],
      ),
    );
  }

  Widget _chartWidget(ChartId id) {
    return switch (id) {
      ChartId.incomeExpense => const IncomeExpenseChart(compact: true),
      ChartId.expensesByCategory => const ExpensesByCategoryChart(compact: true),
      ChartId.netWorthEvolution => const NetWorthChart(compact: true),
      ChartId.balanceEvolution => const BalanceEvolutionChart(compact: true),
      ChartId.topCategories => const TopCategoriesChart(compact: true),
      ChartId.categoryEvolution => const CategoryEvolutionChart(compact: true),
      ChartId.budgetPace => const BudgetPaceChart(compact: true),
      ChartId.netWorthComposition => const NetWorthCompositionChart(compact: true),
      ChartId.futureCommitments => const FutureCommitmentsChart(compact: true),
      ChartId.spendingHeatmap => const SpendingHeatmapChart(compact: true),
      ChartId.balanceProjection => const BalanceProjectionChart(compact: true),
      ChartId.categoryProjection => const CategoryProjectionChart(compact: true),
      ChartId.netWorthProjection => const NetWorthProjectionChart(compact: true),
      ChartId.commitmentsImpact => const CommitmentsImpactChart(compact: true),
    };
  }
}
