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
import {
  LayoutDashboard,
  BarChart3,
  Store,
  Link2,
  CreditCard,
  Layers,
  Receipt,
  AlertCircle,
  Wallet,
  Megaphone,
  Sparkles,
  Brain,
  Bot,
  Zap,
  MessageSquare,
  Star,
  HelpCircle,
  Users,
  Contact,
  Headphones,
  FolderOpen,
  KeyRound,
  Webhook,
  BookOpen,
  ShieldCheck,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { RoleGuard } from "@/components/formations/RoleGuard";
import { ShopProvider, useActiveShop } from "@/components/formations/ShopProvider";
import ShopSwitcher from "@/components/formations/ShopSwitcher";
import { NovakouNotificationBell } from "@/components/notifications/NovakouNotificationBell";
import { DashboardShell, ShellUserChip, initiales } from "@/components/formations/dashboard/DashboardShell";
import type { ShellNavItem, ShellNavSection } from "@/components/formations/dashboard/SidebarNav";

/**
 * Vote 13 — badges "à traiter" sur la sidebar vendeur.
 * Mapping route → clé compteur de l'endpoint /api/formations/vendeur/sidebar-counts :
 *   /vendeur/abandons  → abandons (CheckoutAttempt ABANDONED/FAILED non récupérés)
 *   /vendeur/inquiries → inquiries (ProductInquiry status="pending")
 *   /wallet            → retraits  (InstructorWithdrawal status="EN_ATTENTE")
 */
const COUNT_KEY_BY_HREF: Record<string, "abandons" | "inquiries" | "retraits"> = {
  "/vendeur/abandons": "abandons",
  "/vendeur/inquiries": "inquiries",
  "/wallet": "retraits",
};

type SidebarCounts = { abandons: number; inquiries: number; retraits: number };
// Référence stable tant que l'API n'a pas répondu (évite un recalcul par rendu).
const COUNTS_VIDES: SidebarCounts = { abandons: 0, inquiries: 0, retraits: 0 };

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  badge?: string;
  section?: string;
};

// Note : `Storefront` n'existe pas dans lucide-react — on utilise `Store` partout
// et on distingue produits (Store) vs boutiques (Store) par les labels.
const navItems: NavItem[] = [
  // Vue
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendeur/dashboard", section: "Vue" },
  { icon: BarChart3, label: "Statistiques", href: "/vendeur/statistiques", section: "Vue" },
  // Catalogue
  { icon: Store, label: "Mes produits", href: "/vendeur/produits", section: "Catalogue" },
  { icon: Link2, label: "Liens de paiement", href: "/vendeur/liens-paiement", section: "Catalogue" },
  { icon: CreditCard, label: "Abonnements", href: "/vendeur/memberships", section: "Catalogue" },
  { icon: Layers, label: "Bundles", href: "/vendeur/bundles", section: "Catalogue" },
  { icon: Store, label: "Mes boutiques", href: "/vendeur/boutiques", section: "Catalogue" },
  { icon: Receipt, label: "Transactions", href: "/vendeur/transactions", section: "Catalogue" },
  { icon: Contact, label: "Clients", href: "/vendeur/clients", section: "Catalogue" },
  { icon: AlertCircle, label: "Abandons & Échecs", href: "/vendeur/abandons", section: "Catalogue" },
  { icon: Wallet, label: "Revenus & retraits", href: "/wallet", section: "Catalogue" },
  // Croissance
  { icon: Megaphone, label: "Marketing", href: "/vendeur/marketing", section: "Croissance" },
  { icon: Sparkles, label: "AI Studio", href: "/vendeur/ai-studio", section: "Croissance", badge: "IA" },
  { icon: Brain, label: "Coach IA", href: "/vendeur/ai-coach", section: "Croissance", badge: "IA" },
  { icon: Bot, label: "Bot support boutique", href: "/vendeur/support-ia", section: "Croissance", badge: "IA" },
  { icon: Zap, label: "Automatisations", href: "/vendeur/automatisations", section: "Croissance" },
  // Engagement
  { icon: MessageSquare, label: "Messages", href: "/messages", section: "Engagement" },
  { icon: Star, label: "Avis clients", href: "/vendeur/avis", section: "Engagement" },
  { icon: HelpCircle, label: "Questions acheteurs", href: "/vendeur/inquiries", section: "Engagement" },
  { icon: Users, label: "Communauté", href: "/vendeur/communaute", section: "Engagement" },
  { icon: Headphones, label: "Coaching", href: "/vendeur/coaching", section: "Engagement", badge: "Pro" },
  { icon: FolderOpen, label: "Ressources", href: "/vendeur/ressources", section: "Engagement" },
  // Développeur
  { icon: KeyRound, label: "Clés API", href: "/vendeur/api-keys", section: "Développeur" },
  { icon: Webhook, label: "Webhooks sortants", href: "/vendeur/webhooks", section: "Développeur" },
  { icon: BookOpen, label: "Documentation API", href: "/vendeur/documentation-api", section: "Développeur" },
  // Compte
  // « Mon profil » retiré du menu : dans le modèle multi-boutique, c'est
  // l'identité de la BOUTIQUE qui est publique, pas le profil personnel. Le
  // profil reste accessible via l'avatar en haut à droite et « Paramètres ».
  { icon: Users, label: "Équipe", href: "/vendeur/parametres/equipe", section: "Compte" },
  { icon: ShieldCheck, label: "Vérification KYC", href: "/kyc", section: "Compte" },
  { icon: Settings, label: "Paramètres", href: "/vendeur/parametres", section: "Compte" },
];

// Group nav items by section
const sectionLabels = Array.from(new Set(navItems.map((n) => n.section))).filter(Boolean) as string[];

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

  const { data: countsResp } = useQuery<{ data: SidebarCounts }>({
    queryKey: ["vendeur-sidebar-counts", scope],
    queryFn: () => fetch(`/api/formations/vendeur/sidebar-counts?shopId=${encodeURIComponent(scope)}`).then((r) => r.json()),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
  const counts: SidebarCounts = countsResp?.data ?? COUNTS_VIDES;

  // Badges « à traiter » : on mémorise le compteur DÉJÀ VU par le vendeur pour
  // que le badge disparaisse après la visite de la page (et réapparaisse
  // seulement si de nouveaux éléments arrivent). Corrige « la notification ne
  // quitte pas » sur Abandons.
  const [seenCounts, setSeenCounts] = useState<Partial<SidebarCounts>>({});
  useEffect(() => {
    try {
      setSeenCounts(JSON.parse(localStorage.getItem("nk-vendor-seen-counts") || "{}"));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    for (const [href, key] of Object.entries(COUNT_KEY_BY_HREF)) {
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

  // Menu de la coque : mêmes liens, compteurs « à traiter » (visibles seulement
  // au-delà de ce que le vendeur a déjà vu) et pastilles IA / Pro.
  const sections = useMemo<ShellNavSection[]>(
    () =>
      sectionLabels.map((label) => ({
        label,
        items: navItems
          .filter((n) => n.section === label)
          .map((item): ShellNavItem => {
            const countKey = COUNT_KEY_BY_HREF[item.href];
            const count = countKey ? counts[countKey] : 0;
            const showCountBadge = countKey ? count > (seenCounts[countKey] ?? 0) : false;
            return {
              icon: item.icon,
              label: item.label,
              href: item.href,
              count: showCountBadge ? count : 0,
              countLabel: "à traiter",
              tag: item.badge ? { label: item.badge, tone: item.badge === "Pro" ? "amber" : "green" } : undefined,
            };
          }),
      })),
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
