import { LandingHeader } from "@/features/landing/components/LandingHeader";
import { LandingHero } from "@/features/landing/components/LandingHero";
import { LandingFeatures } from "@/features/landing/components/LandingFeatures";
import { LandingHowItWorks } from "@/features/landing/components/LandingHowItWorks";
import { LandingSecurity } from "@/features/landing/components/LandingSecurity";
import { LandingCta } from "@/features/landing/components/LandingCta";

/**
 * Deliberately a server component — the one route in the app whose whole job is
 * to be crawled and shared. It holds no state and calls no hook, so shipping it
 * as static HTML costs nothing and gets the copy into the page source.
 *
 * A paleta clara vem do `public-scope` no layout público (ver globals.css),
 * que fixa a página no branco mesmo para quem tem o tema escuro salvo.
 */
export function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingSecurity />
        <LandingCta />
      </main>
    </>
  );
}
