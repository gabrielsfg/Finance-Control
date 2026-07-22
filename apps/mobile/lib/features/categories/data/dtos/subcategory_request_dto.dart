class CreateSubcategoryRequestDto {
  const CreateSubcategoryRequestDto({
    required this.name,
    required this.categoryId,
    this.emoji,
  });

  final String name;
  final int categoryId;
  final String? emoji;

  Map<String, dynamic> toJson() => {
        'name': name,
        'categoryId': categoryId,
        if (emoji != null && emoji!.isNotEmpty) 'emoji': emoji,
      };
}

class UpdateSubcategoryRequestDto {
  const UpdateSubcategoryRequestDto({
    required this.id,
    required this.name,
    required this.categoryId,
    this.emoji,
  });

  final int id;
  final String name;
  final int categoryId;
  final String? emoji;

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'categoryId': categoryId,
        if (emoji != null && emoji!.isNotEmpty) 'emoji': emoji,
      };
}
