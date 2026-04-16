import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import 'dtos/create_wishlist_item_request_dto.dart';
import 'dtos/update_wishlist_item_request_dto.dart';
import 'dtos/wishlist_item_detail_response_dto.dart';
import 'dtos/wishlist_item_response_dto.dart';
import 'dtos/wishlist_price_history_item_dto.dart';
import 'models/wishlist_item.dart';
import 'models/wishlist_item_detail.dart';

final wishlistRepositoryProvider = Provider<WishlistRepository>(
  (ref) => WishlistRepository(ref.read(apiClientProvider).dio),
);

class WishlistRepository {
  const WishlistRepository(this._dio);

  final Dio _dio;

  Future<List<WishlistItem>> getAll({String? status}) async {
    final response = await _dio.get(
      ApiEndpoints.wishlist,
      queryParameters: status != null ? {'status': status} : null,
    );
    return (response.data as List)
        .map((e) => WishlistItem.fromDto(
              WishlistItemResponseDto.fromJson(e as Map<String, dynamic>),
            ))
        .toList();
  }

  Future<WishlistItemDetail> getById(int id) async {
    final response = await _dio.get(ApiEndpoints.wishlistById(id));
    return WishlistItemDetail.fromDto(
      WishlistItemDetailResponseDto.fromJson(
        response.data as Map<String, dynamic>,
      ),
    );
  }

  Future<WishlistItem> create(CreateWishlistItemRequestDto dto) async {
    final response = await _dio.post(
      ApiEndpoints.wishlist,
      data: dto.toJson(),
    );
    return WishlistItem.fromDto(
      WishlistItemResponseDto.fromJson(response.data as Map<String, dynamic>),
    );
  }

  Future<WishlistItem> update(int id, UpdateWishlistItemRequestDto dto) async {
    final response = await _dio.patch(
      ApiEndpoints.wishlistById(id),
      data: dto.toJson(),
    );
    return WishlistItem.fromDto(
      WishlistItemResponseDto.fromJson(response.data as Map<String, dynamic>),
    );
  }

  Future<void> delete(int id) async {
    await _dio.delete(ApiEndpoints.wishlistById(id));
  }

  Future<WishlistPriceHistoryItemDto> recordPrice(int id, int priceCents) async {
    final response = await _dio.post(
      ApiEndpoints.wishlistPrice(id),
      data: {'price': priceCents},
    );
    return WishlistPriceHistoryItemDto.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  Future<WishlistItem> purchase(int id) async {
    final response = await _dio.post(ApiEndpoints.wishlistPurchase(id));
    return WishlistItem.fromDto(
      WishlistItemResponseDto.fromJson(response.data as Map<String, dynamic>),
    );
  }

  Future<List<WishlistPriceHistoryItemDto>> getPriceHistory(int id) async {
    final response = await _dio.get(ApiEndpoints.wishlistPriceHistory(id));
    return (response.data as List)
        .map((e) => WishlistPriceHistoryItemDto.fromJson(
              e as Map<String, dynamic>,
            ))
        .toList();
  }
}
