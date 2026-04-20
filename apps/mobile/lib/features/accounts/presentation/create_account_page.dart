import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../../shared/widgets/bank_picker_sheet.dart';
import '../data/dtos/create_account_request_dto.dart';
import '../providers/accounts_provider.dart';

const _accountTypes = ['Debit', 'Checking', 'Savings', 'Credit', 'Cash'];

class CreateAccountPage extends ConsumerStatefulWidget {
  const CreateAccountPage({super.key});

  @override
  ConsumerState<CreateAccountPage> createState() => _CreateAccountPageState();
}

class _CreateAccountPageState extends ConsumerState<CreateAccountPage> {
  final _nameController = TextEditingController();
  final _goalController = TextEditingController();
  final _billingDayController = TextEditingController();
  final _creditLimitController = TextEditingController();

  String _type = 'Checking';
  String? _selectedBank;
  bool _isDefault = true;
  bool _isLoading = false;

  String? _nameError;
  String? _submitError;

  bool get _isCredit => _type == 'Credit';

  @override
  void dispose() {
    _nameController.dispose();
    _goalController.dispose();
    _billingDayController.dispose();
    _creditLimitController.dispose();
    super.dispose();
  }

  static int _parseCents(String raw) {
    if (raw.trim().isEmpty) return 0;
    return CentsInputFormatter.parseCents(raw);
  }

  bool _validate() {
    final nameErr = _nameController.text.trim().isEmpty
        ? 'Account name is required'
        : null;
    setState(() => _nameError = nameErr);
    return nameErr == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    setState(() {
      _isLoading = true;
      _submitError = null;
    });

    try {
      final goalCents = _parseCents(_goalController.text);
      final billingDay = int.tryParse(_billingDayController.text.trim());
      final creditLimitCents = _parseCents(_creditLimitController.text);

      await ref.read(accountsNotifierProvider.notifier).createAccount(
            CreateAccountRequestDto(
              name: _nameController.text.trim(),
              type: _type,
              isDefaultAccount: _isDefault,
              goalAmount: goalCents > 0 ? goalCents : null,
              billingDueDay: _isCredit ? billingDay : null,
              creditLimit: _isCredit && creditLimitCents > 0
                  ? creditLimitCents
                  : null,
            ),
          );
      if (mounted) context.pop();
    } catch (e) {
      setState(() {
        _submitError = 'Failed to create account. Please try again.';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: true,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                // ── Header ────────────────────────────────────────────────
                Row(
                  children: [
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Icon(
                        LucideIcons.arrowLeft,
                        color: t.txtPrimary,
                        size: 22,
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'New Account',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                        ),
                      ),
                    ),
                    const SizedBox(width: 22),
                  ],
                ),
                const SizedBox(height: 24),
                // ── Account type selector ─────────────────────────────────
                _AccountTypeSelector(
                  selected: _type,
                  onChanged: (v) => setState(() => _type = v),
                ),
                const SizedBox(height: 20),
                // ── Name ──────────────────────────────────────────────────
                AppInputField(
                  label: 'Account name',
                  placeholder: 'e.g. Nubank, Cash, Savings',
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  errorText: _nameError,
                  textInputAction: TextInputAction.next,
                  onChanged: (_) {
                    if (_nameError != null) setState(() => _nameError = null);
                  },
                ),
                const SizedBox(height: 14),
                // ── Bank picker ───────────────────────────────────────────
                _BankPickerField(
                  selected: _selectedBank,
                  onTap: () async {
                    final bank = await showBankPickerSheet(context);
                    if (bank != null) setState(() => _selectedBank = bank);
                  },
                ),
                const SizedBox(height: 14),
                // ── Goal ──────────────────────────────────────────────────
                AppInputField(
                  label: 'Goal (optional)',
                  placeholder: '0,00',
                  controller: _goalController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    const CentsInputFormatter(),
                  ],
                  textInputAction: TextInputAction.done,
                  leftIcon: const Icon(LucideIcons.target, size: 16),
                ),
                // ── Credit-only fields ────────────────────────────────────
                if (_isCredit) ...[
                  const SizedBox(height: 14),
                  AppInputField(
                    label: 'Credit limit',
                    placeholder: '0,00',
                    controller: _creditLimitController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      const CentsInputFormatter(),
                    ],
                    textInputAction: TextInputAction.next,
                    leftIcon: const Icon(LucideIcons.creditCard, size: 16),
                  ),
                  const SizedBox(height: 14),
                  AppInputField(
                    label: 'Billing due day',
                    placeholder: '1 – 31',
                    controller: _billingDayController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                    textInputAction: TextInputAction.done,
                    leftIcon: const Icon(LucideIcons.calendarDays, size: 16),
                  ),
                ],
                const SizedBox(height: 20),
                // ── Toggles ───────────────────────────────────────────────
                GlassCard(
                  child: _ToggleRow(
                    label: 'Default Account',
                    subtitle: 'Pre-select in new transactions',
                    value: _isDefault,
                    onChanged: (v) => setState(() => _isDefault = v),
                  ),
                ),
                if (_submitError != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    _submitError!,
                    style: AppTextStyles.caption(t.error),
                  ),
                ],
                const SizedBox(height: 24),
                // ── Save button ───────────────────────────────────────────
                _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : PrimaryButton(
                        label: 'Save',
                        onPressed: _submit,
                      ),
                SizedBox(height: bottomPad + 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Bank Picker Field ─────────────────────────────────────────────────────────

class _BankPickerField extends StatelessWidget {
  const _BankPickerField({required this.selected, required this.onTap});

  final String? selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Bank (optional)',
          style: AppTextStyles.caption(t.txtSecondary)
              .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 5),
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: 48,
            decoration: BoxDecoration(
              color: t.isDark
                  ? const Color(0xFF1C1830).withValues(alpha: 0.85)
                  : const Color(0xFFEDE9FE).withValues(alpha: 0.5),
              borderRadius: AppRadius.baseAll,
              border: Border.all(
                color: t.isDark
                    ? Colors.white.withValues(alpha: 0.09)
                    : const Color(0xFF7C3AED).withValues(alpha: 0.18),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                const SizedBox(width: 10),
                Icon(LucideIcons.landmark, size: 16, color: t.txtTertiary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    selected ?? 'Select bank...',
                    style: AppTextStyles.body(
                      selected != null ? t.txtPrimary : t.txtTertiary,
                    ).copyWith(fontSize: 14),
                  ),
                ),
                Icon(LucideIcons.chevronsUpDown, size: 14, color: t.txtTertiary),
                const SizedBox(width: 12),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Account Type Selector ─────────────────────────────────────────────────────

class _AccountTypeSelector extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;

  const _AccountTypeSelector({
    required this.selected,
    required this.onChanged,
  });

  static const _icons = {
    'Debit': LucideIcons.wallet,
    'Checking': LucideIcons.building2,
    'Savings': LucideIcons.piggyBank,
    'Credit': LucideIcons.creditCard,
    'Cash': LucideIcons.banknote,
  };

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Account type',
          style: AppTextStyles.caption(t.txtSecondary).copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: _accountTypes.map((type) {
            final isSelected = type == selected;
            return Expanded(
              child: GestureDetector(
                onTap: () => onChanged(type),
                child: Container(
                  margin: EdgeInsets.only(
                    right: type != _accountTypes.last ? 8 : 0,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? t.primary.withValues(alpha: t.isDark ? 0.2 : 0.1)
                        : t.isDark
                            ? Colors.white.withValues(alpha: 0.05)
                            : Colors.white.withValues(alpha: 0.8),
                    borderRadius: AppRadius.mdAll,
                    border: Border.all(
                      color: isSelected
                          ? t.primary.withValues(alpha: 0.6)
                          : t.divider.withValues(alpha: 0.4),
                      width: isSelected ? 1.5 : 1,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        _icons[type]!,
                        size: 18,
                        color: isSelected ? t.primary : t.txtTertiary,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        type,
                        style: AppTextStyles.caption(
                          isSelected ? t.primary : t.txtSecondary,
                        ).copyWith(
                          fontWeight: isSelected
                              ? FontWeight.w700
                              : FontWeight.w500,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ── Toggle Row ────────────────────────────────────────────────────────────────

class _ToggleRow extends StatelessWidget {
  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ToggleRow({
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTextStyles.body(t.txtPrimary)
                    .copyWith(fontSize: 14, fontWeight: FontWeight.w500),
              ),
              Text(
                subtitle,
                style: AppTextStyles.caption(t.txtTertiary),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeThumbColor: t.primary,
        ),
      ],
    );
  }
}
