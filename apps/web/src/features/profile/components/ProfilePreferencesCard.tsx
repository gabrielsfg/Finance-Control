"use client";

import { useState, useEffect } from "react";
import { Globe, DollarSign, Languages } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { usePreferences, useUpdatePreferences } from "@/features/profile/hooks/useProfile";

const CURRENCIES = [
  { code: "BRL", label: "Real Brasileiro (BRL)" },
  { code: "USD", label: "Dólar Americano (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "Libra Esterlina (GBP)" },
  { code: "ARS", label: "Peso Argentino (ARS)" },
];

const LOCALES = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "en-US", label: "English (US)" },
  { code: "es-AR", label: "Español (Argentina)" },
  { code: "fr-FR", label: "Français (France)" },
  { code: "de-DE", label: "Deutsch (Deutschland)" },
];

const selectCls =
  "border-border bg-surface2 text-text w-full rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors appearance-none cursor-pointer";

export const ProfilePreferencesCard = () => {
  const { data: prefs, isLoading } = usePreferences();
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();

  const [currency, setCurrency] = useState("BRL");
  const [locale, setLocale] = useState("pt-BR");

  useEffect(() => {
    if (prefs) {
      setCurrency(prefs.currencyCode);
      setLocale(prefs.locale);
    }
  }, [prefs]);

  const isDirty = prefs && (currency !== prefs.currencyCode || locale !== prefs.locale);

  const handleSave = () => {
    if (!isDirty) return;
    updatePreferences({ currencyCode: currency, locale });
  };

  return (
    <div className="border-border bg-surface rounded-xl border p-5">
      <SectionHeader title="Preferências" />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface2 h-9 w-full animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-text-muted mb-1.5 flex items-center gap-1.5 text-[12px]">
                <DollarSign size={12} /> Moeda
              </label>
              <div className="relative">
                <select
                  className={selectCls}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-text-muted mb-1.5 flex items-center gap-1.5 text-[12px]">
                <Languages size={12} /> Idioma / Localização
              </label>
              <div className="relative">
                <select
                  className={selectCls}
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                >
                  {LOCALES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="border-border/50 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Globe size={13} className="text-text-muted shrink-0" />
              <p className="text-text-muted text-[12px]">
                Fuso horário:{" "}
                <span className="text-text-sub font-medium">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </span>{" "}
                <span className="text-text-muted">(detectado automaticamente do navegador)</span>
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="bg-green hover:bg-green/90 disabled:opacity-50 rounded-lg px-4 py-2 text-[13px] font-medium text-black transition-colors"
            >
              {isPending ? "Salvando..." : "Salvar preferências"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
