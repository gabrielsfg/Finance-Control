"use client";

import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** Yes/no confirmation for cancel and refund — the two actions that end something. */
export function ConfirmBillingActionDialog({
  open,
  title,
  description,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-text text-[16px]">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-text-sub text-[13.5px] leading-relaxed">{description}</p>
        {error && <p className="text-[12.5px] text-[var(--clay)]">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Voltar
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onConfirm} disabled={pending}>
            {pending && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
