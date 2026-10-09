import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/ai_labels.dart';
import '../../../shared/widgets/app_widgets.dart';
import '../data/ai_models.dart';
import '../providers/insight_provider.dart';

/// Perfil → "IA no Quantia": the user's switch, a plain account of what is
/// sent and to whom, usage, and the two erase buttons.
class AiSettingsCard extends ConsumerWidget {
  const AiSettingsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final async = ref.watch(aiSettingsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 2, bottom: 10),
          child: Text('IA NO QUANTIA',
              style: AppTextStyles.eyebrow(t.txtSecondary)),
        ),
        GlassCard(
          child: async.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (_, _) => _LoadError(
              onRetry: () => ref.invalidate(aiSettingsProvider),
            ),
            data: (settings) => settings == null
                ? const SizedBox.shrink()
                : _SettingsBody(settings: settings),
          ),
        ),
      ],
    );
  }
}

class _SettingsBody extends ConsumerStatefulWidget {
  const _SettingsBody({required this.settings});

  final AiSettings settings;

  @override
  ConsumerState<_SettingsBody> createState() => _SettingsBodyState();
}

class _SettingsBodyState extends ConsumerState<_SettingsBody> {
  bool _toggling = false;
  bool _deletingInsights = false;
  bool _deletingConversations = false;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final s = widget.settings;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: t.accent.withValues(alpha: 0.13),
                borderRadius: AppRadius.mdAll,
              ),
              child: Icon(LucideIcons.sparkles, size: 17, color: t.accent),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Usar IA no Quantia',
                    style: AppTextStyles.body(t.txtPrimary).copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Text(
                    s.aiEnabled
                        ? 'Análises semanais e assistente ligados'
                        : 'Nada é enviado para a IA',
                    style: AppTextStyles.caption(t.txtTertiary),
                  ),
                ],
              ),
            ),
            Switch.adaptive(
              value: s.aiEnabled,
              onChanged: _toggling ? null : _toggle,
            ),
          ],
        ),
        if (!s.isAvailable) ...[
          const SizedBox(height: 12),
          const _Note(
            icon: LucideIcons.cloudOff,
            text: 'A IA está indisponível no momento. Sua escolha fica salva.',
          ),
        ] else if (!s.isPremium) ...[
          const SizedBox(height: 12),
          const _Note(
            icon: LucideIcons.crown,
            text:
                'Análises semanais e o assistente fazem parte do plano Premium.',
          ),
        ],
        const SizedBox(height: 16),
        Divider(height: 1, color: t.mist),
        const SizedBox(height: 16),
        const _InfoBlock(
          title: 'O que é enviado',
          text:
              'Para gerar as análises e responder no assistente, enviamos seus '
              'dados financeiros — transações separadas por conta, nome e saldo '
              'das contas (ex.: Nubank), categorias, orçamentos, metas e '
              'investimentos — e o seu primeiro nome.',
        ),
        const SizedBox(height: 12),
        const _InfoBlock(
          title: 'O que nunca é enviado',
          text: 'CPF, e-mail, número de cartão, agência e número da conta '
              'bancária, senhas ou qualquer outro dado sensível.',
        ),
        const SizedBox(height: 12),
        _InfoBlock(
          title: 'Quem processa',
          text: 'Os dados são processados pela ${s.provider}, nos EUA, apenas '
              'para gerar a resposta. Eles não são usados para treinar modelos '
              'de IA.',
        ),
        const SizedBox(height: 12),
        const _InfoBlock(
          title: 'Você decide',
          text: 'Desligando a chave acima, nada mais é enviado. Você pode apagar '
              'as análises e as conversas guardadas quando quiser.',
        ),
        const SizedBox(height: 16),
        Divider(height: 1, color: t.mist),
        const SizedBox(height: 14),
        _UsageRow(
          label: 'Assistente',
          value: aiUsageLabel(s.chatMessagesUsed, s.chatMessagesLimit),
        ),
        const SizedBox(height: 6),
        _UsageRow(label: 'Análises guardadas', value: '${s.insightCount}'),
        const SizedBox(height: 6),
        _UsageRow(label: 'Conversas guardadas', value: '${s.conversationCount}'),
        const SizedBox(height: 18),
        AppOutlineButton(
          label: _deletingInsights ? 'Apagando…' : 'Apagar análises',
          danger: true,
          icon: Icon(LucideIcons.trash2, size: 16, color: t.error),
          onPressed: _deletingInsights ? null : _deleteInsights,
        ),
        const SizedBox(height: 10),
        AppOutlineButton(
          label: _deletingConversations ? 'Apagando…' : 'Apagar conversas',
          danger: true,
          icon: Icon(LucideIcons.trash2, size: 16, color: t.error),
          onPressed: _deletingConversations ? null : _deleteConversations,
        ),
      ],
    );
  }

  Future<void> _toggle(bool enabled) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _toggling = true);
    try {
      await ref.read(aiSettingsProvider.notifier).setEnabled(enabled);
    } catch (_) {
      messenger.showSnackBar(const SnackBar(
        content: Text('Não foi possível salvar. Tente novamente.'),
      ));
    } finally {
      if (mounted) setState(() => _toggling = false);
    }
  }

  Future<void> _deleteInsights() async {
    final confirmed = await _confirm(
      title: 'Apagar análises',
      message: 'Todas as análises semanais guardadas serão apagadas. Uma nova '
          'análise é gerada na próxima visita e conta no limite do mês.',
    );
    if (!confirmed || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _deletingInsights = true);
    try {
      final deleted =
          await ref.read(aiSettingsProvider.notifier).deleteInsights();
      messenger.showSnackBar(SnackBar(
        content: Text(deleted == 1
            ? '1 análise apagada.'
            : '$deleted análises apagadas.'),
      ));
    } catch (_) {
      messenger.showSnackBar(const SnackBar(
        content: Text('Não foi possível apagar. Tente novamente.'),
      ));
    } finally {
      if (mounted) setState(() => _deletingInsights = false);
    }
  }

  Future<void> _deleteConversations() async {
    final confirmed = await _confirm(
      title: 'Apagar conversas',
      message: 'Todo o histórico do assistente será apagado. Esta ação não pode '
          'ser desfeita.',
    );
    if (!confirmed || !mounted) return;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _deletingConversations = true);
    try {
      final deleted =
          await ref.read(aiSettingsProvider.notifier).deleteConversations();
      messenger.showSnackBar(SnackBar(
        content: Text(deleted == 1
            ? '1 conversa apagada.'
            : '$deleted conversas apagadas.'),
      ));
    } catch (_) {
      messenger.showSnackBar(const SnackBar(
        content: Text('Não foi possível apagar. Tente novamente.'),
      ));
    } finally {
      if (mounted) setState(() => _deletingConversations = false);
    }
  }

  Future<bool> _confirm({required String title, required String message}) async {
    final t = AppThemeTokens.of(context);
    final result = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: t.bg,
        title: Text(title, style: AppTextStyles.h3(t.txtPrimary)),
        content: Text(message, style: AppTextStyles.body(t.txtSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text('Cancelar', style: AppTextStyles.body(t.txtTertiary)),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(
              'Apagar',
              style: AppTextStyles.body(t.error)
                  .copyWith(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
    return result == true;
  }
}

class _InfoBlock extends StatelessWidget {
  const _InfoBlock({required this.title, required this.text});

  final String title;
  final String text;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTextStyles.body(t.txtPrimary).copyWith(
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 2),
        Text(text, style: AppTextStyles.bodySm(t.txtSecondary)),
      ],
    );
  }
}

class _Note extends StatelessWidget {
  const _Note({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: t.surfaceEl,
        borderRadius: AppRadius.baseAll,
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: t.txtSecondary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text, style: AppTextStyles.caption(t.txtSecondary)),
          ),
        ],
      ),
    );
  }
}

class _UsageRow extends StatelessWidget {
  const _UsageRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        Expanded(
          child: Text(label, style: AppTextStyles.bodySm(t.txtSecondary)),
        ),
        Text(value, style: AppTextStyles.mono(t.txtPrimary, fontSize: 12.5)),
      ],
    );
  }
}

class _LoadError extends StatelessWidget {
  const _LoadError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Row(
      children: [
        Expanded(
          child: Text(
            'Não foi possível carregar as configurações de IA.',
            style: AppTextStyles.bodySm(t.txtSecondary),
          ),
        ),
        TextButton(onPressed: onRetry, child: const Text('Tentar de novo')),
      ],
    );
  }
}
