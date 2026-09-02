import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';

final feedbackRepositoryProvider = Provider<FeedbackRepository>(
  (ref) => FeedbackRepository(ref.read(apiClientProvider).dio),
);

/// Wire values of `EnumFeedbackType` on the API. The pt-BR labels live in the
/// screen — never send the translated word.
enum FeedbackType {
  bug('Bug'),
  suggestion('Suggestion');

  const FeedbackType(this.wire);
  final String wire;
}

class FeedbackRepository {
  const FeedbackRepository(this._dio);

  final Dio _dio;

  /// Write-only: the API stores the report for triage and there is nothing to
  /// read back into the app.
  Future<void> send({
    required FeedbackType type,
    required String title,
    String? description,
  }) async {
    await _dio.post(
      ApiEndpoints.feedback,
      data: {
        'type': type.wire,
        'title': title,
        'description': description,
        'source': 'mobile',
      },
    );
  }
}
