import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import Script from "next/script";
import { Providers } from "./providers";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { TrackingProvider } from "@/components/tracking/TrackingProvider";
import { FontLoader } from "@/components/FontLoader";
import { CookieConsent } from "@/components/CookieConsent";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    metadataBase: new URL("https://freelancehigh.com"),
    title: {
      default: t("default_title"),
      template: "%s | FreelanceHigh",
    },
    description: t("default_description"),
    icons: {
      icon: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "FreelanceHigh",
    },
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
            </TrackingProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
      {gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}</Script>
        </>
      )}
    </html>
  );
}
