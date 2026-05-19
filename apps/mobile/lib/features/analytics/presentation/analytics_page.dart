import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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

class AnalyticsPage extends ConsumerWidget {
  const AnalyticsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final configAsync = ref.watch(chartConfigProvider);

    return Scaffold(
      backgroundColor: t.bg,
      appBar: AppBar(
        backgroundColor: t.bg,
        elevation: 0,
        title: Text('Analytics', style: AppTextStyles.h2(t.txtPrimary)),
        actions: [
          IconButton(
            icon: Icon(Icons.tune_rounded, color: t.txtSecondary),
            onPressed: () => _openCustomizeSheet(context, ref),
          ),
        ],
      ),
      body: configAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('Error loading config', style: AppTextStyles.body(t.error)),
        ),
        data: (configs) {
          final history = configs
              .where((c) => c.enabled && !c.chartId.isProjection)
              .toList()
            ..sort((a, b) => a.order.compareTo(b.order));

          final projections = configs
              .where((c) => c.enabled && c.chartId.isProjection)
              .toList()
            ..sort((a, b) => a.order.compareTo(b.order));

          return ListView(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 120),
            children: [
              if (history.isNotEmpty) ...[
                const _SectionHeader(label: 'Historical'),
                const SizedBox(height: 12),
                ...history.map((c) => _ChartCard(config: c)),
              ],
              if (projections.isNotEmpty) ...[
                const SizedBox(height: 8),
                const _SectionHeader(label: 'Projections'),
                const SizedBox(height: 12),
                ...projections.map((c) => _ChartCard(config: c)),
              ],
              if (history.isEmpty && projections.isEmpty)
                _EmptyState(
                    onCustomize: () => _openCustomizeSheet(context, ref)),
              const SizedBox(height: 24),
              _AiPlaceholderCard(),
            ],
          );
        },
      ),
    );
  }

  void _openCustomizeSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CustomizeSheet(),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Text(
      label.toUpperCase(),
      style: AppTextStyles.caption(t.txtTertiary).copyWith(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.2,
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
        color: t.isDark
            ? const Color(0xFF1C1830).withValues(alpha: 0.72)
            : Colors.white.withValues(alpha: 0.9),
        borderRadius: AppRadius.xlAll,
        border: Border.all(
          color: t.isDark
              ? Colors.white.withValues(alpha: 0.07)
              : t.primary.withValues(alpha: 0.10),
        ),
        boxShadow: t.isDark ? [] : AppShadows.cardLight,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(config.chartId.label, style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 4),
          Text(config.chartId.description,
              style: AppTextStyles.bodySm(t.txtTertiary)),
          const SizedBox(height: 20),
          _chartWidget(config.chartId),
        ],
      ),
    );
  }

  Widget _chartWidget(ChartId id) => switch (id) {
        ChartId.incomeExpense => const IncomeExpenseChart(),
        ChartId.expensesByCategory => const ExpensesByCategoryChart(),
        ChartId.netWorthEvolution => const NetWorthChart(),
        ChartId.balanceEvolution => const BalanceEvolutionChart(),
        ChartId.topCategories => const TopCategoriesChart(),
        ChartId.categoryEvolution => const CategoryEvolutionChart(),
        ChartId.budgetPace => const BudgetPaceChart(),
        ChartId.netWorthComposition => const NetWorthCompositionChart(),
        ChartId.futureCommitments => const FutureCommitmentsChart(),
        ChartId.spendingHeatmap => const SpendingHeatmapChart(),
        ChartId.balanceProjection => const BalanceProjectionChart(),
        ChartId.categoryProjection => const CategoryProjectionChart(),
        ChartId.netWorthProjection => const NetWorthProjectionChart(),
        ChartId.commitmentsImpact => const CommitmentsImpactChart(),
      };
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCustomize});
  final VoidCallback onCustomize;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Icon(Icons.bar_chart_rounded, size: 56, color: t.txtDisabled),
          const SizedBox(height: 16),
          Text('No charts selected',
              style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 8),
          Text('Tap Customize to choose which charts to display',
              style: AppTextStyles.bodySm(t.txtTertiary),
              textAlign: TextAlign.center),
          const SizedBox(height: 24),
          SizedBox(
            width: 180,
            child: PrimaryButton(label: 'Customize', onPressed: onCustomize),
          ),
        ],
      ),
    );
  }
}

class _AiPlaceholderCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: AppSpacing.cardPadding,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            t.primary.withValues(alpha: 0.15),
            t.primary.withValues(alpha: 0.05),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: AppRadius.xlAll,
        border: Border.all(color: t.primary.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: t.primary.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.auto_awesome_rounded, color: t.primary, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text('AI Analysis',
                        style: AppTextStyles.body(t.txtPrimary)
                            .copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: t.primary,
                        borderRadius: AppRadius.pillAll,
                      ),
                      child: Text('Premium',
                          style: AppTextStyles.caption(Colors.white)
                              .copyWith(fontSize: 10, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Get personalized insights powered by AI — coming soon.',
                  style: AppTextStyles.bodySm(t.txtTertiary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Customize bottom sheet ────────────────────────────────────────────────────

class _CustomizeSheet extends ConsumerStatefulWidget {
  const _CustomizeSheet();

  @override
  ConsumerState<_CustomizeSheet> createState() => _CustomizeSheetState();
}

class _CustomizeSheetState extends ConsumerState<_CustomizeSheet> {
  late List<ChartConfig> _configs;

  @override
  void initState() {
    super.initState();
    _configs = [...(ref.read(chartConfigProvider).valueOrNull ??
        ChartConfig.defaultConfigs())];
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bg = t.isDark ? const Color(0xFF1A1730) : Colors.white;

    final historical = _configs.where((c) => !c.chartId.isProjection).toList()
      ..sort((a, b) => a.order.compareTo(b.order));
    final projections = _configs.where((c) => c.chartId.isProjection).toList()
      ..sort((a, b) => a.order.compareTo(b.order));

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
          bottom: MediaQuery.viewInsetsOf(context).bottom + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: t.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Row(
              children: [
                Text('Customize Charts',
                    style: AppTextStyles.h2(t.txtPrimary)),
                const Spacer(),
                TextButton(
                  onPressed: _save,
                  child: Text('Done',
                      style: AppTextStyles.body(t.primary)
                          .copyWith(fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _SheetSectionLabel(label: 'Historical'),
                  const SizedBox(height: 8),
                  ReorderableListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: historical.length,
                    onReorder: (oldIndex, newIndex) =>
                        _reorder(historical, oldIndex, newIndex),
                    itemBuilder: (_, i) => _ChartToggleRow(
                      key: ValueKey(historical[i].chartId),
                      config: historical[i],
                      onToggle: () => _toggle(historical[i].chartId),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const _SheetSectionLabel(label: 'Projections'),
                  const SizedBox(height: 8),
                  ReorderableListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: projections.length,
                    onReorder: (oldIndex, newIndex) =>
                        _reorder(projections, oldIndex, newIndex),
                    itemBuilder: (_, i) => _ChartToggleRow(
                      key: ValueKey(projections[i].chartId),
                      config: projections[i],
                      onToggle: () => _toggle(projections[i].chartId),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _toggle(ChartId id) {
    setState(() {
      _configs = _configs
          .map((c) => c.chartId == id ? c.copyWith(enabled: !c.enabled) : c)
          .toList();
    });
  }

  void _reorder(List<ChartConfig> section, int oldIndex, int newIndex) {
    if (newIndex > oldIndex) newIndex--;
    setState(() {
      final item = section.removeAt(oldIndex);
      section.insert(newIndex, item);
      // Reindex order within the merged list
      final others =
          _configs.where((c) => !section.map((s) => s.chartId).contains(c.chartId)).toList();
      final merged = [...section, ...others];
      _configs = merged.indexed
          .map((e) => e.$2.copyWith(order: e.$1))
          .toList();
    });
  }

  void _save() {
    ref.read(chartConfigProvider.notifier).save(_configs);
    Navigator.of(context).pop();
  }
}

class _SheetSectionLabel extends StatelessWidget {
  const _SheetSectionLabel({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Text(
      label.toUpperCase(),
      style: AppTextStyles.caption(t.txtTertiary).copyWith(
        fontSize: 10,
        fontWeight: FontWeight.w700,
        letterSpacing: 1.0,
      ),
    );
  }
}

class _ChartToggleRow extends StatelessWidget {
  const _ChartToggleRow({
    super.key,
    required this.config,
    required this.onToggle,
  });

  final ChartConfig config;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: t.isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.black.withValues(alpha: 0.03),
        borderRadius: AppRadius.baseAll,
      ),
      child: Row(
        children: [
          Icon(Icons.drag_handle_rounded, color: t.txtDisabled, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(config.chartId.label,
                    style: AppTextStyles.body(t.txtPrimary)
                        .copyWith(fontWeight: FontWeight.w500, fontSize: 14)),
                Text(config.chartId.description,
                    style: AppTextStyles.bodySm(t.txtTertiary)
                        .copyWith(fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Switch.adaptive(
            value: config.enabled,
            onChanged: (_) => onToggle(),
            activeThumbColor: t.primary,
            activeTrackColor: t.primary.withValues(alpha: 0.4),
          ),
        ],
      ),
    );
  }
}
