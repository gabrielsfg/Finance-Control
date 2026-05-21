export const formatPercent = (value: number | null | undefined, decimals = 2): string => {
  if (value == null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals).replace(".", ",")}%`;
};

export const formatPercentNeutral = (value: number | null | undefined, decimals = 2): string => {
  if (value == null || isNaN(value)) return "—";
  return `${value.toFixed(decimals).replace(".", ",")}%`;
};
