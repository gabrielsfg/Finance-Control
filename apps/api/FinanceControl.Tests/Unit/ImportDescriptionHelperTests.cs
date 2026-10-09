using FinanceControl.Services.Helpers;

namespace FinanceControl.Tests.Unit
{
    public class ImportDescriptionHelperTests
    {
        [Theory]
        [InlineData("MAGAZINE LUIZA Parcela 3/12", 3, 12)]
        [InlineData("AMAZON PARC 02/10", 2, 10)]
        [InlineData("LOJA X 3 de 6", 3, 6)]
        [InlineData("NETSHOES 01/04", 1, 4)]
        public void DetectInstallment_ReadsCommonFormats(string description, int number, int total)
        {
            Assert.Equal((number, total), ImportDescriptionHelper.DetectInstallment(description));
        }

        [Theory]
        [InlineData("IFOOD *RESTAURANTE 25/09")]
        [InlineData("UBER TRIP")]
        [InlineData("PIX ENVIADO MARIA")]
        [InlineData("")]
        public void DetectInstallment_IgnoresDatesAndPlainText(string description)
        {
            Assert.Null(ImportDescriptionHelper.DetectInstallment(description));
        }

        [Fact]
        public void ToMatchKey_DropsNumbersAccentsAndPaymentNoise()
        {
            Assert.Equal("padaria sao joao", ImportDescriptionHelper.ToMatchKey("PIX ENVIADO Padaria São João 25/09"));
        }

        [Fact]
        public void ToMatchKey_MakesTheSameMerchantMatchAcrossMonths()
        {
            Assert.Equal(
                ImportDescriptionHelper.ToMatchKey("NETFLIX.COM 0123"),
                ImportDescriptionHelper.ToMatchKey("Netflix.com 9876"));
        }
    }
}
