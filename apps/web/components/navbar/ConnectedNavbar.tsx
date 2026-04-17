"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import { MessagesBadge } from "./MessagesBadge";

const ROLE_CONFIG: Record<string, { label: string; href: string; icon: string }> = {
  freelance: { label: "Mes ventes", href: "/dashboard", icon: "work" },
  client: { label: "Mes achats", href: "/client", icon: "shopping_bag" },
  agence: { label: "Mon agence", href: "/agence", icon: "apartment" },
  admin: { label: "Administration", href: "/admin", icon: "admin_panel_settings" },
};

export function ConnectedNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const role = ((user as Record<string, unknown>)?.role as string) || "freelance";
  const roleConfig = ROLE_CONFIG[role] || ROLE_CONFIG.freelance;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  // Fermer le menu en cliquant en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/explorer?q=${encodeURIComponent(q)}`);
    }
  }

  const settingsHref = role === "admin" ? "/admin/configuration" : `/${role === "freelance" ? "dashboard" : role}/parametres`;

  return (
    <header className="sticky top-0 z-50 bg-[#0f1117] border-b border-white/10 h-16 flex items-center px-4 lg:px-6 gap-3 shadow-sm">
      {/* Logo */}
      <Link
        href="/explorer"
        className="flex items-center gap-2 flex-shrink-0 group"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
          <span className="material-symbols-outlined text-primary text-lg">rocket_launch</span>
        </div>
        <span className="text-white font-bold text-base hidden sm:block">
          Novakou
        </span>
      </Link>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg pointer-events-none">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un service, un freelance, une compétence..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-colors"
          />
        </div>
      </form>

      {/* Actions droite */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-auto">

        {session ? (
          <>
            {/* Notifications */}
            <NotificationBell role={role} />

            {/* Messages */}
            <MessagesBadge role={role} />

            {/* Bouton rôle */}
            <Link
              href={roleConfig.href}
              className="hidden md:flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">{roleConfig.icon}</span>
              <span>{roleConfig.label}</span>
            </Link>

            {/* Avatar + menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "flex items-center gap-1.5 pl-2 pr-2 py-1.5 rounded-xl transition-colors",
                  isMenuOpen ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30">
                  <span className="text-primary text-xs font-bold">{initials}</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 text-sm">
                  {isMenuOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1f2e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                  {/* User info */}
                  <div className="p-3 border-b border-white/10">
                    <p className="text-sm font-semibold text-white truncate">
                      {user?.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                    <span className="mt-1 inline-block text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-bold capitalize">
                      {role}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="p-1">
                    <Link
                      href={roleConfig.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-400">
                        {roleConfig.icon}
                      </span>
                      {roleConfig.label}
                    </Link>
                    <Link
                      href={settingsHref}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-slate-400">settings</span>
                      Paramètres
                    </Link>
                    <div className="h-px bg-white/10 my-1" />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Non connecté — boutons login/register */
          <>
            <Link
              href="/connexion"
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Se connecter
            </Link>
            <Link
              href="/inscription"
              className="px-4 py-2 bg-primary text-[#0f1117] text-sm font-bold rounded-xl hover:brightness-110 transition-all"
            >
              S&apos;inscrire
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
