import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AiInsightCard = () => {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: "linear-gradient(135deg, #7C6FE030, #7C6FE010)",
        borderColor: "#7C6FE050",
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: "#7C6FE040" }}
        >
          <Zap size={14} style={{ color: "var(--purple)" }} />
        </div>
        <span
          className="font-display font-600 text-[12px]"
          style={{ color: "var(--purple)" }}
        >
          <span className="text-[13px]">Insight da IA</span>
        </span>
      </div>

      <p className="font-display font-600 text-text mb-1.5 text-[14px]">
        Análise financeira indisponível
      </p>
      <p className="text-text-sub mb-4 text-[13px] leading-relaxed">
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
