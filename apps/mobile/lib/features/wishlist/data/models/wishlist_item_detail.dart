import '../dtos/wishlist_item_detail_response_dto.dart';
import 'wishlist_enums.dart';

class WishlistPricePoint {
  const WishlistPricePoint({
    required this.id,
    required this.priceCents,
    required this.recordedAt,
  });

  final int id;
  final int priceCents;
  final DateTime recordedAt;
}

class WishlistItemDetail {
  const WishlistItemDetail({
    required this.id,
    required this.name,
    this.description,
    this.targetPriceCents,
    required this.priority,
    required this.status,
    this.url,
    this.imageUrl,
    this.latestPriceCents,
    required this.createdAt,
    this.updatedAt,
    required this.priceHistory,
  });

  final int id;
  final String name;
  final String? description;
  final int? targetPriceCents;
  final WishlistPriority priority;
  final WishlistStatus status;
  final String? url;
  final String? imageUrl;
  final int? latestPriceCents;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<WishlistPricePoint> priceHistory;

  bool get isPending => status == WishlistStatus.pending;

  factory WishlistItemDetail.fromDto(WishlistItemDetailResponseDto dto) =>
      WishlistItemDetail(
        id: dto.id,
        name: dto.name,
        description: dto.description,
        targetPriceCents: dto.targetPrice,
        priority: parsePriority(dto.priority),
        status: parseWishlistStatus(dto.status),
        url: dto.url,
        imageUrl: dto.imageUrl,
        latestPriceCents: dto.latestPrice,
        createdAt: dto.createdAt,
        updatedAt: dto.updatedAt,
        priceHistory: dto.priceHistory
            .map((e) => WishlistPricePoint(
                  id: e.id,
                  priceCents: e.price,
                  recordedAt: e.recordedAt,
                ))
            .toList(),
      );
}
