export const formatPercent = (value: number, decimals = 2): string => {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals).replace(".", ",")}%`;
};

export const formatPercentNeutral = (value: number, decimals = 2): string => {
  return `${value.toFixed(decimals).replace(".", ",")}%`;
};
