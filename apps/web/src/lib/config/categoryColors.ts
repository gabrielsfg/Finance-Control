const DEFAULT_PALETTE = [
  "#F5A623",
  "#4A9EFF",
  "#00C98D",
  "#7C6FE0",
  "#F25F5C",
  "#F5CE42",
  "#00D4A0",
  "#E07C6F",
  "#6FD4E0",
  "#B06FE0",
];

export const FALLBACK_COLOR = "#8A95A3";

/**
 * Returns the category color provided by the API, or a deterministic
 * palette color based on the category name as fallback.
 */
export function getCategoryColor(color: string | null | undefined, name?: string): string {
  if (color) return color;
  if (!name) return FALLBACK_COLOR;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_PALETTE[Math.abs(hash) % DEFAULT_PALETTE.length];
}
