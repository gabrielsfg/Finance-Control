import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'import_models.dart';

final importRepositoryProvider = Provider<ImportRepository>(
  (ref) => ImportRepository(ref.read(apiClientProvider).dio),
);

class ImportRepository {
  const ImportRepository(this._dio);

  final Dio _dio;

  /// Uploads the statement and gets back the lines it holds. Nothing is written
  /// yet — the user still has to confirm.
  Future<ParsedStatement> parseFile({
    required String filePath,
    required String fileName,
    required int accountId,
  }) async {
    final formData = FormData.fromMap({
      'accountId': accountId,
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
    });

    final response = await _dio.post(
      ApiEndpoints.importParse,
      data: formData,
      // Dio sets the multipart boundary itself; the client's default JSON
      // content type would make the server reject the upload.
      options: Options(contentType: 'multipart/form-data'),
    );

    return ParsedStatement.fromJson(response.data as Map<String, dynamic>);
  }

  /// Creates the selected transactions. Returns how many were written.
  Future<int> confirmImport(ImportTransactionsRequest request) async {
    final response = await _dio.post(
      ApiEndpoints.importConfirm,
      data: request.toJson(),
    );
    final data = response.data as Map<String, dynamic>;
    return (data['importedCount'] as num?)?.toInt() ?? 0;
  }
}
