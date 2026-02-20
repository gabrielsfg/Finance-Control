import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';

// ── Transaction type enum ──────────────────────────────────────────────────

enum _TxType { expense, income }

// ── Page ───────────────────────────────────────────────────────────────────

class AddTransactionPage extends StatefulWidget {
  const AddTransactionPage({super.key});

  @override
  State<AddTransactionPage> createState() => _AddTransactionPageState();
}

class _AddTransactionPageState extends State<AddTransactionPage> {
  _TxType _type = _TxType.expense;
  final _amountController = TextEditingController();
  bool _isInstallment = false;

  // Mock selected values (TODO: replace with picker navigation)
  String _subcategory = 'Delivery';
  String _account = 'Nubank';
  DateTime _date = DateTime(2026, 2, 19);
  String _description = 'Pizza de pepperoni';
  String _recurrence = 'No';

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
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
                        child: Icon(
                          Icons.arrow_back,
                          size: 18,
                          color: t.txtPrimary,
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'New Transaction',
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

              // ── Type toggle ────────────────────────────────────────────
              Padding(
                padding: AppSpacing.screenPadding,
                child: _TypeToggle(
                  selected: _type,
                  onChanged: (v) => setState(() => _type = v),
                ),
              ),

              const SizedBox(height: 24),

              // ── Amount display ─────────────────────────────────────────
              _AmountDisplay(
                type: _type,
                controller: _amountController,
              ),

              const SizedBox(height: 24),

              // ── Fields card ────────────────────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  padding: AppSpacing.screenPadding.copyWith(bottom: 0),
                  child: GlassCard(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 4),
                    child: Column(
                      children: [
                        _FieldRow(
                          label: 'Subcategory',
                          value: _subcategory,
                          onTap: () {
                            // TODO: open subcategory picker
                          },
                        ),
                        _FieldRow(
                          label: 'Account',
                          value: _account,
                          onTap: () {
                            // TODO: open account picker
                          },
                        ),
                        _FieldRow(
                          label: 'Date',
                          value: _formatDate(_date),
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _date,
                              firstDate: DateTime(2020),
                              lastDate: DateTime(2030),
                            );
                            if (picked != null) {
                              setState(() => _date = picked);
                            }
                          },
                        ),
                        _FieldRow(
                          label: 'Description',
                          value: _description,
                          onTap: () {
                            // TODO: open text input bottom sheet
                          },
                        ),
                        _FieldRow(
                          label: 'Recurrence',
                          value: _recurrence,
                          onTap: () {
                            // TODO: open recurrence picker
                          },
                        ),
                        _InstallmentRow(
                          enabled: _isInstallment,
                          onChanged: (v) => setState(() => _isInstallment = v),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Save button ────────────────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(24, 16, 24, bottomPad + 20),
                child: PrimaryButton(
                  label: 'Save Transaction',
                  onPressed: () {
                    // TODO: call create transaction endpoint
                    context.pop();
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
}

// ── Type Toggle ─────────────────────────────────────────────────────────────

class _TypeToggle extends StatelessWidget {
  final _TxType selected;
  final ValueChanged<_TxType> onChanged;

  const _TypeToggle({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: t.isDark
            ? Colors.white.withValues(alpha: 0.06)
            : t.primary.withValues(alpha: 0.06),
        borderRadius: AppRadius.mdAll,
        border: Border.all(
          color: t.isDark
              ? Colors.white.withValues(alpha: 0.08)
              : t.primary.withValues(alpha: 0.12),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: _TypeTab(
              label: 'Expense',
              active: selected == _TxType.expense,
              activeColor: t.error,
              onTap: () => onChanged(_TxType.expense),
            ),
          ),
          Expanded(
            child: _TypeTab(
              label: 'Income',
              active: selected == _TxType.income,
              activeColor: t.success,
              onTap: () => onChanged(_TxType.income),
            ),
          ),
        ],
      ),
    );
  }
}

class _TypeTab extends StatelessWidget {
  final String label;
  final bool active;
  final Color activeColor;
  final VoidCallback onTap;

  const _TypeTab({
    required this.label,
    required this.active,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.all(3),
        decoration: BoxDecoration(
          color: active
              ? activeColor.withValues(alpha: t.isDark ? 0.22 : 0.12)
              : Colors.transparent,
          borderRadius: AppRadius.smAll,
          border: active
              ? Border.all(
                  color: activeColor.withValues(alpha: t.isDark ? 0.5 : 0.35),
                )
              : null,
        ),
        child: Center(
          child: Text(
            label,
            style: AppTextStyles.body(
              active ? activeColor : t.txtTertiary,
            ).copyWith(
              fontSize: 14,
              fontWeight: active ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Amount Display ──────────────────────────────────────────────────────────

class _AmountDisplay extends StatelessWidget {
  final _TxType type;
  final TextEditingController controller;

  const _AmountDisplay({required this.type, required this.controller});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final color = type == _TxType.expense ? t.error : t.success;

    return GestureDetector(
      onTap: () => FocusScope.of(context).requestFocus(FocusNode()),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                'R\$',
                style: AppTextStyles.body(color).copyWith(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(width: 4),
              IntrinsicWidth(
                child: TextField(
                  controller: controller,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(
                        RegExp(r'^\d{0,9}([,\.]\d{0,2})?')),
                  ],
                  style: AppTextStyles.moneyLg(color).copyWith(fontSize: 34),
                  decoration: InputDecoration(
                    hintText: '0,00',
                    hintStyle:
                        AppTextStyles.moneyLg(color.withValues(alpha: 0.35))
                            .copyWith(fontSize: 34),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Tap to enter amount',
            style: AppTextStyles.bodySm(t.primary).copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

// ── Field Row ───────────────────────────────────────────────────────────────

class _FieldRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;
  final bool showDivider;

  const _FieldRow({
    required this.label,
    required this.value,
    required this.onTap,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 14),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label,
                  style: AppTextStyles.body(t.txtSecondary).copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      value,
                      style: AppTextStyles.body(t.txtPrimary).copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      Icons.chevron_right,
                      size: 16,
                      color: t.txtDisabled,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        if (showDivider)
          Divider(
            height: 1,
            thickness: 1,
            color: t.divider.withValues(alpha: t.isDark ? 0.35 : 0.6),
          ),
      ],
    );
  }
}

// ── Installment Row ─────────────────────────────────────────────────────────

class _InstallmentRow extends StatelessWidget {
  final bool enabled;
  final ValueChanged<bool> onChanged;

  const _InstallmentRow({required this.enabled, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Installment?',
            style: AppTextStyles.body(t.txtSecondary).copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
          Row(
            children: [
              Text(
                enabled ? 'Yes' : 'No',
                style: AppTextStyles.body(t.txtTertiary).copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(width: 8),
              Switch.adaptive(
                value: enabled,
                onChanged: onChanged,
                activeColor: t.primary,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
