import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/legal_document_response_dto.dart';

final legalRepositoryProvider = Provider<LegalRepository>(
  (ref) => LegalRepository(ref.read(apiClientProvider).dio),
);

/// Document types as the API names them.
abstract class LegalDocumentTypes {
  static const String privacyPolicy = 'PrivacyPolicy';
  static const String termsOfUse = 'TermsOfUse';
}

class LegalRepository {
  const LegalRepository(this._dio);

  final Dio _dio;

  /// The current published version of a document. Anonymous — the registration
  /// screen links to it before there is an account.
  Future<LegalDocumentResponseDto> getDocument(String type) async {
    final response = await _dio.get(ApiEndpoints.legalDocument(type));
    return LegalDocumentResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }
}
