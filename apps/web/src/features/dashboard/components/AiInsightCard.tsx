import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AiInsightCard = () => {
  return (
    <div
      className="rounded-[20px] border p-[22px]"
      style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--brand-cobalt) 10%, transparent), color-mix(in srgb, var(--brand-cobalt) 4%, var(--surface)))",
        borderColor: "color-mix(in srgb, var(--brand-cobalt) 25%, var(--border-color))",
      }}
    >
      <div className="mb-4 flex items-center gap-[10px]">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand-cobalt) 15%, transparent)" }}
        >
          <Zap size={14} style={{ color: "var(--brand-accent)" }} />
        </div>
        <span className="font-mono text-[11px] tracking-[0.1em] uppercase text-[var(--brand-accent)]">
          Insight da IA
        </span>
      </div>

      <p className="font-display font-bold text-[var(--text)] mb-1.5 text-[17px] tracking-[-0.01em]">
        Análise financeira indisponível
      </p>
      <p className="text-[var(--text-sub)] mb-4 text-[13px] leading-relaxed">
        O insight diário com IA estará disponível em breve para usuários Premium. Acompanhe suas
        finanças de forma mais inteligente.
      </p>

      <Button
        size="sm"
        variant="outline"
        className="text-[11px]"
        onClick={() => {}}
        disabled
      >
        Em breve
      </Button>
    </div>
  );
};
