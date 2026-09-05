"use client";

import { useState, useCallback, useMemo } from "react";
import { useSubCategories } from "@/features/transactions/hooks/useSubCategories";
import { useParseImportFile, useConfirmImport } from "./useImport";
import { normalizeSearch } from "@/lib/utils";
import type { ParsedTransactionItem } from "@/lib/types/import.types";
import type { TransactionType } from "@/lib/types/transactions.types";

export type ImportStep = "closed" | "upload" | "review" | "done";

export type RowState = ParsedTransactionItem & {
  selected: boolean;
  subCategoryId: number | null;
  type: TransactionType;
  /** Tag names, per row. Names rather than ids because the reviewer can invent one. */
  tags: string[];
};

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

  /**
   * Every tag name used anywhere in the batch, deduplicated by comparison key.
   *
   * Feeds each row's picker so a tag invented on one row becomes a suggestion on all the
   * others. Without it the reviewer retypes the same name per row from memory, and the
   * first typo is a tag that drifts from the one they meant. First spelling wins, which
   * is also what the server does when it resolves the batch.
   */
  const pendingTagNames = useMemo(() => {
    const byKey = new Map<string, string>();
    for (const row of rows)
      for (const tag of row.tags) {
        const key = normalizeSearch(tag);
        if (key && !byKey.has(key)) byKey.set(key, tag);
      }
    return [...byKey.values()];
  }, [rows]);

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
        tags: [],
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
        tags: r.tags,
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

  const setRowDescription = useCallback(
    (idx: number, val: string) =>
      setRows((p) => p.map((r, i) => (i === idx ? { ...r, description: val } : r))),
    []
  );

  // Stored as YYYY-MM-DD, which is what the API sends (DateOnly) and what the picker
  // speaks — so an edited row and an untouched one look the same on the wire.
  const setRowDate = useCallback(
    (idx: number, val: string) =>
      setRows((p) => p.map((r, i) => (i === idx ? { ...r, date: val } : r))),
    []
  );

  const setRowTags = useCallback(
    (idx: number, val: string[]) =>
      setRows((p) => p.map((r, i) => (i === idx ? { ...r, tags: val } : r))),
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
    subcats,
    pendingTagNames,
    parseMutation, confirmMutation,
    open, close, reset,
    handleParse, handleConfirm,
    toggleRow, toggleAll, setRowSubcat, setRowType, setRowTags,
    setRowDescription, setRowDate,
    selectedCount: rows.filter((r) => r.selected).length,
    duplicateCount: rows.filter((r) => r.isDuplicate).length,
  };
}
