import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/ai_labels.dart';
import '../../../core/utils/app_locale.dart';
import '../../../core/utils/formatters.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/ai_models.dart';
import '../providers/assistant_provider.dart';

/// A proposal from the assistant: nothing is written until the user confirms.
/// Transactions and goals can be edited in place first; budgets are
/// confirm/cancel only (their allocation tree does not fit a card).
class AiActionCard extends ConsumerStatefulWidget {
  const AiActionCard({super.key, required this.action});

  final AiAction action;

  @override
  ConsumerState<AiActionCard> createState() => _AiActionCardState();
}

class _AiActionCardState extends ConsumerState<AiActionCard> {
  bool _editing = false;
  bool _busy = false;
  String? _error;

  TextEditingController? _textController;
  TextEditingController? _valueController;
  DateTime? _date;

  AiAction get _action => widget.action;
  bool get _isTransaction => _action.kind.isTransaction;
  bool get _canEdit =>
      _action.kind.isTransaction || _action.kind == AiActionKind.createGoal;

  /// Payload keys edited in place, per kind.
  String get _textKey => _isTransaction ? 'description' : 'name';
  String get _valueKey => _isTransaction ? 'value' : 'targetAmount';
  String get _dateKey => _isTransaction ? 'transactionDate' : 'targetDate';

  @override
  void dispose() {
    _textController?.dispose();
    _valueController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final status = _action.effectiveStatus;
    final isPending = status == AiActionStatus.pending;
    final muted = status == AiActionStatus.cancelled ||
        status == AiActionStatus.expired;
    final error = _error ?? (isPending ? null : _action.error);

    return Opacity(
      opacity: muted ? 0.6 : 1,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: t.surface,
          borderRadius: AppRadius.lgAll,
          border: Border.all(
            color: status == AiActionStatus.confirmed
                ? t.success.withValues(alpha: 0.5)
                : t.mist,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    _action.previewTitle,
                    style: AppTextStyles.h3(t.txtPrimary).copyWith(fontSize: 15),
                  ),
                ),
                _StatusTag(status: status),
              ],
            ),
            const SizedBox(height: 10),
            if (_editing) _buildEditor(context) else _buildPreview(context),
            if (error != null) ...[
              const SizedBox(height: 10),
              AppErrorBanner(message: error),
            ],
            if (isPending) ...[
              const SizedBox(height: 12),
              _buildButtons(context),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildPreview(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      children: [
        for (final line in _action.previewLines)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 96,
                  child: Text(line.label,
                      style: AppTextStyles.caption(t.txtTertiary)),
                ),
                Expanded(
                  child: Text(
                    line.value,
                    style: AppTextStyles.bodySm(t.txtPrimary)
                        .copyWith(fontWeight: FontWeight.w500),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildEditor(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppInputField(
          label: _isTransaction ? 'Descrição' : 'Nome',
          controller: _textController,
          textCapitalization: TextCapitalization.sentences,
          textInputAction: TextInputAction.next,
        ),
        const SizedBox(height: 10),
        AppInputField(
          label: _isTransaction ? 'Valor (${fmt.currencySymbol})' : 'Valor da meta (${fmt.currencySymbol})',
          controller: _valueController,
          keyboardType: TextInputType.number,
          inputFormatters: [
            FilteringTextInputFormatter.digitsOnly,
            CentsInputFormatter(locale: fmt.locale),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          _isTransaction ? 'Data' : 'Data alvo',
          style: AppTextStyles.caption(t.txtSecondary),
        ),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: _pickDate,
          behavior: HitTestBehavior.opaque,
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: t.surfaceEl,
              borderRadius: AppRadius.baseAll,
              border: Border.all(color: t.mist),
            ),
            child: Row(
              children: [
                Icon(LucideIcons.calendar, size: 16, color: t.txtSecondary),
                const SizedBox(width: 10),
                Text(
                  _date == null ? '—' : fmt.formatDate(_date!),
                  style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildButtons(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        Expanded(
          child: PrimaryButton(
            label: _busy ? 'Salvando…' : 'Confirmar',
            small: true,
            onPressed: _busy ? null : _confirm,
          ),
        ),
        if (_canEdit) ...[
          const SizedBox(width: 8),
          _TextAction(
            label: _editing ? 'Desfazer' : 'Editar',
            color: t.accent,
            onTap: _busy ? null : _toggleEdit,
          ),
        ],
        const SizedBox(width: 4),
        _TextAction(
          label: 'Cancelar',
          color: t.txtTertiary,
          onTap: _busy ? null : _cancel,
        ),
      ],
    );
  }

  void _toggleEdit() {
    if (_editing) {
      setState(() {
        _editing = false;
        _error = null;
      });
      return;
    }
    final fmt = AppLocaleScope.of(context);
    final payload = _action.payload;
    final cents = ((payload[_valueKey] as num?)?.toInt() ?? 0).abs();
    _textController ??= TextEditingController();
    _valueController ??= TextEditingController();
    _textController!.text = payload[_textKey] as String? ?? '';
    _valueController!.text = cents == 0
        ? ''
        : CentsInputFormatter(locale: fmt.locale)
            .formatEditUpdate(
              TextEditingValue.empty,
              TextEditingValue(text: '$cents'),
            )
            .text;
    _date = DateTime.tryParse(payload[_dateKey] as String? ?? '');
    setState(() {
      _editing = true;
      _error = null;
    });
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial = _date ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 10),
      lastDate: DateTime(now.year + 30),
    );
    if (picked != null) setState(() => _date = picked);
  }

  /// The original proposal with the in-place edits applied. Money keeps the
  /// sign the assistant proposed; the field only edits the magnitude.
  Map<String, dynamic>? _editedPayload() {
    if (!_editing) return null;
    final payload = Map<String, dynamic>.from(_action.payload);
    final text = _textController?.text.trim() ?? '';
    payload[_textKey] = text;
    final cents = CentsInputFormatter.parseCents(_valueController?.text ?? '');
    final original = (payload[_valueKey] as num?)?.toInt() ?? 0;
    payload[_valueKey] = original < 0 ? -cents : cents;
    if (_date != null) payload[_dateKey] = toApiDate(_date!);
    return payload;
  }

  Future<void> _confirm() async {
    if (_editing) {
      final text = _textController?.text.trim() ?? '';
      final cents =
          CentsInputFormatter.parseCents(_valueController?.text ?? '');
      if (!_isTransaction && text.isEmpty) {
        setState(() => _error = 'Informe o nome da meta.');
        return;
      }
      if (cents <= 0) {
        setState(() => _error = 'Informe um valor maior que zero.');
        return;
      }
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(assistantChatProvider.notifier)
          .confirmAction(_action, _editedPayload());
      if (mounted) setState(() => _editing = false);
    } on AiActionRejected catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Não foi possível salvar. Tente novamente.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel() async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(assistantChatProvider.notifier).cancelAction(_action);
    } on AiActionRejected catch (e) {
      if (mounted) setState(() => _error = e.message);
    } catch (_) {
      if (mounted) {
        setState(() => _error = 'Não foi possível cancelar. Tente novamente.');
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

class _StatusTag extends StatelessWidget {
  const _StatusTag({required this.status});

  final AiActionStatus status;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return switch (status) {
      AiActionStatus.pending => TonalTag('Aguardando', color: t.accent, fontSize: 9.5),
      AiActionStatus.confirmed => TonalTag('Salvo',
          color: t.success, icon: LucideIcons.check, fontSize: 9.5),
      AiActionStatus.cancelled =>
        TonalTag('Cancelado', color: t.txtTertiary, fontSize: 9.5),
      AiActionStatus.expired =>
        TonalTag('Expirado', color: t.txtTertiary, fontSize: 9.5),
      AiActionStatus.failed => TonalTag('Falhou', color: t.error, fontSize: 9.5),
    };
  }
}

class _TextAction extends StatelessWidget {
  const _TextAction({required this.label, required this.color, this.onTap});

  final String label;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.md,
        ),
        child: Text(
          label,
          style: AppTextStyles.bodySm(onTap == null ? color.withValues(alpha: 0.5) : color)
              .copyWith(fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
