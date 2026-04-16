import 'package:json_annotation/json_annotation.dart';

part 'update_wishlist_item_request_dto.g.dart';

@JsonSerializable(createFactory: false, includeIfNull: false)
class UpdateWishlistItemRequestDto {
  const UpdateWishlistItemRequestDto({
    this.name,
    this.description,
    this.targetPrice,
    this.priority,
    this.status,
    this.url,
    this.imageUrl,
  });

  final String? name;
  final String? description;
  final int? targetPrice;
  final String? priority;
  final String? status;
  final String? url;
  final String? imageUrl;

  Map<String, dynamic> toJson() => _$UpdateWishlistItemRequestDtoToJson(this);
}
