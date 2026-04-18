"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { RoleGuard } from "@/components/formations/RoleGuard";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  { icon: "bar_chart",          label: "Tableau de bord", href: "/affilie/dashboard" },
  { icon: "link",               label: "Mes liens",       href: "/affilie/liens" },
  { icon: "payments",           label: "Commissions",     href: "/affilie/commissions" },
  { icon: "account_balance_wallet", label: "Retraits",    href: "/affilie/retraits" },
  { icon: "leaderboard",        label: "Performances",    href: "/affilie/performances" },
];

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function AffiliéFooter() {
  return (
    <footer className="border-t border-[#1e3a2f] bg-[#0d1f17] mt-auto">
      <div className="px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#5c9e7a]">© 2026 Novakou — Programme d&apos;affiliation</p>
          <div className="flex items-center gap-4">
            <Link href="/cgu-affiliation" className="text-[10px] text-[#5c9e7a] hover:text-white transition-colors">Conditions d&apos;affiliation</Link>
            <Link href="/aide" className="text-[10px] text-[#5c9e7a] hover:text-white transition-colors">Aide</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function AffiliéLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="affilie">
      <AffiliéLayoutInner>{children}</AffiliéLayoutInner>
    </RoleGuard>
  );
}

function AffiliéLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  const userName    = session?.user?.name ?? "Affilié";
  const userImage   = session?.user?.image;
  const initials    = getInitials(session?.user?.name);

  // Fetch real balance from stats
  const { data: statsData } = useQuery({
    queryKey: ["affilie-stats"],
    queryFn: () => fetch("/api/formations/affilie/stats").then((r) => r.json()),
    staleTime: 60_000,
  });

  const balance       = statsData?.profile?.pendingEarnings ?? 0;
  const commissionPct = statsData?.commissionPct ?? 40;

  function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
  function toEur(n: number)      { return Math.round(n / 655.957); }

  return (
    <div className="min-h-screen bg-[#0a1510]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0d1f17] border-b border-[#1e3a2f] h-16 flex items-center px-4 md:px-6 gap-4">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-[#1e3a2f] text-white"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <Link href="/affilie/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
            <span className="text-white font-bold text-xs tracking-tight">NK</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-white text-sm">Novakou</span>
            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e] uppercase tracking-wide">
              Affilié
            </span>
          </div>
        </Link>

        <div className="flex-1" />

        <Link
          href="/apprenant/dashboard"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#1e3a2f] text-xs font-semibold text-[#5c9e7a] hover:text-white hover:border-[#22c55e]/40 transition-all"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Mon espace apprenant
        </Link>

        <button className="relative p-2 rounded-full hover:bg-[#1e3a2f] text-[#5c9e7a]">
          <span className="material-symbols-outlined text-[22px]">notifications</span>
        </button>

        {userImage ? (
          <img src={userImage} alt={userName} className="w-8 h-8 rounded-full object-cover flex-shrink-0 ml-1" />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-1" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
            {initials}
          </div>
        )}
      </header>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-[#0d1f17] border-r border-[#1e3a2f] pt-16 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* User + balance */}
        <div className="px-5 py-4 border-b border-[#1e3a2f]">
          <div className="flex items-center gap-3 mb-3">
            {userImage ? (
              <img src={userImage} alt={userName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{userName}</p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e]">Affilié Actif</span>
            </div>
          </div>
          {/* Quick balance */}
          <div className="bg-[#1e3a2f] rounded-xl p-3">
            <p className="text-[10px] text-[#5c9e7a] mb-0.5">Solde disponible</p>
            <p className="text-lg font-extrabold text-white">{formatFcfa(balance)}</p>
            <p className="text-[10px] text-[#5c9e7a]">≈ {toEur(balance)} €</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#22c55e]/15 text-[#22c55e] font-semibold"
                        : "text-[#5c9e7a] hover:bg-[#1e3a2f] hover:text-white"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined text-[20px] flex-shrink-0"
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-[#1e3a2f] my-4" />

          <Link
            href="/apprenant/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#5c9e7a] hover:bg-[#1e3a2f] hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">switch_account</span>
            Espace apprenant
          </Link>
        </nav>

        {/* Commission rate badge */}
        <div className="px-3 py-4 border-t border-[#1e3a2f]">
          <div className="bg-gradient-to-br from-[#006e2f]/40 to-[#22c55e]/20 border border-[#22c55e]/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-[#22c55e]">Taux de commission</p>
              <span className="text-lg font-extrabold text-white">{commissionPct}%</span>
            </div>
            <p className="text-[10px] text-[#5c9e7a] leading-relaxed">
              Gagnez {commissionPct}% sur chaque vente générée via vos liens.
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="mt-3 flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-red-400 text-xs font-semibold hover:bg-red-500/10 transition-colors border border-red-500/20"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-64 pt-16 min-h-screen flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <AffiliéFooter />
      </main>
    </div>
  );
}
