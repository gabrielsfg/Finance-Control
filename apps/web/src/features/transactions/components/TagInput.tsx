"use client";

import { useRef, useState } from "react";
import { X, Tag as TagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTags } from "@/features/transactions/hooks/useTags";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
};

export function TagInput({ value, onChange }: Props) {
  const { data: existingTags = [] } = useTags();
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = existingTags.filter(
    (t) =>
      t.name.toLowerCase().includes(input.toLowerCase()) &&
      !value.includes(t.name),
  );

  function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
    setShowDropdown(false);
    inputRef.current?.focus();
  }

  function removeTag(name: string) {
    onChange(value.filter((t) => t !== name));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div className="relative">
      <div
        className="border-border bg-surface2 flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-[13px] border px-3 py-2 focus-within:border-[var(--brand-cobalt)]"
        onClick={() => inputRef.current?.focus()}
      >
        <TagIcon size={13} className="text-text-muted shrink-0" />
        {value.map((tag) => (
          <span
            key={tag}
            className="bg-green/10 text-green flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              title={`Remover tag "${tag}"`}
              className="hover:text-red transition-colors"
            >
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Adicionar tags..." : ""}
          className="min-w-[100px] flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-text-muted"
        />
      </div>

      {showDropdown && (input.trim().length > 0 || suggestions.length > 0) && (
        <div className="border-border bg-surface absolute z-50 mt-1 w-full rounded-[13px] border shadow-lg">
          {suggestions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onMouseDown={() => addTag(tag.name)}
              className="hover:bg-surface2 flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] text-text transition-colors"
            >
              <TagIcon size={11} className="text-text-muted shrink-0" />
              {tag.name}
            </button>
          ))}
          {input.trim() && !existingTags.some((t) => t.name.toLowerCase() === input.trim().toLowerCase()) && (
            <button
              type="button"
              onMouseDown={() => addTag(input)}
              className="hover:bg-surface2 flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition-colors"
            >
              <span className="text-green font-medium">+ Criar</span>
              <span className="text-text">&quot;{input.trim()}&quot;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
