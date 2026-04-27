using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Services.Services
{
    public class BankService : IBankService
    {
        private static readonly IReadOnlyDictionary<string, IReadOnlyList<BankResponseDto>> _banks =
            new Dictionary<string, IReadOnlyList<BankResponseDto>>(StringComparer.OrdinalIgnoreCase)
            {
                ["BR"] = new List<BankResponseDto>
                {
                    new() { Name = "Itaú",      Country = "BR" },
                    new() { Name = "Bradesco",  Country = "BR" },
                    new() { Name = "Nubank",    Country = "BR" },
                    new() { Name = "Santander", Country = "BR" },
                    new() { Name = "BTG",       Country = "BR" },
                    new() { Name = "Caixa",     Country = "BR" },
                    new() { Name = "BB",        Country = "BR" },
                    new() { Name = "Inter",     Country = "BR" },
                    new() { Name = "C6",        Country = "BR" },
                    new() { Name = "XP",        Country = "BR" },
                },
                ["US"] = new List<BankResponseDto>
                {
                    new() { Name = "Chase",       Country = "US" },
                    new() { Name = "Bank of America", Country = "US" },
                    new() { Name = "Wells Fargo", Country = "US" },
                    new() { Name = "Citi",        Country = "US" },
                    new() { Name = "PayPal",      Country = "US" },
                },
            };

        public IReadOnlyList<BankResponseDto> GetBanks(string country)
        {
            var key = country.Trim().ToUpper();
            return _banks.TryGetValue(key, out var banks) ? banks : [];
        }
    }
}
