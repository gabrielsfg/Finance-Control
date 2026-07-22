import '../dtos/category_response_dto.dart';

class CategorySubcategory {
  const CategorySubcategory({
    required this.id,
    required this.name,
    required this.categoryId,
    this.categoryName,
    this.categoryColor,
    this.emoji,
  });

  final int id;
  final String name;
  final int categoryId;

  /// Only available when loaded via SubcategoriesNotifier (GET /api/SubCategory/all).
  final String? categoryName;
  final String? categoryColor;
  final String? emoji;

  factory CategorySubcategory.fromDto(SubcategoryItemResponseDto dto) =>
      CategorySubcategory(
        id: dto.id,
        name: dto.name,
        categoryId: dto.categoryId,
        categoryName: dto.categoryName,
        categoryColor: dto.categoryColor,
        emoji: dto.emoji,
      );
}

class Category {
  const Category({
    required this.id,
    required this.name,
    this.color,
    required this.subcategories,
  });

  final int id;
  final String name;
  final String? color;
  final List<CategorySubcategory> subcategories;

  factory Category.fromDto(CategoryItemResponseDto dto) => Category(
        id: dto.id,
        name: dto.name,
        color: dto.color,
        subcategories:
            dto.subCategories.map(CategorySubcategory.fromDto).toList(),
      );
}
