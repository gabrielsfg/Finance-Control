import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeFilter {
  const HomeFilter({
    required this.startDate,
    required this.endDate,
    this.accountId,
    this.categoryId,
  });

  final DateTime startDate;
  final DateTime endDate;
  final int? accountId;
  final int? categoryId;

  HomeFilter copyWith({
    DateTime? startDate,
    DateTime? endDate,
    int? accountId,
    int? categoryId,
    bool clearAccount = false,
    bool clearCategory = false,
  }) =>
      HomeFilter(
        startDate: startDate ?? this.startDate,
        endDate: endDate ?? this.endDate,
        accountId: clearAccount ? null : (accountId ?? this.accountId),
        categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
      );
}

class HomeFilterNotifier extends Notifier<HomeFilter> {
  @override
  HomeFilter build() {
    final now = DateTime.now();
    return HomeFilter(
      startDate: DateTime(now.year, now.month, 1),
      endDate: DateTime(now.year, now.month + 1, 0),
    );
  }

  void update(HomeFilter filter) => state = filter;

  void setPeriod(DateTime start, DateTime end) =>
      state = state.copyWith(startDate: start, endDate: end);

  void setAccount(int? accountId) => state = state.copyWith(
        accountId: accountId,
        clearAccount: accountId == null,
      );

  void setCategory(int? categoryId) => state = state.copyWith(
        categoryId: categoryId,
        clearCategory: categoryId == null,
      );
}

final homeFilterProvider =
    NotifierProvider<HomeFilterNotifier, HomeFilter>(HomeFilterNotifier.new);
