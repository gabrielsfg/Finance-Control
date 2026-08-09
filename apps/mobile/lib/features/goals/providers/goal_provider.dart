import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/goal_models.dart';
import '../data/goal_repository.dart';

final goalsProvider =
    AsyncNotifierProvider<GoalsNotifier, List<Goal>>(GoalsNotifier.new);

class GoalsNotifier extends AsyncNotifier<List<Goal>> {
  @override
  Future<List<Goal>> build() async {
    return ref.read(goalRepositoryProvider).getAll();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state =
        await AsyncValue.guard(() => ref.read(goalRepositoryProvider).getAll());
  }

  Future<void> create(CreateGoalRequest request) async {
    final goal = await ref.read(goalRepositoryProvider).create(request);
    state = AsyncData([goal, ...(state.valueOrNull ?? [])]);
  }

  Future<void> updateGoal(int id, UpdateGoalRequest request) async {
    final updated = await ref.read(goalRepositoryProvider).update(id, request);
    _replace(updated);
  }

  Future<void> delete(int id, {int? returnToAccountId}) async {
    await ref
        .read(goalRepositoryProvider)
        .delete(id, returnToAccountId: returnToAccountId);
    state = AsyncData(
        (state.valueOrNull ?? []).where((e) => e.id != id).toList());
  }

  Future<void> contribute(int id, ContributeGoalRequest request) async {
    final updated =
        await ref.read(goalRepositoryProvider).contribute(id, request);
    _replace(updated);
  }

  Future<void> withdraw(int id, WithdrawGoalRequest request) async {
    final updated =
        await ref.read(goalRepositoryProvider).withdraw(id, request);
    _replace(updated);
  }

  void _replace(Goal updated) {
    final current = state.valueOrNull ?? [];
    state = AsyncData([
      for (final g in current)
        if (g.id == updated.id) updated else g,
    ]);
  }
}

final goalDetailProvider =
    AsyncNotifierProviderFamily<GoalDetailNotifier, GoalDetail, int>(
  GoalDetailNotifier.new,
);

class GoalDetailNotifier extends FamilyAsyncNotifier<GoalDetail, int> {
  @override
  Future<GoalDetail> build(int arg) async {
    return ref.read(goalRepositoryProvider).getById(arg);
  }
}
