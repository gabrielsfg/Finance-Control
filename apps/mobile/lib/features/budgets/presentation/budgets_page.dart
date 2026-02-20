import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/budget_models.dart';

// ── Mock data (TODO: replace with Riverpod providers) ─────────────────────

final _kBudget = Budget(
  id: 1,
  name: 'Fixed Costs',
  recurrence: 'Monthly',
  startDate: DateTime(2026, 2, 1),
  endDate: DateTime(2026, 2, 28),
  areas: [
    BudgetArea(
      id: 1,
      name: 'Housing',
      categories: [
        BudgetCategory(
          id: 1,
          name: 'Housing',
          icon: Icons.home_outlined,
          color: const Color(0xFF8B5CF6),
          subcategories: [
            const BudgetSubcategory(
              id: 1,
              name: 'Rent',
              allocatedCents: 180000,
              spentCents: 180000,
            ),
            const BudgetSubcategory(
              id: 2,
              name: 'Utilities',
              allocatedCents: 20000,
              spentCents: 12400,
            ),
          ],
        ),
      ],
    ),
    BudgetArea(
      id: 2,
      name: 'Daily Life',
      categories: [
        BudgetCategory(
          id: 2,
          name: 'Food',
          icon: Icons.restaurant_outlined,
          color: const Color(0xFFF59E0B),
          subcategories: [
            const BudgetSubcategory(
              id: 3,
              name: 'Groceries',
              allocatedCents: 40000,
              spentCents: 28500,
            ),
            const BudgetSubcategory(
              id: 4,
              name: 'Delivery',
              allocatedCents: 15000,
              spentCents: 19790,
            ),
          ],
        ),
        BudgetCategory(
          id: 3,
          name: 'Transport',
          icon: Icons.directions_car_outlined,
          color: const Color(0xFF06B6D4),
          subcategories: [
            const BudgetSubcategory(
              id: 5,
              name: 'Ride apps',
              allocatedCents: 12000,
              spentCents: 8460,
            ),
            const BudgetSubcategory(
              id: 6,
              name: 'Fuel',
              allocatedCents: 18000,
              spentCents: 9100,
            ),
          ],
        ),
      ],
    ),
    BudgetArea(
      id: 3,
      name: 'Health',
      categories: [
        BudgetCategory(
          id: 4,
          name: 'Health',
          icon: Icons.favorite_outline,
          color: const Color(0xFFEF4444),
          subcategories: [
            const BudgetSubcategory(
              id: 7,
              name: 'Pharmacy',
              allocatedCents: 10000,
              spentCents: 4580,
            ),
            const BudgetSubcategory(
              id: 8,
              name: 'Doctor',
              allocatedCents: 20000,
              spentCents: 0,
            ),
          ],
        ),
      ],
    ),
  ],
);

// ── Demo toggle (TODO: replace with Riverpod provider checking real data) ──
const _kHasBudget = true;

// ── Page ───────────────────────────────────────────────────────────────────

class BudgetsPage extends StatelessWidget {
  const BudgetsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return _kHasBudget ? _BudgetView(budget: _kBudget) : const _EmptyState();
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
                        child: Icon(
                          Icons.pie_chart_outline,
                          size: 44,
                          color: t.primary,
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
                        icon: const Icon(Icons.add, color: Colors.white, size: 18),
                        onPressed: () => context.push('/budgets/create/step1'),
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
                    onTap: () => context.push('/budgets/create/step1'),
                    child: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: t.primary.withValues(alpha: 0.1),
                      ),
                      child: Icon(Icons.add, size: 18, color: t.primary),
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
    final percentStr = '${(budget.overallPercent * 100).round()}%';
    final remaining = budget.totalAllocatedCents - budget.totalSpentCents;

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _OverviewStat(
                label: 'Allocated',
                value: formatCurrency(budget.totalAllocatedCents),
                color: t.txtPrimary,
              ),
              _OverviewStat(
                label: 'Spent',
                value: formatCurrency(budget.totalSpentCents),
                color: t.error,
                align: TextAlign.center,
              ),
              _OverviewStat(
                label: remaining >= 0 ? 'Remaining' : 'Over budget',
                value: formatCurrency(remaining.abs()),
                color: remaining >= 0 ? t.success : t.error,
                align: TextAlign.end,
              ),
            ],
          ),
          const SizedBox(height: 12),
          AppProgressBar(percent: budget.overallPercent),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${budget.areas.length} area${budget.areas.length == 1 ? '' : 's'}',
                style: AppTextStyles.bodySm(t.txtTertiary).copyWith(fontSize: 11),
              ),
              Text(
                percentStr,
                style: AppTextStyles.bodySm(
                  budget.overallPercent >= 1.0 ? t.error : t.warning,
                ).copyWith(fontSize: 11, fontWeight: FontWeight.w600),
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
    return Column(
      crossAxisAlignment: align == TextAlign.start
          ? CrossAxisAlignment.start
          : align == TextAlign.end
              ? CrossAxisAlignment.end
              : CrossAxisAlignment.center,
      children: [
        Text(
          label,
          style: AppTextStyles.caption(t.txtTertiary).copyWith(fontSize: 11),
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

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            // Area header — tapping toggles category list
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
                          child: Icon(
                            Icons.expand_more,
                            size: 20,
                            color: t.txtTertiary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    AppProgressBar(percent: area.spentPercent),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '${formatCurrency(area.spentCents)} spent',
                          style: AppTextStyles.bodySm(t.txtSecondary)
                              .copyWith(fontSize: 11),
                        ),
                        Text(
                          'of ${formatCurrency(area.allocatedCents)}',
                          style: AppTextStyles.bodySm(t.txtTertiary)
                              .copyWith(fontSize: 11),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            // Categories
            if (_expanded) ...[
              Divider(
                height: 1,
                thickness: 1,
                color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
              ...area.categories.asMap().entries.map((entry) {
                final isLast = entry.key == area.categories.length - 1;
                return _CategorySection(
                  category: entry.value,
                  showBottomDivider: !isLast,
                );
              }),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Category Section ─────────────────────────────────────────────────────────

class _CategorySection extends StatefulWidget {
  final BudgetCategory category;
  final bool showBottomDivider;

  const _CategorySection({
    required this.category,
    this.showBottomDivider = true,
  });

  @override
  State<_CategorySection> createState() => _CategorySectionState();
}

class _CategorySectionState extends State<_CategorySection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final cat = widget.category;

    return Column(
      children: [
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: cat.color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(cat.icon, color: cat.color, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cat.name,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          Expanded(
                            child: AppProgressBar(percent: cat.spentPercent),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${(cat.spentPercent * 100).round()}%',
                            style: AppTextStyles.caption(
                              cat.spentPercent >= 1.0
                                  ? t.error
                                  : cat.spentPercent >= 0.8
                                      ? t.warning
                                      : t.primary,
                            ).copyWith(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  formatCurrency(cat.allocatedCents),
                  style: AppTextStyles.mono(t.txtSecondary, fontSize: 12)
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 6),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child:
                      Icon(Icons.expand_more, size: 16, color: t.txtDisabled),
                ),
              ],
            ),
          ),
        ),
        if (_expanded) ...[
          ...cat.subcategories.asMap().entries.map((entry) {
            final isLast = entry.key == cat.subcategories.length - 1;
            return _SubcategoryRow(
              sub: entry.value,
              showDivider: !isLast,
            );
          }),
          const SizedBox(height: 6),
        ],
        if (widget.showBottomDivider)
          Divider(
            height: 1,
            thickness: 1,
            indent: 16,
            endIndent: 16,
            color: t.divider.withValues(alpha: t.isDark ? 0.25 : 0.45),
          ),
      ],
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

    return Column(
      children: [
        Padding(
          padding:
              const EdgeInsets.only(left: 62, right: 16, top: 8, bottom: 8),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      sub.name,
                      style: AppTextStyles.bodySm(t.txtSecondary).copyWith(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 4),
                    AppProgressBar(percent: sub.spentPercent),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    formatCurrency(sub.allocatedCents),
                    style: AppTextStyles.mono(t.txtPrimary, fontSize: 12)
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    isOver
                        ? '+${formatCurrency(sub.spentCents - sub.allocatedCents)} over'
                        : '${formatCurrency(sub.spentCents)} spent',
                    style: AppTextStyles.caption(
                      isOver ? t.error : t.txtTertiary,
                    ).copyWith(fontSize: 10),
                  ),
                ],
              ),
            ],
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            thickness: 1,
            indent: 62,
            endIndent: 16,
            color: t.divider.withValues(alpha: t.isDark ? 0.2 : 0.35),
          ),
      ],
    );
  }
}
