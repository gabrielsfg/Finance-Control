import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/account_repository.dart';
import '../data/dtos/create_account_request_dto.dart';
import '../data/dtos/update_account_request_dto.dart';
import '../data/models/account.dart';
import '../data/models/account_detail.dart';

class AccountsNotifier extends AsyncNotifier<List<Account>> {
  @override
  Future<List<Account>> build() async {
    final authState = await ref.watch(authNotifierProvider.future);
    if (!authState.isAuthenticated || authState.accessToken == null) {
      return [];
    }
    return _fetch();
  }

  Future<List<Account>> _fetch() async {
    final dtos = await ref.read(accountRepositoryProvider).getAccounts();
    return dtos.map(Account.fromDto).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> createAccount(CreateAccountRequestDto requestDto) async {
    final dtos =
        await ref.read(accountRepositoryProvider).createAccount(requestDto);
    state = AsyncData(dtos.map(Account.fromDto).toList());
  }

  Future<void> updateAccount(
      int id, UpdateAccountRequestDto requestDto) async {
    final dtos =
        await ref.read(accountRepositoryProvider).updateAccount(id, requestDto);
    state = AsyncData(dtos.map(Account.fromDto).toList());
  }

  Future<void> deleteAccount(int id) async {
    await ref.read(accountRepositoryProvider).deleteAccount(id);
    await refresh();
  }

  Future<void> onUnauthorized() async {
    await ref.read(authNotifierProvider.notifier).logout();
  }
}

final accountsNotifierProvider =
    AsyncNotifierProvider<AccountsNotifier, List<Account>>(
        AccountsNotifier.new);

// ── Account detail (by id) ────────────────────────────────────────────────

class AccountDetailNotifier
    extends FamilyAsyncNotifier<AccountDetail, int> {
  @override
  Future<AccountDetail> build(int id) async {
    final dto =
        await ref.read(accountRepositoryProvider).getAccountById(id);
    return AccountDetail.fromDto(dto);
  }
}

final accountDetailProvider =
    AsyncNotifierProviderFamily<AccountDetailNotifier, AccountDetail, int>(
        AccountDetailNotifier.new);
