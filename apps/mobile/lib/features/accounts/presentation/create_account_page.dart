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
  final _creditLimitController = TextEditingController();
  final _initialBalanceController = TextEditingController();
  final _currentInvoiceController = TextEditingController();

  String _type = 'Checking';
  String? _selectedBank;
  bool _isDefault = true;
  bool _isLoading = false;
  int? _billingDay;

  String? _nameError;
  String? _submitError;

  bool get _hasCreditFields => _type == 'Credit' || _type == 'Checking';
  bool get _hasInitialBalance =>
      _type == 'Debit' || _type == 'Checking' || _type == 'Savings' || _type == 'Cash';
  bool get _hasCurrentInvoice => _type == 'Credit' || _type == 'Checking';

  @override
  void dispose() {
    _nameController.dispose();
    _goalController.dispose();
    _creditLimitController.dispose();
    _initialBalanceController.dispose();
    _currentInvoiceController.dispose();
    super.dispose();
  }

  static int _parseCents(String raw) {
    if (raw.trim().isEmpty) return 0;
    return CentsInputFormatter.parseCents(raw);
  }

  bool _validate() {
    final nameErr =
        _nameController.text.trim().isEmpty ? 'O nome da conta é obrigatório' : null;
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
      final creditLimitCents = _parseCents(_creditLimitController.text);
      final initialBalanceCents = _parseCents(_initialBalanceController.text);
      final currentInvoiceCents = _parseCents(_currentInvoiceController.text);

      // For Credit/Checking: initial balance is positive (credit available),
      // current invoice is a negative offset (already owed).
      final int? effectiveInitialBalance = _hasCurrentInvoice
          ? (currentInvoiceCents > 0 ? -currentInvoiceCents : null)
          : (_hasInitialBalance && initialBalanceCents > 0
              ? initialBalanceCents
              : null);

      await ref.read(accountsNotifierProvider.notifier).createAccount(
            CreateAccountRequestDto(
              name: _nameController.text.trim(),
              type: _type,
              isDefaultAccount: _isDefault,
              goalAmount: goalCents > 0 ? goalCents : null,
              billingDueDay: _hasCreditFields ? _billingDay : null,
              creditLimit:
                  _hasCreditFields && creditLimitCents > 0 ? creditLimitCents : null,
              initialBalance: effectiveInitialBalance,
            ),
          );
      if (mounted) context.pop();
    } catch (e) {
      setState(() {
        _submitError = 'Não foi possível criar a conta. Tente novamente.';
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
                        'Nova conta',
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
                  onChanged: (v) => setState(() {
                    _type = v;
                    _billingDay = null;
                  }),
                ),
                const SizedBox(height: 20),
                // ── Name ──────────────────────────────────────────────────
                AppInputField(
                  label: 'Nome da conta',
                  placeholder: 'ex.: Nubank, Dinheiro, Poupança',
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
                  label: 'Meta (opcional)',
                  placeholder: '0,00',
                  controller: _goalController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    const CentsInputFormatter(),
                  ],
                  textInputAction: TextInputAction.next,
                  leftIcon: const Icon(LucideIcons.target, size: 16),
                ),
                // ── Credit/Checking fields ────────────────────────────────
                if (_hasCreditFields) ...[
                  const SizedBox(height: 14),
                  AppInputField(
                    label: 'Limite de crédito',
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
                  _BillingDayPicker(
                    selected: _billingDay,
                    onChanged: (d) => setState(() => _billingDay = d),
                  ),
                ],
                // ── Initial balance (Debit / Savings / Cash) ──────────────
                if (_hasInitialBalance) ...[
                  const SizedBox(height: 14),
                  AppInputField(
                    label: 'Saldo atual (opcional)',
                    placeholder: '0,00',
                    controller: _initialBalanceController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      const CentsInputFormatter(),
                    ],
                    textInputAction: TextInputAction.done,
                    leftIcon: const Icon(LucideIcons.wallet, size: 16),
                  ),
                ],
                // ── Current invoice (Credit / Checking) ───────────────────
                if (_hasCurrentInvoice) ...[
                  const SizedBox(height: 14),
                  AppInputField(
                    label: 'Fatura atual (opcional)',
                    placeholder: '0,00',
                    controller: _currentInvoiceController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      const CentsInputFormatter(),
                    ],
                    textInputAction: TextInputAction.done,
                    leftIcon: const Icon(LucideIcons.receipt, size: 16),
                  ),
                ],
                const SizedBox(height: 20),
                // ── Toggles ───────────────────────────────────────────────
                GlassCard(
                  child: _ToggleRow(
                    label: 'Conta padrão',
                    subtitle: 'Pré-selecionar em novas transações',
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
                        label: 'Salvar',
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

// ── Billing Day Picker ────────────────────────────────────────────────────────

class _BillingDayPicker extends StatelessWidget {
  const _BillingDayPicker({required this.selected, required this.onChanged});

  final int? selected;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Dia de vencimento',
          style: AppTextStyles.caption(t.txtSecondary)
              .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 36,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: 31,
            separatorBuilder: (_, _) => const SizedBox(width: 6),
            itemBuilder: (context, index) {
              final day = index + 1;
              final isSelected = selected == day;
              return GestureDetector(
                onTap: () => onChanged(day),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? t.primary
                        : t.isDark
                            ? Colors.white.withValues(alpha: 0.07)
                            : t.surfaceEl,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected
                          ? t.primary
                          : t.isDark
                              ? Colors.white.withValues(alpha: 0.1)
                              : t.mist,
                      width: 1,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '$day',
                    style: AppTextStyles.caption(
                      isSelected ? Colors.white : t.txtSecondary,
                    ).copyWith(
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.w500,
                      fontSize: 12,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
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
          'Banco (opcional)',
          style: AppTextStyles.caption(t.txtSecondary)
              .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 5),
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: 48,
            decoration: BoxDecoration(
              color: t.surfaceEl,
              borderRadius: AppRadius.baseAll,
              border: Border.all(
                color: t.mist,
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
                    selected ?? 'Selecionar banco...',
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

  // Display labels (pt-BR) mapped from the backend wire values above.
  // The stored/sent `type` keeps the English key; only the label is localized.
  static const _labels = {
    'Debit': 'Débito',
    'Checking': 'Conta corrente',
    'Savings': 'Poupança',
    'Credit': 'Crédito',
    'Cash': 'Dinheiro',
  };

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tipo de conta',
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
                        _labels[type]!,
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
