namespace FinanceControl.Services.Asaas
{
    /// <summary>
    /// Outcome of one Asaas call.
    /// </summary>
    /// <remarks>
    /// Three cases, not two. A 4xx is a verdict (card declined, invalid data) and the
    /// operation did not happen. A timeout, a dropped connection or a 5xx is
    /// <see cref="IsInconclusive"/>: the operation may or may not have happened at Asaas,
    /// so the caller must look before trying again — retrying blindly is how a customer
    /// gets charged twice.
    /// </remarks>
    public class AsaasResult<T>
    {
        public bool IsSuccess { get; private init; }
        public bool IsInconclusive { get; private init; }
        public T? Value { get; private init; }
        public int? StatusCode { get; private init; }
        public string? ErrorCode { get; private init; }
        public string? ErrorDescription { get; private init; }

        public static AsaasResult<T> Success(T value) => new() { IsSuccess = true, Value = value };

        public static AsaasResult<T> Rejected(int statusCode, string? errorCode, string? errorDescription) =>
            new() { StatusCode = statusCode, ErrorCode = errorCode, ErrorDescription = errorDescription };

        public static AsaasResult<T> Inconclusive(int? statusCode, string? errorDescription) =>
            new() { IsInconclusive = true, StatusCode = statusCode, ErrorDescription = errorDescription };
    }
}
