"use client";

import { useState } from "react";
import { AlertCircle, Landmark, Loader2, Link2, RefreshCw, Unplug } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useAdjustBankBalance, useSyncConnection } from "@/features/open-finance/hooks/useOpenFinance";
import {
  CONNECTION_STATUS,
  TONE_CLASS,
  formatSyncedAgo,
  openFinanceErrorMessage,
} from "@/features/open-finance/utils/openFinance";
import type { BankConnection } from "@/lib/types/openFinance.types";

type Props = {
  connection: BankConnection;
  onLinkAccounts: () => void;
  onReconnect: () => void;
  onDisconnect: () => void;
};

/** Differences under R$ 1,00 are rounding or a pending fee — not worth an adjustment prompt. */
const BALANCE_TOLERANCE = 100;

export function BankConnectionCard({ connection, onLinkAccounts, onReconnect, onDisconnect }: Props) {
  const sync = useSyncConnection();
  const adjust = useAdjustBankBalance();
  const [error, setError] = useState<string | null>(null);

  const status = CONNECTION_STATUS[connection.status];
  const syncedAgo = formatSyncedAgo(connection.lastSyncedAt);
  const pendingLink = connection.accounts.some((a) => a.status === "PendingLink");
  const needsReconnect = connection.status === "NeedsReconnect" || connection.status === "Disconnected";
  const syncBlocked = !!connection.manualSyncAvailableAt || connection.status === "Syncing";
  const linked = connection.accounts.filter((a) => a.status === "Linked");

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(openFinanceErrorMessage(err));
    }
  };

  return (
    <div className="border-border bg-surface2 flex flex-col gap-3 rounded-[16px] border p-4">
      <div className="flex items-center gap-3">
        {connection.connectorImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo hosted by Pluggy, any size
          <img
            src={connection.connectorImageUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-[10px] bg-white object-contain p-1"
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
            style={{ backgroundColor: connection.connectorPrimaryColor ? `#${connection.connectorPrimaryColor.replace("#", "")}` : "var(--surface)" }}
          >
            <Landmark size={18} className="text-white" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-text truncate text-[14px] font-medium">{connection.connectorName}</p>
          <p className="text-text-muted text-[12px]">
            {connection.isImporting
              ? "Importando transações…"
              : syncedAgo
                ? `Atualizado ${syncedAgo}`
                : "Aguardando primeira sincronização"}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", TONE_CLASS[status.tone])}>
          {connection.status === "Syncing" || connection.isImporting ? (
            <span className="flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              {connection.isImporting ? "Importando" : status.label}
            </span>
          ) : (
            status.label
          )}
        </span>
      </div>

      {(needsReconnect || connection.consentExpiringSoon) && (
        <div className="bg-red/8 border-red/20 flex items-start gap-2 rounded-[10px] border px-3 py-2">
          <AlertCircle size={13} className="text-red mt-0.5 shrink-0" />
          <p className="text-text-sub text-[12px] leading-relaxed">
            {needsReconnect
              ? "A autorização com o banco expirou ou foi revogada. Reconecte para voltar a importar."
              : "A autorização com o banco vence em breve. Reconecte para não interromper a importação."}
          </p>
        </div>
      )}

      {pendingLink && (
        <button
          onClick={onLinkAccounts}
          className="border-orange/30 bg-orange/8 text-orange flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-2 text-[12px] font-medium"
        >
          <Link2 size={13} />
          Escolha para onde vão as transações deste banco
        </button>
      )}

      {linked.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {linked.map((account) => {
            const difference = account.balanceDifference;
            const showAdjust = difference !== null && Math.abs(difference) >= BALANCE_TOLERANCE;
            return (
              <div key={account.id} className="flex items-center gap-2 text-[12px]">
                <span className="text-text-sub min-w-0 flex-1 truncate">
                  {account.name} → <span className="text-text">{account.accountName}</span>
                </span>
                {showAdjust ? (
                  <button
                    onClick={() => run(() => adjust.mutateAsync({ connectionId: connection.id, bankAccountId: account.id }))}
                    disabled={adjust.isPending}
                    title={`Saldo no banco: ${formatCurrency(Math.abs(account.externalBalance ?? 0) / 100)}`}
                    className="text-blue hover:text-text shrink-0 font-medium transition-colors"
                  >
                    Ajustar saldo ao do banco
                  </button>
                ) : (
                  account.externalBalance !== null && (
                    <span className="font-money text-text-muted shrink-0">
                      {formatCurrency(Math.abs(account.externalBalance) / 100)}
                    </span>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-red text-[12px]">{error}</p>}

      <div className="flex gap-2">
        {needsReconnect ? (
          <button
            onClick={onReconnect}
            className="bg-green/10 text-green border-green/25 flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] border text-[12px] font-medium"
          >
            <RefreshCw size={12} />
            Reconectar
          </button>
        ) : (
          <button
            onClick={() => run(() => sync.mutateAsync(connection.id))}
            disabled={syncBlocked || sync.isPending}
            title={connection.manualSyncAvailableAt ? "Você sincronizou há pouco" : undefined}
            className="border-border text-text-sub hover:bg-surface hover:text-text flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] border text-[12px] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={cn(sync.isPending && "animate-spin")} />
            Sincronizar
          </button>
        )}
        {!pendingLink && connection.accounts.length > 0 && (
          <button
            onClick={onLinkAccounts}
            className="border-border text-text-sub hover:bg-surface hover:text-text flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[9px] border text-[12px] transition-colors"
          >
            <Link2 size={12} />
            Contas
          </button>
        )}
        <button
          onClick={onDisconnect}
          title="Desconectar"
          className="border-red/40 text-red hover:bg-red/10 flex h-8 w-9 items-center justify-center rounded-[9px] border transition-colors"
        >
          <Unplug size={13} />
        </button>
      </div>
    </div>
  );
}
