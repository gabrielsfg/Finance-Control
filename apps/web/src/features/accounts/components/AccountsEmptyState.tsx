"use client";

import { Plus, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onCreateClick: () => void;
};

export const AccountsEmptyState = ({ onCreateClick }: Props) => (
  <div className="border-border bg-surface flex flex-col items-center justify-center rounded-xl border py-16 text-center">
    <div className="bg-surface2 mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]">
      <Landmark size={22} className="text-text-muted" strokeWidth={1.5} />
    </div>
    <p className="font-500 text-text text-[15px]">Nenhuma conta cadastrada</p>
    <p className="text-text-muted mt-1 text-[13px]">
      Adicione sua primeira conta para começar a controlar seu patrimônio.
    </p>
    <Button size="sm" className="mt-5" onClick={onCreateClick}>
      <Plus size={14} />
      Nova conta
    </Button>
  </div>
);
