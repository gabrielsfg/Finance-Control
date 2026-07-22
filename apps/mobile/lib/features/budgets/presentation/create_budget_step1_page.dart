import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import 'budget_wizard_widgets.dart';
import 'create_budget_state.dart';

// ── Recurrence options ───────────────────────────────────────────────────────

final _kRecurrenceOptions = <(String, IconData)>[
  ('Monthly', LucideIcons.calendar),
  ('Weekly', LucideIcons.calendarDays),
  ('Biweekly', LucideIcons.calendarRange),
  ('Semiannually', LucideIcons.calendarClock),
  ('Annually', LucideIcons.calendarCheck),
];

// ── Page ───────────────────────────────────────────────────────────────────

class CreateBudgetStep1Page extends StatefulWidget {
  const CreateBudgetStep1Page({super.key});

  @override
  State<CreateBudgetStep1Page> createState() => _CreateBudgetStep1PageState();
}

class _CreateBudgetStep1PageState extends State<CreateBudgetStep1Page> {
  final _nameController = TextEditingController(
    text: CreateBudgetState.instance.name,
  );
  String _recurrence = CreateBudgetState.instance.recurrence;
  int _startDay = CreateBudgetState.instance.startDay;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  bool get _canProceed => _nameController.text.trim().isNotEmpty;

  void _next() {
    if (!_canProceed) return;
    CreateBudgetState.instance
      ..name = _nameController.text.trim()
      ..recurrence = _recurrence
      ..startDay = _startDay;
    context.push('/budgets/create/step2');
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

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
              // ── Step indicator ─────────────────────────────────────────
              const BudgetStepIndicator(current: 1),
              const SizedBox(height: 28),

              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Detalhes do orçamento',
                        style: AppTextStyles.h2(t.txtPrimary).copyWith(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Dê um nome ao seu orçamento e escolha com que frequência ele se repete.',
                        style: AppTextStyles.body(t.txtSecondary).copyWith(
                          fontSize: 13,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 28),
                      AppInputField(
                        label: 'Nome do orçamento',
                        placeholder: 'ex: Custos fixos',
                        controller: _nameController,
                        textCapitalization: TextCapitalization.sentences,
                        onChanged: (_) => setState(() {}),
                      ),
                      const SizedBox(height: 28),
                      Text(
                        'Recorrência',
                        style: AppTextStyles.caption(t.txtSecondary).copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 10),
                      ..._kRecurrenceOptions.map((option) {
                        final (label, icon) = option;
                        final isSelected = _recurrence == label;
                        return _RecurrenceTile(
                          label: recurrenceLabelPt(label),
                          icon: icon,
                          selected: isSelected,
                          onTap: () => setState(() => _recurrence = label),
                        );
                      }),
                      const SizedBox(height: 28),
                      Text(
                        'Dia de início do mês',
                        style: AppTextStyles.caption(t.txtSecondary).copyWith(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _StartDayDropdown(
                        value: _startDay,
                        onChanged: (day) => setState(() => _startDay = day),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 20),
                child: PrimaryButton(
                  label: 'Próximo: definir áreas',
                  onPressed: _canProceed ? _next : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Recurrence Tile ───────────────────────────────────────────────────────────

class _RecurrenceTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _RecurrenceTile({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: selected
              ? t.accent.withValues(alpha: t.isDark ? 0.18 : 0.08)
              : t.surfaceEl,
          borderRadius: AppRadius.baseAll,
          border: Border.all(
            color: selected
                ? t.accent.withValues(alpha: t.isDark ? 0.55 : 0.4)
                : t.mist,
            width: selected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: selected ? t.accent : t.txtTertiary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: AppTextStyles.body(
                  selected ? t.accent : t.txtPrimary,
                ).copyWith(
                  fontSize: 14,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ),
            if (selected)
              Icon(LucideIcons.check, size: 18, color: t.accent),
          ],
        ),
      ),
    );
  }
}

// ── Start Day Dropdown ────────────────────────────────────────────────────────

class _StartDayDropdown extends StatelessWidget {
  final int value;
  final ValueChanged<int> onChanged;

  const _StartDayDropdown({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Container(
      decoration: BoxDecoration(
        color: t.surfaceEl,
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.mist),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int>(
          value: value,
          isExpanded: true,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          borderRadius: AppRadius.baseAll,
          dropdownColor: t.surface,
          icon: Text('▾', style: TextStyle(fontSize: 18, color: t.txtTertiary, height: 1)),
          style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
          items: List.generate(31, (i) {
            final day = i + 1;
            return DropdownMenuItem(
              value: day,
              child: Text(
                'Dia $day',
                style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
              ),
            );
          }),
          onChanged: (day) {
            if (day != null) onChanged(day);
          },
        ),
      ),
    );
  }
}
