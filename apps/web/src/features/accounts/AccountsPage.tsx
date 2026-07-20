"use client";

import { useState } from "react";
import { Loader2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { AccountsNetWorthHero } from "@/features/accounts/components/AccountsNetWorthHero";
import { AccountsEmptyState } from "@/features/accounts/components/AccountsEmptyState";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { AccountDrawer } from "@/features/accounts/components/AccountDrawer";
import { DeleteAccountModal } from "@/features/accounts/components/DeleteAccountModal";
import { SetDefaultAccountModal } from "@/features/accounts/components/SetDefaultAccountModal";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { usePageNova } from "@/lib/hooks/usePageHeader";
import { PageTopbar } from "@/components/layout/PageTopbar";
import type { AccountItem } from "@/lib/types/accounts.types";
import type { AccountDrawerMode } from "@/features/accounts/components/AccountDrawer";

export function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<AccountDrawerMode>("create");
  const [drawerAccount, setDrawerAccount] = useState<AccountItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountItem | null>(null);
  const [setDefaultTarget, setSetDefaultTarget] = useState<AccountItem | null>(null);

  usePageNova("Nova conta", () => openDrawer("create"));

  const openDrawer = (mode: AccountDrawerMode, account?: AccountItem) => {
    setDrawerMode(mode);
    setDrawerAccount(account ?? null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

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

  const subtitle = (accounts?.length ?? 0) > 0
    ? `${accounts!.length} conta${accounts!.length !== 1 ? "s" : ""}`
    : "Nenhuma conta";

  return (
    <>
      <div className="px-[clamp(20px,3.4vw,46px)] pb-[60px]">
        <PageTopbar title="Contas" subtitle={subtitle} />
      <div className="flex flex-col gap-5">

        {hasAccounts && <AccountsNetWorthHero accounts={accounts!} />}

        {hasAccounts ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {accounts!.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onCardClick={() => openDrawer("detail", account)}
                onEdit={() => openDrawer("edit", account)}
                onDelete={(a) => setDeleteTarget(a)}
                onSetDefault={(a) => setSetDefaultTarget(a)}
              />
            ))}
            <button
              onClick={() => openDrawer("create")}
              className="border-border text-text-muted hover:border-green/40 hover:text-green flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-[20px] border border-dashed transition-colors"
            >
              <div className="border-border flex h-10 w-10 items-center justify-center rounded-full border border-dashed">
                <Plus size={18} strokeWidth={1.5} />
              </div>
              <span className="text-[13px] font-medium">Adicionar conta</span>
            </button>
          </div>
        ) : (
          <AccountsEmptyState onCreateClick={() => openDrawer("create")} />
        )}

        {/* Open Finance — V2 placeholder */}
        <div className="rounded-[20px] border p-5" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-display font-semibold text-[var(--text)] text-[15px]">Open Finance</p>
              <p className="text-text-muted mt-0.5 text-[12px]">Conecte seus bancos para importar transações automaticamente</p>
            </div>
            <span className="bg-orange/10 text-orange border-orange/30 rounded-full border px-2.5 py-1 text-[11px] font-medium">
              Em breve
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: "Nubank",  color: "#820AD1", initial: "N" },
              { name: "Itaú",    color: "#F77F00", initial: "I" },
              { name: "XP",      color: "#FF6B00", initial: "X" },
              { name: "B3",      color: "#E50000", initial: "B" },
            ].map((bank) => (
              <div key={bank.name} className="border-border bg-surface2 flex items-center gap-3 rounded-[13px] border p-3 opacity-60">
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
      </div>

      <AccountDrawer
        open={drawerOpen}
        mode={drawerMode}
        account={drawerAccount}
        onClose={closeDrawer}
        onDeleteRequest={(a) => {
          closeDrawer();
          setDeleteTarget(a);
        }}
      />

      <DeleteAccountModal account={deleteTarget} onClose={() => setDeleteTarget(null)} />
      <SetDefaultAccountModal account={setDefaultTarget} onClose={() => setSetDefaultTarget(null)} />
    </>
  );
}
