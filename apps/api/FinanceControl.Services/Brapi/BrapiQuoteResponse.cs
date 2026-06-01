using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    internal record BrapiQuoteResponse(
        [property: JsonPropertyName("results")] List<BrapiQuoteResult> Results,
        [property: JsonPropertyName("requestedAt")] DateTime RequestedAt,
        // "took" alternates between string and int depending on payload size — use JsonElement to accept both.
        [property: JsonPropertyName("took")] System.Text.Json.JsonElement? Took = null
    );

    internal record BrapiQuoteResult(
        [property: JsonPropertyName("symbol")] string Symbol,
        [property: JsonPropertyName("currency")] string Currency,
        [property: JsonPropertyName("logourl")] string? LogoUrl,
        [property: JsonPropertyName("regularMarketPrice")] decimal? RegularMarketPrice,
        [property: JsonPropertyName("regularMarketTime")] DateTime? RegularMarketTime,
        [property: JsonPropertyName("dividendsData")] BrapiDividendsData? DividendsData,
        [property: JsonPropertyName("historicalDataPrice")] List<BrapiHistoricalPrice>? HistoricalDataPrice
    );

    internal record BrapiDividendsData(
        [property: JsonPropertyName("cashDividends")] List<BrapiCashDividend> CashDividends
    );

    internal record BrapiCashDividend(
        [property: JsonPropertyName("paymentDate")] string? PaymentDate,
        [property: JsonPropertyName("lastDatePrior")] string? LastDatePrior,
        [property: JsonPropertyName("rate")] decimal Rate,
        [property: JsonPropertyName("label")] string Label
    );

    internal record BrapiHistoricalPrice(
        [property: JsonPropertyName("date")] long Date,
        [property: JsonPropertyName("close")] decimal? Close
    );
}
