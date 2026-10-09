"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import type { SubscriptionCharge } from "@/lib/types/subscription.types";
import { usePendingPix } from "../hooks/useSubscription";
import { formatBillingDate, formatCents } from "../utils/billing";
import { PRIMARY_BUTTON_CLASS } from "./BillingDrawer";

/**
 * How to pay an open Pix or boleto charge: the QR code and copy-and-paste code for Pix,
 * the boleto link otherwise. The subscription moves on by itself once Asaas tells us
 * the money arrived — this panel only has to show the way.
 */
export function PendingPaymentPanel({ charge }: { charge: SubscriptionCharge }) {
  const isPix = charge.billingMethod === "Pix";
  const pix = usePendingPix(isPix);
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context, permissions): the code stays selectable.
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <span className="text-text-sub text-[13px]">Valor</span>
        <span className="font-mono text-[18px] font-semibold text-[var(--text)] tabular-nums">
          {formatCents(charge.amount)}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-text-sub text-[13px]">Vencimento</span>
        <span className="text-[14px] text-[var(--text)]">{formatBillingDate(charge.dueDate)}</span>
      </div>

      {isPix ? (
        pix.isLoading ? (
          <div className="flex h-[220px] items-center justify-center">
            <Loader2 size={20} className="text-text-muted animate-spin" />
          </div>
        ) : pix.data ? (
          <div className="flex flex-col items-center gap-3">
            {pix.data.qrImageBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/png;base64,${pix.data.qrImageBase64}`}
                alt="QR Code do Pix"
                className="h-[200px] w-[200px] rounded-[13px] bg-white p-2"
              />
            )}
            <div className="border-border bg-surface2 w-full rounded-[13px] border p-3">
              <p className="text-text-muted mb-1.5 font-mono text-[10.5px] tracking-[0.08em] uppercase">Pix copia e cola</p>
              <p className="text-text font-mono text-[11.5px] break-all select-all">{pix.data.payload}</p>
            </div>
            <button type="button" onClick={() => copy(pix.data!.payload)} className={`${PRIMARY_BUTTON_CLASS} w-full`}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Código copiado" : "Copiar código Pix"}
            </button>
          </div>
        ) : (
          <FallbackLink charge={charge} />
        )
      ) : (
        <a
          href={charge.bankSlipUrl ?? charge.invoiceUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`${PRIMARY_BUTTON_CLASS} w-full`}
        >
          <ExternalLink size={15} />
          Abrir boleto
        </a>
      )}

      <p className="text-text-muted text-[12px] leading-relaxed">
        {isPix
          ? "Assim que o Pix for pago, sua assinatura é liberada automaticamente — normalmente em poucos segundos."
          : "O boleto pode levar até 3 dias úteis para ser compensado. Sua assinatura é liberada quando o pagamento for confirmado."}
      </p>
    </div>
  );
}

function FallbackLink({ charge }: { charge: SubscriptionCharge }) {
  if (!charge.invoiceUrl) {
    return (
      <p className="text-[12.5px] text-[var(--clay)]">
        Não foi possível carregar o Pix agora. Tente novamente em alguns instantes.
      </p>
    );
  }
  return (
    <a href={charge.invoiceUrl} target="_blank" rel="noopener noreferrer" className={`${PRIMARY_BUTTON_CLASS} w-full`}>
      <ExternalLink size={15} />
      Abrir página de pagamento
    </a>
  );
}
