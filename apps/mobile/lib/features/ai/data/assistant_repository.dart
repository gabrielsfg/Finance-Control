import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'ai_models.dart';

final assistantRepositoryProvider = Provider<AssistantRepository>(
  (ref) => AssistantRepository(ref.read(apiClientProvider).dio),
);

/// The in-app chat assistant — AssistantController.
class AssistantRepository {
  const AssistantRepository(this._dio);

  final Dio _dio;

  Future<List<AiConversationSummary>> listConversations() async {
    final response = await _dio.get(ApiEndpoints.assistantConversations);
    return _parseList(response.data);
  }

  Future<AiConversation> getConversation(int id) async {
    final response =
        await _dio.get(ApiEndpoints.assistantConversationById(id));
    return AiConversation.fromJson(response.data as Map<String, dynamic>);
  }

  /// Deletes one conversation and answers with the list that remains.
  Future<List<AiConversationSummary>> deleteConversation(int id) async {
    final response =
        await _dio.delete(ApiEndpoints.assistantConversationById(id));
    return _parseList(response.data);
  }

  Future<int> deleteAllConversations() async {
    final response = await _dio.delete(ApiEndpoints.assistantConversations);
    return ((response.data as Map<String, dynamic>)['deleted'] as num?)
            ?.toInt() ??
        0;
  }

  /// Not streamed: the answer comes back whole after the model and its tool
  /// calls finish, which can take well past the client-wide 30 s timeout.
  Future<AiSendMessageResult> sendMessage({
    required int? conversationId,
    required String message,
  }) async {
    final response = await _dio.post(
      ApiEndpoints.assistantMessages,
      data: {'conversationId': conversationId, 'message': message},
      options: Options(receiveTimeout: const Duration(seconds: 120)),
    );
    return AiSendMessageResult.fromJson(response.data as Map<String, dynamic>);
  }

  /// [payload] is the edited proposal, or null to confirm it unchanged. A 400
  /// carries a validation message and surfaces as [AiActionRejected].
  Future<AiAction> confirmAction(int id, Map<String, dynamic>? payload) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.assistantActionConfirm(id),
        data: {'payload': payload},
      );
      return AiAction.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _rejection(e) ?? e;
    }
  }

  Future<AiAction> cancelAction(int id) async {
    try {
      final response = await _dio.post(ApiEndpoints.assistantActionCancel(id));
      return AiAction.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _rejection(e) ?? e;
    }
  }

  static AiActionRejected? _rejection(DioException e) {
    if (e.response?.statusCode != 400) return null;
    final data = e.response?.data;
    final message = data is Map ? data['error'] as String? : null;
    return AiActionRejected(
      message ?? 'Não foi possível salvar. Revise os dados e tente de novo.',
    );
  }

  static List<AiConversationSummary> _parseList(dynamic data) =>
      ((data as List?) ?? const [])
          .map((e) => AiConversationSummary.fromJson(e as Map<String, dynamic>))
          .toList();
}
