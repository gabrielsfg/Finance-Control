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
import '../data/dtos/create_account_request_dto.dart';
import '../providers/accounts_provider.dart';

class CreateAccountPage extends ConsumerStatefulWidget {
  const CreateAccountPage({super.key});

  @override
  ConsumerState<CreateAccountPage> createState() => _CreateAccountPageState();
}

class _CreateAccountPageState extends ConsumerState<CreateAccountPage> {
  final _nameController = TextEditingController();
  final _balanceController = TextEditingController();
  final _goalController = TextEditingController();

  bool _isDefault = true;
  bool _excludeFromNetWorth = false;
  bool _isLoading = false;

  String? _nameError;
  String? _submitError;

  @override
  void dispose() {
    _nameController.dispose();
    _balanceController.dispose();
    _goalController.dispose();
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
      await ref.read(accountsNotifierProvider.notifier).createAccount(
            CreateAccountRequestDto(
              name: _nameController.text.trim(),
              currentBalance: _parseCents(_balanceController.text),
              isDefaultAccount: _isDefault,
              goalAmount: goalCents > 0 ? goalCents : null,
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
                // ── Balance input (full-width, grows with content) ────────
                _BalanceInput(controller: _balanceController),
                const SizedBox(height: 20),
                // ── Fields ────────────────────────────────────────────────
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
                const SizedBox(height: 20),
                // ── Toggles ───────────────────────────────────────────────
                GlassCard(
                  child: Column(
                    children: [
                      _ToggleRow(
                        label: 'Default Account',
                        subtitle: 'Pre-select in new transactions',
                        value: _isDefault,
                        onChanged: (v) => setState(() => _isDefault = v),
                      ),
                      Divider(
                        height: 20,
                        thickness: 1,
                        color: t.divider.withValues(alpha: 0.4),
                      ),
                      _ToggleRow(
                        label: 'Exclude from Net Worth',
                        subtitle: 'For investment accounts',
                        value: _excludeFromNetWorth,
                        onChanged: (v) =>
                            setState(() => _excludeFromNetWorth = v),
                      ),
                    ],
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

// ── Balance Input ─────────────────────────────────────────────────────────────

class _BalanceInput extends StatelessWidget {
  final TextEditingController controller;

  const _BalanceInput({required this.controller});

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Column(
      children: [
        Text(
          'CURRENT BALANCE',
          style: AppTextStyles.caption(t.txtTertiary).copyWith(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 10),
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
                keyboardType: const TextInputType.numberWithOptions(
                  signed: true,
                  decimal: false,
                ),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'[\d\-]')),
                  const CentsInputFormatter(allowNegative: true),
                ],
                style: AppTextStyles.moneyLg(t.txtPrimary).copyWith(
                  fontSize: 36,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -1,
                ),
                decoration: InputDecoration(
                  hintText: '0,00',
                  hintStyle: AppTextStyles.moneyLg(
                    t.txtPrimary.withValues(alpha: 0.35),
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
