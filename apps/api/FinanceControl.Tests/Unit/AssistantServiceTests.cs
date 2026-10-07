using FinanceControl.Data.Data;
using FinanceControl.Domain.Entities;
using FinanceControl.Services.Ai;
using FinanceControl.Services.Ai.Tools;
using FinanceControl.Services.Services;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace FinanceControl.Tests.Unit
{
    /// <summary>
    /// The entitlement checks run before anything is read for the model: a user who is not
    /// allowed gets a status and nothing is stored, nothing is sent.
    /// </summary>
    public class AssistantServiceTests
    {
        private static (AssistantService Service, ApplicationDbContext Context) Create(
            EnumUserPlan plan,
            bool aiEnabled,
            bool configured,
            int monthlyLimit = 200)
        {
            var context = DbContextHelper.CreateInMemory();
            context.Users.Add(new User { Id = 1, Email = "a@b.com", Name = "Ana", PasswordHash = "x", Plan = plan, AiEnabled = aiEnabled });
            context.SaveChanges();

            var settings = Options.Create(new AnthropicSettings
            {
                Enabled = configured,
                ApiKey = configured ? "test-key" : string.Empty,
                MonthlyChatMessagesPerUser = monthlyLimit
            });

            var client = new ClaudeClient(settings, NullLogger<ClaudeClient>.Instance);
            var policy = new AiAccessPolicy(context, client);
            var registry = new AiToolRegistry(NullLogger<AiToolRegistry>.Instance);

            var service = new AssistantService(context, client, policy, registry, new EmptyServiceProvider(), settings,
                NullLogger<AssistantService>.Instance);

            return (service, context);
        }

        private static SendAssistantMessageRequestDto Question => new() { Message = "Quanto gastei com mercado?" };

        [Fact]
        public async Task FreePlan_GetsNotPremium_AndNothingIsStored()
        {
            var (service, context) = Create(EnumUserPlan.Free, aiEnabled: true, configured: true);

            var result = await service.SendMessageAsync(Question, 1);

            Assert.Equal(EnumAiAvailability.NotPremium, result.Value!.Status);
            Assert.Empty(context.AiConversations);
            Assert.Empty(context.AiMessages);
        }

        [Fact]
        public async Task AiSwitchedOff_GetsAiDisabled_AndNothingIsStored()
        {
            var (service, context) = Create(EnumUserPlan.Premium, aiEnabled: false, configured: true);

            var result = await service.SendMessageAsync(Question, 1);

            Assert.Equal(EnumAiAvailability.AiDisabled, result.Value!.Status);
            Assert.Empty(context.AiMessages);
        }

        [Fact]
        public async Task IntegrationOff_GetsUnavailable()
        {
            var (service, context) = Create(EnumUserPlan.Premium, aiEnabled: true, configured: false);

            var result = await service.SendMessageAsync(Question, 1);

            Assert.Equal(EnumAiAvailability.Unavailable, result.Value!.Status);
            Assert.Empty(context.AiMessages);
        }

        [Fact]
        public async Task MonthlyLimitReached_GetsQuotaExceeded()
        {
            var (service, context) = Create(EnumUserPlan.Premium, aiEnabled: true, configured: true, monthlyLimit: 2);
            for (var i = 0; i < 2; i++)
            {
                context.AiGenerationLogs.Add(new AiGenerationLog
                {
                    UserId = 1,
                    Feature = EnumAiFeature.Chat,
                    Outcome = EnumAiOutcome.Delivered,
                    Model = "m",
                    CreatedAt = DateTime.UtcNow
                });
            }
            context.SaveChanges();

            var result = await service.SendMessageAsync(Question, 1);

            Assert.Equal(EnumAiAvailability.QuotaExceeded, result.Value!.Status);
            Assert.Equal(2, result.Value.MessagesUsed);
            Assert.Empty(context.AiMessages);
        }

        [Fact]
        public async Task ConfirmingAnotherUsersAction_IsRefused()
        {
            var (service, context) = Create(EnumUserPlan.Premium, aiEnabled: true, configured: true);
            context.Users.Add(new User { Id = 2, Email = "c@d.com", Name = "Bia", PasswordHash = "x" });
            var conversation = new AiConversation { UserId = 2, Title = "t", LastMessageAt = DateTime.UtcNow };
            context.AiConversations.Add(conversation);
            context.SaveChanges();
            var action = new AiPendingAction
            {
                UserId = 2,
                ConversationId = conversation.Id,
                Kind = EnumAiActionKind.CreateGoal,
                Payload = "{}",
                ExpiresAt = DateTime.UtcNow.AddMinutes(10)
            };
            context.AiPendingActions.Add(action);
            context.SaveChanges();

            var result = await service.ConfirmActionAsync(action.Id, new ConfirmAiActionRequestDto(), userId: 1);

            Assert.True(result.IsFailure);
            Assert.Equal(EnumAiActionStatus.Pending, context.AiPendingActions.Single().Status);
        }

        [Fact]
        public async Task ExpiredAction_CannotBeConfirmed()
        {
            var (service, context) = Create(EnumUserPlan.Premium, aiEnabled: true, configured: true);
            var conversation = new AiConversation { UserId = 1, Title = "t", LastMessageAt = DateTime.UtcNow };
            context.AiConversations.Add(conversation);
            context.SaveChanges();
            var action = new AiPendingAction
            {
                UserId = 1,
                ConversationId = conversation.Id,
                Kind = EnumAiActionKind.CreateGoal,
                Payload = "{}",
                ExpiresAt = DateTime.UtcNow.AddMinutes(-1)
            };
            context.AiPendingActions.Add(action);
            context.SaveChanges();

            var result = await service.ConfirmActionAsync(action.Id, new ConfirmAiActionRequestDto(), userId: 1);

            Assert.True(result.IsFailure);
            Assert.Equal(EnumAiActionStatus.Expired, context.AiPendingActions.Single().Status);
        }

        private sealed class EmptyServiceProvider : IServiceProvider
        {
            public object? GetService(Type serviceType) => null;
        }
    }
}
