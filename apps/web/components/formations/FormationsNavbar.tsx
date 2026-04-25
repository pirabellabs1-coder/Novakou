"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { getDashboardForFormationsRole, getRoleLabel } from "@/lib/formations/role-routing";
import CartBadge from "./CartBadge";

function initials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const NAV_LINKS = [
  { href: "/", label: "Explorer" },
  { href: "/explorer", label: "Marketplace" },
  { href: "/fonctionnalites", label: "Fonctionnalités", mega: true },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/affiliation", label: "Affiliation" },
];

const FEATURE_CATEGORIES = [
  {
    title: "Vendre",
    items: [
      { icon: "storefront", label: "Boutique en ligne", desc: "Votre vitrine pro en 3 min", href: "/fonctionnalites#boutique" },
      { icon: "account_tree", label: "Tunnels de vente", desc: "Funnels qui convertissent", href: "/fonctionnalites#funnels" },
      { icon: "sell", label: "Pricing flexible", desc: "Forfaits, promos, coupons", href: "/fonctionnalites#pricing" },
    ],
  },
  {
    title: "Encaisser",
    items: [
      { icon: "account_balance_wallet", label: "Mobile Money", desc: "Wave, Orange, MTN — 17 pays", href: "/fonctionnalites#paiements" },
      { icon: "credit_card", label: "Carte & PayPal", desc: "Visa, Mastercard, SEPA", href: "/fonctionnalites#paiements" },
      { icon: "payments", label: "Retraits rapides", desc: "Sous 24-48h sur votre compte", href: "/fonctionnalites#retraits" },
    ],
  },
  {
    title: "Créer",
    items: [
      { icon: "auto_awesome", label: "Assistant IA", desc: "Rédaction, structure, quiz", href: "/fonctionnalites#ia" },
      { icon: "play_circle", label: "Hébergement vidéo", desc: "Vidéos sécurisées incluses", href: "/fonctionnalites#video" },
      { icon: "workspace_premium", label: "Certificats", desc: "Diplômes auto-générés", href: "/fonctionnalites#certificats" },
    ],
  },
  {
    title: "Automatiser",
    items: [
      { icon: "mail", label: "Emails automatiques", desc: "Séquences & notifications", href: "/fonctionnalites#emails" },
      { icon: "bolt", label: "Automatisations", desc: "Workflows sans code", href: "/fonctionnalites#automatisations" },
      { icon: "group", label: "Affiliation", desc: "Vos clients deviennent vendeurs", href: "/fonctionnalites#affiliation" },
    ],
  },
];

function FeaturesMegaMenu({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[720px] bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50">
      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
        {FEATURE_CATEGORIES.map((cat) => (
          <div key={cat.title} className="p-4">
            <p className="text-[10px] font-bold text-[#5c647a] uppercase tracking-widest mb-2">{cat.title}</p>
            <div className="space-y-1">
              {cat.items.map((item) => (
                <Link key={item.label} href={item.href} onClick={onClose}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#006e2f]/5 transition-colors group">
                  <span className="material-symbols-outlined text-[20px] text-[#006e2f] mt-0.5 group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">{item.label}</p>
                    <p className="text-xs text-[#5c647a]">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-[#5c647a]">10 % de commission · Zéro abonnement</p>
        <Link href="/fonctionnalites" onClick={onClose} className="text-xs font-bold text-[#006e2f] hover:underline flex items-center gap-1">
          Voir toutes les fonctionnalités <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}

function UserMenu({
  name, email, image, role, formationsRole,
}: {
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  formationsRole?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const isAdmin = role === "ADMIN";
  const isVendor = formationsRole === "instructeur";
  const isMentor = formationsRole === "mentor";
  const isAffilie = formationsRole === "affilie";
  const dashboardHref = getDashboardForFormationsRole(formationsRole as "apprenant" | "instructeur" | "mentor" | "affilie" | undefined, role);
  const dashboardLabel = isAdmin ? "Espace admin"
    : isVendor ? "Mon espace vendeur"
    : isMentor ? "Mon espace mentor"
    : isAffilie ? "Mon espace affilié"
    : "Mon espace apprenant";
  const roleLabel = isAdmin ? "Admin" : getRoleLabel(formationsRole as "apprenant" | "instructeur" | "mentor" | "affilie" | undefined);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : initials(name)}
        </div>
        <span className="hidden lg:inline text-sm font-semibold text-[#191c1e] max-w-[120px] truncate">
          {name?.split(" ")[0] ?? "Mon compte"}
        </span>
        <span className={`material-symbols-outlined text-[16px] text-[#5c647a] transition-transform ${open ? "rotate-180" : ""}`}>expand_more</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden z-50">
          <div className="px-4 py-3 bg-gradient-to-br from-[#006e2f]/5 to-[#22c55e]/5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : initials(name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#191c1e] truncate">{name ?? "Utilisateur"}</p>
                <p className="text-[11px] text-[#5c647a] truncate">{email}</p>
              </div>
            </div>
            {formationsRole && (
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#006e2f] text-white uppercase tracking-wider">
                {roleLabel}
              </span>
            )}
          </div>
          <div className="py-1.5">
            <Link href={dashboardHref} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-[#191c1e] hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-[18px] text-[#006e2f]">dashboard</span>{dashboardLabel}
            </Link>
            {!isAdmin && !isVendor && (
              <>
                <Link href="/apprenant/mes-formations" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1e] hover:bg-gray-50"><span className="material-symbols-outlined text-[18px] text-[#5c647a]">school</span>Mes formations</Link>
                <Link href="/apprenant/commandes" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1e] hover:bg-gray-50"><span className="material-symbols-outlined text-[18px] text-[#5c647a]">receipt_long</span>Mes commandes</Link>
              </>
            )}
            {isVendor && (
              <>
                <Link href="/vendeur/produits" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1e] hover:bg-gray-50"><span className="material-symbols-outlined text-[18px] text-[#5c647a]">inventory_2</span>Mes produits</Link>
                <Link href="/vendeur/transactions" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1e] hover:bg-gray-50"><span className="material-symbols-outlined text-[18px] text-[#5c647a]">payments</span>Mes ventes</Link>
              </>
            )}
            <div className="my-1 border-t border-gray-100" />
            <Link href={isVendor ? "/vendeur/parametres" : "/apprenant/parametres"} onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#191c1e] hover:bg-gray-50"><span className="material-symbols-outlined text-[18px] text-[#5c647a]">settings</span>Paramètres</Link>
            <button onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 text-left">
              <span className="material-symbols-outlined text-[18px]">logout</span>Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FormationsNavbar() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && session?.user;
  const [mobileMenu, setMobileMenu] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaRef = useRef<HTMLDivElement | null>(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
      <div className="flex justify-between items-center px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="10" fill="#006e2f"/>
            <path d="M11 26V10h3l7 10.5V10h3v16h-3L14 15.5V26h-3z" fill="white"/>
          </svg>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">Novakou</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-8 items-center text-sm font-medium tracking-tight relative" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
          {NAV_LINKS.map((l) =>
            l.mega ? (
              <div key={l.href} ref={megaRef} className="relative"
                onMouseEnter={() => { if (megaTimer.current) clearTimeout(megaTimer.current); setMegaOpen(true); }}
                onMouseLeave={() => { megaTimer.current = setTimeout(() => setMegaOpen(false), 200); }}>
                <button className="text-slate-600 hover:text-green-500 transition-colors duration-300 flex items-center gap-0.5">
                  {l.label}
                  <span className={`material-symbols-outlined text-[16px] transition-transform ${megaOpen ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                {megaOpen && <FeaturesMegaMenu onClose={() => setMegaOpen(false)} />}
              </div>
            ) : (
              <Link key={l.href} href={l.href} className="text-slate-600 hover:text-green-500 transition-colors duration-300">{l.label}</Link>
            )
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <CartBadge />
          {status === "loading" ? (
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
          ) : isLoggedIn ? (
            <UserMenu
              name={session.user.name ?? null}
              email={session.user.email ?? ""}
              image={session.user.image ?? null}
              role={(session.user as { role?: string }).role ?? "APPRENANT"}
              formationsRole={(session.user as { formationsRole?: string }).formationsRole}
            />
          ) : (
            <>
              <Link href="/connexion" className="hidden sm:inline text-slate-600 text-sm font-semibold px-3 py-2 hover:text-green-500">
                Connexion
              </Link>
              <Link
                href="/inscription"
                className="text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap active:scale-90 transition-transform shadow-lg shadow-green-200"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                Créer ma boutique
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenu((o) => !o)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <span className="material-symbols-outlined text-[24px] text-[#191c1e]">
              {mobileMenu ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.filter((l) => !l.mega).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenu(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[#191c1e] hover:bg-[#006e2f]/5 hover:text-[#006e2f] transition-colors"
              >
                {l.label}
              </Link>
            ))}
            {/* Fonctionnalités expanded on mobile */}
            <div className="my-2 border-t border-gray-100" />
            <p className="px-3 py-1 text-[10px] font-bold text-[#5c647a] uppercase tracking-widest">Fonctionnalités</p>
            {FEATURE_CATEGORIES.map((cat) =>
              cat.items.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#191c1e] hover:bg-[#006e2f]/5 transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-[#006e2f]" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))
            )}
            {!isLoggedIn && (
              <>
                <div className="my-2 border-t border-gray-100" />
                <Link
                  href="/connexion"
                  onClick={() => setMobileMenu(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-[#191c1e] hover:bg-gray-50"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#5c647a]">login</span>
                  Connexion
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
