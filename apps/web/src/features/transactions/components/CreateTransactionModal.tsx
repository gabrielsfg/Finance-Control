"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateTransaction } from "@/features/transactions/hooks/useTransactions";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import type { PaymentType, RecurrenceType, TransactionType } from "@/lib/types/transactions.types";

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

const schema = z
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
      if (!data.totalInstallments || isNaN(n) || n < 2 || n > 60) {
        ctx.addIssue({ code: "custom", path: ["totalInstallments"], message: "Parcelas: 2 a 60" });
      }
    }
    if (data.paymentType === "Recurring" && !data.recurrence) {
      ctx.addIssue({ code: "custom", path: ["recurrence"], message: "Selecione a recorrência" });
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
};

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60";

export const CreateTransactionModal = ({ open, onClose, defaultType = "Expense" }: Props) => {
  const { mutateAsync, isPending } = useCreateTransaction();
  const { data: subcategories = [] } = useSubCategories();
  const { data: accounts = [] } = useAccounts();
  const [serverError, setServerError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultType);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
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

  const groupedSubcategories = subcategories.reduce<Record<string, typeof subcategories>>(
    (acc, sub) => {
      if (!acc[sub.categoryName]) acc[sub.categoryName] = [];
      acc[sub.categoryName].push(sub);
      return acc;
    },
    {},
  );

  const handleClose = () => {
    reset();
    setServerError(null);
    setTransactionType(defaultType);
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
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
        paymentMethod: values.paymentMethod === "Debit" || values.paymentMethod === "Credit"
          ? values.paymentMethod
          : null,
        totalInstallments: values.paymentType === "Installment" && values.totalInstallments
          ? Number(values.totalInstallments)
          : null,
        recurrence: values.paymentType === "Recurring" && values.recurrence
          ? (values.recurrence as RecurrenceType)
          : null,
        includeInBudget: values.includeInBudget,
        tags: [],
      });
      handleClose();
    } catch {
      setServerError("Erro ao criar transação. Verifique os dados e tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Nova Transação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Type toggle */}
          <div className="bg-surface2 flex rounded-lg p-1">
            {(["Expense", "Income"] as TransactionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTransactionType(t)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-[13px] font-medium transition-colors",
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

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Descrição</label>
            <input
              {...register("description")}
              placeholder="Ex: Mercado, Salário..."
              className={cn(INPUT_CLASS, errors.description && "border-red/60")}
            />
            {errors.description && (
              <p className="text-red text-[12px]">{errors.description.message}</p>
            )}
          </div>

          {/* Value + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Valor (R$)</label>
              <input
                {...register("value")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className={cn(INPUT_CLASS, errors.value && "border-red/60")}
              />
              {errors.value && <p className="text-red text-[12px]">{errors.value.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Data</label>
              <input
                {...register("transactionDate")}
                type="date"
                className={cn(INPUT_CLASS, errors.transactionDate && "border-red/60")}
              />
            </div>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Conta</label>
            <Select
              onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}
            >
              <SelectTrigger className={cn("border-border bg-surface2 text-text h-9 rounded-lg text-[14px]", errors.accountId && "border-red/60")}>
                <SelectValue placeholder="Selecionar conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-red text-[12px]">{errors.accountId.message}</p>
            )}
          </div>

          {/* SubCategory */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Categoria</label>
            <Select
              onValueChange={(v) => setValue("subCategoryId", v, { shouldValidate: true })}
            >
              <SelectTrigger className={cn("border-border bg-surface2 text-text h-9 rounded-lg text-[14px]", errors.subCategoryId && "border-red/60")}>
                <SelectValue placeholder="Selecionar categoria" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(groupedSubcategories).map(([catName, subs]) => (
                  <div key={catName}>
                    <p className="text-text-muted px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide">
                      {catName}
                    </p>
                    {subs.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            {errors.subCategoryId && (
              <p className="text-red text-[12px]">{errors.subCategoryId.message}</p>
            )}
          </div>

          {/* Payment type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Tipo de pagamento</label>
            <Select
              defaultValue="OneTime"
              onValueChange={(v) => setValue("paymentType", v as PaymentType)}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 rounded-lg text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OneTime">Avulso</SelectItem>
                <SelectItem value="Installment">Parcelado</SelectItem>
                <SelectItem value="Recurring">Recorrente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Forma de pagamento</label>
            <Select
              defaultValue=""
              onValueChange={(v) => setValue("paymentMethod", v as "Debit" | "Credit" | "")}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 rounded-lg text-[14px]">
                <SelectValue placeholder="Opcional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Debit">Débito</SelectItem>
                <SelectItem value="Credit">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Installments */}
          {paymentType === "Installment" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Número de parcelas</label>
              <input
                {...register("totalInstallments")}
                type="number"
                min="2"
                max="60"
                placeholder="Ex: 12"
                className={cn(INPUT_CLASS, errors.totalInstallments && "border-red/60")}
              />
              {errors.totalInstallments && (
                <p className="text-red text-[12px]">{errors.totalInstallments.message}</p>
              )}
            </div>
          )}

          {/* Recurrence */}
          {paymentType === "Recurring" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Recorrência</label>
              <Select onValueChange={(v) => setValue("recurrence", v)}>
                <SelectTrigger className={cn("border-border bg-surface2 text-text h-9 rounded-lg text-[14px]", errors.recurrence && "border-red/60")}>
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
              {errors.recurrence && (
                <p className="text-red text-[12px]">{errors.recurrence.message}</p>
              )}
            </div>
          )}

          {/* Include in budget */}
          {transactionType === "Expense" && (
            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                {...register("includeInBudget")}
                className="accent-green h-4 w-4 rounded"
              />
              <span className="text-text-sub text-[14px]">Incluir no orçamento</span>
            </label>
          )}

          {serverError && <p className="text-red text-[13px]">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
