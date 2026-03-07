import { ConnectedNavbar } from "@/components/navbar/ConnectedNavbar";
import { Footer } from "@/components/layout/Footer";

export default function FreelancersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col">
      <ConnectedNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
