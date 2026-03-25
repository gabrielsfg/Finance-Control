import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/allocation_request_dto.dart';
import 'dtos/allocation_response_dto.dart';
import 'dtos/budget_response_dto.dart';
import 'dtos/create_budget_request_dto.dart';
import 'dtos/update_budget_request_dto.dart';

final budgetRepositoryProvider = Provider<BudgetRepository>(
  (ref) => BudgetRepository(ref.read(apiClientProvider).dio),
);

class BudgetRepository {
  const BudgetRepository(this._dio);

  final Dio _dio;

  // ── Budget CRUD ────────────────────────────────────────────────────────────

  Future<List<GetAllBudgetResponseDto>> getAllBudgets() async {
    final response = await _dio.get(ApiEndpoints.budgets);
    return (response.data as List)
        .map((e) => GetAllBudgetResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<GetBudgetByIdResponseDto> getBudgetById(int id) async {
    final response = await _dio.get(ApiEndpoints.budgetById(id));
    return GetBudgetByIdResponseDto.fromJson(
        response.data as Map<String, dynamic>);
  }

  /// Returns the budget with all areas, allocations and spent values per allocation.
  Future<GetBudgetByIdResponseDto> getBudgetWithAllocations(int id) async {
    final response = await _dio.get(ApiEndpoints.budgetWithAllocations(id));
    return GetBudgetByIdResponseDto.fromJson(
        response.data as Map<String, dynamic>);
  }

  Future<GetBudgetByIdResponseDto> createBudget(
      CreateBudgetRequestDto dto) async {
    final response = await _dio.post(
      ApiEndpoints.budgets,
      data: dto.toJson(),
    );
    return GetBudgetByIdResponseDto.fromJson(
        response.data as Map<String, dynamic>);
  }

  Future<GetBudgetByIdResponseDto> updateBudget(
      UpdateBudgetRequestDto dto) async {
    final response = await _dio.patch(
      ApiEndpoints.budgetById(dto.id),
      data: dto.toJson(),
    );
    return GetBudgetByIdResponseDto.fromJson(
        response.data as Map<String, dynamic>);
  }

  Future<List<GetAllBudgetResponseDto>> deleteBudget(int id) async {
    final response = await _dio.delete(ApiEndpoints.budgetById(id));
    return (response.data as List)
        .map((e) => GetAllBudgetResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ── Allocations (granular endpoints — available for future use) ────────────

  Future<List<AllocationByAreaResponseDto>> getAllocations(
      int budgetId) async {
    final response = await _dio.get(ApiEndpoints.budgetAllocations(budgetId));
    return (response.data as List)
        .map((e) => AllocationByAreaResponseDto.fromJson(
            e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AllocationByAreaResponseDto>> getAllocationsByArea(
      int budgetId, int areaId) async {
    final response = await _dio.get(
        ApiEndpoints.budgetAllocationsByArea(budgetId, areaId));
    return (response.data as List)
        .map((e) => AllocationByAreaResponseDto.fromJson(
            e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AllocationByAreaResponseDto>> createAllocation(
      int budgetId, CreateAllocationRequestDto dto) async {
    final response = await _dio.post(
      ApiEndpoints.budgetAllocations(budgetId),
      data: dto.toJson(),
    );
    return (response.data as List)
        .map((e) => AllocationByAreaResponseDto.fromJson(
            e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AllocationByAreaResponseDto>> updateAllocation(
      int budgetId, int allocationId, int expectedValue, String allocationType) async {
    final response = await _dio.patch(
      ApiEndpoints.budgetAllocationById(budgetId, allocationId),
      data: UpdateAllocationRequestDto(
        expectedValue: expectedValue,
        allocationType: allocationType,
      ).toJson(),
    );
    return (response.data as List)
        .map((e) => AllocationByAreaResponseDto.fromJson(
            e as Map<String, dynamic>))
        .toList();
  }

  Future<List<AllocationByAreaResponseDto>> deleteAllocation(
      int budgetId, int allocationId) async {
    final response = await _dio.delete(
        ApiEndpoints.budgetAllocationById(budgetId, allocationId));
    return (response.data as List)
        .map((e) => AllocationByAreaResponseDto.fromJson(
            e as Map<String, dynamic>))
        .toList();
  }
}
