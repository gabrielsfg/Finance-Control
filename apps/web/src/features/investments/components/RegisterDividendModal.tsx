"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Loader2,
  X,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
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

// ── Constants ──────────────────────────────────────────────────────────────────

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted w-full border outline-none focus:border-green/60 h-11 rounded-lg px-3.5 text-[15px]";

const TRIGGER_CLASS =
  "border-border bg-surface2 text-text w-full !h-11 rounded-lg px-3.5 text-[15px]";

const VALUE_WRAPPER_CLASS =
  "border-border bg-surface2 flex w-full items-center border h-11 rounded-lg";

const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const WEEK_DAYS   = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ── DatePickerField ────────────────────────────────────────────────────────────

function DatePickerField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const today   = new Date();
  const parsed  = value ? new Date(value + "T00:00:00") : null;
  const [viewYear,  setViewYear]  = useState(parsed?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth()     ?? today.getMonth());

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

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (string | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const month = String(viewMonth + 1).padStart(2, "0");
    const day   = String(d).padStart(2, "0");
    cells.push(`${viewYear}-${month}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = today.toISOString().slice(0, 10);
  const label = value
    ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "Selecionar data";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(INPUT_CLASS, "flex items-center gap-2.5 text-left", !value && "text-text-muted")}
      >
        <CalendarIcon size={15} className="text-text-muted shrink-0" />
        <span className={cn("text-[15px]", value ? "text-text" : "text-text-muted")}>{label}</span>
      </button>

      {open && (
        <div className="border-border bg-surface absolute left-0 top-12 z-[70] rounded-xl border p-4 shadow-2xl" style={{ minWidth: 280 }}>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <span className="text-text text-[13px] font-semibold">{MONTH_NAMES[viewMonth]} {viewYear}</span>
            <button type="button" onClick={nextMonth} className="text-text-muted hover:text-text flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-surface3">
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7">
            {WEEK_DAYS.map(d => (
              <div key={d} className="text-text-muted py-1 text-center text-[10px] font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`} />;
              const isSelected = dateStr === value;
              const isToday    = dateStr === todayStr;
              return (
                <div key={dateStr} className="flex items-center justify-center py-0.5">
                  <button
                    type="button"
                    onClick={() => { onChange(dateStr); setOpen(false); }}
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

// ── FormField ──────────────────────────────────────────────────────────────────

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-text-sub text-[14px]">{label}</label>
      {children}
      {error && <p className="text-red text-[12px]">{error}</p>}
    </div>
  );
}

// ── Drawer ─────────────────────────────────────────────────────────────────────

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
  const accountId    = watch("accountId");
  const date         = watch("date") ?? "";

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

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

  const accLabel = accountOptions.find(a => a.id.toString() === accountId)?.name;

  return (
    <>
      <div
        onClick={handleClose}
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
          <div>
            <h2 className="font-display font-600 text-text text-[17px]">Registrar Rendimento</h2>
            {ticker && <p className="text-text-muted mt-0.5 text-[13px]">{ticker}</p>}
          </div>
          <button
            onClick={handleClose}
            title="Fechar"
            className="text-text-muted hover:bg-surface2 hover:text-text flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">

            {/* Type */}
            <FormField label="Tipo de rendimento">
              <Select
                value={dividendType}
                onValueChange={(v) => setValue("type", v as DividendType)}
              >
                <SelectTrigger className={TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(DIVIDEND_TYPE_LABELS) as [DividendType, string][]).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Date */}
            <FormField label="Data do pagamento" error={errors.date?.message}>
              <DatePickerField
                value={date}
                onChange={(v) => setValue("date", v, { shouldValidate: true })}
              />
            </FormField>

            {/* Amount */}
            <FormField label="Valor recebido (R$)" error={errors.amount?.message}>
              <div className={cn(VALUE_WRAPPER_CLASS, errors.amount && "border-red/60")}>
                <span className="text-text-muted select-none pl-3.5 text-[15px]">R$</span>
                <CurrencyInput
                  value={watch("amount") ?? ""}
                  onChange={(v) => setValue("amount", v, { shouldValidate: true })}
                  className="h-full flex-1 bg-transparent px-2 text-[15px] text-text outline-none"
                />
              </div>
            </FormField>

            {/* Account */}
            <FormField label="Conta de destino" error={errors.accountId?.message}>
              <Select
                value={accountId ?? ""}
                onValueChange={(v) => setValue("accountId", v ?? "", { shouldValidate: true })}
              >
                <SelectTrigger className={cn(TRIGGER_CLASS, errors.accountId && "border-red/60")}>
                  <SelectValue>
                    {accLabel ?? <span className="text-text-muted">Selecionar conta</span>}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {serverError && <p className="text-red text-[13px]">{serverError}</p>}
          </div>

          {/* Footer */}
          <div className="border-border shrink-0 border-t px-6 py-4">
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? <Loader2 size={16} className="animate-spin" /> : "Registrar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
