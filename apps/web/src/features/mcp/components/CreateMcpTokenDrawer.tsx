"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Check, KeyRound, Loader2, TriangleAlert, X } from "lucide-react";
import { TabChips } from "@/components/shared/TabChips";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/features/assistant/utils/apiError";
import { useCreateMcpToken } from "../hooks/useMcp";
import { CopyField } from "./CopyButton";
import type { McpScope } from "@/lib/types/mcp.types";

type Props = {
  onClose: () => void;
  scopes: McpScope[];
};

const NAME_MAX = 60;

const tokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Dê um nome com pelo menos 2 caracteres")
    .max(NAME_MAX, `No máximo ${NAME_MAX} caracteres`),
});

type TokenForm = z.infer<typeof tokenSchema>;

const EXPIRY_OPTIONS = [
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "60", label: "60 dias" },
  { id: "90", label: "90 dias" },
] as const;

type ExpiryOption = (typeof EXPIRY_OPTIONS)[number]["id"];

const INPUT_CLASS =
  "border-border bg-surface2 text-text placeholder:text-text-muted h-11 w-full rounded-[13px] border px-3.5 text-[15px] outline-none focus:border-[var(--brand-cobalt)]";

/**
 * Creates a personal access token for clients that cannot do the OAuth flow. The full
 * token is returned once — the drawer switches to showing it, with a copy button and a
 * warning, and it is gone as soon as the drawer closes.
 *
 * Mounted only while open, so every open starts clean — above all, a previous token is
 * never shown again.
 */
export function CreateMcpTokenDrawer({ onClose, scopes }: Props) {
  const create = useCreateMcpToken();
  const [selectedScopes, setSelectedScopes] = useState<string[]>(() => scopes.map((s) => s.name));
  const [expiresInDays, setExpiresInDays] = useState<ExpiryOption>("30");
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TokenForm>({ resolver: zodResolver(tokenSchema), defaultValues: { name: "" } });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const toggleScope = (name: string) =>
    setSelectedScopes((current) =>
      current.includes(name) ? current.filter((s) => s !== name) : [...current, name],
    );

  const onSubmit = handleSubmit((values) => {
    if (selectedScopes.length === 0) return;
    create.mutate(
      { name: values.name, scopes: selectedScopes, expiresInDays: Number(expiresInDays) },
      { onSuccess: (response) => setCreatedToken(response.token) },
    );
  });

  return (
    <>
      <div className="anim-fade fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div
        role="dialog"
        aria-label="Criar token pessoal"
        className="anim-drawer border-border bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l shadow-2xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-[color-mix(in_srgb,var(--brand-cobalt)_12%,transparent)]">
              <KeyRound size={16} className="text-[var(--brand-accent)]" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="font-display text-text text-[15px] font-semibold">Token pessoal</h2>
              <p className="text-text-muted text-[12px]">Para IAs que não fazem login pelo navegador</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {createdToken ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--moss)]">
              <Check size={16} strokeWidth={2.4} />
              Token criado
            </div>

            <CopyField value={createdToken} multiline />

            <div
              className="flex items-start gap-2.5 rounded-[13px] border p-3.5"
              style={{
                borderColor: "color-mix(in srgb, var(--gold) 40%, transparent)",
                background: "color-mix(in srgb, var(--gold) 8%, transparent)",
              }}
            >
              <TriangleAlert size={14} className="mt-[2px] shrink-0 text-[var(--gold)]" />
              <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
                <span className="font-medium text-[var(--text)]">Copie agora: ele não será mostrado de novo.</span>{" "}
                Quem tiver este token lê seus dados financeiros. Guarde como uma senha e revogue
                se ele vazar.
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-auto rounded-[13px] bg-[var(--brand-cobalt)] px-4 py-2.5 text-[14px] font-semibold text-white"
            >
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mcp-token-name" className="text-text-sub text-[13px] font-medium">
                Nome
              </label>
              <input
                id="mcp-token-name"
                {...register("name")}
                maxLength={NAME_MAX}
                placeholder="Ex.: Cursor no notebook"
                className={INPUT_CLASS}
              />
              {errors.name && <p className="text-[12px] text-[var(--clay)]">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-text-sub text-[13px] font-medium">Validade</span>
              <TabChips size="sm" items={EXPIRY_OPTIONS} value={expiresInDays} onChange={setExpiresInDays} />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-text-sub text-[13px] font-medium">Permissões (somente leitura)</span>
              <div className="flex flex-col gap-1.5">
                {scopes.map((scope) => {
                  const checked = selectedScopes.includes(scope.name);
                  return (
                    <label
                      key={scope.name}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-[11px] border px-3 py-2.5 transition-colors",
                        checked ? "border-[var(--brand-cobalt)]/50" : "border-border",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleScope(scope.name)}
                        className="accent-green mt-0.5 h-4 w-4 cursor-pointer"
                      />
                      <span className="min-w-0">
                        <span className="block font-mono text-[12px] text-[var(--text)]">{scope.name}</span>
                        <span className="block text-[12px] text-[var(--text-sub)]">{scope.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {selectedScopes.length === 0 && (
                <p className="text-[12px] text-[var(--clay)]">Escolha pelo menos uma permissão.</p>
              )}
            </div>

            {create.isError && (
              <p className="text-[12.5px] text-[var(--clay)]">
                {getApiErrorMessage(create.error, "Não foi possível criar o token. Tente novamente.")}
              </p>
            )}

            <div className="border-border mt-auto flex gap-2.5 border-t pt-4">
              <button
                type="button"
                onClick={onClose}
                className="border-border text-text flex-1 rounded-[13px] border px-4 py-2.5 text-[14px] font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={create.isPending || selectedScopes.length === 0}
                className="flex flex-1 items-center justify-center gap-2 rounded-[13px] bg-[var(--brand-cobalt)] px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
              >
                {create.isPending && <Loader2 size={15} className="animate-spin" />}
                Criar token
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
