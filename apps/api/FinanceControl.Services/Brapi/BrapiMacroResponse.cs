using System.Text.Json.Serialization;

namespace FinanceControl.Services.Brapi
{
    // Response of GET /api/v2/macro — economic time series with observations per series.
    internal record BrapiMacroResponse(
        [property: JsonPropertyName("results")] List<BrapiMacroResult>? Results
    );

    internal record BrapiMacroResult(
        [property: JsonPropertyName("series")] BrapiMacroSeries? Series,
        [property: JsonPropertyName("observations")] List<BrapiMacroObservation>? Observations
    );

    internal record BrapiMacroSeries(
        [property: JsonPropertyName("slug")] string? Slug,
        [property: JsonPropertyName("name")] string? Name,
        [property: JsonPropertyName("unit")] string? Unit
    );

    internal record BrapiMacroObservation(
        [property: JsonPropertyName("date")] string? Date,
        [property: JsonPropertyName("value")] decimal? Value
    );
}
