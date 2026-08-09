// Domain models for the Investments (carteira) feature. Plain classes with
// manual fromJson — the API returns camelCase JSON. Monetary values are in
// cents (int); quantities and percentages are decimals (double).

int _asInt(dynamic v) => v is int ? v : (v as num?)?.toInt() ?? 0;
double _asDouble(dynamic v) => v is double ? v : (v as num?)?.toDouble() ?? 0.0;
DateTime? _asDate(dynamic v) =>
    v == null ? null : DateTime.tryParse(v as String);

/// Asset type — matches the backend `EnumAssetType` member names on the wire.
enum AssetType {
  acao('Acao', 'Ação'),
  fundoInvestimento('FundoInvestimento', 'Fundo de Investimento'),
  fii('FII', 'FII'),
  cripto('Cripto', 'Cripto'),
  stock('Stock', 'Stock'),
  reit('Reit', 'REIT'),
  bdr('BDR', 'BDR'),
  etf('ETF', 'ETF'),
  etfInternacional('ETFInternacional', 'ETF Internacional'),
  tesouroDireto('TesouroDireto', 'Tesouro Direto'),
  rendaFixa('RendaFixa', 'Renda Fixa'),
  indexAsset('Index', 'Índice'),
  moeda('Moeda', 'Moeda'),
  outro('Outro', 'Outro');

  const AssetType(this.wire, this.labelPt);
  final String wire;
  final String labelPt;

  static AssetType fromWire(String? v) =>
      values.firstWhere((e) => e.wire == v, orElse: () => AssetType.outro);
}

/// Buy or sell — matches the backend `EnumInvestmentOperation`.
enum InvestmentOperation {
  buy('Buy', 'Compra'),
  sell('Sell', 'Venda');

  const InvestmentOperation(this.wire, this.labelPt);
  final String wire;
  final String labelPt;
}

class Investment {
  const Investment({
    required this.id,
    required this.ticker,
    required this.name,
    required this.assetType,
    required this.assetClass,
    this.broker,
    required this.currentQuantity,
    required this.averagePrice,
    required this.currentPrice,
    required this.currentValue,
    required this.totalInvested,
    required this.totalReturn,
    required this.totalReturnPercent,
    required this.dayChangePct,
    this.logoUrl,
    required this.currency,
    required this.accountId,
  });

  final int id;
  final String ticker;
  final String name;
  final AssetType assetType;
  final String assetClass;
  final String? broker;
  final double currentQuantity;
  final int averagePrice; // cents
  final int currentPrice; // cents
  final int currentValue; // cents
  final int totalInvested; // cents
  final int totalReturn; // cents
  final double totalReturnPercent;
  final double dayChangePct;
  final String? logoUrl;
  final String currency;
  final int accountId;

  factory Investment.fromJson(Map<String, dynamic> j) => Investment(
        id: _asInt(j['id']),
        ticker: j['ticker'] as String? ?? '',
        name: j['name'] as String? ?? '',
        assetType: AssetType.fromWire(j['assetType'] as String?),
        assetClass: j['assetClass'] as String? ?? '',
        broker: j['broker'] as String?,
        currentQuantity: _asDouble(j['currentQuantity']),
        averagePrice: _asInt(j['averagePrice']),
        currentPrice: _asInt(j['currentPrice']),
        currentValue: _asInt(j['currentValue']),
        totalInvested: _asInt(j['totalInvested']),
        totalReturn: _asInt(j['totalReturn']),
        totalReturnPercent: _asDouble(j['totalReturnPercent']),
        dayChangePct: _asDouble(j['dayChangePct']),
        logoUrl: j['logoUrl'] as String?,
        currency: j['currency'] as String? ?? 'BRL',
        accountId: _asInt(j['accountId']),
      );
}

class InvestmentAllocation {
  const InvestmentAllocation({
    required this.assetClass,
    required this.value,
    required this.percent,
    required this.color,
  });

  final String assetClass;
  final int value; // cents
  final double percent;
  final String color; // hex

  factory InvestmentAllocation.fromJson(Map<String, dynamic> j) =>
      InvestmentAllocation(
        assetClass: j['assetClass'] as String? ?? '',
        value: _asInt(j['value']),
        percent: _asDouble(j['percent']),
        color: j['color'] as String? ?? '',
      );
}

class InvestmentPortfolio {
  const InvestmentPortfolio({
    required this.investments,
    required this.currentValue,
    required this.totalInvested,
    required this.totalReturn,
    required this.totalReturnPercent,
    required this.allocations,
  });

  final List<Investment> investments;
  final int currentValue; // cents
  final int totalInvested; // cents
  final int totalReturn; // cents
  final double totalReturnPercent;
  final List<InvestmentAllocation> allocations;

  static const empty = InvestmentPortfolio(
    investments: [],
    currentValue: 0,
    totalInvested: 0,
    totalReturn: 0,
    totalReturnPercent: 0,
    allocations: [],
  );

  factory InvestmentPortfolio.fromJson(Map<String, dynamic> j) =>
      InvestmentPortfolio(
        investments: (j['investments'] as List? ?? [])
            .map((e) => Investment.fromJson(e as Map<String, dynamic>))
            .toList(),
        currentValue: _asInt(j['currentValue']),
        totalInvested: _asInt(j['totalInvested']),
        totalReturn: _asInt(j['totalReturn']),
        totalReturnPercent: _asDouble(j['totalReturnPercent']),
        allocations: (j['allocations'] as List? ?? [])
            .map((e) => InvestmentAllocation.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class InvestmentPricePoint {
  const InvestmentPricePoint({required this.date, required this.priceCents});
  final DateTime date;
  final int priceCents;

  factory InvestmentPricePoint.fromJson(Map<String, dynamic> j) =>
      InvestmentPricePoint(
        date: _asDate(j['date']) ?? DateTime.now(),
        priceCents: _asInt(j['price']),
      );
}

/// Payload for POST /api/Investment/transactions (buy/sell).
class CreateInvestmentTransactionRequest {
  const CreateInvestmentTransactionRequest({
    required this.ticker,
    required this.name,
    required this.assetType,
    this.broker,
    required this.operation,
    required this.date,
    required this.quantity,
    required this.unitPriceCents,
    this.otherCostsCents = 0,
    required this.accountId,
  });

  final String ticker;
  final String name;
  final AssetType assetType;
  final String? broker;
  final InvestmentOperation operation;
  final DateTime date;
  final double quantity;
  final int unitPriceCents;
  final int otherCostsCents;
  final int accountId;

  Map<String, dynamic> toJson() => {
        'ticker': ticker,
        'name': name,
        'assetType': assetType.wire,
        if (broker != null && broker!.isNotEmpty) 'broker': broker,
        'operation': operation.wire,
        'date': date.toIso8601String().split('T').first,
        'quantity': quantity,
        'unitPrice': unitPriceCents,
        'otherCosts': otherCostsCents,
        'accountId': accountId,
      };
}
