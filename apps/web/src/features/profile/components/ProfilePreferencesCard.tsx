"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { usePreferences, useUpdatePreferences } from "@/features/profile/hooks/useProfile";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "BRL", label: "Real Brasileiro (BRL)" },
  { code: "USD", label: "Dólar Americano (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "Libra Esterlina (GBP)" },
];

const LOCALES = [
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "en-US", label: "English (US)" },
  { code: "es-AR", label: "Español (Argentina)" },
];

const selectCls =
  "border-border bg-surface2 text-text rounded-lg border h-9 px-3 text-[13px] outline-none focus:border-green/60 transition-colors appearance-none cursor-pointer";

export const ProfilePreferencesCard = () => {
  const { data: prefs, isLoading } = usePreferences();
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();
  const { theme, setTheme } = useUIStore();

  const [currency, setCurrency] = useState("BRL");
  const [locale, setLocale]     = useState("pt-BR");

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
    <div className="border-border bg-surface rounded-2xl border p-5">
      <p className="font-display font-600 text-text mb-4 text-[15px]">Preferências</p>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface2 h-9 w-full animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border/50">
          {/* Moeda */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">Moeda</p>
              <p className="text-text-muted mt-0.5 text-[11px]">Moeda padrão do app</p>
            </div>
            <select
              className={selectCls}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Idioma */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">Idioma</p>
              <p className="text-text-muted mt-0.5 text-[11px]">Idioma da interface</p>
            </div>
            <select
              className={selectCls}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>

          {/* Tema */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-text text-[13px] font-medium">Tema</p>
              <p className="text-text-muted mt-0.5 text-[11px]">Aparência do app</p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all",
                  theme === "light"
                    ? "border-green/45 bg-green/15 text-green"
                    : "border-border bg-surface2 text-text-sub hover:text-text",
                )}
              >
                <Sun size={13} /> Claro
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all",
                  theme === "dark"
                    ? "border-green/45 bg-green/15 text-green"
                    : "border-border bg-surface2 text-text-sub hover:text-text",
                )}
              >
                <Moon size={13} /> Escuro
              </button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending || !isDirty}
            className="bg-green hover:bg-green/90 disabled:opacity-50 rounded-lg px-4 py-2 text-[13px] font-medium text-black transition-colors"
          >
            {isPending ? "Salvando..." : "Salvar preferências"}
          </button>
        </div>
      )}
    </div>
  );
};
