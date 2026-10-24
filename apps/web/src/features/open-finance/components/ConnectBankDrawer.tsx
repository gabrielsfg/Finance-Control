"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PluggyWidget } from "@/features/open-finance/components/PluggyWidget";
import { LinkAccountsForm } from "@/features/open-finance/components/LinkAccountsForm";
import {
  useBankConnections,
  useCreateConnectToken,
  useRegisterConnection,
} from "@/features/open-finance/hooks/useOpenFinance";
import { openFinanceErrorMessage } from "@/features/open-finance/utils/openFinance";
import type { ConnectToken } from "@/lib/types/openFinance.types";

/** What the drawer opens for: a new bank, reconnecting one, or choosing its accounts. */
export type ConnectBankIntent =
  | { kind: "connect" }
  | { kind: "reconnect"; connectionId: number }
  | { kind: "link"; connectionId: number };

type Step = "intro" | "widget" | "registering" | "link";

type Props = {
  intent: ConnectBankIntent | null;
  onClose: () => void;
};

const CONSENT_POINTS = [
  "Lemos contas, saldos, cartões, transações e investimentos — nada além disso.",
  "Não temos acesso à sua senha e não podemos movimentar dinheiro.",
  "A autorização é feita no app ou site do seu banco, via Open Finance (Pluggy).",
  "Você pode desconectar quando quiser, aqui ou no seu banco.",
];

export function ConnectBankDrawer({ intent, onClose }: Props) {
  const open = intent !== null;
  const panelRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "pointer-events-auto bg-black/40 backdrop-blur-sm" : "pointer-events-none opacity-0",
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
      >
        {/* Mounted per opening, so every flow starts from its own initial step. */}
        {intent && <ConnectBankFlow intent={intent} onClose={onClose} />}
      </div>
    </>
  );
}

function initialStep(intent: ConnectBankIntent): Step {
  if (intent.kind === "link") return "link";
  if (intent.kind === "reconnect") return "registering";
  return "intro";
}

/**
 * A new connection goes through the explanation first, a reconnect straight to the
 * widget, a link straight to the accounts.
 */
function ConnectBankFlow({ intent, onClose }: { intent: ConnectBankIntent; onClose: () => void }) {
  const [step, setStep] = useState<Step>(() => initialStep(intent));
  const [token, setToken] = useState<ConnectToken | null>(null);
  const [connectionId, setConnectionId] = useState<number | null>(() =>
    intent.kind === "connect" ? null : intent.connectionId,
  );
  const [error, setError] = useState<string | null>(null);

  const createToken = useCreateConnectToken();
  const register = useRegisterConnection();
  const { data: connections } = useBankConnections();
  const connection = connections?.find((c) => c.id === connectionId) ?? null;

  const requestToken = (reconnectId?: number) =>
    createToken.mutateAsync(reconnectId).then(
      (created) => {
        setToken(created);
        setStep("widget");
      },
      (err) => {
        setError(openFinanceErrorMessage(err));
        setStep("intro");
      },
    );

  // A reconnect has nothing to explain: the widget opens as soon as the token is in hand.
  const reconnectId = intent.kind === "reconnect" ? intent.connectionId : null;
  useEffect(() => {
    if (reconnectId !== null) void requestToken(reconnectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnectId]);

  const handleSuccess = async (itemId: string) => {
    setToken(null);
    setStep("registering");
    try {
      const registered = await register.mutateAsync(itemId);
      if (intent.kind === "reconnect") {
        onClose();
        return;
      }
      setConnectionId(registered.id);
      setStep("link");
    } catch (err) {
      setError(openFinanceErrorMessage(err));
      setStep("intro");
    }
  };

  const handleWidgetError = (message: string) => {
    // Some banks finish the authorization later (in their own app); the webhook brings it
    // in, so this is not a dead end.
    setError(message || "Não foi possível conectar o banco.");
  };

  const handleWidgetClose = () => {
    setToken(null);
    if (step === "widget") {
      if (intent.kind === "reconnect") onClose();
      else setStep("intro");
    }
  };

  const title = step === "link" ? "Contas do banco" : intent.kind === "reconnect" ? "Reconectar banco" : "Conectar banco";

  return (
    <>
      <div className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: "var(--border-color)" }}>
        <h2 className="font-display text-[17px] font-bold tracking-[-0.01em] text-[var(--text)]">{title}</h2>
        <button
          onClick={onClose}
          title="Fechar"
          className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-[9px] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {step === "intro" && (
          <div className="flex flex-col gap-5">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ background: "color-mix(in srgb, var(--green) 14%, transparent)" }}
            >
              <ShieldCheck size={22} className="text-green" />
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="font-display text-text text-[16px] font-semibold">Importe suas transações automaticamente</p>
              <p className="text-text-sub text-[13px] leading-relaxed">
                Conecte seu banco pelo Open Finance: as transações entram no app sozinhas, para você só revisar, e os
                investimentos aparecem na sua carteira.
              </p>
            </div>
            <ul className="flex flex-col gap-2.5">
              {CONSENT_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <Check size={14} className="text-green mt-0.5 shrink-0" />
                  <span className="text-text-sub text-[13px] leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
            {error && <p className="text-red text-[13px]">{error}</p>}
            <Button
              className="w-full"
              size="xl"
              disabled={createToken.isPending}
              onClick={() => {
                setError(null);
                void requestToken();
              }}
            >
              {createToken.isPending ? <Loader2 size={15} className="animate-spin" /> : "Continuar"}
            </Button>
          </div>
        )}

        {(step === "widget" || step === "registering") && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Loader2 size={22} className="text-text-muted animate-spin" />
            <p className="text-text-sub text-[13px]">
              {step === "widget" ? "Siga as instruções na janela do banco." : "Preparando a conexão…"}
            </p>
            {error && <p className="text-red text-[13px]">{error}</p>}
          </div>
        )}

        {step === "link" &&
          (connection ? (
            <LinkAccountsForm key={connection.id} connection={connection} onDone={onClose} />
          ) : (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="text-text-muted animate-spin" />
            </div>
          ))}
      </div>

      {step === "widget" && token && (
        <PluggyWidget token={token} onSuccess={handleSuccess} onError={handleWidgetError} onClose={handleWidgetClose} />
      )}
    </>
  );
}
