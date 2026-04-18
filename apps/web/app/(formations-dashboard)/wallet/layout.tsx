"use client";

/**
 * Wallet layout — shared between vendeur + mentor + apprenant.
 * Renders a sidebar adapted to the user's active role (detected via
 * session.user.formationsRole) so the page doesn't look like a public
 * page, and offers a quick way back to their dashboard.
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

type Role = "instructeur" | "mentor" | "apprenant" | "affilie" | "admin";

const NAVS: Record<string, Array<{ icon: string; label: string; href: string }>> = {
  instructeur: [
    { icon: "dashboard", label: "Tableau de bord", href: "/vendeur/dashboard" },
    { icon: "storefront", label: "Mes produits", href: "/vendeur/produits" },
    { icon: "category", label: "Bundles", href: "/vendeur/bundles" },
    { icon: "receipt_long", label: "Transactions", href: "/vendeur/transactions" },
    { icon: "account_balance_wallet", label: "Revenus & retraits", href: "/wallet" },
    { icon: "campaign", label: "Marketing", href: "/vendeur/marketing" },
    { icon: "bar_chart", label: "Statistiques", href: "/vendeur/statistiques" },
    { icon: "settings", label: "Paramètres", href: "/vendeur/parametres" },
  ],
  mentor: [
    { icon: "dashboard", label: "Tableau de bord", href: "/mentor/dashboard" },
    { icon: "event", label: "Mon calendrier", href: "/mentor/calendrier" },
    { icon: "event_available", label: "Mes rendez-vous", href: "/mentor/rendez-vous" },
    { icon: "groups", label: "Mes apprenants", href: "/mentor/apprenants" },
    { icon: "inventory_2", label: "Packs de sessions", href: "/mentor/packs" },
    { icon: "folder_open", label: "Ressources", href: "/mentor/ressources" },
    { icon: "account_balance_wallet", label: "Revenus & retraits", href: "/wallet" },
    { icon: "payments", label: "Finances", href: "/mentor/finances" },
  ],
  apprenant: [
    { icon: "dashboard", label: "Tableau de bord", href: "/apprenant/dashboard" },
    { icon: "school", label: "Mes formations", href: "/apprenant/mes-formations" },
    { icon: "receipt_long", label: "Mes commandes", href: "/apprenant/commandes" },
    { icon: "account_balance_wallet", label: "Revenus & retraits", href: "/wallet" },
    { icon: "settings", label: "Paramètres", href: "/apprenant/parametres" },
  ],
};

function initials(n: string | null | undefined) {
  if (!n) return "?";
  return n.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion?callbackUrl=/wallet");
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const role = ((session?.user as { formationsRole?: string })?.formationsRole ?? "apprenant") as Role;
  const nav = NAVS[role] ?? NAVS.apprenant;
  const name = session?.user?.name ?? "Utilisateur";

  return (
    <div className="min-h-screen bg-slate-50/50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 h-16 flex items-center px-4 md:px-6 gap-3">
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined text-[22px]">{mobileOpen ? "close" : "menu"}</span>
        </button>

        <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20"
            style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
          >
            <span className="text-white font-extrabold text-xs">NK</span>
          </div>
          <span className="hidden sm:block font-extrabold text-slate-900 text-sm">Novakou</span>
        </Link>

        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
          Portefeuille
        </span>

        <div className="flex-1" />

        <Link
          href={nav[0]?.href ?? "/"}
          className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Mon espace
        </Link>

        <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-100">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt={name} className="w-7 h-7 rounded-full object-cover ring-2 ring-white" />
          ) : (
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white"
              style={{ background: "linear-gradient(135deg, #f59e0b, #f97316)" }}
            >
              {initials(name)}
            </div>
          )}
          <span className="hidden sm:block text-xs font-bold text-slate-700 max-w-[120px] truncate">{name.split(" ")[0]}</span>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-50 text-emerald-700 font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={() => {
              document.cookie = "nk_active_shop=; path=/; max-age=0";
              signOut({ callbackUrl: "/" });
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-50"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Se déconnecter
          </button>
        </div>
      </aside>

      <main className="pt-16 md:ml-64 min-h-screen">{children}</main>
    </div>
  );
}
