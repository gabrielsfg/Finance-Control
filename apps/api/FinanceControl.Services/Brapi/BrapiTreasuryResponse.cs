using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/v2/treasury/list — paginated catalogue of offered titles.
    internal record BrapiTreasuryListResponse(
        [property: JsonPropertyName("results")] List<BrapiTreasurySecurity>? Results,
        [property: JsonPropertyName("pagination")] BrapiTreasuryPagination? Pagination
    );

    internal record BrapiTreasuryPagination(
        [property: JsonPropertyName("hasNextPage")] bool HasNextPage
    );

    // Response of GET /api/v2/treasury/indicators — current rates/prices for given symbols.
    internal record BrapiTreasuryIndicatorsResponse(
        [property: JsonPropertyName("results")] List<BrapiTreasurySecurity>? Results
    );

    // Shared shape used by both list and indicators. Prices are in reais (e.g. 14000.50).
    internal record BrapiTreasurySecurity(
        [property: JsonPropertyName("symbol")] string Symbol,        // slug, e.g. "tesouro-selic-01032031"
        [property: JsonPropertyName("bondType")] string? BondType,   // e.g. "Tesouro Selic"
        [property: JsonPropertyName("indexer")] string? Indexer,     // selic | prefixado | ipca | igpm
        [property: JsonPropertyName("maturityDate")] string? MaturityDate,
        [property: JsonPropertyName("buyPrice")] decimal? BuyPrice,
        [property: JsonPropertyName("sellPrice")] decimal? SellPrice,
        [property: JsonPropertyName("basePrice")] decimal? BasePrice
    );
}
