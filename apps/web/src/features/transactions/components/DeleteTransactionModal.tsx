"use client";

import { Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteTransaction } from "@/features/transactions/hooks/useTransactions";
import type { TransactionItem } from "@/lib/types/transactions.types";
import { useState } from "react";

type Props = {
  transaction: TransactionItem | null;
  onClose: () => void;
};

export const DeleteTransactionModal = ({ transaction, onClose }: Props) => {
  const { mutateAsync, isPending } = useDeleteTransaction();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!transaction) return;
    setServerError(null);
    try {
      await mutateAsync(transaction.id);
      handleClose();
    } catch {
      setServerError("Erro ao excluir. Tente novamente.");
    }
  };

  return (
    <Dialog open={!!transaction} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Excluir transação
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          <div className="bg-red/8 border-red/20 flex items-start gap-3 rounded-lg border p-3">
            <TriangleAlert size={15} className="text-red mt-0.5 shrink-0" />
            <p className="text-text-sub text-[13px] leading-relaxed">
              Excluir{" "}
              <span className="text-text font-500">{transaction?.description}</span> removerá
              permanentemente esta transação. Esta ação não pode ser desfeita.
            </p>
          </div>
          {serverError && <p className="text-red text-[12px]">{serverError}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
