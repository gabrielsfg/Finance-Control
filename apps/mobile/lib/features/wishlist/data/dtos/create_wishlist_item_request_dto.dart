import 'package:json_annotation/json_annotation.dart';

part 'create_wishlist_item_request_dto.g.dart';

@JsonSerializable(createFactory: false, includeIfNull: false)
class CreateWishlistItemRequestDto {
  const CreateWishlistItemRequestDto({
    required this.name,
    this.description,
    this.targetPrice,
    this.priority,
    this.url,
    this.imageUrl,
  });

  final String name;
  final String? description;
  final int? targetPrice;
  final String? priority;
  final String? url;
  final String? imageUrl;

  Map<String, dynamic> toJson() => _$CreateWishlistItemRequestDtoToJson(this);
}
