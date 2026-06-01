using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/quote/list — the full B3 asset universe (paginated).
    internal record BrapiAssetListResponse(
        [property: JsonPropertyName("stocks")] List<BrapiAssetListItem>? Stocks,
        [property: JsonPropertyName("currentPage")] int CurrentPage,
        [property: JsonPropertyName("totalPages")] int TotalPages,
        [property: JsonPropertyName("hasNextPage")] bool HasNextPage,
        [property: JsonPropertyName("totalCount")] int TotalCount
    );

    internal record BrapiAssetListItem(
        [property: JsonPropertyName("stock")] string Stock,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("close")] decimal? Close,
        [property: JsonPropertyName("sector")] string? Sector,
        [property: JsonPropertyName("type")] string? Type,
        [property: JsonPropertyName("subType")] string? SubType,
        [property: JsonPropertyName("logo")] string? Logo
    );
}
