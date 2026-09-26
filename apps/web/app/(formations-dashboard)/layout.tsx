import "../(formations)/formations.css";
import { inter } from "@/lib/fonts";
import { ToastContainer } from "@/components/ui/toast";


export default function FormationsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inter.variable} formations-root min-h-screen bg-[#f7f9fb]`}
      style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {children}
      <ToastContainer />
    </div>
  );
}
