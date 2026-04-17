"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { icon: "dashboard", label: "Vue générale", href: "/formations/admin/dashboard" },
  { icon: "inventory_2", label: "Produits", href: "/formations/admin/produits" },
  { icon: "people", label: "Utilisateurs", href: "/formations/admin/utilisateurs" },
  { icon: "receipt_long", label: "Transactions", href: "/formations/admin/transactions" },
  { icon: "comment", label: "Commentaires", href: "/formations/admin/commentaires" },
  { icon: "flag", label: "Signalements", href: "/formations/admin/signalements" },
  { icon: "gavel", label: "Disputes mentor", href: "/formations/admin/mentor-disputes" },
  { icon: "badge", label: "Vérification KYC", href: "/formations/admin/kyc" },
  { icon: "settings", label: "Configuration", href: "/formations/admin/configuration" },
];

function getInitials(name?: string | null): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type BadgeCounts = { reports: number; comments: number };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const displayName = session?.user?.name ?? "Super Admin";
  const displayEmail = session?.user?.email ?? "admin@freelancehigh.com";
  const initials = getInitials(session?.user?.name);
  const avatarUrl = session?.user?.image;

  // Fetch dashboard to get pending counts for sidebar badges
  const { data: dashRes } = useQuery<{ data: { quickStats: { pendingReports: number; pendingRefunds: number } } }>({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetch("/api/formations/admin/dashboard").then((r) => r.json()),
    staleTime: 60_000,
  });

  const { data: commentsRes } = useQuery<{ data: unknown[]; summary: { withoutResponse: number } | null }>({
    queryKey: ["admin-commentaires"],
    queryFn: () => fetch("/api/formations/admin/commentaires").then((r) => r.json()),
    staleTime: 60_000,
  });

  const badges: BadgeCounts = {
    reports: dashRes?.data?.quickStats?.pendingReports ?? 0,
    comments: commentsRes?.summary?.withoutResponse ?? 0,
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center px-4 md:px-6 gap-4">
        {/* Hamburger (mobile) */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-[#191c1e]"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Logo */}
        <Link href="/formations/admin/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center"
            style={{ background: "#006e2f" }}
          >
            <span className="text-white font-bold text-xs tracking-tight">NK</span>
          </div>
          <span className="hidden sm:block font-bold text-[#191c1e] text-sm">Novakou</span>
        </Link>

        {/* Admin badge */}
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-[#191c1e]">
          <span className="material-symbols-outlined text-[12px]">shield</span>
          Admin Panel
        </span>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-full hover:bg-gray-100 text-[#5c647a]">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
          <button className="relative p-2 rounded-full hover:bg-gray-100 text-[#5c647a]">
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>
          {/* Admin avatar */}
          <div className="flex items-center gap-2 ml-1">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #191c1e 0%, #006e2f 100%)" }}
              >
                {initials}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-[#191c1e] leading-none">{displayName}</p>
              <p className="text-[10px] text-[#5c647a]">{displayEmail}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-100 pt-16 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Admin info */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #191c1e 0%, #006e2f 100%)" }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[#191c1e] text-sm truncate">{displayName}</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full"></span>
                <p className="text-[10px] text-[#5c647a]">Accès complet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-[#5c647a]">
            Administration
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#006e2f]/10 text-[#006e2f] font-semibold"
                        : "text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] flex-shrink-0 ${
                        isActive ? "text-[#006e2f]" : "text-[#5c647a]"
                      }`}
                      style={{
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {item.icon === "flag" && badges.reports > 0 && (
                      <span className="ml-auto bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {badges.reports}
                      </span>
                    )}
                    {item.icon === "comment" && badges.comments > 0 && (
                      <span className="ml-auto bg-yellow-100 text-yellow-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {badges.comments}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="px-3 mb-2 text-[9px] font-bold uppercase tracking-widest text-[#5c647a]">
              Accès rapide
            </p>
            <Link
              href="/formations"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e] transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">open_in_new</span>
              Voir la plateforme
            </Link>
            <Link
              href="/formations/explorer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e] transition-all duration-200"
            >
              <span className="material-symbols-outlined text-[20px] flex-shrink-0">storefront</span>
              Marketplace
            </Link>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-200">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64 pt-16 min-h-screen">{children}</main>
    </div>
  );
}
