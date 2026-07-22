import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/category_repository.dart';
import '../data/dtos/create_category_request_dto.dart';
import '../data/dtos/update_category_request_dto.dart';
import '../data/models/category.dart';

class CategoriesNotifier extends AsyncNotifier<List<Category>> {
  @override
  Future<List<Category>> build() async {
    final authState = await ref.watch(authNotifierProvider.future);
    if (!authState.isAuthenticated || authState.accessToken == null) {
      return [];
    }
    return _fetch();
  }

  Future<List<Category>> _fetch() async {
    final dtos = await ref.read(categoryRepositoryProvider).getCategories();
    return dtos.map(Category.fromDto).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> createCategory(String name, {String? color}) async {
    final dtos = await ref
        .read(categoryRepositoryProvider)
        .createCategory(CreateCategoryRequestDto(name: name, color: color));
    state = AsyncData(dtos.map(Category.fromDto).toList());
  }

  /// Bulk-updates categories. Each entry carries the new name and optional color.
  Future<void> updateCategories(Map<int, ({String name, String? color})> changes) async {
    final items = changes.entries
        .map((e) =>
            UpdateCategoryItemDto(id: e.key, name: e.value.name, color: e.value.color))
        .toList();
    final dtos = await ref
        .read(categoryRepositoryProvider)
        .updateCategories(UpdateCategoriesRequestDto(categories: items));
    state = AsyncData(dtos.map(Category.fromDto).toList());
  }

  Future<void> deleteCategory(int id) async {
    final dtos =
        await ref.read(categoryRepositoryProvider).deleteCategory(id);
    state = AsyncData(dtos.map(Category.fromDto).toList());
  }
}

final categoriesNotifierProvider =
    AsyncNotifierProvider<CategoriesNotifier, List<Category>>(
        CategoriesNotifier.new);
