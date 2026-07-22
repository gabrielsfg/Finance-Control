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
import '../data/recurrence_models.dart';
import '../providers/recurrence_provider.dart';

Color? _parseHex(String? hex) {
  if (hex == null) return null;
  var h = hex.replaceAll('#', '').trim();
  if (h.length == 6) h = 'FF$h';
  final v = int.tryParse(h, radix: 16);
  return v == null ? null : Color(v);
}

class RecurrencesPage extends ConsumerStatefulWidget {
  const RecurrencesPage({super.key});

  @override
  ConsumerState<RecurrencesPage> createState() => _RecurrencesPageState();
}

class _RecurrencesPageState extends ConsumerState<RecurrencesPage> {
  int _tab = 0; // 0 = subscriptions, 1 = installments

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(recurrenceProvider);
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
                _TopBar(onBack: () => context.pop()),
              const SizedBox(height: 18),
              async.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 120),
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (e, _) => _Error(
                  message: '$e',
                  onRetry: () => ref.read(recurrenceProvider.notifier).refresh(),
                ),
                data: (data) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Hero(data: data),
                    const SizedBox(height: 16),
                    _Segmented(
                      tab: _tab,
                      recurringCount: data.recurring.length,
                      installmentCount: data.installments.length,
                      onChanged: (i) => setState(() => _tab = i),
                    ),
                    const SizedBox(height: 8),
                    if (_tab == 0)
                      _RecurringList(items: data.recurring)
                    else
                      _InstallmentList(items: data.installments),
                    SizedBox(height: bottomPad + 24),
                  ],
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

// ── Top bar ──────────────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar({required this.onBack});
  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        GestureDetector(
          onTap: onBack,
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
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('PLANEJAR', style: AppTextStyles.eyebrow(t.txtSecondary)),
              const SizedBox(height: 3),
              Text('Recorrências', style: AppTextStyles.h1(t.txtPrimary)),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Hero ─────────────────────────────────────────────────────────────────────

class _Hero extends StatelessWidget {
  const _Hero({required this.data});
  final RecurrencePageData data;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final share = data.incomeShare.clamp(0.0, 1.0);
    final over = data.incomeShare > 1.0;

    return HeroPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Comprometido por mês',
              style: AppTextStyles.eyebrow(t.panelMuted)),
          const SizedBox(height: 10),
          Money(
            data.totalMonthlyAmount,
            size: 42,
            weight: FontWeight.w600,
            color: t.panelText,
            symbolColor: t.panelMuted,
            symbolScale: 0.34,
            centsScale: 0.44,
          ),
          if (data.monthlyIncome > 0) ...[
            const SizedBox(height: 14),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.pill),
              child: Container(
                height: 8,
                color: Colors.white.withValues(alpha: 0.08),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(
                    widthFactor: share == 0 ? 0.001 : share,
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: over
                              ? [t.clay, t.clayLift]
                              : [t.moss, t.mossLift],
                        ),
                        borderRadius: BorderRadius.circular(AppRadius.pill),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${(data.incomeShare * 100).round()}% da renda mensal',
              style: AppTextStyles.mono(t.panelMuted, fontSize: 11),
            ),
          ],
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _HeroStat(
                  label: 'Assinaturas',
                  amount: data.subscriptionMonthlyAmount,
                  count: data.activeRecurringCount,
                ),
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.white.withValues(alpha: 0.12),
                margin: const EdgeInsets.symmetric(horizontal: 18),
              ),
              Expanded(
                child: _HeroStat(
                  label: 'Parcelas',
                  amount: data.installmentMonthlyAmount,
                  count: data.activeInstallmentCount,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeroStat extends StatelessWidget {
  const _HeroStat({required this.label, required this.amount, required this.count});
  final String label;
  final int amount;
  final int count;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label · $count', style: AppTextStyles.eyebrow(t.panelMuted, fontSize: 10)),
        const SizedBox(height: 6),
        Money(amount, size: 17, color: t.panelText, symbolColor: t.panelMuted),
      ],
    );
  }
}

// ── Segmented ──────────────────────────────────────────────────────────────

class _Segmented extends StatelessWidget {
  const _Segmented({
    required this.tab,
    required this.recurringCount,
    required this.installmentCount,
    required this.onChanged,
  });
  final int tab;
  final int recurringCount;
  final int installmentCount;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      height: 40,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: t.surfaceEl,
        borderRadius: AppRadius.baseAll,
        border: Border.all(color: t.mist),
      ),
      child: Row(
        children: [
          _seg('Assinaturas ($recurringCount)', 0, t),
          _seg('Parcelas ($installmentCount)', 1, t),
        ],
      ),
    );
  }

  Widget _seg(String label, int index, AppThemeTokens t) {
    final selected = tab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => onChanged(index),
        behavior: HitTestBehavior.opaque,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          decoration: BoxDecoration(
            color: selected ? t.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(AppRadius.sm),
            boxShadow: selected && !t.isDark ? AppShadows.cardLight : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: AppTextStyles.bodySm(selected ? t.txtPrimary : t.txtTertiary)
                .copyWith(fontWeight: selected ? FontWeight.w600 : FontWeight.w500),
          ),
        ),
      ),
    );
  }
}

// ── Recurring list ───────────────────────────────────────────────────────────

class _RecurringList extends ConsumerWidget {
  const _RecurringList({required this.items});
  final List<RecurringItem> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (items.isEmpty) {
      return const _EmptyState(
        icon: LucideIcons.repeat,
        title: 'Nenhuma assinatura ativa',
        message: 'Transações recorrentes que você criar aparecem aqui.',
      );
    }
    return Column(
      children: [
        const SizedBox(height: 8),
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _RecurringRow(item: item),
          ),
      ],
    );
  }
}

class _RecurringRow extends ConsumerWidget {
  const _RecurringRow({required this.item});
  final RecurringItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final catColor = _parseHex(item.categoryColor) ?? t.accent;
    final dimmed = !item.isActive;

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      onTap: () => _openManageSheet(context, ref, item),
      child: Opacity(
        opacity: dimmed ? 0.55 : 1,
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: catColor.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(AppRadius.base),
              ),
              alignment: Alignment.center,
              child: item.subCategoryEmoji != null &&
                      item.subCategoryEmoji!.isNotEmpty
                  ? Text(item.subCategoryEmoji!,
                      style: AppTextStyles.emoji(fontSize: 18))
                  : Icon(LucideIcons.repeat, size: 18, color: catColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.description.isNotEmpty
                        ? item.description
                        : item.subCategoryName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.body(t.txtPrimary)
                        .copyWith(fontWeight: FontWeight.w500, fontSize: 14),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${item.recurrence.labelPt} · ${item.accountName}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.mono(t.txtTertiary, fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Money(
                  item.isIncome ? item.value : -item.value,
                  size: 14,
                  signed: true,
                  weight: FontWeight.w600,
                ),
                const SizedBox(height: 4),
                TonalTag(
                  item.isActive ? 'Ativa' : 'Pausada',
                  color: item.isActive ? t.moss : t.txtTertiary,
                  fontSize: 9.5,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ── Installment list ─────────────────────────────────────────────────────────

class _InstallmentList extends StatelessWidget {
  const _InstallmentList({required this.items});
  final List<InstallmentItem> items;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return const _EmptyState(
        icon: LucideIcons.creditCard,
        title: 'Nenhuma compra parcelada',
        message: 'Compras em parcelas aparecem aqui até serem quitadas.',
      );
    }
    return Column(
      children: [
        const SizedBox(height: 8),
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: _InstallmentRow(item: item),
          ),
      ],
    );
  }
}

class _InstallmentRow extends StatelessWidget {
  const _InstallmentRow({required this.item});
  final InstallmentItem item;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final catColor = _parseHex(item.categoryColor) ?? t.accent;

    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: catColor.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(AppRadius.base),
                ),
                alignment: Alignment.center,
                child: item.subCategoryEmoji != null &&
                        item.subCategoryEmoji!.isNotEmpty
                    ? Text(item.subCategoryEmoji!,
                        style: AppTextStyles.emoji(fontSize: 18))
                    : Icon(LucideIcons.creditCard, size: 18, color: catColor),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.description.isNotEmpty
                          ? item.description
                          : item.subCategoryName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.body(t.txtPrimary)
                          .copyWith(fontWeight: FontWeight.w500, fontSize: 14),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${item.paidInstallments}/${item.totalInstallments} · ${item.accountName}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTextStyles.mono(t.txtTertiary, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Money(-item.value, size: 14, signed: true, weight: FontWeight.w600),
            ],
          ),
          const SizedBox(height: 12),
          AppProgressBar(percent: item.progress),
          const SizedBox(height: 8),
          Row(
            children: [
              Text('Restam ${item.remainingInstallments}',
                  style: AppTextStyles.bodySm(t.txtTertiary)),
              const Spacer(),
              Money(item.remainingAmount, size: 12, color: t.txtSecondary),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Manage / edit sheets ──────────────────────────────────────────────────────

void _openManageSheet(BuildContext context, WidgetRef ref, RecurringItem item) {
  showModalBottomSheet(
    context: context,
    backgroundColor: Colors.transparent,
    isScrollControlled: true,
    builder: (_) => _ManageSheet(item: item, ref: ref),
  );
}

class _ManageSheet extends StatelessWidget {
  const _ManageSheet({required this.item, required this.ref});
  final RecurringItem item;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return _SheetShell(
      title: item.description.isNotEmpty ? item.description : item.subCategoryName,
      children: [
        _SheetAction(
          icon: LucideIcons.pencil,
          label: 'Editar valor e vigência',
          color: t.accent,
          onTap: () {
            Navigator.pop(context);
            showModalBottomSheet(
              context: context,
              backgroundColor: Colors.transparent,
              isScrollControlled: true,
              builder: (_) => _EditRecurringSheet(item: item, ref: ref),
            );
          },
        ),
        if (item.isActive)
          _SheetAction(
            icon: LucideIcons.pauseCircle,
            label: 'Pausar recorrência',
            color: t.warning,
            onTap: () async {
              Navigator.pop(context);
              await _run(context, () => ref
                  .read(recurrenceProvider.notifier)
                  .cancelRecurring(item.id), 'Recorrência pausada');
            },
          )
        else
          _SheetAction(
            icon: LucideIcons.playCircle,
            label: 'Reativar recorrência',
            color: t.moss,
            onTap: () async {
              Navigator.pop(context);
              await _run(context, () => ref
                  .read(recurrenceProvider.notifier)
                  .reactivateRecurring(item.id), 'Recorrência reativada');
            },
          ),
        _SheetAction(
          icon: LucideIcons.trash2,
          label: 'Excluir',
          color: t.error,
          onTap: () async {
            Navigator.pop(context);
            await _run(context, () => ref
                .read(recurrenceProvider.notifier)
                .deleteRecurring(item.id), 'Recorrência excluída');
          },
        ),
      ],
    );
  }
}

class _EditRecurringSheet extends StatefulWidget {
  const _EditRecurringSheet({required this.item, required this.ref});
  final RecurringItem item;
  final WidgetRef ref;

  @override
  State<_EditRecurringSheet> createState() => _EditRecurringSheetState();
}

class _EditRecurringSheetState extends State<_EditRecurringSheet> {
  late final TextEditingController _value;
  late final TextEditingController _desc;
  DateTime? _endDate;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final formatted =
        formatCurrency(widget.item.value).replaceAll(RegExp(r'[^\d.,-]'), '');
    _value = TextEditingController(text: formatted);
    _desc = TextEditingController(text: widget.item.description);
    _endDate = widget.item.endDate;
  }

  @override
  void dispose() {
    _value.dispose();
    _desc.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    return _SheetShell(
      title: 'Editar recorrência',
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
        const SizedBox(height: 14),
        AppInputField(label: 'Descrição', controller: _desc),
        const SizedBox(height: 14),
        GestureDetector(
          onTap: _pickEndDate,
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
                  _endDate == null
                      ? 'Sem data de término'
                      : 'Termina em ${fmt.formatDate(_endDate!)}',
                  style: AppTextStyles.body(
                      _endDate == null ? t.txtTertiary : t.txtPrimary),
                ),
                const Spacer(),
                if (_endDate != null)
                  GestureDetector(
                    onTap: () => setState(() => _endDate = null),
                    child: Icon(LucideIcons.x, size: 16, color: t.txtTertiary),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        PrimaryButton(
          label: _saving ? 'Salvando…' : 'Salvar alterações',
          onPressed: _saving ? null : _save,
        ),
      ],
    );
  }

  Future<void> _pickEndDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 20),
    );
    if (picked != null) setState(() => _endDate = picked);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final cents = CentsInputFormatter.parseCents(_value.text);
    final req = UpdateRecurringRequest(
      value: cents,
      description: _desc.text.trim(),
      endDate: _endDate,
    );
    try {
      await widget.ref
          .read(recurrenceProvider.notifier)
          .updateRecurring(widget.item.id, req);
      if (mounted) {
        Navigator.pop(context);
        _toast(context, 'Alterações salvas');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        _toast(context, 'Não foi possível salvar');
      }
    }
  }
}

// ── Small shared pieces ────────────────────────────────────────────────────────

Future<void> _run(
    BuildContext context, Future<void> Function() action, String ok) async {
  try {
    await action();
    if (context.mounted) _toast(context, ok);
  } catch (_) {
    if (context.mounted) _toast(context, 'Algo deu errado');
  }
}

void _toast(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
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
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });
  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: t.surfaceEl,
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Icon(icon, size: 26, color: t.accent),
          ),
          const SizedBox(height: 16),
          Text(title, style: AppTextStyles.h3(t.txtPrimary)),
          const SizedBox(height: 6),
          Text(message,
              textAlign: TextAlign.center,
              style: AppTextStyles.bodySm(t.txtTertiary)),
        ],
      ),
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
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 70),
      child: Column(
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
      ),
    );
  }
}
