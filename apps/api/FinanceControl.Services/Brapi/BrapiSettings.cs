namespace FinanceControl.Services.Brapi
{
    public class BrapiSettings
    {
        public string Token { get; set; } = string.Empty;
        public int BatchSize { get; set; } = 10;
        public int MaxParallelBatches { get; set; } = 3;
        public int TimeoutSeconds { get; set; } = 30;
        public int RetryDelayMinutes { get; set; } = 3;
        public int TargetHourUtc { get; set; } = 22;
    public string BackfillRange { get; set; } = "max";
    }
}
