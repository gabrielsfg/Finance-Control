"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Loader2,
  X,
  ChevronRight,
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  Banknote,
  Building2,
  RefreshCw,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CategorySelectContent } from "@/components/shared/CategorySelectContent";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCreateRecurring } from "../hooks/useRecurrences";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { useCreateTransaction } from "@/features/transactions/hooks/useTransactions";
import type { AccountItem } from "@/lib/types/accounts.types";
import type { RecurrenceType } from "@/lib/types/transactions.types";
import type { TransactionType } from "@/lib/types/recurrences.types";

export type CreateMode = "recurring" | "installment";

type Props = {
  open: boolean;
  defaultMode?: CreateMode;
  onClose: () => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  Daily: "Diário",
  WorkDay: "Dia útil",
  Weekly: "Semanal",
  Biweekly: "Quinzenal",
  Monthly: "Mensal",
  Quarterly: "Trimestral",
  Semiannually: "Semestral",
  Annually: "Anual",
};

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-green/60 h-11 rounded-lg px-3.5 text-[15px]";

const TRIGGER_CLASS =
  "border-border bg-surface2 text-text w-full !h-11 rounded-lg px-3.5 text-[15px]";

const VALUE_WRAPPER_CLASS =
  "border-border bg-surface2 flex w-full items-center border h-11 rounded-lg";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const ACCOUNT_TYPE_LABELS: Record<AccountItem["type"], string> = {
  Checking: "Conta corrente",
  Savings: "Poupança",
  Credit: "Cartão de crédito",
  Debit: "Cartão de débito",
  Cash: "Dinheiro",
};

const DROPDOWN_PROPS = { alignItemWithTrigger: false, sideOffset: 4 } as const;

// ── Shared sub-components ─────────────────────────────────────────────────────

function AccountIcon({ type }: { type: AccountItem["type"] }) {
  const map: Record<AccountItem["type"], React.ReactNode> = {
    Checking: <Landmark size={14} />,
    Savings: <PiggyBank size={14} />,
    Credit: <CreditCard size={14} />,
    Debit: <Wallet size={14} />,
    Cash: <Banknote size={14} />,
  };
  return <>{map[type] ?? <Building2 size={14} />}</>;
}

function AccountSelectContent({ accounts }: { accounts: AccountItem[] }) {
  return (
    <SelectContent {...DROPDOWN_PROPS}>
      {accounts.map((a) => (
        <SelectItem key={a.id} value={String(a.id)}>
          <div className="flex items-center gap-2.5 py-0.5">
            <span className="text-text-muted">
              <AccountIcon type={a.type} />
            </span>
            <div className="flex flex-col">
              <span className="text-[14px] font-medium leading-tight">{a.name}</span>
              <span className="text-text-muted text-[11px] leading-tight">{ACCOUNT_TYPE_LABELS[a.type]}</span>
            </div>
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-text-sub text-[14px]">{label}</label>
      {children}
      {error && <p className="text-red text-[12px]">{error}</p>}
    </div>
  );
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const recurringSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  value: z.string().min(1, "Valor obrigatório"),
  type: z.enum(["Expense", "Income"]),
  subCategoryId: z.string().min(1, "Categoria obrigatória"),
  accountId: z.string().min(1, "Conta obrigatória"),
  recurrence: z.string().min(1, "Selecione a frequência"),
  startDate: z.string().min(1, "Data de início obrigatória"),
  endDate: z.string().optional(),
});

const installmentSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  value: z.string().min(1, "Valor obrigatório"),
  type: z.enum(["Expense", "Income"]),
  subCategoryId: z.string().min(1, "Categoria obrigatória"),
  accountId: z.string().min(1, "Conta obrigatória"),
  transactionDate: z.string().min(1, "Data obrigatória"),
  totalInstallments: z.string().refine(
    v => { const n = Number(v); return !isNaN(n) && n >= 2 && n <= 60; },
    { message: "Parcelas: 2 a 60" },
  ),
  paymentMethod: z.enum(["Debit", "Credit", ""]).optional(),
});

type RecurringValues = z.infer<typeof recurringSchema>;
type InstallmentValues = z.infer<typeof installmentSchema>;

// ── Create Recurring Form ─────────────────────────────────────────────────────

function RecurringCreateForm({ onClose }: { onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateRecurring();
  const { data: subcategories = [] } = useSubCategories();
  const { data: accounts = [] } = useAccounts();
  const [serverError, setServerError] = useState<string | null>(null);
  const [txType, setTxType] = useState<TransactionType>("Expense");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecurringValues>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      description: "",
      value: "",
      type: "Expense",
      subCategoryId: "",
      accountId: "",
      recurrence: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
    },
  });

  const subCategoryId = watch("subCategoryId");
  const accountId = watch("accountId");
  const recurrence = watch("recurrence");
  const startDate = watch("startDate") ?? "";
  const endDate = watch("endDate") ?? "";

  const subSelected = subcategories.find(s => String(s.id) === subCategoryId);
  const subLabel = subSelected ? (subSelected.emoji ? `${subSelected.emoji} ${subSelected.name}` : subSelected.name) : undefined;
  const accLabel = accounts.find(a => String(a.id) === accountId)?.name;
  const recLabel = recurrence ? RECURRENCE_LABELS[recurrence as RecurrenceType] : undefined;

  const onSubmit = async (values: RecurringValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        description: values.description,
        value: Math.round(parseFloat(values.value) * 100),
        type: txType,
        subCategoryId: Number(values.subCategoryId),
        accountId: Number(values.accountId),
        recurrence: values.recurrence as RecurrenceType,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        includeInBudget: false,
      });
      reset();
      onClose();
    } catch {
      setServerError("Erro ao criar assinatura. Tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        {/* Type toggle */}
        <div className="bg-surface2 flex rounded-xl p-1.5">
          {(["Expense", "Income"] as TransactionType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTxType(t); setValue("type", t); }}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-[15px] font-medium transition-colors",
                txType === t
                  ? t === "Income" ? "bg-green/15 text-green" : "bg-red/15 text-red"
                  : "text-text-muted hover:text-text-sub",
              )}
            >
              {t === "Income" ? "Receita" : "Despesa"}
            </button>
          ))}
        </div>

        <FormField label="Descrição" error={errors.description?.message}>
          <input
            {...register("description")}
            placeholder="Ex: Netflix, Spotify..."
            className={cn(INPUT_CLASS, errors.description && "border-red/60")}
          />
        </FormField>

        <FormField label="Valor mensal" error={errors.value?.message}>
          <div className={cn(VALUE_WRAPPER_CLASS, errors.value && "border-red/60")}>
            <span className="text-text-muted select-none pl-3.5 text-[15px]">R$</span>
            <input
              {...register("value")}
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="h-full flex-1 bg-transparent px-2 text-[15px] text-text outline-none placeholder:text-text-muted"
            />
          </div>
        </FormField>

        <FormField label="Frequência" error={errors.recurrence?.message}>
          <Select
            value={recurrence ?? ""}
            onValueChange={v => setValue("recurrence", v as string, { shouldValidate: true })}
          >
            <SelectTrigger className={cn(TRIGGER_CLASS, errors.recurrence && "border-red/60")}>
              <SelectValue>
                {recLabel ?? <span className="text-text-muted">Selecionar frequência</span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent {...DROPDOWN_PROPS}>
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map(r => (
                <SelectItem key={r} value={r}>{RECURRENCE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Data de início" error={errors.startDate?.message}>
          <DatePickerField
            value={startDate}
            onChange={v => setValue("startDate", v, { shouldValidate: true })}
            placeholder="Selecionar data"
          />
        </FormField>

        <FormField label="Data de encerramento (opcional)">
          <DatePickerField
            value={endDate}
            onChange={v => setValue("endDate", v)}
            placeholder="Sem data de encerramento"
            allowClear
          />
        </FormField>

        <FormField label="Conta" error={errors.accountId?.message}>
          <Select
            value={accountId ?? ""}
            onValueChange={v => setValue("accountId", v as string, { shouldValidate: true })}
          >
            <SelectTrigger className={cn(TRIGGER_CLASS, errors.accountId && "border-red/60")}>
              <SelectValue>
                {accLabel ?? <span className="text-text-muted">Selecionar conta</span>}
              </SelectValue>
            </SelectTrigger>
            <AccountSelectContent accounts={accounts} />
          </Select>
        </FormField>

        <FormField label="Categoria" error={errors.subCategoryId?.message}>
          <Select
            value={subCategoryId ?? ""}
            onValueChange={v => setValue("subCategoryId", v as string, { shouldValidate: true })}
          >
            <SelectTrigger className={cn(TRIGGER_CLASS, errors.subCategoryId && "border-red/60")}>
              <SelectValue>
                {subLabel ?? <span className="text-text-muted">Selecionar categoria</span>}
              </SelectValue>
            </SelectTrigger>
            <CategorySelectContent subcategories={subcategories} />
          </Select>
        </FormField>

        {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>

      <div className="border-border shrink-0 border-t px-6 py-4">
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Criar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Create Installment Form ───────────────────────────────────────────────────

function InstallmentCreateForm({ onClose }: { onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateTransaction();
  const { data: subcategories = [] } = useSubCategories();
  const { data: accounts = [] } = useAccounts();
  const [serverError, setServerError] = useState<string | null>(null);
  const [txType, setTxType] = useState<TransactionType>("Expense");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InstallmentValues>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      description: "",
      value: "",
      type: "Expense",
      subCategoryId: "",
      accountId: "",
      transactionDate: new Date().toISOString().slice(0, 10),
      totalInstallments: "",
      paymentMethod: "",
    },
  });

  const subCategoryId = watch("subCategoryId");
  const accountId = watch("accountId");
  const paymentMethod = watch("paymentMethod");
  const transactionDate = watch("transactionDate") ?? "";

  const subSelected = subcategories.find(s => String(s.id) === subCategoryId);
  const subLabel = subSelected ? (subSelected.emoji ? `${subSelected.emoji} ${subSelected.name}` : subSelected.name) : undefined;
  const accLabel = accounts.find(a => String(a.id) === accountId)?.name;
  const pmLabel = paymentMethod === "Debit" ? "Débito" : paymentMethod === "Credit" ? "Crédito" : undefined;

  const onSubmit = async (values: InstallmentValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        description: values.description,
        value: Math.round(parseFloat(values.value) * 100),
        type: txType,
        subCategoryId: Number(values.subCategoryId),
        accountId: Number(values.accountId),
        transactionDate: values.transactionDate,
        paymentType: "Installment",
        paymentMethod:
          values.paymentMethod === "Debit" || values.paymentMethod === "Credit"
            ? values.paymentMethod
            : null,
        totalInstallments: Number(values.totalInstallments),
        recurrence: null,
        includeInBudget: false,
        tags: [],
      });
      reset();
      onClose();
    } catch {
      setServerError("Erro ao criar parcelamento. Tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        {/* Type toggle */}
        <div className="bg-surface2 flex rounded-xl p-1.5">
          {(["Expense", "Income"] as TransactionType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => { setTxType(t); setValue("type", t); }}
              className={cn(
                "flex-1 rounded-lg py-2.5 text-[15px] font-medium transition-colors",
                txType === t
                  ? t === "Income" ? "bg-green/15 text-green" : "bg-red/15 text-red"
                  : "text-text-muted hover:text-text-sub",
              )}
            >
              {t === "Income" ? "Receita" : "Despesa"}
            </button>
          ))}
        </div>

        <FormField label="Descrição" error={errors.description?.message}>
          <input
            {...register("description")}
            placeholder="Ex: iPhone, Notebook..."
            className={cn(INPUT_CLASS, errors.description && "border-red/60")}
          />
        </FormField>

        <FormField label="Valor da parcela" error={errors.value?.message}>
          <div className={cn(VALUE_WRAPPER_CLASS, errors.value && "border-red/60")}>
            <span className="text-text-muted select-none pl-3.5 text-[15px]">R$</span>
            <input
              {...register("value")}
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              className="h-full flex-1 bg-transparent px-2 text-[15px] text-text outline-none placeholder:text-text-muted"
            />
          </div>
        </FormField>

        <FormField label="Número de parcelas" error={errors.totalInstallments?.message}>
          <input
            {...register("totalInstallments")}
            type="number"
            min="2"
            max="60"
            placeholder="Ex: 12"
            className={cn(INPUT_CLASS, errors.totalInstallments && "border-red/60")}
          />
        </FormField>

        <FormField label="Data da primeira parcela" error={errors.transactionDate?.message}>
          <DatePickerField
            value={transactionDate}
            onChange={v => setValue("transactionDate", v, { shouldValidate: true })}
            placeholder="Selecionar data"
          />
        </FormField>

        <FormField label="Conta" error={errors.accountId?.message}>
          <Select
            value={accountId ?? ""}
            onValueChange={v => setValue("accountId", v as string, { shouldValidate: true })}
          >
            <SelectTrigger className={cn(TRIGGER_CLASS, errors.accountId && "border-red/60")}>
              <SelectValue>
                {accLabel ?? <span className="text-text-muted">Selecionar conta</span>}
              </SelectValue>
            </SelectTrigger>
            <AccountSelectContent accounts={accounts} />
          </Select>
        </FormField>

        <FormField label="Categoria" error={errors.subCategoryId?.message}>
          <Select
            value={subCategoryId ?? ""}
            onValueChange={v => setValue("subCategoryId", v as string, { shouldValidate: true })}
          >
            <SelectTrigger className={cn(TRIGGER_CLASS, errors.subCategoryId && "border-red/60")}>
              <SelectValue>
                {subLabel ?? <span className="text-text-muted">Selecionar categoria</span>}
              </SelectValue>
            </SelectTrigger>
            <CategorySelectContent subcategories={subcategories} />
          </Select>
        </FormField>

        <FormField label="Forma de pagamento">
          <Select
            value={paymentMethod ?? ""}
            onValueChange={v => setValue("paymentMethod", v as "Debit" | "Credit" | "")}
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue>
                {pmLabel ?? <span className="text-text-muted">Opcional</span>}
              </SelectValue>
            </SelectTrigger>
            <SelectContent {...DROPDOWN_PROPS}>
              <SelectItem value="Debit">
                <div className="flex items-center gap-2.5 py-0.5">
                  <span className="text-blue bg-blue/10 flex h-7 w-7 items-center justify-center rounded-md">
                    <Wallet size={13} />
                  </span>
                  <span className="text-[14px] font-medium">Débito</span>
                </div>
              </SelectItem>
              <SelectItem value="Credit">
                <div className="flex items-center gap-2.5 py-0.5">
                  <span className="text-purple bg-purple/10 flex h-7 w-7 items-center justify-center rounded-md">
                    <CreditCard size={13} />
                  </span>
                  <span className="text-[14px] font-medium">Crédito</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>

      <div className="border-border shrink-0 border-t px-6 py-4">
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Criar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export function RecurrenceCreateDrawer({ open, defaultMode = "recurring", onClose }: Props) {
  const [mode, setMode] = useState<CreateMode>(defaultMode);

  useEffect(() => {
    if (open) setMode(defaultMode);
  }, [open, defaultMode]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "pointer-events-auto backdrop-blur-sm bg-black/40" : "pointer-events-none opacity-0",
        )}
      />

      <div
        className={cn(
          "bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <h2 className="font-display font-600 text-text text-[17px]">Nova Recorrência</h2>
          <button
            onClick={onClose}
            title="Fechar"
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="border-border border-b px-6 py-3">
          <div className="bg-surface2 flex rounded-xl p-1">
            <button
              type="button"
              onClick={() => setMode("recurring")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-medium transition-colors",
                mode === "recurring" ? "bg-purple/15 text-purple" : "text-text-muted hover:text-text-sub",
              )}
            >
              <RefreshCw size={13} />
              Assinatura
            </button>
            <button
              type="button"
              onClick={() => setMode("installment")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-medium transition-colors",
                mode === "installment" ? "bg-blue/15 text-blue" : "text-text-muted hover:text-text-sub",
              )}
            >
              <Layers size={13} />
              Parcelamento
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex min-h-0 flex-1 flex-col">
          {mode === "recurring" && <RecurringCreateForm onClose={onClose} />}
          {mode === "installment" && <InstallmentCreateForm onClose={onClose} />}
        </div>
      </div>
    </>
  );
}
