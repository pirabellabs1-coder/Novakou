import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Script from "next/script";
import { Providers } from "./providers";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://freelancehigh.com"),
  title: {
    default: "FreelanceHigh — La plateforme freelance qui eleve votre carriere",
    template: "%s | FreelanceHigh",
  },
  description:
    "Connectez-vous avec les meilleurs freelances d'Afrique francophone, de la diaspora et du monde entier. Marketplace premium pour vos projets digitaux.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "FreelanceHigh",
  },
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
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="dark">
      <body suppressHydrationWarning className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <ImpersonationBanner />
            {children}
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
