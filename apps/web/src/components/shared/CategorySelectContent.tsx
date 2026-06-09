"use client";

import { SelectContent, SelectItem } from "@/components/ui/select";
import { getCategoryColor } from "@/lib/config/categoryColors";
import type { SubCategoryItem } from "@/lib/types/transactions.types";

const DROPDOWN_PROPS = { alignItemWithTrigger: false, sideOffset: 4 } as const;

/**
 * Canonical category → subcategory dropdown content, for use INSIDE a <Select>
 * (i.e. `<Select ...><SelectTrigger/><CategorySelectContent subcategories={...} /></Select>`).
 *
 * Subcategories are grouped under their parent category header, which shows the
 * category COLOR as a dot. Each subcategory row shows its EMOJI (or a faded
 * category-color dot as fallback when it has none). Always select by subcategory id.
 *
 * For a multi-select checkbox version of the same color/emoji rules (filters with
 * category + subcategory checkboxes), follow RecurrencesFilters' CheckRow instead.
 */
export function CategorySelectContent({ subcategories }: { subcategories: SubCategoryItem[] }) {
  const grouped = subcategories.reduce<Record<string, { id: number; name: string; emoji: string | null; color: string; catId: number }[]>>(
    (acc, sub) => {
      const catColor = getCategoryColor(sub.categoryColor, sub.categoryName);
      if (!acc[sub.categoryName]) acc[sub.categoryName] = [];
      acc[sub.categoryName].push({ id: sub.id, name: sub.name, emoji: sub.emoji, color: catColor, catId: sub.categoryId });
      return acc;
    },
    {},
  );

  return (
    <SelectContent className="max-h-72" {...DROPDOWN_PROPS}>
      {Object.entries(grouped).map(([catName, subs], groupIdx) => (
        <div key={catName}>
          {groupIdx > 0 && <div className="border-border mx-2 my-1 border-t" />}
          {/* Category header — color dot */}
          <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: subs[0].color }}
            />
            <span className="text-text-sub text-[11px] font-semibold uppercase tracking-wider">
              {catName}
            </span>
          </div>
          {/* Subcategories — emoji (or faded color dot) */}
          {subs.map((s) => (
            <SelectItem key={s.id} value={String(s.id)} className="pl-6">
              <div className="flex items-center gap-2.5 py-0.5">
                {s.emoji
                  ? <span className="text-[14px] leading-none shrink-0">{s.emoji}</span>
                  : <span className="h-2 w-2 shrink-0 rounded-full opacity-70" style={{ backgroundColor: s.color }} />
                }
                <span className="text-[14px]">{s.name}</span>
              </div>
            </SelectItem>
          ))}
        </div>
      ))}
    </SelectContent>
  );
}
