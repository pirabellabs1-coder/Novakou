"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { ToastContainer } from "@/components/ui/toast";
import { DashboardNotificationBell } from "@/components/dashboard/DashboardNotificationBell";
import { KycRequiredBanner } from "@/components/kyc/KycRequiredBanner";
import { useDashboardStore } from "@/store/dashboard";

const IS_DEV = process.env.NODE_ENV === "development";
const NOTIFICATION_POLL_INTERVAL = IS_DEV ? 300_000 : 30_000; // 5min en dev, 30s en prod

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const syncFromApi = useDashboardStore((s) => s.syncFromApi);
  const refreshNotifications = useDashboardStore((s) => s.refreshNotifications);
  const hasSynced = useRef(false);

  // Sync from API on first mount
  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncFromApi();
    }
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
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar />
            {/* Close button on mobile overlay */}
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-3 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}

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
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rocket_launch</span>
              <span className="font-bold text-lg text-white">FreelanceHigh</span>
            </div>
          </div>
          <DashboardNotificationBell />
        </div>

        <KycRequiredBanner />
        {children}
      </main>
    </div>
  );
}
