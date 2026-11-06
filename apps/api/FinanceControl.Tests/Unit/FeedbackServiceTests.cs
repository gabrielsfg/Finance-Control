using FinanceControl.Domain.Entities;
using FinanceControl.Services.Services;
using FinanceControl.Services.Validations;
using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FinanceControl.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace FinanceControl.Tests.Unit
{
    public class FeedbackServiceTests
    {
        private readonly CreateFeedbackValidator _validator = new();

        private static CreateFeedbackRequestDto ValidRequest() => new()
        {
            Type = EnumFeedbackType.Bug,
            Title = "O saldo da conta não atualiza",
            Description = "Depois de importar o extrato o saldo continua o mesmo.",
            Source = "mobile"
        };

        [Fact]
        public async Task Create_StoresTheReportAsNew()
        {
            await using var context = DbContextHelper.CreateInMemory();
            var service = new FeedbackService(context);

            var result = await service.CreateFeedbackAsync(ValidRequest(), userId: 7);

            Assert.True(result.IsSuccess);
            Assert.Equal(EnumFeedbackStatus.New, result.Value!.Status);

            var stored = await context.UserFeedbacks.SingleAsync();
            Assert.Equal(7, stored.UserId);
            Assert.Equal(EnumFeedbackType.Bug, stored.Type);
            Assert.Equal("mobile", stored.Source);
        }

        [Fact]
        public async Task Create_TrimsTitleAndDescription()
        {
            await using var context = DbContextHelper.CreateInMemory();
            var service = new FeedbackService(context);

            var request = ValidRequest();
            request.Title = "  Título com espaços  ";
            request.Description = "   ";

            await service.CreateFeedbackAsync(request, userId: 1);

            var stored = await context.UserFeedbacks.SingleAsync();
            Assert.Equal("Título com espaços", stored.Title);
            // A description of only whitespace is nothing, not an empty string.
            Assert.Null(stored.Description);
        }

        [Fact]
        public async Task Create_DropsAnUnknownSource()
        {
            await using var context = DbContextHelper.CreateInMemory();
            var service = new FeedbackService(context);

            var request = ValidRequest();
            request.Source = "curl";

            await service.CreateFeedbackAsync(request, userId: 1);

            var stored = await context.UserFeedbacks.SingleAsync();
            Assert.Null(stored.Source);
        }

        [Fact]
        public async Task Create_BlankTitleFails()
        {
            await using var context = DbContextHelper.CreateInMemory();
            var service = new FeedbackService(context);

            var request = ValidRequest();
            request.Title = "   ";

            var result = await service.CreateFeedbackAsync(request, userId: 1);

            Assert.True(result.IsFailure);
            Assert.Empty(context.UserFeedbacks);
        }

        [Fact]
        public void Validator_AcceptsAValidRequest()
            => Assert.True(_validator.Validate(ValidRequest()).IsValid);

        [Fact]
        public void Validator_RejectsAShortTitle()
        {
            var request = ValidRequest();
            request.Title = "ab";
            Assert.False(_validator.Validate(request).IsValid);
        }

        [Fact]
        public void Validator_RejectsATitleOverTheLimit()
        {
            var request = ValidRequest();
            request.Title = new string('a', 121);
            Assert.False(_validator.Validate(request).IsValid);
        }

        [Fact]
        public void Validator_RejectsADescriptionOverTheLimit()
        {
            var request = ValidRequest();
            request.Description = new string('a', 2001);
            Assert.False(_validator.Validate(request).IsValid);
        }

        private static async Task<int> SeedAssistantMessageAsync(FinanceControl.Data.Data.ApplicationDbContext context, int userId)
        {
            var conversation = new AiConversation { UserId = userId, Title = "Gastos" };
            context.AiConversations.Add(conversation);
            await context.SaveChangesAsync();

            var message = new AiMessage
            {
                UserId = userId,
                ConversationId = conversation.Id,
                Role = EnumAiMessageRole.Assistant,
                Content = "Você gastou R$ 100,00."
            };
            context.AiMessages.Add(message);
            await context.SaveChangesAsync();
            return message.Id;
        }

        [Fact]
        public async Task Create_AiContentReport_StoresTheReferenceWithADefaultTitle()
        {
            await using var context = DbContextHelper.CreateInMemory();
            var messageId = await SeedAssistantMessageAsync(context, userId: 3);
            var service = new FeedbackService(context);

            var request = new CreateFeedbackRequestDto { Type = EnumFeedbackType.AiContent, AiMessageId = messageId, Source = "web" };
            Assert.True(_validator.Validate(request).IsValid);

            var result = await service.CreateFeedbackAsync(request, userId: 3);

            Assert.True(result.IsSuccess);
            var stored = await context.UserFeedbacks.SingleAsync();
            Assert.Equal(EnumFeedbackType.AiContent, stored.Type);
            Assert.Equal(messageId, stored.AiMessageId);
            Assert.Null(stored.AiInsightId);
            Assert.False(string.IsNullOrWhiteSpace(stored.Title));
        }

        [Fact]
        public async Task Create_AiContentReport_OnAnotherUsersMessageFails()
        {
            await using var context = DbContextHelper.CreateInMemory();
            var messageId = await SeedAssistantMessageAsync(context, userId: 3);
            var service = new FeedbackService(context);

            var request = new CreateFeedbackRequestDto { Type = EnumFeedbackType.AiContent, AiMessageId = messageId };
            var result = await service.CreateFeedbackAsync(request, userId: 4);

            Assert.True(result.IsFailure);
            Assert.Empty(context.UserFeedbacks);
        }

        [Fact]
        public void Validator_RejectsAnAiContentReportWithoutReference()
        {
            var request = new CreateFeedbackRequestDto { Type = EnumFeedbackType.AiContent };
            Assert.False(_validator.Validate(request).IsValid);
        }

        [Fact]
        public void Validator_RejectsAnAiContentReportWithBothReferences()
        {
            var request = new CreateFeedbackRequestDto { Type = EnumFeedbackType.AiContent, AiMessageId = 1, AiInsightId = 2 };
            Assert.False(_validator.Validate(request).IsValid);
        }

        [Fact]
        public void Validator_RejectsAReferenceOnABugReport()
        {
            var request = ValidRequest();
            request.AiMessageId = 1;
            Assert.False(_validator.Validate(request).IsValid);
        }

        [Fact]
        public void Validator_AcceptsAMissingDescription()
        {
            var request = ValidRequest();
            request.Description = null;
            Assert.True(_validator.Validate(request).IsValid);
        }
    }
}
