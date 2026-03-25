import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/account_response_dto.dart';
import 'dtos/create_account_request_dto.dart';
import 'dtos/get_account_by_id_response_dto.dart';
import 'dtos/update_account_request_dto.dart';

final accountRepositoryProvider = Provider<AccountRepository>(
  (ref) => AccountRepository(ref.read(apiClientProvider).dio),
);

class AccountRepository {
  const AccountRepository(this._dio);

  final Dio _dio;

  Future<List<GetAccountItemResponseDto>> getAccounts() async {
    final response = await _dio.get(ApiEndpoints.accounts);
    return (response.data as List)
        .map((e) => GetAccountItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<GetAccountByIdResponseDto> getAccountById(int id) async {
    final response = await _dio.get(ApiEndpoints.accountById(id));
    return GetAccountByIdResponseDto.fromJson(
        response.data as Map<String, dynamic>);
  }

  Future<List<GetAccountItemResponseDto>> createAccount(
    CreateAccountRequestDto requestDto,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.accounts,
      data: requestDto.toJson(),
    );
    return (response.data as List)
        .map((e) => GetAccountItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<GetAccountItemResponseDto>> updateAccount(
    int id,
    UpdateAccountRequestDto requestDto,
  ) async {
    final response = await _dio.put(
      ApiEndpoints.accountById(id),
      data: requestDto.toJson(),
    );
    return (response.data as List)
        .map((e) => GetAccountItemResponseDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> deleteAccount(int id) async {
    await _dio.delete(ApiEndpoints.accountById(id));
  }
}
