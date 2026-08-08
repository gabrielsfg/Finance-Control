import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/budget_models.dart';
import '../providers/budget_provider.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class BudgetsPage extends ConsumerWidget {
  const BudgetsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final budgetAsync = ref.watch(budgetNotifierProvider);

    return budgetAsync.when(
      loading: () => const _LoadingView(),
      error: (e, _) => _ErrorView(
        onRetry: () => ref.read(budgetNotifierProvider.notifier).refresh(),
      ),
      data: (budget) =>
          budget == null ? const _EmptyState() : _BudgetView(budget: budget),
    );
  }
}

// ── Loading ──────────────────────────────────────────────────────────────────

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return AppBackground(
      scrollable: false,
      child: Center(child: CircularProgressIndicator(color: t.primary)),
    );
  }
}

// ── Error ────────────────────────────────────────────────────────────────────

class _ErrorView extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorView({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return AppBackground(
      scrollable: false,
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Falha ao carregar o orçamento',
                style: AppTextStyles.body(t.txtSecondary)),
            const SizedBox(height: 16),
            PrimaryButton(label: 'Tentar novamente', onPressed: onRetry),
          ],
        ),
      ),
    );
  }
}

// ── Empty State ─────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return AppBackground(
      scrollable: false,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: PageHeader(title: 'Orçamento'),
            ),
            Expanded(
              child: Center(
                child: Padding(
                  padding: AppSpacing.screenPadding,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.primary.withValues(alpha: 0.1),
                        ),
                        child: Center(
                          child: Icon(LucideIcons.barChart3,
                              size: 44, color: t.primary),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Nenhum orçamento ainda',
                        style: AppTextStyles.h2(t.txtPrimary).copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Crie seu primeiro orçamento para\nacompanhar seus gastos por categoria.',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtSecondary).copyWith(
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 32),
                      PrimaryButton(
                        label: 'Criar orçamento',
                        icon: const Text('+',
                            style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                height: 1)),
                        onPressed: () =>
                            context.push('/budgets/create/step1'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SizedBox(height: bottomPad + 76 + 24),
          ],
        ),
      ),
    );
  }
}

// ── Budget View ─────────────────────────────────────────────────────────────

class _BudgetView extends StatelessWidget {
  final Budget budget;

  const _BudgetView({required this.budget});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;
    final hasOther = budget.otherTransactions.isNotEmpty;

    return AppBackground(
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
                title: 'Orçamento',
                trailing: HeaderActionButton(
                  icon: LucideIcons.pencil,
                  onTap: () => context.push('/budgets/edit', extra: budget),
                ),
              ),
              const SizedBox(height: 14),
              _PeriodNav(budget: budget),
              const SizedBox(height: 16),
              _OverviewCard(budget: budget),
              const SizedBox(height: 20),
              Text(
                'Áreas',
                style: AppTextStyles.h3(t.txtPrimary).copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 10),
              ...budget.areas.map((area) => _AreaCard(area: area)),
              if (hasOther) ...[
                const SizedBox(height: 4),
                _OtherExpensesCard(
                    transactions: budget.otherTransactions),
              ],
              SizedBox(height: bottomPad + 76 + 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Period navigation ─────────────────────────────────────────────────────────

class _PeriodNav extends ConsumerWidget {
  const _PeriodNav({required this.budget});

  final Budget budget;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final monthly = budget.recurrence == 'Monthly';
    final raw = monthly
        ? fmt.formatMonthYear(budget.startDate)
        : '${fmt.formatDate(budget.startDate)} – ${fmt.formatDate(budget.endDate)}';
    final label = raw.isEmpty ? raw : raw[0].toUpperCase() + raw.substring(1);

    return Row(
      children: [
        _NavArrow(
          icon: LucideIcons.chevronLeft,
          onTap: () =>
              ref.read(budgetNotifierProvider.notifier).previousPeriod(),
        ),
        Expanded(
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: AppTextStyles.body(t.txtPrimary)
                .copyWith(fontWeight: FontWeight.w600),
          ),
        ),
        _NavArrow(
          icon: LucideIcons.chevronRight,
          onTap: () => ref.read(budgetNotifierProvider.notifier).nextPeriod(),
        ),
      ],
    );
  }
}

class _NavArrow extends StatelessWidget {
  const _NavArrow({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.baseAll,
          border: Border.all(color: t.mist),
        ),
        child: Icon(icon, size: 18, color: t.txtSecondary),
      ),
    );
  }
}

// ── Overview Card ────────────────────────────────────────────────────────────

class _OverviewCard extends StatelessWidget {
  final Budget budget;

  const _OverviewCard({required this.budget});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final period =
        '${fmt.formatDate(budget.startDate)} – ${fmt.formatDate(budget.endDate)}';
    final balance = budget.actualIncomeCents - budget.actualExpenseCents;

    return HeroPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header row ──────────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ORÇAMENTO ATIVO',
                      style: AppTextStyles.eyebrow(t.panelMuted),
                    ),
                    const SizedBox(height: 4),
                    Text(budget.name, style: AppTextStyles.h3(t.panelText)),
                    const SizedBox(height: 2),
                    Text(
                      period,
                      style: AppTextStyles.bodySm(t.panelMuted)
                          .copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ),
              TonalTag(recurrenceLabelPt(budget.recurrence), color: t.accent),
            ],
          ),
          const SizedBox(height: 16),

          // ── 2×2 stats grid ───────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: _OverviewStat(
                  label: 'Receita prevista',
                  cents: budget.expectedIncomeCents,
                  color: t.mossLift,
                  labelColor: t.panelMuted,
                ),
              ),
              Expanded(
                child: _OverviewStat(
                  label: 'Despesa prevista',
                  cents: budget.expectedExpenseCents,
                  color: t.clayLift,
                  labelColor: t.panelMuted,
                  align: TextAlign.end,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _OverviewStat(
                  label: 'Recebido',
                  cents: budget.actualIncomeCents,
                  color: t.mossLift,
                  labelColor: t.panelMuted,
                ),
              ),
              Expanded(
                child: _OverviewStat(
                  label: 'Gasto',
                  cents: budget.actualExpenseCents,
                  color: t.clayLift,
                  labelColor: t.panelMuted,
                  align: TextAlign.end,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            height: 1,
            color: Colors.white.withValues(alpha: 0.12),
          ),
          const SizedBox(height: 10),

          // ── Balance row ──────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${budget.areas.length} ${budget.areas.length == 1 ? 'área' : 'áreas'}',
                style: AppTextStyles.bodySm(t.panelMuted)
                    .copyWith(fontSize: 11),
              ),
              Row(
                children: [
                  Text(
                    balance >= 0 ? 'Saldo  ' : 'Déficit  ',
                    style: AppTextStyles.bodySm(t.panelMuted)
                        .copyWith(fontSize: 11),
                  ),
                  Money(
                    balance.abs(),
                    size: 12,
                    weight: FontWeight.w700,
                    color: balance >= 0 ? t.mossLift : t.clayLift,
                    animate: true,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _OverviewStat extends StatelessWidget {
  final String label;
  final int cents;
  final Color color;
  final Color? labelColor;
  final TextAlign align;

  const _OverviewStat({
    required this.label,
    required this.cents,
    required this.color,
    this.labelColor,
    this.align = TextAlign.start,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final crossAxis = align == TextAlign.end
        ? CrossAxisAlignment.end
        : CrossAxisAlignment.start;
    // Direction is carried by the moss/clay color + the label — no +/− sign.
    return Column(
      crossAxisAlignment: crossAxis,
      children: [
        Text(
          label,
          style: AppTextStyles.caption(labelColor ?? t.txtTertiary)
              .copyWith(fontSize: 10),
        ),
        const SizedBox(height: 2),
        Money(cents,
            size: 13,
            weight: FontWeight.w700,
            color: color,
            animate: true),
      ],
    );
  }
}

// ── Area Card ────────────────────────────────────────────────────────────────

class _AreaCard extends StatefulWidget {
  final BudgetArea area;

  const _AreaCard({required this.area});

  @override
  State<_AreaCard> createState() => _AreaCardState();
}

class _AreaCardState extends State<_AreaCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final area = widget.area;
    final percentStr = '${(area.spentPercent * 100).round()}%';
    final isIncome = area.isIncome;
    final actionLabel = isIncome ? 'recebido' : 'gasto';
    final statusColor = area.spentPercent >= 1.0
        ? t.error
        : area.spentPercent >= 0.8
            ? t.warning
            : t.accent;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            area.name,
                            style: AppTextStyles.body(t.txtPrimary).copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        Text(
                          percentStr,
                          style: AppTextStyles.body(statusColor).copyWith(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        AnimatedRotation(
                          turns: _expanded ? 0.5 : 0.0,
                          duration: const Duration(milliseconds: 200),
                          child: Text(
                            '▾',
                            style: TextStyle(
                                fontSize: 20,
                                color: t.txtTertiary,
                                height: 1),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    AppProgressBar(percent: area.spentPercent),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Money(
                          area.spentCents,
                          size: 11,
                          weight: FontWeight.w600,
                          color: statusColor,
                        ),
                        Text(
                          '/',
                          style: AppTextStyles.mono(t.txtTertiary,
                              fontSize: 11),
                        ),
                        Money(area.allocatedCents,
                            size: 11, color: t.txtTertiary),
                        Text(
                          ' $actionLabel',
                          style: AppTextStyles.bodySm(t.txtTertiary)
                              .copyWith(fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded) ...[
              Divider(
                height: 1,
                thickness: 1,
                color: t.divider
                    .withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
              // Flatten all subcategories from all categories in this area
              ...() {
                final allSubs = area.categories
                    .expand((c) => c.subcategories)
                    .toList();
                return allSubs.asMap().entries.map((entry) {
                  final isLast = entry.key == allSubs.length - 1;
                  return _SubcategoryRow(
                    sub: entry.value,
                    showDivider: !isLast,
                  );
                });
              }(),
              const SizedBox(height: 6),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Subcategory Row ──────────────────────────────────────────────────────────

class _SubcategoryRow extends StatelessWidget {
  final BudgetSubcategory sub;
  final bool showDivider;

  const _SubcategoryRow({required this.sub, this.showDivider = true});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final isOver = sub.spentCents > sub.allocatedCents;
    final accentColor = sub.isExpense ? t.error : t.success;
    final actionLabel = sub.isExpense ? 'gasto' : 'recebido';

    return Column(
      children: [
        Padding(
          padding:
              const EdgeInsets.only(left: 16, right: 16, top: 10, bottom: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Name + over indicator ──────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: Text(
                      sub.name,
                      style: AppTextStyles.bodySm(t.txtSecondary).copyWith(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  if (isOver)
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Money(
                          sub.spentCents - sub.allocatedCents,
                          size: 10,
                          color: t.error,
                        ),
                        Text(
                          ' acima',
                          style: AppTextStyles.caption(t.error)
                              .copyWith(fontSize: 10),
                        ),
                      ],
                    ),
                ],
              ),
              const SizedBox(height: 4),
              // ── spent / allocated values ───────────────────────────────
              Row(
                children: [
                  Money(
                    sub.spentCents,
                    size: 11,
                    weight: FontWeight.w600,
                    color: isOver ? t.error : accentColor,
                  ),
                  Text(
                    '/',
                    style: AppTextStyles.mono(t.txtTertiary, fontSize: 11),
                  ),
                  Money(sub.allocatedCents, size: 11, color: t.txtTertiary),
                  Text(
                    ' $actionLabel',
                    style: AppTextStyles.bodySm(t.txtTertiary)
                        .copyWith(fontSize: 11),
                  ),
                ],
              ),
              const SizedBox(height: 5),
              // ── Progress bar ───────────────────────────────────────────
              AppProgressBar(percent: sub.spentPercent),
            ],
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            thickness: 1,
            indent: 16,
            endIndent: 16,
            color:
                t.divider.withValues(alpha: t.isDark ? 0.2 : 0.35),
          ),
      ],
    );
  }
}

// ── Other Expenses Card ───────────────────────────────────────────────────────

class _OtherExpensesCard extends StatefulWidget {
  final List<UnallocatedTransaction> transactions;

  const _OtherExpensesCard({required this.transactions});

  @override
  State<_OtherExpensesCard> createState() => _OtherExpensesCardState();
}

class _OtherExpensesCardState extends State<_OtherExpensesCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    // Aggregate by subcategory name for a cleaner display
    final Map<String, int> aggregated = {};
    final Map<String, String> typeByName = {};
    for (final tx in widget.transactions) {
      aggregated[tx.subCategoryName] =
          (aggregated[tx.subCategoryName] ?? 0) + tx.valueCents;
      typeByName[tx.subCategoryName] = tx.type;
    }

    final totalExpense = widget.transactions
        .where((t) => t.isExpense)
        .fold(0, (sum, t) => sum + t.valueCents);
    final totalIncome = widget.transactions
        .where((t) => !t.isExpense)
        .fold(0, (sum, t) => sum + t.valueCents);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Outras transações',
                            style: AppTextStyles.body(t.txtPrimary).copyWith(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                            ),
                          ),
                        ),
                        AnimatedRotation(
                          turns: _expanded ? 0.5 : 0.0,
                          duration: const Duration(milliseconds: 200),
                          child: Text('▾',
                              style: TextStyle(
                                  fontSize: 20,
                                  color: t.txtTertiary,
                                  height: 1)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (totalExpense > 0) ...[
                          Money(totalExpense, size: 11, color: t.error),
                          Text(' gasto',
                              style: AppTextStyles.bodySm(t.error)
                                  .copyWith(fontSize: 11)),
                        ],
                        if (totalExpense > 0 && totalIncome > 0)
                          Text('  ·  ',
                              style: AppTextStyles.bodySm(t.txtTertiary)
                                  .copyWith(fontSize: 11)),
                        if (totalIncome > 0) ...[
                          Money(totalIncome, size: 11, color: t.success),
                          Text(' recebido',
                              style: AppTextStyles.bodySm(t.success)
                                  .copyWith(fontSize: 11)),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded) ...[
              Divider(
                height: 1,
                thickness: 1,
                color: t.divider
                    .withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
              ...aggregated.entries.toList().asMap().entries.map((entry) {
                final isLast = entry.key == aggregated.length - 1;
                final name = entry.value.key;
                final cents = entry.value.value;
                final isExpense = typeByName[name] == 'Expense';
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 11),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              name,
                              style:
                                  AppTextStyles.bodySm(t.txtSecondary)
                                      .copyWith(fontSize: 13),
                            ),
                          ),
                          Money(
                            cents,
                            size: 13,
                            weight: FontWeight.w600,
                            color: isExpense ? t.error : t.success,
                          ),
                        ],
                      ),
                    ),
                    if (!isLast)
                      Divider(
                        height: 1,
                        thickness: 1,
                        indent: 16,
                        endIndent: 16,
                        color: t.divider
                            .withValues(alpha: t.isDark ? 0.2 : 0.35),
                      ),
                  ],
                );
              }),
              const SizedBox(height: 4),
            ],
          ],
        ),
      ),
    );
  }
}
