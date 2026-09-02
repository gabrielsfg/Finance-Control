import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/update_user_profile_request_dto.dart';
import 'dtos/user_profile_response_dto.dart';

final userRepositoryProvider = Provider<UserRepository>(
  (ref) => UserRepository(ref.read(apiClientProvider).dio),
);

class UserRepository {
  const UserRepository(this._dio);

  final Dio _dio;

  Future<UserProfileResponseDto> getProfile() async {
    final response = await _dio.get(ApiEndpoints.userProfile);
    return UserProfileResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  Future<UserProfileResponseDto> updateProfile(
    UpdateUserProfileRequestDto dto,
  ) async {
    final response = await _dio.patch(
      ApiEndpoints.userProfile,
      data: dto.toJson(),
    );
    return UserProfileResponseDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  /// Downloads everything the account holds (LGPD art. 18, V).
  ///
  /// The endpoint answers with a file rather than a JSON body, so the bytes are
  /// taken raw and the name comes from `content-disposition` — the server picks
  /// it, and it already carries the export date.
  Future<ExportedFile> exportData() async {
    final response = await _dio.get<List<int>>(
      ApiEndpoints.exportData,
      options: Options(responseType: ResponseType.bytes),
    );

    final disposition =
        response.headers.value('content-disposition') ?? '';
    return ExportedFile(
      bytes: response.data ?? const <int>[],
      fileName: _fileNameFrom(disposition),
    );
  }

  /// Reads `filename="..."` out of a content-disposition header, falling back to
  /// a dated name so the user never ends up with an unnamed download.
  static String _fileNameFrom(String contentDisposition) {
    final match =
        RegExp(r'filename="?([^";]+)"?').firstMatch(contentDisposition);
    final name = match?.group(1)?.trim();
    if (name != null && name.isNotEmpty) return name;

    final today = DateTime.now();
    final month = today.month.toString().padLeft(2, '0');
    final day = today.day.toString().padLeft(2, '0');
    return 'meus-dados-${today.year}-$month-$day.json';
  }
}

/// The export payload plus the name the file should keep once saved.
class ExportedFile {
  const ExportedFile({required this.bytes, required this.fileName});

  final List<int> bytes;
  final String fileName;
}
