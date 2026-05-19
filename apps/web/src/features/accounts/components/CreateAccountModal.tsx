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
import { useCreateAccount } from "@/features/accounts/hooks/useAccounts";
import type { AccountType } from "@/lib/types/accounts.types";

const CREDIT_TYPES: AccountType[] = ["Credit", "Checking"];

const schema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    type: z.enum(["Debit", "Checking", "Savings", "Credit", "Cash"]),
    initialBalance: z.string().optional(),
    goalAmount: z.string().optional(),
    isDefaultAccount: z.boolean(),
    billingDueDay: z.string().optional(),
    creditLimit: z.string().optional(),
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
  open: boolean;
  onClose: () => void;
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  Checking: "Conta Corrente",
  Savings: "Poupança",
  Credit: "Cartão de Crédito",
  Debit: "Débito",
  Cash: "Dinheiro",
};

export const CreateAccountModal = ({ open, onClose }: Props) => {
  const { mutateAsync, isPending } = useCreateAccount();
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
    defaultValues: {
      name: "",
      type: "Checking",
      isDefaultAccount: false,
      initialBalance: "",
      goalAmount: "",
      billingDueDay: "",
      creditLimit: "",
    },
  });

  const accountType = watch("type") as AccountType;
  const showCreditFields = CREDIT_TYPES.includes(accountType);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        name: values.name,
        type: values.type as AccountType,
        isDefaultAccount: values.isDefaultAccount,
        initialBalance: values.initialBalance
          ? Math.round(parseFloat(values.initialBalance) * 100)
          : null,
        goalAmount: values.goalAmount
          ? Math.round(parseFloat(values.goalAmount) * 100)
          : null,
        billingDueDay: showCreditFields && values.billingDueDay
          ? Number(values.billingDueDay)
          : null,
        creditLimit: showCreditFields && values.creditLimit
          ? Math.round(parseFloat(values.creditLimit) * 100)
          : null,
      });
      handleClose();
    } catch {
      setServerError("Erro ao criar conta. Verifique os dados e tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Nova Conta
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Nome</label>
            <input
              {...register("name")}
              placeholder="Ex: Nubank, Bradesco..."
              className={cn(
                "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60",
                errors.name && "border-red/60",
              )}
            />
            {errors.name && <p className="text-red text-[12px]">{errors.name.message}</p>}
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Tipo</label>
            <Select
              value={accountType}
              onValueChange={(v) => setValue("type", v as AccountType, { shouldValidate: true })}
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
                  className={cn(
                    "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60",
                    errors.creditLimit && "border-red/60",
                  )}
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
                  className={cn(
                    "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60",
                    errors.billingDueDay && "border-red/60",
                  )}
                />
                {errors.billingDueDay && (
                  <p className="text-red text-[12px]">{errors.billingDueDay.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Initial Balance */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Saldo inicial (R$)</label>
            <input
              {...register("initialBalance")}
              type="number"
              step="0.01"
              placeholder="0,00"
              className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60"
            />
          </div>

          {/* Goal Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Meta de saldo (R$) — opcional</label>
            <input
              {...register("goalAmount")}
              type="number"
              step="0.01"
              placeholder="0,00"
              className="border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60"
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

          {serverError && <p className="text-red text-[13px]">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : "Criar conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
