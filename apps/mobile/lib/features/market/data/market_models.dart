// Domain models for the Market (mercado) feature. Plain classes with manual
// fromJson — the API returns camelCase JSON. Prices are in cents (int);
// percentages are decimals (double).

int _asInt(dynamic v) => v is int ? v : (v as num?)?.toInt() ?? 0;
int? _asIntOrNull(dynamic v) => v == null ? null : _asInt(v);
double? _asDoubleOrNull(dynamic v) =>
    v == null ? null : (v is double ? v : (v as num).toDouble());
DateTime? _asDate(dynamic v) =>
    v == null ? null : DateTime.tryParse(v as String);

class MarketAsset {
  const MarketAsset({
    required this.id,
    required this.ticker,
    required this.name,
    this.coinName,
    required this.assetType,
    required this.assetClass,
    this.logoUrl,
    required this.currency,
    required this.currentPrice,
    this.previousClose,
    this.dayChangePct,
    this.dividendYield,
  });

  final int id;
  final String ticker;
  final String name;
  final String? coinName;
  final String assetType; // wire enum string
  final String assetClass; // display label
  final String? logoUrl;
  final String currency;
  final int currentPrice; // cents
  final int? previousClose; // cents
  final double? dayChangePct;
  final double? dividendYield;

  String get displayName => coinName ?? name;

  factory MarketAsset.fromJson(Map<String, dynamic> j) => MarketAsset(
        id: _asInt(j['id']),
        ticker: j['ticker'] as String? ?? '',
        name: j['name'] as String? ?? '',
        coinName: j['coinName'] as String?,
        assetType: j['assetType'] as String? ?? 'Outro',
        assetClass: j['assetClass'] as String? ?? '',
        logoUrl: j['logoUrl'] as String?,
        currency: j['currency'] as String? ?? 'BRL',
        currentPrice: _asInt(j['currentPrice']),
        previousClose: _asIntOrNull(j['previousClose']),
        dayChangePct: _asDoubleOrNull(j['dayChangePct']),
        dividendYield: _asDoubleOrNull(j['dividendYield']),
      );
}

class MarketPricePoint {
  const MarketPricePoint({required this.date, required this.priceCents});
  final DateTime date;
  final int priceCents;

  factory MarketPricePoint.fromJson(Map<String, dynamic> j) => MarketPricePoint(
        date: _asDate(j['date']) ?? DateTime.now(),
        priceCents: _asInt(j['price']),
      );
}

class MarketAssetDetail {
  const MarketAssetDetail({
    required this.id,
    required this.ticker,
    required this.name,
    this.coinName,
    required this.assetType,
    required this.assetClass,
    this.logoUrl,
    required this.currency,
    required this.currentPrice,
    this.previousClose,
    this.dayChangePct,
    this.lastPriceUpdate,
    required this.priceHistory,
  });

  final int id;
  final String ticker;
  final String name;
  final String? coinName;
  final String assetType;
  final String assetClass;
  final String? logoUrl;
  final String currency;
  final int currentPrice; // cents
  final int? previousClose; // cents
  final double? dayChangePct;
  final DateTime? lastPriceUpdate;
  final List<MarketPricePoint> priceHistory;

  String get displayName => coinName ?? name;

  factory MarketAssetDetail.fromJson(Map<String, dynamic> j) =>
      MarketAssetDetail(
        id: _asInt(j['id']),
        ticker: j['ticker'] as String? ?? '',
        name: j['name'] as String? ?? '',
        coinName: j['coinName'] as String?,
        assetType: j['assetType'] as String? ?? 'Outro',
        assetClass: j['assetClass'] as String? ?? '',
        logoUrl: j['logoUrl'] as String?,
        currency: j['currency'] as String? ?? 'BRL',
        currentPrice: _asInt(j['currentPrice']),
        previousClose: _asIntOrNull(j['previousClose']),
        dayChangePct: _asDoubleOrNull(j['dayChangePct']),
        lastPriceUpdate: _asDate(j['lastPriceUpdate']),
        priceHistory: (j['priceHistory'] as List? ?? [])
            .map((e) => MarketPricePoint.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class MacroIndicator {
  const MacroIndicator({
    required this.slug,
    required this.name,
    this.unit,
    this.value,
    this.date,
    this.previousValue,
  });

  final String slug;
  final String name;
  final String? unit;
  final double? value;
  final String? date;
  final double? previousValue;

  factory MacroIndicator.fromJson(Map<String, dynamic> j) => MacroIndicator(
        slug: j['slug'] as String? ?? '',
        name: j['name'] as String? ?? '',
        unit: j['unit'] as String?,
        value: _asDoubleOrNull(j['value']),
        date: j['date'] as String?,
        previousValue: _asDoubleOrNull(j['previousValue']),
      );
}

/// The three ranking lists shown on the market dashboard.
class MarketDashboard {
  const MarketDashboard({
    required this.macro,
    required this.topGainers,
    required this.topLosers,
    required this.topDividends,
  });

  final List<MacroIndicator> macro;
  final List<MarketAsset> topGainers;
  final List<MarketAsset> topLosers;
  final List<MarketAsset> topDividends;
}
