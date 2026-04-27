import 'package:json_annotation/json_annotation.dart';

part 'wishlist_item_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class WishlistItemResponseDto {
  const WishlistItemResponseDto({
    required this.id,
    required this.name,
    this.description,
    this.targetPrice,
    required this.priority,
    required this.status,
    this.url,
    this.imageUrl,
    this.latestPrice,
    required this.createdAt,
    this.updatedAt,
  });

  final int id;
  final String name;
  final String? description;
  final int? targetPrice;
  final String priority;
  final String status;
  final String? url;
  final String? imageUrl;
  final int? latestPrice;
  final DateTime createdAt;
  final DateTime? updatedAt;

  factory WishlistItemResponseDto.fromJson(Map<String, dynamic> json) =>
      _$WishlistItemResponseDtoFromJson(json);
}
