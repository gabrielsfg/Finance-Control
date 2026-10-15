namespace FinanceControl.Services.Pluggy
{
    /// <summary>
    /// Outcome of one Pluggy call: success, a verdict (4xx — the request was refused and
    /// retrying it unchanged will not help) or inconclusive (timeout, transport failure,
    /// 5xx or 429 — worth retrying later).
    /// </summary>
    public class PluggyResult<T>
    {
        public bool IsSuccess { get; private init; }
        public bool IsInconclusive { get; private init; }
        public T? Value { get; private init; }
        public int? StatusCode { get; private init; }
        public string? ErrorCode { get; private init; }
        public string? ErrorMessage { get; private init; }

        public static PluggyResult<T> Success(T value) => new() { IsSuccess = true, Value = value };

        public static PluggyResult<T> Rejected(int statusCode, string? errorCode, string? errorMessage) =>
            new() { StatusCode = statusCode, ErrorCode = errorCode, ErrorMessage = errorMessage };

        public static PluggyResult<T> Inconclusive(int? statusCode, string? errorMessage) =>
            new() { IsInconclusive = true, StatusCode = statusCode, ErrorMessage = errorMessage };

        public PluggyResult<TOther> As<TOther>() => IsInconclusive
            ? PluggyResult<TOther>.Inconclusive(StatusCode, ErrorMessage)
            : PluggyResult<TOther>.Rejected(StatusCode ?? 0, ErrorCode, ErrorMessage);
    }
}
