/// A legal document whose current version the signed-in user has not accepted yet,
/// as served by GET /api/legal/pending.
class PendingLegalDocument {
  const PendingLegalDocument({
    required this.type,
    required this.version,
    required this.title,
    required this.publishedAt,
  });

  /// "TermsOfUse" | "PrivacyPolicy".
  final String type;
  final int version;
  final String title;
  final DateTime publishedAt;

  factory PendingLegalDocument.fromJson(Map<String, dynamic> json) =>
      PendingLegalDocument(
        type: json['type'] as String,
        version: json['version'] as int,
        title: json['title'] as String,
        publishedAt: DateTime.parse(json['publishedAt'] as String),
      );

  /// The body item of POST /api/legal/accept: the exact version that was shown.
  Map<String, dynamic> toAcceptJson() => {'type': type, 'version': version};
}
