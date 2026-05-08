"use client";

import { useState } from "react";
import { Loader2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { AccountsNetWorthHero } from "@/features/accounts/components/AccountsNetWorthHero";
import { AccountsEmptyState } from "@/features/accounts/components/AccountsEmptyState";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { CreateAccountModal } from "@/features/accounts/components/CreateAccountModal";
import { EditAccountModal } from "@/features/accounts/components/EditAccountModal";
import { DeleteAccountModal } from "@/features/accounts/components/DeleteAccountModal";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { usePageNova } from "@/lib/hooks/usePageHeader";
import type { AccountItem } from "@/lib/types/accounts.types";

export function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountItem | null>(null);

  usePageNova("Nova conta", () => setCreateOpen(true));

  const totalBalance = accounts?.reduce((sum, a) => sum + a.currentAmount, 0) ?? 0;
  const totalAssets = accounts?.filter((a) => a.currentAmount > 0).reduce((sum, a) => sum + a.currentAmount, 0) ?? 0;
  const totalLiabilities = accounts?.filter((a) => a.currentAmount < 0).reduce((sum, a) => sum + Math.abs(a.currentAmount), 0) ?? 0;
  const hasAccounts = !!accounts?.length;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="text-green animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-sub text-[14px]">Erro ao carregar contas. Tente novamente.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Contas</h1>
          <p className="text-text-muted mt-0.5 text-[13px]">
            {(accounts?.length ?? 0) > 0 ? `${accounts!.length} conta${accounts!.length !== 1 ? "s" : ""}` : "Nenhuma conta"}
          </p>
        </div>

        {hasAccounts && (
          <AccountsNetWorthHero
            totalBalance={totalBalance}
            totalAssets={totalAssets}
            totalLiabilities={totalLiabilities}
            accountCount={accounts!.length}
          />
        )}

        {hasAccounts ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {accounts!.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
            {/* Placeholder card */}
            <button
              onClick={() => setCreateOpen(true)}
              className="border-border text-text-muted hover:border-green/40 hover:text-green flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-colors"
            >
              <div className="border-border flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
                <Plus size={18} strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium">Adicionar conta</span>
            </button>
          </div>
        ) : (
          <AccountsEmptyState onCreateClick={() => setCreateOpen(true)} />
        )}

        {/* Open Finance section — static placeholder (V2 feature) */}
        <div className="border-border bg-surface rounded-xl border p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-display font-600 text-text text-[15px]">Open Finance</p>
              <p className="text-text-muted mt-0.5 text-[12px]">Conecte seus bancos para importar transações automaticamente</p>
            </div>
            <span className="bg-orange/10 text-orange border-orange/30 rounded-full border px-2.5 py-1 text-[11px] font-medium">
              Em breve
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Nubank",  color: "#820AD1", initial: "N", txCount: 0 },
              { name: "Itaú",    color: "#F77F00", initial: "I", txCount: 0 },
              { name: "XP",      color: "#FF6B00", initial: "X", txCount: 0 },
              { name: "B3",      color: "#E50000", initial: "B", txCount: 0 },
            ].map((bank) => (
              <div key={bank.name} className="border-border bg-surface2 flex items-center gap-3 rounded-xl border p-3 opacity-60">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-[13px] font-bold text-white"
                  style={{ backgroundColor: bank.color }}
                >
                  {bank.initial}
                </div>
                <div className="min-w-0">
                  <p className="text-text text-[13px] font-medium">{bank.name}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <AlertCircle size={10} className="text-text-muted" />
                    <span className="text-text-muted text-[11px]">Não conectado</span>
                  </div>
                </div>
                <RefreshCw size={13} className="text-text-muted ml-auto shrink-0 opacity-40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <CreateAccountModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditAccountModal account={editTarget} onClose={() => setEditTarget(null)} />
      <DeleteAccountModal account={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
