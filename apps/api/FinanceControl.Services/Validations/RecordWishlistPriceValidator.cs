using FinanceControl.Shared.Dtos.Request;
using FluentValidation;

namespace FinanceControl.Services.Validations
{
    public class RecordWishlistPriceValidator : AbstractValidator<RecordWishlistPriceRequestDto>
    {
        public RecordWishlistPriceValidator()
        {
            RuleFor(x => x.Price)
                .GreaterThan(0).WithMessage("Price must be greater than zero.");
        }
    }
}
