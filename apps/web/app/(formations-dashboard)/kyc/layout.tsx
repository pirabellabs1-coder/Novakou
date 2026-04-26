import { SharedDashboardShell } from "@/components/formations/SharedDashboardShell";

export default function KycLayout({ children }: { children: React.ReactNode }) {
  return <SharedDashboardShell>{children}</SharedDashboardShell>;
}
