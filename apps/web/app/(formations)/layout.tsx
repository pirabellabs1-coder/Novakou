import "./formations.css";
import { Inter } from "next/font/google";
import { ConditionalPlatformNavbar, MainWithChrome } from "@/components/formations/ConditionalPlatformNavbar";
import { ConditionalPlatformFooter } from "@/components/formations/ConditionalPlatformFooter";
import { ToastContainer } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

export default function FormationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The cookie consent banner is mounted once at the root layout
  // (<CookieConsent /> in apps/web/app/layout.tsx) — do not also mount
  // <CookieBanner /> here, otherwise both render on every formations page.
  return (
    <div
      className={`${inter.variable} formations-root flex min-h-screen flex-col bg-[#f7f9fb]`}
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      <ConditionalPlatformNavbar />
      <MainWithChrome>{children}</MainWithChrome>
      <ConditionalPlatformFooter />
      <ToastContainer />
    </div>
  );
}
