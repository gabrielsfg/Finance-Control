/**
 * Where the upgrade CTAs point.
 *
 * There is no subscription flow yet — no checkout in the API, no route in the app — so
 * every "assinar" button is deliberately inert and says so. When the flow exists, set
 * this to its href and every locked card starts sending people there; nothing else needs
 * to change.
 */
export const PREMIUM_UPGRADE_HREF: string | null = null;

/** What the Premium plan unlocks, for the upsell copy. */
export const PREMIUM_FEATURES = [
  "Insights de IA ilimitados",
  "Integração com B3 e corretoras",
  "Histórico ilimitado",
  "Simulações avançadas",
];
