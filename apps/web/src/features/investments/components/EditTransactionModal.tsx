"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { TagInput } from "@/features/transactions/components/TagInput";
import { useUpdateTransaction } from "@/features/investments/hooks/useInvestments";
import type {
  InvestmentOperation,
  InvestmentTransaction,
} from "@/lib/types/investments.types";

const INPUT_CLASS =
  "w-full h-11 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 text-[15px] text-[var(--text)] outline-none transition-colors placeholder:text-[var(--text-sub)] focus:border-[var(--brand-cobalt)]";

const TRIGGER_CLASS =
  "w-full !h-11 rounded-[13px] border border-[var(--border-color)] bg-[var(--surface)] px-3.5 text-[15px] text-[var(--text)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[13px] font-medium text-[var(--text-sub)]">{label}</label>
      {children}
    </div>
  );
}

type Props = {
  /** The operation being edited, or null when the dialog is closed. */
  transaction: InvestmentTransaction | null;
  onClose: () => void;
};

/**
 * Editing rewrites the operation server-side as a delete + re-register, so the position
 * and the linked cash transaction are rebuilt together. The asset itself is not editable:
 * an operation booked against the wrong ticker belongs to another position, and deleting
 * it is the honest correction.
 */
export const EditTransactionModal = ({ transaction, onClose }: Props) => (
  <Dialog open={transaction !== null} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="sm:max-w-md">
      {/* Keyed so a different operation mounts a fresh form instead of syncing state. */}
      {transaction && <EditForm key={transaction.id} transaction={transaction} onClose={onClose} />}
    </DialogContent>
  </Dialog>
);

function EditForm({
  transaction,
  onClose,
}: {
  transaction: InvestmentTransaction;
  onClose: () => void;
}) {
  const { data: accounts = [] } = useAccounts();
  const { mutateAsync, isPending } = useUpdateTransaction();
  const [serverError, setServerError] = useState<string | null>(null);

  const [operation, setOperation] = useState<InvestmentOperation>(transaction.operation);
  const [date, setDate] = useState(transaction.date);
  const [quantity, setQuantity] = useState(String(transaction.quantity));
  const [unitPrice, setUnitPrice] = useState((transaction.unitPrice / 100).toFixed(2));
  const [otherCosts, setOtherCosts] = useState(
    transaction.otherCosts > 0 ? (transaction.otherCosts / 100).toFixed(2) : "",
  );
  const [accountId, setAccountId] = useState(String(transaction.accountId));
  const [createLinkedTransaction, setCreateLinkedTransaction] = useState(
    transaction.hasLinkedTransaction,
  );
  const [includeInBudget, setIncludeInBudget] = useState(transaction.includeInBudget);
  const [tags, setTags] = useState<string[]>(transaction.tags);

  const quantityNumber = parseFloat(quantity.replace(",", ".")) || 0;
  const unitPriceCents = Math.round((parseFloat(unitPrice) || 0) * 100);
  const otherCostsCents = Math.round((parseFloat(otherCosts) || 0) * 100);
  const totalValue = quantityNumber * unitPriceCents + otherCostsCents;

  const canSubmit =
    quantityNumber > 0 && unitPriceCents > 0 && date !== "" && accountId !== "" && !isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setServerError(null);
    try {
      await mutateAsync({
        id: transaction.id,
        investmentId: transaction.investmentId,
        dto: {
          operation,
          date,
          quantity: quantityNumber,
          unitPrice: unitPriceCents,
          otherCosts: otherCostsCents,
          accountId: Number(accountId),
          createLinkedTransaction,
          includeInBudget: createLinkedTransaction && includeInBudget,
          tags: createLinkedTransaction ? tags : [],
        },
      });
      onClose();
    } catch {
      setServerError("Erro ao salvar a operação. Verifique os dados e tente novamente.");
    }
  };

  const accountName = accounts.find((a) => String(a.id) === accountId)?.name;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-[16px]">Editar operação</DialogTitle>
        <DialogDescription className="text-text-sub text-[13px]">
          <span className="font-mono">{transaction.ticker}</span> · a posição e o lançamento
          em conta são recalculados.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        {/* Operation toggle */}
        <div className="bg-surface2 flex rounded-xl p-1.5">
          {(["Buy", "Sell"] as InvestmentOperation[]).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setOperation(op)}
              className={cn(
                "flex-1 rounded-lg py-2 text-[14px] font-medium transition-colors",
                operation === op
                  ? op === "Buy"
                    ? "bg-green/15 text-green"
                    : "bg-red/15 text-red"
                  : "text-text-muted hover:text-text-sub",
              )}
            >
              {op === "Buy" ? "Compra" : "Venda"}
            </button>
          ))}
        </div>

        <Field label="Data">
          <DatePickerField value={date} onChange={setDate} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantidade">
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^\d.,]/g, ""))}
              inputMode="decimal"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Preço unitário (R$)">
            <CurrencyInput value={unitPrice} onChange={setUnitPrice} className={INPUT_CLASS} />
          </Field>
        </div>

        <Field label="Outros custos (R$)">
          <CurrencyInput value={otherCosts} onChange={setOtherCosts} className={INPUT_CLASS} />
        </Field>

        <Field label="Conta">
          <Select value={accountId} onValueChange={(v) => setAccountId(v as string)}>
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue>
                {accountName ?? <span className="text-text-muted">Selecionar conta</span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} sideOffset={4}>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <button
          type="button"
          onClick={() => setCreateLinkedTransaction((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-[13px] border p-3.5 text-left transition-colors",
            createLinkedTransaction
              ? "border-green/40 bg-green/5"
              : "border-[var(--border-color)] bg-[var(--surface2)]",
          )}
        >
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] font-bold",
              createLinkedTransaction
                ? "border-green bg-green text-black"
                : "border-[var(--border-color)] text-transparent",
            )}
          >
            ✓
          </span>
          <span className="text-[13px] text-[var(--text)]">
            Movimentar o saldo da conta
            <span className="block text-[12px] text-[var(--text-sub)]">
              Desmarque para uma posição comprada fora deste controle
            </span>
          </span>
        </button>

        {createLinkedTransaction && (
          <>
            <button
              type="button"
              onClick={() => setIncludeInBudget((v) => !v)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[13px] border p-3.5 text-left transition-colors",
                includeInBudget
                  ? "border-green/40 bg-green/5"
                  : "border-[var(--border-color)] bg-[var(--surface2)]",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] font-bold",
                  includeInBudget
                    ? "border-green bg-green text-black"
                    : "border-[var(--border-color)] text-transparent",
                )}
              >
                ✓
              </span>
              <span className="text-[13px] text-[var(--text)]">Incluir no orçamento</span>
            </button>

            <Field label="Tags">
              <TagInput value={tags} onChange={setTags} />
            </Field>
          </>
        )}

        {totalValue > 0 && (
          <p className="text-[13px] text-[var(--text-sub)]">
            Total:{" "}
            <span className="font-money font-medium text-[var(--text)]">
              {formatCurrency(totalValue / 100)}
            </span>
          </p>
        )}

        {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isPending ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
        </Button>
      </DialogFooter>
    </>
  );
}
