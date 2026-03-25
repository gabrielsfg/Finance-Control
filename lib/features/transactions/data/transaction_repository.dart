import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/create_transaction_request_dto.dart';
import 'dtos/create_transaction_response_dto.dart';
import 'dtos/get_transaction_response_dto.dart';
import 'dtos/update_recurring_request_dto.dart';
import 'dtos/update_transaction_request_dto.dart';

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

  Future<List<GetTransactionResponseDto>> getAllTransactions() async {
    final response = await _dio.get(ApiEndpoints.transactions);
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<GetTransactionResponseDto> getTransactionById(int id) async {
    final response = await _dio.get(ApiEndpoints.transactionById(id));
    return GetTransactionResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  Future<List<GetTransactionResponseDto>> getTransactionsByBudget(
    int budgetId,
  ) async {
    final response =
        await _dio.get(ApiEndpoints.transactionsByBudget(budgetId));
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<GetTransactionResponseDto>> getTransactionsByAccount(
    int accountId,
  ) async {
    final response =
        await _dio.get(ApiEndpoints.transactionsByAccount(accountId));
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<GetTransactionResponseDto>> getTransactionsBySubcategory(
    int subCategoryId,
  ) async {
    final response =
        await _dio.get(ApiEndpoints.transactionsBySubcategory(subCategoryId));
    return (response.data as List)
        .map((e) =>
            GetTransactionResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
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
