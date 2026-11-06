using FinanceControl.Shared.Dtos.Request;
using FinanceControl.Shared.Enums;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class CreateFeedbackValidator : AbstractValidator<CreateFeedbackRequestDto>
    {
        public CreateFeedbackValidator()
        {
            RuleFor(x => x.Type)
                .IsInEnum().WithMessage("Type must be Bug, Suggestion or AiContent.");

            // Bug reports and suggestions need a title; an AI content report is one tap on
            // an answer, so its title is optional and filled in by the service.
            When(x => x.Type != EnumFeedbackType.AiContent, () =>
            {
                RuleFor(x => x.Title)
                    .NotEmpty().WithMessage("Title is required.")
                    .MinimumLength(3).WithMessage("Title must be at least 3 characters.");

                RuleFor(x => x.AiMessageId)
                    .Null().WithMessage("AiMessageId is only allowed on AiContent reports.");

                RuleFor(x => x.AiInsightId)
                    .Null().WithMessage("AiInsightId is only allowed on AiContent reports.");
            });

            When(x => x.Type == EnumFeedbackType.AiContent, () =>
            {
                RuleFor(x => x)
                    .Must(x => (x.AiMessageId is not null) ^ (x.AiInsightId is not null))
                    .WithName("AiMessageId")
                    .WithMessage("An AiContent report must reference exactly one of AiMessageId or AiInsightId.");

                RuleFor(x => x.AiMessageId)
                    .GreaterThan(0).WithMessage("AiMessageId must be positive.")
                    .When(x => x.AiMessageId is not null);

                RuleFor(x => x.AiInsightId)
                    .GreaterThan(0).WithMessage("AiInsightId must be positive.")
                    .When(x => x.AiInsightId is not null);
            });

            RuleFor(x => x.Title)
                .MaximumLength(120).WithMessage("Title must be at most 120 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(2000).WithMessage("Description must be at most 2000 characters.");
        }
    }
}
