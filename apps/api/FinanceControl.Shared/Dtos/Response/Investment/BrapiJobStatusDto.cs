namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class BrapiJobStatusDto
    {
        public bool IsRunning { get; set; }
        public DateTime? StartedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        public DateTime? LastRunAt { get; set; }    // kept for compatibility
        public int AssetsDiscovered { get; set; }
        public int AssetsUpdated { get; set; }
        public int DividendsInserted { get; set; }
        public int ErrorCount { get; set; }
        public List<string> Errors { get; set; } = [];
    }
}
