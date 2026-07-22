import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/app_locale.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../../accounts/data/models/account.dart';
import '../../accounts/providers/accounts_provider.dart';
import '../data/goal_models.dart';
import '../providers/goal_provider.dart';

Color? _parseHex(String? hex) {
  if (hex == null) return null;
  var h = hex.replaceAll('#', '').trim();
  if (h.length == 6) h = 'FF$h';
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(v);
}

Color _priorityColor(AppThemeTokens t, GoalPriority p) => switch (p) {
      GoalPriority.high => t.clay,
      GoalPriority.medium => t.gold,
      GoalPriority.low => t.moss,
    };

class GoalsPage extends ConsumerWidget {
  const GoalsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(goalsProvider);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: t.bg,
      floatingActionButton: AppFAB(onTap: () => _openForm(context, ref)),
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
                Row(
                  children: [
                    _BackButton(onTap: () => context.pop()),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('PLANEJAR',
                              style: AppTextStyles.eyebrow(t.txtSecondary)),
                          const SizedBox(height: 3),
                          Text('Metas', style: AppTextStyles.h1(t.txtPrimary)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: async.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Center(
                      child: _Error(
                        message: '$e',
                        onRetry: () =>
                            ref.read(goalsProvider.notifier).refresh(),
                      ),
                    ),
                    data: (goals) {
                      final active = goals
                          .where((g) => g.status == GoalStatus.active)
                          .toList();
                      if (goals.isEmpty) {
                        return Center(
                          child: _EmptyState(
                              onCreate: () => _openForm(context, ref)),
                        );
                      }
                      return SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _Hero(goals: active),
                            const SizedBox(height: 22),
                            for (final g in goals)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _GoalCard(
                                  goal: g,
                                  onTap: () => _openActions(context, ref, g),
                                ),
                              ),
                            SizedBox(height: bottomPad + 96),
                          ],
                        ),
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

// ── Hero ─────────────────────────────────────────────────────────────────────

class _Hero extends StatelessWidget {
  const _Hero({required this.goals});
  final List<Goal> goals;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final saved = goals.fold<int>(0, (s, g) => s + g.currentAmount);
    final target = goals.fold<int>(0, (s, g) => s + g.targetAmount);
    final share = target == 0 ? 0.0 : (saved / target).clamp(0.0, 1.0);

    return HeroPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Guardado nas metas ativas',
              style: AppTextStyles.eyebrow(t.panelMuted)),
          const SizedBox(height: 10),
          Money(
            saved,
            size: 40,
            weight: FontWeight.w600,
            color: t.panelText,
            symbolColor: t.panelMuted,
            symbolScale: 0.34,
            centsScale: 0.44,
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.pill),
            child: Container(
              height: 10,
              color: Colors.white.withValues(alpha: 0.08),
              child: Align(
                alignment: Alignment.centerLeft,
                child: FractionallySizedBox(
                  widthFactor: share == 0 ? 0.001 : share,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: [t.moss, t.mossLift]),
                      borderRadius: BorderRadius.circular(AppRadius.pill),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Text('${goals.length} ativa${goals.length == 1 ? '' : 's'}',
                  style: AppTextStyles.mono(t.panelMuted, fontSize: 11)),
              const Spacer(),
              Text('meta ', style: AppTextStyles.mono(t.panelMuted, fontSize: 11)),
              Money(target, size: 12, color: t.panelText, symbolColor: t.panelMuted),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Goal card ──────────────────────────────────────────────────────────────

class _GoalCard extends StatelessWidget {
  const _GoalCard({required this.goal, required this.onTap});
  final Goal goal;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final color = _parseHex(goal.color) ?? t.accent;
    final achieved = goal.status == GoalStatus.achieved || goal.progress >= 1;

    return GlassCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(goal.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTextStyles.h3(t.txtPrimary)),
                        ),
                        if (goal.isInvestment) ...[
                          const SizedBox(width: 8),
                          Icon(LucideIcons.trendingUp, size: 15, color: t.accent),
                        ],
                      ],
                    ),
                    const SizedBox(height: 3),
                    Text(
                      goal.targetDate == null
                          ? goal.type.labelPt
                          : '${goal.type.labelPt} · até ${fmt.formatDate(goal.targetDate!)}',
                      style: AppTextStyles.mono(t.txtTertiary, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              TonalTag(
                achieved ? 'Concluída' : goal.priority.labelPt,
                color: achieved ? t.moss : _priorityColor(t, goal.priority),
                fontSize: 9.5,
              ),
            ],
          ),
          const SizedBox(height: 14),
          AppProgressBar(percent: goal.progress, color: achieved ? t.moss : color),
          const SizedBox(height: 10),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Money(goal.currentAmount, size: 15, weight: FontWeight.w600,
                  color: achieved ? t.moss : t.txtPrimary),
              Text(' / ', style: AppTextStyles.bodySm(t.txtTertiary)),
              Money(goal.targetAmount, size: 13, color: t.txtTertiary),
              const Spacer(),
              Text('${(goal.progress * 100).round()}%',
                  style: AppTextStyles.mono(
                          achieved ? t.moss : t.accent, fontSize: 13)
                      .copyWith(fontWeight: FontWeight.w600)),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Actions / forms ────────────────────────────────────────────────────────

void _openActions(BuildContext context, WidgetRef ref, Goal goal) {
  final t = AppThemeTokens.of(context);
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => _SheetShell(
      title: goal.name,
      children: [
        _SheetAction(
          icon: LucideIcons.plusCircle,
          label: 'Contribuir',
          color: t.moss,
          onTap: () {
            Navigator.pop(context);
            _openAmount(context, ref, goal, contribute: true);
          },
        ),
        if (goal.currentAmount > 0)
          _SheetAction(
            icon: LucideIcons.minusCircle,
            label: 'Retirar',
            color: t.clay,
            onTap: () {
              Navigator.pop(context);
              _openAmount(context, ref, goal, contribute: false);
            },
          ),
        _SheetAction(
          icon: LucideIcons.pencil,
          label: 'Editar meta',
          color: t.accent,
          onTap: () {
            Navigator.pop(context);
            _openForm(context, ref, existing: goal);
          },
        ),
        _SheetAction(
          icon: LucideIcons.trash2,
          label: 'Excluir',
          color: t.error,
          onTap: () async {
            Navigator.pop(context);
            try {
              await ref.read(goalsProvider.notifier).delete(goal.id);
              if (context.mounted) _toast(context, 'Meta excluída');
            } catch (_) {
              if (context.mounted) _toast(context, 'Não foi possível excluir');
            }
          },
        ),
      ],
    ),
  );
}

void _openAmount(BuildContext context, WidgetRef ref, Goal goal,
    {required bool contribute}) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) =>
        _AmountSheet(goal: goal, contribute: contribute, ref: ref),
  );
}

void _openForm(BuildContext context, WidgetRef ref, {Goal? existing}) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => _GoalFormSheet(ref: ref, existing: existing),
  );
}

class _AmountSheet extends ConsumerStatefulWidget {
  const _AmountSheet(
      {required this.goal, required this.contribute, required this.ref});
  final Goal goal;
  final bool contribute;
  final WidgetRef ref;

  @override
  ConsumerState<_AmountSheet> createState() => _AmountSheetState();
}

class _AmountSheetState extends ConsumerState<_AmountSheet> {
  final _value = TextEditingController();
  int? _accountId;
  bool _saving = false;

  @override
  void dispose() {
    _value.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final accounts = ref.watch(accountsNotifierProvider).valueOrNull ?? [];
    final isContribute = widget.contribute;

    return _SheetShell(
      title: isContribute ? 'Contribuir · ${widget.goal.name}' : 'Retirar · ${widget.goal.name}',
      children: [
        AppInputField(
          label: 'Valor',
          controller: _value,
          keyboardType: TextInputType.number,
          inputFormatters: [CentsInputFormatter(locale: fmt.locale)],
          leftIcon: Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(fmt.currencySymbol,
                style: AppTextStyles.mono(t.txtTertiary, fontSize: 14)),
          ),
        ),
        if (accounts.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            isContribute ? 'DA CONTA (OPCIONAL)' : 'PARA A CONTA (OPCIONAL)',
            style: AppTextStyles.eyebrow(t.txtSecondary),
          ),
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (final Account a in accounts)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: AppChip(
                      label: a.name,
                      active: _accountId == a.id,
                      onTap: () => setState(
                          () => _accountId = _accountId == a.id ? null : a.id),
                    ),
                  ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving
              ? 'Salvando…'
              : (isContribute ? 'Contribuir' : 'Retirar'),
          onPressed: _saving ? null : _submit,
        ),
      ],
    );
  }

  Future<void> _submit() async {
    final cents = CentsInputFormatter.parseCents(_value.text);
    if (cents <= 0) {
      _toast(context, 'Informe um valor');
      return;
    }
    setState(() => _saving = true);
    try {
      final notifier = widget.ref.read(goalsProvider.notifier);
      if (widget.contribute) {
        await notifier.contribute(widget.goal.id,
            ContributeGoalRequest(amount: cents, sourceAccountId: _accountId));
      } else {
        await notifier.withdraw(widget.goal.id,
            WithdrawGoalRequest(amount: cents, destinationAccountId: _accountId));
      }
      if (mounted) {
        Navigator.pop(context);
        _toast(context, widget.contribute ? 'Contribuição registrada' : 'Retirada registrada');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _saving = false);
        _toast(context, 'Algo deu errado');
      }
    }
  }
}

class _GoalFormSheet extends StatefulWidget {
  const _GoalFormSheet({required this.ref, this.existing});
  final WidgetRef ref;
  final Goal? existing;

  @override
  State<_GoalFormSheet> createState() => _GoalFormSheetState();
}

class _GoalFormSheetState extends State<_GoalFormSheet> {
  late final TextEditingController _name;
  late final TextEditingController _target;
  late final TextEditingController _url;
  GoalPriority _priority = GoalPriority.medium;
  DateTime? _targetDate;
  bool _saving = false;

  bool get _isEdit => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _name = TextEditingController(text: e?.name ?? '');
    _target = TextEditingController(
      text: e == null
          ? ''
          : formatCurrency(e.targetAmount).replaceAll(RegExp(r'[^\d.,-]'), ''),
    );
    _url = TextEditingController(text: e?.url ?? '');
    _priority = e?.priority ?? GoalPriority.medium;
    _targetDate = e?.targetDate;
  }

  @override
  void dispose() {
    _name.dispose();
    _target.dispose();
    _url.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    return _SheetShell(
      title: _isEdit ? 'Editar meta' : 'Nova meta',
      children: [
        AppInputField(label: 'Nome', controller: _name),
        const SizedBox(height: 14),
        AppInputField(
          label: 'Valor alvo',
          controller: _target,
          keyboardType: TextInputType.number,
          inputFormatters: [CentsInputFormatter(locale: fmt.locale)],
          leftIcon: Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(fmt.currencySymbol,
                style: AppTextStyles.mono(t.txtTertiary, fontSize: 14)),
          ),
        ),
        const SizedBox(height: 14),
        Text('PRIORIDADE', style: AppTextStyles.eyebrow(t.txtSecondary)),
        const SizedBox(height: 8),
        Row(
          children: [
            for (final p in GoalPriority.values)
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: AppChip(
                  label: p.labelPt,
                  active: _priority == p,
                  onTap: () => setState(() => _priority = p),
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        GestureDetector(
          onTap: _pickDate,
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
                Icon(LucideIcons.calendar, size: 18, color: t.txtTertiary),
                const SizedBox(width: 10),
                Text(
                  _targetDate == null
                      ? 'Data alvo'
                      : fmt.formatDate(_targetDate!),
                  style: AppTextStyles.body(
                      _targetDate == null ? t.txtTertiary : t.txtPrimary),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving ? 'Salvando…' : (_isEdit ? 'Salvar alterações' : 'Criar meta'),
          onPressed: _saving ? null : _submit,
        ),
      ],
    );
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _targetDate ?? now.add(const Duration(days: 180)),
      firstDate: now,
      lastDate: DateTime(now.year + 30),
    );
    if (picked != null) setState(() => _targetDate = picked);
  }

  Future<void> _submit() async {
    final name = _name.text.trim();
    final target = CentsInputFormatter.parseCents(_target.text);
    if (name.isEmpty || target <= 0) {
      _toast(context, 'Preencha nome e valor alvo');
      return;
    }
    if (!_isEdit && _targetDate == null) {
      _toast(context, 'Escolha uma data alvo');
      return;
    }
    setState(() => _saving = true);
    try {
      final notifier = widget.ref.read(goalsProvider.notifier);
      if (_isEdit) {
        await notifier.updateGoal(
          widget.existing!.id,
          UpdateGoalRequest(
            name: name,
            targetAmount: target,
            priority: _priority,
            targetDate: _targetDate,
            url: _url.text.trim(),
          ),
        );
      } else {
        await notifier.create(CreateGoalRequest(
          name: name,
          targetAmount: target,
          priority: _priority,
          targetDate: _targetDate!,
          url: _url.text.trim(),
        ));
      }
      if (mounted) {
        Navigator.pop(context);
        _toast(context, _isEdit ? 'Meta atualizada' : 'Meta criada');
      }
    } catch (_) {
      if (mounted) {
        setState(() => _saving = false);
        _toast(context, 'Não foi possível salvar');
      }
    }
  }
}

// ── Shared pieces ──────────────────────────────────────────────────────────

void _toast(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

class _BackButton extends StatelessWidget {
  const _BackButton({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.baseAll,
          border: Border.all(color: t.mist),
        ),
        child: Icon(LucideIcons.chevronLeft, size: 20, color: t.txtSecondary),
      ),
    );
  }
}

class _SheetShell extends StatelessWidget {
  const _SheetShell({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottom = MediaQuery.viewInsetsOf(context).bottom;
    return Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, 20 + bottom),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
        border: Border.all(color: t.mist),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: t.mist,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(title, style: AppTextStyles.h3(t.txtPrimary)),
            const SizedBox(height: 16),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _SheetAction extends StatelessWidget {
  const _SheetAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(width: 14),
            Text(label,
                style: AppTextStyles.body(t.txtPrimary)
                    .copyWith(fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreate});
  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: t.surfaceEl,
            borderRadius: BorderRadius.circular(AppRadius.lg),
          ),
          child: Icon(LucideIcons.target, size: 26, color: t.accent),
        ),
        const SizedBox(height: 16),
        Text('Nenhuma meta ainda', style: AppTextStyles.h3(t.txtPrimary)),
        const SizedBox(height: 6),
        Text('Crie sua primeira meta e acompanhe o progresso.',
            textAlign: TextAlign.center,
            style: AppTextStyles.bodySm(t.txtTertiary)),
        const SizedBox(height: 20),
        SizedBox(
          width: 200,
          child: PrimaryButton(label: 'Nova meta', onPressed: onCreate),
        ),
      ],
    );
  }
}

class _Error extends StatelessWidget {
  const _Error({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(LucideIcons.wifiOff, size: 44, color: t.txtTertiary),
        const SizedBox(height: 14),
        Text('Não foi possível carregar', style: AppTextStyles.h3(t.txtPrimary)),
        const SizedBox(height: 6),
        Text(message,
            textAlign: TextAlign.center,
            style: AppTextStyles.bodySm(t.txtTertiary)),
        const SizedBox(height: 20),
        SizedBox(
            width: 170,
            child: PrimaryButton(label: 'Tentar de novo', onPressed: onRetry)),
      ],
    );
  }
}
