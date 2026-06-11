using FinanceControl.Shared.Enums;

namespace FinanceControl.Shared.Dtos.Response
{
    public class GetNotificationResponseDto
    {
        public int Id { get; set; }
        public EnumNotificationType Type { get; set; }
        public string Title { get; set; }
        public string Body { get; set; }
        public string? ActionUrl { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
