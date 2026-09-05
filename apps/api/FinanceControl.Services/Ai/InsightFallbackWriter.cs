using FinanceControl.Shared.Dtos.Others.Insight;

namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// Writes the card without a model, from the same figures the model would have used.
    /// </summary>
    /// <remarks>
    /// This is what the user sees when the guard rejects the generated text or the provider
    /// fails. It is drier, and that is the point: the fallback existing is what makes it
    /// safe to reject a suspicious output instead of shipping it because the alternative
    /// was an empty card.
    /// </remarks>
    public static class InsightFallbackWriter
    {
        public static InsightModelOutputDto WriteSpending(InsightSnapshotDto snapshot)
        {
            var spending = snapshot.Spending;
            if (spending is null)
                return Empty();

            var paragraphs = new List<InsightModelParagraphDto>
            {
                new()
                {
                    Text = $"Você gastou {spending.CurrentWeekTotal} nesta semana, " +
                           $"{spending.ChangeVsAverage} da sua média das últimas semanas.",
                    Figures = [spending.CurrentWeekTotal, spending.ChangeVsAverage]
                }
            };

            var topCategory = spending.Categories.FirstOrDefault();
            if (topCategory is not null)
            {
                paragraphs.Add(new InsightModelParagraphDto
                {
                    Text = $"A maior despesa foi {topCategory.Category}, com {topCategory.CurrentWeek} " +
                           $"({topCategory.ChangeVsAverage} da média dessa categoria).",
                    Figures = [topCategory.CurrentWeek, topCategory.ChangeVsAverage]
                });
            }

            if (snapshot.Reserve is { } reserve)
            {
                paragraphs.Add(new InsightModelParagraphDto
                {
                    Text = $"Sua reserva cobre {reserve.MonthsCovered} meses do seu gasto médio " +
                           $"de {reserve.AverageMonthlyExpense}.",
                    Figures = [reserve.MonthsCovered, reserve.AverageMonthlyExpense]
                });
            }

            return new InsightModelOutputDto
            {
                Headline = "Resumo da sua semana",
                Paragraphs = paragraphs
            };
        }

        public static InsightModelOutputDto WritePortfolio(InsightSnapshotDto snapshot)
        {
            var portfolio = snapshot.Portfolio;
            if (portfolio is null)
                return Empty();

            var paragraphs = new List<InsightModelParagraphDto>
            {
                new()
                {
                    Text = $"Sua carteira soma {portfolio.TotalValue} em {portfolio.PositionCount} posições. " +
                           $"A maior concentração está em {portfolio.LargestPositionTicker}, " +
                           $"com {portfolio.LargestPositionWeight} do total.",
                    Figures = [portfolio.TotalValue, portfolio.LargestPositionWeight]
                }
            };

            if (snapshot.DeclaredRiskProfile is { } profile)
            {
                paragraphs.Add(new InsightModelParagraphDto
                {
                    Text = $"Você declarou perfil {profile} e {portfolio.VariableIncomeWeight} " +
                           "da sua carteira está em renda variável.",
                    Figures = [portfolio.VariableIncomeWeight]
                });
            }

            if (portfolio.WorstQuarterChange is { } worst && portfolio.WorstQuarterLabel is { } label)
            {
                paragraphs.Add(new InsightModelParagraphDto
                {
                    Text = $"Mantida a composição atual, a maior queda trimestral observada seria " +
                           $"de {worst}, no {label}.",
                    Figures = [worst]
                });
            }

            return new InsightModelOutputDto
            {
                Headline = "Retrato da sua carteira",
                Paragraphs = paragraphs
            };
        }

        private static InsightModelOutputDto Empty() => new()
        {
            Headline = "Sem dados suficientes",
            Paragraphs =
            [
                new InsightModelParagraphDto
                {
                    Text = "Ainda não há lançamentos suficientes para comparar este período com o seu histórico."
                }
            ]
        };
    }
}
