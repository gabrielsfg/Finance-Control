"use client";

import { useState } from "react";
import { Plus, Loader2, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { CreateAccountModal } from "@/features/accounts/components/CreateAccountModal";
import { EditAccountModal } from "@/features/accounts/components/EditAccountModal";
import { DeleteAccountModal } from "@/features/accounts/components/DeleteAccountModal";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { AccountItem } from "@/lib/types/accounts.types";

export default function AccountsPage() {
  const { data: accounts, isLoading, isError } = useAccounts();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountItem | null>(null);

  const totalBalance =
    accounts?.reduce((sum, a) => sum + a.currentAmount, 0) ?? 0;

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

  const hasAccounts = accounts && accounts.length > 0;

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Contas</h1>
            <p className="text-text-muted mt-0.5 text-[13px]">
              {hasAccounts ? `${accounts.length} conta${accounts.length !== 1 ? "s" : ""}` : "Nenhuma conta"}
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            Nova conta
          </Button>
        </div>

        {/* Net Worth Hero */}
        {hasAccounts && (
          <div
            className="border-border flex items-center justify-between rounded-[16px] border px-8 py-7"
            style={{
              background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
            }}
          >
            <div>
              <p className="text-text-muted mb-2 text-[13px] tracking-[0.06em] uppercase">
                Patrimônio Total
              </p>
              <p
                className="font-money font-600 text-[40px] tracking-tight"
                style={{ color: totalBalance >= 0 ? "var(--green)" : "var(--red)" }}
              >
                {totalBalance < 0 ? "-" : ""}
                {formatCurrency(Math.abs(totalBalance / 100))}
              </p>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-text-muted text-[13px]">Contas</p>
              <p className="font-money font-600 text-text text-[20px]">{accounts.length}</p>
            </div>
          </div>
        )}

        {/* Accounts Grid */}
        {hasAccounts ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        ) : (
          <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <div className="bg-surface2 mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]">
              <Landmark size={22} className="text-text-muted" strokeWidth={1.5} />
            </div>
            <p className="font-500 text-text text-[15px]">Nenhuma conta cadastrada</p>
            <p className="text-text-muted mt-1 text-[13px]">
              Adicione sua primeira conta para começar a controlar seu patrimônio.
            </p>
            <Button size="sm" className="mt-5" onClick={() => setCreateOpen(true)}>
              <Plus size={14} />
              Nova conta
            </Button>
          </div>
        )}
      </div>

      <CreateAccountModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditAccountModal account={editTarget} onClose={() => setEditTarget(null)} />
      <DeleteAccountModal account={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </>
  );
}
