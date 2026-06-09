using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/v2/currency/historical?currency=USD-BRL — daily PTAX series per pair.
    internal record BrapiCurrencyHistoricalResponse(
        [property: JsonPropertyName("results")] List<BrapiCurrencyHistoricalResult>? Results
    );

    internal record BrapiCurrencyHistoricalResult(
        [property: JsonPropertyName("pair")] string? Pair,
        [property: JsonPropertyName("fromCurrency")] string? FromCurrency,
        [property: JsonPropertyName("toCurrency")] string? ToCurrency,
        [property: JsonPropertyName("observations")] List<BrapiCurrencyObservation>? Observations
    );

    internal record BrapiCurrencyObservation(
        [property: JsonPropertyName("date")] string? Date,   // "YYYY-MM-DD"
        [property: JsonPropertyName("value")] decimal? Value
    );
}
