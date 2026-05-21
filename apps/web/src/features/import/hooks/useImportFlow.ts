"use client";

import { useState, useCallback, useMemo } from "react";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useParseImportFile, useConfirmImport } from "./useImport";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { ParsedTransactionItem } from "@/lib/types/import.types";
import type { TransactionType, SubCategoryItem } from "@/lib/types/transactions.types";

export type ImportStep = "closed" | "upload" | "review" | "done";

export type RowState = ParsedTransactionItem & {
  selected: boolean;
  subCategoryId: number | null;
  type: TransactionType;
};

export type SubcatMeta = {
  name: string;
  emoji: string | null;
  categoryName: string;
  categoryColor: string | null;
};

export type SubcatGroup = [string, { color: string; items: SubCategoryItem[] }];

export function useImportFlow() {
  const [step, setStep] = useState<ImportStep>("closed");
  const [accountId, setAccountId] = useState<number | "">("");
  const [countForBudget, setCountForBudget] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [importedCount, setImportedCount] = useState(0);

  const { data: subcats = [] } = useSubCategories();
  const parseMutation = useParseImportFile();
  const confirmMutation = useConfirmImport();

  const subcatMap = useMemo(() => {
    const m = new Map<number, SubcatMeta>();
    for (const s of subcats)
      m.set(s.id, {
        name: s.name,
        emoji: s.emoji ?? null,
        categoryName: s.categoryName,
        categoryColor: s.categoryColor ?? null,
      });
    return m;
  }, [subcats]);

  const subcatGroups = useMemo((): SubcatGroup[] => {
    const map = new Map<string, { color: string; items: SubCategoryItem[] }>();
    for (const s of subcats) {
      if (!map.has(s.categoryName)) {
        map.set(s.categoryName, {
          color: getCategoryColor(s.categoryColor, s.categoryName),
          items: [],
        });
      }
      map.get(s.categoryName)!.items.push(s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [subcats]);

  const _reset = useCallback((keepOpen: boolean) => {
    setStep(keepOpen ? "upload" : "closed");
    setFile(null);
    setAccountId("");
    setCountForBudget(true);
    setRows([]);
    parseMutation.reset();
    confirmMutation.reset();
  }, [parseMutation, confirmMutation]);

  const open = useCallback(() => setStep("upload"), []);
  const close = useCallback(() => _reset(false), [_reset]);
  const reset = useCallback(() => _reset(true), [_reset]);

  const handleFile = useCallback((f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "ofx" && ext !== "csv") {
      alert("Apenas arquivos OFX e CSV são suportados.");
      return;
    }
    setFile(f);
  }, []);

  const handleParse = useCallback(async () => {
    if (!file || accountId === "") return;
    const res = await parseMutation.mutateAsync({ file, accountId: Number(accountId) });
    setRows(
      res.transactions.map((t) => ({
        ...t,
        selected: !t.isDuplicate,
        subCategoryId: t.suggestedSubCategoryId,
        type: t.type,
      }))
    );
    setStep("review");
  }, [file, accountId, parseMutation]);

  const handleConfirm = useCallback(async () => {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) return;
    const res = await confirmMutation.mutateAsync({
      accountId: Number(accountId),
      countForBudget,
      transactions: selected.map((r) => ({
        date: r.date,
        description: r.description,
        value: r.value,
        type: r.type,
        subCategoryId: r.subCategoryId,
        destinationAccountId: null,
        paymentType: r.paymentType,
        totalInstallments: r.totalInstallments,
        installmentNumber: r.installmentNumber,
      })),
    });
    setImportedCount(res.importedCount);
    setStep("done");
  }, [rows, accountId, countForBudget, confirmMutation]);

  const toggleRow = useCallback(
    (idx: number) =>
      setRows((p) => p.map((r, i) => (i === idx ? { ...r, selected: !r.selected } : r))),
    []
  );

  const toggleAll = useCallback(
    () =>
      setRows((p) => {
        const all = p.every((r) => r.selected);
        return p.map((r) => ({ ...r, selected: !all }));
      }),
    []
  );

  const setRowSubcat = useCallback(
    (idx: number, val: number | null) =>
      setRows((p) => p.map((r, i) => (i === idx ? { ...r, subCategoryId: val } : r))),
    []
  );

  const setRowType = useCallback(
    (idx: number, val: TransactionType) =>
      setRows((p) => p.map((r, i) => (i === idx ? { ...r, type: val } : r))),
    []
  );

  return {
    step,
    accountId, setAccountId,
    countForBudget, setCountForBudget,
    file, handleFile, setFile,
    rows,
    importedCount,
    subcats, subcatMap, subcatGroups,
    parseMutation, confirmMutation,
    open, close, reset,
    handleParse, handleConfirm,
    toggleRow, toggleAll, setRowSubcat, setRowType,
    selectedCount: rows.filter((r) => r.selected).length,
    duplicateCount: rows.filter((r) => r.isDuplicate).length,
  };
}
