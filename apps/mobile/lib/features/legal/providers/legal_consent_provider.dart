import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/legal_repository.dart';
import '../data/models/legal_document_version.dart';
import '../data/models/pending_legal_document.dart';

/// What the signed-in user still has to accept. Rebuilt on login/logout so one
/// account's state never shows for the next; empty when signed out. The router
/// keeps the app closed while this is not empty.
final FutureProvider<List<PendingLegalDocument>> pendingLegalDocumentsProvider =
    FutureProvider<List<PendingLegalDocument>>((ref) async {
  final token = ref.watch(
    authNotifierProvider.select((auth) => auth.valueOrNull?.accessToken),
  );
  if (token == null) return const [];
  return ref.read(legalRepositoryProvider).getPending();
});

/// Every published version of a document, newest first.
final legalDocumentVersionsProvider =
    FutureProvider.autoDispose.family<List<LegalDocumentVersion>, String>((ref, type) {
  return ref.read(legalRepositoryProvider).getVersions(type);
});
