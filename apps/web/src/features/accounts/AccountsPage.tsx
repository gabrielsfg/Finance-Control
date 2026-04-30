"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AccountsHeader } from "@/features/accounts/components/AccountsHeader";
import { AccountsNetWorthHero } from "@/features/accounts/components/AccountsNetWorthHero";
import { AccountsEmptyState } from "@/features/accounts/components/AccountsEmptyState";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { CreateAccountModal } from "@/features/accounts/components/CreateAccountModal";
import { EditAccountModal } from "@/features/accounts/components/EditAccountModal";
import { DeleteAccountModal } from "@/features/accounts/components/DeleteAccountModal";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import type { AccountItem } from "@/lib/types/accounts.types";

export function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountItem | null>(null);

  const totalBalance = accounts?.reduce((sum, a) => sum + a.currentAmount, 0) ?? 0;
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
        <AccountsHeader
          accountCount={accounts?.length ?? 0}
          onCreateClick={() => setCreateOpen(true)}
        />

        {hasAccounts && (
          <AccountsNetWorthHero
            totalBalance={totalBalance}
            accountCount={accounts!.length}
          />
        )}

        {hasAccounts ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts!.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        ) : (
          <AccountsEmptyState onCreateClick={() => setCreateOpen(true)} />
        )}
      </div>

      <CreateAccountModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditAccountModal account={editTarget} onClose={() => setEditTarget(null)} />
      <DeleteAccountModal account={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
