import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Manrope } from "next/font/google";
import { Providers } from "./providers";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { TrackingProvider } from "@/components/tracking/TrackingProvider";
import { CookieConsent } from "@/components/CookieConsent";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PromptDialog from "@/components/ui/PromptDialog";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

// Manrope : self-hosted via next/font → preload + display=swap automatiques,
// pas de FOIT bloquant. Avant : chargé via FontLoader client qui injectait
// les <link> APRÈS hydration React → 22s de LCP sur mobile 4G.
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t("default_title"),
      template: "%s | Novakou",
    },
    description: t("default_description"),
    applicationName: "Novakou",
    authors: [{ name: "Pirabel Labs", url: baseUrl }],
    creator: "Novakou",
    publisher: "Novakou",
    keywords: [
      "Novakou",
      "formations en ligne",
      "produits digitaux",
      "vendre formation Afrique",
      "coaching en ligne",
      "Afrique francophone",
      "Sénégal",
      "Côte d'Ivoire",
      "Bénin",
      "Cameroun",
      "marketplace digital",
      "créateurs digitaux",
      "Mobile Money",
      "Orange Money",
      "Wave",
    ],
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/icon", sizes: "32x32", type: "image/png" },
      ],
      apple: { url: "/apple-icon", sizes: "180x180" },
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Novakou",
      url: baseUrl,
      title: t("default_title"),
      description: t("default_description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("default_title"),
      description: t("default_description"),
      site: "@Novakou",
      creator: "@Novakou",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    alternates: {
      canonical: baseUrl,
      languages: {
        "fr-FR": baseUrl,
        "fr-SN": `${baseUrl}?lang=fr-sn`,
        "fr-CI": `${baseUrl}?lang=fr-ci`,
        "fr-BJ": `${baseUrl}?lang=fr-bj`,
        "fr-CM": `${baseUrl}?lang=fr-cm`,
        "x-default": baseUrl,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      other: {
        "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
      },
    },
    category: "education",
  };
}

export const viewport: Viewport = {
  themeColor: "#006e2f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className={`dark ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Préconnexion aux CDN fonts AVANT le HTML body → le browser peut
            commencer la résolution DNS + TCP handshake pendant qu'il parse
            le reste. Économise ~200-500ms sur la première requête font. */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Satoshi (fontshare — pas de support next/font Google). Subset
            réduit à 4 graisses (400-700) au lieu des 6 originales (300-900).
            Économie immédiate de ~50% sur le poids du CSS + woff2. */}
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
        />

        {/* Material Symbols : font Google. Subset agressif :
            - opsz 20..48 (au lieu de 100..700) → suppression des très
              grandes tailles inutilisées sur le site
            - wght 300..600 (au lieu de 100..700) → 4 graisses au lieu de 7
            - FILL 0..1 (binaire — on garde)
            - GRAD -25..0 (au lieu de -50..200) → range plus étroit
            Avec display=swap les icônes affichent un fallback invisible
            jusqu'au load (pas de blocage du LCP). Combiné au preconnect,
            le download démarre quasi instantanément. */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,-25..0&display=swap"
        />

        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'light') {
                document.documentElement.classList.remove('dark');
              }
            } catch(e){}
          })();
        `}} />
        {/* JSON-LD structured data must live inside <head> — placing it as
            a direct child of <html> (after </body>) triggers a React 19
            hydration error and a fatal dev overlay. Moved here from the
            bottom of the file. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Novakou",
              legalName: "Novakou SAS",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com",
              logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/icon`,
              description:
                "La plateforme des créateurs digitaux en Afrique francophone. Vendez vos formations, e-books, templates et séances de coaching.",
              founder: { "@type": "Person", name: "Lissanon Gildas" },
              parentOrganization: { "@type": "Organization", name: "Pirabel Labs" },
              foundingDate: "2026",
              areaServed: [
                { "@type": "Country", name: "Sénégal" },
                { "@type": "Country", name: "Côte d'Ivoire" },
                { "@type": "Country", name: "Cameroun" },
                { "@type": "Country", name: "Bénin" },
                { "@type": "Country", name: "Mali" },
                { "@type": "Country", name: "Burkina Faso" },
                { "@type": "Country", name: "France" },
              ],
              sameAs: [
                "https://twitter.com/Novakou",
                "https://www.linkedin.com/company/novakou",
                "https://www.facebook.com/novakou",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                email: "support@novakou.com",
                contactType: "customer support",
                availableLanguage: ["French", "English"],
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Novakou",
              url: process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/explorer?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
        {/* Skip-to-content link — invisible until keyboard focused (a11y) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:shadow-lg"
        >
          Aller au contenu principal
        </a>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <TrackingProvider>
              <ImpersonationBanner />
              <main id="main-content">
                {children}
              </main>
              <CookieConsent />
              <ConfirmDialog />
              <PromptDialog />
            </TrackingProvider>
          </Providers>
        </NextIntlClientProvider>
        {gaId && <GoogleAnalytics measurementId={gaId} />}
      </body>
    </html>
  );
}
