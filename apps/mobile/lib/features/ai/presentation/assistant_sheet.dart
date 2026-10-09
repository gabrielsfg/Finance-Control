import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../core/utils/ai_labels.dart';
import '../../../core/utils/app_locale.dart';
import '../data/ai_models.dart';
import '../providers/assistant_provider.dart';
import '../providers/insight_provider.dart';
import 'ai_state_notice.dart';
import 'assistant_message_view.dart';

/// Opens the assistant: the full-height chat sheet for Premium accounts, the
/// Premium notice for everyone else.
Future<void> openAssistant(BuildContext context, WidgetRef ref) {
  final settings = ref.read(aiSettingsProvider).valueOrNull;
  if (settings != null && settings.isAvailable && !settings.isPremium) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => const _PremiumSheet(),
    );
  }
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const AssistantSheet(),
  );
}

class AssistantSheet extends ConsumerStatefulWidget {
  const AssistantSheet({super.key});

  @override
  ConsumerState<AssistantSheet> createState() => _AssistantSheetState();
}

class _AssistantSheetState extends ConsumerState<AssistantSheet> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  bool _showConversations = false;

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    final chat = ref.watch(assistantChatProvider);
    final settings = ref.watch(aiSettingsProvider).valueOrNull;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final safeBottom = MediaQuery.viewPaddingOf(context).bottom;

    ref.listen(assistantChatProvider, (previous, next) {
      if (previous?.messages.length != next.messages.length ||
          previous?.sending != next.sending) {
        _scrollToEnd();
      }
    });

    final used = chat.messagesUsed ?? settings?.chatMessagesUsed;
    final limit = chat.messagesLimit ?? settings?.chatMessagesLimit;
    final block = chat.block ?? settings?.chatBlock;

    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.94,
      child: Container(
        decoration: BoxDecoration(
          color: t.bg,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(AppRadius.xl3),
          ),
          border: Border.all(color: t.mist),
        ),
        child: Padding(
          padding: EdgeInsets.only(bottom: bottomInset),
          child: Column(
            children: [
              const SizedBox(height: 10),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: t.mist,
                  borderRadius: AppRadius.pillAll,
                ),
              ),
              _Header(
                title: _showConversations
                    ? 'Conversas'
                    : (chat.title?.isNotEmpty == true
                        ? chat.title!
                        : 'Nova conversa'),
                usage: used != null && limit != null && limit > 0
                    ? aiUsageLabel(used, limit)
                    : null,
                showingList: _showConversations,
                onToggleList: () =>
                    setState(() => _showConversations = !_showConversations),
                onNew: _newConversation,
                onClose: () => Navigator.of(context).pop(),
              ),
              Divider(height: 1, color: t.mist),
              Expanded(
                child: _showConversations
                    ? _ConversationList(
                        activeId: chat.conversationId,
                        onOpen: (id) {
                          setState(() => _showConversations = false);
                          ref
                              .read(assistantChatProvider.notifier)
                              .openConversation(id);
                        },
                        onNew: _newConversation,
                      )
                    : _buildMessages(context, chat, block),
              ),
              if (!_showConversations) ...[
                if (block != null)
                  _Banner(
                    child: AiStateNotice(
                      status: block,
                      quotaLabel: aiChatQuotaLabel(limit),
                      onOpenSettings: () {
                        final router = GoRouter.of(context);
                        Navigator.of(context).pop();
                        router.go('/profile');
                      },
                    ),
                  )
                else if (chat.sendError)
                  _Banner(
                    child: Row(
                      children: [
                        Icon(LucideIcons.alertCircle, size: 16, color: t.error),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Não foi possível enviar sua mensagem.',
                            style: AppTextStyles.bodySm(t.txtSecondary),
                          ),
                        ),
                        TextButton(
                          onPressed: () => ref
                              .read(assistantChatProvider.notifier)
                              .retryFailed(),
                          child: const Text('Tentar novamente'),
                        ),
                      ],
                    ),
                  ),
                _InputBar(
                  controller: _input,
                  enabled: block == null && !chat.sending,
                  onSend: _send,
                  bottomPadding: bottomInset > 0 ? 8 : safeBottom + 8,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessages(
    BuildContext context,
    AssistantChatState chat,
    AiAvailability? block,
  ) {
    final t = AppThemeTokens.of(context);

    if (chat.loadingConversation) {
      return const Center(child: CircularProgressIndicator());
    }
    if (chat.loadError) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Não foi possível abrir a conversa.',
                style: AppTextStyles.bodySm(t.txtSecondary)),
            TextButton(
              onPressed: chat.conversationId == null
                  ? null
                  : () => ref
                      .read(assistantChatProvider.notifier)
                      .openConversation(chat.conversationId!),
              child: const Text('Tentar de novo'),
            ),
          ],
        ),
      );
    }
    if (chat.messages.isEmpty && !chat.sending) {
      return _EmptyConversation(
        enabled: block == null,
        onPrompt: (prompt) => _send(prompt),
      );
    }

    return ListView.builder(
      controller: _scroll,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      itemCount: chat.messages.length + (chat.sending ? 1 : 0),
      itemBuilder: (_, index) {
        if (index >= chat.messages.length) {
          return const AssistantTypingIndicator();
        }
        final message = chat.messages[index];
        return AssistantMessageView(
          key: ValueKey(message.id),
          message: message,
          onRetry: message.isError && block == null && !chat.sending
              ? () => _retryReply(chat.messages, index)
              : null,
        );
      },
    );
  }

  /// An error reply is retried by resending the user message it answered.
  void _retryReply(List<AiMessage> messages, int errorIndex) {
    for (var i = errorIndex - 1; i >= 0; i--) {
      if (messages[i].isUser) {
        ref.read(assistantChatProvider.notifier).send(messages[i].content);
        return;
      }
    }
  }

  void _send([String? text]) {
    final content = (text ?? _input.text).trim();
    if (content.isEmpty) return;
    if (text == null) _input.clear();
    ref.read(assistantChatProvider.notifier).send(content);
  }

  void _newConversation() {
    ref.read(assistantChatProvider.notifier).newConversation();
    _input.clear();
    setState(() => _showConversations = false);
  }

  void _scrollToEnd() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scroll.hasClients) return;
      _scroll.animateTo(
        _scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }
}

// ── Header ──────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({
    required this.title,
    required this.usage,
    required this.showingList,
    required this.onToggleList,
    required this.onNew,
    required this.onClose,
  });

  final String title;
  final String? usage;
  final bool showingList;
  final VoidCallback onToggleList;
  final VoidCallback onNew;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 10),
      child: Row(
        children: [
          IconButton(
            tooltip: showingList ? 'Voltar à conversa' : 'Conversas',
            onPressed: onToggleList,
            icon: Icon(
              showingList ? LucideIcons.chevronLeft : LucideIcons.messagesSquare,
              size: 20,
              color: t.txtSecondary,
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.sparkles, size: 12, color: t.accent),
                    const SizedBox(width: 5),
                    Text('ASSISTENTE',
                        style: AppTextStyles.eyebrow(t.txtSecondary,
                            fontSize: 10)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTextStyles.h3(t.txtPrimary).copyWith(fontSize: 16),
                ),
                if (usage != null)
                  Text(usage!, style: AppTextStyles.caption(t.txtTertiary)),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Nova conversa',
            onPressed: onNew,
            icon: Icon(LucideIcons.messageSquarePlus,
                size: 20, color: t.txtSecondary),
          ),
          IconButton(
            tooltip: 'Fechar',
            onPressed: onClose,
            icon: Icon(LucideIcons.x, size: 20, color: t.txtSecondary),
          ),
        ],
      ),
    );
  }
}

// ── Empty conversation ──────────────────────────────────────────────────────

class _EmptyConversation extends StatelessWidget {
  const _EmptyConversation({required this.enabled, required this.onPrompt});

  final bool enabled;
  final ValueChanged<String> onPrompt;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: t.accent.withValues(alpha: 0.13),
              borderRadius: AppRadius.baseAll,
            ),
            child: Icon(LucideIcons.bot, size: 22, color: t.accent),
          ),
          const SizedBox(height: 14),
          Text('Pergunte sobre suas finanças',
              style: AppTextStyles.h2(t.txtPrimary)),
          const SizedBox(height: 6),
          Text(
            'O assistente consulta seus dados para responder e pode preparar '
            'lançamentos — nada é salvo sem a sua confirmação.',
            style: AppTextStyles.bodySm(t.txtSecondary),
          ),
          const SizedBox(height: 20),
          Text('EXEMPLOS', style: AppTextStyles.eyebrow(t.txtSecondary)),
          const SizedBox(height: 10),
          for (final prompt in aiExamplePrompts)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: enabled ? () => onPrompt(prompt) : null,
                  borderRadius: AppRadius.baseAll,
                  child: Ink(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: t.surface,
                      borderRadius: AppRadius.baseAll,
                      border: Border.all(color: t.mist),
                    ),
                    child: Text(
                      prompt,
                      style: AppTextStyles.bodySm(
                          enabled ? t.txtPrimary : t.txtDisabled),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Conversation list ───────────────────────────────────────────────────────

class _ConversationList extends ConsumerWidget {
  const _ConversationList({
    required this.activeId,
    required this.onOpen,
    required this.onNew,
  });

  final int? activeId;
  final ValueChanged<int> onOpen;
  final VoidCallback onNew;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppThemeTokens.of(context);
    final fmt = AppLocaleScope.of(context);
    final async = ref.watch(assistantConversationsProvider);

    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (_, _) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Não foi possível carregar as conversas.',
                style: AppTextStyles.bodySm(t.txtSecondary)),
            TextButton(
              onPressed: () => ref.invalidate(assistantConversationsProvider),
              child: const Text('Tentar de novo'),
            ),
          ],
        ),
      ),
      data: (conversations) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: onNew,
                borderRadius: AppRadius.baseAll,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                  child: Row(
                    children: [
                      Icon(LucideIcons.plus, size: 18, color: t.accent),
                      const SizedBox(width: 10),
                      Text(
                        'Nova conversa',
                        style: AppTextStyles.body(t.accent).copyWith(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            if (conversations.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'Nenhuma conversa ainda.',
                  textAlign: TextAlign.center,
                  style: AppTextStyles.bodySm(t.txtTertiary),
                ),
              ),
            for (final conversation in conversations)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  color: conversation.id == activeId ? t.surfaceEl : t.surface,
                  borderRadius: AppRadius.baseAll,
                  border: Border.all(color: t.mist),
                ),
                child: ListTile(
                  onTap: () => onOpen(conversation.id),
                  contentPadding: const EdgeInsets.only(left: 14, right: 4),
                  title: Text(
                    conversation.title.isEmpty
                        ? 'Conversa sem título'
                        : conversation.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTextStyles.body(t.txtPrimary).copyWith(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    fmt.formatDate(conversation.lastMessageAt),
                    style: AppTextStyles.caption(t.txtTertiary),
                  ),
                  trailing: IconButton(
                    tooltip: 'Apagar conversa',
                    icon: Icon(LucideIcons.trash2,
                        size: 18, color: t.txtTertiary),
                    onPressed: () => _delete(context, ref, conversation),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Future<void> _delete(
    BuildContext context,
    WidgetRef ref,
    AiConversationSummary conversation,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        final t = AppThemeTokens.of(dialogContext);
        return AlertDialog(
          backgroundColor: t.bg,
          title: Text('Apagar conversa', style: AppTextStyles.h3(t.txtPrimary)),
          content: Text(
            'A conversa e as propostas dela serão apagadas. Esta ação não pode '
            'ser desfeita.',
            style: AppTextStyles.body(t.txtSecondary),
          ),
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
        );
      },
    );
    if (confirmed != true) return;
    try {
      await ref
          .read(assistantConversationsProvider.notifier)
          .delete(conversation.id);
      if (conversation.id == activeId) {
        ref.read(assistantChatProvider.notifier).newConversation();
      }
    } catch (_) {
      messenger.showSnackBar(const SnackBar(
        content: Text('Não foi possível apagar a conversa.'),
      ));
    }
  }
}

// ── Input ───────────────────────────────────────────────────────────────────

class _InputBar extends StatelessWidget {
  const _InputBar({
    required this.controller,
    required this.enabled,
    required this.onSend,
    required this.bottomPadding,
  });

  final TextEditingController controller;
  final bool enabled;
  final VoidCallback onSend;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: EdgeInsets.fromLTRB(12, 8, 8, bottomPadding),
      decoration: BoxDecoration(
        color: t.surface,
        border: Border(top: BorderSide(color: t.mist)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              enabled: enabled,
              minLines: 1,
              maxLines: 5,
              maxLength: assistantMessageMaxLength,
              textCapitalization: TextCapitalization.sentences,
              style: AppTextStyles.body(t.txtPrimary).copyWith(fontSize: 14),
              // The counter only matters close to the limit.
              buildCounter: (_,
                      {required currentLength,
                      required isFocused,
                      maxLength}) =>
                  currentLength > assistantMessageMaxLength - 200
                      ? Text('$currentLength/$maxLength',
                          style: AppTextStyles.caption(t.txtTertiary))
                      : null,
              decoration: InputDecoration(
                hintText: enabled ? 'Pergunte algo…' : 'Assistente indisponível',
                hintStyle: AppTextStyles.body(t.txtTertiary).copyWith(fontSize: 14),
                filled: true,
                fillColor: t.surfaceEl,
                isDense: true,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: AppRadius.baseAll,
                  borderSide: BorderSide(color: t.mist),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: AppRadius.baseAll,
                  borderSide: BorderSide(color: t.mist),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: AppRadius.baseAll,
                  borderSide: BorderSide(color: t.primary),
                ),
                disabledBorder: OutlineInputBorder(
                  borderRadius: AppRadius.baseAll,
                  borderSide: BorderSide(color: t.mist),
                ),
              ),
            ),
          ),
          const SizedBox(width: 6),
          Padding(
            padding: const EdgeInsets.only(bottom: 2),
            child: GestureDetector(
              onTap: enabled ? onSend : null,
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: enabled ? AppColors.primaryGradient : null,
                  color: enabled ? null : t.surface3,
                ),
                child: Icon(LucideIcons.send,
                    size: 18, color: enabled ? Colors.white : t.txtDisabled),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Banner extends StatelessWidget {
  const _Banner({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      decoration: BoxDecoration(
        color: t.surfaceEl,
        border: Border(top: BorderSide(color: t.mist)),
      ),
      child: child,
    );
  }
}

class _PremiumSheet extends StatelessWidget {
  const _PremiumSheet();

  @override
  Widget build(BuildContext context) {
    final t = AppThemeTokens.of(context);
    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 12, 20, MediaQuery.viewPaddingOf(context).bottom + 24),
      decoration: BoxDecoration(
        color: t.surface,
        borderRadius:
            const BorderRadius.vertical(top: Radius.circular(AppRadius.xl3)),
        border: Border.all(color: t.mist),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: t.mist,
              borderRadius: AppRadius.pillAll,
            ),
          ),
          const SizedBox(height: AppSpacing.lg),
          const AiPremiumNotice(
            flat: true,
            title: 'Assistente com IA',
            message: 'Converse com seus dados, tire dúvidas sobre gastos e '
                'registre lançamentos pelo chat. Disponível no plano Premium.',
          ),
        ],
      ),
    );
  }
}
