"use client";

import type React from "react";
import EmojiPickerLib, { type EmojiClickData, Theme, EmojiStyle } from "emoji-picker-react";
import { useUIStore } from "@/lib/stores/uiStore";

type Props = {
  value: string;
  onChange: (emoji: string) => void;
};

export function EmojiPicker({ onChange }: Props) {
  const theme = useUIStore((s) => s.theme);

  const handleClick = (data: EmojiClickData) => {
    onChange(data.emoji);
  };

  return (
    <EmojiPickerLib
      onEmojiClick={handleClick}
      // The library ships its own stylesheet per theme, and its dark rules beat the
      // variables set below. Pinned to DARK, the search field rendered dark-on-dark in
      // the light theme — unreadable exactly while you type into it.
      theme={theme === "light" ? Theme.LIGHT : Theme.DARK}
      emojiStyle={EmojiStyle.NATIVE}
      skinTonesDisabled
      searchPlaceholder="Buscar emoji..."
      width="100%"
      height={360}
      lazyLoadEmojis
      style={{
        "--epr-bg-color": "var(--surface2)",
        "--epr-category-label-bg-color": "var(--surface2)",
        "--epr-hover-bg-color": "var(--surface)",
        "--epr-focus-bg-color": "var(--surface)",
        "--epr-search-input-bg-color": "var(--surface)",
        "--epr-search-input-text-color": "var(--text)",
        "--epr-search-input-placeholder-color": "var(--text-muted)",
        "--epr-text-color": "var(--text)",
        "--epr-category-label-text-color": "var(--text-muted)",
        "--epr-border-color": "var(--border)",
        "--epr-highlight-color": "var(--green)",
        "--epr-active-skin-tone-indicator-color": "var(--green)",
        "--epr-active-skin-hover-color": "var(--green)",
      } as React.CSSProperties}
    />
  );
}
