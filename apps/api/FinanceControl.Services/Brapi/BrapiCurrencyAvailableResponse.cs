using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/v2/currency/available — the list of tradable FX pairs.
    internal record BrapiCurrencyAvailableResponse(
        [property: JsonPropertyName("currencies")] List<BrapiCurrencyAvailableItem>? Currencies
    );

    internal record BrapiCurrencyAvailableItem(
        [property: JsonPropertyName("name")] string Name,          // e.g. "USD-BRL"
        [property: JsonPropertyName("currency")] string? Currency  // human description, e.g. "Dólar Americano/Real Brasileiro"
    );
}
