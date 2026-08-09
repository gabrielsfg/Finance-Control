import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/transaction_filter_state.dart';

class TransactionFilterNotifier extends Notifier<TransactionFilterState> {
  @override
  TransactionFilterState build() => const TransactionFilterState();

  void updateSearch(String value) {
    state = state.copyWith(
      search: value.isEmpty ? null : value,
      clearSearch: value.isEmpty,
    );
  }

  void updatePeriod(TransactionPeriod period, {DateTime? from, DateTime? to}) {
    state = state.copyWith(
      period: period,
      customFrom: from,
      customTo: to,
      clearCustomFrom: from == null,
      clearCustomTo: to == null,
    );
  }

  void updateTypeFilter(String? type) {
    state = state.copyWith(
      typeFilter: type,
      clearTypeFilter: type == null,
    );
  }

  void updateAccount(int? id, String? name) {
    state = state.copyWith(
      accountId: id,
      accountName: name,
      clearAccount: id == null,
    );
  }

  void updateSubCategory(int? id, String? name) {
    state = state.copyWith(
      subCategoryId: id,
      subCategoryName: name,
      clearSubCategory: id == null,
    );
  }

  void updateArea(int? id, String? name) {
    state = state.copyWith(
      areaId: id,
      areaName: name,
      clearArea: id == null,
    );
  }

  void updateTag(int? id, String? name) {
    state = state.copyWith(
      tagId: id,
      tagName: name,
      clearTag: id == null,
    );
  }

  void updateValueRange(int? min, int? max) {
    state = state.copyWith(
      minValueCents: min,
      maxValueCents: max,
      clearMinValue: min == null,
      clearMaxValue: max == null,
    );
  }

  void clearAll() {
    state = const TransactionFilterState();
  }
}

final transactionFilterProvider =
    NotifierProvider<TransactionFilterNotifier, TransactionFilterState>(
  TransactionFilterNotifier.new,
);
