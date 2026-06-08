using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/v2/fii/list — FII-specific metrics. Root key is "fiis".
    internal record BrapiFiiListResponse(
        [property: JsonPropertyName("fiis")] List<BrapiFii>? Fiis
    );

    internal record BrapiFii(
        [property: JsonPropertyName("symbol")] string? Symbol,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("segmentType")] string? SegmentType,
        [property: JsonPropertyName("segmentoAtuacao")] string? SegmentoAtuacao,
        [property: JsonPropertyName("tipoGestao")] string? TipoGestao,
        [property: JsonPropertyName("mandate")] string? Mandate,
        [property: JsonPropertyName("administratorName")] string? AdministratorName,
        [property: JsonPropertyName("price")] decimal? Price,
        [property: JsonPropertyName("navPerShare")] decimal? NavPerShare,
        [property: JsonPropertyName("priceToNav")] decimal? PriceToNav,
        [property: JsonPropertyName("dividendYield12m")] decimal? DividendYield12m,
        [property: JsonPropertyName("totalInvestors")] long? TotalInvestors
    );
}
