export type AlertDirection = "Above" | "Below";

export type AlertRule = {
  id: number;
  marketAssetId: number;
  ticker: string;
  assetName: string;
  direction: AlertDirection;
  targetValue: number; // cents
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  triggeredAt: string | null;
};

export type CreateAlertRuleRequest = {
  marketAssetId: number;
  direction: AlertDirection;
  targetValue: number; // cents
};
