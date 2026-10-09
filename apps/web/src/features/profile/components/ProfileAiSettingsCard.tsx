"use client";

import { useEffect, useRef, useState } from "react";
import { Ban, Check, Loader2, ShieldCheck, TriangleAlert, Trash2 } from "lucide-react";
import { Card, CardHead, LedgerRule } from "@/components/shared/Card";
import { Switch } from "@/components/shared/Switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAiSettings,
  useDeleteInsights,
  useUpdateAiSettings,
} from "@/features/insights/hooks/useInsight";
import { useDeleteAllConversations } from "@/features/assistant/hooks/useAssistant";

const SENT = [
  "Transações, separadas por conta",
  "Nome e saldo das contas (ex.: Nubank)",
  "Categorias, orçamentos e metas",
  "Investimentos",
  "Seu primeiro nome",
];

const NEVER_SENT = [
  "CPF e documentos",
  "E-mail",
  "Número de cartão",
  "Agência e número da conta bancária",
  "Senhas e códigos de acesso",
  "Outros dados sensíveis",
];

type PendingDelete = "insights" | "conversations" | null;

/**
 * "IA no Quantia": the user's switch for every in-app AI feature, and a plain account of
 * what leaves the app when it is on. Said here rather than only in the privacy policy —
 * the switch is where the decision is made, so the explanation has to sit next to it.
 */
export const ProfileAiSettingsCard = () => {
  const { data: settings, isLoading, isError } = useAiSettings();
  const update = useUpdateAiSettings();
  const deleteInsights = useDeleteInsights();
  const deleteConversations = useDeleteAllConversations();
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // "Perfil → IA no Quantia" links land here with a hash. The page renders behind a
  // loading state first, so the browser's own jump finds nothing — scroll once mounted.
  useEffect(() => {
    if (window.location.hash === "#ai-settings") {
      anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const provider = settings?.provider || "Anthropic";
  const deleting = deleteInsights.isPending || deleteConversations.isPending;

  const closeDialog = () => {
    if (deleting) return;
    setPendingDelete(null);
    setDeleteError(null);
  };

  const handleDelete = () => {
    setDeleteError(null);
    const mutation = pendingDelete === "insights" ? deleteInsights : deleteConversations;
    mutation.mutate(undefined, {
      onSuccess: ({ deleted }) => {
        setDoneMessage(
          pendingDelete === "insights"
            ? `${deleted} ${deleted === 1 ? "análise apagada" : "análises apagadas"}.`
            : `${deleted} ${deleted === 1 ? "conversa apagada" : "conversas apagadas"}.`,
        );
        setPendingDelete(null);
      },
      onError: () => setDeleteError("Não foi possível apagar agora. Tente novamente."),
    });
  };

  return (
    <div id="ai-settings" ref={anchorRef} className="scroll-mt-6">
      <Card>
        <CardHead
          title="IA no Quantia"
          subtitle="Análises semanais, assistente e categorização da importação"
          right={
            settings && (
              <Switch
                value={settings.aiEnabled}
                onChange={(aiEnabled) => update.mutate({ aiEnabled })}
                disabled={update.isPending}
                aria-label="Usar IA no Quantia"
              />
            )
          }
        />

        {isLoading && (
          <div className="flex items-center gap-2 py-2 text-[13px] text-[var(--text-sub)]">
            <Loader2 size={14} className="animate-spin" />
            Carregando...
          </div>
        )}

        {isError && (
          <p className="text-[13px] text-[var(--text-sub)]">
            Não foi possível carregar suas configurações de IA.
          </p>
        )}

        {settings && (
          <>
            <p className="text-[13px] leading-relaxed text-[var(--text-sub)]">
              {settings.aiEnabled
                ? "Ligada. Quando você usa um recurso de IA, os dados necessários para responder são enviados para processamento."
                : "Desligada. Nenhum dado é enviado para IA — as análises, o assistente e a categorização automática por IA ficam pausados."}
            </p>

            {!settings.isAvailable && (
              <p className="mt-2 text-[12.5px] text-[var(--text-sub)]">
                Os recursos de IA estão pausados na plataforma no momento.
              </p>
            )}

            {update.isError && (
              <p className="mt-2 text-[12px] text-[var(--clay)]">
                Não foi possível salvar. Tente novamente.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DataList title="O que é enviado" items={SENT} icon={Check} color="var(--moss)" />
              <DataList title="O que nunca é enviado" items={NEVER_SENT} icon={Ban} color="var(--clay)" />
            </div>

            <div className="mt-3 flex items-start gap-2.5 rounded-[13px] bg-[var(--surface2)] p-3.5">
              <ShieldCheck size={15} className="mt-px shrink-0 text-[var(--brand-accent)]" />
              <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
                Quem processa é a <span className="font-medium text-[var(--text)]">{provider}</span>,
                nos Estados Unidos. Seus dados não são usados para treinar modelos de IA e só
                são enviados quando você usa um recurso de IA.
              </p>
            </div>

            <LedgerRule />

            {settings.isPremium && settings.chatMessagesLimit > 0 && (
              <p className="mb-3 text-[13px] text-[var(--text-sub)]">
                Assistente:{" "}
                <span className="font-mono text-[var(--text)] tabular-nums">
                  {settings.chatMessagesUsed}/{settings.chatMessagesLimit}
                </span>{" "}
                mensagens este mês
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <DeleteButton
                label="Apagar análises"
                count={settings.insightCount}
                onClick={() => {
                  setDoneMessage(null);
                  setPendingDelete("insights");
                }}
              />
              <DeleteButton
                label="Apagar conversas"
                count={settings.conversationCount}
                onClick={() => {
                  setDoneMessage(null);
                  setPendingDelete("conversations");
                }}
              />
            </div>

            {doneMessage && (
              <p className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-[var(--moss)]">
                <Check size={13} />
                {doneMessage}
              </p>
            )}
          </>
        )}
      </Card>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display font-600 text-text text-[16px]">
              {pendingDelete === "insights" ? "Apagar análises" : "Apagar conversas"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-1">
            <div className="bg-red/8 border-red/20 flex items-start gap-3 rounded-lg border p-3">
              <TriangleAlert size={15} className="text-red mt-0.5 shrink-0" />
              <p className="text-text-sub text-[13px] leading-relaxed">
                {pendingDelete === "insights"
                  ? "Todas as análises semanais guardadas serão apagadas. Uma nova é gerada na próxima vez que você abrir o painel."
                  : "Todo o histórico do assistente será apagado, incluindo propostas ainda não confirmadas."}{" "}
                Esta ação não pode ser desfeita.
              </p>
            </div>
            {deleteError && <p className="text-red text-[12px]">{deleteError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={closeDialog} disabled={deleting}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
              {deleting ? <Loader2 size={14} className="animate-spin" /> : "Apagar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function DataList({
  title,
  items,
  icon: Icon,
  color,
}: {
  title: string;
  items: string[];
  icon: typeof Check;
  color: string;
}) {
  return (
    <div className="rounded-[13px] border border-[var(--border-color)] p-3.5">
      <p className="mb-2 font-mono text-[10.5px] tracking-[0.1em] text-[var(--text-sub)] uppercase">
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[13px] text-[var(--text)]">
            <Icon size={13} strokeWidth={2.2} className="mt-[3px] shrink-0" style={{ color }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeleteButton({ label, count, onClick }: { label: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={count === 0}
      className="inline-flex items-center gap-1.5 rounded-[11px] border px-3 py-2 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: "color-mix(in srgb, var(--clay) 40%, transparent)",
        color: "var(--clay)",
      }}
    >
      <Trash2 size={13} />
      {label}
      <span className="font-mono text-[11px] tabular-nums opacity-80">({count})</span>
    </button>
  );
}
