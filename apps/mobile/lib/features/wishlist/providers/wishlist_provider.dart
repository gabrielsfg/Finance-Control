import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/dtos/create_wishlist_item_request_dto.dart';
import '../data/dtos/update_wishlist_item_request_dto.dart';
import '../data/models/wishlist_item.dart';
import '../data/models/wishlist_item_detail.dart';
import '../data/wishlist_repository.dart';

// ── List provider ──────────────────────────────────────────────────────────

final wishlistProvider =
    AsyncNotifierProvider<WishlistNotifier, List<WishlistItem>>(
  WishlistNotifier.new,
);

class WishlistNotifier extends AsyncNotifier<List<WishlistItem>> {
  @override
  Future<List<WishlistItem>> build() async {
    return ref.read(wishlistRepositoryProvider).getAll();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(wishlistRepositoryProvider).getAll(),
    );
  }

  Future<void> create(CreateWishlistItemRequestDto dto) async {
    final item = await ref.read(wishlistRepositoryProvider).create(dto);
    final current = state.valueOrNull ?? [];
    state = AsyncData([item, ...current]);
  }

  Future<void> updateItem(int id, UpdateWishlistItemRequestDto dto) async {
    final updated = await ref.read(wishlistRepositoryProvider).update(id, dto);
    final current = state.valueOrNull ?? [];
    state = AsyncData([
      for (final item in current)
        if (item.id == id) updated else item,
    ]);
  }

  Future<void> delete(int id) async {
    await ref.read(wishlistRepositoryProvider).delete(id);
    final current = state.valueOrNull ?? [];
    state = AsyncData(current.where((e) => e.id != id).toList());
  }

  Future<void> purchase(int id) async {
    final updated = await ref.read(wishlistRepositoryProvider).purchase(id);
    final current = state.valueOrNull ?? [];
    state = AsyncData([
      for (final item in current)
        if (item.id == id) updated else item,
    ]);
  }
}

// ── Detail provider (per item) ─────────────────────────────────────────────

final wishlistDetailProvider = AsyncNotifierProviderFamily<
    WishlistDetailNotifier, WishlistItemDetail, int>(
  WishlistDetailNotifier.new,
);

class WishlistDetailNotifier
    extends FamilyAsyncNotifier<WishlistItemDetail, int> {
  @override
  Future<WishlistItemDetail> build(int arg) async {
    return ref.read(wishlistRepositoryProvider).getById(arg);
  }

  Future<void> recordPrice(int priceCents) async {
    await ref.read(wishlistRepositoryProvider).recordPrice(arg, priceCents);
    state = await AsyncValue.guard(
      () => ref.read(wishlistRepositoryProvider).getById(arg),
    );
  }
}
