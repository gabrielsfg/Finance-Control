"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const EMOJI_GROUPS = [
  {
    label: "Alimentação",
    emojis: ["🍔","🍕","🍣","🍜","🥗","🍱","🥘","🍛","🥩","🍗","🥪","🌮","🍦","☕","🧃","🍷","🧁","🎂"],
  },
  {
    label: "Transporte",
    emojis: ["🚗","🚕","🚌","🚎","✈️","🚂","🚢","🛵","🚲","⛽","🅿️","🚦","🛞","🏍️"],
  },
  {
    label: "Saúde",
    emojis: ["💊","🏥","🩺","🧪","🩻","💉","🩹","🧴","🏃","🧘","🛌","🍎","🥦","🫀"],
  },
  {
    label: "Lazer",
    emojis: ["🎮","🎬","🎵","📚","⚽","🎯","🎲","🏊","🎤","🎭","🏖️","🎳","🎸","🎻","🎹","🎨"],
  },
  {
    label: "Casa",
    emojis: ["🏠","🛒","🧹","🔧","💡","🛋️","🪴","🧺","🚿","🛁","🔑","🪑","🖥️","📺"],
  },
  {
    label: "Vestuário",
    emojis: ["👕","👗","👠","👟","🧥","👜","🕶️","💍","⌚","🧢","👒","🧣","🧤"],
  },
  {
    label: "Educação",
    emojis: ["📖","🎓","✏️","📐","🔬","💻","📝","🏫","📡","🧮","📊","🗂️"],
  },
  {
    label: "Finanças",
    emojis: ["💰","💳","🏦","📈","📉","💵","🪙","💎","🏧","💸","🤑","🏷️","🧾","📋"],
  },
  {
    label: "Pets",
    emojis: ["🐶","🐱","🐠","🐹","🐰","🦜","🐾","🦴","🐾"],
  },
  {
    label: "Outros",
    emojis: ["🎁","🌍","📱","⭐","🔔","📦","🛡️","🪄","🔖","📌","🗓️","⚙️","🔐","💬"],
  },
];

type Props = {
  value: string;
  onChange: (emoji: string) => void;
};

export function EmojiPicker({ value, onChange }: Props) {
  const [group, setGroup] = useState(0);

  return (
    <div className="border-border bg-surface2 rounded-xl border overflow-hidden">
      {/* Group tabs */}
      <div className="border-border flex gap-0.5 overflow-x-auto border-b p-1.5">
        {EMOJI_GROUPS.map((g, i) => (
          <button
            key={g.label}
            type="button"
            onClick={() => setGroup(i)}
            title={g.label}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap",
              group === i
                ? "bg-green/15 text-green"
                : "text-text-muted hover:bg-surface3 hover:text-text-sub",
            )}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-9 gap-0.5 p-2">
        {EMOJI_GROUPS[group].emojis.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-[20px] transition-all",
              value === e
                ? "bg-green/20 ring-1 ring-green/50 scale-110"
                : "hover:bg-surface3 hover:scale-110",
            )}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
