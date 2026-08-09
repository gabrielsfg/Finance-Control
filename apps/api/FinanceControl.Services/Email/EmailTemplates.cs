using System.Net;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Email
{
    /// <summary>
    /// Builds the transactional emails. Copy follows the user's <c>PreferredLanguage</c>,
    /// falling back to English for anything that is not pt-BR.
    /// </summary>
    /// <remarks>
    /// Styles are inline on purpose: Gmail and Outlook strip or ignore <c>&lt;style&gt;</c>
    /// blocks, so anything that matters has to travel on the element itself.
    /// </remarks>
    public static class EmailTemplates
    {
        private const string Cobalt = "#1F3CE0";
        private const string Ink = "#171F2E";
        private const string Muted = "#6B7280";
        private const string Paper = "#F5F3EE";

        public static (string Subject, string Html) BuildSecurityCode(
            EnumSecurityCodePurpose purpose,
            string code,
            string userName,
            string? language,
            int expiryMinutes)
        {
            var isPtBr = language is null || language.StartsWith("pt", StringComparison.OrdinalIgnoreCase);
            var name = WebUtility.HtmlEncode(userName);

            var (subject, heading, intro, warning) = purpose switch
            {
                EnumSecurityCodePurpose.AccountVerification => isPtBr
                    ? ("Confirme seu e-mail",
                       "Confirme seu e-mail",
                       $"Olá, {name}! Use o código abaixo para confirmar seu e-mail e ativar sua conta.",
                       "Se você não criou uma conta, pode ignorar esta mensagem.")
                    : ("Confirm your email",
                       "Confirm your email",
                       $"Hi {name}, use the code below to confirm your email and activate your account.",
                       "If you did not create an account, you can ignore this message."),

                EnumSecurityCodePurpose.PasswordReset => isPtBr
                    ? ("Redefinição de senha",
                       "Redefinir senha",
                       $"Olá, {name}! Use o código abaixo para cadastrar uma nova senha.",
                       "Se você não pediu para redefinir sua senha, ignore esta mensagem — sua senha atual continua válida.")
                    : ("Password reset",
                       "Reset your password",
                       $"Hi {name}, use the code below to set a new password.",
                       "If you did not ask for a password reset, ignore this message — your current password still works."),

                _ => isPtBr
                    ? ("Seu código de acesso",
                       "Código de acesso",
                       $"Olá, {name}! Use o código abaixo para concluir seu login.",
                       "Se não foi você que tentou entrar, troque sua senha o quanto antes.")
                    : ("Your login code",
                       "Login code",
                       $"Hi {name}, use the code below to finish signing in.",
                       "If this was not you, change your password as soon as possible.")
            };

            var expiryLine = isPtBr
                ? $"O código expira em {expiryMinutes} minutos e só pode ser usado uma vez."
                : $"The code expires in {expiryMinutes} minutes and can only be used once.";

            return (subject, Layout(heading, intro, code, expiryLine, warning));
        }

        private static string Layout(string heading, string intro, string code, string expiryLine, string warning) =>
            $"""
            <div style="margin:0;padding:32px 16px;background:{Paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:32px;">
                <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:{Cobalt};">Quantia</div>
                <h1 style="margin:16px 0 8px;font-size:22px;line-height:1.3;color:{Ink};">{heading}</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:{Ink};">{intro}</p>
                <div style="margin:0 0 20px;padding:20px;background:{Paper};border-radius:12px;text-align:center;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:32px;font-weight:700;letter-spacing:0.24em;color:{Ink};">{code}</div>
                <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:{Muted};">{expiryLine}</p>
                <p style="margin:0;padding-top:20px;border-top:1px solid #E7E3DA;font-size:13px;line-height:1.6;color:{Muted};">{warning}</p>
              </div>
            </div>
            """;
    }
}
