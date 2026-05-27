import type { AssetType } from "./investments.types";

export type PricePoint = {
  date: string;
  price: number;
};

export type MarketAsset = {
  id: number;
  ticker: string;
  name: string;
  assetType: AssetType;
  assetClass: string;
  logoUrl: string | null;
  currency: string;
  currentPrice: number;
  lastPriceUpdate: string | null;
  previousClose: number | null;
  dayChangePct: number | null;
};

export type MarketAssetDetail = MarketAsset & {
  priceHistory: PricePoint[];
};
