import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../accounts/providers/accounts_provider.dart';
import '../../budgets/providers/budget_provider.dart';
import '../../goals/providers/goal_provider.dart';
import '../../home/providers/home_provider.dart';
import '../../recurrences/providers/recurrence_provider.dart';
import '../../transactions/providers/picker_providers.dart';
import '../../transactions/providers/transaction_feed_provider.dart';
import '../data/ai_models.dart';
import '../data/assistant_repository.dart';
import 'insight_provider.dart';

/// The longest message the API accepts.
const assistantMessageMaxLength = 2000;

// ── Conversation list ────────────────────────────────────────────────────────

class AssistantConversationsNotifier
    extends AutoDisposeAsyncNotifier<List<AiConversationSummary>> {
  @override
  Future<List<AiConversationSummary>> build() =>
      ref.read(assistantRepositoryProvider).listConversations();

  Future<void> delete(int id) async {
    final remaining =
        await ref.read(assistantRepositoryProvider).deleteConversation(id);
    state = AsyncData(remaining);
    ref
        .read(aiSettingsProvider.notifier)
        .setConversationCount(remaining.length);
  }
}

final assistantConversationsProvider = AsyncNotifierProvider.autoDispose<
    AssistantConversationsNotifier,
    List<AiConversationSummary>>(AssistantConversationsNotifier.new);

// ── Open conversation ────────────────────────────────────────────────────────

class AssistantChatState {
  const AssistantChatState({
    this.conversationId,
    this.title,
    this.messages = const [],
    this.loadingConversation = false,
    this.loadError = false,
    this.sending = false,
    this.block,
    this.sendError = false,
    this.failedText,
    this.messagesUsed,
    this.messagesLimit,
  });

  /// Null until the first reply of a new conversation names it.
  final int? conversationId;
  final String? title;

  /// Oldest first; a user message with a negative id is still being sent.
  final List<AiMessage> messages;
  final bool loadingConversation;
  final bool loadError;
  final bool sending;

  /// The state the last send came back with when it was not answered.
  final AiAvailability? block;

  /// The last send never reached an answer (network, timeout, server error).
  final bool sendError;

  /// What to resend when the user taps "Tentar novamente".
  final String? failedText;
  final int? messagesUsed;
  final int? messagesLimit;

  bool get isEmpty => messages.isEmpty && !loadingConversation;

  AssistantChatState copyWith({
    int? conversationId,
    String? title,
    List<AiMessage>? messages,
    bool? loadingConversation,
    bool? loadError,
    bool? sending,
    AiAvailability? block,
    bool clearBlock = false,
    bool? sendError,
    String? failedText,
    bool clearFailedText = false,
    int? messagesUsed,
    int? messagesLimit,
  }) =>
      AssistantChatState(
        conversationId: conversationId ?? this.conversationId,
        title: title ?? this.title,
        messages: messages ?? this.messages,
        loadingConversation: loadingConversation ?? this.loadingConversation,
        loadError: loadError ?? this.loadError,
        sending: sending ?? this.sending,
        block: clearBlock ? null : (block ?? this.block),
        sendError: sendError ?? this.sendError,
        failedText: clearFailedText ? null : (failedText ?? this.failedText),
        messagesUsed: messagesUsed ?? this.messagesUsed,
        messagesLimit: messagesLimit ?? this.messagesLimit,
      );
}

class AssistantChatNotifier extends AutoDisposeNotifier<AssistantChatState> {
  @override
  AssistantChatState build() => const AssistantChatState();

  void newConversation() {
    if (state.sending) return;
    state = AssistantChatState(
      messagesUsed: state.messagesUsed,
      messagesLimit: state.messagesLimit,
    );
  }

  Future<void> openConversation(int id) async {
    if (state.sending) return;
    state = AssistantChatState(
      conversationId: id,
      loadingConversation: true,
      messagesUsed: state.messagesUsed,
      messagesLimit: state.messagesLimit,
    );
    try {
      final conversation =
          await ref.read(assistantRepositoryProvider).getConversation(id);
      if (state.conversationId != id) return;
      state = state.copyWith(
        title: conversation.title,
        messages: conversation.messages,
        loadingConversation: false,
      );
    } catch (_) {
      if (state.conversationId != id) return;
      state = state.copyWith(loadingConversation: false, loadError: true);
    }
  }

  Future<void> send(String text) async {
    final message = text.trim();
    if (message.isEmpty || state.sending) return;
    final content = message.length > assistantMessageMaxLength
        ? message.substring(0, assistantMessageMaxLength)
        : message;

    final pending = AiMessage.pendingUser(content);
    state = state.copyWith(
      messages: [...state.messages, pending],
      sending: true,
      sendError: false,
      clearBlock: true,
      clearFailedText: true,
    );

    // Closing the sheet mid-request must not dispose the notifier before the
    // reply lands — the answer is stored server-side and shows on reopen.
    final keepAlive = ref.keepAlive();
    try {
      final result = await ref.read(assistantRepositoryProvider).sendMessage(
            conversationId: state.conversationId,
            message: content,
          );
      final withoutPending =
          state.messages.where((m) => m.id != pending.id).toList();

      if (result.status != AiAvailability.available) {
        state = state.copyWith(
          messages: withoutPending,
          sending: false,
          block: result.status,
          messagesUsed: result.messagesUsed,
          messagesLimit: result.messagesLimit,
        );
        _syncUsage(result);
        return;
      }

      final isNew = state.conversationId == null;
      state = state.copyWith(
        conversationId: result.conversationId,
        title: result.conversationTitle,
        messages: [
          ...withoutPending,
          if (result.userMessage != null) result.userMessage!,
          if (result.assistantMessage != null) result.assistantMessage!,
        ],
        sending: false,
        messagesUsed: result.messagesUsed,
        messagesLimit: result.messagesLimit,
      );
      _syncUsage(result);
      if (isNew) {
        ref.invalidate(assistantConversationsProvider);
        ref.read(aiSettingsProvider.notifier).reloadQuietly();
      }
    } catch (_) {
      state = state.copyWith(
        messages: state.messages.where((m) => m.id != pending.id).toList(),
        sending: false,
        sendError: true,
        failedText: content,
      );
    } finally {
      keepAlive.close();
    }
  }

  /// Resends the text of a send that never got an answer.
  Future<void> retryFailed() async {
    final text = state.failedText;
    if (text != null) await send(text);
  }

  /// Confirms a proposal, optionally with the user's edits. Throws
  /// [AiActionRejected] when the server refuses the payload.
  Future<void> confirmAction(
    AiAction action,
    Map<String, dynamic>? payload,
  ) async {
    final keepAlive = ref.keepAlive();
    try {
      final updated = await ref
          .read(assistantRepositoryProvider)
          .confirmAction(action.id, payload);
      _replaceAction(updated);
      if (updated.status == AiActionStatus.confirmed) {
        _refreshAffectedData(updated.kind);
      }
    } finally {
      keepAlive.close();
    }
  }

  Future<void> cancelAction(AiAction action) async {
    final updated =
        await ref.read(assistantRepositoryProvider).cancelAction(action.id);
    _replaceAction(updated);
  }

  void _replaceAction(AiAction updated) {
    state = state.copyWith(
      messages: [
        for (final message in state.messages)
          if (message.actions.any((a) => a.id == updated.id))
            message.withActions([
              for (final a in message.actions) a.id == updated.id ? updated : a,
            ])
          else
            message,
      ],
    );
  }

  void _syncUsage(AiSendMessageResult result) {
    if (result.messagesLimit <= 0) return;
    ref
        .read(aiSettingsProvider.notifier)
        .updateUsage(used: result.messagesUsed, limit: result.messagesLimit);
  }

  /// A confirmed proposal wrote to the user's data: every screen showing that
  /// domain has to read it again.
  void _refreshAffectedData(AiActionKind kind) {
    switch (kind) {
      case AiActionKind.createTransaction:
      case AiActionKind.updateTransaction:
        ref.invalidate(transactionFeedProvider);
        ref.invalidate(homeNotifierProvider);
        ref.invalidate(accountsNotifierProvider);
        ref.invalidate(accountsProvider);
        ref.invalidate(accountDetailProvider);
        ref.invalidate(budgetNotifierProvider);
        ref.invalidate(recurrenceProvider);
      case AiActionKind.createGoal:
        ref.invalidate(goalsProvider);
        ref.invalidate(homeNotifierProvider);
      case AiActionKind.createBudget:
        ref.invalidate(budgetNotifierProvider);
        ref.invalidate(homeNotifierProvider);
    }
  }
}

final assistantChatProvider = NotifierProvider.autoDispose<
    AssistantChatNotifier, AssistantChatState>(AssistantChatNotifier.new);
