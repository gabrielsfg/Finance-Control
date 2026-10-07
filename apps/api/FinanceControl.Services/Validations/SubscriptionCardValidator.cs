using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    /// <summary>Shape checks on the card before it reaches Asaas.</summary>
    /// <remarks>
    /// Messages never interpolate the value ({PropertyValue}): a validation error ends up
    /// in the response body and possibly in logs, and must not carry the card number back.
    /// </remarks>
    public class SubscriptionCardValidator : AbstractValidator<SubscriptionCardRequestDto>
    {
        public SubscriptionCardValidator()
        {
            RuleFor(x => x.HolderName)
                .NotEmpty().WithMessage("Card holder name is required.")
                .MaximumLength(100).WithMessage("Card holder name must be at most 100 characters.");

            RuleFor(x => x.Number)
                .Must(BeAValidCardNumber).WithMessage("Card number is invalid.");

            RuleFor(x => x.ExpiryMonth)
                .Must(m => int.TryParse(m, out var month) && month is >= 1 and <= 12)
                .WithMessage("Expiry month is invalid.");

            RuleFor(x => x)
                .Must(NotBeExpired).WithMessage("Card is expired.")
                .WithName("ExpiryYear");

            RuleFor(x => x.Cvv)
                .Must(c => c is { Length: 3 or 4 } && c.All(char.IsDigit))
                .WithMessage("Security code is invalid.");
        }

        private static bool BeAValidCardNumber(string? number)
        {
            var digits = new string((number ?? string.Empty).Where(c => !char.IsWhiteSpace(c) && c != '-').ToArray());
            if (digits.Length is < 13 or > 19 || !digits.All(char.IsDigit))
                return false;

            // Luhn: catches a mistyped digit before a round trip to the acquirer.
            var sum = 0;
            var doubleIt = false;
            for (var i = digits.Length - 1; i >= 0; i--)
            {
                var digit = digits[i] - '0';
                if (doubleIt)
                {
                    digit *= 2;
                    if (digit > 9)
                        digit -= 9;
                }
                sum += digit;
                doubleIt = !doubleIt;
            }
            return sum % 10 == 0;
        }

        private static bool NotBeExpired(SubscriptionCardRequestDto card)
        {
            if (!int.TryParse(card.ExpiryMonth, out var month) || month is < 1 or > 12)
                return true; // reported by the month rule
            if (!int.TryParse(card.ExpiryYear, out var year))
                return false;
            if (year < 100)
                year += 2000;

            var now = DateTime.UtcNow;
            return year > now.Year || (year == now.Year && month >= now.Month);
        }
    }
}
