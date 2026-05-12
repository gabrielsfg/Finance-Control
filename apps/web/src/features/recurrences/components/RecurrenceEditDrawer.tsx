"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Loader2,
  X,
  ChevronRight,
  Calendar as CalendarIcon,
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  Banknote,
  Building2,
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
import { getCategoryColor } from "@/lib/config/categoryColors";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useUpdateRecurring } from "../hooks/useRecurrences";
import { useUpdateTransaction } from "@/features/transactions/hooks/useTransactions";
import type { AccountItem } from "@/lib/types/accounts.types";
import type { SubCategoryItem } from "@/lib/types/transactions.types";
import type {
  RecurringItem,
  InstallmentItem,
} from "@/lib/types/recurrences.types";

export type EditTarget =
  | { kind: "recurring"; item: RecurringItem }
  | { kind: "installment"; item: InstallmentItem };

type Props = {
  open: boolean;
  target: EditTarget | null;
  onClose: () => void;
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

const DROPDOWN_PROPS = { alignItemWithTrigger: false, sideOffset: 4 } as const;

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

function CategorySelectContent({ subcategories }: { subcategories: SubCategoryItem[] }) {
  const grouped = subcategories.reduce<Record<string, { id: number; name: string; color: string; catColor: string; catId: number }[]>>(
    (acc, sub) => {
      const catColor = getCategoryColor(sub.categoryColor, sub.categoryName);
      if (!acc[sub.categoryName]) acc[sub.categoryName] = [];
      acc[sub.categoryName].push({ id: sub.id, name: sub.name, color: catColor, catColor, catId: sub.categoryId });
      return acc;
    },
    {},
  );

  return (
    <SelectContent className="max-h-72" {...DROPDOWN_PROPS}>
      {Object.entries(grouped).map(([catName, subs], groupIdx) => (
        <div key={catName}>
          {groupIdx > 0 && <div className="border-border mx-2 my-1 border-t" />}
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: subs[0].catColor }}
            />
            <span className="text-text-sub text-[11px] font-semibold uppercase tracking-wider">
              {catName}
            </span>
          </div>
          {subs.map((s) => (
            <SelectItem key={s.id} value={String(s.id)} className="pl-6">
              <div className="flex items-center gap-2.5 py-0.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-full opacity-70"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-[14px]">{s.name}</span>
              </div>
            </SelectItem>
          ))}
        </div>
      ))}
    </SelectContent>
  );
}

// ── Single-date calendar picker (popover trigger + grid) ──────────────────────
function DatePickerField({
  value,
  onChange,
  placeholder,
  allowClear,
}: {
  value: string; // YYYY-MM-DD or ""
  onChange: (next: string) => void;
  placeholder?: string;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? today.getMonth());

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [open, value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function pick(dateStr: string) {
    onChange(dateStr);
    setOpen(false);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const month = String(viewMonth + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    cells.push(`${viewYear}-${month}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);
  const label = value
    ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : placeholder ?? "Selecionar data";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          INPUT_CLASS,
          "flex items-center justify-between gap-2 text-left",
          !value && "text-text-muted",
        )}
      >
        <span className="flex items-center gap-2.5">
          <CalendarIcon size={15} className="text-text-muted shrink-0" />
          <span className={cn("text-[15px]", value ? "text-text" : "text-text-muted")}>{label}</span>
        </span>
        {allowClear && value && (
          <span
            role="button"
            aria-label="Limpar data"
            tabIndex={0}
            onClick={e => { e.stopPropagation(); onChange(""); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onChange(""); } }}
            className="text-text-muted hover:text-text"
          >
            <X size={14} />
          </span>
        )}
      </button>

      {open && (
        <div className="border-border bg-surface absolute left-0 top-12 z-[70] rounded-xl border p-4 shadow-2xl" style={{ minWidth: 280 }}>
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3"
            >
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <span className="text-text text-[13px] font-semibold">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Week headers */}
          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-text-muted py-1 text-center text-[10px] font-medium">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} />;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;
              return (
                <div key={dateStr} className="flex items-center justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => pick(dateStr)}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-[13px] transition-all",
                      isSelected
                        ? "bg-green text-black font-bold"
                        : isToday
                          ? "border-border border text-text font-semibold"
                          : "text-text-sub hover:bg-surface3 hover:text-text",
                    )}
                  >
                    {parseInt(dateStr.slice(8))}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const recurringSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  value: z.string().min(1, "Valor obrigatório"),
  subCategoryId: z.string().min(1, "Categoria obrigatória"),
  accountId: z.string().min(1, "Conta obrigatória"),
  endDate: z.string().optional(),
});

const installmentSchema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  value: z.string().min(1, "Valor obrigatório"),
  transactionDate: z.string().min(1, "Data obrigatória"),
  subCategoryId: z.string().min(1, "Categoria obrigatória"),
  accountId: z.string().min(1, "Conta obrigatória"),
  paymentMethod: z.enum(["Debit", "Credit", ""]).optional(),
  totalInstallments: z.string().refine(
    (v) => {
      const n = Number(v);
      return !isNaN(n) && n >= 2 && n <= 60;
    },
    { message: "Parcelas: 2 a 60" },
  ),
});

type RecurringValues = z.infer<typeof recurringSchema>;
type InstallmentValues = z.infer<typeof installmentSchema>;

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-text-sub text-[14px]">{label}</label>
      {children}
      {error && <p className="text-red text-[12px]">{error}</p>}
    </div>
  );
}

function RecurringEditForm({
  item,
  onClose,
}: {
  item: RecurringItem;
  onClose: () => void;
}) {
  const { mutateAsync, isPending } = useUpdateRecurring();
  const { data: subcategories = [] } = useSubCategories();
  const { data: accounts = [] } = useAccounts();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecurringValues>({ resolver: zodResolver(recurringSchema) });

  useEffect(() => {
    reset({
      description: item.description,
      value: String(item.value / 100),
      subCategoryId: String(item.subCategoryId),
      accountId: String(item.accountId),
      endDate: item.endDate ? item.endDate.slice(0, 10) : "",
    });
    setServerError(null);
  }, [item, reset]);

  const subCategoryId = watch("subCategoryId");
  const accountId = watch("accountId");
  const endDate = watch("endDate") ?? "";
  const subLabel = subcategories.find((s) => String(s.id) === subCategoryId)?.name;
  const accLabel = accounts.find((a) => String(a.id) === accountId)?.name;

  const onSubmit = async (values: RecurringValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        id: item.id,
        data: {
          subCategoryId: Number(values.subCategoryId),
          accountId: Number(values.accountId),
          value: Math.round(parseFloat(values.value) * 100),
          description: values.description,
          endDate: values.endDate || undefined,
        },
      });
      onClose();
    } catch {
      setServerError("Erro ao atualizar assinatura. Tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <FormField label="Descrição" error={errors.description?.message}>
          <input
            {...register("description")}
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

        <FormField label="Conta" error={errors.accountId?.message}>
          <Select
            value={accountId ?? ""}
            onValueChange={(v) => setValue("accountId", v as string, { shouldValidate: true })}
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
            onValueChange={(v) => setValue("subCategoryId", v as string, { shouldValidate: true })}
          >
            <SelectTrigger className={cn(TRIGGER_CLASS, errors.subCategoryId && "border-red/60")}>
              <SelectValue>
                {subLabel ?? <span className="text-text-muted">Selecionar categoria</span>}
              </SelectValue>
            </SelectTrigger>
            <CategorySelectContent subcategories={subcategories} />
          </Select>
        </FormField>

        <FormField label="Encerramento (opcional)">
          <DatePickerField
            value={endDate}
            onChange={(v) => setValue("endDate", v)}
            placeholder="Sem data de encerramento"
            allowClear
          />
        </FormField>

        {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>

      <div className="border-border shrink-0 border-t px-6 py-4">
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function InstallmentEditForm({
  item,
  onClose,
}: {
  item: InstallmentItem;
  onClose: () => void;
}) {
  const { mutateAsync, isPending } = useUpdateTransaction();
  const { data: subcategories = [] } = useSubCategories();
  const { data: accounts = [] } = useAccounts();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<InstallmentValues>({ resolver: zodResolver(installmentSchema) });

  useEffect(() => {
    reset({
      description: item.description,
      value: String(item.value / 100),
      transactionDate: item.transactionDate.slice(0, 10),
      subCategoryId: String(item.subCategoryId),
      accountId: String(item.accountId),
      paymentMethod: item.paymentMethod ?? "",
      totalInstallments: String(item.totalInstallments),
    });
    setServerError(null);
  }, [item, reset]);

  const subCategoryId = watch("subCategoryId");
  const accountId = watch("accountId");
  const paymentMethod = watch("paymentMethod");
  const transactionDate = watch("transactionDate") ?? "";
  const subLabel = subcategories.find((s) => String(s.id) === subCategoryId)?.name;
  const accLabel = accounts.find((a) => String(a.id) === accountId)?.name;
  const pmLabel =
    paymentMethod === "Debit" ? "Débito" : paymentMethod === "Credit" ? "Crédito" : undefined;

  const onSubmit = async (values: InstallmentValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        id: item.id,
        data: {
          subCategoryId: Number(values.subCategoryId),
          accountId: Number(values.accountId),
          value: Math.round(parseFloat(values.value) * 100),
          type: item.type,
          description: values.description,
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
        },
      });
      onClose();
    } catch {
      setServerError("Erro ao atualizar parcelamento. Tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <FormField label="Descrição" error={errors.description?.message}>
          <input
            {...register("description")}
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

        <FormField label="Data inicial" error={errors.transactionDate?.message}>
          <DatePickerField
            value={transactionDate}
            onChange={(v) => setValue("transactionDate", v, { shouldValidate: true })}
            placeholder="Selecionar data"
          />
        </FormField>

        <FormField label="Número de parcelas" error={errors.totalInstallments?.message}>
          <input
            {...register("totalInstallments")}
            type="number"
            min="2"
            max="60"
            className={cn(INPUT_CLASS, errors.totalInstallments && "border-red/60")}
          />
        </FormField>

        <FormField label="Conta" error={errors.accountId?.message}>
          <Select
            value={accountId ?? ""}
            onValueChange={(v) => setValue("accountId", v as string, { shouldValidate: true })}
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
            onValueChange={(v) => setValue("subCategoryId", v as string, { shouldValidate: true })}
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
            onValueChange={(v) => setValue("paymentMethod", v as "Debit" | "Credit" | "")}
          >
            <SelectTrigger className={TRIGGER_CLASS}>
              <SelectValue>
                {pmLabel ?? <span className="text-text-muted">Nenhuma</span>}
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
            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function RecurrenceEditDrawer({ open, target, onClose }: Props) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const title =
    target?.kind === "recurring"
      ? "Editar Assinatura"
      : target?.kind === "installment"
        ? "Editar Parcelamento"
        : "";

  return (
    <>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[60] flex w-full max-w-[440px] flex-col bg-surface shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="border-border flex items-center justify-between border-b px-6 py-5">
          <h2 className="font-display font-600 text-text text-[17px]">{title}</h2>
          <button
            onClick={onClose}
            title="Fechar"
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {target?.kind === "recurring" && (
            <RecurringEditForm item={target.item} onClose={onClose} />
          )}
          {target?.kind === "installment" && (
            <InstallmentEditForm item={target.item} onClose={onClose} />
          )}
        </div>
      </div>
    </>
  );
}
