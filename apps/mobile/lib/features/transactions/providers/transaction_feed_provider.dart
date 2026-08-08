import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../budgets/providers/budget_provider.dart';
import '../data/models/transaction_item.dart';
import '../data/models/transaction_page.dart';
import '../data/models/transaction_query.dart';
import '../data/transaction_repository.dart';
import 'transaction_filter_provider.dart';

/// How many rows each request pulls. Two screenfuls-ish: enough that the first
/// page fills the viewport and the reader hits the trigger while scrolling
/// rather than while staring at a spinner.
const int kTransactionPageSize = 25;

/// The transactions list as the UI consumes it: the rows loaded so far, the
/// period totals, and whether there is more to fetch.
class TransactionFeed {
  const TransactionFeed({
    required this.items,
    required this.hasMore,
    required this.isLoadingMore,
    required this.totalItems,
    required this.totalIncomeCents,
    required this.totalExpenseCents,
    required this.balanceCents,
    this.loadMoreError,
  });

  /// Every row fetched so far, newest first.
  final List<TransactionItem> items;

  final bool hasMore;
  final bool isLoadingMore;

  /// Rows matching the filter across the whole period, not just [items].
  final int totalItems;

  /// Totals for the **whole filtered period** — they come from the server, so
  /// the totalizador is right even while the list is only partly loaded.
  final int totalIncomeCents;
  final int totalExpenseCents;
  final int balanceCents;

  /// Set when appending a page failed, so the footer can offer a retry without
  /// throwing away the rows already on screen.
  final Object? loadMoreError;

  TransactionFeed copyWith({
    List<TransactionItem>? items,
    bool? hasMore,
    bool? isLoadingMore,
    int? totalItems,
    int? totalIncomeCents,
    int? totalExpenseCents,
    int? balanceCents,
    Object? loadMoreError,
    bool clearLoadMoreError = false,
  }) {
    return TransactionFeed(
      items: items ?? this.items,
      hasMore: hasMore ?? this.hasMore,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      totalItems: totalItems ?? this.totalItems,
      totalIncomeCents: totalIncomeCents ?? this.totalIncomeCents,
      totalExpenseCents: totalExpenseCents ?? this.totalExpenseCents,
      balanceCents: balanceCents ?? this.balanceCents,
      loadMoreError:
          clearLoadMoreError ? null : (loadMoreError ?? this.loadMoreError),
    );
  }
}

/// Pages `/transaction/filtered` as the reader scrolls.
///
/// Watching [transactionFilterProvider] inside [build] is deliberate: changing
/// any filter re-runs build, which drops the accumulated pages and starts over
/// at page 1. That is the correct behaviour — a filter applies to the whole
/// dataset, so the previous pages are meaningless under the new one.
class TransactionFeedNotifier extends AsyncNotifier<TransactionFeed> {
  int _loadedPage = 0;
  late TransactionQuery _query;

  @override
  Future<TransactionFeed> build() async {
    final filter = ref.watch(transactionFilterProvider);

    // Select only the two dates we actually use: watching the whole AsyncValue
    // would rebuild the feed (and refetch page 1) on every loading transition
    // of the budget provider, not just when the window really moves.
    final window = ref.watch(budgetNotifierProvider.select(
      (async) => (async.valueOrNull?.startDate, async.valueOrNull?.endDate),
    ));

    _query = TransactionQuery.fromFilter(
      filter,
      budgetStart: window.$1,
      budgetEnd: window.$2,
      now: DateTime.now(),
    );

    final page = await _fetch(1);
    _loadedPage = 1;

    return TransactionFeed(
      items: page.items,
      hasMore: page.hasMore,
      isLoadingMore: false,
      totalItems: page.totalItems,
      totalIncomeCents: page.totalIncomeCents,
      totalExpenseCents: page.totalExpenseCents,
      balanceCents: page.balanceCents,
    );
  }

  Future<TransactionPage> _fetch(int page) {
    return ref.read(transactionRepositoryProvider).getFilteredTransactions(
          startDate: _query.startDate,
          finishDate: _query.finishDate,
          page: page,
          pageSize: kTransactionPageSize,
          accountIds: _query.accountIds,
          subCategoryIds: _query.subCategoryIds,
          areaIds: _query.areaIds,
          search: _query.search,
          type: _query.type,
          paymentType: _query.paymentType,
          minValueCents: _query.minValueCents,
          maxValueCents: _query.maxValueCents,
        );
  }

  /// Appends the next page. Safe to call on every scroll frame — it no-ops while
  /// a request is in flight, at the end of the feed, or before the first page
  /// has landed.
  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null) return;
    if (current.isLoadingMore || !current.hasMore) return;

    state = AsyncData(current.copyWith(
      isLoadingMore: true,
      clearLoadMoreError: true,
    ));

    final nextPage = _loadedPage + 1;
    try {
      final page = await _fetch(nextPage);

      // The filter may have changed while the request was in flight, which
      // rebuilds the notifier — in that case this response is stale.
      final latest = state.valueOrNull;
      if (latest == null || !latest.isLoadingMore) return;

      // Guard against overlap: a row created between two requests shifts the
      // offset window. The Id tiebreaker on the server makes this rare, but a
      // concurrent insert can still surface a row twice.
      final seen = latest.items.map((t) => t.id).toSet();
      final fresh = page.items.where((t) => seen.add(t.id)).toList();

      _loadedPage = nextPage;
      state = AsyncData(latest.copyWith(
        items: [...latest.items, ...fresh],
        hasMore: page.hasMore,
        isLoadingMore: false,
        totalItems: page.totalItems,
        totalIncomeCents: page.totalIncomeCents,
        totalExpenseCents: page.totalExpenseCents,
        balanceCents: page.balanceCents,
      ));
    } catch (error) {
      final latest = state.valueOrNull;
      if (latest == null) return;
      state = AsyncData(latest.copyWith(
        isLoadingMore: false,
        loadMoreError: error,
      ));
    }
  }

  /// Discards every loaded page and refetches from the first one — for
  /// pull-to-refresh and after a mutation.
  Future<void> refresh() async {
    _loadedPage = 0;
    state = const AsyncLoading<TransactionFeed>().copyWithPrevious(state);
    state = await AsyncValue.guard(build);
  }
}

final transactionFeedProvider =
    AsyncNotifierProvider<TransactionFeedNotifier, TransactionFeed>(
  TransactionFeedNotifier.new,
);
