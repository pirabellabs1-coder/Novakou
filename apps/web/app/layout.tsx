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
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { MATERIAL_SYMBOLS_URL } from "@/lib/material-symbols-subset";
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
    // iOS : permet l'ajout à l'écran d'accueil en mode standalone (sans la
    // barre Safari) avec le bon titre. Sans ça, « Sur l'écran d'accueil »
    // rouvrait le site dans Safari → impression que l'install ne marche pas.
    appleWebApp: {
      capable: true,
      title: "Novakou",
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Novakou",
      url: baseUrl,
      title: t("default_title"),
      description: t("default_description"),
      // OG image par défaut générée dynamiquement par /api/og.
      // Avant : aucune image → preview WhatsApp/X/LinkedIn vide → -40% CTR.
      images: [
        {
          url: `${baseUrl}/api/og`,
          width: 1200,
          height: 630,
          alt: "Novakou — Marketplace produits digitaux Afrique francophone",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("default_title"),
      description: t("default_description"),
      site: "@Novakou",
      creator: "@Novakou",
      images: [`${baseUrl}/api/og`],
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
      // Hreflang : on n'a qu'une seule version FR à ce stade. Les variantes
      // ?lang=fr-sn/fr-ci/... pointaient vers la MÊME URL avec un param
      // ignoré → Google les marquait comme duplicate content. À ré-activer
      // quand on aura de vraies routes localisées (V2 i18n).
      languages: {
        "fr-FR": baseUrl,
        "x-default": baseUrl,
      },
    },
    verification: {
      // Google Search Console — code fourni par Lissanon 2026-05-27.
      // Hardcoded car le passage par env var n'était pas injecté au build
      // Vercel (verification.google manquait du HTML rendu, malgré la var
      // présente sur Vercel en encrypted). Hardcoder est plus fiable et
      // sans risque (le code n'est pas un secret — il est exposé en clair
      // dans la balise meta de toute façon).
      google: "86SCqsFYLPsTxUUEi5ZdL-y4u2P-VBxwNzVNumg7P-s",
      // Bing — gardé en env var (valeur vide → la balise est omise par Next.js)
      ...(process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
        ? { other: { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } }
        : {}),
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
        {/* Préconnexion aux CDN fonts utilisés. On retire fonts.googleapis.com
            et fonts.gstatic.com — Manrope passe désormais par next/font (self-
            hosted) donc plus aucun appel à googleapis depuis le critical path.
            PageSpeed flagait ces deux preconnect comme inutiles. */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />

        {/* Satoshi (fontshare) — chargé en ASYNC pour ne PAS bloquer le rendu.
            La technique media="print" puis onload="this.media='all'" est le
            pattern standard depuis 2020 : le browser fetch le CSS en
            background, ne l'applique pas (media print), puis l'active dès
            qu'il arrive. Pendant ce temps display=swap utilise le fallback
            (sans-serif). Économie : ~750ms de render-blocking time. */}
        <link
          rel="preload"
          as="style"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          media="print"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ onLoad: "this.media='all'" } as any)}
        />
        <noscript>
          <link
            rel="stylesheet"
            href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700&display=swap"
          />
        </noscript>

        {/* Material Symbols (Google Fonts) — SUBSET via &icon_names=
            Avant : font variable complète 3.8 MB (3000+ icônes inutiles).
            Après : ~70 KB (uniquement les ~350 icônes réellement utilisées).
            display=block évite aussi le FOUT (cache les ligatures brutes
            "package_2", "sell" pendant le chargement). Liste d'icônes
            maintenue dans lib/material-symbols-subset.ts. */}
        <link rel="preload" as="style" href={MATERIAL_SYMBOLS_URL} />
        <link
          rel="stylesheet"
          href={MATERIAL_SYMBOLS_URL}
          media="print"
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ onLoad: "this.media='all'" } as any)}
        />
        <noscript>
          <link rel="stylesheet" href={MATERIAL_SYMBOLS_URL} />
        </noscript>

        {/* Anti-FOUT Material Symbols : tant que la font n'est pas chargée,
            les ligatures (texte "package_2", "sell"...) restent invisibles
            via color:transparent. Une fois chargée, .ms-ready est ajoutée
            sur <html> et les icônes apparaissent. Évite le flash de texte
            brut visible au premier rendu. */}
        <style dangerouslySetInnerHTML={{ __html: `
          .material-symbols-outlined { color: transparent; }
          html.ms-ready .material-symbols-outlined { color: inherit; }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('theme');
              if (t === 'light') {
                document.documentElement.classList.remove('dark');
              }
            } catch(e){}
            try {
              if (document.fonts && document.fonts.load) {
                document.fonts.load('24px "Material Symbols Outlined"').then(function(){
                  document.documentElement.classList.add('ms-ready');
                }).catch(function(){
                  document.documentElement.classList.add('ms-ready');
                });
                setTimeout(function(){
                  document.documentElement.classList.add('ms-ready');
                }, 3000);
              } else {
                document.documentElement.classList.add('ms-ready');
              }
            } catch(e){
              document.documentElement.classList.add('ms-ready');
            }
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
        <ServiceWorkerRegister />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
