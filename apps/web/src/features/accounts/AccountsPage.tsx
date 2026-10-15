"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AccountsNetWorthHero } from "@/features/accounts/components/AccountsNetWorthHero";
import { AccountsEmptyState } from "@/features/accounts/components/AccountsEmptyState";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { AccountDrawer } from "@/features/accounts/components/AccountDrawer";
import { DeleteAccountModal } from "@/features/accounts/components/DeleteAccountModal";
import { SetDefaultAccountModal } from "@/features/accounts/components/SetDefaultAccountModal";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { OpenFinanceSection } from "@/features/open-finance/components/OpenFinanceSection";
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
                isConnected={!!account.isConnected}
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

        <OpenFinanceSection />
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
