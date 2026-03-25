import '../dtos/category_response_dto.dart';

class CategorySubcategory {
  const CategorySubcategory({
    required this.id,
    required this.name,
    required this.categoryId,
    this.categoryName,
  });

  final int id;
  final String name;
  final int categoryId;

  /// Only available when loaded via SubcategoriesNotifier (GET /api/SubCategory/all).
  final String? categoryName;

  factory CategorySubcategory.fromDto(SubcategoryItemResponseDto dto) =>
      CategorySubcategory(
        id: dto.id,
        name: dto.name,
        categoryId: dto.categoryId,
        categoryName: dto.categoryName,
      );
}

class Category {
  const Category({
    required this.id,
    required this.name,
    required this.subcategories,
  });

  final int id;
  final String name;
  final List<CategorySubcategory> subcategories;

  factory Category.fromDto(CategoryItemResponseDto dto) => Category(
        id: dto.id,
        name: dto.name,
        subcategories:
            dto.subCategories.map(CategorySubcategory.fromDto).toList(),
      );
}
