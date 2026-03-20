"use client";

import { useState, useEffect } from "react";
import { ClientSidebar } from "@/components/client/ClientSidebar";
import { ClientHeader } from "@/components/client/ClientHeader";
import { ToastContainer } from "@/components/ui/toast";
import { useClientStore } from "@/store/client";
import { signOut } from "next-auth/react";

const CLIENT_CSS_VARS = {
  "--color-primary": "34 197 94",
  "--color-bg-light": "248 250 252",
  "--color-bg-dark": "15 23 42",
  "--color-neutral-dark": "17 24 39",
  "--color-border-dark": "31 41 55",
} as React.CSSProperties;

const IS_DEV = process.env.NODE_ENV === "development";
const NOTIFICATION_POLL_INTERVAL = IS_DEV ? 300_000 : 30_000; // 5min en dev, 30s en prod

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const syncAll = useClientStore((s) => s.syncAll);
  const syncNotifications = useClientStore((s) => s.syncNotifications);

  // Initialize store data on layout mount so sidebar badges are populated
  useEffect(() => {
    syncAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll notifications every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      syncNotifications();
    }, NOTIFICATION_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [syncNotifications]);

  return (
    <div style={CLIENT_CSS_VARS} className="flex h-screen overflow-hidden bg-background-dark text-slate-100 font-sans">
      <ToastContainer />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0 relative">
        <ClientSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 animate-slide-in max-w-[min(85vw,288px)]">
            <ClientSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientHeader onMenuClick={() => setMobileOpen(true)} />
        {/* Mobile logout */}
        <div className="lg:hidden flex justify-end px-4 pt-2">
          <button
            onClick={() => signOut({ callbackUrl: "/connexion" })}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Déconnexion
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
