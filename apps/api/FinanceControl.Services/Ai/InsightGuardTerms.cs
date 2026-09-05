namespace FinanceControl.Services.Ai
{
    /// <summary>
    /// The vocabulary the generated text may not contain.
    /// </summary>
    /// <remarks>
    /// Matched against text that has been lowercased and stripped of diacritics, so each
    /// term is written here without accents and in lowercase. Every entry has a test in
    /// InsightOutputGuardTests — when the prompt wording is tuned, those tests are what
    /// still holds the line.
    /// <para>
    /// Two families. Recommendation verbs are the obvious one. Adequacy adjectives matter
    /// just as much: "esse ativo faz sentido para voce" recommends without a single verb
    /// from the first list, and is the exact phrasing the product promised not to produce.
    /// </para>
    /// </remarks>
    public static class InsightGuardTerms
    {
        /// <summary>Advising an action on a financial product.</summary>
        public static readonly string[] RecommendationTerms =
        [
            "compre", "comprar", "compra de", "comprando",
            "venda", "vender", "vendendo",
            "invista", "investir em", "investimento em",
            "aporte em", "aportar em", "aporte adicional",
            "resgate", "resgatar",
            "migre", "migrar para", "realoque", "realocar",
            "recomendo", "recomendamos", "recomendacao", "recomendavel",
            "sugiro", "sugerimos", "sugestao de",
            "considere", "avalie", "procure", "busque",
            "diversifique", "diversificar", "rebalanceie", "rebalancear",
            "voce deveria", "voce precisa", "voce tem que", "o ideal seria"
        ];

        /// <summary>Judging fit between a person and a product, in any phrasing.</summary>
        public static readonly string[] AdequacyTerms =
        [
            "adequado", "adequada", "inadequado", "inadequada",
            "indicado", "indicada", "contraindicado",
            "ideal para", "ideal seria",
            "faz sentido", "nao faz sentido",
            "combina com", "alinhado ao seu", "alinhada ao seu",
            "vale a pena", "nao vale a pena",
            "melhor opcao", "melhor escolha", "melhor alternativa",
            "mais vantajoso", "mais vantajosa", "menos vantajoso",
            "boa opcao", "ma opcao", "bom investimento", "mau investimento",
            "seguro para voce", "arriscado para voce",
            "deveria ter", "falta na sua carteira", "esta faltando"
        ];

        /// <summary>
        /// Subjects outside the user's own finances inside this app. The prompt already
        /// forbids them; this is what catches it when the prompt does not hold.
        /// </summary>
        public static readonly string[] OutOfScopeTerms =
        [
            "como assistente", "como modelo de linguagem", "nao posso ajudar",
            "consulte um assessor", "procure um corretor",
            "taxa selic atual e", "o mercado deve", "a bolsa vai",
            "previsao do mercado", "tendencia do mercado", "cenario macroeconomico"
        ];
    }
}
