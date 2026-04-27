using FinanceControl.Shared.Dtos.Request;
using FluentValidation;
using System.Globalization;

namespace FinanceControl.Services.Validations
{
    public class UpdateUserPreferencesValidator : AbstractValidator<UpdateUserPreferencesRequestDto>
    {
        private static readonly HashSet<string> _validIsoCodes = new(
            CultureInfo.GetCultures(CultureTypes.SpecificCultures)
                .Select(c => new RegionInfo(c.Name).TwoLetterISORegionName)
                .Distinct(),
            StringComparer.OrdinalIgnoreCase);

        public UpdateUserPreferencesValidator()
        {
            RuleFor(x => x.Country)
                .Must(c => _validIsoCodes.Contains(c!))
                .WithMessage("Country must be a valid ISO 3166-1 alpha-2 code (e.g. BR, US).")
                .When(x => !string.IsNullOrWhiteSpace(x.Country));
        }
    }
}
