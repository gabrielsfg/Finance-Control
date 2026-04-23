using FinanceControl.Services.Services;

namespace FinanceControl.Tests.Unit
{
    public class BankServiceTests
    {
        private readonly BankService _service = new();

        [Fact]
        public void GetBanks_BR_ReturnsBrazilianBanks()
        {
            var banks = _service.GetBanks("BR");
            Assert.NotEmpty(banks);
            Assert.All(banks, b => Assert.Equal("BR", b.Country));
        }

        [Fact]
        public void GetBanks_US_ReturnsAmericanBanks()
        {
            var banks = _service.GetBanks("US");
            Assert.NotEmpty(banks);
            Assert.All(banks, b => Assert.Equal("US", b.Country));
        }

        [Fact]
        public void GetBanks_LowercaseCountry_StillReturnsResults()
        {
            var banks = _service.GetBanks("br");
            Assert.NotEmpty(banks);
        }

        [Fact]
        public void GetBanks_UnknownCountry_ReturnsEmpty()
        {
            var banks = _service.GetBanks("XX");
            Assert.Empty(banks);
        }

        [Fact]
        public void GetBanks_BR_ContainsExpectedBanks()
        {
            var banks = _service.GetBanks("BR");
            var names = banks.Select(b => b.Name).ToList();
            Assert.Contains("Nubank", names);
            Assert.Contains("Itaú", names);
        }

        [Fact]
        public void GetBanks_US_ContainsExpectedBanks()
        {
            var banks = _service.GetBanks("US");
            var names = banks.Select(b => b.Name).ToList();
            Assert.Contains("Chase", names);
        }
    }
}
