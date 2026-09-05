using System.Text.Json;
using FinanceControl.Services.Ai;
using FinanceControl.Shared.Dtos.Others.Insight;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// The guard is what turns "the product does not recommend investments" from a promise
    /// into a property. These tests are the reason it can be trusted after someone edits
    /// the prompt.
    /// </summary>
    public class InsightOutputGuardTests
    {
        private static readonly string SnapshotJson = JsonSerializer.Serialize(new InsightSnapshotDto
        {
            PeriodStart = new DateOnly(2026, 8, 31),
            PeriodEnd = new DateOnly(2026, 9, 6),
            DeclaredRiskProfile = "conservador",
            Spending = new InsightSpendingDto
            {
                CurrentWeekTotal = "R$ 1.240,00",
                PreviousWeekTotal = "R$ 980,00",
                TwelveWeekAverage = "R$ 1.050,00",
                ChangeVsAverage = "18,1% acima",
                WeekdayAverage = "R$ 700,00",
                WeekendAverage = "R$ 350,00",
                CurrentWeekendTotal = "R$ 490,00",
                WeekendChangeVsAverage = "40% acima"
            },
            Portfolio = new InsightPortfolioDto
            {
                TotalValue = "R$ 50.000,00",
                PositionCount = 3,
                LargestPositionTicker = "PETR4",
                LargestPositionWeight = "62%",
                LargestClass = "ações",
                LargestClassWeight = "78%",
                VariableIncomeWeight = "78%",
                Positions =
                [
                    new InsightPositionDto { Ticker = "PETR4", AssetClass = "ações", Value = "R$ 31.000,00", Weight = "62%", Result = "12% acima" }
                ]
            }
        });

        private static readonly string[] OwnedTickers = ["PETR4"];

        private static InsightModelOutputDto Output(string text, params string[] figures) => new()
        {
            Headline = "Resumo da sua semana",
            Paragraphs = [new InsightModelParagraphDto { Text = text, Figures = figures.ToList() }]
        };

        [Fact]
        public void Inspect_DescriptiveTextWithSnapshotFigures_IsApproved()
        {
            var output = Output(
                "Você gastou R$ 1.240,00 nesta semana, 18,1% acima da sua média das últimas 12 semanas.",
                "R$ 1.240,00", "18,1% acima");

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.True(result.IsApproved);
        }

        [Theory]
        [InlineData("Considere vender parte da posição para reduzir o risco.")]
        [InlineData("O ideal seria investir em renda fixa neste momento.")]
        [InlineData("Recomendo diversificar sua carteira.")]
        [InlineData("Você deveria aportar em ativos mais estáveis.")]
        [InlineData("Avalie resgatar parte do valor aplicado.")]
        public void Inspect_RecommendationLanguage_IsRejected(string text)
        {
            var result = InsightOutputGuard.Inspect(Output(text), SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        [Theory]
        [InlineData("Esse ativo faz sentido para o seu perfil conservador.")]
        [InlineData("Essa alocação não é adequada para você.")]
        [InlineData("Renda fixa seria a melhor opção no seu caso.")]
        [InlineData("Vale a pena manter essa concentração.")]
        [InlineData("Falta na sua carteira uma parcela de renda fixa.")]
        public void Inspect_AdequacyJudgement_IsRejected(string text)
        {
            var result = InsightOutputGuard.Inspect(Output(text), SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        /// <summary>
        /// Accents must not be an escape hatch: the term list is written unaccented and the
        /// text is normalised before matching, so "recomendação" and "recomendacao" are the
        /// same word to the guard.
        /// </summary>
        [Fact]
        public void Inspect_AccentedForbiddenTerm_IsRejected()
        {
            var result = InsightOutputGuard.Inspect(
                Output("Esta é a nossa recomendação para o mês."), SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        [Fact]
        public void Inspect_TickerTheUserDoesNotHold_IsRejected()
        {
            var output = Output("Sua carteira tem 62% em PETR4 e nenhuma posição em VALE3.", "62%");

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
            Assert.Contains("VALE3", result.Reason);
        }

        [Fact]
        public void Inspect_TickerTheUserHolds_IsApproved()
        {
            var output = Output("Sua maior posição é PETR4, com 62% da carteira.", "62%");

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.True(result.IsApproved);
        }

        /// <summary>The failure the whole design exists to prevent: a plausible invented number.</summary>
        [Fact]
        public void Inspect_AmountNotInSnapshot_IsRejected()
        {
            var output = Output("Você gastou R$ 1.310,00 nesta semana.", "R$ 1.310,00");

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        [Fact]
        public void Inspect_PercentageNotInSnapshot_IsRejected()
        {
            var output = Output("Seus gastos subiram 23,7% em relação à média.", "23,7%");

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        /// <summary>
        /// A bare small integer is prose, not a financial claim. Rejecting it would fail
        /// perfectly correct sentences and push the writer towards vaguer text.
        /// </summary>
        [Fact]
        public void Inspect_BareSmallIntegerInProse_IsApproved()
        {
            var output = Output("Nas últimas 12 semanas, sua média foi de R$ 1.050,00.", "R$ 1.050,00");

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.True(result.IsApproved);
        }

        [Fact]
        public void Inspect_DeclaredFigureAbsentFromSnapshot_IsRejected()
        {
            var output = new InsightModelOutputDto
            {
                Headline = "Resumo da sua semana",
                Paragraphs =
                [
                    new InsightModelParagraphDto
                    {
                        Text = "Seus gastos ficaram acima da média.",
                        Figures = ["R$ 9.999,00"]
                    }
                ]
            };

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        [Fact]
        public void Inspect_OutOfScopeCommentary_IsRejected()
        {
            var output = Output("O mercado deve reagir bem nas próximas semanas.");

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        [Fact]
        public void Inspect_EmptyOutput_IsRejected()
        {
            var output = new InsightModelOutputDto { Headline = "", Paragraphs = [] };

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        [Fact]
        public void Inspect_ParagraphOverLengthLimit_IsRejected()
        {
            var output = Output(new string('a', 321));

            var result = InsightOutputGuard.Inspect(output, SnapshotJson, OwnedTickers);

            Assert.False(result.IsApproved);
        }

        /// <summary>
        /// Every configured term has to actually trip the guard — a typo in the list would
        /// otherwise sit there looking like protection.
        /// </summary>
        [Fact]
        public void Inspect_EveryConfiguredTerm_IsRejected()
        {
            var allTerms = InsightGuardTerms.RecommendationTerms
                .Concat(InsightGuardTerms.AdequacyTerms)
                .Concat(InsightGuardTerms.OutOfScopeTerms);

            foreach (var term in allTerms)
            {
                var result = InsightOutputGuard.Inspect(
                    Output($"Texto neutro {term} texto neutro."), SnapshotJson, OwnedTickers);

                Assert.False(result.IsApproved, $"Term not caught by the guard: {term}");
            }
        }
    }
}
