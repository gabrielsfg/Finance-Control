using System.Text.Json;
using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Domain.Interfaces.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceControl.Services.Ai.Tools
{
    /// <summary>
    /// The chat's only way to change data: each tool validates a request exactly as the
    /// REST endpoint would and stores it as an <see cref="AiPendingAction"/>. Nothing is
    /// written until the user presses Confirm on the card. There is no delete tool.
    /// </summary>
    internal static class ProposalTools
    {
        public const string Scope = "chat:propose";

        /// <summary>How long a card stays confirmable. Long enough to read it, short enough not to confirm stale data.</summary>
        public static readonly TimeSpan ProposalLifetime = TimeSpan.FromMinutes(30);

        public static readonly JsonSerializerOptions PayloadSerializerOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
        };

        private const string ConfirmationNote =
            "Nothing is saved yet: the user sees a confirmation card and must press Confirm. " +
            "After calling it, tell the user briefly what you prepared and ask them to review the card.";

        public static IEnumerable<AiTool> Create()
        {
            yield return new AiTool(
                "propose_transaction",
                "Prepares a new transaction (mode 'create') or an edit to an existing one (mode 'update', with " +
                "transactionId from search_transactions). Look up accountId with list_accounts and subCategoryId with " +
                "list_categories first; never guess ids. Value is a positive integer in cents. For an update, send only " +
                "the fields that change. " + ConfirmationNote,
                """
                {
                  "type": "object",
                  "properties": {
                    "mode": { "type": "string", "enum": ["create", "update"] },
                    "transactionId": { "type": "integer" },
                    "description": { "type": "string" },
                    "value": { "type": "integer", "description": "Positive, in cents." },
                    "type": { "type": "string", "enum": ["Expense", "Income", "Transfer"] },
                    "date": { "type": "string", "description": "YYYY-MM-DD. Default for create: today." },
                    "accountId": { "type": "integer", "description": "Default for create: the user's default account." },
                    "destinationAccountId": { "type": "integer", "description": "Transfers only." },
                    "subCategoryId": { "type": "integer" },
                    "paymentMethod": { "type": "string", "enum": ["Debit", "Credit"] },
                    "totalInstallments": { "type": "integer", "minimum": 2 },
                    "tags": { "type": "array", "items": { "type": "string" } },
                    "includeInBudget": { "type": "boolean", "description": "Default true." }
                  },
                  "required": ["mode"],
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: true,
                ProposeTransactionAsync);

            yield return new AiTool(
                "propose_goal",
                "Prepares a new goal. Type 'Item' is something to buy, 'Investment' a sum to accumulate. targetAmount is " +
                "in cents. " + ConfirmationNote,
                """
                {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "description": { "type": "string" },
                    "type": { "type": "string", "enum": ["Item", "Investment"] },
                    "targetAmount": { "type": "integer", "description": "Cents." },
                    "targetDate": { "type": "string", "description": "YYYY-MM-DD." },
                    "priority": { "type": "string", "enum": ["Low", "Medium", "High"] }
                  },
                  "required": ["name", "type", "targetAmount", "targetDate"],
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: true,
                ProposeGoalAsync);

            yield return new AiTool(
                "propose_budget",
                "Prepares a new budget: a name, the day of the month its period starts (1-31), a recurrence, and areas " +
                "that group subcategory allocations with an expected value in cents. Use list_categories for the " +
                "subCategoryIds and summarize_transactions to base expected values on real spending when the user asks. " +
                ConfirmationNote,
                """
                {
                  "type": "object",
                  "properties": {
                    "name": { "type": "string" },
                    "startDay": { "type": "integer", "minimum": 1, "maximum": 31 },
                    "recurrence": { "type": "string", "enum": ["Weekly", "Biweekly", "Monthly", "Semiannually", "Annually"] },
                    "isActive": { "type": "boolean", "description": "Default true." },
                    "areas": {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          "name": { "type": "string" },
                          "allocations": {
                            "type": "array",
                            "items": {
                              "type": "object",
                              "properties": {
                                "subCategoryId": { "type": "integer" },
                                "expectedValue": { "type": "integer", "description": "Cents." },
                                "allocationType": { "type": "string", "enum": ["Expense", "Income"] }
                              },
                              "required": ["subCategoryId", "expectedValue", "allocationType"],
                              "additionalProperties": false
                            }
                          }
                        },
                        "required": ["name", "allocations"],
                        "additionalProperties": false
                      }
                    }
                  },
                  "required": ["name", "startDay", "recurrence", "areas"],
                  "additionalProperties": false
                }
                """,
                Scope,
                IsProposal: true,
                ProposeBudgetAsync);
        }

        private static async Task<object> ProposeTransactionAsync(AiToolContext context, AiToolArguments args)
        {
            var conversationId = RequireConversation(context);
            var services = context.Services;
            var mode = args.RequireString("mode");

            if (mode == "update")
            {
                var transactionId = args.RequireInt("transactionId");
                var existing = await services.GetRequiredService<ITransactionService>()
                    .GetTransactionByIdAsync(transactionId, context.UserId)
                    ?? throw new AiToolException($"Transaction {transactionId} was not found.");

                var update = new UpdateTransactionRequestDto
                {
                    Description = args.GetString("description") ?? existing.Description,
                    Value = args.GetInt("value") ?? existing.Value,
                    Type = args.GetEnum<EnumTransactionType>("type") ?? existing.Type,
                    TransactionDate = args.GetDate("date") ?? existing.TransactionDate,
                    AccountId = args.GetInt("accountId") ?? existing.AccountId,
                    DestinationAccountId = args.GetInt("destinationAccountId") ?? existing.DestinationAccountId,
                    SubCategoryId = args.GetInt("subCategoryId") ?? existing.SubCategoryId,
                    PaymentType = existing.PaymentType,
                    PaymentMethod = args.GetEnum<EnumPaymentMethod>("paymentMethod") ?? existing.PaymentMethod,
                    TotalInstallments = existing.TotalInstallments,
                    IncludeInBudget = args.GetBool("includeInBudget") ?? existing.BudgetId is not null,
                    Tags = args.GetStringList("tags") ?? existing.Tags.Select(t => t.Name).ToList()
                };

                await ValidateAsync(services, update);
                await EnsureOwnedAsync(services, context.UserId, update.AccountId, update.DestinationAccountId, update.SubCategoryId, update.Type);

                return await StoreAsync(context, conversationId, EnumAiActionKind.UpdateTransaction, update, transactionId);
            }

            if (mode != "create")
                throw new AiToolException("'mode' must be 'create' or 'update'.");

            var accountId = args.GetInt("accountId") ?? await DefaultAccountIdAsync(services, context.UserId);
            var totalInstallments = args.GetInt("totalInstallments");

            var create = new CreateTransactionRequestDto
            {
                Description = args.RequireString("description"),
                Value = args.RequireInt("value"),
                Type = args.GetEnum<EnumTransactionType>("type") ?? EnumTransactionType.Expense,
                TransactionDate = args.GetDate("date") ?? DateOnly.FromDateTime(DateTime.UtcNow),
                AccountId = accountId,
                DestinationAccountId = args.GetInt("destinationAccountId"),
                SubCategoryId = args.GetInt("subCategoryId") ?? 0,
                PaymentType = totalInstallments is > 1 ? EnumPaymentType.Installment : EnumPaymentType.OneTime,
                PaymentMethod = args.GetEnum<EnumPaymentMethod>("paymentMethod"),
                TotalInstallments = totalInstallments is > 1 ? totalInstallments : null,
                IncludeInBudget = args.GetBool("includeInBudget") ?? true,
                Tags = args.GetStringList("tags")
            };

            await ValidateAsync(services, create);
            await EnsureOwnedAsync(services, context.UserId, create.AccountId, create.DestinationAccountId, create.SubCategoryId, create.Type);

            return await StoreAsync(context, conversationId, EnumAiActionKind.CreateTransaction, create, targetId: null);
        }

        private static async Task<object> ProposeGoalAsync(AiToolContext context, AiToolArguments args)
        {
            var conversationId = RequireConversation(context);

            var goal = new CreateGoalRequestDto
            {
                Name = args.RequireString("name"),
                Description = args.GetString("description"),
                Type = args.GetEnum<EnumGoalType>("type") ?? throw new AiToolException("'type' is required."),
                TargetAmount = args.RequireInt("targetAmount"),
                TargetDate = args.GetDate("targetDate") ?? throw new AiToolException("'targetDate' is required."),
                Priority = args.GetEnum<EnumGoalPriority>("priority") ?? EnumGoalPriority.Medium
            };

            await ValidateAsync(context.Services, goal);

            return await StoreAsync(context, conversationId, EnumAiActionKind.CreateGoal, goal, targetId: null);
        }

        private static async Task<object> ProposeBudgetAsync(AiToolContext context, AiToolArguments args)
        {
            var conversationId = RequireConversation(context);

            var areasElement = args.GetElement("areas") ?? throw new AiToolException("'areas' is required.");
            List<CreateAreaInBudgetDto> areas;
            try
            {
                areas = areasElement.Deserialize<List<CreateAreaInBudgetDto>>(PayloadSerializerOptions) ?? [];
            }
            catch (JsonException)
            {
                throw new AiToolException("'areas' does not match the schema.");
            }

            var budget = new CreateBudgetRequestDto
            {
                Name = args.RequireString("name"),
                StartDate = args.RequireInt("startDay"),
                Recurrence = args.GetEnum<EnumBudgetRecurrence>("recurrence") ?? throw new AiToolException("'recurrence' is required."),
                IsActive = args.GetBool("isActive") ?? true,
                Areas = areas
            };

            await ValidateAsync(context.Services, budget);

            var subCategoryIds = areas.SelectMany(a => a.Allocations).Select(a => a.SubCategoryId).Distinct().ToList();
            var db = context.Services.GetRequiredService<ApplicationDbContext>();
            var owned = await db.SubCategories.CountAsync(s => s.UserId == context.UserId && subCategoryIds.Contains(s.Id));
            if (owned != subCategoryIds.Count)
                throw new AiToolException("Some subCategoryId does not belong to the user. Check list_categories.");

            return await StoreAsync(context, conversationId, EnumAiActionKind.CreateBudget, budget, targetId: null);
        }

        private static int RequireConversation(AiToolContext context) =>
            context.ConversationId ?? throw new AiToolException("Proposals are only available inside the app chat.");

        private static async Task ValidateAsync<T>(IServiceProvider services, T request)
        {
            var validator = services.GetService<IValidator<T>>();
            if (validator is null)
                return;

            var result = await validator.ValidateAsync(request);
            if (!result.IsValid)
                throw new AiToolException("Invalid proposal: " + string.Join(" ", result.Errors.Select(e => e.ErrorMessage)));
        }

        private static async Task EnsureOwnedAsync(
            IServiceProvider services,
            int userId,
            int accountId,
            int? destinationAccountId,
            int subCategoryId,
            EnumTransactionType type)
        {
            var db = services.GetRequiredService<ApplicationDbContext>();

            if (!await db.Accounts.AnyAsync(a => a.Id == accountId && a.UserId == userId))
                throw new AiToolException($"Account {accountId} was not found. Check list_accounts.");

            if (destinationAccountId is { } destination && !await db.Accounts.AnyAsync(a => a.Id == destination && a.UserId == userId))
                throw new AiToolException($"Account {destination} was not found. Check list_accounts.");

            if (type != EnumTransactionType.Transfer && !await db.SubCategories.AnyAsync(s => s.Id == subCategoryId && s.UserId == userId))
                throw new AiToolException($"Subcategory {subCategoryId} was not found. Check list_categories.");
        }

        private static async Task<int> DefaultAccountIdAsync(IServiceProvider services, int userId)
        {
            var db = services.GetRequiredService<ApplicationDbContext>();
            var account = await db.Accounts
                .AsNoTracking()
                .Where(a => a.UserId == userId && !a.IsSystem)
                .OrderByDescending(a => a.IsDefaultAccount)
                .Select(a => (int?)a.Id)
                .FirstOrDefaultAsync();

            return account ?? throw new AiToolException("The user has no account yet. Ask them to create one in the app.");
        }

        private static async Task<object> StoreAsync<T>(
            AiToolContext context,
            int conversationId,
            EnumAiActionKind kind,
            T payload,
            int? targetId)
        {
            var db = context.Services.GetRequiredService<ApplicationDbContext>();

            var action = new AiPendingAction
            {
                UserId = context.UserId,
                ConversationId = conversationId,
                Kind = kind,
                Payload = JsonSerializer.Serialize(payload, PayloadSerializerOptions),
                TargetId = targetId,
                Status = EnumAiActionStatus.Pending,
                ExpiresAt = DateTime.UtcNow.Add(ProposalLifetime)
            };

            db.AiPendingActions.Add(action);
            await db.SaveChangesAsync(context.CancellationToken);

            return new
            {
                ActionId = action.Id,
                Status = "awaiting_user_confirmation",
                Kind = kind,
                Proposal = payload
            };
        }
    }
}
