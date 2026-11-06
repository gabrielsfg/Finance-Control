import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/legal_document_response_dto.dart';
import 'models/legal_document_version.dart';
import 'models/pending_legal_document.dart';

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

  /// A published document. Without [version], the current one; with it, the
  /// archived text of that exact version. Anonymous — the registration screen
  /// links to it before there is an account.
  Future<LegalDocumentResponseDto> getDocument(String type, {int? version}) async {
    final response = await _dio.get(
      ApiEndpoints.legalDocument(type),
      queryParameters: version == null ? null : {'version': version},
    );
    return LegalDocumentResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  /// Every published version of a document, newest first.
  Future<List<LegalDocumentVersion>> getVersions(String type) async {
    final response = await _dio.get(ApiEndpoints.legalDocumentVersions(type));
    return (response.data as List)
        .map((e) => LegalDocumentVersion.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Documents whose current version the signed-in user has not accepted yet.
  Future<List<PendingLegalDocument>> getPending() async {
    final response = await _dio.get(ApiEndpoints.legalPending);
    return _parsePending(response.data);
  }

  /// Accepts exactly the versions shown. Answers with what is still pending
  /// (normally nothing); a 409 means a newer version was published meanwhile.
  Future<List<PendingLegalDocument>> accept(
    List<PendingLegalDocument> documents,
  ) async {
    final response = await _dio.post(
      ApiEndpoints.legalAccept,
      data: {'documents': documents.map((d) => d.toAcceptJson()).toList()},
    );
    return _parsePending(response.data);
  }

  List<PendingLegalDocument> _parsePending(dynamic data) => (data as List)
      .map((e) => PendingLegalDocument.fromJson(e as Map<String, dynamic>))
      .toList();
}
