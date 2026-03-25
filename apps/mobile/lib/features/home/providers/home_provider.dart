import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../features/auth/providers/auth_provider.dart';
import '../data/home_repository.dart';
import '../data/models/home_summary.dart';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

class HomeState {
  const HomeState({
    required this.startDate,
    required this.finishDate,
    this.budgetId,
    this.summary,
  });

  final DateTime startDate;
  final DateTime finishDate;
  final int? budgetId;
  final HomeSummary? summary;

  HomeState copyWith({
    DateTime? startDate,
    DateTime? finishDate,
    int? budgetId,
    HomeSummary? summary,
  }) {
    return HomeState(
      startDate: startDate ?? this.startDate,
      finishDate: finishDate ?? this.finishDate,
      budgetId: budgetId ?? this.budgetId,
      summary: summary ?? this.summary,
    );
  }
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------

class HomeNotifier extends AsyncNotifier<HomeState> {
  @override
  Future<HomeState> build() async {
    // Only fetch if there is a real authenticated token.
    // This prevents spurious requests during the login flow.
    final authState = await ref.watch(authNotifierProvider.future);
    if (!authState.isAuthenticated || authState.accessToken == null) {
      final now = DateTime.now();
      return HomeState(
        startDate: DateTime(now.year, now.month, 1),
        finishDate: DateTime(now.year, now.month + 1, 0),
      );
    }

    final now = DateTime.now();
    final start = DateTime(now.year, now.month, 1);
    final finish = DateTime(now.year, now.month + 1, 0);

    final params = HomeState(startDate: start, finishDate: finish);
    return _fetch(params);
  }

  Future<void> refresh() async {
    final current = state.valueOrNull;
    if (current == null) return;
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetch(current));
  }

  Future<HomeState> _fetch(HomeState params) async {
    try {
      final summary = await ref.read(homeRepositoryProvider).getSummary(
            startDate: params.startDate,
            finishDate: params.finishDate,
            budgetId: params.budgetId,
          );
      return params.copyWith(summary: summary);
    } on Object catch (e, st) {
      Error.throwWithStackTrace(e, st);
    }
  }

  Future<void> onUnauthorized() async {
    await ref.read(authNotifierProvider.notifier).logout();
  }
}

final homeNotifierProvider =
    AsyncNotifierProvider<HomeNotifier, HomeState>(HomeNotifier.new);
