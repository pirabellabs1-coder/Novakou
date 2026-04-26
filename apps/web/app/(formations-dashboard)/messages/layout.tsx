import { SharedDashboardShell } from "@/components/formations/SharedDashboardShell";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <SharedDashboardShell>{children}</SharedDashboardShell>;
}
