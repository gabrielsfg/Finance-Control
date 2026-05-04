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
import { useRegisterTransaction } from "@/features/investments/hooks/useInvestments";
import type { AssetType, InvestmentOperation } from "@/lib/types/investments.types";

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  Acao:              "Ação",
  FundoInvestimento: "Fundo de Investimento",
  FII:               "FII",
  Cripto:            "Cripto",
  Stock:             "Stock",
  Reit:              "REIT",
  BDR:               "BDR",
  ETF:               "ETF",
  ETFInternacional:  "ETF Internacional",
  TesouroDireto:     "Tesouro Direto",
  RendaFixa:         "Renda Fixa",
  Outro:             "Outro",
};

const schema = z.object({
  ticker:    z.string().min(1, "Ticker é obrigatório"),
  name:      z.string().min(1, "Nome é obrigatório"),
  assetType: z.enum(["Acao","FundoInvestimento","FII","Cripto","Stock","Reit","BDR","ETF","ETFInternacional","TesouroDireto","RendaFixa","Outro"]),
  broker:    z.string().optional(),
  operation: z.enum(["Buy", "Sell"]),
  date:      z.string().min(1, "Data é obrigatória"),
  quantity:  z.string().min(1, "Quantidade é obrigatória"),
  unitPrice: z.string().min(1, "Preço é obrigatório"),
  otherCosts: z.string().optional(),
  accountId: z.string().min(1, "Conta é obrigatória"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  accountOptions: { id: number; name: string }[];
};

export const RegisterTransactionModal = ({ open, onClose, accountOptions }: Props) => {
  const { mutateAsync, isPending } = useRegisterTransaction();
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
      ticker: "",
      name: "",
      assetType: "Acao",
      broker: "",
      operation: "Buy",
      date: new Date().toISOString().slice(0, 10),
      quantity: "",
      unitPrice: "",
      otherCosts: "",
      accountId: accountOptions[0]?.id.toString() ?? "",
    },
  });

  const operation = watch("operation") as InvestmentOperation;
  const assetType  = watch("assetType") as AssetType;

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await mutateAsync({
        ticker:     values.ticker.toUpperCase(),
        name:       values.name,
        assetType:  values.assetType as AssetType,
        broker:     values.broker || undefined,
        operation:  values.operation as InvestmentOperation,
        date:       values.date,
        quantity:   parseFloat(values.quantity),
        unitPrice:  Math.round(parseFloat(values.unitPrice) * 100),
        otherCosts: values.otherCosts ? Math.round(parseFloat(values.otherCosts) * 100) : 0,
        accountId:  parseInt(values.accountId),
      });
      handleClose();
    } catch {
      setServerError("Erro ao registrar operação. Verifique os dados e tente novamente.");
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn(
      "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-green/60",
      hasError && "border-red/60",
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Registrar Operação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-1">
          {/* Operation toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Operação</label>
            <div className="border-border flex gap-1 rounded-xl border bg-surface p-1">
              {(["Buy", "Sell"] as InvestmentOperation[]).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setValue("operation", op)}
                  className={cn(
                    "flex-1 rounded-[9px] py-1.5 text-[13px] font-medium transition-all",
                    operation === op
                      ? op === "Buy" ? "bg-green/20 text-green shadow-sm" : "bg-red/20 text-red shadow-sm"
                      : "text-text-muted hover:text-text-sub",
                  )}
                >
                  {op === "Buy" ? "Compra" : "Venda"}
                </button>
              ))}
            </div>
          </div>

          {/* Ticker + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Ticker</label>
              <input
                {...register("ticker")}
                placeholder="Ex: PETR4"
                className={inputClass(!!errors.ticker)}
                style={{ textTransform: "uppercase" }}
              />
              {errors.ticker && <p className="text-red text-[12px]">{errors.ticker.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Nome do ativo</label>
              <input
                {...register("name")}
                placeholder="Ex: Petrobras PN"
                className={inputClass(!!errors.name)}
              />
              {errors.name && <p className="text-red text-[12px]">{errors.name.message}</p>}
            </div>
          </div>

          {/* Asset type + Broker */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Tipo de ativo</label>
              <Select
                value={assetType}
                onValueChange={(v) => setValue("assetType", v as AssetType)}
              >
                <SelectTrigger className="border-border bg-surface2 text-text h-9 w-full rounded-lg text-[14px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(ASSET_TYPE_LABELS) as [AssetType, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Corretora (opcional)</label>
              <input
                {...register("broker")}
                placeholder="Ex: XP, NuInvest"
                className={inputClass()}
              />
            </div>
          </div>

          {/* Date + Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Data</label>
              <input
                {...register("date")}
                type="date"
                className={inputClass(!!errors.date)}
              />
              {errors.date && <p className="text-red text-[12px]">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Quantidade</label>
              <input
                {...register("quantity")}
                type="number"
                step="0.000001"
                min="0"
                placeholder="0"
                className={inputClass(!!errors.quantity)}
              />
              {errors.quantity && <p className="text-red text-[12px]">{errors.quantity.message}</p>}
            </div>
          </div>

          {/* Unit price + Other costs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Preço unitário (R$)</label>
              <input
                {...register("unitPrice")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className={inputClass(!!errors.unitPrice)}
              />
              {errors.unitPrice && <p className="text-red text-[12px]">{errors.unitPrice.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-text-sub text-[13px]">Outros custos (R$)</label>
              <input
                {...register("otherCosts")}
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                className={inputClass()}
              />
            </div>
          </div>

          {/* Account */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">
              {operation === "Buy" ? "Débito da conta" : "Crédito na conta"}
            </label>
            <Select
              value={watch("accountId")}
              onValueChange={(v) => setValue("accountId", v)}
              items={Object.fromEntries(accountOptions.map((a) => [a.id.toString(), a.name]))}
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
