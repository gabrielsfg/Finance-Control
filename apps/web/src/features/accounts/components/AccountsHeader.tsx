"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  accountCount: number;
  onCreateClick: () => void;
};

export const AccountsHeader = ({ accountCount, onCreateClick }: Props) => (
  <div className="flex items-start justify-between">
    <div>
      <h1 className="font-display font-700 text-text text-[22px] tracking-tight">Contas</h1>
      <p className="text-text-muted mt-0.5 text-[13px]">
        {accountCount > 0 ? `${accountCount} conta${accountCount !== 1 ? "s" : ""}` : "Nenhuma conta"}
      </p>
    </div>
    <Button size="sm" onClick={onCreateClick}>
      <Plus size={14} />
      Nova conta
    </Button>
  </div>
);
