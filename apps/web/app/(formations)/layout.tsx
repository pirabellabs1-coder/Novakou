import "./formations.css";
import { inter } from "@/lib/fonts";
import { ConditionalPlatformNavbar, MainWithChrome } from "@/components/formations/ConditionalPlatformNavbar";
import { ConditionalPlatformFooter } from "@/components/formations/ConditionalPlatformFooter";
import { ToastContainer } from "@/components/ui/toast";


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
