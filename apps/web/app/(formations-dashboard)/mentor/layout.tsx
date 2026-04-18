"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { RoleGuard } from "@/components/formations/RoleGuard";

const NAV = [
  { icon: "dashboard", label: "Tableau de bord", href: "/mentor/dashboard" },
  { icon: "event", label: "Mon calendrier", href: "/mentor/calendrier" },
  { icon: "event_available", label: "Mes rendez-vous", href: "/mentor/rendez-vous" },
  { icon: "groups", label: "Mes apprenants", href: "/mentor/apprenants" },
  { icon: "inventory_2", label: "Packs de sessions", href: "/mentor/packs" },
  { icon: "folder_open", label: "Ressources", href: "/mentor/ressources" },
  { icon: "payments", label: "Finances", href: "/mentor/finances" },
  { icon: "verified_user", label: "Vérification KYC", href: "/kyc" },
  { icon: "account_circle", label: "Profil public", href: "/mentor/profil" },
  { icon: "forum", label: "Messages", href: "/messages" },
];

function initials(n?: string | null): string {
  if (!n) return "M";
  return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="mentor">
      <MentorLayoutInner>{children}</MentorLayoutInner>
    </RoleGuard>
  );
}

function MentorLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const name = session?.user?.name ?? "Mentor";
  const email = session?.user?.email ?? "";
  const image = session?.user?.image ?? null;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16 flex items-center px-4 md:px-6 gap-4">
        <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-[#191c1e]" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <Link href="/mentor/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: "#006e2f" }}>
            <span className="text-white font-bold text-xs">NK</span>
          </div>
          <span className="hidden sm:block font-bold text-[#191c1e] text-sm">Novakou · Mentor</span>
        </Link>
        <div className="flex-1" />
        <Link href="/mentor/profil">
          {image ? (
            <img src={image} alt={name} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold">
              {initials(name)}
            </div>
          )}
        </Link>
      </header>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-100 pt-16 flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {image ? <img src={image} alt={name} className="w-10 h-10 rounded-full object-cover" /> : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-sm">
                {initials(name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-[#191c1e] text-sm truncate">{name}</p>
              <p className="text-xs text-[#5c647a] truncate">{email}</p>
              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#006e2f] text-white uppercase">MENTOR</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive ? "bg-[#006e2f]/10 text-[#006e2f] font-semibold" : "text-[#5c647a] hover:bg-gray-50 hover:text-[#191c1e]"
                    }`}>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-red-600 text-xs font-semibold hover:bg-red-50 transition-colors border border-red-200">
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="md:ml-64 pt-16 min-h-screen">{children}</main>
    </div>
  );
}
