using System.Globalization;
using System.Net;
using FinanceControl.Services.Billing;
using FinanceControl.Shared.Enums;

namespace FinanceControl.Services.Email
{
    /// <summary>
    /// The subscription emails. We are the only sender — Asaas' own notifications are
    /// switched off — so these carry everything the consumer code asks of us: the amount,
    /// the date and a way to cancel.
    /// </summary>
    /// <remarks>Same inline-style layout and language fallback as <see cref="EmailTemplates"/>.</remarks>
    public static class BillingEmailTemplates
    {
        private const string Cobalt = "#1F3CE0";
        private const string Ink = "#171F2E";
        private const string Muted = "#6B7280";
        private const string Paper = "#F5F3EE";

        private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

        public static (string Subject, string Html) SubscriptionStarted(
            string userName, string? language, EnumSubscriptionPlan plan, int amount, EnumBillingCycle cycle,
            DateTime? trialEndsAt, string? cardLast4, string manageUrl)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);
            var planName = BillingCatalog.GetName(plan);
            var price = $"{Money(amount)}{CycleSuffix(cycle, pt)}";

            if (trialEndsAt is { } trialEnd)
            {
                var date = Date(trialEnd);
                var card = CardText(cardLast4, pt);
                return pt
                    ? ($"Seu teste grátis do {planName} começou",
                       Layout("Seu teste grátis começou",
                           [$"Olá, {name}! Você tem acesso ao plano {planName} até {date}, sem pagar nada.",
                            $"Se não cancelar até lá, a assinatura começa automaticamente em {date} com a cobrança de {price}{card}.",
                            "Você pode cancelar quando quiser, com um clique, na página da sua assinatura."],
                           "Gerenciar assinatura", manageUrl, pt))
                    : ($"Your {planName} free trial has started",
                       Layout("Your free trial has started",
                           [$"Hi {name}, you have the {planName} plan until {date} at no cost.",
                            $"Unless you cancel before then, the subscription starts on {date} and {price} is charged{card}.",
                            "You can cancel anytime, in one click, on your subscription page."],
                           "Manage subscription", manageUrl, pt));
            }

            return pt
                ? ($"Assinatura {planName} confirmada",
                   Layout("Assinatura confirmada",
                       [$"Olá, {name}! Sua assinatura do plano {planName} ({price}) está ativa.",
                        "Você pode cancelar quando quiser na página da sua assinatura."],
                       "Gerenciar assinatura", manageUrl, pt))
                : ($"{planName} subscription confirmed",
                   Layout("Subscription confirmed",
                       [$"Hi {name}, your {planName} subscription ({price}) is active.",
                        "You can cancel anytime on your subscription page."],
                       "Manage subscription", manageUrl, pt));
        }

        public static (string Subject, string Html) TrialEnding(
            string userName, string? language, int daysLeft, int amount, EnumBillingCycle cycle,
            DateTime chargeAt, string? cardLast4, string manageUrl)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);
            var price = $"{Money(amount)}{CycleSuffix(cycle, pt)}";
            var date = Date(chargeAt);
            var card = CardText(cardLast4, pt);

            return pt
                ? ($"Seu teste grátis termina {DaysText(daysLeft, pt)}",
                   Layout($"Seu teste termina {DaysText(daysLeft, pt)}",
                       [$"Olá, {name}! Em {date} cobraremos {price}{card} e sua assinatura continua normalmente.",
                        "Se não quiser continuar, cancele antes dessa data e nada será cobrado."],
                       "Cancelar ou gerenciar", manageUrl, pt))
                : ($"Your free trial ends {DaysText(daysLeft, pt)}",
                   Layout($"Your trial ends {DaysText(daysLeft, pt)}",
                       [$"Hi {name}, on {date} we will charge {price}{card} and your subscription carries on.",
                        "If you do not want to continue, cancel before that date and nothing is charged."],
                       "Cancel or manage", manageUrl, pt));
        }

        public static (string Subject, string Html) RenewalReminder(
            string userName, string? language, int daysLeft, int amount, DateOnly dueDate,
            EnumBillingMethod method, string payUrl)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);
            var date = dueDate.ToString("dd/MM/yyyy", PtBr);
            var how = method == EnumBillingMethod.Pix ? "Pix" : (pt ? "boleto" : "boleto");

            return pt
                ? ($"Renove sua assinatura: vence {DaysText(daysLeft, pt)}",
                   Layout("Hora de renovar",
                       [$"Olá, {name}! A renovação da sua assinatura ({Money(amount)}) vence em {date}.",
                        $"Pague pelo {how} até essa data para não perder o acesso — sem o pagamento, a assinatura é cancelada no dia seguinte."],
                       "Pagar agora", payUrl, pt))
                : ($"Renew your subscription: due {DaysText(daysLeft, pt)}",
                   Layout("Time to renew",
                       [$"Hi {name}, your subscription renewal ({Money(amount)}) is due on {date}.",
                        $"Pay by {how} by then to keep your access — without payment the subscription is canceled the next day."],
                       "Pay now", payUrl, pt));
        }

        public static (string Subject, string Html) PaymentConfirmed(
            string userName, string? language, EnumSubscriptionPlan plan, int amount, DateTime periodEnd, string manageUrl)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);
            var planName = BillingCatalog.GetName(plan);

            return pt
                ? ("Pagamento confirmado",
                   Layout("Pagamento confirmado",
                       [$"Olá, {name}! Recebemos {Money(amount)} da sua assinatura {planName}.",
                        $"Seu acesso está garantido até {Date(periodEnd)}."],
                       "Ver assinatura", manageUrl, pt))
                : ("Payment confirmed",
                   Layout("Payment confirmed",
                       [$"Hi {name}, we received {Money(amount)} for your {planName} subscription.",
                        $"Your access is secured until {Date(periodEnd)}."],
                       "View subscription", manageUrl, pt));
        }

        public static (string Subject, string Html) CanceledForNonPayment(
            string userName, string? language, string subscribeUrl)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);

            return pt
                ? ("Sua assinatura foi cancelada por falta de pagamento",
                   Layout("Assinatura cancelada",
                       [$"Olá, {name}. Não conseguimos receber o pagamento da renovação, então sua assinatura foi cancelada.",
                        "Seus dados continuam guardados. Para voltar a usar, é só assinar de novo."],
                       "Assinar novamente", subscribeUrl, pt))
                : ("Your subscription was canceled for lack of payment",
                   Layout("Subscription canceled",
                       [$"Hi {name}. We could not collect the renewal payment, so your subscription was canceled.",
                        "Your data is kept. To use the app again, just subscribe again."],
                       "Subscribe again", subscribeUrl, pt));
        }

        public static (string Subject, string Html) SubscriptionCanceled(
            string userName, string? language, DateTime accessUntil, string manageUrl,
            int refundAmount = 0, int feeAmount = 0, bool manualRefund = false)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);

            // A yearly plan ended early: the unused months come back, minus the fee, and the
            // cancellation is final.
            if (refundAmount > 0)
            {
                return pt
                    ? ("Cancelamento do plano anual confirmado",
                       Layout("Cancelamento confirmado",
                           [$"Olá, {name}. Seu plano anual foi cancelado e não será renovado. Você continua com acesso até {Date(accessUntil)}, o fim do mês em curso.",
                            $"Vamos devolver {Money(refundAmount)} referentes aos meses não utilizados, já descontada a multa de {Money(feeAmount)} (10% do valor desses meses).",
                            RefundTimingText(manualRefund, pt)],
                           "Ver assinatura", manageUrl, pt))
                    : ("Yearly plan cancellation confirmed",
                       Layout("Cancellation confirmed",
                           [$"Hi {name}. Your yearly plan is canceled and will not renew. You keep access until {Date(accessUntil)}, the end of the current month.",
                            $"We will refund {Money(refundAmount)} for the unused months, after the {Money(feeAmount)} fee (10% of their value).",
                            RefundTimingText(manualRefund, pt)],
                           "View subscription", manageUrl, pt));
            }

            return pt
                ? ("Cancelamento confirmado",
                   Layout("Cancelamento confirmado",
                       [$"Olá, {name}. Sua assinatura foi cancelada e não será renovada: nenhuma nova cobrança será gerada.",
                        $"Você continua com acesso até {Date(accessUntil)}. Mudou de ideia? Dá para retomar até lá."],
                       "Retomar assinatura", manageUrl, pt))
                : ("Cancellation confirmed",
                   Layout("Cancellation confirmed",
                       [$"Hi {name}. Your subscription is canceled and will not renew: no new charge will be made.",
                        $"You keep access until {Date(accessUntil)}. Changed your mind? You can resume until then."],
                       "Resume subscription", manageUrl, pt));
        }

        public static (string Subject, string Html) Refunded(
            string userName, string? language, int amount, string subscribeUrl, bool manualRefund = false)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);

            return pt
                ? ("Reembolso solicitado",
                   Layout("Reembolso solicitado",
                       [$"Olá, {name}. Sua assinatura foi encerrada e vamos devolver {Money(amount)}.",
                        RefundTimingText(manualRefund, pt)],
                       "Ver planos", subscribeUrl, pt))
                : ("Refund requested",
                   Layout("Refund requested",
                       [$"Hi {name}. Your subscription has ended and we will refund {Money(amount)}.",
                        RefundTimingText(manualRefund, pt)],
                       "See plans", subscribeUrl, pt));
        }

        public static (string Subject, string Html) YearlyRenewalNotice(
            string userName, string? language, int daysLeft, int amount, int installments, DateTime chargeAt,
            string? cardLast4, string manageUrl)
        {
            var pt = IsPtBr(language);
            var name = Html(userName);
            var date = Date(chargeAt);
            var card = CardText(cardLast4, pt);
            var split = installments > 1
                ? pt ? $" em {installments} parcelas sem juros" : $" in {installments} interest-free installments"
                : string.Empty;

            return pt
                ? ($"Seu plano anual renova {DaysText(daysLeft, pt)}",
                   Layout("Renovação do plano anual",
                       [$"Olá, {name}! Em {date} seu plano anual será renovado automaticamente com a cobrança de {Money(amount)}{split}{card}.",
                        "Se não quiser renovar, cancele antes dessa data na página da sua assinatura e nada será cobrado."],
                       "Cancelar ou gerenciar", manageUrl, pt))
                : ($"Your yearly plan renews {DaysText(daysLeft, pt)}",
                   Layout("Yearly plan renewal",
                       [$"Hi {name}, on {date} your yearly plan renews automatically and {Money(amount)}{split} is charged{card}.",
                        "If you do not want to renew, cancel before that date on your subscription page and nothing is charged."],
                       "Cancel or manage", manageUrl, pt));
        }

        /// <summary>
        /// Internal notice to the app's own inbox: a refund Asaas did not make and that has
        /// to be paid by hand before <paramref name="deadline"/>. Portuguese only — it is read
        /// by the team, not by the user.
        /// </summary>
        public static (string Subject, string Html) ManualRefundNotice(
            string userName, string userEmail, int userId, int amount, EnumBillingMethod billingMethod,
            string? asaasCustomerId, string? asaasPaymentId, string reason, DateTime deadline)
        {
            var rows = new (string Label, string Value)[]
            {
                ("Valor", Money(amount)),
                ("Prazo prometido ao usuário", $"{Date(deadline)} (48 horas)"),
                ("Usuário", $"{userName} (id {userId})"),
                ("E-mail do usuário", userEmail),
                ("Pagamento original", billingMethod.ToString()),
                ("Cliente no Asaas", asaasCustomerId ?? "—"),
                ("Cobrança no Asaas", asaasPaymentId ?? "—"),
                ("Motivo", reason)
            };
            var table = string.Join(string.Empty, rows.Select(r =>
                $"""<tr><td style="padding:6px 12px 6px 0;color:{Muted};white-space:nowrap;vertical-align:top;">{Html(r.Label)}</td><td style="padding:6px 0;color:{Ink};">{Html(r.Value)}</td></tr>"""));

            var html = $"""
            <div style="margin:0;padding:32px 16px;background:{Paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:32px;">
                <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:{Cobalt};">Helmo · interno</div>
                <h1 style="margin:16px 0 16px;font-size:22px;line-height:1.3;color:{Ink};">Estorno manual pendente</h1>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:{Ink};">O Asaas não fez este estorno. Devolva o valor por Pix ou transferência até o prazo abaixo e registre a data em ManualRefunds.ResolvedAt.</p>
                <table style="border-collapse:collapse;font-size:14px;line-height:1.5;">{table}</table>
              </div>
            </div>
            """;

            return ($"Estorno manual pendente: {Money(amount)} para {userName}", html);
        }

        // The money goes back the way it came; what Asaas did not refund goes back by hand.
        private static string RefundTimingText(bool manualRefund, bool pt) => manualRefund
            ? pt
                ? "Como esse estorno não pôde ser feito automaticamente, você receberá o valor por Pix ou transferência em até 48 horas. Se precisarmos dos seus dados bancários, falaremos com você por este e-mail."
                : "As this refund could not be made automatically, you will receive the money by Pix or bank transfer within 48 hours. If we need your bank details, we will contact you at this e-mail."
            : pt
                ? "O estorno é solicitado na hora. No cartão de crédito, o valor aparece como crédito na fatura em até 10 dias úteis, conforme o emissor; no Pix, volta para a conta de origem."
                : "The refund is requested right away. On a credit card it shows up as a credit on your statement within 10 business days, depending on the issuer; a Pix goes back to the paying account.";

        private static bool IsPtBr(string? language) =>
            language is null || language.StartsWith("pt", StringComparison.OrdinalIgnoreCase);

        private static string Html(string value) => WebUtility.HtmlEncode(value);

        private static string Money(int cents) => (cents / 100m).ToString("C", PtBr);

        private static string Date(DateTime utc) => BillingClock.ToLocalDate(utc).ToString("dd/MM/yyyy", PtBr);

        private static string CycleSuffix(EnumBillingCycle cycle, bool pt) =>
            cycle == EnumBillingCycle.Yearly ? (pt ? "/ano" : "/year") : (pt ? "/mês" : "/month");

        private static string CardText(string? last4, bool pt) =>
            string.IsNullOrEmpty(last4) ? string.Empty : pt ? $" no cartão final {Html(last4)}" : $" to the card ending {Html(last4)}";

        private static string DaysText(int days, bool pt) => pt
            ? days switch { 0 => "hoje", 1 => "amanhã", _ => $"em {days} dias" }
            : days switch { 0 => "today", 1 => "tomorrow", _ => $"in {days} days" };

        private static string Layout(string heading, string[] paragraphs, string ctaText, string ctaUrl, bool pt)
        {
            var body = string.Join(string.Empty, paragraphs.Select(p =>
                $"""<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:{Ink};">{p}</p>"""));
            var footer = pt
                ? "Você recebe este e-mail porque tem uma assinatura no Helmo."
                : "You get this email because you have a Helmo subscription.";

            return $"""
            <div style="margin:0;padding:32px 16px;background:{Paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:16px;padding:32px;">
                <div style="font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:{Cobalt};">Helmo</div>
                <h1 style="margin:16px 0 16px;font-size:22px;line-height:1.3;color:{Ink};">{Html(heading)}</h1>
                {body}
                <a href="{WebUtility.HtmlEncode(ctaUrl)}" style="display:inline-block;margin:8px 0 24px;padding:12px 20px;background:{Cobalt};color:#FFFFFF;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none;">{Html(ctaText)}</a>
                <p style="margin:0;padding-top:20px;border-top:1px solid #E7E3DA;font-size:13px;line-height:1.6;color:{Muted};">{footer}</p>
              </div>
            </div>
            """;
        }
    }
}
