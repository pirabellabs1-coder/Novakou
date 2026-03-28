"use client";

import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebarOverlay } from "@/components/ui/MobileSidebarOverlay";
import { ToastContainer } from "@/components/ui/toast";
import { DashboardNotificationBell } from "@/components/dashboard/DashboardNotificationBell";
import { KycRequiredBanner } from "@/components/kyc/KycRequiredBanner";
import { AccessDeniedToast } from "@/components/auth/AccessDeniedToast";
import { useDashboardStore } from "@/store/dashboard";
import { normalizePlanName } from "@/lib/plans";

const IS_DEV = process.env.NODE_ENV === "development";
const NOTIFICATION_POLL_INTERVAL = IS_DEV ? 300_000 : 10_000; // 5min en dev, 10s en prod
const DATA_SYNC_INTERVAL = IS_DEV ? 600_000 : 120_000; // 10min en dev, 2min en prod

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const syncFromApi = useDashboardStore((s) => s.syncFromApi);
  const changePlan = useDashboardStore((s) => s.changePlan);
  const refreshNotifications = useDashboardStore((s) => s.refreshNotifications);
  const { data: session } = useSession();
  const hasSynced = useRef(false);

  // Sync user plan from session into store
  useEffect(() => {
    const sessionPlan = (session?.user as Record<string, unknown>)?.plan as string | undefined;
    if (sessionPlan) {
      const normalized = normalizePlanName(sessionPlan);
      changePlan(normalized.toLowerCase());
    }
  }, [session, changePlan]);

  // Sync from API on first mount
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncFromApi();
    }
  }, [syncFromApi]);

  // Re-sync data periodically to catch admin actions and new orders
  useEffect(() => {
    const interval = setInterval(() => {
      syncFromApi();
    }, DATA_SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, [syncFromApi]);

  // Poll notifications every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refreshNotifications();
    }, NOTIFICATION_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-slate-100">
      <ToastContainer />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 relative">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      {/* Mobile sidebar overlay */}
      <MobileSidebarOverlay open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Sidebar onClose={() => setMobileOpen(false)} />
      </MobileSidebarOverlay>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background-dark p-4 sm:p-6 lg:p-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 -mt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-primary hidden sm:block">rocket_launch</span>
              <span className="font-bold text-lg text-white">FreelanceHigh</span>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <DashboardNotificationBell />
            {/* Mobile logout button — visible when sidebar is hidden */}
            <button
              onClick={() => signOut({ callbackUrl: "/connexion" })}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              title="Se déconnecter"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>

        <KycRequiredBanner />
        <AccessDeniedToast />
        {children}
      </main>
    </div>
  );
}
