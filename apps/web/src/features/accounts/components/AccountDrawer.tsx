"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  X, Loader2, Pencil, Trash2, Star, CreditCard, Landmark, PiggyBank,
  Wallet, Banknote, SlidersHorizontal, Check,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useCreateAccount, useUpdateAccount } from "@/features/accounts/hooks/useAccounts";
import type { AccountItem, AccountType } from "@/lib/types/accounts.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AccountDrawerMode = "create" | "detail" | "edit";

type Props = {
  open: boolean;
  mode: AccountDrawerMode;
  account?: AccountItem | null;
  onClose: () => void;
  onDeleteRequest: (account: AccountItem) => void;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const CREDIT_TYPES: AccountType[] = ["Credit", "Checking"];

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Checking: "Conta Corrente",
  Savings:  "Poupança",
  Credit:   "Cartão de Crédito",
  Debit:    "Débito",
  Cash:     "Dinheiro",
};

const ACCOUNT_TYPE_CONFIG: Record<AccountType, { color: string; Icon: React.ElementType }> = {
  Checking: { color: "#4A9EFF", Icon: Landmark },
  Savings:  { color: "#00C98D", Icon: PiggyBank },
  Credit:   { color: "#7C6FE0", Icon: CreditCard },
  Debit:    { color: "#F5A623", Icon: Wallet },
  Cash:     { color: "#F5CE42", Icon: Banknote },
};

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-green/60 h-11 rounded-lg px-3.5 text-[15px]";

const TRIGGER_CLASS =
  "border-border bg-surface2 text-text w-full !h-11 rounded-lg px-3.5 text-[15px]";

// ── Schemas ───────────────────────────────────────────────────────────────────

const baseSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    type: z.enum(["Debit", "Checking", "Savings", "Credit", "Cash"]),
    goalAmount: z.string().optional(),
    isDefaultAccount: z.boolean(),
    billingDueDay: z.string().optional(),
    creditLimit: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (CREDIT_TYPES.includes(data.type as AccountType)) {
      if (!data.billingDueDay?.trim())
        ctx.addIssue({ code: "custom", path: ["billingDueDay"], message: "Obrigatório" });
      else {
        const day = Number(data.billingDueDay);
        if (isNaN(day) || day < 1 || day > 31)
          ctx.addIssue({ code: "custom", path: ["billingDueDay"], message: "Dia inválido (1-31)" });
      }
      if (!data.creditLimit?.trim())
        ctx.addIssue({ code: "custom", path: ["creditLimit"], message: "Obrigatório" });
    }
  });

const createSchema = baseSchema.extend({ initialBalance: z.string().optional() });
const editSchema = baseSchema.extend({ newBalance: z.string().optional() });

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ── Shared helpers ─────────────────────────────────────────────────────────────

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-text-sub text-[14px]">{label}</label>
      {children}
      {error && <p className="text-red text-[12px]">{error}</p>}
    </div>
  );
}

function DefaultAccountToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "border-border flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-colors",
        checked ? "border-green/40 bg-green/5" : "bg-surface2 hover:bg-surface2/80",
      )}
    >
      <span className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
        checked ? "border-green bg-green text-black" : "border-border text-transparent",
      )}>
        <Check size={12} strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className={cn("text-[14px] font-medium", checked ? "text-green" : "text-text")}>
          Conta padrão
        </span>
        <span className="text-text-muted text-[12px]">
          Usada por padrão ao criar transações
        </span>
      </div>
      <Star size={15} className={cn("ml-auto shrink-0", checked ? "text-yellow fill-yellow" : "text-text-muted")} />
    </button>
  );
}

function AccountTypeSelect({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (v: AccountType) => void;
}) {
  const cfg = ACCOUNT_TYPE_CONFIG[value];
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v as AccountType)}>
      <SelectTrigger className={TRIGGER_CLASS}>
        <SelectValue>
          {cfg ? (
            <div className="flex items-center gap-2.5">
              <cfg.Icon size={14} style={{ color: cfg.color }} />
              <span>{ACCOUNT_TYPE_LABELS[value]}</span>
            </div>
          ) : (
            <span className="text-text-muted">Selecionar tipo</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => {
          const cfg = ACCOUNT_TYPE_CONFIG[t];
          const Icon = cfg.Icon;
          return (
            <SelectItem key={t} value={t}>
              <div className="flex items-center gap-2.5 py-0.5">
                <Icon size={14} style={{ color: cfg.color }} />
                <span>{ACCOUNT_TYPE_LABELS[t]}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({ onClose }: { onClose: () => void }) {
  const { mutateAsync, isPending } = useCreateAccount();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<CreateValues>({
      resolver: zodResolver(createSchema),
      defaultValues: {
        name: "", type: "Checking", isDefaultAccount: false,
        initialBalance: "", goalAmount: "", billingDueDay: "", creditLimit: "",
      },
    });

  const accountType = watch("type") as AccountType;
  const showCreditFields = CREDIT_TYPES.includes(accountType);

  const onSubmit = async (values: CreateValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        name: values.name,
        type: values.type as AccountType,
        isDefaultAccount: values.isDefaultAccount,
        initialBalance: values.initialBalance ? Math.round(parseFloat(values.initialBalance) * 100) : null,
        goalAmount: values.goalAmount ? Math.round(parseFloat(values.goalAmount) * 100) : null,
        billingDueDay: showCreditFields && values.billingDueDay ? Number(values.billingDueDay) : null,
        creditLimit: showCreditFields && values.creditLimit ? Math.round(parseFloat(values.creditLimit) * 100) : null,
      });
      reset();
      onClose();
    } catch {
      setServerError("Erro ao criar conta. Verifique os dados e tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <FormField label="Nome" error={errors.name?.message}>
          <input
            {...register("name")}
            placeholder="Ex: Nubank, Bradesco..."
            className={cn(INPUT_CLASS, errors.name && "border-red/60")}
          />
        </FormField>

        <FormField label="Tipo">
          <AccountTypeSelect
            value={accountType}
            onChange={(v) => setValue("type", v, { shouldValidate: true })}
          />
        </FormField>

        {showCreditFields && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Limite (R$)" error={errors.creditLimit?.message}>
              <input
                {...register("creditLimit")}
                type="number" step="0.01" min="0" placeholder="5000,00"
                className={cn(INPUT_CLASS, errors.creditLimit && "border-red/60")}
              />
            </FormField>
            <FormField label="Vencimento (dia)" error={errors.billingDueDay?.message}>
              <input
                {...register("billingDueDay")}
                type="number" min="1" max="31" placeholder="15"
                className={cn(INPUT_CLASS, errors.billingDueDay && "border-red/60")}
              />
            </FormField>
          </div>
        )}

        <FormField label="Saldo inicial (R$)">
          <input
            {...register("initialBalance")}
            type="number" step="0.01" placeholder="0,00"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField label="Meta de saldo (R$) — opcional">
          <input
            {...register("goalAmount")}
            type="number" step="0.01" placeholder="0,00"
            className={INPUT_CLASS}
          />
        </FormField>

        <DefaultAccountToggle
          checked={watch("isDefaultAccount")}
          onChange={(v) => setValue("isDefaultAccount", v)}
        />

        {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>

      <div className="border-border shrink-0 border-t px-6 py-4">
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Criar conta"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Edit form ─────────────────────────────────────────────────────────────────

function EditForm({ account, onClose }: { account: AccountItem; onClose: () => void }) {
  const { mutateAsync, isPending } = useUpdateAccount();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<EditValues>({ resolver: zodResolver(editSchema) });

  useEffect(() => {
    reset({
      name: account.name,
      type: account.type,
      isDefaultAccount: account.isDefaultAccount,
      goalAmount: "",
      billingDueDay: "",
      creditLimit: account.creditLimit ? String(account.creditLimit / 100) : "",
      newBalance: "",
    });
    setServerError(null);
  }, [account, reset]);

  const accountType = watch("type") as AccountType;
  const showCreditFields = CREDIT_TYPES.includes(accountType);
  const newBalanceValue = watch("newBalance");

  const onSubmit = async (values: EditValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        id: account.id,
        data: {
          id: account.id,
          name: values.name,
          type: values.type as AccountType,
          isDefaultAccount: values.isDefaultAccount,
          goalAmount: values.goalAmount ? Math.round(parseFloat(values.goalAmount) * 100) : null,
          billingDueDay: showCreditFields && values.billingDueDay ? Number(values.billingDueDay) : null,
          creditLimit: showCreditFields && values.creditLimit ? Math.round(parseFloat(values.creditLimit) * 100) : null,
          newBalance: values.newBalance?.trim() ? Math.round(parseFloat(values.newBalance) * 100) : null,
        },
      });
      onClose();
    } catch {
      setServerError("Erro ao atualizar conta. Tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <FormField label="Nome" error={errors.name?.message}>
          <input
            {...register("name")}
            className={cn(INPUT_CLASS, errors.name && "border-red/60")}
          />
        </FormField>

        <FormField label="Tipo">
          <AccountTypeSelect
            value={accountType}
            onChange={(v) => setValue("type", v, { shouldValidate: true })}
          />
        </FormField>

        {showCreditFields && (
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Limite (R$)" error={errors.creditLimit?.message}>
              <input
                {...register("creditLimit")}
                type="number" step="0.01" min="0" placeholder="5000,00"
                className={cn(INPUT_CLASS, errors.creditLimit && "border-red/60")}
              />
            </FormField>
            <FormField label="Vencimento (dia)" error={errors.billingDueDay?.message}>
              <input
                {...register("billingDueDay")}
                type="number" min="1" max="31" placeholder="15"
                className={cn(INPUT_CLASS, errors.billingDueDay && "border-red/60")}
              />
            </FormField>
          </div>
        )}

        <FormField label="Meta de saldo (R$) — opcional">
          <input
            {...register("goalAmount")}
            type="number" step="0.01" placeholder="0,00"
            className={INPUT_CLASS}
          />
        </FormField>

        <DefaultAccountToggle
          checked={watch("isDefaultAccount")}
          onChange={(v) => setValue("isDefaultAccount", v)}
        />

        {/* Balance adjustment */}
        <div className="border-border rounded-xl border p-4">
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-text-muted" />
            <span className="text-text text-[13px] font-medium">Ajustar saldo</span>
          </div>
          <FormField label={`Novo saldo (R$) — atual: ${formatCurrency(account.currentAmount / 100)}`}>
            <input
              {...register("newBalance")}
              type="number" step="0.01" placeholder="0,00"
              className={INPUT_CLASS}
            />
          </FormField>
          {newBalanceValue?.trim() && (
            <p className="text-text-muted mt-1.5 text-[12px]">
              {(() => {
                const diff = Math.round(parseFloat(newBalanceValue) * 100) - account.currentAmount;
                if (diff === 0) return "Sem diferença";
                return `Uma transação de ${formatCurrency(Math.abs(diff) / 100)} será criada automaticamente (${diff > 0 ? "receita" : "despesa"})`;
              })()}
            </p>
          )}
        </div>

        {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>

      <div className="border-border shrink-0 border-t px-6 py-4">
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────

function DetailView({
  account,
  onEdit,
  onDelete,
}: {
  account: AccountItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { color, Icon } = ACCOUNT_TYPE_CONFIG[account.type];
  const isNegative = account.currentAmount < 0;
  const isCredit = account.type === "Credit";
  const creditUsed = isCredit ? Math.abs(account.currentAmount) : 0;
  const creditLimit = isCredit && account.creditLimit ? account.creditLimit : 0;
  const creditUsedPercent = creditLimit > 0 ? Math.min((creditUsed / creditLimit) * 100, 100) : 0;
  const creditBarColor = creditUsedPercent >= 90 ? "#F25F5C" : creditUsedPercent >= 70 ? "#F5A623" : "#7C6FE0";

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-[16px]"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon size={28} style={{ color }} strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-text font-display font-600 text-[20px]">{account.name}</p>
          <p className="text-text-muted mt-0.5 text-[13px]">{ACCOUNT_TYPE_LABELS[account.type]}</p>
        </div>
        {account.isDefaultAccount && (
          <span className="bg-yellow/10 text-yellow border-yellow/25 flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-medium">
            <Star size={11} className="fill-yellow" />
            Conta padrão
          </span>
        )}
      </div>

      {/* Balance card */}
      <div className="border-border bg-surface2 rounded-xl border p-5">
        <p className="text-text-muted mb-1 text-[11px] tracking-[0.05em] uppercase">
          {isCredit ? "Fatura atual" : "Saldo atual"}
        </p>
        <p
          className="font-money font-600 text-[28px] tracking-tight"
          style={{ color: isNegative ? "var(--red)" : isCredit ? "var(--purple)" : "var(--text)" }}
        >
          {formatCurrency(Math.abs(account.currentAmount / 100))}
        </p>

        {/* Credit progress */}
        {isCredit && creditLimit > 0 && (
          <div className="mt-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-text-muted">Limite utilizado</span>
              <span className="font-mono font-medium" style={{ color: creditBarColor }}>
                {formatCurrency(creditUsed / 100)}{" "}
                <span className="text-text-muted font-normal">/ {formatCurrency(creditLimit / 100)}</span>
              </span>
            </div>
            <div className="bg-surface h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${creditUsedPercent}%`, backgroundColor: creditBarColor }}
              />
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-text-muted">{creditUsedPercent.toFixed(0)}% usado</span>
              <span className="text-text-muted">
                {formatCurrency(Math.max(0, creditLimit - creditUsed) / 100)} disponível
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button className="w-full" onClick={onEdit}>
          <Pencil size={15} />
          Editar conta
        </Button>
        <Button className="w-full" variant="destructive" onClick={onDelete}>
          <Trash2 size={15} />
          Excluir conta
        </Button>
      </div>
    </div>
  );
}

// ── Drawer ────────────────────────────────────────────────────────────────────

export function AccountDrawer({ open, mode, account, onClose, onDeleteRequest }: Props) {
  const [innerMode, setInnerMode] = useState<AccountDrawerMode>(mode);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInnerMode(mode);
  }, [mode, open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
  };

  const titles: Record<AccountDrawerMode, string> = {
    create: "Nova Conta",
    detail: "Detalhes",
    edit: "Editar Conta",
  };

  const showBack = innerMode === "edit" && mode !== "edit";

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-all duration-300",
          open ? "pointer-events-auto backdrop-blur-sm bg-black/40" : "pointer-events-none opacity-0",
        )}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "bg-surface border-border fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-2">
            {showBack && (
              <button
                onClick={() => setInnerMode("detail")}
                className="text-text-muted hover:text-text mr-1 transition-colors"
              >
                ←
              </button>
            )}
            <h2 className="font-display font-600 text-text text-[17px]">{titles[innerMode]}</h2>
          </div>
          <button
            onClick={onClose}
            title="Fechar"
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col">
          {innerMode === "create" && <CreateForm onClose={onClose} />}

          {innerMode === "detail" && account && (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <DetailView
                account={account}
                onEdit={() => setInnerMode("edit")}
                onDelete={() => onDeleteRequest(account)}
              />
            </div>
          )}

          {innerMode === "edit" && account && (
            <EditForm account={account} onClose={onClose} />
          )}
        </div>
      </div>
    </>
  );
}
