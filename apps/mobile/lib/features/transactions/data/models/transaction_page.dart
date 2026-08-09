import 'transaction_item.dart';

/// One page of `/transaction/filtered`, plus the period totals the endpoint
/// returns alongside it.
///
/// The totals cover the **whole filtered period**, not just the items in this
/// page — that is what lets the totalizador stay correct while the list is only
/// partially loaded.
class TransactionPage {
  const TransactionPage({
    required this.items,
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.totalIncomeCents,
    required this.totalExpenseCents,
    required this.balanceCents,
  });

  final List<TransactionItem> items;
  final int currentPage;
  final int totalPages;

  /// Total rows matching the filter across every page.
  final int totalItems;

  final int totalIncomeCents;
  final int totalExpenseCents;
  final int balanceCents;

  bool get hasMore => currentPage < totalPages;

  static const empty = TransactionPage(
    items: [],
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    totalIncomeCents: 0,
    totalExpenseCents: 0,
    balanceCents: 0,
  );
}
