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
import { useRegisterDividend } from "@/features/investments/hooks/useInvestments";
import type { DividendType } from "@/lib/types/investments.types";

const DIVIDEND_TYPE_LABELS: Record<DividendType, string> = {
  Dividend:            "Dividendo",
  JurosCapitalProprio: "Juros sobre Capital Próprio",
  RendimentoFII:       "Rendimento FII",
  Cupom:               "Cupom",
  Rendimento:          "Rendimento",
};

const schema = z.object({
  investmentId: z.number().min(1),
  date:         z.string().min(1, "Data é obrigatória"),
  amount:       z.string().min(1, "Valor é obrigatório"),
  type:         z.enum(["Dividend","JurosCapitalProprio","RendimentoFII","Cupom","Rendimento"]),
  accountId:    z.string().min(1, "Conta é obrigatória"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  investmentId: number;
  ticker: string;
  accountOptions: { id: number; name: string }[];
};

export const RegisterDividendModal = ({ open, onClose, investmentId, ticker, accountOptions }: Props) => {
  const { mutateAsync, isPending } = useRegisterDividend();
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
      investmentId,
      date:      new Date().toISOString().slice(0, 10),
      amount:    "",
      type:      "Dividend",
      accountId: accountOptions[0]?.id.toString() ?? "",
    },
  });

  const dividendType = watch("type") as DividendType;

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        investmentId: values.investmentId,
        date:         values.date,
        amount:       Math.round(parseFloat(values.amount) * 100),
        type:         values.type as DividendType,
        accountId:    parseInt(values.accountId),
      });
      handleClose();
    } catch {
      setServerError("Erro ao registrar rendimento. Verifique os dados e tente novamente.");
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn(
      "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60",
      hasError && "border-red/60",
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Registrar Rendimento — {ticker}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Tipo de rendimento</label>
            <Select
              value={dividendType}
              onValueChange={(v) => setValue("type", v as DividendType)}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 w-full rounded-lg text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(DIVIDEND_TYPE_LABELS) as [DividendType, string][]).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Data do pagamento</label>
              <input
                {...register("date")}
                type="date"
                className={inputClass(!!errors.date)}
              />
              {errors.date && <p className="text-red text-[12px]">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Valor recebido (R$)</label>
              <input
                {...register("amount")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className={inputClass(!!errors.amount)}
              />
              {errors.amount && <p className="text-red text-[12px]">{errors.amount.message}</p>}
            </div>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Conta de destino</label>
            <Select
              value={watch("accountId")}
              onValueChange={(v) => setValue("accountId", v)}
            >
              <SelectTrigger className="border-border bg-surface2 text-text h-9 w-full rounded-lg text-[14px]">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accountOptions.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-red text-[12px]">{errors.accountId.message}</p>}
          </div>

          {serverError && <p className="text-red text-[13px]">{serverError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
