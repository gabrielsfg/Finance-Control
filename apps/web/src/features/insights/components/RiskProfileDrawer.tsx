"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRiskProfile, useSaveRiskProfile } from "../hooks/useRiskProfile";
import type {
  ExperienceLevel,
  InvestmentHorizon,
  LossTolerance,
} from "@/lib/types/insight.types";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Four questions, all declared by the user. Nothing here is inferred from behaviour:
 * an inferred profile is a claim about someone they cannot check or correct.
 *
 * The profile is only ever used to describe the portfolio the person already holds —
 * it is never crossed with a specific asset, and never grounds a recommendation.
 */
const HORIZON_OPTIONS: { value: InvestmentHorizon; label: string; hint: string }[] = [
  { value: "UpToOneYear", label: "Até 1 ano", hint: "Vou precisar do dinheiro em breve" },
  { value: "OneToFiveYears", label: "De 1 a 5 anos", hint: "Tenho um objetivo de médio prazo" },
  { value: "OverFiveYears", label: "Mais de 5 anos", hint: "Estou construindo patrimônio" },
];

const TOLERANCE_OPTIONS: { value: LossTolerance; label: string }[] = [
  { value: "SellEverything", label: "Venderia tudo" },
  { value: "SellPart", label: "Venderia uma parte" },
  { value: "HoldAndWait", label: "Manteria e esperaria" },
  { value: "BuyMore", label: "Compraria mais" },
];

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: "None", label: "Nenhuma" },
  { value: "Some", label: "Alguma" },
  { value: "Extensive", label: "Bastante" },
];

const RESERVE_OPTIONS = [3, 6, 12];

/**
 * Mounts the form only while open, so every opening starts from the saved answers
 * without an effect syncing state after the fact.
 */
export const RiskProfileDrawer = ({ open, onClose }: Props) => {
  if (!open) return null;

  return <RiskProfileForm onClose={onClose} />;
};

const RiskProfileForm = ({ onClose }: { onClose: () => void }) => {
  const { data: existing } = useRiskProfile();
  const save = useSaveRiskProfile();

  // Reopening shows what the person answered last time, not a blank form — this
  // questionnaire is meant to be revisited and corrected.
  const [horizon, setHorizon] = useState<InvestmentHorizon>(
    existing?.investmentHorizon ?? "OneToFiveYears",
  );
  const [tolerance, setTolerance] = useState<LossTolerance>(
    existing?.lossTolerance ?? "HoldAndWait",
  );
  const [experience, setExperience] = useState<ExperienceLevel>(
    existing?.experienceLevel ?? "Some",
  );
  const [reserveMonths, setReserveMonths] = useState(existing?.reserveMonthsTarget ?? 6);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const onSubmit = () =>
    save.mutate(
      {
        investmentHorizon: horizon,
        lossTolerance: tolerance,
        experienceLevel: experience,
        reserveMonthsTarget: reserveMonths,
      },
      { onSuccess: () => setSaved(true) },
    );

  return (
    <>
      <div
        className="anim-fade fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-label="Perfil de investidor"
        className="anim-drawer border-border bg-surface fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l shadow-2xl"
      >
        <div className="border-border flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-display text-text text-[17px] font-bold tracking-[-0.01em]">
              Perfil de investidor
            </h2>
            <p className="text-text-sub text-[12px]">Quatro perguntas, respondidas por você</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-text-sub hover:text-text rounded-lg p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          <Question label="Em quanto tempo você pretende usar o dinheiro investido?">
            {HORIZON_OPTIONS.map((option) => (
              <Choice
                key={option.value}
                selected={horizon === option.value}
                onClick={() => setHorizon(option.value)}
                label={option.label}
                hint={option.hint}
              />
            ))}
          </Question>

          <Question label="Se sua carteira caísse 20% em um mês, o que você faria?">
            {TOLERANCE_OPTIONS.map((option) => (
              <Choice
                key={option.value}
                selected={tolerance === option.value}
                onClick={() => setTolerance(option.value)}
                label={option.label}
              />
            ))}
          </Question>

          <Question label="Quanta experiência você tem com investimentos?">
            {EXPERIENCE_OPTIONS.map((option) => (
              <Choice
                key={option.value}
                selected={experience === option.value}
                onClick={() => setExperience(option.value)}
                label={option.label}
              />
            ))}
          </Question>

          <Question label="Quantos meses de gasto você quer ter guardados como reserva?">
            {RESERVE_OPTIONS.map((months) => (
              <Choice
                key={months}
                selected={reserveMonths === months}
                onClick={() => setReserveMonths(months)}
                label={`${months} meses`}
              />
            ))}
          </Question>

          {existing && (
            <div className="border-border bg-surface2 rounded-[13px] border p-4">
              <p className="text-text-sub text-[12px] leading-relaxed">
                {existing.classificationReason}
              </p>
            </div>
          )}

          <p className="text-text-muted text-[11px] leading-relaxed">
            Suas respostas são usadas apenas para descrever a carteira que você já tem — por
            exemplo, comparar o que você declarou com a composição atual. O aplicativo não
            recomenda investimentos e não avalia se um ativo é adequado para você.
          </p>
        </div>

        <div className="border-border flex items-center justify-end gap-3 border-t px-5 py-4">
          {save.isError && (
            <span className="text-[12px] text-[var(--red)]">Não foi possível salvar</span>
          )}
          <button
            onClick={onSubmit}
            disabled={save.isPending}
            className="bg-[var(--brand-cobalt)] text-white disabled:opacity-60 rounded-[13px] px-5 py-2.5 text-[14px] font-medium transition-opacity hover:opacity-90"
          >
            {save.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <span className="flex items-center gap-1.5">
                <Check size={14} /> Salvo
              </span>
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>
    </>
  );
};

const Question = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <fieldset className="flex flex-col gap-2">
    <legend className="text-text mb-2 text-[14px] font-medium">{label}</legend>
    <div className="flex flex-col gap-2">{children}</div>
  </fieldset>
);

const Choice = ({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "rounded-[13px] border px-4 py-3 text-left transition-colors",
      selected
        ? "border-[var(--brand-cobalt)] bg-[color-mix(in_srgb,var(--brand-cobalt)_10%,transparent)]"
        : "border-border bg-surface2 hover:border-[var(--text-muted)]",
    )}
  >
    <span className="text-text block text-[14px]">{label}</span>
    {hint && <span className="text-text-muted block text-[12px]">{hint}</span>}
  </button>
);
