import 'dart:ui';

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
import '../../accounts/data/models/account.dart';
import '../../categories/providers/subcategories_provider.dart';
import '../data/dtos/category_response_dto.dart';
import '../data/dtos/create_transaction_request_dto.dart';
import '../providers/picker_providers.dart';
import '../providers/transaction_provider.dart';

// ── Enums ──────────────────────────────────────────────────────────────────

enum _TxType { expense, income }

enum _PaymentType { oneTime, installment, recurring }

// ── Recurrence options ─────────────────────────────────────────────────────

const _recurrenceOptions = [
  'Daily',
  'WorkDay',
  'Weekly',
  'Biweekly',
  'Monthly',
  'Quarterly',
  'Semiannually',
  'Annually',
];

// ── Page ───────────────────────────────────────────────────────────────────

class AddTransactionPage extends ConsumerStatefulWidget {
  const AddTransactionPage({super.key});

  @override
  ConsumerState<AddTransactionPage> createState() =>
      _AddTransactionPageState();
}

class _AddTransactionPageState extends ConsumerState<AddTransactionPage> {
  _TxType _type = _TxType.expense;
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();

  int? _subcategoryId;
  String? _subcategoryName;
  int? _accountId;
  String? _accountName;
  DateTime _date = DateTime.now();
  _PaymentType _paymentType = _PaymentType.oneTime;
  int _installmentCount = 2;
  String? _recurrence;
  bool _includeInBudget = true;

  // Validation errors
  String? _accountError;
  String? _valueError;
  String? _subcategoryError;
  String? _installmentsError;
  String? _recurrenceError;

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  bool _validate() {
    String? accountError;
    String? valueError;
    String? subcategoryError;
    String? installmentsError;
    String? recurrenceError;

    final valueInCents = CentsInputFormatter.parseCents(_amountController.text);
    if (valueInCents <= 0) valueError = 'Enter a valid amount';

    if (_accountId == null) accountError = 'Select an account';

    if (_subcategoryId == null) subcategoryError = 'Select a subcategory';

    if (_paymentType == _PaymentType.installment && _installmentCount < 2) {
      installmentsError = 'Minimum 2 installments';
    }

    if (_paymentType == _PaymentType.recurring &&
        (_recurrence == null || _recurrence!.isEmpty)) {
      recurrenceError = 'Select the recurrence';
    }

    setState(() {
      _accountError = accountError;
      _valueError = valueError;
      _subcategoryError = subcategoryError;
      _installmentsError = installmentsError;
      _recurrenceError = recurrenceError;
    });

    return accountError == null &&
        valueError == null &&
        subcategoryError == null &&
        installmentsError == null &&
        recurrenceError == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    final valueInCents = CentsInputFormatter.parseCents(_amountController.text);

    final dto = CreateTransactionRequestDto(
      subCategoryId: _subcategoryId!,
      accountId: _accountId!,
      value: valueInCents,
      type: _type == _TxType.expense ? 'Expense' : 'Income',
      transactionDate: _formatDateIso(_date),
      paymentType: switch (_paymentType) {
        _PaymentType.oneTime => 'OneTime',
        _PaymentType.installment => 'Installment',
        _PaymentType.recurring => 'Recurring',
      },
      includeInBudget: _includeInBudget,
      description: _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      totalInstallments:
          _paymentType == _PaymentType.installment ? _installmentCount : null,
      recurrence:
          _paymentType == _PaymentType.recurring ? _recurrence : null,
    );

    await ref.read(createTransactionProvider.notifier).submit(dto);

    final result = ref.read(createTransactionProvider);
    if (!mounted) return;

    switch (result) {
      case CreateTransactionSuccess(:final transactions):
        final count = transactions.length;
        final isInstallment = _paymentType == _PaymentType.installment;
        final message = isInstallment
            ? '$count installments created successfully'
            : 'Transaction saved successfully';

        ref.read(createTransactionProvider.notifier).reset();
        context.pop();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFF7C3AED),
          ),
        );

      case CreateTransactionError(:final message):
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(message),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.red.shade700,
          ),
        );

      default:
        break;
    }
  }

  // ── Pickers ───────────────────────────────────────────────────────────────

  void _openSubcategoryPicker(List<CategoryResponseDto> categories) {
    Navigator.of(context).push(
      PageRouteBuilder(
        opaque: false,
        barrierColor: Colors.black.withValues(alpha: 0.5),
        pageBuilder: (_, _, _) => _SubcategoryPickerPage(
          categories: categories,
          selectedId: _subcategoryId,
          onSelected: (id, name) {
            setState(() {
              _subcategoryId = id;
              _subcategoryName = name;
              _subcategoryError = null;
            });
          },
        ),
        transitionsBuilder: (_, animation, _, child) {
          return SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 1),
              end: Offset.zero,
            ).animate(
                CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
            child: child,
          );
        },
      ),
    );
  }

  void _openAccountPicker(List<Account> accounts) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _AccountPickerSheet(
        accounts: accounts,
        selectedId: _accountId,
        onSelected: (id, name) {
          setState(() {
            _accountId = id;
            _accountName = name;
            _accountError = null;
          });
        },
      ),
    );
  }

  void _openRecurrencePicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _RecurrencePickerSheet(
        selected: _recurrence,
        onSelected: (value) {
          setState(() {
            _recurrence = value;
            _recurrenceError = null;
          });
        },
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    final txState = ref.watch(createTransactionProvider);
    final isLoading = txState is CreateTransactionLoading;

    final accountsAsync = ref.watch(accountsProvider);
    final categoriesAsync = ref.watch(categoriesProvider);

    // Pre-select the default account once accounts load.
    ref.listen(accountsProvider, (_, next) {
      next.whenData((accounts) {
        if (_accountId == null && accounts.isNotEmpty) {
          final defaultAcc = accounts.firstWhere(
            (a) => a.isDefault,
            orElse: () => accounts.first,
          );
          setState(() {
            _accountId = defaultAcc.id;
            _accountName = defaultAcc.name;
          });
        }
      });
    });

    return Scaffold(
      backgroundColor: t.bg,
      bottomNavigationBar: Padding(
        padding: EdgeInsets.fromLTRB(24, 12, 24, bottomPad + 24),
        child: _SaveButton(onTap: isLoading ? null : _submit, isLoading: isLoading),
      ),
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // ── App bar ──────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    _NavButton(
                      icon: LucideIcons.arrowLeft,
                      onTap: isLoading ? null : () => context.pop(),
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

              // ── Type toggle ──────────────────────────────────────────────
              Padding(
                padding: AppSpacing.screenPadding,
                child: _TypeToggle(
                  selected: _type,
                  onChanged: isLoading
                      ? null
                      : (v) => setState(() => _type = v),
                ),
              ),

              const SizedBox(height: 20),

              // ── Amount display ───────────────────────────────────────────
              Padding(
                padding: AppSpacing.screenPadding,
                child: _AmountDisplay(
                  type: _type,
                  controller: _amountController,
                  errorText: _valueError,
                ),
              ),

              const SizedBox(height: 20),

              // ── Scrollable form ──────────────────────────────────────────
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
                  children: [
                    // Card 1 — Subcategory + Account
                    _FormCard(
                      children: [
                        _FieldRow(
                          label: 'Subcategory',
                          value: _subcategoryName ?? 'Select',
                          errorText: _subcategoryError,
                          onTap: isLoading
                              ? () {}
                              : () => _openSubcategoryPicker(
                                    categoriesAsync.valueOrNull ?? [],
                                  ),
                          showDivider: true,
                        ),
                        _FieldRow(
                          label: 'Account',
                          value: _accountName ?? 'Select',
                          onTap: isLoading
                              ? () {}
                              : () => _openAccountPicker(
                                    accountsAsync.valueOrNull ?? [],
                                  ),
                          errorText: _accountError,
                          showDivider: false,
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Card 2 — Date + Description
                    _FormCard(
                      children: [
                        _FieldRow(
                          label: 'Date',
                          value: _formatDate(_date),
                          onTap: isLoading
                              ? () {}
                              : () async {
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
                          showDivider: true,
                        ),
                        _DescriptionField(controller: _descriptionController),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Card 3 — Payment type + Stepper / Recurrence
                    _FormCard(
                      children: [
                        _PaymentTypeSection(
                          selected: _paymentType,
                          onChanged: isLoading
                              ? null
                              : (v) => setState(() {
                                    _paymentType = v;
                                    _installmentsError = null;
                                    _recurrenceError = null;
                                  }),
                        ),
                        AnimatedSize(
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOutCubic,
                          child: _paymentType == _PaymentType.installment
                              ? Column(
                                  children: [
                                    _InternalDivider(),
                                    _InstallmentStepper(
                                      count: _installmentCount,
                                      onChanged: isLoading
                                          ? null
                                          : (v) => setState(() {
                                                _installmentCount = v;
                                                _installmentsError = null;
                                              }),
                                      errorText: _installmentsError,
                                    ),
                                  ],
                                )
                              : const SizedBox.shrink(),
                        ),
                        AnimatedSize(
                          duration: const Duration(milliseconds: 220),
                          curve: Curves.easeOutCubic,
                          child: _paymentType == _PaymentType.recurring
                              ? Column(
                                  children: [
                                    _InternalDivider(),
                                    _FieldRow(
                                      label: 'Recurrence',
                                      value: _recurrence ?? 'Select',
                                      onTap: isLoading
                                          ? () {}
                                          : _openRecurrencePicker,
                                      errorText: _recurrenceError,
                                      showDivider: false,
                                    ),
                                  ],
                                )
                              : const SizedBox.shrink(),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Card 4 — Include in budget
                    _FormCard(
                      children: [
                        _IncludeInBudgetRow(
                          value: _includeInBudget,
                          onChanged: isLoading
                              ? null
                              : (v) => setState(() => _includeInBudget = v),
                        ),
                      ],
                    ),
                  ],
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

  String _formatDateIso(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

// ── Nav Button ──────────────────────────────────────────────────────────────

class _NavButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onTap;
  const _NavButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: t.isDark
              ? Colors.white.withValues(alpha: 0.08)
              : t.primary.withValues(alpha: 0.08),
        ),
        child: Icon(icon, size: 18, color: t.txtPrimary),
      ),
    );
  }
}

// ── Save Button ─────────────────────────────────────────────────────────────

class _SaveButton extends StatelessWidget {
  final VoidCallback? onTap;
  final bool isLoading;
  const _SaveButton({required this.onTap, required this.isLoading});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap == null ? 0.6 : 1.0,
        child: Container(
          height: 48,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: AppRadius.baseAll,
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF7C3AED).withValues(alpha: 0.30),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Text(
                    'Save Transaction',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}

// ── Type Toggle ─────────────────────────────────────────────────────────────

class _TypeToggle extends StatelessWidget {
  final _TxType selected;
  final ValueChanged<_TxType>? onChanged;

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
        borderRadius: AppRadius.baseAll,
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
              onTap: onChanged == null ? null : () => onChanged!(_TxType.expense),
            ),
          ),
          Expanded(
            child: _TypeTab(
              label: 'Income',
              active: selected == _TxType.income,
              activeColor: t.success,
              onTap: onChanged == null ? null : () => onChanged!(_TxType.income),
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
  final VoidCallback? onTap;

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
              ? activeColor.withValues(alpha: t.isDark ? 0.22 : 0.08)
              : Colors.transparent,
          borderRadius: AppRadius.smAll,
          border: active
              ? Border.all(
                  color: activeColor.withValues(alpha: t.isDark ? 0.5 : 0.25),
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
  final String? errorText;

  const _AmountDisplay({
    required this.type,
    required this.controller,
    this.errorText,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final isExpense = type == _TxType.expense;
    final accentColor = isExpense ? t.error : t.success;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
      decoration: const BoxDecoration(),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                'R\$',
                style: AppTextStyles.mono(t.txtSecondary, fontSize: 26)
                    .copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 6),
              IntrinsicWidth(
                child: TextField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    const CentsInputFormatter(),
                  ],
                  style: AppTextStyles.moneyLg(accentColor).copyWith(
                    fontSize: 36,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -1,
                  ),
                  decoration: InputDecoration(
                    hintText: '0,00',
                    hintStyle: AppTextStyles.moneyLg(
                      accentColor.withValues(alpha: 0.35),
                    ).copyWith(
                      fontSize: 36,
                      fontWeight: FontWeight.w700,
                      letterSpacing: -1,
                    ),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    filled: false,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          if (errorText != null) ...[
            const SizedBox(height: 4),
            Text(
              errorText!,
              style: AppTextStyles.caption(t.error).copyWith(fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Form Card (glass) ───────────────────────────────────────────────────────

class _FormCard extends StatelessWidget {
  final List<Widget> children;
  const _FormCard({required this.children});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          decoration: BoxDecoration(
            color: t.isDark
                ? const Color(0xFF1C1830).withValues(alpha: 0.72)
                : Colors.white.withValues(alpha: 0.82),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.07)
                  : const Color(0xFF7C3AED).withValues(alpha: 0.13),
            ),
            boxShadow: t.isDark
                ? []
                : [
                    BoxShadow(
                      color: const Color(0xFF6D28D9).withValues(alpha: 0.07),
                      blurRadius: 12,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: children,
          ),
        ),
      ),
    );
  }
}

// ── Internal Divider ────────────────────────────────────────────────────────

class _InternalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Divider(
      height: 1,
      thickness: 1,
      color: t.isDark
          ? Colors.white.withValues(alpha: 0.06)
          : const Color(0xFF7C3AED).withValues(alpha: 0.07),
    );
  }
}

// ── Field Row ───────────────────────────────────────────────────────────────

class _FieldRow extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onTap;
  final String? errorText;
  final bool showDivider;

  const _FieldRow({
    required this.label,
    required this.value,
    required this.onTap,
    this.errorText,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
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
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      value,
                      style: AppTextStyles.body(
                        errorText != null ? t.error : t.txtPrimary,
                      ).copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(LucideIcons.chevronRight, size: 16, color: t.txtDisabled),
                  ],
                ),
              ],
            ),
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(
              errorText!,
              style: AppTextStyles.caption(t.error).copyWith(fontSize: 11),
            ),
          ),
        if (showDivider) _InternalDivider(),
      ],
    );
  }
}

// ── Description Field ───────────────────────────────────────────────────────

class _DescriptionField extends StatelessWidget {
  final TextEditingController controller;

  const _DescriptionField({required this.controller});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'Description',
            style: AppTextStyles.body(t.txtSecondary).copyWith(
              fontSize: 14,
              fontWeight: FontWeight.w400,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: controller,
              textAlign: TextAlign.end,
              textCapitalization: TextCapitalization.sentences,
              style: AppTextStyles.body(t.txtPrimary).copyWith(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                hintText: 'Optional',
                hintStyle: AppTextStyles.body(t.txtDisabled).copyWith(
                  fontSize: 14,
                  fontStyle: FontStyle.italic,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Payment Type Section ────────────────────────────────────────────────────

class _PaymentTypeSection extends StatelessWidget {
  final _PaymentType selected;
  final ValueChanged<_PaymentType>? onChanged;

  const _PaymentTypeSection({
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment type',
            style: AppTextStyles.caption(t.txtSecondary).copyWith(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _PaymentChip(
                  label: 'One-time',
                  active: selected == _PaymentType.oneTime,
                  onTap: onChanged == null
                      ? null
                      : () => onChanged!(_PaymentType.oneTime),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _PaymentChip(
                  label: 'Installment',
                  active: selected == _PaymentType.installment,
                  onTap: onChanged == null
                      ? null
                      : () => onChanged!(_PaymentType.installment),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _PaymentChip(
                  label: 'Recurring',
                  active: selected == _PaymentType.recurring,
                  onTap: onChanged == null
                      ? null
                      : () => onChanged!(_PaymentType.recurring),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PaymentChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback? onTap;

  const _PaymentChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 38,
        decoration: BoxDecoration(
          color: active
              ? t.primary.withValues(alpha: t.isDark ? 0.20 : 0.10)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            width: active ? 1.5 : 1,
            color: active
                ? t.primary.withValues(alpha: t.isDark ? 0.55 : 0.45)
                : t.isDark
                    ? Colors.white.withValues(alpha: 0.12)
                    : const Color(0xFF7C3AED).withValues(alpha: 0.15),
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: AppTextStyles.caption(
              active ? t.primary : t.txtTertiary,
            ).copyWith(
              fontSize: 12,
              fontWeight: active ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ),
    );
  }
}

// ── Installment Stepper ─────────────────────────────────────────────────────

class _InstallmentStepper extends StatelessWidget {
  final int count;
  final ValueChanged<int>? onChanged;
  final String? errorText;

  const _InstallmentStepper({
    required this.count,
    required this.onChanged,
    this.errorText,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'No. of installments',
                style: AppTextStyles.body(t.txtSecondary).copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                ),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      if (count > 2) onChanged?.call(count - 1);
                    },
                    child: Container(
                      width: 36,
                      height: 34,
                      decoration: BoxDecoration(
                        color: t.isDark
                            ? t.primary.withValues(alpha: 0.14)
                            : const Color(0xFF7C3AED).withValues(alpha: 0.08),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(8),
                          bottomLeft: Radius.circular(8),
                        ),
                      ),
                      child: Icon(
                        LucideIcons.minus,
                        size: 16,
                        color: count > 2 ? t.primary : t.txtDisabled,
                      ),
                    ),
                  ),
                  Container(
                    width: 48,
                    height: 34,
                    decoration: BoxDecoration(
                      color: t.isDark
                          ? Colors.white.withValues(alpha: 0.06)
                          : const Color(0xFFEDE9FE).withValues(alpha: 0.5),
                    ),
                    child: Center(
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 150),
                        transitionBuilder: (child, animation) =>
                            ScaleTransition(scale: animation, child: child),
                        child: Text(
                          '$count',
                          key: ValueKey(count),
                          style: AppTextStyles.mono(t.txtPrimary, fontSize: 14)
                              .copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => onChanged?.call(count + 1),
                    child: Container(
                      width: 36,
                      height: 34,
                      decoration: BoxDecoration(
                        color: t.isDark
                            ? t.primary.withValues(alpha: 0.14)
                            : const Color(0xFF7C3AED).withValues(alpha: 0.08),
                        borderRadius: const BorderRadius.only(
                          topRight: Radius.circular(8),
                          bottomRight: Radius.circular(8),
                        ),
                      ),
                      child: Icon(LucideIcons.plus, size: 16, color: t.primary),
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (errorText != null) ...[
            const SizedBox(height: 6),
            Text(
              errorText!,
              style: AppTextStyles.caption(t.error).copyWith(fontSize: 11),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Include In Budget Row ───────────────────────────────────────────────────

class _IncludeInBudgetRow extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;

  const _IncludeInBudgetRow({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Include in budget?',
                  style: AppTextStyles.body(t.txtPrimary).copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Consider this transaction in budget limits',
                  style: AppTextStyles.caption(t.txtTertiary).copyWith(
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          _BudgetToggle(value: value, onChanged: onChanged),
        ],
      ),
    );
  }
}

// ── Budget Toggle ───────────────────────────────────────────────────────────

class _BudgetToggle extends StatelessWidget {
  final bool value;
  final ValueChanged<bool>? onChanged;

  const _BudgetToggle({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onChanged == null ? null : () => onChanged!(!value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 48,
        height: 28,
        decoration: BoxDecoration(
          gradient: value
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
                )
              : null,
          color: value
              ? null
              : t.isDark
                  ? Colors.white.withValues(alpha: 0.12)
                  : Colors.black.withValues(alpha: 0.14),
          borderRadius: AppRadius.pillAll,
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          alignment: value ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.all(3),
            width: 22,
            height: 22,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 4,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Subcategory Picker Page ─────────────────────────────────────────────────

class _SubcategoryPickerPage extends ConsumerStatefulWidget {
  final List<CategoryResponseDto> categories;
  final int? selectedId;
  final void Function(int id, String name) onSelected;

  const _SubcategoryPickerPage({
    required this.categories,
    required this.selectedId,
    required this.onSelected,
  });

  @override
  ConsumerState<_SubcategoryPickerPage> createState() =>
      _SubcategoryPickerPageState();
}

class _SubcategoryPickerPageState
    extends ConsumerState<_SubcategoryPickerPage> {
  final _searchController = TextEditingController();
  String _filter = '';
  late List<CategoryResponseDto> _categories;

  @override
  void initState() {
    super.initState();
    _categories = List.from(widget.categories);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _openCreateSubcategorySheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => _PickerCreateSubcategorySheet(
        categories: _categories,
        onCreated: () async {
          final updated = await ref.read(categoriesProvider.future);
          if (mounted) setState(() => _categories = updated);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;
    final q = _filter.trim().toLowerCase();

    final filtered = _categories
        .map((cat) {
          if (q.isEmpty) return cat;
          final catMatches = cat.name.toLowerCase().contains(q);
          final matchingSubs = cat.subCategories
              .where((s) => s.name.toLowerCase().contains(q))
              .toList();
          if (!catMatches && matchingSubs.isEmpty) return null;
          return CategoryResponseDto(
            id: cat.id,
            name: cat.name,
            subCategories: catMatches ? cat.subCategories : matchingSubs,
          );
        })
        .whereType<CategoryResponseDto>()
        .where((c) => c.subCategories.isNotEmpty)
        .toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // App bar
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    _NavButton(
                      icon: LucideIcons.arrowLeft,
                      onTap: () => Navigator.of(context).pop(),
                    ),
                    Expanded(
                      child: Text(
                        'Subcategoria',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body(t.txtPrimary).copyWith(
                          fontWeight: FontWeight.w700,
                          fontSize: 17,
                        ),
                      ),
                    ),
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/categories/edit');
                      },
                      child: Text(
                        'Editar',
                        style: AppTextStyles.body(t.primary).copyWith(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Search field
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  height: 42,
                  decoration: BoxDecoration(
                    color: t.isDark
                        ? Colors.white.withValues(alpha: 0.06)
                        : t.primary.withValues(alpha: 0.05),
                    borderRadius: AppRadius.baseAll,
                    border: Border.all(
                      color: t.primary.withValues(alpha: 0.15),
                    ),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _filter = v),
                    style: AppTextStyles.body(t.txtPrimary)
                        .copyWith(fontSize: 14),
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 11),
                      hintText: 'Buscar subcategoria...',
                      hintStyle: AppTextStyles.body(t.txtDisabled)
                          .copyWith(fontSize: 14),
                      prefixIcon: Icon(LucideIcons.search,
                          size: 16, color: t.txtDisabled),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Action buttons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: _openCreateSubcategorySheet,
                        child: Container(
                          height: 44,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: AppRadius.baseAll,
                            boxShadow: AppShadows.primaryBtnShadow,
                          ),
                          child: Center(
                            child: Text(
                              '+ Nova Sub',
                              style: AppTextStyles.body(Colors.white).copyWith(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: GestureDetector(
                        onTap: () {
                          Navigator.of(context).pop();
                          context.push('/categories/create');
                        },
                        child: Container(
                          height: 44,
                          decoration: BoxDecoration(
                            color: t.isDark
                                ? const Color(0xFF1C1830)
                                    .withValues(alpha: 0.72)
                                : Colors.white.withValues(alpha: 0.9),
                            borderRadius: AppRadius.baseAll,
                            border: Border.all(
                                color: t.primary.withValues(alpha: 0.4),
                                width: 1.5),
                          ),
                          child: Center(
                            child: Text(
                              '+ Categoria',
                              style: AppTextStyles.body(t.primary).copyWith(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Subcategory list
              Expanded(
                child: filtered.isEmpty
                    ? Center(
                        child: Text(
                          'Nenhuma subcategoria encontrada.',
                          style: AppTextStyles.body(t.txtTertiary),
                        ),
                      )
                    : ListView(
                        padding:
                            EdgeInsets.fromLTRB(16, 0, 16, bottomPad + 32),
                        children: filtered.map((cat) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                padding: const EdgeInsets.only(
                                    top: 16, bottom: 8),
                                child: Text(
                                  cat.name.toUpperCase(),
                                  style: AppTextStyles.caption(t.primary)
                                      .copyWith(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 0.8,
                                  ),
                                ),
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  color: t.isDark
                                      ? const Color(0xFF1C1830)
                                          .withValues(alpha: 0.72)
                                      : Colors.white.withValues(alpha: 0.9),
                                  borderRadius: AppRadius.xlAll,
                                  border: Border.all(
                                    color: t.isDark
                                        ? Colors.white.withValues(alpha: 0.07)
                                        : const Color(0xFF7C3AED)
                                            .withValues(alpha: 0.12),
                                  ),
                                  boxShadow:
                                      t.isDark ? [] : AppShadows.cardLight,
                                ),
                                child: Column(
                                  children: cat.subCategories
                                      .asMap()
                                      .entries
                                      .map((e) {
                                    final sub = e.value;
                                    final isLast = e.key ==
                                        cat.subCategories.length - 1;
                                    final isSelected =
                                        sub.id == widget.selectedId;

                                    return Column(
                                      children: [
                                        GestureDetector(
                                          behavior: HitTestBehavior.opaque,
                                          onTap: () {
                                            widget.onSelected(
                                                sub.id, sub.name);
                                            Navigator.of(context).pop();
                                          },
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 16, vertical: 14),
                                            child: Row(
                                              children: [
                                                Expanded(
                                                  child: Text(
                                                    sub.name,
                                                    style: AppTextStyles.body(
                                                      isSelected
                                                          ? t.primary
                                                          : t.txtPrimary,
                                                    ).copyWith(
                                                      fontSize: 14,
                                                      fontWeight: isSelected
                                                          ? FontWeight.w600
                                                          : FontWeight.w400,
                                                    ),
                                                  ),
                                                ),
                                                if (isSelected)
                                                  Icon(LucideIcons.check,
                                                      size: 16,
                                                      color: t.primary)
                                                else
                                                  Icon(
                                                    LucideIcons.chevronRight,
                                                    size: 16,
                                                    color: t.txtDisabled,
                                                  ),
                                              ],
                                            ),
                                          ),
                                        ),
                                        if (!isLast)
                                          Divider(
                                            height: 1,
                                            thickness: 1,
                                            indent: 16,
                                            color: t.divider.withValues(
                                                alpha: t.isDark ? 0.2 : 0.4),
                                          ),
                                      ],
                                    );
                                  }).toList(),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Picker: Create Subcategory Sheet ─────────────────────────────────────────

class _PickerCreateSubcategorySheet extends ConsumerStatefulWidget {
  final List<CategoryResponseDto> categories;
  final VoidCallback onCreated;

  const _PickerCreateSubcategorySheet({
    required this.categories,
    required this.onCreated,
  });

  @override
  ConsumerState<_PickerCreateSubcategorySheet> createState() =>
      _PickerCreateSubcategorySheetState();
}

class _PickerCreateSubcategorySheetState
    extends ConsumerState<_PickerCreateSubcategorySheet> {
  final _nameController = TextEditingController();
  int? _selectedCategoryId;
  bool _loading = false;
  String? _nameError;

  @override
  void initState() {
    super.initState();
    if (widget.categories.isNotEmpty) {
      _selectedCategoryId = widget.categories.first.id;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _nameError = 'Digite um nome');
      return;
    }
    if (_selectedCategoryId == null) return;

    setState(() {
      _loading = true;
      _nameError = null;
    });
    try {
      await ref
          .read(subcategoriesNotifierProvider.notifier)
          .create(name, _selectedCategoryId!);
      if (mounted) {
        Navigator.of(context).pop();
        widget.onCreated();
      }
    } catch (_) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Erro ao criar subcategoria.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Padding(
      padding:
          EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        decoration: BoxDecoration(
          color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
          borderRadius: const BorderRadius.vertical(
              top: Radius.circular(AppRadius.xl3)),
          boxShadow: AppShadows.bottomSheet,
        ),
        padding: EdgeInsets.fromLTRB(24, 0, 24, bottomPad + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 20),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: t.isDark
                      ? Colors.white.withValues(alpha: 0.15)
                      : Colors.black.withValues(alpha: 0.12),
                  borderRadius: AppRadius.pillAll,
                ),
              ),
            ),
            Text('Nova Subcategoria',
                style: AppTextStyles.h3(t.txtPrimary)),
            const SizedBox(height: 20),
            Text(
              'Nome',
              style: AppTextStyles.caption(t.txtSecondary)
                  .copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _nameController,
              autofocus: true,
              textCapitalization: TextCapitalization.sentences,
              style:
                  AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 15),
              decoration: InputDecoration(
                hintText: 'Ex: Aluguel',
                hintStyle: AppTextStyles.body(t.txtDisabled)
                    .copyWith(fontSize: 15),
                errorText: _nameError,
                filled: true,
                fillColor: t.isDark
                    ? Colors.white.withValues(alpha: 0.05)
                    : t.primary.withValues(alpha: 0.04),
                border: OutlineInputBorder(
                  borderRadius: AppRadius.baseAll,
                  borderSide: BorderSide(
                      color: t.primary.withValues(alpha: 0.2)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: AppRadius.baseAll,
                  borderSide: BorderSide(
                      color: t.primary.withValues(alpha: 0.2)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: AppRadius.baseAll,
                  borderSide: BorderSide(color: t.primary, width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Categoria',
              style: AppTextStyles.caption(t.txtSecondary)
                  .copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: t.isDark
                    ? Colors.white.withValues(alpha: 0.05)
                    : t.primary.withValues(alpha: 0.04),
                borderRadius: AppRadius.baseAll,
                border: Border.all(
                    color: t.primary.withValues(alpha: 0.2), width: 1),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int>(
                  value: _selectedCategoryId,
                  isExpanded: true,
                  dropdownColor:
                      t.isDark ? const Color(0xFF1C1830) : Colors.white,
                  style: AppTextStyles.body(t.txtPrimary)
                      .copyWith(fontSize: 15),
                  items: widget.categories
                      .map((c) => DropdownMenuItem(
                          value: c.id, child: Text(c.name)))
                      .toList(),
                  onChanged: (v) =>
                      setState(() => _selectedCategoryId = v),
                ),
              ),
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: _loading ? null : _submit,
              child: Container(
                height: 50,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: _loading ? null : AppColors.primaryGradient,
                  color: _loading
                      ? t.primary.withValues(alpha: 0.4)
                      : null,
                  borderRadius: AppRadius.baseAll,
                  boxShadow: _loading ? [] : AppShadows.primaryBtnShadow,
                ),
                child: Center(
                  child: _loading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          'Criar',
                          style: AppTextStyles.body(Colors.white).copyWith(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Account Picker Bottom Sheet ─────────────────────────────────────────────

class _AccountPickerSheet extends StatefulWidget {
  final List<Account> accounts;
  final int? selectedId;
  final void Function(int id, String name) onSelected;

  const _AccountPickerSheet({
    required this.accounts,
    required this.selectedId,
    required this.onSelected,
  });

  @override
  State<_AccountPickerSheet> createState() => _AccountPickerSheetState();
}

class _AccountPickerSheetState extends State<_AccountPickerSheet> {
  bool _editMode = false;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Container(
      decoration: BoxDecoration(
        color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.xl3),
        ),
        boxShadow: AppShadows.bottomSheet,
      ),
      padding: EdgeInsets.fromLTRB(0, 0, 0, bottomPad + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.15)
                  : Colors.black.withValues(alpha: 0.12),
              borderRadius: AppRadius.pillAll,
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 16, 16),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    _editMode ? 'Edit Accounts' : 'Select Account',
                    style: AppTextStyles.h3(t.txtPrimary),
                  ),
                ),
                // Edit toggle button
                GestureDetector(
                  onTap: () => setState(() => _editMode = !_editMode),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: _editMode
                          ? t.primary.withValues(alpha: 0.15)
                          : t.isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : t.primary.withValues(alpha: 0.08),
                    ),
                    child: Icon(
                      LucideIcons.pencil,
                      size: 14,
                      color: _editMode ? t.primary : t.txtSecondary,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Add button
                GestureDetector(
                  onTap: () {
                    // TODO: navigate to add account page
                  },
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: t.isDark
                          ? Colors.white.withValues(alpha: 0.08)
                          : t.primary.withValues(alpha: 0.08),
                    ),
                    child: Icon(LucideIcons.plus, size: 16, color: t.primary),
                  ),
                ),
              ],
            ),
          ),
          // List
          if (widget.accounts.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Text(
                'No accounts found.',
                style: AppTextStyles.body(t.txtTertiary),
              ),
            )
          else
            ...widget.accounts.map((acc) {
              final isSelected = acc.id == widget.selectedId;
              return GestureDetector(
                onTap: _editMode
                    ? () {
                        // TODO: navigate to edit account page
                      }
                    : () {
                        widget.onSelected(acc.id, acc.name);
                        Navigator.of(context).pop();
                      },
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 20, vertical: 14),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.primary
                              .withValues(alpha: t.isDark ? 0.2 : 0.1),
                        ),
                        child: Icon(LucideIcons.wallet,
                            size: 18, color: t.primary),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          acc.name,
                          style: AppTextStyles.body(
                            !_editMode && isSelected
                                ? t.primary
                                : t.txtPrimary,
                          ).copyWith(
                            fontSize: 14,
                            fontWeight: !_editMode && isSelected
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                      ),
                      if (_editMode)
                        Icon(LucideIcons.pencil,
                            size: 14, color: t.txtDisabled)
                      else if (isSelected)
                        Icon(LucideIcons.check, size: 18, color: t.primary),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }
}

// ── Recurrence Picker Bottom Sheet ──────────────────────────────────────────

class _RecurrencePickerSheet extends StatelessWidget {
  final String? selected;
  final ValueChanged<String> onSelected;

  const _RecurrencePickerSheet({
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Container(
      decoration: BoxDecoration(
        color: t.isDark ? const Color(0xFF1C1830) : Colors.white,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppRadius.xl3),
        ),
        boxShadow: AppShadows.bottomSheet,
      ),
      padding: EdgeInsets.fromLTRB(0, 0, 0, bottomPad + 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 12, bottom: 8),
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.15)
                  : Colors.black.withValues(alpha: 0.12),
              borderRadius: AppRadius.pillAll,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text('Select Recurrence',
                  style: AppTextStyles.h3(t.txtPrimary)),
            ),
          ),
          ..._recurrenceOptions.map((option) {
            final isSelected = option == selected;
            return GestureDetector(
              onTap: () {
                onSelected(option);
                Navigator.of(context).pop();
              },
              behavior: HitTestBehavior.opaque,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 14),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      option,
                      style: AppTextStyles.body(
                        isSelected ? t.primary : t.txtPrimary,
                      ).copyWith(
                        fontSize: 14,
                        fontWeight:
                            isSelected ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                    if (isSelected)
                      Icon(LucideIcons.check, size: 18, color: t.primary),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
