"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, FileText, Loader2, X, UploadCloud, FileUp } from "lucide-react";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACCOUNT_TYPE_CONFIG } from "@/lib/config/accountTypes";
import type { useImportFlow } from "@/features/import/hooks/useImportFlow";

const TRIGGER_CLASS = "border-border bg-surface2 text-text w-full !h-9 rounded-lg px-3 text-[13px]";
const DROPDOWN_PROPS = { alignItemWithTrigger: false, sideOffset: 4 } as const;

type Flow = ReturnType<typeof useImportFlow>;

type Props = {
  flow: Flow;
};

export function ImportDrawer({ flow }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: accounts = [] } = useAccounts();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) flow.handleFile(f);
  }, [flow]);

  if (flow.step !== "upload") return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={flow.close}
      />

      {/* Drawer panel */}
      <div className="border-border bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l shadow-2xl">
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-green/10 flex h-8 w-8 items-center justify-center rounded-[9px]">
              <FileUp size={16} className="text-green" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-text text-[15px] font-semibold">Importar Extrato</h2>
              <p className="text-text-muted text-[12px]">OFX ou CSV · máx. 10 MB</p>
            </div>
          </div>
          <button onClick={flow.close} className="text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {/* Account selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-sub text-[13px] font-medium">Conta de destino</label>
            <Select
              value={flow.accountId === "" ? undefined : String(flow.accountId)}
              onValueChange={(v) => flow.setAccountId(Number(v))}
            >
              <SelectTrigger className={TRIGGER_CLASS}>
                <SelectValue>
                  {(() => {
                    const a = flow.accountId === "" ? undefined : accounts.find((a) => a.id === flow.accountId);
                    if (!a) return <span className="text-text-muted">Selecione uma conta</span>;
                    const cfg = ACCOUNT_TYPE_CONFIG[a.type];
                    const Icon = cfg.Icon;
                    return (
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${cfg.color}1a` }}>
                          <Icon size={12} style={{ color: cfg.color }} />
                        </span>
                        <span>{a.name}</span>
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent {...DROPDOWN_PROPS}>
                {accounts.map((a) => {
                  const cfg = ACCOUNT_TYPE_CONFIG[a.type];
                  const Icon = cfg.Icon;
                  return (
                    <SelectItem key={a.id} value={String(a.id)}>
                      <div className="flex items-center gap-2.5 py-0.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${cfg.color}1a` }}>
                          <Icon size={13} style={{ color: cfg.color }} />
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-medium leading-tight">{a.name}</span>
                          <span className="text-text-muted text-[11px] leading-tight">{cfg.label}</span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Count for budget checkbox */}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={flow.countForBudget}
              onChange={(e) => flow.setCountForBudget(e.target.checked)}
              className="accent-green mt-0.5 h-4 w-4 cursor-pointer rounded"
            />
            <div>
              <span className="text-text text-[13px] font-medium">Contar no orçamento ativo</span>
              <p className="text-text-muted mt-0.5 text-[12px]">
                As transações importadas serão associadas ao orçamento ativo atual.
              </p>
            </div>
          </label>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "border-border flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 transition-colors",
              dragging ? "border-green/60 bg-green/5" : "hover:border-green/40 hover:bg-surface2/40"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".ofx,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) flow.handleFile(f); }}
            />
            {flow.file ? (
              <>
                <div className="bg-green/10 mb-3 flex h-12 w-12 items-center justify-center rounded-[12px]">
                  <FileText size={22} className="text-green" strokeWidth={1.5} />
                </div>
                <p className="text-text font-medium">{flow.file.name}</p>
                <p className="text-text-muted mt-1 text-xs">{(flow.file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); flow.setFile(null); }}
                  className="text-text-muted hover:text-red mt-3 flex items-center gap-1 text-xs transition-colors"
                >
                  <X size={12} /> Remover arquivo
                </button>
              </>
            ) : (
              <>
                <div className="bg-surface2 mb-3 flex h-12 w-12 items-center justify-center rounded-[12px]">
                  <UploadCloud size={22} className="text-text-muted" strokeWidth={1.5} />
                </div>
                <p className="text-text font-medium">Arraste ou clique para selecionar</p>
                <p className="text-text-muted mt-1 text-xs">OFX ou CSV · máx. 10 MB</p>
              </>
            )}
          </div>

          {flow.parseMutation.isError && (
            <p className="text-red text-sm">
              {(flow.parseMutation.error as Error)?.message ?? "Erro ao processar arquivo."}
            </p>
          )}
        </div>

        <div className="border-border border-t px-5 py-4">
          <button
            onClick={flow.handleParse}
            disabled={!flow.file || flow.accountId === "" || flow.parseMutation.isPending}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all",
              !flow.file || flow.accountId === "" || flow.parseMutation.isPending
                ? "bg-surface2 text-text-muted cursor-not-allowed"
                : "bg-green text-black hover:bg-green/90"
            )}
          >
            {flow.parseMutation.isPending
              ? <><Loader2 size={15} className="animate-spin" /> Analisando com IA…</>
              : <><Upload size={15} /> Analisar arquivo</>}
          </button>
        </div>
      </div>
    </>
  );
}
