import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/models/budget_models.dart';
import '../providers/budget_provider.dart';
import 'budget_wizard_widgets.dart';
import 'create_budget_state.dart';

// ── Page ───────────────────────────────────────────────────────────────────

class CreateBudgetStep4Page extends ConsumerStatefulWidget {
  const CreateBudgetStep4Page({super.key});

  @override
  ConsumerState<CreateBudgetStep4Page> createState() =>
      _CreateBudgetStep4PageState();
}

class _CreateBudgetStep4PageState
    extends ConsumerState<CreateBudgetStep4Page> {
  bool _isLoading = false;
  String? _error;

  Future<void> _confirm() async {
    final s = CreateBudgetState.instance;
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await ref.read(budgetNotifierProvider.notifier).createBudget(
            name: s.name,
            recurrence: s.recurrence,
            startDay: s.startDay,
            incomeAreas: s.incomeAreas,
            expenseAreas: s.expenseAreas,
          );
      if (!mounted) return;
      s.reset();
      context.go('/budgets');
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = 'Falha ao criar o orçamento. Tente novamente.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = CreateBudgetState.instance;
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    final totalIncomeCents =
        s.incomeAreas.fold<int>(0, (sum, a) => sum + a.totalAllocatedCents);
    final totalExpenseCents =
        s.expenseAreas.fold<int>(0, (sum, a) => sum + a.totalAllocatedCents);
    final balanceCents = totalIncomeCents - totalExpenseCents;

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
                        child: Center(
                          child: Icon(LucideIcons.chevronLeft, size: 20, color: t.txtPrimary),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Novo orçamento',
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
              const BudgetStepIndicator(current: 4),
              const SizedBox(height: 24),

              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Revisar e confirmar',
                        style: AppTextStyles.h2(t.txtPrimary).copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Confira tudo antes de criar seu orçamento.',
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
                              label: 'Nome',
                              value: s.name,
                              valueStyle: AppTextStyles.body(t.txtPrimary)
                                  .copyWith(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600),
                            ),
                            _divider(t),
                            _SummaryRow(
                                label: 'Recorrência',
                                value: recurrenceLabelPt(s.recurrence)),
                            _divider(t),
                            _SummaryRow(
                              label: 'Receita prevista',
                              valueWidget: Money(
                                totalIncomeCents,
                                size: 14,
                                weight: FontWeight.w700,
                                color: t.success,
                              ),
                            ),
                            _divider(t),
                            _SummaryRow(
                              label: 'Despesa prevista',
                              valueWidget: Money(
                                totalExpenseCents,
                                size: 14,
                                weight: FontWeight.w700,
                                color: t.error,
                              ),
                            ),
                            _divider(t),
                            _SummaryRow(
                              label: balanceCents >= 0 ? 'Saldo' : 'Déficit',
                              valueWidget: Money(
                                balanceCents.abs(),
                                size: 14,
                                weight: FontWeight.w700,
                                color:
                                    balanceCents >= 0 ? t.success : t.error,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // ── Income areas ──────────────────────────────────
                      if (s.incomeAreas.isNotEmpty) ...[
                        _SectionHeader(
                          label: 'Áreas de receita',
                          color: t.success,
                        ),
                        const SizedBox(height: 10),
                        ...s.incomeAreas.map(
                          (area) => _AreaSummaryCard(
                            area: area,
                            allocationType: 'Income',
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      // ── Expense areas ─────────────────────────────────
                      if (s.expenseAreas.isNotEmpty) ...[
                        _SectionHeader(
                          label: 'Áreas de despesa',
                          color: t.error,
                        ),
                        const SizedBox(height: 10),
                        ...s.expenseAreas.map(
                          (area) => _AreaSummaryCard(
                            area: area,
                            allocationType: 'Expense',
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              if (_error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    _error!,
                    style: AppTextStyles.bodySm(t.error).copyWith(fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
              Padding(
                padding: EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 20),
                child: PrimaryButton(
                  label: _isLoading ? 'Criando...' : 'Criar orçamento',
                  onPressed: _isLoading ? null : _confirm,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _divider(AppThemeTokens t) => Divider(
        height: 16,
        thickness: 1,
        color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
      );
}

// ── Section Header ────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String label;
  final Color color;

  const _SectionHeader({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 3,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: AppTextStyles.h3(color).copyWith(
            fontWeight: FontWeight.w700,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

// ── Summary Row ───────────────────────────────────────────────────────────────

class _SummaryRow extends StatelessWidget {
  final String label;
  final String? value;
  final TextStyle? valueStyle;

  /// When provided, renders instead of [value] — used for [Money] amounts.
  final Widget? valueWidget;

  const _SummaryRow({
    required this.label,
    this.value,
    this.valueStyle,
    this.valueWidget,
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
        valueWidget ??
            Text(
              value ?? '',
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
  final String allocationType;

  const _AreaSummaryCard({
    required this.area,
    required this.allocationType,
  });

  @override
  State<_AreaSummaryCard> createState() => _AreaSummaryCardState();
}

class _AreaSummaryCardState extends State<_AreaSummaryCard> {
  bool _expanded = true;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final area = widget.area;
    final isIncome = widget.allocationType == 'Income';
    final accentColor = isIncome ? t.success : t.error;

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
                    Money(
                      area.totalAllocatedCents,
                      size: 14,
                      weight: FontWeight.w700,
                      color: accentColor,
                    ),
                    const SizedBox(width: 8),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0.0,
                      duration: const Duration(milliseconds: 200),
                      child: Text('▾',
                          style: TextStyle(
                              fontSize: 20, color: t.txtTertiary, height: 1)),
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded && area.subcategories.isNotEmpty) ...[
              Divider(
                height: 1,
                thickness: 1,
                color: t.divider.withValues(alpha: t.isDark ? 0.3 : 0.5),
              ),
              ...area.subcategories.asMap().entries.map((entry) {
                final sub = entry.value;
                final isLast = entry.key == area.subcategories.length - 1;
                return Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  sub.name,
                                  style: AppTextStyles.body(t.txtPrimary)
                                      .copyWith(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500),
                                ),
                                if (sub.categoryName.isNotEmpty)
                                  Text(
                                    sub.categoryName,
                                    style: AppTextStyles.caption(t.txtTertiary)
                                        .copyWith(fontSize: 11),
                                  ),
                              ],
                            ),
                          ),
                          Money(
                            sub.allocatedCents,
                            size: 13,
                            weight: FontWeight.w700,
                            color: accentColor,
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
              const SizedBox(height: 6),
            ],
          ],
        ),
      ),
    );
  }
}
