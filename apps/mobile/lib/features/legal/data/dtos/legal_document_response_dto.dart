import 'package:json_annotation/json_annotation.dart';

part 'legal_document_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class LegalDocumentResponseDto {
  const LegalDocumentResponseDto({
    required this.type,
    required this.version,
    required this.content,
    required this.contentHash,
    required this.publishedAt,
  });

  final String type;
  final int version;

  /// Markdown, exactly as published.
  final String content;

  final String contentHash;
  final DateTime publishedAt;

  factory LegalDocumentResponseDto.fromJson(Map<String, dynamic> json) =>
      _$LegalDocumentResponseDtoFromJson(json);
}
