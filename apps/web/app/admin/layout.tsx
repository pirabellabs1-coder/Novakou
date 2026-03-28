"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MobileSidebarOverlay } from "@/components/ui/MobileSidebarOverlay";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ToastContainer } from "@/components/ui/toast";
import { AccessDeniedToast } from "@/components/auth/AccessDeniedToast";
import { useAdminStore } from "@/store/admin";

const ADMIN_CSS_VARS = {
  "--color-primary": "220 38 38",
  "--color-bg-light": "248 250 252",
  "--color-bg-dark": "15 23 42",
  "--color-neutral-dark": "17 24 39",
  "--color-border-dark": "31 41 55",
} as React.CSSProperties;

const IS_DEV = process.env.NODE_ENV === "development";
const ADMIN_POLL_INTERVAL = IS_DEV ? 300_000 : 30_000; // 5min en dev, 30s en prod

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const syncDashboard = useAdminStore((s) => s.syncDashboard);

  // Hooks MUST be called unconditionally (React rules of hooks)
  useEffect(() => {
    if (session?.user?.role === "admin") {
      syncDashboard();
    }
  }, [session?.user?.role, syncDashboard]);

  useEffect(() => {
    if (session?.user?.role !== "admin") return;
    const interval = setInterval(() => {
      syncDashboard();
    }, ADMIN_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [syncDashboard, session?.user?.role]);

  // Client-side admin role check (defense-in-depth — middleware also enforces this server-side)
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  if (session?.user?.role !== "admin") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-slate-100">
        <div className="rounded-lg border border-red-500/30 bg-red-950/50 p-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-400">Acces refuse</h1>
          <p className="mb-4 text-slate-300">
            Vous n&apos;avez pas les permissions necessaires pour acceder a l&apos;espace administrateur.
          </p>
          <Link
            href="/"
            className="inline-block rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Retour a l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={ADMIN_CSS_VARS} className="flex h-screen overflow-hidden bg-background-dark text-slate-100">
      <ToastContainer />
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0 relative">
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />
      </div>
      {/* Mobile sidebar overlay */}
      <MobileSidebarOverlay open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <AdminSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </MobileSidebarOverlay>
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AccessDeniedToast />
          {children}
        </main>
      </div>
    </div>
  );
}
