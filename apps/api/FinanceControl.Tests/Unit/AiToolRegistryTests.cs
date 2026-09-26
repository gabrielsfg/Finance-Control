using System.Text.Json;
using FinanceControl.Services.Ai.Tools;
using FinanceControl.Services.Mcp;
using Microsoft.Extensions.Logging.Abstractions;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// The catalog is shared by the chat and the MCP server; these invariants keep one from
    /// silently breaking the other.
    /// </summary>
    public class AiToolRegistryTests
    {
        private readonly AiToolRegistry _registry = new(NullLogger<AiToolRegistry>.Instance);

        [Fact]
        public void EveryToolHasAValidObjectSchema()
        {
            foreach (var tool in _registry.All)
            {
                using var schema = JsonDocument.Parse(tool.InputSchemaJson);
                Assert.Equal("object", schema.RootElement.GetProperty("type").GetString());
                Assert.False(string.IsNullOrWhiteSpace(tool.Description), tool.Name);
            }
        }

        [Fact]
        public void McpExposesNoProposalTool()
        {
            Assert.DoesNotContain(_registry.ReadOnly, t => t.IsProposal);
            Assert.DoesNotContain(_registry.ReadOnly, t => t.Name.StartsWith("propose_"));
        }

        [Fact]
        public void EveryReadOnlyToolBelongsToAKnownMcpScope()
        {
            foreach (var tool in _registry.ReadOnly)
                Assert.True(McpScopes.IsKnown(tool.Scope), $"{tool.Name} has unknown scope {tool.Scope}");
        }

        [Fact]
        public void NoToolCanDeleteData()
        {
            Assert.DoesNotContain(_registry.All, t => t.Name.Contains("delete") || t.Name.Contains("remove"));
        }

        [Fact]
        public void CatalogHasTheAgreedTools()
        {
            var expected = new[]
            {
                "get_overview", "list_accounts", "list_categories", "list_tags", "search_transactions",
                "summarize_transactions", "get_budgets", "get_goals", "list_recurrences", "get_portfolio",
                "get_dividends", "get_investment_performance", "get_net_worth_history", "get_projections",
                "run_simulation", "get_market_data", "propose_transaction", "propose_goal", "propose_budget"
            };

            Assert.Equal(expected.OrderBy(n => n), _registry.All.Select(t => t.Name).OrderBy(n => n));
        }

        [Fact]
        public async Task ProposalOutsideTheChat_IsAnErrorResult()
        {
            var tool = _registry.Find("propose_goal")!;
            var context = new AiToolContext(1, ConversationId: null, new EmptyServiceProvider(), CancellationToken.None);

            var result = await _registry.ExecuteAsync(tool, AiToolArguments.FromJson("""{ "name": "Viagem" }"""), context);

            Assert.True(result.IsError);
        }

        private sealed class EmptyServiceProvider : IServiceProvider
        {
            public object? GetService(Type serviceType) => null;
        }
    }
}
