using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class SendAssistantMessageValidator : AbstractValidator<SendAssistantMessageRequestDto>
    {
        /// <summary>Long enough for a detailed question, short enough that one message cannot carry a statement dump.</summary>
        public const int MaxMessageLength = 2000;

        public SendAssistantMessageValidator()
        {
            RuleFor(x => x.Message)
                .NotEmpty().WithMessage("Message is required.")
                .MaximumLength(MaxMessageLength).WithMessage($"Message must be at most {MaxMessageLength} characters.");

            RuleFor(x => x.ConversationId)
                .GreaterThan(0).WithMessage("ConversationId must be greater than 0.")
                .When(x => x.ConversationId.HasValue);
        }
    }
}
