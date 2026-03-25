import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
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
            Text('Failed to load budget',
                style: AppTextStyles.body(t.txtSecondary)),
            const SizedBox(height: 16),
            PrimaryButton(label: 'Retry', onPressed: onRetry),
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
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Text(
                'Budget',
                style: AppTextStyles.h2(t.txtPrimary).copyWith(
                  fontWeight: FontWeight.w700,
                  fontSize: 22,
                ),
                textAlign: TextAlign.center,
              ),
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
                        child: const Center(
                          child: Text('📊', style: TextStyle(fontSize: 44)),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'No budget yet',
                        style: AppTextStyles.h2(t.txtPrimary).copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Create your first budget to track\nyour spending by category.',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtSecondary).copyWith(
                          fontSize: 14,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 32),
                      PrimaryButton(
                        label: 'Create Budget',
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
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Budget',
                      style: AppTextStyles.h2(t.txtPrimary).copyWith(
                        fontWeight: FontWeight.w700,
                        fontSize: 22,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.push(
                      '/budgets/edit',
                      extra: budget,
                    ),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: t.primary.withValues(alpha: 0.1),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.edit_outlined,
                          size: 18,
                          color: t.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: () => context.push('/budgets/create/step1'),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: t.primary.withValues(alpha: 0.1),
                      ),
                      child: Center(
                        child: Text(
                          '+',
                          style: TextStyle(
                            fontSize: 22,
                            color: t.primary,
                            height: 1,
                            fontWeight: FontWeight.w300,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _OverviewCard(budget: budget),
              const SizedBox(height: 20),
              Text(
                'Areas',
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

// ── Overview Card ────────────────────────────────────────────────────────────

class _OverviewCard extends StatelessWidget {
  final Budget budget;

  const _OverviewCard({required this.budget});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final period =
        '${formatDate(budget.startDate)} – ${formatDate(budget.endDate)}';
    final balance = budget.actualIncomeCents - budget.actualExpenseCents;

    return GlassCard(
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
                      'ACTIVE BUDGET',
                      style: AppTextStyles.caption(t.txtTertiary).copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(budget.name, style: AppTextStyles.h3(t.txtPrimary)),
                    const SizedBox(height: 2),
                    Text(
                      period,
                      style: AppTextStyles.bodySm(t.txtTertiary)
                          .copyWith(fontSize: 11),
                    ),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: t.primary.withValues(alpha: t.isDark ? 0.2 : 0.1),
                  borderRadius: AppRadius.fullAll,
                ),
                child: Text(
                  budget.recurrence,
                  style: AppTextStyles.caption(t.primary).copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ── 2×2 stats grid ───────────────────────────────────────────
          Row(
            children: [
              Expanded(
                child: _OverviewStat(
                  label: 'Expected income',
                  value: formatCurrency(budget.expectedIncomeCents),
                  color: t.success.withValues(alpha: 0.7),
                ),
              ),
              Expanded(
                child: _OverviewStat(
                  label: 'Expected expenses',
                  value: '- ${formatCurrency(budget.expectedExpenseCents)}',
                  color: t.error.withValues(alpha: 0.7),
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
                  label: 'Received',
                  value: formatCurrency(budget.actualIncomeCents),
                  color: t.success,
                ),
              ),
              Expanded(
                child: _OverviewStat(
                  label: 'Spent',
                  value: '- ${formatCurrency(budget.actualExpenseCents)}',
                  color: t.error,
                  align: TextAlign.end,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Divider(
            height: 1,
            thickness: 1,
            color: t.divider.withValues(alpha: t.isDark ? 0.25 : 0.4),
          ),
          const SizedBox(height: 10),

          // ── Balance row ──────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${budget.areas.length} area${budget.areas.length == 1 ? '' : 's'}',
                style: AppTextStyles.bodySm(t.txtTertiary)
                    .copyWith(fontSize: 11),
              ),
              Row(
                children: [
                  Text(
                    balance >= 0 ? 'Balance  ' : 'Deficit  ',
                    style: AppTextStyles.bodySm(t.txtTertiary)
                        .copyWith(fontSize: 11),
                  ),
                  Text(
                    '${balance < 0 ? '- ' : ''}${formatCurrency(balance.abs())}',
                    style: AppTextStyles.mono(
                      balance >= 0 ? t.success : t.error,
                      fontSize: 12,
                    ).copyWith(fontWeight: FontWeight.w700),
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
  final String value;
  final Color color;
  final TextAlign align;

  const _OverviewStat({
    required this.label,
    required this.value,
    required this.color,
    this.align = TextAlign.start,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final crossAxis = align == TextAlign.end
        ? CrossAxisAlignment.end
        : CrossAxisAlignment.start;
    return Column(
      crossAxisAlignment: crossAxis,
      children: [
        Text(
          label,
          style: AppTextStyles.caption(t.txtTertiary).copyWith(fontSize: 10),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: AppTextStyles.mono(color, fontSize: 13).copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
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
    final actionLabel = isIncome ? 'received' : 'spent';

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
                          style: AppTextStyles.body(
                            area.spentPercent >= 1.0
                                ? t.error
                                : area.spentPercent >= 0.8
                                    ? t.warning
                                    : t.primary,
                          ).copyWith(
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
                        Text(
                          formatCurrency(area.spentCents),
                          style: AppTextStyles.mono(
                            area.spentPercent >= 1.0
                                ? t.error
                                : area.spentPercent >= 0.8
                                    ? t.warning
                                    : t.primary,
                            fontSize: 11,
                          ).copyWith(fontWeight: FontWeight.w600),
                        ),
                        Text(
                          '/${formatCurrency(area.allocatedCents)} $actionLabel',
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
    final actionLabel = sub.isExpense ? 'spent' : 'received';

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
                    Text(
                      '+${formatCurrency(sub.spentCents - sub.allocatedCents)} over',
                      style: AppTextStyles.caption(t.error)
                          .copyWith(fontSize: 10),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              // ── spent / allocated values ───────────────────────────────
              Row(
                children: [
                  Text(
                    formatCurrency(sub.spentCents),
                    style: AppTextStyles.mono(
                      isOver ? t.error : accentColor,
                      fontSize: 11,
                    ).copyWith(fontWeight: FontWeight.w600),
                  ),
                  Text(
                    '/${formatCurrency(sub.allocatedCents)} $actionLabel',
                    style: AppTextStyles.mono(t.txtTertiary, fontSize: 11),
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
                            'Other transactions',
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
                        if (totalExpense > 0)
                          Text(
                            '- ${formatCurrency(totalExpense)} spent',
                            style: AppTextStyles.bodySm(t.error)
                                .copyWith(fontSize: 11),
                          ),
                        if (totalExpense > 0 && totalIncome > 0)
                          Text('  ·  ',
                              style: AppTextStyles.bodySm(t.txtTertiary)
                                  .copyWith(fontSize: 11)),
                        if (totalIncome > 0)
                          Text(
                            '${formatCurrency(totalIncome)} received',
                            style: AppTextStyles.bodySm(t.success)
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
                          Text(
                            '${isExpense ? '- ' : ''}${formatCurrency(cents)}',
                            style: AppTextStyles.mono(
                              isExpense ? t.error : t.success,
                              fontSize: 13,
                            ).copyWith(fontWeight: FontWeight.w600),
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
