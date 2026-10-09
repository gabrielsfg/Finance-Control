"use client";

import { useState } from "react";
import { KeyRound, Link2, Loader2, Plus, ShieldAlert } from "lucide-react";
import { Card, CardHead, LedgerRule } from "@/components/shared/Card";
import { TabChips } from "@/components/shared/TabChips";
import { CopyField } from "@/features/mcp/components/CopyButton";
import { CreateMcpTokenDrawer } from "@/features/mcp/components/CreateMcpTokenDrawer";
import {
  useMcpConnections,
  useMcpInfo,
  useMcpTokens,
  useRevokeMcpConnection,
  useRevokeMcpToken,
} from "@/features/mcp/hooks/useMcp";
import { formatDateFull, formatRelativeTime } from "@/lib/utils/formatDate";
import { cn } from "@/lib/utils";

type ClientId = "claude" | "chatgpt" | "claude-code" | "codex" | "cursor";

const CLIENTS: { id: ClientId; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "claude-code", label: "Claude Code" },
  { id: "codex", label: "Codex" },
  { id: "cursor", label: "Cursor" },
];

/** How to plug the server into each client. Steps are UI copy; snippets are copied verbatim. */
function clientSetup(client: ClientId, url: string): { steps: string[]; snippet?: string } {
  switch (client) {
    case "claude":
      return {
        steps: [
          "Abra Configurações → Conectores.",
          "Clique em Adicionar conector personalizado.",
          "Cole a URL do servidor e confirme. Você volta para cá para autorizar.",
        ],
      };
    case "chatgpt":
      return {
        steps: [
          "Ative o modo desenvolvedor nas configurações do ChatGPT.",
          "Vá em Conectores → Criar.",
          "Cole a URL do servidor e confirme. Você volta para cá para autorizar.",
        ],
      };
    case "claude-code":
      return {
        steps: ["Rode no terminal:"],
        snippet: `claude mcp add --transport http quantia ${url}`,
      };
    case "codex":
      return {
        steps: ["Adicione ao arquivo ~/.codex/config.toml:"],
        snippet: `[mcp_servers.quantia]\nurl = "${url}"`,
      };
    case "cursor":
      return {
        steps: ["Adicione ao seu mcp.json:"],
        snippet: JSON.stringify({ mcpServers: { quantia: { url } } }, null, 2),
      };
  }
}

/**
 * "Conexões de IA": connect an outside assistant (Claude, ChatGPT, Cursor…) to the MCP
 * server, see which ones are connected and revoke them, and manage personal tokens for
 * clients that cannot run the OAuth flow. Available on every plan — the data is read
 * only, and processed by the provider the user picked, not by Quantia.
 */
export const ProfileAiConnectionsCard = () => {
  const { data: info, isLoading: infoLoading, isError: infoError } = useMcpInfo();
  const [client, setClient] = useState<ClientId>("claude");
  const [tokenDrawerOpen, setTokenDrawerOpen] = useState(false);

  const url = info?.serverUrl ?? "";
  const setup = url ? clientSetup(client, url) : null;

  return (
    <Card>
      <CardHead
        title="Conexões de IA"
        subtitle="Use seus dados do Quantia no Claude, ChatGPT e outras IAs — somente leitura"
      />

      {infoLoading && (
        <div className="flex items-center gap-2 py-2 text-[13px] text-[var(--text-sub)]">
          <Loader2 size={14} className="animate-spin" />
          Carregando...
        </div>
      )}

      {infoError && (
        <p className="text-[13px] text-[var(--text-sub)]">
          Não foi possível carregar os dados de conexão. Tente novamente mais tarde.
        </p>
      )}

      {info && setup && (
        <>
          <SectionLabel>URL do servidor</SectionLabel>
          <CopyField value={url} />

          <SectionLabel className="mt-4">Como conectar</SectionLabel>
          <TabChips size="sm" items={CLIENTS} value={client} onChange={setClient} />
          <ol className="mt-3 flex list-decimal flex-col gap-1 pl-5 text-[13px] leading-relaxed text-[var(--text-sub)]">
            {setup.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {setup.snippet && (
            <div className="mt-2">
              <CopyField value={setup.snippet} multiline />
            </div>
          )}

          <div className="mt-4 flex items-start gap-2.5 rounded-[13px] bg-[var(--surface2)] p-3.5">
            <ShieldAlert size={15} className="mt-px shrink-0 text-[var(--gold)]" />
            <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
              A partir da conexão, o tratamento dos dados pela IA escolhida é responsabilidade sua
              e do provedor dela. O acesso é somente leitura e você pode revogar quando quiser.
            </p>
          </div>
        </>
      )}

      <LedgerRule />
      <ConnectionsList />

      <LedgerRule />
      <TokensList onCreate={() => setTokenDrawerOpen(true)} canCreate={!!info} />

      {tokenDrawerOpen && (
        <CreateMcpTokenDrawer onClose={() => setTokenDrawerOpen(false)} scopes={info?.scopes ?? []} />
      )}
    </Card>
  );
};

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("mb-2 font-mono text-[10.5px] tracking-[0.1em] text-[var(--text-sub)] uppercase", className)}>
      {children}
    </p>
  );
}

function ConnectionsList() {
  const { data: connections = [], isLoading, isError } = useMcpConnections();
  const revoke = useRevokeMcpConnection();

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Link2 size={14} className="text-[var(--brand-accent)]" />
        <p className="text-[14px] font-semibold text-[var(--text)]">IAs conectadas</p>
      </div>

      {isLoading && <Loader2 size={14} className="animate-spin text-[var(--text-sub)]" />}
      {isError && (
        <p className="text-[12.5px] text-[var(--text-sub)]">Não foi possível carregar as conexões.</p>
      )}
      {!isLoading && !isError && connections.length === 0 && (
        <p className="text-[12.5px] text-[var(--text-sub)]">Nenhuma IA conectada ainda.</p>
      )}

      <div className="flex flex-col gap-2">
        {connections.map((connection) => (
          <RevocableRow
            key={connection.id}
            title={connection.clientName}
            lines={[
              connection.redirectHost,
              `${connection.scopes.length} ${connection.scopes.length === 1 ? "permissão" : "permissões"} · conectada ${formatRelativeTime(connection.createdAt)}`,
              connection.lastUsedAt ? `Último uso ${formatRelativeTime(connection.lastUsedAt)}` : "Ainda não usada",
            ]}
            pending={revoke.isPending && revoke.variables === connection.id}
            onRevoke={() => revoke.mutate(connection.id)}
          />
        ))}
      </div>
      {revoke.isError && (
        <p className="mt-2 text-[12px] text-[var(--clay)]">Não foi possível revogar. Tente novamente.</p>
      )}
    </div>
  );
}

function TokensList({ onCreate, canCreate }: { onCreate: () => void; canCreate: boolean }) {
  const { data: tokens = [], isLoading, isError } = useMcpTokens();
  const revoke = useRevokeMcpToken();

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <KeyRound size={14} className="text-[var(--brand-accent)]" />
        <p className="text-[14px] font-semibold text-[var(--text)]">Tokens pessoais</p>
        <button
          onClick={onCreate}
          disabled={!canCreate}
          className="ml-auto inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold text-white transition-transform enabled:hover:-translate-y-[1px] disabled:opacity-50"
          style={{ background: "var(--brand-cobalt)" }}
        >
          <Plus size={13} />
          Criar token
        </button>
      </div>
      <p className="mb-3 text-[12.5px] text-[var(--text-sub)]">
        Para IAs que não fazem login pelo navegador. Trate cada token como uma senha.
      </p>

      {isLoading && <Loader2 size={14} className="animate-spin text-[var(--text-sub)]" />}
      {isError && <p className="text-[12.5px] text-[var(--text-sub)]">Não foi possível carregar os tokens.</p>}
      {!isLoading && !isError && tokens.length === 0 && (
        <p className="text-[12.5px] text-[var(--text-sub)]">Nenhum token criado.</p>
      )}

      <div className="flex flex-col gap-2">
        {tokens.map((token) => (
          <RevocableRow
            key={token.id}
            title={token.name}
            mono={`${token.prefix}…`}
            lines={[
              `Expira em ${formatDateFull(token.expiresAt)}`,
              token.lastUsedAt ? `Último uso ${formatRelativeTime(token.lastUsedAt)}` : "Ainda não usado",
            ]}
            pending={revoke.isPending && revoke.variables === token.id}
            onRevoke={() => revoke.mutate(token.id)}
          />
        ))}
      </div>
      {revoke.isError && (
        <p className="mt-2 text-[12px] text-[var(--clay)]">Não foi possível revogar. Tente novamente.</p>
      )}
    </div>
  );
}

/** One connection or token, with a two-step revoke so a stray click cannot cut access. */
function RevocableRow({
  title,
  mono,
  lines,
  pending,
  onRevoke,
}: {
  title: string;
  mono?: string;
  lines: string[];
  pending: boolean;
  onRevoke: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-start gap-3 rounded-[13px] border border-[var(--border-color)] px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-[13.5px] font-medium text-[var(--text)]">
          <span className="truncate">{title}</span>
          {mono && <code className="font-mono text-[11.5px] text-[var(--text-sub)]">{mono}</code>}
        </p>
        {lines.map((line) => (
          <p key={line} className="text-[12px] text-[var(--text-sub)]">
            {line}
          </p>
        ))}
      </div>

      {confirming ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="rounded-[8px] px-2 py-1 text-[12px] text-[var(--text-sub)] hover:text-[var(--text)]"
          >
            Manter
          </button>
          <button
            onClick={onRevoke}
            disabled={pending}
            className="rounded-[8px] px-2 py-1 text-[12px] font-semibold text-[var(--clay)] disabled:opacity-50"
          >
            {pending ? <Loader2 size={12} className="animate-spin" /> : "Revogar"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="shrink-0 rounded-[9px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors"
          style={{ borderColor: "color-mix(in srgb, var(--clay) 40%, transparent)", color: "var(--clay)" }}
        >
          Revogar
        </button>
      )}
    </div>
  );
}
