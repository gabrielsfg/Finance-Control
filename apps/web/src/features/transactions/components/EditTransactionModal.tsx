"use client";

import { useEffect, useState } from "react";
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
import { useUpdateTransaction } from "@/features/transactions/hooks/useTransactions";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import type { TransactionItem } from "@/lib/types/transactions.types";

const schema = z.object({
  description: z.string().min(1, "Descrição obrigatória"),
  value: z.string().min(1, "Valor obrigatório"),
  transactionDate: z.string().min(1, "Data obrigatória"),
  subCategoryId: z.string().min(1, "Categoria obrigatória"),
  accountId: z.string().min(1, "Conta obrigatória"),
  paymentMethod: z.enum(["Debit", "Credit", ""]).optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  transaction: TransactionItem | null;
  onClose: () => void;
};

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60";

export const EditTransactionModal = ({ transaction, onClose }: Props) => {
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
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (transaction) {
      reset({
        description: transaction.description,
        value: String(transaction.value / 100),
        transactionDate: transaction.transactionDate,
        subCategoryId: String(transaction.subCategoryId),
        accountId: String(transaction.accountId),
        paymentMethod: transaction.paymentMethod ?? "",
      });
      setServerError(null);
    }
  }, [transaction, reset]);

  const groupedSubcategories = subcategories.reduce<Record<string, typeof subcategories>>(
    (acc, sub) => {
      if (!acc[sub.categoryName]) acc[sub.categoryName] = [];
      acc[sub.categoryName].push(sub);
      return acc;
    },
    {},
  );

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    if (!transaction) return;
    setServerError(null);
    try {
      await mutateAsync({
        id: transaction.id,
        data: {
          subCategoryId: Number(values.subCategoryId),
          accountId: Number(values.accountId),
          value: Math.round(parseFloat(values.value) * 100),
          description: values.description,
          transactionDate: values.transactionDate,
          paymentMethod:
            values.paymentMethod === "Debit" || values.paymentMethod === "Credit"
              ? values.paymentMethod
              : null,
          type: transaction.type,
          paymentType: transaction.paymentType,
          totalInstallments: transaction.totalInstallments,
          recurrence: null,
          includeInBudget: transaction.budgetId !== null,
          tags: transaction.tags.map((t) => t.name),
        },
      });
      handleClose();
    } catch {
      setServerError("Erro ao atualizar transação. Tente novamente.");
    }
  };

  const subCategoryValue = watch("subCategoryId");
  const accountValue = watch("accountId");
  const paymentMethodValue = watch("paymentMethod");

  return (
    <Dialog open={!!transaction} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Editar Transação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Descrição</label>
            <input
              {...register("description")}
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
              value={accountValue}
              onValueChange={(v) => setValue("accountId", v, { shouldValidate: true })}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 rounded-lg text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SubCategory */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Categoria</label>
            <Select
              value={subCategoryValue}
              onValueChange={(v) => setValue("subCategoryId", v, { shouldValidate: true })}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 rounded-lg text-[14px]">
                <SelectValue />
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
          </div>

          {/* Payment method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Forma de pagamento</label>
            <Select
              value={paymentMethodValue ?? ""}
              onValueChange={(v) => setValue("paymentMethod", v as "Debit" | "Credit" | "")}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 rounded-lg text-[14px]">
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Debit">Débito</SelectItem>
                <SelectItem value="Credit">Crédito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {serverError && <p className="text-red text-[13px]">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
