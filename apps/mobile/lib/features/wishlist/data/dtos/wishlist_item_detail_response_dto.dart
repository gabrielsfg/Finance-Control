import 'package:json_annotation/json_annotation.dart';

import 'wishlist_price_history_item_dto.dart';

part 'wishlist_item_detail_response_dto.g.dart';

@JsonSerializable(createToJson: false)
class WishlistItemDetailResponseDto {
  const WishlistItemDetailResponseDto({
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
    required this.priceHistory,
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
  final List<WishlistPriceHistoryItemDto> priceHistory;

  factory WishlistItemDetailResponseDto.fromJson(Map<String, dynamic> json) =>
      _$WishlistItemDetailResponseDtoFromJson(json);
}
