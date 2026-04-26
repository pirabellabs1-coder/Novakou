import { SharedDashboardShell } from "@/components/formations/SharedDashboardShell";

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return <SharedDashboardShell>{children}</SharedDashboardShell>;
}
