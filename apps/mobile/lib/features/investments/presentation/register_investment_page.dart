import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../accounts/data/models/account.dart';
import '../../accounts/providers/accounts_provider.dart';
import '../data/investment_models.dart';
import '../providers/investment_provider.dart';

class RegisterInvestmentPage extends ConsumerStatefulWidget {
  const RegisterInvestmentPage({super.key});

  @override
  ConsumerState<RegisterInvestmentPage> createState() =>
      _RegisterInvestmentPageState();
}

class _RegisterInvestmentPageState
    extends ConsumerState<RegisterInvestmentPage> {
  final _ticker = TextEditingController();
  final _name = TextEditingController();
  final _quantity = TextEditingController();
  final _unitPrice = TextEditingController();
  final _otherCosts = TextEditingController();

  InvestmentOperation _operation = InvestmentOperation.buy;
  AssetType _assetType = AssetType.acao;
  int? _accountId;
  DateTime _date = DateTime.now();

  bool _saving = false;
  String? _error;

  Account? _accountById(List<Account> accounts) {
    for (final a in accounts) {
      if (a.id == _accountId) return a;
    }
    return null;
  }

  @override
  void dispose() {
    _ticker.dispose();
    _name.dispose();
    _quantity.dispose();
    _unitPrice.dispose();
    _otherCosts.dispose();
    super.dispose();
  }

  int _toCents(String raw) {
    final normalized = raw.replaceAll('.', '').replaceAll(',', '.').trim();
    final value = double.tryParse(normalized) ?? 0;
    return (value * 100).round();
  }

  double _toQuantity(String raw) {
    final normalized = raw.replaceAll(',', '.').trim();
    return double.tryParse(normalized) ?? 0;
  }

  Future<void> _submit() async {
    final ticker = _ticker.text.trim().toUpperCase();
    final name = _name.text.trim();
    final quantity = _toQuantity(_quantity.text);
    final unitPrice = _toCents(_unitPrice.text);
    final otherCosts =
        _otherCosts.text.trim().isEmpty ? 0 : _toCents(_otherCosts.text);

    if (ticker.isEmpty) {
      setState(() => _error = 'Informe o código do ativo (ticker).');
      return;
    }
    if (name.isEmpty) {
      setState(() => _error = 'Informe o nome do ativo.');
      return;
    }
    if (quantity <= 0) {
      setState(() => _error = 'A quantidade deve ser maior que zero.');
      return;
    }
    if (unitPrice <= 0) {
      setState(() => _error = 'O preço unitário deve ser maior que zero.');
      return;
    }
    if (_accountId == null) {
      setState(() => _error = 'Selecione a conta.');
      return;
    }

    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await ref.read(portfolioProvider.notifier).registerTransaction(
            CreateInvestmentTransactionRequest(
              ticker: ticker,
              name: name,
              assetType: _assetType,
              operation: _operation,
              date: _date,
              quantity: quantity,
              unitPriceCents: unitPrice,
              otherCostsCents: otherCosts,
              accountId: _accountId!,
            ),
          );
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Não foi possível registrar a operação.');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final accounts = ref.watch(accountsNotifierProvider).valueOrNull ?? const [];
    final fmt = AppLocaleScope.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;
    final selectedAccount = _accountById(accounts);

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
                PageHeader(
                  eyebrow: 'CARTEIRA',
                  title: 'Nova operação',
                  showBack: true,
                  onBack: () => context.pop(),
                ),
                const SizedBox(height: 20),
                _OperationToggle(
                  operation: _operation,
                  onChanged: (o) => setState(() => _operation = o),
                ),
                const SizedBox(height: 18),
                AppInputField(
                  label: 'Ativo (ticker)',
                  placeholder: 'Ex.: PETR4, HGLG11, BTC',
                  controller: _ticker,
                  textCapitalization: TextCapitalization.characters,
                ),
                const SizedBox(height: 14),
                AppInputField(
                  label: 'Nome',
                  placeholder: 'Ex.: Petrobras PN',
                  controller: _name,
                ),
                const SizedBox(height: 14),
                _SelectField(
                  label: 'Tipo de ativo',
                  valueLabel: _assetType.labelPt,
                  onTap: _pickAssetType,
                ),
                const SizedBox(height: 14),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: AppInputField(
                        label: 'Quantidade',
                        placeholder: '0',
                        controller: _quantity,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                              RegExp(r'[0-9.,]')),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppInputField(
                        label: 'Preço unitário (R\$)',
                        placeholder: '0,00',
                        controller: _unitPrice,
                        keyboardType: const TextInputType.numberWithOptions(
                            decimal: true),
                        inputFormatters: [
                          FilteringTextInputFormatter.allow(
                              RegExp(r'[0-9.,]')),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                AppInputField(
                  label: 'Outros custos (R\$) — opcional',
                  placeholder: '0,00',
                  controller: _otherCosts,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                  ],
                ),
                const SizedBox(height: 14),
                _SelectField(
                  label: 'Conta',
                  valueLabel: selectedAccount?.name ?? 'Selecionar conta',
                  placeholder: selectedAccount == null,
                  onTap: () => _pickAccount(accounts),
                ),
                const SizedBox(height: 14),
                _SelectField(
                  label: 'Data',
                  valueLabel: fmt.formatDate(_date),
                  onTap: _pickDate,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!, style: AppTextStyles.bodySm(t.error)),
                ],
                const SizedBox(height: 24),
                PrimaryButton(
                  label: _saving ? 'Salvando...' : 'Registrar operação',
                  onPressed: _saving ? null : _submit,
                ),
                SizedBox(height: bottomPad + 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickAssetType() async {
    final picked = await showModalBottomSheet<AssetType>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _OptionsSheet<AssetType>(
        title: 'Tipo de ativo',
        options: AssetType.values,
        labelOf: (a) => a.labelPt,
        selected: _assetType,
      ),
    );
    if (picked != null) setState(() => _assetType = picked);
  }

  Future<void> _pickAccount(List<Account> accounts) async {
    if (accounts.isEmpty) return;
    final picked = await showModalBottomSheet<Account>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _OptionsSheet<Account>(
        title: 'Conta',
        options: accounts,
        labelOf: (a) => a.name,
        selected: _accountById(accounts),
      ),
    );
    if (picked != null) setState(() => _accountId = picked.id);
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _date = picked);
  }
}

// ── Operation toggle ─────────────────────────────────────────────────────────

class _OperationToggle extends StatelessWidget {
  const _OperationToggle({required this.operation, required this.onChanged});

  final InvestmentOperation operation;
  final ValueChanged<InvestmentOperation> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      height: 44,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: t.surfaceEl,
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.mist),
      ),
      child: Row(
        children: InvestmentOperation.values.map((op) {
          final selected = op == operation;
          final color = op == InvestmentOperation.buy ? t.moss : t.clay;
          return Expanded(
            child: GestureDetector(
              onTap: () => onChanged(op),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                decoration: BoxDecoration(
                  color: selected ? color.withValues(alpha: 0.16) : null,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                alignment: Alignment.center,
                child: Text(
                  op.labelPt,
                  style: AppTextStyles.bodySm(
                          selected ? color : t.txtTertiary)
                      .copyWith(
                          fontWeight:
                              selected ? FontWeight.w700 : FontWeight.w500),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ── Select field (tappable) ──────────────────────────────────────────────────

class _SelectField extends StatelessWidget {
  const _SelectField({
    required this.label,
    required this.valueLabel,
    required this.onTap,
    this.placeholder = false,
  });

  final String label;
  final String valueLabel;
  final VoidCallback onTap;
  final bool placeholder;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: AppTextStyles.caption(t.txtSecondary)
              .copyWith(fontSize: 12, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 5),
        GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: t.surfaceEl,
              borderRadius: AppRadius.baseAll,
              border: Border.all(color: t.mist, width: 1.2),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    valueLabel,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.body(
                            placeholder ? t.txtTertiary : t.txtPrimary)
                        .copyWith(fontSize: 14),
                  ),
                ),
                Icon(LucideIcons.chevronDown, size: 18, color: t.txtTertiary),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Options bottom sheet ─────────────────────────────────────────────────────

class _OptionsSheet<T> extends StatelessWidget {
  const _OptionsSheet({
    required this.title,
    required this.options,
    required this.labelOf,
    required this.selected,
  });

  final String title;
  final List<T> options;
  final String Function(T) labelOf;
  final T? selected;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: t.divider,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(title, style: AppTextStyles.h3(t.txtPrimary)),
            ),
          ),
          const SizedBox(height: 8),
          Flexible(
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: options.length,
              separatorBuilder: (_, _) => Divider(
                height: 1,
                indent: 20,
                endIndent: 20,
                color: t.divider.withValues(alpha: 0.4),
              ),
              itemBuilder: (_, i) {
                final option = options[i];
                final isSelected = option == selected;
                return GestureDetector(
                  onTap: () => Navigator.of(context).pop(option),
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 15),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            labelOf(option),
                            style: AppTextStyles.body(
                              isSelected ? t.accent : t.txtPrimary,
                            ).copyWith(
                              fontWeight: isSelected
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                            ),
                          ),
                        ),
                        if (isSelected)
                          Icon(Icons.check_rounded,
                              size: 18, color: t.accent),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          SizedBox(height: MediaQuery.viewPaddingOf(context).bottom + 12),
        ],
      ),
    );
  }
}
