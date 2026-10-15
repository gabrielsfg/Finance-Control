"use client";

import { useState } from "react";
import { CheckCheck, Landmark, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkTransactionsReviewed, useOpenFinanceStatus } from "@/features/open-finance/hooks/useOpenFinance";
import type { TransactionItem } from "@/lib/types/transactions.types";

type Props = {
  /** Showing only the rows to review. */
  active: boolean;
  onToggle: (active: boolean) => void;
  /** The rows on screen; in review mode, the ones "confirm" applies to. */
  visible: TransactionItem[];
};

/**
 * Bank-synced transactions arrive flagged "A revisar". This bar says how many are
 * waiting, filters the list down to them, and confirms the ones on screen in one go —
 * editing a row confirms it too.
 */
export function ReviewBanner({ active, onToggle, visible }: Props) {
  const { data: status } = useOpenFinanceStatus();
  const markReviewed = useMarkTransactionsReviewed();
  const [error, setError] = useState(false);

  const pending = status?.pendingReviewCount ?? 0;
  if (!active && pending === 0) return null;

  const toConfirm = visible.filter((t) => t.needsReview).map((t) => t.id);

  const confirmVisible = async () => {
    setError(false);
    try {
      await markReviewed.mutateAsync(toConfirm);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="border-orange/30 bg-orange/8 flex flex-wrap items-center gap-3 rounded-[14px] border px-4 py-3">
      <Landmark size={15} className="text-orange shrink-0" />
      <p className="text-text-sub min-w-0 flex-1 text-[13px]">
        {pending > 0 ? (
          <>
            <span className="text-text font-medium">
              {pending} transaç{pending !== 1 ? "ões" : "ão"} do banco
            </span>{" "}
            aguardando revisão. Confira as categorias e confirme.
          </>
        ) : (
          "Tudo revisado."
        )}
        {error && <span className="text-red ml-2">Não foi possível confirmar. Tente de novo.</span>}
      </p>
      {active ? (
        <div className="flex gap-2">
          {toConfirm.length > 0 && (
            <Button size="sm" disabled={markReviewed.isPending} onClick={confirmVisible}>
              {markReviewed.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
              Confirmar {toConfirm.length} desta página
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onToggle(false)}>
            Ver todas
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => onToggle(true)}>
          Revisar
        </Button>
      )}
    </div>
  );
}
