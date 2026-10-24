"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BankConnectionCard } from "@/features/open-finance/components/BankConnectionCard";
import { ConnectBankDrawer, type ConnectBankIntent } from "@/features/open-finance/components/ConnectBankDrawer";
import { DisconnectBankModal } from "@/features/open-finance/components/DisconnectBankModal";
import { useBankConnections, useOpenFinanceStatus } from "@/features/open-finance/hooks/useOpenFinance";
import type { BankConnection } from "@/lib/types/openFinance.types";

/**
 * The bank connections block on the accounts page: the connected banks, their state and
 * the way to add one. Shows "em breve" while the feature is off, and the upgrade notice
 * when the plan does not include it.
 */
export function OpenFinanceSection() {
  const { data: status, isLoading: statusLoading } = useOpenFinanceStatus();
  const usable = !!status?.available && status.hasAccess;
  const { data: connections = [], isLoading: connectionsLoading } = useBankConnections(usable);

  const [intent, setIntent] = useState<ConnectBankIntent | null>(null);
  const [disconnectTarget, setDisconnectTarget] = useState<BankConnection | null>(null);

  const limitReached =
    !!status && status.maxConnections !== null && status.activeConnections >= status.maxConnections;

  return (
    <div className="rounded-[20px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-[15px] font-semibold text-[var(--text)]">Open Finance</p>
          <p className="text-text-muted mt-0.5 text-[12px]">Conecte seus bancos para importar transações automaticamente</p>
        </div>
        {usable ? (
          <Button
            size="sm"
            disabled={limitReached}
            title={limitReached ? `Seu plano permite ${status!.maxConnections} bancos conectados` : undefined}
            onClick={() => setIntent({ kind: "connect" })}
          >
            <Plus size={13} />
            Conectar banco
          </Button>
        ) : (
          !statusLoading &&
          !status?.available && (
            <span className="bg-orange/10 text-orange border-orange/30 rounded-full border px-2.5 py-1 text-[11px] font-medium">
              Em breve
            </span>
          )
        )}
      </div>

      {statusLoading || (usable && connectionsLoading) ? (
        <div className="flex justify-center py-4">
          <Loader2 size={18} className="text-text-muted animate-spin" />
        </div>
      ) : status?.available && !status.hasAccess ? (
        <p className="text-text-sub text-[13px]">Conectar bancos requer uma assinatura ativa.</p>
      ) : usable && connections.length === 0 ? (
        <p className="text-text-sub text-[13px]">
          Nenhum banco conectado. Conecte um banco para as transações entrarem sozinhas.
        </p>
      ) : usable ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {connections.map((connection) => (
            <BankConnectionCard
              key={connection.id}
              connection={connection}
              onLinkAccounts={() => setIntent({ kind: "link", connectionId: connection.id })}
              onReconnect={() => setIntent({ kind: "reconnect", connectionId: connection.id })}
              onDisconnect={() => setDisconnectTarget(connection)}
            />
          ))}
          {limitReached && status?.plan === "Basic" && (
            <p className="text-text-muted text-[12px] lg:col-span-2">
              O plano Basic conecta até {status.maxConnections} bancos. No Premium não há limite.
            </p>
          )}
        </div>
      ) : (
        <p className="text-text-muted text-[13px]">
          Em breve você vai poder conectar seus bancos e importar as transações automaticamente.
        </p>
      )}

      <ConnectBankDrawer intent={intent} onClose={() => setIntent(null)} />
      <DisconnectBankModal connection={disconnectTarget} onClose={() => setDisconnectTarget(null)} />
    </div>
  );
}
