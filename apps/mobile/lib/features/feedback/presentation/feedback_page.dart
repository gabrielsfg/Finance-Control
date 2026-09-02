import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/feedback_repository.dart';

/// Same limits as `CreateFeedbackValidator` on the API.
const _titleMin = 3;
const _titleMax = 120;
const _descriptionMax = 2000;

class FeedbackPage extends ConsumerStatefulWidget {
  const FeedbackPage({super.key});

  @override
  ConsumerState<FeedbackPage> createState() => _FeedbackPageState();
}

class _FeedbackPageState extends ConsumerState<FeedbackPage> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();

  FeedbackType _type = FeedbackType.bug;
  bool _isSending = false;
  bool _sent = false;
  String? _titleError;
  String? _submitError;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final title = _titleController.text.trim();
    if (title.length < _titleMin) {
      setState(() => _titleError = 'Escreva pelo menos $_titleMin caracteres.');
      return;
    }

    setState(() {
      _isSending = true;
      _titleError = null;
      _submitError = null;
    });

    final description = _descriptionController.text.trim();

    try {
      await ref.read(feedbackRepositoryProvider).send(
            type: _type,
            title: title,
            description: description.isEmpty ? null : description,
          );
      if (mounted) setState(() => _sent = true);
    } catch (_) {
      if (mounted) {
        setState(() => _submitError = 'Não foi possível enviar agora. Tente novamente.');
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

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
                  eyebrow: 'SUPORTE',
                  title: 'Fale com a gente',
                  showBack: true,
                  onBack: () => context.pop(),
                ),
                const SizedBox(height: 18),
                Expanded(
                  child: _sent ? const _SentState() : _buildForm(t),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm(AppThemeTokens t) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;
    final isBug = _type == FeedbackType.bug;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: EdgeInsets.only(bottom: bottomInset > 0 ? 16 : 0),
            children: [
              Text(
                'Relate um problema ou mande uma ideia. Lemos tudo o que chega por aqui.',
                style: AppTextStyles.bodySm(t.txtSecondary),
              ),
              const SizedBox(height: 20),
              Text('SOBRE O QUE É?', style: AppTextStyles.eyebrow(t.txtSecondary)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _TypeCard(
                      icon: LucideIcons.bug,
                      label: 'Problema',
                      hint: 'Algo quebrou ou está errado',
                      color: t.clay,
                      selected: isBug,
                      onTap: () => setState(() => _type = FeedbackType.bug),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _TypeCard(
                      icon: LucideIcons.lightbulb,
                      label: 'Sugestão',
                      hint: 'Uma ideia ou pedido',
                      color: t.gold,
                      selected: !isBug,
                      onTap: () => setState(() => _type = FeedbackType.suggestion),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              AppInputField(
                label: 'Resumo',
                controller: _titleController,
                placeholder: isBug
                    ? 'Ex.: o saldo da conta não atualiza'
                    : 'Ex.: queria filtrar o extrato por tag',
                maxLength: _titleMax,
                errorText: _titleError,
                textCapitalization: TextCapitalization.sentences,
                onChanged: (_) {
                  if (_titleError != null) setState(() => _titleError = null);
                },
              ),
              const SizedBox(height: 18),
              AppInputField(
                label: 'Detalhes (opcional)',
                controller: _descriptionController,
                placeholder: isBug
                    ? 'O que você estava fazendo, o que esperava e o que aconteceu.'
                    : 'Conte como isso ajudaria no seu dia a dia.',
                maxLines: 6,
                minLines: 4,
                maxLength: _descriptionMax,
                textCapitalization: TextCapitalization.sentences,
              ),
              if (_submitError != null) ...[
                const SizedBox(height: 16),
                AppErrorBanner(message: _submitError!),
              ],
            ],
          ),
        ),
        Padding(
          padding: EdgeInsets.only(top: 12, bottom: bottomPad + 16),
          child: SizedBox(
            width: double.infinity,
            child: _isSending
                ? const Center(child: CircularProgressIndicator())
                : PrimaryButton(label: 'Enviar', onPressed: _submit),
          ),
        ),
      ],
    );
  }
}

// ── Type card ──────────────────────────────────────────────────────────────

class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.icon,
    required this.label,
    required this.hint,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String hint;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: selected
              ? color.withValues(alpha: t.isDark ? 0.16 : 0.09)
              : t.surface,
          borderRadius: AppRadius.baseAll,
          border: Border.all(
            color: selected ? color.withValues(alpha: 0.5) : t.mist,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 18, color: selected ? color : t.txtTertiary),
            const SizedBox(height: 8),
            Text(
              label,
              style: AppTextStyles.body(selected ? color : t.txtPrimary)
                  .copyWith(fontSize: 14, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 2),
            Text(hint, style: AppTextStyles.caption(t.txtTertiary)),
          ],
        ),
      ),
    );
  }
}

// ── Sent ───────────────────────────────────────────────────────────────────

class _SentState extends StatelessWidget {
  const _SentState();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final bottomPad = MediaQuery.viewPaddingOf(context).bottom;

    return Column(
      children: [
        Expanded(
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: t.moss.withValues(alpha: t.isDark ? 0.18 : 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(LucideIcons.check, size: 30, color: t.moss),
                ),
                const SizedBox(height: 18),
                Text('Recebemos, obrigado!',
                    style: AppTextStyles.h3(t.txtPrimary)),
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    'Se precisarmos de mais detalhes, entramos em contato pelo e-mail da sua conta.',
                    textAlign: TextAlign.center,
                    style: AppTextStyles.bodySm(t.txtTertiary),
                  ),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: EdgeInsets.only(bottom: bottomPad + 16),
          child: SizedBox(
            width: double.infinity,
            child: PrimaryButton(
              label: 'Voltar',
              onPressed: () => context.pop(),
            ),
          ),
        ),
      ],
    );
  }
}
