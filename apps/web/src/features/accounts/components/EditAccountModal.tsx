"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2, SlidersHorizontal } from "lucide-react";
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
import { useUpdateAccount } from "@/features/accounts/hooks/useAccounts";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { AccountItem, AccountType } from "@/lib/types/accounts.types";

const CREDIT_TYPES: AccountType[] = ["Credit", "Checking"];

const schema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    type: z.enum(["Debit", "Checking", "Savings", "Credit", "Cash"]),
    goalAmount: z.string().optional(),
    isDefaultAccount: z.boolean(),
    billingDueDay: z.string().optional(),
    creditLimit: z.string().optional(),
    newBalance: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isCreditType = CREDIT_TYPES.includes(data.type as AccountType);
    if (isCreditType) {
      if (!data.billingDueDay || data.billingDueDay.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["billingDueDay"], message: "Obrigatório" });
      } else {
        const day = Number(data.billingDueDay);
        if (isNaN(day) || day < 1 || day > 31) {
          ctx.addIssue({ code: "custom", path: ["billingDueDay"], message: "Dia inválido (1-31)" });
        }
      }
      if (!data.creditLimit || data.creditLimit.trim() === "") {
        ctx.addIssue({ code: "custom", path: ["creditLimit"], message: "Obrigatório" });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

type Props = {
  account: AccountItem | null;
  onClose: () => void;
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Checking: "Conta Corrente",
  Savings: "Poupança",
  Credit: "Cartão de Crédito",
  Debit: "Débito",
  Cash: "Dinheiro",
};

const inputClass = (hasError?: boolean) =>
  cn(
    "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60",
    hasError && "border-red/60",
  );

export const EditAccountModal = ({ account, onClose }: Props) => {
  const { mutateAsync: updateAccount, isPending } = useUpdateAccount();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (account) {
      reset({
        name: account.name,
        type: account.type,
        isDefaultAccount: account.isDefaultAccount,
        goalAmount: "",
        billingDueDay: "",
        creditLimit: "",
        newBalance: "",
      });
      setServerError(null);
    }
  }, [account, reset]);

  const accountType = watch("type") as AccountType;
  const showCreditFields = CREDIT_TYPES.includes(accountType);
  const newBalanceValue = watch("newBalance");

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    if (!account) return;
    setServerError(null);
    try {
      await updateAccount({
        id: account.id,
        data: {
          id: account.id,
          name: values.name,
          type: values.type as AccountType,
          isDefaultAccount: values.isDefaultAccount,
          goalAmount: values.goalAmount ? Math.round(parseFloat(values.goalAmount) * 100) : null,
          billingDueDay: showCreditFields && values.billingDueDay ? Number(values.billingDueDay) : null,
          creditLimit: showCreditFields && values.creditLimit ? Math.round(parseFloat(values.creditLimit) * 100) : null,
          newBalance: values.newBalance && values.newBalance.trim() !== ""
            ? Math.round(parseFloat(values.newBalance) * 100)
            : null,
        },
      });

      handleClose();
    } catch {
      setServerError("Erro ao atualizar conta. Tente novamente.");
    }
  };

  const currentBalanceFormatted = account ? formatCurrency(account.currentAmount / 100) : "";

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Editar Conta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Nome</label>
            <input
              {...register("name")}
              className={inputClass(!!errors.name)}
            />
            {errors.name && <p className="text-red text-[12px]">{errors.name.message}</p>}
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Tipo</label>
            <Select
              value={accountType}
              onValueChange={(v) => setValue("type", v as AccountType, { shouldValidate: true })}
              items={Object.fromEntries(
                (Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => [t, ACCOUNT_TYPE_LABELS[t]])
              )}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 w-full rounded-lg text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACCOUNT_TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credit-specific fields */}
          {showCreditFields && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-sub text-[13px]">Limite (R$)</label>
                <input
                  {...register("creditLimit")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="5000,00"
                  className={inputClass(!!errors.creditLimit)}
                />
                {errors.creditLimit && (
                  <p className="text-red text-[12px]">{errors.creditLimit.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-text-sub text-[13px]">Vencimento (dia)</label>
                <input
                  {...register("billingDueDay")}
                  type="number"
                  min="1"
                  max="31"
                  placeholder="15"
                  className={inputClass(!!errors.billingDueDay)}
                />
                {errors.billingDueDay && (
                  <p className="text-red text-[12px]">{errors.billingDueDay.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Goal Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Meta de saldo (R$) — opcional</label>
            <input
              {...register("goalAmount")}
              type="number"
              step="0.01"
              placeholder="0,00"
              className={inputClass()}
            />
          </div>

          {/* Default account */}
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              {...register("isDefaultAccount")}
              className="accent-green h-4 w-4 rounded"
            />
            <span className="text-text-sub text-[14px]">Definir como conta padrão</span>
          </label>

          {/* Balance adjustment */}
          <div className="border-border rounded-xl border p-4">
            <div className="mb-3 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-text-muted" />
              <span className="text-text text-[13px] font-medium">Ajustar saldo</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">
                Novo saldo (R$)
                {account && (
                  <span className="text-text-muted ml-1.5">
                    — atual: {currentBalanceFormatted}
                  </span>
                )}
              </label>
              <input
                {...register("newBalance")}
                type="number"
                step="0.01"
                placeholder="0,00"
                className={inputClass()}
              />
              {newBalanceValue && newBalanceValue.trim() !== "" && account && (
                <p className="text-text-muted text-[12px]">
                  {(() => {
                    const diff = Math.round(parseFloat(newBalanceValue) * 100) - account.currentAmount;
                    if (diff === 0) return "Sem diferença";
                    return `Uma transação de ${formatCurrency(Math.abs(diff) / 100)} será criada automaticamente (${diff > 0 ? "receita" : "despesa"})`;
                  })()}
                </p>
              )}
            </div>
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
