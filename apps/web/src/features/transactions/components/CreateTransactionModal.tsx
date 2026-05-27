"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2, ChevronDown, X } from "lucide-react";
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
import { useCategories } from "@/features/categories/hooks/useCategories";
import { CreateSubCategoryModal } from "@/features/categories/components/CreateSubCategoryModal";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { SubCategoryItem } from "@/lib/types/transactions.types";
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
  const { data: categories = [] } = useCategories();
  const [serverError, setServerError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultType);
  const [showCreateSubCategory, setShowCreateSubCategory] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubCategoryItem | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

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

  const handleClose = () => {
    reset();
    setServerError(null);
    setTransactionType(defaultType);
    setSelectedSub(null);
    setCategoryPickerOpen(false);
    setCategorySearch("");
    onClose();
  };

  const handlePickSub = (sub: SubCategoryItem) => {
    setSelectedSub(sub);
    setValue("subCategoryId", String(sub.id), { shouldValidate: true });
    setCategoryPickerOpen(false);
    setCategorySearch("");
  };

  const groupedFiltered = subcategories
    .filter((s) =>
      !categorySearch.trim() ||
      s.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      s.categoryName.toLowerCase().includes(categorySearch.toLowerCase()),
    )
    .reduce<Record<string, SubCategoryItem[]>>((acc, s) => {
      (acc[s.categoryName] ??= []).push(s);
      return acc;
    }, {});

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
    <>
    <CreateSubCategoryModal
      open={showCreateSubCategory}
      onClose={() => setShowCreateSubCategory(false)}
      categories={categories}
      zIndex={60}
    />
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
            <div className="relative">
              {/* Trigger */}
              <button
                type="button"
                onClick={() => setCategoryPickerOpen((o) => !o)}
                className={cn(
                  "border-border bg-surface2 text-text h-9 w-full rounded-lg border px-3 text-[13px] flex items-center justify-between gap-2",
                  errors.subCategoryId && "border-red/60",
                  categoryPickerOpen && "border-green/60",
                )}
              >
                {selectedSub ? (
                  <span className="flex items-center gap-2 min-w-0">
                    {selectedSub.emoji
                      ? <span className="text-[13px] leading-none shrink-0">{selectedSub.emoji}</span>
                      : <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(selectedSub.categoryColor, selectedSub.categoryName) }} />
                    }
                    <span className="truncate">{selectedSub.name}</span>
                  </span>
                ) : (
                  <span className="text-text-muted">Selecionar subcategoria</span>
                )}
                {selectedSub
                  ? <X size={13} className="text-text-muted shrink-0" onClick={(e) => { e.stopPropagation(); setSelectedSub(null); setValue("subCategoryId", "", { shouldValidate: true }); }} />
                  : <ChevronDown size={13} className="text-text-muted shrink-0" />
                }
              </button>

              {/* Dropdown */}
              {categoryPickerOpen && (
                <div className="border-border bg-surface absolute left-0 right-0 top-10 z-10 rounded-xl border shadow-xl overflow-hidden">
                  <div className="border-border flex items-center gap-2 border-b px-3 py-2">
                    <input
                      autoFocus
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Buscar..."
                      className="bg-transparent text-text placeholder:text-text-muted flex-1 text-[13px] outline-none"
                    />
                    <button type="button" onClick={() => { setCategoryPickerOpen(false); setCategorySearch(""); }} className="text-text-muted hover:text-text">
                      <X size={13} />
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {Object.keys(groupedFiltered).length === 0 ? (
                      <p className="text-text-muted px-3 py-4 text-center text-[12px]">Nenhuma encontrada</p>
                    ) : (
                      Object.entries(groupedFiltered).map(([cat, subs]) => {
                        const color = getCategoryColor(subs[0]?.categoryColor, cat);
                        return (
                          <div key={cat}>
                            <div className="bg-surface2/60 flex items-center gap-1.5 px-3 py-1">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <p className="text-text-muted text-[11px] font-medium uppercase tracking-[0.06em]">{cat}</p>
                            </div>
                            {subs.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handlePickSub(s)}
                                className="hover:bg-surface2 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
                              >
                                {s.emoji
                                  ? <span className="text-[13px] leading-none shrink-0">{s.emoji}</span>
                                  : <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                }
                                <span className="text-text text-[13px]">{s.name}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="border-border border-t px-3 py-2">
                    <button
                      type="button"
                      onClick={() => { setCategoryPickerOpen(false); setShowCreateSubCategory(true); }}
                      className="text-text-muted hover:text-green flex w-full items-center gap-1.5 text-[12px] transition-colors"
                    >
                      <span className="text-[14px] leading-none">+</span>
                      Nova subcategoria
                    </button>
                  </div>
                </div>
              )}
            </div>
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
    </>
  );
};
