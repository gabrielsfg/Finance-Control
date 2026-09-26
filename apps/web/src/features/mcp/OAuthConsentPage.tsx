"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Clock, Globe, Loader2, ShieldAlert } from "lucide-react";
import { BrandMark } from "@/components/shared/BrandMark";
import { useOAuthDecision, useOAuthRequest } from "./hooks/useMcp";

const EXPIRED_MESSAGE = "Pedido expirado, tente conectar de novo";

const statusOf = (err: unknown) => (err as { response?: { status?: number } })?.response?.status;
const isExpired = (err: unknown) => {
  const status = statusOf(err);
  return status === 404 || status === 410;
};

/**
 * The consent step of the MCP OAuth flow. An AI client (Claude, ChatGPT…) sends the
 * browser here with `?request=<id>`; the user sees who is asking and for what, and the
 * decision sends the browser back to the client via the redirect the API returns.
 *
 * Login is enforced by the proxy, which carries this exact URL through /login so the
 * flow resumes here after signing in.
 */
function OAuthConsentContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("request");
  const { data: request, isLoading, error, refetch } = useOAuthRequest(requestId);
  const decision = useOAuthDecision();
  const [redirecting, setRedirecting] = useState<"approve" | "deny" | null>(null);

  const decide = (approve: boolean) => {
    if (!requestId) return;
    decision.mutate(
      { requestId, approve },
      {
        onSuccess: ({ redirectUrl }) => {
          setRedirecting(approve ? "approve" : "deny");
          window.location.href = redirectUrl;
        },
      },
    );
  };

  const renderBody = () => {
    if (!requestId) {
      return <Message title="Pedido inválido" body="Este link não traz um pedido de conexão. Volte para a sua IA e tente conectar de novo." />;
    }

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-[var(--brand-accent)]" />
        </div>
      );
    }

    if (error || !request) {
      if (isExpired(error)) {
        return <Message title={EXPIRED_MESSAGE} body="Os pedidos de conexão valem por alguns minutos. Volte para a sua IA e comece a conexão outra vez." icon="expired" />;
      }
      return (
        <Message title="Não foi possível carregar o pedido" body="Verifique sua conexão e tente de novo.">
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-[13px] border border-[var(--border-color)] px-4 py-2 text-[13.5px] font-semibold text-[var(--text)] hover:bg-[var(--surface2)]"
          >
            Tentar novamente
          </button>
        </Message>
      );
    }

    if (decision.isError && isExpired(decision.error)) {
      return <Message title={EXPIRED_MESSAGE} body="O pedido venceu antes da resposta. Volte para a sua IA e comece a conexão outra vez." icon="expired" />;
    }

    const busy = decision.isPending || redirecting !== null;

    return (
      <>
        <h1 className="font-display text-[20px] leading-snug font-bold tracking-[-0.015em] text-[var(--text)]">
          <span className="text-[var(--brand-accent)]">{request.clientName}</span> quer acessar seus
          dados do Quantia (somente leitura)
        </h1>

        <div className="mt-3 flex items-center gap-2 text-[12.5px] text-[var(--text-sub)]">
          <Globe size={13} className="shrink-0" />
          <span>
            Depois, você volta para <span className="font-mono text-[var(--text)]">{request.redirectHost}</span>
          </span>
        </div>

        <p className="mt-5 mb-2 font-mono text-[10.5px] tracking-[0.1em] text-[var(--text-sub)] uppercase">
          Poderá ver
        </p>
        <ul className="flex flex-col gap-2">
          {request.scopes.map((scope) => (
            <li key={scope.name} className="flex items-start gap-2.5">
              <Check size={14} strokeWidth={2.4} className="mt-[3px] shrink-0 text-[var(--moss)]" />
              <span className="min-w-0">
                <span className="block text-[13.5px] text-[var(--text)]">{scope.description}</span>
                <span className="block font-mono text-[11px] text-[var(--text-sub)]">{scope.name}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-start gap-2.5 rounded-[13px] bg-[var(--surface2)] p-3.5">
          <ShieldAlert size={15} className="mt-px shrink-0 text-[var(--gold)]" />
          <p className="text-[12.5px] leading-relaxed text-[var(--text-sub)]">
            A partir da conexão, o tratamento dos dados pela IA escolhida é responsabilidade sua e
            do provedor dela. Você pode revogar quando quiser em{" "}
            <Link href="/profile#ai-connections" className="font-medium text-[var(--text)] hover:underline">
              Perfil → Conexões de IA
            </Link>
            .
          </p>
        </div>

        {decision.isError && (
          <p className="mt-4 text-[12.5px] text-[var(--clay)]">
            Não foi possível registrar sua resposta. Tente novamente.
          </p>
        )}

        <div className="mt-6 flex gap-2.5">
          <button
            onClick={() => decide(false)}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-[13px] border border-[var(--border-color)] px-4 py-2.5 text-[14px] font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface2)] disabled:opacity-50"
          >
            {(decision.isPending && decision.variables?.approve === false) || redirecting === "deny" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : null}
            Negar
          </button>
          <button
            onClick={() => decide(true)}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-2 rounded-[13px] px-4 py-2.5 text-[14px] font-semibold text-white transition-transform enabled:hover:-translate-y-[1px] disabled:opacity-60"
            style={{ background: "var(--brand-cobalt)", boxShadow: "0 12px 24px -12px rgba(31,60,224,0.7)" }}
          >
            {(decision.isPending && decision.variables?.approve) || redirecting === "approve" ? (
              <Loader2 size={15} className="animate-spin" />
            ) : null}
            Permitir
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 py-10">
      <BrandMark className="mb-8" glyphSize={30} textSize={19} />
      <div
        className="w-full max-w-[460px] rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-[26px]"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {renderBody()}
      </div>
    </div>
  );
}

function Message({
  title,
  body,
  icon,
  children,
}: {
  title: string;
  body: string;
  icon?: "expired";
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      {icon === "expired" && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface2)]">
          <Clock size={22} className="text-[var(--text-sub)]" />
        </div>
      )}
      <h1 className="font-display text-[18px] font-bold text-[var(--text)]">{title}</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-sub)]">{body}</p>
      {children}
    </div>
  );
}

export const OAuthConsentPage = () => (
  // useSearchParams needs a Suspense boundary; the fallback matches the page background.
  <Suspense fallback={<div className="min-h-screen bg-[var(--bg)]" />}>
    <OAuthConsentContent />
  </Suspense>
);
