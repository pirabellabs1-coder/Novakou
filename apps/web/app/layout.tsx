import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://freelancehigh.com"),
  title: {
    default: "FreelanceHigh — La plateforme freelance qui élève votre carrière",
    template: "%s | FreelanceHigh",
  },
  description:
    "Connectez-vous avec les meilleurs freelances d'Afrique francophone, de la diaspora et du monde entier. Marketplace premium pour vos projets digitaux.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
