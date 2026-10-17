import { siteDescription, siteName, siteUrl } from "@/lib/config/site";

/**
 * schema.org description of who publishes the site and what the product is, for
 * search engines and AI crawlers. Organization supplies the logo Google shows next to
 * the result; WebApplication names the product category.
 *
 * No `offers` on purpose: the prices live in the API, and a price here that drifts from
 * the plans page is worse than none.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: siteName,
      url: siteUrl,
      logo: `${siteUrl}/icons/icon-512.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: siteName,
      url: siteUrl,
      inLanguage: "pt-BR",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "WebApplication",
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web, Android, iOS",
      inLanguage: "pt-BR",
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export function LandingStructuredData() {
  return (
    <script
      type="application/ld+json"
      // `<` escaped so nothing in the payload can close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
    />
  );
}
