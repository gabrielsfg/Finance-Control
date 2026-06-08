using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/v2/currency?currency=USD-BRL,EUR-BRL — current FX quotes.
    // Every numeric field comes back as a string (e.g. bidPrice "5.4231").
    internal record BrapiCurrencyResponse(
        [property: JsonPropertyName("currency")] List<BrapiCurrencyQuote>? Currency
    );

    internal record BrapiCurrencyQuote(
        [property: JsonPropertyName("fromCurrency")] string? FromCurrency,
        [property: JsonPropertyName("toCurrency")] string? ToCurrency,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("bidPrice")] string? BidPrice,
        [property: JsonPropertyName("askPrice")] string? AskPrice,
        [property: JsonPropertyName("percentageChange")] string? PercentageChange
    );
}
