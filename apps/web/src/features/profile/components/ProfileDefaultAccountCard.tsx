"use client";

import { cn } from "@/lib/utils";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { Wallet } from "lucide-react";

export const ProfileDefaultAccountCard = () => {
  const { data, isLoading } = useAccounts();

  const accounts = (data ?? []).filter((a) => a.type !== "Credit");
  const defaultId = accounts.find((a) => a.isDefaultAccount)?.id ?? accounts[0]?.id ?? null;

  if (isLoading || accounts.length === 0) return null;

  return (
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="font-display font-600 text-text mb-1 text-[15px]">Conta padrão para transações</p>
      <p className="text-text-muted mb-4 text-[12px]">
        Conta pré-selecionada ao criar uma nova transação
      </p>

      <div className="flex flex-wrap gap-2">
        {accounts.map((acc) => {
          const isActive = acc.id === defaultId;
          return (
            <button
              key={acc.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all",
                isActive
                  ? "border-green/45 bg-green/10 text-green"
                  : "border-border bg-surface2 text-text-sub hover:text-text",
              )}
            >
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-md",
                  isActive ? "bg-green/20" : "bg-surface3",
                )}
              >
                <Wallet size={12} className={isActive ? "text-green" : "text-text-muted"} />
              </div>
              {acc.name.split(" ").slice(0, 2).join(" ")}
            </button>
          );
        })}
      </div>
    </div>
  );
};
