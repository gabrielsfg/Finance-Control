"use client";

import type React from "react";
import EmojiPickerLib, { type EmojiClickData, Theme, EmojiStyle } from "emoji-picker-react";

type Props = {
  value: string;
  onChange: (emoji: string) => void;
};

export function EmojiPicker({ onChange }: Props) {
  const handleClick = (data: EmojiClickData) => {
    onChange(data.emoji);
  };

  return (
    <EmojiPickerLib
      onEmojiClick={handleClick}
      theme={Theme.DARK}
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
