using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class AcceptLegalDocumentsValidator : AbstractValidator<AcceptLegalDocumentsRequestDto>
    {
        public AcceptLegalDocumentsValidator()
        {
            RuleFor(x => x.Documents)
                .NotEmpty().WithMessage("At least one document is required.")
                .Must(documents => documents.Count <= 20).WithMessage("Too many documents.")
                .Must(documents => documents.Select(d => d.Type).Distinct().Count() == documents.Count)
                .WithMessage("Each document type can be accepted only once per request.");

            RuleForEach(x => x.Documents).ChildRules(document =>
            {
                document.RuleFor(d => d.Type).IsInEnum().WithMessage("Unknown document type.");
                document.RuleFor(d => d.Version).GreaterThan(0).WithMessage("Version must be a positive number.");
            });
        }
    }
}
