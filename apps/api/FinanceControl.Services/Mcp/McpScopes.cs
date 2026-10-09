using FinanceControl.Shared.Dtos.Response;

namespace FinanceControl.Services.Mcp
{
    /// <summary>
    /// The OAuth scopes of the MCP server, each matching the Scope of a group of read-only
    /// tools in the AiToolRegistry. There is no write scope: the MCP server cannot change
    /// data in this version.
    /// </summary>
    public static class McpScopes
    {
        public const string Finance = "finance:read";
        public const string Transactions = "transactions:read";
        public const string Investments = "investments:read";
        public const string Analytics = "analytics:read";
        public const string Market = "market:read";

        /// <summary>Descriptions shown on the consent page, in the user's language.</summary>
        private static readonly (string Name, string Description)[] Definitions =
        [
            (Finance, "Contas, saldos, categorias, tags, orçamentos, metas e recorrências"),
            (Transactions, "Transações: descrições, valores, datas, categorias e totais"),
            (Investments, "Carteira de investimentos, rentabilidade e proventos"),
            (Analytics, "Evolução do patrimônio, projeções e simulações"),
            (Market, "Cotações e indicadores de mercado acompanhados pelo app")
        ];

        public static IReadOnlyList<string> All { get; } = Definitions.Select(d => d.Name).ToList();

        public static bool IsKnown(string scope) => All.Contains(scope);

        public static string Describe(string scope) =>
            Definitions.FirstOrDefault(d => d.Name == scope).Description ?? scope;

        public static List<McpScopeResponseDto> ToResponse(IEnumerable<string> scopes) =>
            scopes.Where(IsKnown)
                .Select(s => new McpScopeResponseDto { Name = s, Description = Describe(s) })
                .ToList();

        /// <summary>Known scopes out of a space-separated request; an empty request means all of them.</summary>
        public static List<string> Parse(string? requested)
        {
            if (string.IsNullOrWhiteSpace(requested))
                return All.ToList();

            var scopes = requested.Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(IsKnown)
                .Distinct()
                .ToList();

            // A client that asked only for scopes this server does not know (openid,
            // offline_access...) still gets a usable connection instead of an empty one.
            return scopes.Count == 0 ? All.ToList() : scopes;
        }

        public static string Join(IEnumerable<string> scopes) => string.Join(' ', scopes);

        public static List<string> Split(string scopes) =>
            scopes.Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();
    }
}
