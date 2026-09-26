// Refonte par Augustin Mékongo + Fatou Diallo — bureau 2026-05-26 (votes 7, 8, 13)
// Migration intégrale des icônes Material Symbols → Lucide React (2026-06-07)
// pour éliminer le bug "da", "ba", "st"… affiché en texte brut quand la font
// Material Symbols ne charge pas assez vite.
// Coque commune DashboardShell (2026-09-26) : la logique (boutiques, compteurs,
// rôle, repli mémorisé) reste ici ; l'habillage vit dans components/formations/dashboard.
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { Store, LogOut } from "lucide-react";
import { RoleGuard } from "@/components/formations/RoleGuard";
import { ShopProvider, useActiveShop } from "@/components/formations/ShopProvider";
import ShopSwitcher from "@/components/formations/ShopSwitcher";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";
import { DashboardShell, ShellUserChip, initiales } from "@/components/formations/dashboard/DashboardShell";
import type { ShellNavSection } from "@/components/formations/dashboard/SidebarNav";
import {
  COMPTEUR_PAR_HREF,
  sectionsVendeur,
  type CompteursVendeur,
} from "@/components/formations/dashboard/nav/vendeur";

// Référence stable tant que l'API n'a pas répondu (évite un recalcul par rendu).
const COUNTS_VIDES: CompteursVendeur = { abandons: 0, inquiries: 0, retraits: 0 };

export default function VendeurLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="instructeur">
      <ShopProvider>
        <VendeurLayoutInner>{children}</VendeurLayoutInner>
      </ShopProvider>
    </RoleGuard>
  );
}

function VendeurLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const { activeShop, scope } = useActiveShop();

  const { data: countsResp } = useQuery<{ data: CompteursVendeur }>({
    queryKey: ["vendeur-sidebar-counts", scope],
    queryFn: () => fetch(`/api/formations/vendeur/sidebar-counts?shopId=${encodeURIComponent(scope)}`).then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const counts: CompteursVendeur = countsResp?.data ?? COUNTS_VIDES;

  // Badges « à traiter » : on mémorise le compteur DÉJÀ VU par le vendeur pour
  // que le badge disparaisse après la visite de la page (et réapparaisse
  // seulement si de nouveaux éléments arrivent). Corrige « la notification ne
  // quitte pas » sur Abandons.
  const [seenCounts, setSeenCounts] = useState<Partial<CompteursVendeur>>({});
  useEffect(() => {
    try {
      setSeenCounts(JSON.parse(localStorage.getItem("nk-vendor-seen-counts") || "{}"));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    for (const [href, key] of Object.entries(COMPTEUR_PAR_HREF)) {
      if ((pathname === href || pathname.startsWith(href + "/")) && counts[key] != null) {
        setSeenCounts((prev) => {
          if (prev[key] === counts[key]) return prev;
          const next = { ...prev, [key]: counts[key] };
          try { localStorage.setItem("nk-vendor-seen-counts", JSON.stringify(next)); } catch { /* ignore */ }
          return next;
        });
      }
    }
  }, [pathname, counts]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vendeur-sidebar-collapsed");
      if (saved === "true") setCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("vendeur-sidebar-collapsed", String(next)); } catch { /* ignore */ }
  }

  // Menu de la coque (nav/vendeur.ts) : compteurs « à traiter » visibles
  // seulement au-delà de ce que le vendeur a déjà vu.
  const sections = useMemo<ShellNavSection[]>(
    () => sectionsVendeur({ compteurs: counts, dejaVus: seenCounts }),
    [counts, seenCounts],
  );

  const displayName = session?.user?.name ?? "Vendeur";
  const initials = initiales(session?.user?.name, "FH");
  const avatarUrl = session?.user?.image;

  const shopColor = activeShop?.themeColor || "#006e2f";

  if (pathname === "/vendeur/choisir-boutique") {
    return (
      <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        {children}
      </div>
    );
  }

  // Éditeur de tunnel ([id]) : mode PLEIN ÉCRAN immersif — pas de sidebar ni de
  // chrome dashboard, l'éditeur occupe tout l'espace (façon Système.io/canva).
  // La liste (/funnels) et la création IA (/funnels/nouveau-ai) gardent le shell.
  if (
    /^\/vendeur\/marketing\/funnels\/[^/]+$/.test(pathname ?? "") &&
    !(pathname ?? "").endsWith("/nouveau-ai")
  ) {
    return (
      <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
        {children}
      </div>
    );
  }

  return (
    <DashboardShell
      space="vendeur"
      spaceLabel="Espace vendeur"
      homeHref="/vendeur/dashboard"
      sections={sections}
      collapse={{ mode: "rail", collapsed, onToggle: toggleCollapsed }}
      search={{ placeholder: "Rechercher...", label: "Rechercher dans l'espace vendeur" }}
      style={{ "--shop-color": shopColor } as React.CSSProperties}
      topStart={
        <>
          {/* Active shop switcher (only shown when 2+ shops) */}
          <ShopSwitcher />
          {/* Voir la boutique — le vendeur passait par « Mes boutiques » puis un
              second clic pour simplement regarder sa vitrine. Ouvre dans un
              nouvel onglet : il compare son rendu public sans perdre le tableau
              de bord ou le formulaire en cours de saisie. Masqué en vue globale
              (« Toutes les boutiques ») : aucune vitrine précise à ouvrir. */}
          {scope !== "all" && activeShop?.slug && (
            <a
              href={`/${activeShop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Voir la boutique publique"
              aria-label="Voir la boutique publique"
              className="nkd-btn nkd-btn--sm"
            >
              <Store aria-hidden="true" />
              <span className="nkd-btn__xl">Voir la boutique</span>
            </a>
          )}
        </>
      }
      topEnd={
        <>
          <div className="nkd__bell">
            <NovakouNotificationBell tone="slate" viewAllHref="/vendeur/notifications" />
          </div>
          <ShellUserChip
            href="/vendeur/profil"
            name={displayName}
            subtitle={activeShop?.name ? "Vendeur Pro" : "Vendeur"}
            src={avatarUrl}
            initials={initials}
            chevron
          />
        </>
      }
      sidebarFoot={
        <button
          type="button"
          onClick={() => {
            document.cookie = "nk_active_shop=; path=/; max-age=0";
            signOut({ callbackUrl: "/" });
          }}
          title={collapsed ? "Se déconnecter" : undefined}
          className="nkd-btn nkd-btn--danger nkd-btn--block"
        >
          <LogOut aria-hidden="true" />
          <span className="nkd__foot-label">Se déconnecter</span>
        </button>
      }
    >
      {children}
    </DashboardShell>
  );
}
