import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/notification_models.dart';
import '../providers/notification_provider.dart';

/// How long a stepper waits before saving. Holding "+" through a range would
/// otherwise fire one request per tap.
const _commitDelay = Duration(milliseconds: 500);

class NotificationPreferencesPage extends ConsumerStatefulWidget {
  const NotificationPreferencesPage({super.key});

  @override
  ConsumerState<NotificationPreferencesPage> createState() =>
      _NotificationPreferencesPageState();
}

class _NotificationPreferencesPageState
    extends ConsumerState<NotificationPreferencesPage> {
  Timer? _debounce;

  /// Holds the value being edited by a stepper until the debounce commits it,
  /// so the number moves under the finger without waiting for the server.
  NotificationPreferences? _draft;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _save(NotificationPreferences prefs, {bool immediate = false}) {
    setState(() => _draft = prefs);
    _debounce?.cancel();

    if (immediate) {
      _commit(prefs);
      return;
    }
    _debounce = Timer(_commitDelay, () => _commit(prefs));
  }

  Future<void> _commit(NotificationPreferences prefs) async {
    try {
      await ref.read(notificationPreferencesProvider.notifier).save(prefs);
      if (mounted) setState(() => _draft = null);
    } catch (_) {
      if (!mounted) return;
      setState(() => _draft = null);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Não foi possível salvar. Tente novamente.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(notificationPreferencesProvider);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      body: AppBackground(
        scrollable: false,
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),
                PageHeader(
                  eyebrow: 'NOTIFICAÇÕES',
                  title: 'Preferências',
                  showBack: true,
                  onBack: () => context.pop(),
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: async.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (_, _) => Center(
                      child: Text(
                        'Não foi possível carregar as preferências.',
                        style: AppTextStyles.bodySm(t.txtSecondary),
                      ),
                    ),
                    data: (saved) {
                      final prefs = _draft ?? saved;

                      return ListView(
                        padding: EdgeInsets.only(bottom: bottomPad + 96),
                        children: [
                          Text(
                            'Escolha o que o app deve avisar. Os alertas aparecem dentro do app, na tela de notificações.',
                            style: AppTextStyles.bodySm(t.txtSecondary),
                          ),
                          const SizedBox(height: 18),
                          GlassCard(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 18,
                              vertical: 6,
                            ),
                            child: Column(
                              children: [
                                _PreferenceRow(
                                  label: 'Cobrança de recorrência',
                                  subtitle:
                                      'Avisa quando uma transação recorrente é gerada',
                                  value: prefs.recurrenceChargedEnabled,
                                  onChanged: (v) => _save(
                                    prefs.copyWith(
                                        recurrenceChargedEnabled: v),
                                    immediate: true,
                                  ),
                                ),
                                const _RowDivider(),
                                _PreferenceRow(
                                  label: 'Vencimento da fatura',
                                  subtitle:
                                      'Lembrete antes do vencimento do cartão',
                                  value: prefs.cardDueEnabled,
                                  onChanged: (v) => _save(
                                    prefs.copyWith(cardDueEnabled: v),
                                    immediate: true,
                                  ),
                                  extra: prefs.cardDueEnabled
                                      ? _StepperRow(
                                          label: 'Avisar com antecedência de',
                                          value: prefs.cardDueDaysAhead,
                                          suffix: 'dias',
                                          min: 0,
                                          max: 30,
                                          onChanged: (v) => _save(
                                            prefs.copyWith(
                                                cardDueDaysAhead: v),
                                          ),
                                        )
                                      : null,
                                ),
                                const _RowDivider(),
                                _PreferenceRow(
                                  label: 'Fechamento da fatura',
                                  subtitle: 'Lembrete antes da fatura fechar',
                                  value: prefs.cardClosingEnabled,
                                  onChanged: (v) => _save(
                                    prefs.copyWith(cardClosingEnabled: v),
                                    immediate: true,
                                  ),
                                  extra: prefs.cardClosingEnabled
                                      ? _StepperRow(
                                          label: 'Avisar com antecedência de',
                                          value: prefs.cardClosingDaysAhead,
                                          suffix: 'dias',
                                          min: 0,
                                          max: 30,
                                          onChanged: (v) => _save(
                                            prefs.copyWith(
                                                cardClosingDaysAhead: v),
                                          ),
                                        )
                                      : null,
                                ),
                                const _RowDivider(),
                                _PreferenceRow(
                                  label: 'Alertas de orçamento',
                                  subtitle:
                                      'Avisa ao se aproximar e ao estourar o orçamento',
                                  value: prefs.budgetAlertEnabled,
                                  onChanged: (v) => _save(
                                    prefs.copyWith(budgetAlertEnabled: v),
                                    immediate: true,
                                  ),
                                  extra: prefs.budgetAlertEnabled
                                      ? _StepperRow(
                                          label: 'Alertar ao atingir',
                                          value: prefs.budgetWarningPercent,
                                          suffix: '%',
                                          min: 5,
                                          max: 100,
                                          step: 5,
                                          onChanged: (v) => _save(
                                            prefs.copyWith(
                                                budgetWarningPercent: v),
                                          ),
                                        )
                                      : null,
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Rows ───────────────────────────────────────────────────────────────────

class _PreferenceRow extends StatelessWidget {
  const _PreferenceRow({
    required this.label,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.extra,
  });

  final String label;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final Widget? extra;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: AppTextStyles.body(t.txtPrimary).copyWith(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AppTextStyles.caption(t.txtTertiary)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Switch(
                value: value,
                onChanged: onChanged,
                activeThumbColor: t.primary,
              ),
            ],
          ),
          if (extra != null) ...[
            const SizedBox(height: 10),
            extra!,
          ],
        ],
      ),
    );
  }
}

class _RowDivider extends StatelessWidget {
  const _RowDivider();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Divider(height: 1, thickness: 1, color: t.mist);
  }
}

/// Numeric setting as a stepper rather than a text field: the value has a small
/// range and typing a number on a phone keyboard is the slower path.
class _StepperRow extends StatelessWidget {
  const _StepperRow({
    required this.label,
    required this.value,
    required this.suffix,
    required this.min,
    required this.max,
    required this.onChanged,
    this.step = 1,
  });

  final String label;
  final int value;
  final String suffix;
  final int min;
  final int max;
  final int step;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final canDecrease = value > min;
    final canIncrease = value < max;

    return Row(
      children: [
        Expanded(
          child: Text(label, style: AppTextStyles.bodySm(t.txtSecondary)),
        ),
        _StepButton(
          icon: LucideIcons.minus,
          enabled: canDecrease,
          onTap: () => onChanged((value - step).clamp(min, max)),
        ),
        SizedBox(
          width: 62,
          child: Text(
            '$value $suffix',
            textAlign: TextAlign.center,
            style: AppTextStyles.mono(t.txtPrimary).copyWith(fontSize: 14),
          ),
        ),
        _StepButton(
          icon: LucideIcons.plus,
          enabled: canIncrease,
          onTap: () => onChanged((value + step).clamp(min, max)),
        ),
      ],
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({
    required this.icon,
    required this.enabled,
    required this.onTap,
  });

  final IconData icon;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: enabled ? onTap : null,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 34,
        height: 34,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.smAll,
          border: Border.all(color: t.mist),
        ),
        child: Icon(
          icon,
          size: 16,
          color: enabled ? t.txtSecondary : t.txtDisabled,
        ),
      ),
    );
  }
}
