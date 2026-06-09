using System.Text.Json;
using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    /// <summary>
    /// Reads any JSON number (integer, decimal, or scientific-notation float) as a long.
    /// Brapi occasionally returns marketCap as a floating-point value (e.g. 1.23e13) which
    /// System.Text.Json cannot coerce to long? directly — this converter handles that case
    /// by reading the raw number as decimal and casting to long.
    /// </summary>
    internal sealed class NullableLongFromNumberConverter : JsonConverter<long?>
    {
        public override long? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;
            // Parse as decimal to accept both integer and floating-point representations,
            // then truncate to long (same semantics as an explicit cast).
            var value = reader.GetDecimal();
            return (long)value;
        }

        public override void Write(Utf8JsonWriter writer, long? value, JsonSerializerOptions options)
        {
            if (value is null) writer.WriteNullValue();
            else writer.WriteNumberValue(value.Value);
        }
    }

    internal record BrapiQuoteResponse(
        [property: JsonPropertyName("results")] List<BrapiQuoteResult> Results,
        [property: JsonPropertyName("requestedAt")] DateTime RequestedAt,
        // "took" alternates between string and int depending on payload size — use JsonElement to accept both.
        [property: JsonPropertyName("took")] JsonElement? Took = null
    );

    internal record BrapiQuoteResult(
        [property: JsonPropertyName("symbol")] string Symbol,
        [property: JsonPropertyName("currency")] string Currency,
        [property: JsonPropertyName("logourl")] string? LogoUrl,
        [property: JsonPropertyName("regularMarketPrice")] decimal? RegularMarketPrice,
        [property: JsonPropertyName("regularMarketTime")] DateTime? RegularMarketTime,
        [property: JsonPropertyName("dividendsData")] BrapiDividendsData? DividendsData,
        [property: JsonPropertyName("historicalDataPrice")] List<BrapiHistoricalPrice>? HistoricalDataPrice,
        // Populated only when the request asks for &modules=defaultKeyStatistics,financialData.
        // Uses a custom converter because Brapi occasionally returns marketCap as a float (e.g. 1.23e13).
        [property: JsonPropertyName("marketCap")]
        [property: JsonConverter(typeof(NullableLongFromNumberConverter))] long? MarketCap = null,
        [property: JsonPropertyName("priceEarnings")] decimal? PriceEarnings = null,
        [property: JsonPropertyName("defaultKeyStatistics")] JsonElement? DefaultKeyStatistics = null,
        [property: JsonPropertyName("financialData")] JsonElement? FinancialData = null
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
