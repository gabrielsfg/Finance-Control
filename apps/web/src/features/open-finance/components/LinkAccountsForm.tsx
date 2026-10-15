"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { TabChips } from "@/components/shared/TabChips";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/config/accountTypes";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useLinkBankAccounts } from "@/features/open-finance/hooks/useOpenFinance";
import { firstDayOfMonthIso, openFinanceErrorMessage } from "@/features/open-finance/utils/openFinance";
import type {
  BankAccountLinkAction,
  BankConnection,
  BankConnectionAccount,
  LinkBankAccountItem,
} from "@/lib/types/openFinance.types";

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-[var(--brand-cobalt)] h-10 rounded-[11px] px-3 text-[14px]";

const ACTIONS = [
  { id: "Create", label: "Criar conta" },
  { id: "Link", label: "Vincular" },
  { id: "Ignore", label: "Não importar" },
] as const;

type Draft = {
  action: BankAccountLinkAction;
  accountId: number | null;
  name: string;
  importFromDate: string;
};

type Props = {
  connection: BankConnection;
  onDone: () => void;
};

const isCard = (account: BankConnectionAccount) => account.externalType === "CREDIT";

const defaultDraft = (account: BankConnectionAccount): Draft => ({
  action: account.status === "Ignored" ? "Ignore" : "Create",
  accountId: null,
  name: account.name,
  importFromDate: firstDayOfMonthIso(),
});

/**
 * Decides, for every account the bank returned, where its transactions go: a new app
 * account, one the user already has (so what they typed by hand is matched, not
 * duplicated), or nowhere. Import starts at the chosen date.
 */
export function LinkAccountsForm({ connection, onDone }: Props) {
  const { data: appAccounts = [] } = useAccounts();
  const { mutateAsync, isPending } = useLinkBankAccounts();
  const [error, setError] = useState<string | null>(null);

  // Only accounts still waiting for a decision (or skipped before) are edited here; a
  // linked one can only be stopped.
  const editable = connection.accounts.filter((a) => a.status !== "Linked");
  const linked = connection.accounts.filter((a) => a.status === "Linked");

  // Accounts can arrive after the form opens (the bank is still sending them), so a
  // missing draft falls back to the default instead of being seeded once.
  const [drafts, setDrafts] = useState<Record<number, Draft>>({});
  const getDraft = (account: BankConnectionAccount) => drafts[account.id] ?? defaultDraft(account);
  const [stopped, setStopped] = useState<Set<number>>(new Set());

  // An app account can receive one bank account's transactions.
  const takenAccountIds = useMemo(() => {
    const taken = new Set<number>();
    linked.forEach((a) => a.accountId && !stopped.has(a.id) && taken.add(a.accountId));
    Object.values(drafts).forEach((d) => d.action === "Link" && d.accountId && taken.add(d.accountId));
    return taken;
  }, [linked, drafts, stopped]);

  const update = (account: BankConnectionAccount, patch: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [account.id]: { ...(current[account.id] ?? defaultDraft(account)), ...patch } }));

  const incomplete = editable.some((a) => {
    const draft = getDraft(a);
    return (draft.action === "Link" && !draft.accountId) || (draft.action === "Create" && !draft.name.trim());
  });

  const handleSubmit = async () => {
    setError(null);
    const items: LinkBankAccountItem[] = [
      ...editable.map((a) => {
        const draft = getDraft(a);
        return {
          bankAccountId: a.id,
          action: draft.action,
          accountId: draft.action === "Link" ? draft.accountId : null,
          name: draft.action === "Create" ? draft.name.trim() : null,
          importFromDate: draft.action === "Ignore" ? null : draft.importFromDate,
        };
      }),
      ...[...stopped].map((id) => ({ bankAccountId: id, action: "Ignore" as const })),
    ];

    if (items.length === 0) {
      onDone();
      return;
    }

    try {
      await mutateAsync({ connectionId: connection.id, accounts: items });
      onDone();
    } catch (err) {
      setError(openFinanceErrorMessage(err));
    }
  };

  if (connection.accounts.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-text-sub text-[14px] leading-relaxed">
          O banco ainda está enviando suas contas. Isso costuma levar menos de um minuto — esta tela se atualiza
          sozinha.
        </p>
        <div className="flex justify-center py-4">
          <Loader2 size={20} className="text-text-muted animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-text-sub text-[13px] leading-relaxed">
        Escolha para onde vão as transações de cada conta. Vincule a uma conta que você já usa no app para que os
        lançamentos feitos à mão sejam reconhecidos em vez de duplicados.
      </p>

      {editable.map((bankAccount) => {
        const draft = getDraft(bankAccount);
        const card = isCard(bankAccount);
        const typeConfig = ACCOUNT_TYPE_CONFIG[bankAccount.suggestedAccountType];
        const compatible = appAccounts.filter(
          (a) =>
            (a.type === "Credit") === card &&
            (!takenAccountIds.has(a.id) || a.id === draft.accountId),
        );

        return (
          <div key={bankAccount.id} className="border-border flex flex-col gap-3 rounded-[14px] border p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                style={{ backgroundColor: `${typeConfig.color}1a` }}
              >
                <typeConfig.Icon size={16} style={{ color: typeConfig.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-text truncate text-[14px] font-medium">{bankAccount.name}</p>
                <p className="text-text-muted text-[12px]">
                  {typeConfig.label}
                  {bankAccount.number ? ` · ${card ? "final " : ""}${bankAccount.number}` : ""}
                </p>
              </div>
              {bankAccount.externalBalance !== null && (
                <span className="font-money text-text-sub shrink-0 text-[12px]">
                  {formatCurrency(Math.abs(bankAccount.externalBalance) / 100)}
                </span>
              )}
            </div>

            <TabChips
              size="sm"
              items={ACTIONS}
              value={draft.action}
              onChange={(action) => update(bankAccount, { action })}
            />

            {draft.action === "Create" && (
              <input
                value={draft.name}
                maxLength={100}
                onChange={(e) => update(bankAccount, { name: e.target.value })}
                placeholder="Nome da conta"
                className={INPUT_CLASS}
              />
            )}

            {draft.action === "Link" && (
              compatible.length === 0 ? (
                <p className="text-text-muted text-[12px]">
                  Você não tem {card ? "um cartão" : "uma conta"} livre para vincular. Crie uma conta nova.
                </p>
              ) : (
                <Select
                  value={draft.accountId ? String(draft.accountId) : ""}
                  onValueChange={(v) => update(bankAccount, { accountId: Number(v) })}
                >
                  <SelectTrigger className="border-border bg-surface2 text-text !h-10 w-full rounded-[11px] px-3 text-[14px]">
                    <SelectValue>
                      {appAccounts.find((a) => a.id === draft.accountId)?.name ?? (
                        <span className="text-text-muted">Escolher conta</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {compatible.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            )}

            {draft.action !== "Ignore" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-text-sub text-[12px]">Importar transações a partir de</label>
                <DatePickerField
                  value={draft.importFromDate}
                  onChange={(importFromDate) => importFromDate && update(bankAccount, { importFromDate })}
                />
              </div>
            )}
          </div>
        );
      })}

      {linked.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-text-sub text-[12px] font-medium tracking-[0.04em] uppercase">Já vinculadas</p>
          {linked.map((bankAccount) => {
            const isStopped = stopped.has(bankAccount.id);
            return (
              <div key={bankAccount.id} className="border-border flex items-center gap-3 rounded-[12px] border px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-text truncate text-[13px] font-medium">{bankAccount.name}</p>
                  <p className="text-text-muted text-[12px]">
                    {isStopped ? "Deixará de importar" : `Importando para ${bankAccount.accountName ?? "—"}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setStopped((current) => {
                      const next = new Set(current);
                      if (next.has(bankAccount.id)) next.delete(bankAccount.id);
                      else next.add(bankAccount.id);
                      return next;
                    })
                  }
                  className="text-text-sub hover:text-text text-[12px] font-medium transition-colors"
                >
                  {isStopped ? "Manter" : "Parar de importar"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-red text-[13px]">{error}</p>}

      <Button className="w-full" size="xl" disabled={isPending || incomplete} onClick={handleSubmit}>
        {isPending ? <Loader2 size={15} className="animate-spin" /> : "Salvar e importar"}
      </Button>
    </div>
  );
}
