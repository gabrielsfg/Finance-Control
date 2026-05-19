import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../data/analytics_repository.dart';
import '../data/models/analytics_models.dart';
import '../data/models/chart_config.dart';
import 'home_filter_provider.dart';

// ── Chart config (persisted in UserPreferences.analyticsConfig) ──────────────

class ChartConfigNotifier extends AsyncNotifier<List<ChartConfig>> {
  @override
  Future<List<ChartConfig>> build() async {
    try {
      final dio = ref.read(apiClientProvider).dio;
      final res = await dio.get(ApiEndpoints.userPreferences);
      final raw = res.data['analyticsConfig'] as String? ?? '[]';
      return ChartConfig.fromJsonString(raw);
    } catch (_) {
      return ChartConfig.defaultConfigs();
    }
  }

  Future<void> save(List<ChartConfig> configs) async {
    state = AsyncData(configs);
    try {
      final dio = ref.read(apiClientProvider).dio;
      await dio.patch(ApiEndpoints.userPreferences, data: {
        'analyticsConfig': ChartConfig.toJsonString(configs),
      });
    } catch (_) {
      // silently keep local state — will sync on next load
    }
  }

  void toggle(ChartId id) {
    final current = state.valueOrNull;
    if (current == null) return;
    final updated = current
        .map((c) => c.chartId == id ? c.copyWith(enabled: !c.enabled) : c)
        .toList();
    save(updated);
  }

  void reorder(int oldIndex, int newIndex) {
    final current = state.valueOrNull;
    if (current == null) return;
    final list = [...current];
    final item = list.removeAt(oldIndex);
    list.insert(newIndex, item);
    final reindexed =
        list.indexed.map((e) => e.$2.copyWith(order: e.$1)).toList();
    save(reindexed);
  }
}

final chartConfigProvider =
    AsyncNotifierProvider<ChartConfigNotifier, List<ChartConfig>>(
        ChartConfigNotifier.new);

// ── Analytics data providers (each watches homeFilterProvider) ────────────────

final incomeExpenseProvider =
    FutureProvider.autoDispose<List<IncomeExpenseItem>>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getIncomeExpense(filter.startDate, filter.endDate,
      accountId: filter.accountId);
});

final balanceEvolutionProvider =
    FutureProvider.autoDispose<List<BalanceEvolutionItem>>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getBalanceEvolution(filter.startDate, filter.endDate,
      accountId: filter.accountId);
});

final expensesByCategoryProvider =
    FutureProvider.autoDispose<List<ExpensesByCategory>>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getExpensesByCategory(filter.startDate, filter.endDate,
      accountId: filter.accountId);
});

final categoryEvolutionProvider =
    FutureProvider.autoDispose<List<CategoryEvolutionItem>>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  final categoryId = filter.categoryId;
  if (categoryId == null) return Future.value([]);
  return repo.getCategoryEvolution(filter.startDate, filter.endDate, categoryId,
      accountId: filter.accountId);
});

final netWorthEvolutionProvider =
    FutureProvider.autoDispose<List<NetWorthEvolutionItem>>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getNetWorthEvolution(filter.startDate, filter.endDate);
});

final futureCommitmentsProvider =
    FutureProvider.autoDispose<List<FutureCommitmentsItem>>((ref) {
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getFutureCommitments();
});

final spendingHeatmapProvider =
    FutureProvider.autoDispose<List<SpendingHeatmapItem>>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getSpendingHeatmap(filter.startDate, filter.endDate,
      accountId: filter.accountId);
});

final balanceProjectionProvider =
    FutureProvider.autoDispose<BalanceProjection>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getBalanceProjection(accountId: filter.accountId);
});

final categoryProjectionProvider =
    FutureProvider.autoDispose<List<CategoryProjection>>((ref) {
  final filter = ref.watch(homeFilterProvider);
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getCategoryProjection(accountId: filter.accountId);
});

final netWorthProjectionProvider =
    FutureProvider.autoDispose<NetWorthProjection>((ref) {
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getNetWorthProjection();
});

final commitmentsImpactProvider =
    FutureProvider.autoDispose<CommitmentsImpact>((ref) {
  final repo = ref.read(analyticsRepositoryProvider);
  return repo.getCommitmentsImpact();
});
