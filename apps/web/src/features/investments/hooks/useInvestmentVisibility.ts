import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "@/lib/api/profile";
import type { AssetType } from "@/lib/types/investments.types";

const PREF_KEY = "investments";
const ALL_ASSET_TYPES: AssetType[] = [
  "Acao", "FII", "ETF", "ETFInternacional", "Stock", "Reit", "BDR",
  "FundoInvestimento", "Cripto", "TesouroDireto", "RendaFixa", "Outro",
];

function parseHidden(analyticsConfig: string): AssetType[] {
  try {
    const parsed = JSON.parse(analyticsConfig);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const hidden = parsed[PREF_KEY];
      if (Array.isArray(hidden)) return hidden as AssetType[];
    }
  } catch {}
  return [];
}

function encodeHidden(analyticsConfig: string, hiddenTypes: AssetType[]): string {
  try {
    const parsed = JSON.parse(analyticsConfig);
    const base = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    return JSON.stringify({ ...base, [PREF_KEY]: hiddenTypes });
  } catch {
    return JSON.stringify({ [PREF_KEY]: hiddenTypes });
  }
}

const QUERY_KEY = ["user-preferences"];

export const useInvestmentVisibility = () => {
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: profileApi.getPreferences,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: (analyticsConfig: string) =>
      profileApi.updatePreferences({ analyticsConfig }),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEY, updated);
    },
  });

  const hiddenTypes: AssetType[] = prefs ? parseHidden(prefs.analyticsConfig) : [];
  const visibleTypes = ALL_ASSET_TYPES.filter((t) => !hiddenTypes.includes(t));

  const setVisibleTypes = (visible: AssetType[]) => {
    const newHidden = ALL_ASSET_TYPES.filter((t) => !visible.includes(t));
    const newConfig = encodeHidden(prefs?.analyticsConfig ?? "{}", newHidden);
    mutate(newConfig);
  };

  return { visibleTypes, hiddenTypes, allTypes: ALL_ASSET_TYPES, setVisibleTypes };
};
