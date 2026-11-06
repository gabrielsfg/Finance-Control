/// One published version of a legal document, without its text, as served by
/// GET /api/legal/{type}/versions.
class LegalDocumentVersion {
  const LegalDocumentVersion({
    required this.version,
    required this.publishedAt,
    required this.isCurrent,
  });

  final int version;
  final DateTime publishedAt;

  /// The newest version — the one in force.
  final bool isCurrent;

  factory LegalDocumentVersion.fromJson(Map<String, dynamic> json) =>
      LegalDocumentVersion(
        version: json['version'] as int,
        publishedAt: DateTime.parse(json['publishedAt'] as String),
        isCurrent: json['isCurrent'] as bool? ?? false,
      );
}
