using FinanceControl.Domain.Entities;
using FinanceControl.Services.Ai;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// Old chat turns are folded into a summary in blocks, so the prompt prefix stays
    /// stable between questions, and nothing personal leaks into the summary input.
    /// </summary>
    public class ChatHistoryWindowTests
    {
        private static List<AiMessage> Turns(int count) =>
            Enumerable.Range(1, count)
                .Select(i => new AiMessage
                {
                    Id = i,
                    Role = i % 2 == 1 ? EnumAiMessageRole.User : EnumAiMessageRole.Assistant,
                    Content = $"mensagem {i}"
                })
                .ToList();

        [Theory]
        [InlineData(0, false)]
        [InlineData(9, false)]
        [InlineData(10, true)]
        [InlineData(14, true)]
        public void ShouldSummarize_OnlyOnceTheBlockIsFull(int turns, bool expected)
        {
            Assert.Equal(expected, ChatHistoryWindow.ShouldSummarize(turns));
        }

        [Fact]
        public void RecentTurns_SendsTheWholeOpenBlock()
        {
            var turns = Turns(7);

            Assert.Equal(turns, ChatHistoryWindow.RecentTurns(turns));
        }

        [Fact]
        public void RecentTurns_AfterAFailedSummary_KeepsOnlyTheNewestBlock()
        {
            var recent = ChatHistoryWindow.RecentTurns(Turns(13));

            Assert.Equal(ChatHistoryWindow.BlockSize, recent.Count);
            Assert.Equal(4, recent[0].Id);
            Assert.Equal(13, recent[^1].Id);
        }

        [Fact]
        public void BuildSummaryInput_CarriesThePreviousSummaryAndEveryTurnInOrder()
        {
            var input = ChatHistoryWindow.BuildSummaryInput("Quer reduzir delivery.", Turns(3));

            Assert.Contains("Quer reduzir delivery.", input);
            var first = input.IndexOf("Usuário: mensagem 1", StringComparison.Ordinal);
            var second = input.IndexOf("Assistente: mensagem 2", StringComparison.Ordinal);
            var third = input.IndexOf("Usuário: mensagem 3", StringComparison.Ordinal);
            Assert.True(first >= 0 && first < second && second < third);
        }

        [Fact]
        public void BuildSummaryInput_WithoutAPreviousSummary_SaysItIsEmpty()
        {
            var input = ChatHistoryWindow.BuildSummaryInput(null, Turns(1));

            Assert.Contains("(vazio)", input);
        }

        [Fact]
        public void BuildSummaryInput_ScrubsPersonalDataFromTurnsAndSummary()
        {
            var turns = new List<AiMessage>
            {
                new() { Id = 1, Role = EnumAiMessageRole.User, Content = "Paguei o PIX para 123.456.789-09" }
            };

            var input = ChatHistoryWindow.BuildSummaryInput("Contato: ana@exemplo.com", turns);

            Assert.DoesNotContain("123.456.789-09", input);
            Assert.DoesNotContain("ana@exemplo.com", input);
        }
    }
}
