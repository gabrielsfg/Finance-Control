import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/ai_models.dart';
import '../data/assistant_repository.dart';
import '../data/insight_repository.dart';

// ── Weekly analyses ──────────────────────────────────────────────────────────
//
// Auto-disposed: each card lives on one screen, and the server caches the
// week's analysis, so coming back to the screen is a cheap read.

class SpendingInsightNotifier extends AutoDisposeAsyncNotifier<AiInsightResult> {
  @override
  Future<AiInsightResult> build() =>
      ref.read(insightRepositoryProvider).getSpending();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(insightRepositoryProvider).getSpending());
  }
}

final spendingInsightProvider = AsyncNotifierProvider.autoDispose<
    SpendingInsightNotifier, AiInsightResult>(SpendingInsightNotifier.new);

class PortfolioInsightNotifier
    extends AutoDisposeAsyncNotifier<AiInsightResult> {
  @override
  Future<AiInsightResult> build() =>
      ref.read(insightRepositoryProvider).getPortfolio();

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
        () => ref.read(insightRepositoryProvider).getPortfolio());
  }
}

final portfolioInsightProvider = AsyncNotifierProvider.autoDispose<
    PortfolioInsightNotifier, AiInsightResult>(PortfolioInsightNotifier.new);

// ── Settings ("IA no Quantia") ───────────────────────────────────────────────

/// Null while signed out. Also read by the chat entry point to decide between
/// the chat and the Premium notice.
class AiSettingsNotifier extends AsyncNotifier<AiSettings?> {
  @override
  Future<AiSettings?> build() async {
    final authState = await ref.watch(authNotifierProvider.future);
    if (!authState.isAuthenticated || authState.accessToken == null) {
      return null;
    }
    return ref.read(insightRepositoryProvider).getSettings();
  }

  Future<void> setEnabled(bool enabled) async {
    final previous = state.valueOrNull;
    // Optimistic: the switch moves at once and snaps back if the call fails.
    if (previous != null) state = AsyncData(previous.copyWith(aiEnabled: enabled));
    try {
      final updated = await ref
          .read(insightRepositoryProvider)
          .updateSettings(aiEnabled: enabled);
      state = AsyncData(updated);
      _invalidateAiContent();
    } catch (_) {
      state = AsyncData(previous);
      rethrow;
    }
  }

  Future<int> deleteInsights() async {
    final deleted = await ref.read(insightRepositoryProvider).deleteInsights();
    final current = state.valueOrNull;
    if (current != null) state = AsyncData(current.copyWith(insightCount: 0));
    ref.invalidate(spendingInsightProvider);
    ref.invalidate(portfolioInsightProvider);
    return deleted;
  }

  Future<int> deleteConversations() async {
    final deleted =
        await ref.read(assistantRepositoryProvider).deleteAllConversations();
    final current = state.valueOrNull;
    if (current != null) {
      state = AsyncData(current.copyWith(conversationCount: 0));
    }
    return deleted;
  }

  /// Keeps the usage counter in step with what a chat reply reported.
  void updateUsage({required int used, required int limit}) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData(
      current.copyWith(chatMessagesUsed: used, chatMessagesLimit: limit),
    );
  }

  void setConversationCount(int count) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData(current.copyWith(conversationCount: count));
  }

  /// Re-reads the counters without flashing a loading state.
  Future<void> reloadQuietly() async {
    try {
      final settings = await ref.read(insightRepositoryProvider).getSettings();
      state = AsyncData(settings);
    } catch (_) {
      // Counters are informative; a failed refresh keeps the last values.
    }
  }

  void _invalidateAiContent() {
    ref.invalidate(spendingInsightProvider);
    ref.invalidate(portfolioInsightProvider);
  }
}

final aiSettingsProvider =
    AsyncNotifierProvider<AiSettingsNotifier, AiSettings?>(
  AiSettingsNotifier.new,
);
