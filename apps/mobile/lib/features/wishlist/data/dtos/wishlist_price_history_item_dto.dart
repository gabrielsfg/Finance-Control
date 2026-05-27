import 'package:json_annotation/json_annotation.dart';

part 'wishlist_price_history_item_dto.g.dart';

@JsonSerializable(createToJson: false)
class WishlistPriceHistoryItemDto {
  const WishlistPriceHistoryItemDto({
    required this.id,
    required this.price,
    required this.recordedAt,
  });

  final int id;
  final int price;
  final DateTime recordedAt;

  factory WishlistPriceHistoryItemDto.fromJson(Map<String, dynamic> json) =>
      _$WishlistPriceHistoryItemDtoFromJson(json);
}
