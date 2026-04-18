import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { Providers } from "./providers";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { TrackingProvider } from "@/components/tracking/TrackingProvider";
import { FontLoader } from "@/components/FontLoader";
import { CookieConsent } from "@/components/CookieConsent";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PromptDialog from "@/components/ui/PromptDialog";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="dark" suppressHydrationWarning>
      <head>
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
      </head>
      <body suppressHydrationWarning className="bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
        <FontLoader />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <TrackingProvider>
              <ImpersonationBanner />
              {children}
              <CookieConsent />
              <ConfirmDialog />
              <PromptDialog />
            </TrackingProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
      {gaId && <GoogleAnalytics measurementId={gaId} />}

      {/* JSON-LD Organization structured data — helps Google + Bing + search snippets */}
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
            founder: { "@type": "Person", name: "Pirabel Labs" },
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
              email: "contact@novakou.com",
              contactType: "customer support",
              availableLanguage: ["French", "English"],
            },
          }),
        }}
      />

      {/* JSON-LD WebSite with SearchAction → enables Google "sitelinks searchbox" */}
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
              target: `${process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com"}/explorer?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </html>
  );
}
