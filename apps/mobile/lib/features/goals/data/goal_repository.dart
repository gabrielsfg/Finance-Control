import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'goal_models.dart';

final goalRepositoryProvider = Provider<GoalRepository>(
  (ref) => GoalRepository(ref.read(apiClientProvider).dio),
);

class GoalRepository {
  const GoalRepository(this._dio);
  final Dio _dio;

  Future<List<Goal>> getAll() async {
    final response = await _dio.get(ApiEndpoints.goals);
    return (response.data as List)
        .map((e) => Goal.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<GoalDetail> getById(int id) async {
    final response = await _dio.get(ApiEndpoints.goalById(id));
    return GoalDetail.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Goal> create(CreateGoalRequest request) async {
    final response = await _dio.post(ApiEndpoints.goals, data: request.toJson());
    return Goal.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Goal> update(int id, UpdateGoalRequest request) async {
    final response =
        await _dio.patch(ApiEndpoints.goalById(id), data: request.toJson());
    return Goal.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> delete(int id, {int? returnToAccountId}) async {
    await _dio.delete(
      ApiEndpoints.goalById(id),
      queryParameters:
          returnToAccountId != null ? {'returnToAccountId': returnToAccountId} : null,
    );
  }

  Future<Goal> contribute(int id, ContributeGoalRequest request) async {
    final response =
        await _dio.post(ApiEndpoints.goalContribute(id), data: request.toJson());
    return Goal.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Goal> withdraw(int id, WithdrawGoalRequest request) async {
    final response =
        await _dio.post(ApiEndpoints.goalWithdraw(id), data: request.toJson());
    return Goal.fromJson(response.data as Map<String, dynamic>);
  }
}
