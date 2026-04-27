enum WishlistPriority { low, medium, high }

enum WishlistStatus { pending, purchased, cancelled }

WishlistPriority parsePriority(String value) => switch (value) {
      'High' => WishlistPriority.high,
      'Medium' => WishlistPriority.medium,
      _ => WishlistPriority.low,
    };

WishlistStatus parseWishlistStatus(String value) => switch (value) {
      'Purchased' => WishlistStatus.purchased,
      'Cancelled' => WishlistStatus.cancelled,
      _ => WishlistStatus.pending,
    };
