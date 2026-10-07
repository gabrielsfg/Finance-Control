using FinanceControl.Shared.Helpers;

namespace FinanceControl.Services.Validations
{
    /// The holder fields Asaas requires with every card, shared by signup and card update.
    internal static class BillingHolderRules
    {
        public static bool IsValidCpf(string? cpf) => CpfHelper.IsValid(cpf);

        public static bool IsValidMobilePhone(string? phone) =>
            Digits(phone).Length is 10 or 11;

        public static bool IsValidPostalCode(string? postalCode) =>
            Digits(postalCode).Length == 8;

        private static string Digits(string? value) =>
            new((value ?? string.Empty).Where(char.IsDigit).ToArray());
    }
}
