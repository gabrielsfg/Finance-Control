namespace FinanceControl.Shared.Helpers
{
    /// Brazilian CPF: strips the mask and checks the two verifier digits.
    public static class CpfHelper
    {
        public static string Normalize(string? cpf) =>
            new((cpf ?? string.Empty).Where(char.IsDigit).ToArray());

        public static bool IsValid(string? cpf)
        {
            var digits = Normalize(cpf);
            if (digits.Length != 11)
                return false;

            // 000.000.000-00, 111.111.111-11... pass the digit check but are not real CPFs.
            if (digits.Distinct().Count() == 1)
                return false;

            return digits[9] - '0' == VerifierDigit(digits, 9)
                && digits[10] - '0' == VerifierDigit(digits, 10);
        }

        private static int VerifierDigit(string digits, int length)
        {
            var sum = 0;
            for (var i = 0; i < length; i++)
                sum += (digits[i] - '0') * (length + 1 - i);

            var remainder = sum % 11;
            return remainder < 2 ? 0 : 11 - remainder;
        }
    }
}
