"use client";

import { useState } from "react";
import { Loader2, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDeleteAccount } from "@/features/accounts/hooks/useAccounts";
import type { AccountItem } from "@/lib/types/accounts.types";

type Props = {
  account: AccountItem | null;
  onClose: () => void;
};

export const DeleteAccountModal = ({ account, onClose }: Props) => {
  const { mutateAsync, isPending } = useDeleteAccount();
  const [password, setPassword] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const handleClose = () => {
    setPassword("");
    setServerError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!account || !password.trim()) return;
    setServerError(null);
    try {
      await mutateAsync({ id: account.id, data: { password } });
      handleClose();
    } catch {
      setServerError("Senha incorreta ou erro ao excluir. Tente novamente.");
    }
  };

  return (
    <Dialog open={!!account} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display font-600 text-text text-[16px]">
            Excluir conta
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-1">
          <div className="bg-red/8 border-red/20 flex items-start gap-3 rounded-lg border p-3">
            <TriangleAlert size={15} className="text-red mt-0.5 shrink-0" />
            <p className="text-text-sub text-[13px] leading-relaxed">
              Excluir{" "}
              <span className="text-text font-500">{account?.name}</span> irá remover todas as
              transações vinculadas. Esta ação não pode ser desfeita.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px]">Confirme sua senha para continuar</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className={cn(
                "border-border bg-surface2 text-text placeholder:text-text-muted h-9 rounded-lg border px-3 text-[14px] outline-none focus:border-red/60",
                serverError && "border-red/60",
              )}
            />
            {serverError && <p className="text-red text-[12px]">{serverError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending || !password.trim()}
            onClick={handleConfirm}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : "Excluir conta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
