using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    internal record BrapiCryptoAvailableResponse(
        [property: JsonPropertyName("coins")] List<string> Coins
    );
}
