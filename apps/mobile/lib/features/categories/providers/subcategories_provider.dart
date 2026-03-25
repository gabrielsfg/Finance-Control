import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/dtos/subcategory_request_dto.dart';
import '../data/models/category.dart';
import '../data/subcategory_repository.dart';
import 'categories_provider.dart';

class SubcategoriesNotifier extends AsyncNotifier<List<CategorySubcategory>> {
  @override
  Future<List<CategorySubcategory>> build() async {
    final authState = await ref.watch(authNotifierProvider.future);
    if (!authState.isAuthenticated || authState.accessToken == null) {
      return [];
    }
    return _fetch();
  }

  Future<List<CategorySubcategory>> _fetch() async {
    final dtos = await ref.read(subcategoryRepositoryProvider).getAll();
    return dtos.map(CategorySubcategory.fromDto).toList();
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> create(String name, int categoryId) async {
    final dtos = await ref.read(subcategoryRepositoryProvider).create(
          CreateSubcategoryRequestDto(name: name, categoryId: categoryId),
        );
    state = AsyncData(dtos.map(CategorySubcategory.fromDto).toList());
    ref.read(categoriesNotifierProvider.notifier).refresh();
  }

  Future<void> updateSubcategory(int id, String name, int categoryId) async {
    final dtos = await ref.read(subcategoryRepositoryProvider).update(
          UpdateSubcategoryRequestDto(id: id, name: name, categoryId: categoryId),
        );
    state = AsyncData(dtos.map(CategorySubcategory.fromDto).toList());
    ref.read(categoriesNotifierProvider.notifier).refresh();
  }

  Future<void> delete(int id) async {
    final dtos = await ref.read(subcategoryRepositoryProvider).delete(id);
    state = AsyncData(dtos.map(CategorySubcategory.fromDto).toList());
    ref.read(categoriesNotifierProvider.notifier).refresh();
  }
}

final subcategoriesNotifierProvider =
    AsyncNotifierProvider<SubcategoriesNotifier, List<CategorySubcategory>>(
        SubcategoriesNotifier.new);
