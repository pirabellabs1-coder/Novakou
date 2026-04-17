import "../(formations)/formations.css";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ToastContainer } from "@/components/ui/toast";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export default function FormationsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${plusJakartaSans.variable} formations-root min-h-screen bg-[#f7f9fb]`}
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      {children}
      <ToastContainer />
    </div>
  );
}
