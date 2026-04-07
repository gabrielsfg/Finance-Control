namespace FinanceControl.Domain.Entities
{
    public class UserPreferences
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string CurrencyCode { get; set; } = "BRL";
        public string Locale { get; set; } = "pt-BR";

        public User User { get; set; } = null!;
    }
}
