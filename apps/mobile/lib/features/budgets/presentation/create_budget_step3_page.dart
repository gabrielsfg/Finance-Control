import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/budget_models.dart';
import 'budget_wizard_widgets.dart';
import 'create_budget_state.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class CreateBudgetStep3Page extends StatelessWidget {
  const CreateBudgetStep3Page({super.key});

  @override
  Widget build(BuildContext context) {
    final state = CreateBudgetState.instance;
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    final totalCents = state.areas.fold<int>(
      0,
      (sum, a) => sum + a.totalAllocatedCents,
    );

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // ── App bar ────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : t.primary.withValues(alpha: 0.08),
                        ),
                        child: Icon(Icons.arrow_back,
                            size: 18, color: t.txtPrimary),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'New Budget',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                        ),
                      ),
                    ),
                    const SizedBox(width: 36),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              const BudgetStepIndicator(current: 3),
              const SizedBox(height: 24),

              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Review & confirm',
                        style: AppTextStyles.h2(t.txtPrimary).copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Check everything before creating your budget.',
                        style: AppTextStyles.body(t.txtSecondary).copyWith(
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // ── Budget info card ──────────────────────────────
                      GlassCard(
                        child: Column(
                          children: [
                            _SummaryRow(
                              label: 'Name',
                              value: state.name,
                              valueStyle: AppTextStyles.body(t.txtPrimary)
                                  .copyWith(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600),
                            ),
                            Divider(
                              height: 16,
                              thickness: 1,
                              color: t.divider
                                  .withValues(alpha: t.isDark ? 0.3 : 0.5),
                            ),
                            _SummaryRow(
                              label: 'Recurrence',
                              value: state.recurrence,
                            ),
                            Divider(
                              height: 16,
                              thickness: 1,
                              color: t.divider
                                  .withValues(alpha: t.isDark ? 0.3 : 0.5),
                            ),
                            _SummaryRow(
                              label: 'Total allocated',
                              value: formatCurrency(totalCents),
                              valueStyle: AppTextStyles.mono(t.primary,
                                      fontSize: 14)
                                  .copyWith(fontWeight: FontWeight.w700),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // ── Areas summary ─────────────────────────────────
                      Text(
                        'Areas',
                        style: AppTextStyles.h3(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ...state.areas.map(
                        (area) => _AreaSummaryCard(area: area),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Confirm button ─────────────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 20),
                child: PrimaryButton(
                  label: 'Create Budget',
                  onPressed: () {
                    // TODO: call create budget API endpoint
                    CreateBudgetState.instance.reset();
                    context.go('/budgets');
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Summary Row ───────────────────────────────────────────────────────────────

class _SummaryRow extends StatelessWidget {
  final String label;
  final String value;
  final TextStyle? valueStyle;

  const _SummaryRow({
    required this.label,
    required this.value,
    this.valueStyle,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: AppTextStyles.body(t.txtSecondary).copyWith(fontSize: 13),
        ),
        Text(
          value,
          style: valueStyle ??
              AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 13),
        ),
      ],
    );
  }
}

// ── Area Summary Card ─────────────────────────────────────────────────────────

class _AreaSummaryCard extends StatefulWidget {
  final DraftArea area;

  const _AreaSummaryCard({required this.area});

  @override
  State<_AreaSummaryCard> createState() => _AreaSummaryCardState();
}

class _AreaSummaryCardState extends State<_AreaSummaryCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final area = widget.area;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        padding: EdgeInsets.zero,
        child: Column(
          children: [
            // Area header
            GestureDetector(
              onTap: () => setState(() => _expanded = !_expanded),
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 12, 14),
                child: Row(
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
                      formatCurrency(area.totalAllocatedCents),
                      style: AppTextStyles.mono(t.primary, fontSize: 13)
                          .copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(width: 8),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(Icons.expand_more,
                          size: 20, color: t.txtTertiary),
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded) ...[
              Divider(
                height: 1,
                thickness: 1,
                color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
              ...area.categories.asMap().entries.map((catEntry) {
                final cat = catEntry.value;
                final isLastCat = catEntry.key == area.categories.length - 1;
                return _CategorySummarySection(
                  category: cat,
                  showBottomDivider: !isLastCat,
                );
              }),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Category Summary Section ──────────────────────────────────────────────────

class _CategorySummarySection extends StatefulWidget {
  final DraftCategory category;
  final bool showBottomDivider;

  const _CategorySummarySection({
    required this.category,
    this.showBottomDivider = true,
  });

  @override
  State<_CategorySummarySection> createState() =>
      _CategorySummarySectionState();
}

class _CategorySummarySectionState extends State<_CategorySummarySection> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final cat = widget.category;
    final allocated = cat.subcategories
        .where((s) => s.allocatedCents > 0)
        .toList();

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
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: cat.color.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(cat.icon, color: cat.color, size: 16),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    cat.name,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
                Text(
                  formatCurrency(cat.totalAllocatedCents),
                  style: AppTextStyles.mono(t.txtSecondary, fontSize: 12)
                      .copyWith(fontWeight: FontWeight.w600),
                ),
                const SizedBox(width: 6),
                AnimatedRotation(
                  turns: _expanded ? 0.5 : 0.0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.expand_more,
                      size: 16, color: t.txtDisabled),
                ),
              ],
            ),
          ),
        ),
        if (_expanded && allocated.isNotEmpty) ...[
          ...allocated.asMap().entries.map((entry) {
            final sub = entry.value;
            final isLast = entry.key == allocated.length - 1;
            return Column(
              children: [
                Padding(
                  padding: const EdgeInsets.only(
                      left: 58, right: 16, top: 6, bottom: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        sub.name,
                        style: AppTextStyles.bodySm(t.txtSecondary).copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      Text(
                        formatCurrency(sub.allocatedCents),
                        style: AppTextStyles.mono(t.txtPrimary, fontSize: 12)
                            .copyWith(fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
                if (!isLast)
                  Divider(
                    height: 1,
                    thickness: 1,
                    indent: 58,
                    endIndent: 16,
                    color:
                        t.divider.withValues(alpha: t.isDark ? 0.2 : 0.35),
                  ),
              ],
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
