using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Ai
{
    public record ImportCategorizationInput(string Description, int Value, EnumTransactionType Type);
}
