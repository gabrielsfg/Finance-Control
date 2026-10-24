"use client";

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDisconnectBank } from "@/features/open-finance/hooks/useOpenFinance";
import { openFinanceErrorMessage } from "@/features/open-finance/utils/openFinance";
import type { BankConnection } from "@/lib/types/openFinance.types";

type Props = {
  connection: BankConnection | null;
  onClose: () => void;
};

export function DisconnectBankModal({ connection, onClose }: Props) {
  const { mutateAsync, isPending } = useDisconnectBank();
  const [deleteTransactions, setDeleteTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setDeleteTransactions(false);
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!connection) return;
    setError(null);
    try {
      await mutateAsync({ connectionId: connection.id, deleteTransactions });
      handleClose();
    } catch (err) {
      setError(openFinanceErrorMessage(err));
    }
  };

  return (
    <Dialog open={!!connection} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">Desconectar banco</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          <div className="bg-red/8 border-red/20 flex items-start gap-3 rounded-lg border p-3">
            <TriangleAlert size={15} className="text-red mt-0.5 shrink-0" />
            <p className="text-text-sub text-[13px] leading-relaxed">
              A autorização com <span className="text-text font-500">{connection?.connectorName}</span> será revogada e
              novas transações deixarão de ser importadas. Suas contas continuam no app.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDeleteTransactions((v) => !v)}
            className={cn(
              "border-border flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
              deleteTransactions ? "border-red/40 bg-red/5" : "bg-surface2",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
                deleteTransactions ? "border-red bg-red text-white" : "border-border",
              )}
            >
              {deleteTransactions && "✓"}
            </span>
            <span className="text-text-sub text-[13px] leading-relaxed">
              Apagar também as transações importadas deste banco
            </span>
          </button>

          {error && <p className="text-red text-[12px]">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" size="sm" disabled={isPending} onClick={handleConfirm}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : "Desconectar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
