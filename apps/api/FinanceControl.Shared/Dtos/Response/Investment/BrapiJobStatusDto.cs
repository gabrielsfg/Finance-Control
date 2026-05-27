namespace FinanceControl.Shared.Dtos.Response.Investment
{
    public class BrapiJobStatusDto
    {
        public DateTime? LastRunAt { get; set; }
        public int AssetsUpdated { get; set; }
        public int DividendsInserted { get; set; }
        public int ErrorCount { get; set; }
        public List<string> Errors { get; set; } = [];
    }
}
