import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/recurrence_models.dart';
import '../data/recurrence_repository.dart';

final recurrenceProvider =
    AsyncNotifierProvider<RecurrenceNotifier, RecurrencePageData>(
  RecurrenceNotifier.new,
);

class RecurrenceNotifier extends AsyncNotifier<RecurrencePageData> {
  @override
  Future<RecurrencePageData> build() async {
    return ref.read(recurrenceRepositoryProvider).getPage();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(recurrenceRepositoryProvider).getPage(),
    );
  }

  Future<void> updateRecurring(int id, UpdateRecurringRequest request) async {
    await ref.read(recurrenceRepositoryProvider).updateRecurring(id, request);
    await refresh();
  }

  Future<void> cancelRecurring(int id) async {
    await ref.read(recurrenceRepositoryProvider).cancelRecurring(id);
    await refresh();
  }

  Future<void> reactivateRecurring(int id) async {
    await ref.read(recurrenceRepositoryProvider).reactivateRecurring(id);
    await refresh();
  }

  Future<void> deleteRecurring(int id) async {
    await ref.read(recurrenceRepositoryProvider).deleteRecurring(id);
    await refresh();
  }
}
