"use client";

import { Loader2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdateAccount } from "@/features/accounts/hooks/useAccounts";
import type { AccountItem } from "@/lib/types/accounts.types";

type Props = {
  account: AccountItem | null;
  onClose: () => void;
};

export const SetDefaultAccountModal = ({ account, onClose }: Props) => {
  const { mutateAsync, isPending } = useUpdateAccount();

  const handleConfirm = async () => {
    if (!account) return;
    await mutateAsync({
      id: account.id,
      data: {
        id: account.id,
        name: account.name,
        type: account.type,
        isDefaultAccount: true,
        goalAmount: null,
        billingDueDay: null,
        creditLimit: account.creditLimit ?? null,
        newBalance: null,
      },
    });
    onClose();
  };

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Definir como conta principal
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          <div className="bg-yellow/8 border-yellow/20 flex items-start gap-3 rounded-lg border p-3">
            <Star size={15} className="text-yellow mt-0.5 shrink-0" />
            <p className="text-text-sub text-[13px] leading-relaxed">
              Deseja definir{" "}
              <span className="text-text font-500">{account?.name}</span> como conta principal? A
              conta atual será substituída.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={handleConfirm}
            className="bg-yellow hover:bg-yellow/90 text-black"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
