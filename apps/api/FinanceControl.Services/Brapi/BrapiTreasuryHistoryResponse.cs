using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/v2/treasury/indicators/history — daily series per symbol.
    internal record BrapiTreasuryHistoryResponse(
        [property: JsonPropertyName("results")] List<BrapiTreasuryHistoryResult>? Results
    );

    internal record BrapiTreasuryHistoryResult(
        [property: JsonPropertyName("symbol")] string? Symbol,
        [property: JsonPropertyName("history")] List<BrapiTreasuryHistoryPoint>? History
    );

    internal record BrapiTreasuryHistoryPoint(
        [property: JsonPropertyName("baseDate")] string? BaseDate,   // "YYYY-MM-DD"
        [property: JsonPropertyName("buyPrice")] decimal? BuyPrice,
        [property: JsonPropertyName("sellPrice")] decimal? SellPrice,
        [property: JsonPropertyName("basePrice")] decimal? BasePrice
    );
}
