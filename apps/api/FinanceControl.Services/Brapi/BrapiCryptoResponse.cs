using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    internal record BrapiCryptoResponse(
        [property: JsonPropertyName("coins")] List<BrapiCryptoCoin> Coins,
        [property: JsonPropertyName("requestedAt")] DateTime RequestedAt,
        [property: JsonPropertyName("took")] string Took
    );

    internal record BrapiCryptoCoin(
        [property: JsonPropertyName("coin")] string Coin,
        [property: JsonPropertyName("currency")] string Currency,
        [property: JsonPropertyName("coinImageUrl")] string? CoinImageUrl,
        [property: JsonPropertyName("regularMarketPrice")] decimal? RegularMarketPrice,
        [property: JsonPropertyName("regularMarketTime")] DateTime? RegularMarketTime,
        [property: JsonPropertyName("historicalDataPrice")] List<BrapiHistoricalPrice>? HistoricalDataPrice
    );
}
