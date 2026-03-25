import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../accounts/data/models/account.dart';
import '../../accounts/providers/accounts_provider.dart';
import '../../categories/providers/subcategories_provider.dart';
import '../data/categories_repository.dart';
import '../data/dtos/category_response_dto.dart';

final accountsProvider = FutureProvider<List<Account>>((ref) async {
  return ref.watch(accountsNotifierProvider.future);
});

final categoriesProvider =
    FutureProvider<List<CategoryResponseDto>>((ref) async {
  // Re-fetch whenever the user creates/edits/deletes a subcategory.
  ref.watch(subcategoriesNotifierProvider);
  return ref.read(categoriesRepositoryProvider).getCategories();
});
