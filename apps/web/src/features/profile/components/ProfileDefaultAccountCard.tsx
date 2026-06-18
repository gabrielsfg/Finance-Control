"use client";

import { Wallet } from "lucide-react";
import { Card, CardHead } from "@/components/shared/Card";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { cn } from "@/lib/utils";

export const ProfileDefaultAccountCard = () => {
  const { data, isLoading } = useAccounts();

  const accounts = (data ?? []).filter((a) => a.type !== "Credit");
  const defaultId = accounts.find((a) => a.isDefaultAccount)?.id ?? accounts[0]?.id ?? null;

  if (isLoading || accounts.length === 0) return null;

  return (
    <Card>
      <CardHead title="Conta padrão" subtitle="Pré-selecionada ao criar uma nova transação" />

      <div className="flex flex-wrap gap-2">
        {accounts.map((acc) => {
          const isActive = acc.id === defaultId;
          return (
            <button
              key={acc.id}
              className={cn(
                "flex items-center gap-2 rounded-[13px] border px-3 py-2 text-[13px] font-medium transition-colors",
                isActive
                  ? "border-[var(--brand-cobalt)] text-[var(--brand-accent)]"
                  : "border-[var(--border-color)] bg-[var(--surface2)] text-[var(--text-sub)] hover:text-[var(--text)]",
              )}
              style={
                isActive ? { background: "color-mix(in srgb, var(--brand-accent) 12%, transparent)" } : undefined
              }
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-[9px]",
                  isActive ? "text-[var(--brand-accent)]" : "bg-[var(--surface)] text-[var(--text-sub)]",
                )}
                style={
                  isActive ? { background: "color-mix(in srgb, var(--brand-accent) 18%, transparent)" } : undefined
                }
              >
                <Wallet size={12} />
              </span>
              {acc.name.split(" ").slice(0, 2).join(" ")}
            </button>
          );
        })}
      </div>
    </Card>
  );
};
