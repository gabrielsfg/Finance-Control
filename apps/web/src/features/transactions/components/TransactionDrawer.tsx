"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Loader2,
  X,
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Calendar,
  Wallet,
  Tag,
  CreditCard,
  Zap,
  LayoutGrid,
  BookOpen,
  Check,
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
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/config/accountTypes";
import {
  useCreateTransaction,
  useUpdateTransaction,
} from "@/features/transactions/hooks/useTransactions";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { TagInput } from "@/features/transactions/components/TagInput";
import { DatePickerField } from "@/components/shared/DatePickerField";
import { CategorySelectContent } from "@/components/shared/CategorySelectContent";
import type {
  TransactionItem,
  TransactionType,
  PaymentType,
  RecurrenceType,
} from "@/lib/types/transactions.types";
import type { AccountItem } from "@/lib/types/accounts.types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type DrawerMode = "create" | "detail" | "edit";

type Props = {
  open: boolean;
  mode: DrawerMode;
  transaction?: TransactionItem | null;
  onClose: () => void;
  onDeleteRequest: (t: TransactionItem) => void;
  defaultType?: TransactionType;
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

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  OneTime: "Avulso",
  Installment: "Parcelado",
  Recurring: "Recorrente",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  Debit: "Débito",
  Credit: "Crédito",
};

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-green/60 h-11 rounded-lg px-3.5 text-[15px]";

// !h-11 overrides data-[size=default]:h-8 baked into SelectTrigger base styles
const TRIGGER_CLASS =
  "border-border bg-surface2 text-text w-full !h-11 rounded-lg px-3.5 text-[15px]";

const VALUE_WRAPPER_CLASS =
  "border-border bg-surface2 flex w-full items-center border h-11 rounded-lg";

// ── Reusable select content components ───────────────────────────────────────

const DROPDOWN_PROPS = { alignItemWithTrigger: false, sideOffset: 4 } as const;

function AccountSelectContent({ accounts }: { accounts: AccountItem[] }) {
  return (
    <SelectContent {...DROPDOWN_PROPS}>
      {accounts.map((a) => {
        const cfg = ACCOUNT_TYPE_CONFIG[a.type];
        const Icon = cfg.Icon;
        return (
          <SelectItem key={a.id} value={String(a.id)}>
            <div className="flex items-center gap-2.5 py-0.5">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${cfg.color}1a` }}
              >
                <Icon size={13} style={{ color: cfg.color }} />
              </span>
              <div className="flex flex-col">
                <span className="text-[14px] font-medium leading-tight">{a.name}</span>
                <span className="text-text-muted text-[11px] leading-tight">{cfg.label}</span>
              </div>
            </div>
          </SelectItem>
        );
      })}
    </SelectContent>
  );
}

function PaymentMethodSelectContent() {
  return (
    <SelectContent {...DROPDOWN_PROPS}>
      <SelectItem value="Debit">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-blue bg-blue/10 flex h-7 w-7 items-center justify-center rounded-md">
            <Wallet size={13} />
          </span>
          <div className="flex flex-col">
            <span className="text-[14px] font-medium leading-tight">Débito</span>
            <span className="text-text-muted text-[11px] leading-tight">Saldo debitado na hora</span>
          </div>
        </div>
      </SelectItem>
      <SelectItem value="Credit">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-purple bg-purple/10 flex h-7 w-7 items-center justify-center rounded-md">
            <CreditCard size={13} />
          </span>
          <div className="flex flex-col">
            <span className="text-[14px] font-medium leading-tight">Crédito</span>
            <span className="text-text-muted text-[11px] leading-tight">Pago na fatura</span>
          </div>
        </div>
      </SelectItem>
    </SelectContent>
  );
}

function PaymentTypeSelectContent() {
  return (
    <SelectContent {...DROPDOWN_PROPS}>
      <SelectItem value="OneTime">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-green bg-green/10 flex h-7 w-7 items-center justify-center rounded-md">
            <Zap size={13} />
          </span>
          <div className="flex flex-col">
            <span className="text-[14px] font-medium leading-tight">Avulso</span>
            <span className="text-text-muted text-[11px] leading-tight">Pagamento único</span>
          </div>
        </div>
      </SelectItem>
      <SelectItem value="Installment">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-blue bg-blue/10 flex h-7 w-7 items-center justify-center rounded-md">
            <LayoutGrid size={13} />
          </span>
          <div className="flex flex-col">
            <span className="text-[14px] font-medium leading-tight">Parcelado</span>
            <span className="text-text-muted text-[11px] leading-tight">Dividido em parcelas</span>
          </div>
        </div>
      </SelectItem>
      <SelectItem value="Recurring">
        <div className="flex items-center gap-2.5 py-0.5">
          <span className="text-purple bg-purple/10 flex h-7 w-7 items-center justify-center rounded-md">
            <RefreshCw size={13} />
          </span>
          <div className="flex flex-col">
            <span className="text-[14px] font-medium leading-tight">Recorrente</span>
            <span className="text-text-muted text-[11px] leading-tight">Repete automaticamente</span>
          </div>
        </div>
      </SelectItem>
    </SelectContent>
  );
}

function BudgetToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "border-border flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-colors",
        checked ? "border-green/40 bg-green/5" : "bg-surface2 hover:bg-surface2/80",
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          checked ? "border-green bg-green text-black" : "border-border text-transparent",
        )}
      >
        <Check size={12} strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-0.5">
        <span className={cn("text-[14px] font-medium", checked ? "text-green" : "text-text")}>
          Incluir no orçamento
        </span>
        <span className="text-text-muted text-[12px]">
          Conta para o controle de gastos do mês
        </span>
      </div>
      <BookOpen size={15} className={cn("ml-auto shrink-0", checked ? "text-green" : "text-text-muted")} />
    </button>
  );
}

// ── Schemas ───────────────────────────────────────────────────────────────────

const createSchema = z
  .object({
    description: z.string().min(1, "Descrição obrigatória"),
    value: z.string().min(1, "Valor obrigatório"),
    transactionDate: z.string().min(1, "Data obrigatória"),
    subCategoryId: z.string().min(1, "Categoria obrigatória"),
    accountId: z.string().min(1, "Conta obrigatória"),
    paymentType: z.enum(["OneTime", "Installment", "Recurring"]),
    paymentMethod: z.enum(["Debit", "Credit", ""]).optional(),
    totalInstallments: z.string().optional(),
    recurrence: z.string().optional(),
    includeInBudget: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === "Installment") {
      const n = Number(data.totalInstallments);
      if (!data.totalInstallments || isNaN(n) || n < 2 || n > 60)
        ctx.addIssue({ code: "custom", path: ["totalInstallments"], message: "Parcelas: 2 a 60" });
    }
    if (data.paymentType === "Recurring" && !data.recurrence)
      ctx.addIssue({ code: "custom", path: ["recurrence"], message: "Selecione a recorrência" });
  });

const editSchema = z
  .object({
    description: z.string().min(1, "Descrição obrigatória"),
    value: z.string().min(1, "Valor obrigatório"),
    transactionDate: z.string().min(1, "Data obrigatória"),
    subCategoryId: z.string().min(1, "Categoria obrigatória"),
    accountId: z.string().min(1, "Conta obrigatória"),
    paymentMethod: z.enum(["Debit", "Credit", ""]).optional(),
    type: z.enum(["Expense", "Income"]),
    paymentType: z.enum(["OneTime", "Installment", "Recurring"]),
    totalInstallments: z.string().optional(),
    recurrence: z.string().optional(),
    includeInBudget: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentType === "Installment") {
      const n = Number(data.totalInstallments);
      if (!data.totalInstallments || isNaN(n) || n < 2 || n > 60)
        ctx.addIssue({ code: "custom", path: ["totalInstallments"], message: "Parcelas: 2 a 60" });
    }
    if (data.paymentType === "Recurring" && !data.recurrence)
      ctx.addIssue({ code: "custom", path: ["recurrence"], message: "Selecione a recorrência" });
  });

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

// ── Detail view ───────────────────────────────────────────────────────────────

function parseDateLocal(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function DetailView({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: TransactionItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = transaction.type === "Income";
  const dateObj = parseDateLocal(transaction.transactionDate);
  const dateLabel = dateObj.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Value hero */}
      <div className="flex flex-col items-center gap-3 py-6">
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-[16px]",
            isIncome ? "bg-green/10" : "bg-red/10",
          )}
        >
          {isIncome ? (
            <ArrowUpRight size={28} className="text-green" />
          ) : (
            <ArrowDownLeft size={28} className="text-red" />
          )}
        </div>
        <p
          className={cn(
            "font-money font-700 text-[32px]",
            isIncome ? "text-green" : "text-red",
          )}
        >
          {isIncome ? "+" : "-"}
          {formatCurrency(Math.abs(transaction.value) / 100)}
        </p>
        <p className="text-text font-medium text-[16px]">{transaction.description}</p>
        <div className="flex items-center gap-2">
          {transaction.paymentType === "Recurring" && (
            <span className="text-purple border-purple/25 bg-purple/8 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium">
              <RefreshCw size={10} />
              Recorrente
            </span>
          )}
          {transaction.paymentType === "Installment" &&
            transaction.installmentNumber &&
            transaction.totalInstallments && (
              <span className="text-blue border-blue/25 bg-blue/8 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-medium">
                <Layers size={10} />
                {transaction.installmentNumber}/{transaction.totalInstallments}x
              </span>
            )}
        </div>
        {transaction.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5">
            {transaction.tags.map((tag) => (
              <span
                key={tag.id}
                className="bg-green/10 text-green rounded-md px-2 py-0.5 text-[11px] font-medium"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Details list */}
      <div className="border-border bg-surface2 divide-border flex flex-col divide-y rounded-xl border">
        <DetailRow icon={<Calendar size={15} />} label="Data" value={dateLabel} />
        <DetailRow icon={<Wallet size={15} />} label="Conta" value={transaction.accountName} />
        <DetailRow
          icon={<Tag size={15} />}
          label="Categoria"
          value={transaction.subCategoryEmoji ? `${transaction.subCategoryEmoji} ${transaction.subCategoryName}` : transaction.subCategoryName}
        />
        <DetailRow
          icon={<CreditCard size={15} />}
          label="Tipo de pagamento"
          value={PAYMENT_TYPE_LABELS[transaction.paymentType]}
        />
        {transaction.paymentMethod && (
          <DetailRow
            icon={<CreditCard size={15} />}
            label="Forma de pagamento"
            value={PAYMENT_METHOD_LABELS[transaction.paymentMethod]}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button className="w-full" onClick={onEdit}>
          <Pencil size={15} />
          Editar transação
        </Button>
        <Button className="w-full" variant="destructive" onClick={onDelete}>
          <Trash2 size={15} />
          Excluir transação
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="text-text-muted flex items-center gap-2.5 text-[14px]">
        {icon}
        {label}
      </div>
      <span className="text-text text-right text-[14px] font-medium capitalize">{value}</span>
    </div>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateForm({
  onClose,
  defaultType = "Expense",
}: {
  onClose: () => void;
  defaultType?: TransactionType;
}) {
  const { mutateAsync, isPending } = useCreateTransaction();
  const { data: subcategories = [] } = useSubCategories();
  const { data: accounts = [] } = useAccounts();
  const [serverError, setServerError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultType);
  const [createTags, setCreateTags] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      description: "",
      value: "",
      transactionDate: new Date().toISOString().slice(0, 10),
      subCategoryId: "",
      accountId: "",
      paymentType: "OneTime",
      paymentMethod: "",
      totalInstallments: "",
      recurrence: "",
      includeInBudget: false,
    },
  });

  const paymentType = watch("paymentType") as PaymentType;
  const accountIdValue = watch("accountId");
  const subCategoryIdValue = watch("subCategoryId");

  const createAccountSelected = accounts.find((a) => String(a.id) === accountIdValue);
  const createSubCategorySelected = subcategories.find((s) => String(s.id) === subCategoryIdValue);
  const createSubCategoryLabel = createSubCategorySelected
    ? (createSubCategorySelected.emoji ? `${createSubCategorySelected.emoji} ${createSubCategorySelected.name}` : createSubCategorySelected.name)
    : undefined;


  const onSubmit = async (values: CreateValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        description: values.description,
        value: Math.round(parseFloat(values.value) * 100),
        transactionDate: values.transactionDate,
        subCategoryId: Number(values.subCategoryId),
        accountId: Number(values.accountId),
        type: transactionType,
        paymentType: values.paymentType as PaymentType,
        paymentMethod:
          values.paymentMethod === "Debit" || values.paymentMethod === "Credit"
            ? values.paymentMethod
            : null,
        totalInstallments:
          values.paymentType === "Installment" && values.totalInstallments
            ? Number(values.totalInstallments)
            : null,
        recurrence:
          values.paymentType === "Recurring" && values.recurrence
            ? (values.recurrence as RecurrenceType)
            : null,
        includeInBudget: values.includeInBudget,
        tags: createTags,
      });
      reset();
      setCreateTags([]);
      setTransactionType(defaultType);
      onClose();
    } catch {
      setServerError("Erro ao criar transação. Verifique os dados e tente novamente.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      {/* Scrollable fields */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
      {/* Type toggle */}
      <div className="bg-surface2 flex rounded-xl p-1.5">
        {(["Expense", "Income"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTransactionType(t)}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-[15px] font-medium transition-colors",
              transactionType === t
                ? t === "Income"
                  ? "bg-green/15 text-green"
                  : "bg-red/15 text-red"
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
          placeholder="Ex: Mercado, Salário..."
          className={cn(INPUT_CLASS, errors.description && "border-red/60")}
        />
      </FormField>

      <FormField label="Valor" error={errors.value?.message}>
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

      <FormField label="Data" error={errors.transactionDate?.message}>
        <DatePickerField
          value={watch("transactionDate") ?? ""}
          onChange={v => setValue("transactionDate", v, { shouldValidate: true })}
          hasError={!!errors.transactionDate}
        />
      </FormField>

      <FormField label="Conta" error={errors.accountId?.message}>
        <Select onValueChange={(v) => setValue("accountId", v as string, { shouldValidate: true })}>
          <SelectTrigger className={cn(TRIGGER_CLASS, errors.accountId && "border-red/60")}>
            <SelectValue>
              {createAccountSelected
                ? (() => { const cfg = ACCOUNT_TYPE_CONFIG[createAccountSelected.type]; const Icon = cfg.Icon; return (
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${cfg.color}1a` }}>
                        <Icon size={12} style={{ color: cfg.color }} />
                      </span>
                      <span>{createAccountSelected.name}</span>
                    </div>
                  ); })()
                : <span className="text-text-muted">Selecionar conta</span>}
            </SelectValue>
          </SelectTrigger>
          <AccountSelectContent accounts={accounts} />
        </Select>
      </FormField>

      <FormField label="Categoria" error={errors.subCategoryId?.message}>
        <Select onValueChange={(v) => setValue("subCategoryId", v as string, { shouldValidate: true })}>
          <SelectTrigger className={cn(TRIGGER_CLASS, errors.subCategoryId && "border-red/60")}>
            <SelectValue>
              {createSubCategoryLabel ?? <span className="text-text-muted">Selecionar categoria</span>}
            </SelectValue>
          </SelectTrigger>
          <CategorySelectContent subcategories={subcategories} />
        </Select>
      </FormField>

      <FormField label="Tipo de pagamento">
        <Select defaultValue="OneTime" onValueChange={(v) => setValue("paymentType", v as PaymentType)}>
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <PaymentTypeSelectContent />
        </Select>
      </FormField>

      <FormField label="Forma de pagamento">
        <Select
          defaultValue=""
          onValueChange={(v) => setValue("paymentMethod", v as "Debit" | "Credit" | "")}
        >
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue placeholder="Opcional" />
          </SelectTrigger>
          <PaymentMethodSelectContent />
        </Select>
      </FormField>

      {paymentType === "Installment" && (
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
      )}

      {paymentType === "Recurring" && (
        <FormField label="Recorrência" error={errors.recurrence?.message}>
          <Select onValueChange={(v) => setValue("recurrence", v as string)}>
            <SelectTrigger
              className={cn(TRIGGER_CLASS, errors.recurrence && "border-red/60")}
            >
              <SelectValue placeholder="Selecionar frequência" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      <FormField label="Tags">
        <TagInput value={createTags} onChange={setCreateTags} />
      </FormField>

      {transactionType === "Expense" && (
        <BudgetToggle
          checked={watch("includeInBudget")}
          onChange={(v) => setValue("includeInBudget", v)}
        />
      )}

      {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>{/* end scrollable fields */}

      {/* Fixed footer */}
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

// ── Edit form ─────────────────────────────────────────────────────────────────

function EditForm({
  transaction,
  onClose,
}: {
  transaction: TransactionItem;
  onClose: () => void;
}) {
  const { mutateAsync, isPending } = useUpdateTransaction();
  const { data: subcategories = [] } = useSubCategories();
  const { data: accounts = [] } = useAccounts();
  const [serverError, setServerError] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<string[]>(() => transaction.tags.map((t) => t.name));

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  const [transactionType, setTransactionType] = useState<TransactionType>(transaction.type);

  useEffect(() => {
    setTransactionType(transaction.type);
    setEditTags(transaction.tags.map((t) => t.name));
    reset({
      description: transaction.description,
      value: String(transaction.value / 100),
      transactionDate: transaction.transactionDate,
      subCategoryId: String(transaction.subCategoryId),
      accountId: String(transaction.accountId),
      paymentMethod: transaction.paymentMethod ?? "",
      type: transaction.type,
      paymentType: transaction.paymentType,
      totalInstallments: "",
      recurrence: "",
      includeInBudget: transaction.budgetId !== null,
    });
    setServerError(null);
  }, [transaction, reset]);


  const subCategoryValue = watch("subCategoryId");
  const accountValue = watch("accountId");
  const paymentMethodValue = watch("paymentMethod");
  const editPaymentType = watch("paymentType") as PaymentType;

  const accountSelected = accounts.find((a) => String(a.id) === accountValue);
  const subCategorySelected = subcategories.find((s) => String(s.id) === subCategoryValue);
  const subCategoryLabel = subCategorySelected
    ? (subCategorySelected.emoji ? `${subCategorySelected.emoji} ${subCategorySelected.name}` : subCategorySelected.name)
    : undefined;
  const paymentMethodLabel = paymentMethodValue === "Debit" ? "Débito" : paymentMethodValue === "Credit" ? "Crédito" : undefined;

  const onSubmit = async (values: EditValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        id: transaction.id,
        data: {
          subCategoryId: Number(values.subCategoryId),
          accountId: Number(values.accountId),
          value: Math.round(parseFloat(values.value) * 100),
          type: transactionType,
          description: values.description,
          transactionDate: values.transactionDate,
          paymentType: values.paymentType as PaymentType,
          paymentMethod:
            values.paymentMethod === "Debit" || values.paymentMethod === "Credit"
              ? values.paymentMethod
              : null,
          totalInstallments:
            values.paymentType === "Installment" && values.totalInstallments
              ? Number(values.totalInstallments)
              : null,
          recurrence:
            values.paymentType === "Recurring" && values.recurrence
              ? (values.recurrence as RecurrenceType)
              : null,
          includeInBudget: values.includeInBudget,
          tags: editTags,
        },
      });
      onClose();
    } catch {
      setServerError("Erro ao atualizar transação. Tente novamente.");
    }
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      {/* Scrollable fields */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
      {/* Type toggle */}
      <div className="bg-surface2 flex rounded-xl p-1.5">
        {(["Expense", "Income"] as TransactionType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTransactionType(t); setValue("type", t); }}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-[15px] font-medium transition-colors",
              transactionType === t
                ? t === "Income"
                  ? "bg-green/15 text-green"
                  : "bg-red/15 text-red"
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
          className={cn(INPUT_CLASS, errors.description && "border-red/60")}
        />
      </FormField>

      <FormField label="Valor" error={errors.value?.message}>
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

      <FormField label="Data">
        <DatePickerField
          value={watch("transactionDate") ?? ""}
          onChange={v => setValue("transactionDate", v, { shouldValidate: true })}
        />
      </FormField>

      <FormField label="Conta">
        <Select
          value={accountValue ?? ""}
          onValueChange={(v) => setValue("accountId", v as string, { shouldValidate: true })}
        >
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue>
              {accountSelected
                ? (() => { const cfg = ACCOUNT_TYPE_CONFIG[accountSelected.type]; const Icon = cfg.Icon; return (
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${cfg.color}1a` }}>
                        <Icon size={12} style={{ color: cfg.color }} />
                      </span>
                      <span>{accountSelected.name}</span>
                    </div>
                  ); })()
                : <span className="text-text-muted">Selecionar conta</span>}
            </SelectValue>
          </SelectTrigger>
          <AccountSelectContent accounts={accounts} />
        </Select>
      </FormField>

      <FormField label="Categoria">
        <Select
          value={subCategoryValue ?? ""}
          onValueChange={(v) => setValue("subCategoryId", v as string, { shouldValidate: true })}
        >
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue>
              {subCategoryLabel ?? <span className="text-text-muted">Selecionar categoria</span>}
            </SelectValue>
          </SelectTrigger>
          <CategorySelectContent subcategories={subcategories} />
        </Select>
      </FormField>

      <FormField label="Forma de pagamento">
        <Select
          value={paymentMethodValue ?? ""}
          onValueChange={(v) => setValue("paymentMethod", v as "Debit" | "Credit" | "")}
        >
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue>
              {paymentMethodLabel ?? <span className="text-text-muted">Nenhuma</span>}
            </SelectValue>
          </SelectTrigger>
          <PaymentMethodSelectContent />
        </Select>
      </FormField>

      <FormField label="Tipo de pagamento">
        <Select
          value={editPaymentType}
          onValueChange={(v) => setValue("paymentType", v as PaymentType)}
        >
          <SelectTrigger className={TRIGGER_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <PaymentTypeSelectContent />
        </Select>
      </FormField>

      {editPaymentType !== transaction.paymentType && (
        <p className="text-orange bg-orange/8 border-orange/20 rounded-lg border px-3.5 py-2.5 text-[12px]">
          Trocar o tipo de pagamento recriará a transação. O ID original será removido.
        </p>
      )}

      {editPaymentType === "Installment" && (
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
      )}

      {editPaymentType === "Recurring" && (
        <FormField label="Recorrência" error={errors.recurrence?.message}>
          <Select onValueChange={(v) => setValue("recurrence", v as string)}>
            <SelectTrigger className={cn(TRIGGER_CLASS, errors.recurrence && "border-red/60")}>
              <SelectValue placeholder="Selecionar frequência" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RECURRENCE_LABELS) as RecurrenceType[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}

      <FormField label="Tags">
        <TagInput value={editTags} onChange={setEditTags} />
      </FormField>

      {transactionType === "Expense" && (
        <BudgetToggle
          checked={watch("includeInBudget")}
          onChange={(v) => setValue("includeInBudget", v)}
        />
      )}

      {serverError && <p className="text-red text-[13px]">{serverError}</p>}
      </div>{/* end scrollable fields */}

      {/* Fixed footer */}
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

// ── Shared form field wrapper ──────────────────────────────────────────────────

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

// ── Drawer ────────────────────────────────────────────────────────────────────

export function TransactionDrawer({
  open,
  mode,
  transaction,
  onClose,
  onDeleteRequest,
  defaultType = "Expense",
}: Props) {
  const [innerMode, setInnerMode] = useState<DrawerMode>(mode);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInnerMode(mode);
  }, [mode, open]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const titles: Record<DrawerMode, string> = {
    create: "Nova Transação",
    detail: "Detalhes",
    edit: "Editar Transação",
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

      {/* Drawer panel */}
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

        {/* Body — flex column so forms can pin their footer */}
        <div className="flex min-h-0 flex-1 flex-col">
          {innerMode === "create" && (
            <CreateForm onClose={onClose} defaultType={defaultType} />
          )}

          {innerMode === "detail" && transaction && (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <DetailView
                transaction={transaction}
                onEdit={() => setInnerMode("edit")}
                onDelete={() => onDeleteRequest(transaction)}
              />
            </div>
          )}

          {innerMode === "edit" && transaction && (
            <EditForm transaction={transaction} onClose={onClose} />
          )}
        </div>
      </div>
    </>
  );
}
