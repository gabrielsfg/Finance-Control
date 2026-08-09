import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/create_transaction_request_dto.dart';
import 'dtos/create_transaction_response_dto.dart';
import 'dtos/get_transaction_response_dto.dart';
import 'dtos/update_recurring_request_dto.dart';
import 'dtos/update_transaction_request_dto.dart';
import 'models/transaction_item.dart';
import 'models/transaction_page.dart';

final transactionRepositoryProvider = Provider<TransactionRepository>(
  (ref) => TransactionRepository(ref.read(apiClientProvider).dio),
);

class TransactionRepository {
  const TransactionRepository(this._dio);

  final Dio _dio;

  // ── Create ──────────────────────────────────────────────────────────────

  Future<CreateTransactionResponseDto> createTransaction(
    CreateTransactionRequestDto dto,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.transactions,
      data: dto.toJson(),
    );
    return CreateTransactionResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  // ── Read ─────────────────────────────────────────────────────────────────

  Future<GetTransactionResponseDto> getTransactionById(int id) async {
    final response = await _dio.get(ApiEndpoints.transactionById(id));
    return GetTransactionResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  /// Fetches every transaction linked to [budgetId] within the budget's
  /// [startDate]–[finishDate] window via the consolidated `filtered` endpoint.
  /// Dates are formatted as `yyyy-MM-dd` to bind to the backend `DateOnly`.
  Future<List<GetTransactionResponseDto>> getTransactionsByBudget(
    int budgetId, {
    required DateTime startDate,
    required DateTime finishDate,
  }) async {
    final response = await _dio.get(
      ApiEndpoints.transactionsFiltered,
      queryParameters: {
        'StartDate': _formatDate(startDate),
        'FinishDate': _formatDate(finishDate),
        'BudgetIds': [budgetId],
        'PageSize': 100,
      },
    );
    final page = (response.data as Map<String, dynamic>)['page']
        as Map<String, dynamic>;
    return (page['items'] as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// One page of the filtered feed — the call behind the transactions list.
  ///
  /// Every filter is applied **server-side** on purpose. Filtering locally only
  /// worked while the app held the entire history in memory; now that the list
  /// arrives a page at a time, a local filter would search the loaded page
  /// instead of the dataset and silently return the wrong rows.
  Future<TransactionPage> getFilteredTransactions({
    required DateTime startDate,
    required DateTime finishDate,
    int page = 1,
    int pageSize = 25,
    List<int>? budgetIds,
    List<int>? accountIds,
    List<int>? subCategoryIds,
    List<int>? areaIds,
    List<int>? tagIds,
    String? search,
    String? type,
    String? paymentType,
    int? minValueCents,
    int? maxValueCents,
    String sortField = 'date',
    String sortOrder = 'desc',
  }) async {
    final response = await _dio.get(
      ApiEndpoints.transactionsFiltered,
      queryParameters: <String, dynamic>{
        'StartDate': _formatDate(startDate),
        'FinishDate': _formatDate(finishDate),
        'Page': page,
        'PageSize': pageSize,
        'SortField': sortField,
        'SortOrder': sortOrder,
        if (budgetIds != null && budgetIds.isNotEmpty) 'BudgetIds': budgetIds,
        if (accountIds != null && accountIds.isNotEmpty) 'AccountIds': accountIds,
        if (subCategoryIds != null && subCategoryIds.isNotEmpty)
          'SubCategoryIds': subCategoryIds,
        if (areaIds != null && areaIds.isNotEmpty) 'AreaIds': areaIds,
        if (tagIds != null && tagIds.isNotEmpty) 'TagIds': tagIds,
        if (search != null && search.trim().isNotEmpty) 'Search': search.trim(),
        'Type': ?type,
        'PaymentType': ?paymentType,
        'MinValue': ?minValueCents,
        'MaxValue': ?maxValueCents,
      },
    );

    final data = response.data as Map<String, dynamic>;
    final pageJson = data['page'] as Map<String, dynamic>;

    return TransactionPage(
      items: (pageJson['items'] as List)
          .map((e) => TransactionItem.fromDto(
              GetTransactionResponseDto.fromJson(e as Map<String, dynamic>)))
          .toList(),
      currentPage: (pageJson['currentPage'] as num?)?.toInt() ?? page,
      totalPages: (pageJson['totalPages'] as num?)?.toInt() ?? 1,
      totalItems: (pageJson['totalItems'] as num?)?.toInt() ?? 0,
      totalIncomeCents: (data['totalIncome'] as num?)?.toInt() ?? 0,
      totalExpenseCents: (data['totalExpense'] as num?)?.toInt() ?? 0,
      balanceCents: (data['balance'] as num?)?.toInt() ?? 0,
    );
  }

  static String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  // ── Update ───────────────────────────────────────────────────────────────

  Future<List<GetTransactionResponseDto>> updateTransaction(
    int id,
    UpdateTransactionRequestDto dto,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.transactionById(id),
      data: dto.toJson(),
    );
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<GetTransactionResponseDto>> updateRecurringTransaction(
    int recurringId,
    UpdateRecurringRequestDto dto,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.updateRecurringTransaction(recurringId),
      data: dto.toJson(),
    );
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<GetTransactionResponseDto>> cancelRecurringTransaction(
    int recurringId,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.cancelRecurringTransaction(recurringId),
    );
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  Future<List<GetTransactionResponseDto>> deleteTransaction(int id) async {
    final response = await _dio.delete(ApiEndpoints.transactionById(id));
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
