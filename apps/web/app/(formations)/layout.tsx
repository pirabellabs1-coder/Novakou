import "./formations.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { FormationsNavbar } from "@/components/formations/FormationsNavbar";
import { FormationsFooter } from "@/components/formations/FormationsFooter";
import { ToastContainer } from "@/components/ui/toast";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export default function FormationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${plusJakartaSans.variable} formations-root flex min-h-screen flex-col bg-[#f7f9fb]`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <FormationsNavbar />
      <main className="flex-1 pt-24 overflow-x-hidden">{children}</main>
      <FormationsFooter />
      <ToastContainer />
    </div>
  );
}
