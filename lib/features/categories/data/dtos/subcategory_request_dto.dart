class CreateSubcategoryRequestDto {
  const CreateSubcategoryRequestDto({
    required this.name,
    required this.categoryId,
  });

  final String name;
  final int categoryId;

  Map<String, dynamic> toJson() => {
        'name': name,
        'categoryId': categoryId,
      };
}

class UpdateSubcategoryRequestDto {
  const UpdateSubcategoryRequestDto({
    required this.id,
    required this.name,
    required this.categoryId,
  });

  final int id;
  final String name;
  final int categoryId;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'categoryId': categoryId,
      };
}
