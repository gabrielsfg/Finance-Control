import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../accounts/data/models/account.dart';
import '../data/dtos/update_recurring_request_dto.dart';
import '../data/dtos/update_transaction_request_dto.dart';
import '../data/dtos/category_response_dto.dart';
import '../data/models/transaction_item.dart';
import '../providers/picker_providers.dart';
import '../providers/transaction_provider.dart';

class EditTransactionPage extends ConsumerStatefulWidget {
  final TransactionItem transaction;

  const EditTransactionPage({super.key, required this.transaction});

  @override
  ConsumerState<EditTransactionPage> createState() =>
      _EditTransactionPageState();
}

class _EditTransactionPageState extends ConsumerState<EditTransactionPage> {
  late final TextEditingController _amountController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _endDateController;

  late int? _subcategoryId;
  late String? _subcategoryName;
  late int? _accountId;
  late String? _accountName;
  late DateTime _date;
  late int? _budgetId;
  DateTime? _recurringEndDate;

  String? _accountError;
  String? _valueError;
  String? _subcategoryError;

  bool get _isRecurring =>
      widget.transaction.paymentType == 'Recurring' &&
      widget.transaction.recurringTransactionId != null;

  @override
  void initState() {
    super.initState();
    final tx = widget.transaction;
    // Build the initial formatted string from cents digits.
    final digits = tx.amountCents.abs().toString();
    final padded = digits.padLeft(3, '0');
    final intPart = padded
        .substring(0, padded.length - 2)
        .replaceFirst(RegExp(r'^0+'), '');
    final centPart = padded.substring(padded.length - 2);
    final intFormatted = intPart.isEmpty ? '0' : intPart;
    _amountController = TextEditingController(
      text: '$intFormatted,$centPart',
    );
    _descriptionController =
        TextEditingController(text: tx.description ?? '');
    _endDateController = TextEditingController();
    _subcategoryId = tx.subCategoryId;
    _subcategoryName = tx.subCategoryName;
    _accountId = tx.accountId;
    _accountName = tx.accountName;
    _date = tx.date;
    _budgetId = tx.budgetId;
  }

  @override
  void dispose() {
    _amountController.dispose();
    _descriptionController.dispose();
    _endDateController.dispose();
    super.dispose();
  }

  bool _validate() {
    String? accountError;
    String? valueError;
    String? subcategoryError;

    final valueInCents = CentsInputFormatter.parseCents(_amountController.text);
    if (valueInCents <= 0) valueError = 'Enter a valid amount';
    if (_accountId == null) accountError = 'Select an account';
    if (_subcategoryId == null) subcategoryError = 'Select a subcategory';

    setState(() {
      _accountError = accountError;
      _valueError = valueError;
      _subcategoryError = subcategoryError;
    });

    return accountError == null &&
        valueError == null &&
        subcategoryError == null;
  }

  Future<void> _submit() async {
    if (!_validate()) return;

    final valueInCents = CentsInputFormatter.parseCents(_amountController.text);
    final description = _descriptionController.text.trim().isEmpty
        ? null
        : _descriptionController.text.trim();
    final dateStr =
        '${_date.year.toString().padLeft(4, '0')}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}';

    if (_isRecurring) {
      final recurringId = widget.transaction.recurringTransactionId!;
      final endDateStr = _recurringEndDate == null
          ? null
          : '${_recurringEndDate!.year.toString().padLeft(4, '0')}-${_recurringEndDate!.month.toString().padLeft(2, '0')}-${_recurringEndDate!.day.toString().padLeft(2, '0')}';

      await ref.read(transactionActionProvider.notifier).updateRecurring(
            recurringId,
            UpdateRecurringRequestDto(
              subCategoryId: _subcategoryId!,
              accountId: _accountId!,
              value: valueInCents,
              budgetId: _budgetId,
              description: description,
              endDate: endDateStr,
            ),
          );
    } else {
      await ref.read(transactionActionProvider.notifier).update(
            widget.transaction.id,
            UpdateTransactionRequestDto(
              subCategoryId: _subcategoryId!,
              accountId: _accountId!,
              value: valueInCents,
              transactionDate: dateStr,
              budgetId: _budgetId,
              description: description,
            ),
          );
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickEndDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _recurringEndDate ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _recurringEndDate = picked;
        _endDateController.text = formatDate(picked);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final actionState = ref.watch(transactionActionProvider);
    final isLoading = actionState is TransactionActionLoading;

    ref.listen(transactionActionProvider, (_, next) {
      if (next is TransactionActionSuccess) {
        ref.read(transactionActionProvider.notifier).reset();
        context.pop();
      } else if (next is TransactionActionError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(next.message)),
        );
        ref.read(transactionActionProvider.notifier).reset();
      }
    });

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
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
                        _isRecurring
                            ? 'Edit Recurring'
                            : 'Edit Transaction',
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

              // ── Form ───────────────────────────────────────────────────
              Expanded(
                child: SingleChildScrollView(
                  padding:
                      AppSpacing.screenPadding.copyWith(top: 20, bottom: 24),
                  child: Column(
                    children: [
                      _FormCard(
                        child: Column(
                          children: [
                            // Amount
                            _FieldRow(
                              label: 'Amount',
                              error: _valueError,
                              child: TextField(
                                controller: _amountController,
                                keyboardType: TextInputType.number,
                                inputFormatters: [const CentsInputFormatter()],
                                style: AppTextStyles.mono(t.txtPrimary,
                                    fontSize: 15),
                                decoration: InputDecoration(
                                  border: InputBorder.none,
                                  hintText: '0,00',
                                  hintStyle: AppTextStyles.mono(
                                      t.txtTertiary,
                                      fontSize: 15),
                                  prefixText: 'R\$ ',
                                  prefixStyle: AppTextStyles.mono(
                                      t.txtSecondary,
                                      fontSize: 15),
                                ),
                                textAlign: TextAlign.end,
                              ),
                            ),

                            // Subcategory
                            _FieldRow(
                              label: 'Subcategory',
                              error: _subcategoryError,
                              child: GestureDetector(
                                onTap: () async {
                                  final result = await Navigator.of(context)
                                      .push<(int, String)>(
                                    MaterialPageRoute(
                                      builder: (_) =>
                                          const _SubcategoryPickerPage(),
                                      fullscreenDialog: true,
                                    ),
                                  );
                                  if (result != null) {
                                    setState(() {
                                      _subcategoryId = result.$1;
                                      _subcategoryName = result.$2;
                                      _subcategoryError = null;
                                    });
                                  }
                                },
                                child: Text(
                                  _subcategoryName ?? 'Select',
                                  style: AppTextStyles.body(
                                    _subcategoryName != null
                                        ? t.txtPrimary
                                        : t.txtTertiary,
                                  ).copyWith(fontSize: 14),
                                  textAlign: TextAlign.end,
                                ),
                              ),
                            ),

                            // Account
                            _FieldRow(
                              label: 'Account',
                              error: _accountError,
                              child: GestureDetector(
                                onTap: () async {
                                  final accounts = await ref
                                      .read(accountsProvider.future);
                                  if (!context.mounted) return;
                                  final result =
                                      await showModalBottomSheet<Account>(
                                    context: context,
                                    backgroundColor: Colors.transparent,
                                    builder: (_) => _AccountPickerSheet(
                                        accounts: accounts),
                                  );
                                  if (result != null) {
                                    setState(() {
                                      _accountId = result.id;
                                      _accountName = result.name;
                                      _accountError = null;
                                    });
                                  }
                                },
                                child: Text(
                                  _accountName ?? 'Select',
                                  style: AppTextStyles.body(
                                    _accountName != null
                                        ? t.txtPrimary
                                        : t.txtTertiary,
                                  ).copyWith(fontSize: 14),
                                  textAlign: TextAlign.end,
                                ),
                              ),
                            ),

                            // Date (not shown for recurring — backend ignores it)
                            if (!_isRecurring)
                              _FieldRow(
                                label: 'Date',
                                child: GestureDetector(
                                  onTap: _pickDate,
                                  child: Text(
                                    formatDate(_date),
                                    style: AppTextStyles.body(t.txtPrimary)
                                        .copyWith(fontSize: 14),
                                    textAlign: TextAlign.end,
                                  ),
                                ),
                              ),

                            // End date (recurring only)
                            if (_isRecurring)
                              _FieldRow(
                                label: 'End date',
                                child: GestureDetector(
                                  onTap: _pickEndDate,
                                  child: Text(
                                    _recurringEndDate != null
                                        ? formatDate(_recurringEndDate!)
                                        : 'No end date',
                                    style: AppTextStyles.body(
                                      _recurringEndDate != null
                                          ? t.txtPrimary
                                          : t.txtTertiary,
                                    ).copyWith(fontSize: 14),
                                    textAlign: TextAlign.end,
                                  ),
                                ),
                              ),

                            // Description
                            _FieldRow(
                              label: 'Description',
                              showDivider: false,
                              child: TextField(
                                controller: _descriptionController,
                                style: AppTextStyles.body(t.txtPrimary)
                                    .copyWith(fontSize: 14),
                                decoration: InputDecoration(
                                  border: InputBorder.none,
                                  hintText: 'Optional',
                                  hintStyle: AppTextStyles.body(t.txtTertiary)
                                      .copyWith(fontSize: 14),
                                ),
                                textAlign: TextAlign.end,
                                maxLines: 1,
                              ),
                            ),
                          ],
                        ),
                      ),

                      if (_isRecurring) ...[
                        const SizedBox(height: 12),
                        GlassCard(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Icon(Icons.info_outline,
                                  size: 16, color: t.txtTertiary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Editing a recurring transaction updates the template and all future occurrences.',
                                  style: AppTextStyles.caption(t.txtTertiary)
                                      .copyWith(fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // ── Save button ────────────────────────────────────────────
              Padding(
                padding: EdgeInsets.fromLTRB(
                  24,
                  8,
                  24,
                  MediaQuery.viewPaddingOf(context).bottom + 16,
                ),
                child: PrimaryButton(
                  label: isLoading ? 'Saving...' : 'Save changes',
                  onPressed: isLoading ? null : _submit,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Form card ───────────────────────────────────────────────────────────────

class _FormCard extends StatelessWidget {
  final Widget child;
  const _FormCard({required this.child});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          decoration: BoxDecoration(
            color: t.isDark
                ? Colors.white.withValues(alpha: 0.06)
                : Colors.white.withValues(alpha: 0.7),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: t.isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : Colors.white.withValues(alpha: 0.9),
            ),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: child,
        ),
      ),
    );
  }
}

// ── Field row ───────────────────────────────────────────────────────────────

class _FieldRow extends StatelessWidget {
  final String label;
  final Widget child;
  final String? error;
  final bool showDivider;

  const _FieldRow({
    required this.label,
    required this.child,
    this.error,
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 14),
          child: Row(
            children: [
              Text(
                label,
                style: AppTextStyles.body(t.txtSecondary).copyWith(
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const Spacer(),
              child,
            ],
          ),
        ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Text(
              error!,
              style: AppTextStyles.caption(t.error).copyWith(fontSize: 12),
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

// ── Subcategory picker ───────────────────────────────────────────────────────

class _SubcategoryPickerPage extends ConsumerWidget {
  const _SubcategoryPickerPage();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final categoriesAsync = ref.watch(categoriesProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.of(context).pop(),
                      child: Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: t.isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : t.primary.withValues(alpha: 0.08),
                        ),
                        child: Icon(Icons.close,
                            size: 18, color: t.txtPrimary),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        'Select subcategory',
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
              Expanded(
                child: categoriesAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (e, _) => Center(child: Text('Error: $e')),
                  data: (categories) => ListView.builder(
                    padding: AppSpacing.screenPadding.copyWith(top: 16),
                    itemCount: categories.length,
                    itemBuilder: (context, i) {
                      final cat = categories[i];
                      return _CategorySection(
                        category: cat,
                        onSelect: (id, name) =>
                            Navigator.of(context).pop((id, name)),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategorySection extends StatelessWidget {
  final CategoryResponseDto category;
  final void Function(int id, String name) onSelect;

  const _CategorySection({required this.category, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8, top: 16),
          child: Text(
            category.name.toUpperCase(),
            style: AppTextStyles.caption(t.txtTertiary).copyWith(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
        ),
        GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Column(
            children: List.generate(category.subCategories.length, (i) {
              final sub = category.subCategories[i];
              final isLast = i == category.subCategories.length - 1;
              return Column(
                children: [
                  GestureDetector(
                    onTap: () => onSelect(sub.id, sub.name),
                    behavior: HitTestBehavior.opaque,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            sub.name,
                            style: AppTextStyles.body(t.txtPrimary)
                                .copyWith(fontSize: 14),
                          ),
                          Icon(Icons.chevron_right,
                              size: 18, color: t.txtTertiary),
                        ],
                      ),
                    ),
                  ),
                  if (!isLast)
                    Divider(
                      height: 1,
                      thickness: 1,
                      color: t.divider
                          .withValues(alpha: t.isDark ? 0.35 : 0.6),
                    ),
                ],
              );
            }),
          ),
        ),
      ],
    );
  }
}

// ── Account picker sheet ─────────────────────────────────────────────────────

class _AccountPickerSheet extends StatelessWidget {
  final List<Account> accounts;
  const _AccountPickerSheet({required this.accounts});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      decoration: BoxDecoration(
        color: t.isDark ? const Color(0xFF1C1C2E) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(
          24, 16, 24, MediaQuery.viewPaddingOf(context).bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: t.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Select account',
            style: AppTextStyles.body(t.txtPrimary).copyWith(
              fontWeight: FontWeight.w700,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 12),
          ...accounts.map((acc) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(acc.name,
                    style: AppTextStyles.body(t.txtPrimary)
                        .copyWith(fontSize: 14)),
                subtitle: Text(
                  formatCurrency(acc.balanceCents),
                  style: AppTextStyles.mono(t.txtSecondary, fontSize: 12),
                ),
                onTap: () => Navigator.of(context).pop(acc),
              )),
        ],
      ),
    );
  }
}
