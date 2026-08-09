"use client";

import { Download, Loader2 } from "lucide-react";

export type ExportState = "idle" | "loading" | "error";

/**
 * The export affordance in a page header. Failure shows on the button itself —
 * there is no toast system, and an export that quietly does nothing reads as a
 * broken button.
 */
export const ExportCsvButton = ({
  state,
  onClick,
  title = "Exportar CSV",
}: {
  state: ExportState;
  onClick: () => void;
  title?: string;
}) => {
  const failed = state === "error";

  return (
    <button
      onClick={onClick}
      disabled={state === "loading"}
      title={failed ? "Não foi possível exportar. Tente novamente." : title}
      aria-label={title}
      className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[var(--surface2)] transition-colors hover:bg-[var(--border-color)] hover:text-[var(--text)] disabled:opacity-60"
      style={{ color: failed ? "var(--clay)" : "var(--text-sub)" }}
    >
      {state === "loading" ? (
        <Loader2 size={15} strokeWidth={1.75} className="animate-spin" />
      ) : (
        <Download size={15} strokeWidth={1.75} />
      )}
    </button>
  );
};
