/// App route of a legal document; with [version], the archived text of that version.
String legalDocumentPath(String type, {int? version}) {
  final base = type == 'PrivacyPolicy' ? '/legal/privacy' : '/legal/terms';
  return version == null ? base : '$base?v=$version';
}
