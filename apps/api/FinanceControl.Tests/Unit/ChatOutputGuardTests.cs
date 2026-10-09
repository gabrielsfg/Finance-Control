using FinanceControl.Services.Ai;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// The chat must be able to talk about purchases and sales the user made, and must not
    /// advise buying or selling financial products. These cases sit on both sides of that line.
    /// </summary>
    public class ChatOutputGuardTests
    {
        private static readonly string[] Owned = ["PETR4", "ITSA4"];

        [Theory]
        [InlineData("Você gastou **R$ 1.240,00** com mercado em agosto, 12% acima de julho.")]
        [InlineData("Registrei a compra de R$ 50,00 no mercado. Confira o card e confirme.")]
        [InlineData("A venda de PETR4 em março gerou R$ 300,00 de lucro.")]
        [InlineData("CDB é um título de renda fixa emitido por bancos.")]
        [InlineData("Sua carteira tem 62% em PETR4 e 38% em ITSA4.")]
        [InlineData("Não faço recomendações de investimento, mas posso rodar uma simulação.")]
        public void Approves_DescriptiveAnswers(string answer)
        {
            Assert.True(ChatOutputGuard.Inspect(answer, Owned).IsApproved);
        }

        [Theory]
        [InlineData("Eu recomendo que você venda PETR4 agora.")]
        [InlineData("Sugiro que você invista em Tesouro IPCA.")]
        [InlineData("Você deveria comprar mais ITSA4.")]
        [InlineData("O melhor investimento para você é um CDB de liquidez diária.")]
        [InlineData("Este é um bom momento para comprar ações.")]
        public void Rejects_Advice(string answer)
        {
            Assert.False(ChatOutputGuard.Inspect(answer, Owned).IsApproved);
        }

        [Fact]
        public void Rejects_TickerTheUserNeitherHoldsNorMentioned()
        {
            var verdict = ChatOutputGuard.Inspect("Uma alternativa seria olhar VALE3.", Owned);

            Assert.False(verdict.IsApproved);
        }

        [Fact]
        public void Approves_TickerTheUserAskedAbout()
        {
            var allowed = Owned.Concat(ChatOutputGuard.ExtractTickers("quanto está a VALE3 hoje?")).ToList();

            Assert.True(ChatOutputGuard.Inspect("A VALE3 fechou ontem a R$ 60,12.", allowed).IsApproved);
        }
    }
}
