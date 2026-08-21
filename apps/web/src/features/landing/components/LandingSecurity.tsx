import Link from "next/link";
import { Download, KeyRound, MailCheck, Trash2, type LucideIcon } from "lucide-react";

/**
 * Every claim here maps to something that exists in the API today — email
 * verification, opt-in TOTP, the export endpoint, the cascade delete. Nothing
 * aspirational goes on this section.
 */
const guarantees: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MailCheck,
    title: "E-mail verificado",
    body: "O cadastro só se completa com o código enviado para o seu e-mail.",
  },
  {
    icon: KeyRound,
    title: "Duas etapas, se você quiser",
    body: "Verificação em duas etapas opcional, ligada e desligada por você no perfil.",
  },
  {
    icon: Download,
    title: "Seus dados saem quando você quiser",
    body: "Exporte a conta inteira de uma vez, ou só as transações que estiver vendo, em CSV.",
  },
  {
    icon: Trash2,
    title: "Excluir é excluir",
    body: "Apagar a conta remove seus dados junto. De imediato, sem cópia guardada para depois.",
  },
];

export function LandingSecurity() {
  return (
    <section id="seguranca" className="border-t border-[var(--border-color)]">
      <div className="mx-auto w-full max-w-[1140px] px-6 py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="font-mono text-[10.5px] tracking-[0.22em] text-[var(--text-sub)] uppercase">
              Segurança e privacidade
            </p>
            <h2 className="font-display mt-3 text-[32px] leading-[1.15] font-extrabold tracking-[-0.03em] text-[var(--text)] sm:text-[38px]">
              São as suas finanças. Logo, são os seus dados.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-sub)]">
              O que você aceita no cadastro fica registrado com a versão exata do documento que
              estava no ar naquele dia, e você pode reler essa versão quando quiser.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              <Link
                href="/privacy"
                className="text-[13.5px] text-[var(--brand-accent)] hover:underline"
              >
                Política de Privacidade
              </Link>
              <Link
                href="/terms"
                className="text-[13.5px] text-[var(--brand-accent)] hover:underline"
              >
                Termos de Uso
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {guarantees.map((item) => (
              <div
                key={item.title}
                className="rounded-[20px] border border-[var(--border-color)] bg-[var(--surface)] p-[22px]"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <item.icon size={17} className="text-[var(--moss)]" />
                <h3 className="mt-3.5 text-[15px] font-semibold text-[var(--text)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--text-sub)]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
