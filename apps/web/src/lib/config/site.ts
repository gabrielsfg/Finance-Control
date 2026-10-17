/**
 * Public identity of the site — the bits that have to agree between the
 * metadata, the sitemap and robots.txt.
 *
 * `NEXT_PUBLIC_SITE_URL` is the deployed origin (no trailing slash). Absolute
 * URLs are unavoidable here: Open Graph consumers and sitemaps both reject
 * relative ones. Falling back to localhost keeps a fresh clone building.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const siteName = "Quantia";

export const siteTagline = "Seu dinheiro, organizado";

export const siteDescription =
  "Contas, cartões, orçamento, metas e investimentos na mesma tela. Lance uma vez e enxergue o mês inteiro, com parcelamento, recorrências e análises sobre o seu próprio histórico.";

/** Routes crawlers may index. Everything else in the app sits behind auth. */
export const publicPaths = ["/", "/login", "/privacy", "/terms"] as const;

/**
 * The authenticated area. Listed explicitly rather than derived: these live at
 * the root (no `/app` prefix), so there is no pattern to match on.
 *
 * Read by robots.txt (kept out of the index) and by the proxy (bounced to /login
 * without a session). A new authenticated route has to be added here, or a visitor
 * without a session reaches it and only the API's 401 sends them to login.
 */
export const privatePaths = [
  "/dashboard",
  "/accounts",
  "/transactions",
  "/budgets",
  "/categories",
  "/goals",
  "/investments",
  "/market",
  "/recurring",
  "/simulations",
  "/analytics",
  "/profile",
  "/plans",
  "/subscription",
  // Public to the proxy but useless out of context: the MCP consent screen and the
  // page a bank sends the browser back to after an Open Finance authorization.
  "/oauth",
  "/open-finance",
] as const;

/**
 * Ownership tokens from Google Search Console and Bing Webmaster Tools (the
 * "HTML tag" method). Optional: unset renders no tag.
 */
export const siteVerification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || undefined,
};
