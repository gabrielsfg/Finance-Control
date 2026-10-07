export type InsightKind = "SpendingWeekly" | "PortfolioSnapshot";

export type InsightParagraph = {
  text: string;
};

export type Insight = {
  kind: InsightKind;
  periodStart: string;
  headline: string;
  paragraphs: InsightParagraph[];
  generatedAt: string;
  /** The guard rejected the generated text, or the provider failed, and this is the deterministic version. */
  isFallback: boolean;
  /** Whether a model was involved at all — drives the on-screen notice. */
  generatedByAi: boolean;
};

export type InvestmentHorizon = "UpToOneYear" | "OneToFiveYears" | "OverFiveYears";

export type LossTolerance = "SellEverything" | "SellPart" | "HoldAndWait" | "BuyMore";

export type ExperienceLevel = "None" | "Some" | "Extensive";

export type RiskClassification = "Conservative" | "Moderate" | "Aggressive";

export type SaveRiskProfileRequest = {
  investmentHorizon: InvestmentHorizon;
  lossTolerance: LossTolerance;
  reserveMonthsTarget: number;
  experienceLevel: ExperienceLevel;
};

export type RiskProfile = SaveRiskProfileRequest & {
  classification: RiskClassification;
  /** Why the classification came out this way, written by the API. */
  classificationReason: string;
  answeredAt: string;
};

export type AiContext = {
  periodStart: string;
  text: string;
  updatedAt: string | null;
};

/**
 * Why an AI surface is (not) showing content. Every AI endpoint answers 200 with one of
 * these, so a locked or switched-off feature is a state to render, never an error.
 */
export type AiAvailability =
  | "Available"
  | "NotPremium"
  | "AiDisabled"
  | "Unavailable"
  | "QuotaExceeded"
  | "NotEnoughData";

export type InsightResult = {
  status: AiAvailability;
  /** Null unless status is Available — or QuotaExceeded with an analysis already cached. */
  insight: Insight | null;
};

export type AiSettings = {
  aiEnabled: boolean;
  isPremium: boolean;
  /** False while the platform has the integration switched off by configuration. */
  isAvailable: boolean;
  provider: string;
  chatMessagesUsed: number;
  chatMessagesLimit: number;
  insightCount: number;
  conversationCount: number;
};

export type UpdateAiSettingsRequest = {
  aiEnabled: boolean;
};

export type DeletedCountResponse = {
  deleted: number;
};
