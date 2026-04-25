import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { RevenueSimulator } from "@/components/formations/RevenueSimulator";
import { CreatorsJoinBadge, HeroBadge } from "@/components/formations/PublicStatsBadge";
import { BestSellers } from "@/components/formations/BestSellers";

export const metadata: Metadata = {
  title: "Novakou | Vendez vos formations partout en Afrique francophone",
  description:
    "Boutique, paiements Mobile Money, tunnels de vente et assistants IA inclus. Lancez-vous en 3 minutes, 10 % de commission sur vos ventes, zéro abonnement.",
};

/* ─── Typographies Satoshi inline ─────────────────────────── */
const satoshi = {
  fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
const satoshiHeading = {
  ...satoshi,
  fontWeight: 700,
  letterSpacing: "-0.04em",
} as const;

/* ─── Palette Novakou ─────────────────────────────────────── */
const COLORS = {
  primary: "#006e2f",
  accent: "#22c55e",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
  surfaceLow: "#f0f5ec",
  surfaceHigh: "#e5eae1",
  surfaceVariant: "#dfe4db",
  outlineVariant: "#becabc",
} as const;

/* ─── Helpers ─────────────────────────────────────────────── */
function CategoryPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase mb-4"
      style={{ ...satoshi, backgroundColor: COLORS.surfaceHigh, color: COLORS.dark }}
    >
      {children}
    </span>
  );
}

export default async function FormationsPage() {
  return (
    <div style={{ backgroundColor: COLORS.surface, color: COLORS.dark, ...satoshi }}>
      <main className="pb-16 md:pb-24 space-y-16 md:space-y-24 lg:space-y-32 overflow-x-hidden">

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 1. HERO — 1 colonne centrée                                  */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 text-center pt-8 md:pt-16 lg:pt-20">
          <div className="flex justify-center mb-8">
            <div
              className="inline-flex items-center space-x-3 px-4 py-2 rounded-full border"
              style={{ backgroundColor: COLORS.surfaceLow, borderColor: COLORS.outlineVariant + "4D" }}
            >
              <div className="flex -space-x-2">
                {[
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuCGX9twRtRgGltcxTW9EJqsOv96cSwnoA52sgPvi8MP01qX3Op1EHt2i0VBzfz-b6mSWa7jF_Tx7d3IDD85s0coZmYh7gfA7FB1N11CoeKDxxswhjkbzIvMehRzugu_lVYtx6Kqvl2lTR5vy15PIDDO7aQDWdNKgxQH_uEL7wHsK7GTFlqregV6cfryXRuDPzfPYQh4c-Af_Wv6qIGmS6JhUTKx7dsEmav4iWsoRfZhoNwe-uafQJCMFkqq0iR7RbD4IR8YIEA1JjhG",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuD9Rh0ecjM8nGvWfG_C0KbaGYWrSmu8xmHRjCO70WBZ0-5sZv2Q2D-Fabrnx0JT4aLiEkSG11YZCkMwiEefpWTFRezj3cUHsuIsBJvS1JtkK_7oFybZDfAHwmDm-x3XW245JemBnQqaJLvjzqZYEmm5vcb8svccewMahXmGTu_kVEEV9BW2z0WeqRDmHbfwA8bpGilxMYyCmloYq4f1ntMSEdBg3G7z2jFkbA8eyRqogewLAHfdnyJW3V2nvgIKHN4cLsu4rdNAJIec",
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuCWvzWuZ26p82Ka65aS2FRWuFajMaeVjZFTmt2eKbeFM-76x_bYcQq7VTJJPuV5cz-ioD79i1dCmXQ3qMqU-4aLD4VUgTHd-i9NV5iPOaHec279DuNt-RDWnmVDNA8g3upiBszScHtBOVjg7zbx_pugaYRw1GK0SpNDOaVQzM_XwYrvSvAxx8P_uLrdUAUw3_GBisqCKKjiv2-RVRePMSUtMDEUgzmPQxAbgo6mJ329ft5SkMx0mv_meMJKtwORR4npogpFuRKhme5E",
                ].map((src, i) => (
                  <Image
                    key={i}
                    className="w-8 h-8 rounded-full object-cover"
                    style={{ borderWidth: 2, borderColor: COLORS.surface, borderStyle: "solid" }}
                    src={src}
                    alt="Créateur"
                    width={32}
                    height={32}
                    unoptimized
                  />
                ))}
              </div>
              <CreatorsJoinBadge />
            </div>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-[64px] leading-[1.08] max-w-4xl mx-auto mb-6"
            style={{ ...satoshiHeading, color: COLORS.dark }}
          >
            Vendez vos{" "}
            <span style={{ color: COLORS.primary }}>produits digitaux</span>{" "}
            en quelques minutes.
          </h1>

          <p className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-[1.6]" style={{ color: COLORS.muted }}>
            Formations, ebooks, coaching, templates. Boutique, paiements, tunnels de vente et assistants IA inclus. 10 % de commission, zéro abonnement.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/inscription?role=vendeur"
              className="w-full sm:w-auto text-white text-lg py-4 px-8 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              style={{ ...satoshi, backgroundColor: COLORS.primary, boxShadow: `0 10px 30px ${COLORS.primary}25` }}
            >
              Lancer ma boutique
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              href="/explorer"
              className="w-full sm:w-auto bg-transparent text-lg py-4 px-8 rounded-lg font-medium border-2 transition-colors flex items-center justify-center hover:bg-white"
              style={{ ...satoshi, color: COLORS.dark, borderColor: COLORS.outlineVariant }}
            >
              Voir la démo
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 2. DASHBOARD PREVIEW — light theme premium                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="relative rounded-xl overflow-hidden bg-white border" style={{ borderColor: COLORS.outlineVariant + "33", boxShadow: "0 20px 40px rgba(25, 28, 30, 0.04)" }}>
            {/* Browser Chrome */}
            <div className="flex items-center px-4 py-3 border-b" style={{ backgroundColor: COLORS.surfaceLow, borderColor: COLORS.outlineVariant + "33" }}>
              <div className="flex space-x-2 mr-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ffdad6" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.surfaceVariant }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#9af7a8" }} />
              </div>
              <div className="bg-white text-xs py-1 px-4 rounded-md mx-auto w-1/2 text-center truncate font-mono" style={{ color: COLORS.muted }}>
                novakou.com/vendeur/dashboard
              </div>
            </div>

            <div className="flex flex-col md:flex-row">
              {/* Sidebar */}
              <aside className="w-full md:w-64 border-r p-6 flex-col hidden md:flex" style={{ backgroundColor: COLORS.surfaceLow, borderColor: COLORS.outlineVariant + "33" }}>
                <div className="text-2xl font-bold mb-8" style={{ ...satoshiHeading, color: COLORS.primary, letterSpacing: "-0.02em" }}>Novakou</div>
                <nav className="space-y-2 flex-1">
                  <a
                    className="flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-sm"
                    style={{ backgroundColor: COLORS.primary + "1A", color: COLORS.primary }}
                    href="#"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
                    Dashboard
                  </a>
                  {[
                    { icon: "shopping_cart", label: "Commandes" },
                    { icon: "inventory_2", label: "Formations" },
                  ].map((item) => (
                    <a key={item.label} href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors" style={{ color: COLORS.muted }}>
                      <span className="material-symbols-outlined">{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
                  <div className="pt-6 pb-2">
                    <div className="px-4 text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#6f7a6e" }}>IA STUDIO</div>
                    <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors relative" style={{ color: COLORS.muted }}>
                      <span className="material-symbols-outlined">smart_toy</span>
                      Chatbots
                      <span className="absolute right-4 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "#4ae176" }} />
                    </a>
                  </div>
                </nav>
                <div className="mt-auto">
                  <a href="#" className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm hover:bg-white transition-colors" style={{ color: COLORS.muted }}>
                    <span className="material-symbols-outlined">settings</span>
                    Paramètres
                  </a>
                </div>
              </aside>

              {/* Main */}
              <div className="flex-1 p-6 md:p-8 bg-white overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl md:text-3xl" style={{ ...satoshiHeading, color: COLORS.dark }}>Bonjour, Aminata</h2>
                  <button className="p-2 rounded-full border hover:bg-white transition-colors" style={{ backgroundColor: COLORS.surfaceLow, borderColor: COLORS.outlineVariant + "4D", color: COLORS.muted }}>
                    <span className="material-symbols-outlined">notifications</span>
                  </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: "Revenus (7j)", value: "— F", trend: "", trendColor: COLORS.primary, icon: "trending_up" },
                    { label: "Ventes (7j)", value: "—", trend: "", trendColor: COLORS.primary, icon: "trending_up" },
                    { label: "Visiteurs", value: "—", trend: "", trendColor: "#6f7a6e", icon: "trending_flat" },
                    { label: "Taux de conv.", value: "—", trend: "", trendColor: "#ba1a1a", icon: "trending_down" },
                  ].map((k) => (
                    <div key={k.label} className="p-5 rounded-xl border" style={{ backgroundColor: COLORS.surfaceLow, borderColor: COLORS.outlineVariant + "33" }}>
                      <div className="text-sm mb-2" style={{ color: COLORS.muted }}>{k.label}</div>
                      <div className="text-2xl font-bold" style={{ ...satoshiHeading, color: COLORS.dark }}>{k.value}</div>
                      <div className="text-xs font-medium mt-2 flex items-center gap-1" style={{ color: k.trendColor }}>
                        <span className="material-symbols-outlined text-[14px]">{k.icon}</span>
                        {k.trend}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <div className="lg:col-span-2 p-6 rounded-xl border h-64 flex flex-col justify-end" style={{ backgroundColor: COLORS.surfaceLow, borderColor: COLORS.outlineVariant + "33" }}>
                    <div className="text-sm mb-auto" style={{ color: COLORS.muted }}>Évolution des revenus</div>
                    <div className="flex items-end space-x-2 h-40">
                      {[
                        { h: "30%", op: 0.2 },
                        { h: "45%", op: 0.2 },
                        { h: "25%", op: 0.2 },
                        { h: "60%", op: 0.4 },
                        { h: "80%", op: 0.5 },
                        { h: "100%", op: 1 },
                        { h: "75%", op: 0.8 },
                      ].map((bar, i) => (
                        <div
                          key={i}
                          className="w-full rounded-t-md transition-colors"
                          style={{ height: bar.h, backgroundColor: COLORS.primary, opacity: bar.op }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recent Sales */}
                  <div className="p-6 rounded-xl border h-64 overflow-hidden flex flex-col" style={{ backgroundColor: COLORS.surfaceLow, borderColor: COLORS.outlineVariant + "33" }}>
                    <div className="text-sm mb-4" style={{ color: COLORS.muted }}>Ventes récentes</div>
                    <div className="space-y-4 overflow-y-auto pr-2">
                      {[
                        { name: "Client A.", initials: "CA", time: "Récemment", amount: "+ — F" },
                        { name: "Client B.", initials: "CB", time: "Récemment", amount: "+ — F" },
                        { name: "Client C.", initials: "CC", time: "Récemment", amount: "+ — F" },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: COLORS.accent + "33", color: COLORS.primary }}>
                              {s.initials}
                            </div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: COLORS.dark }}>{s.name}</div>
                              <div className="text-xs" style={{ color: COLORS.muted }}>{s.time}</div>
                            </div>
                          </div>
                          <div className="text-sm font-bold" style={{ color: COLORS.primary }}>{s.amount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Green Glow */}
            <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 w-3/4 h-32 rounded-full -z-10 pointer-events-none" style={{ backgroundColor: COLORS.primary + "33", filter: "blur(48px)" }} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 4. COMMENT ÇA MARCHE — 3 étapes                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 md:py-24" style={{ backgroundColor: "white" }}>
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 md:mb-16">
            <CategoryPill>Comment ça marche</CategoryPill>
            <h2 className="text-3xl sm:text-4xl md:text-6xl mb-4" style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}>
              De l&apos;idée au revenu<br />en 3 étapes
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto leading-[1.6]" style={{ color: COLORS.muted }}>
              Créer votre boutique, partager vos liens et encaisser vos ventes devient un jeu d&apos;enfant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                n: "01",
                icon: "rocket_launch",
                title: "Lancez",
                desc: "Inscrivez-vous gratuitement, créez votre boutique, ajoutez vos produits. Tout se fait en moins de 10 minutes sans compétence technique.",
              },
              {
                n: "02",
                icon: "share",
                title: "Diffusez",
                desc: "Partagez le lien de votre boutique sur WhatsApp, Instagram, TikTok, ou intégrez-le à votre site. Tunnels de vente et popups inclus.",
              },
              {
                n: "03",
                icon: "account_balance_wallet",
                title: "Encaissez",
                desc: "Recevez les paiements automatiquement sur votre wallet. Retrait vers Mobile Money, carte bancaire ou virement quand vous voulez.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="bg-white p-8 rounded-2xl border relative overflow-hidden"
                style={{ borderColor: COLORS.outlineVariant + "4D" }}
              >
                <div className="absolute top-4 right-4 text-5xl font-black opacity-10" style={{ ...satoshiHeading, color: COLORS.primary }}>
                  {step.n}
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ backgroundColor: COLORS.primary, color: "white" }}>
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>{step.icon}</span>
                </div>
                <h3 className="text-2xl mb-3" style={{ ...satoshiHeading, color: COLORS.dark, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-[1.6]" style={{ color: COLORS.muted }}>{step.desc}</p>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 5. FEATURES — 8 essentielles fusionnées                        */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6" id="features">
          <div className="text-center mb-10 md:mb-16">
            <CategoryPill>Fonctionnalités</CategoryPill>
            <h2 className="text-3xl sm:text-4xl md:text-6xl mb-4" style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}>
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-base md:text-lg max-w-2xl mx-auto leading-[1.6]" style={{ color: COLORS.muted }}>
              Une suite complète d&apos;outils pour gérer, vendre et développer votre activité de formation en ligne.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {[
              { icon: "storefront", title: "Boutique en ligne", desc: "Créez votre boutique vitrine personnalisée en quelques clics, sans coder." },
              { icon: "account_balance_wallet", title: "Paiements locaux", desc: "Acceptez Mobile Money (Wave, Orange, MTN) et les cartes bancaires internationales." },
              { icon: "auto_awesome", title: "Assistant IA", desc: "Générez vos plans de formation et vos argumentaires de vente automatiquement." },
              { icon: "account_tree", title: "Tunnels de vente", desc: "Pages de capture, vente, upsell, remerciement — prêtes à l'emploi." },
              { icon: "ondemand_video", title: "Hébergement vidéo", desc: "Vos vidéos sont sécurisées et hébergées chez nous, sans frais supplémentaires." },
              { icon: "workspace_premium", title: "Certificats", desc: "Génération automatique de diplômes pour vos apprenants." },
              { icon: "workflow", title: "Automatisations", desc: "Séquences d'emails, relances panier abandonné, offres post-achat automatiques." },
              { icon: "devices", title: "100% Mobile", desc: "Une expérience parfaite sur smartphone pour vous et vos clients." },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white p-6 rounded-xl border hover:shadow-md transition-shadow"
                style={{ borderColor: COLORS.outlineVariant + "4D" }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: COLORS.surfaceLow, color: COLORS.primary }}>
                    <span className="material-symbols-outlined">{f.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl mb-2" style={{ ...satoshiHeading, color: COLORS.dark, fontWeight: 600, letterSpacing: "-0.02em" }}>{f.title}</h3>
                    <p className="text-sm leading-[1.5]" style={{ color: COLORS.muted }}>{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8 md:mt-12">
            <Link
              href="/fonctionnalites"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border rounded-lg font-medium hover:border-emerald-500 transition-colors"
              style={{ ...satoshi, color: COLORS.dark, borderColor: COLORS.outlineVariant }}
            >
              Voir toutes les fonctionnalités
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 7. AI FEATURE — chatbot demo                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 md:py-24" style={{ backgroundColor: COLORS.primary }}>
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <span className="inline-block px-3 py-1 text-xs font-bold tracking-widest rounded-full mb-4 uppercase" style={{ ...satoshi, backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
                IA intégrée
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight" style={{ ...satoshiHeading, color: "white", lineHeight: 1.05 }}>
                Votre assistant personnel pour créer plus vite
              </h2>
              <p className="text-lg mb-8 leading-[1.6]" style={{ color: "#a7f3d0" }}>
                Ne partez plus jamais d&apos;une page blanche. L&apos;IA de Novakou vous aide à structurer vos modules, rédiger vos pages de vente et répondre aux questions de vos élèves.
              </p>
              <ul className="space-y-4">
                {[
                  "Génération de plan de formation complet",
                  "Copywriting pour vos pages de capture",
                  "Chatbot de support automatique 24/7",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="material-symbols-outlined" style={{ color: "white" }}>check_circle</span>
                    <span className="font-medium" style={{ color: "white" }}>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: COLORS.primary }}>
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <div>
                  <div className="font-bold" style={{ color: COLORS.dark }}>Novakou AI</div>
                  <div className="text-xs" style={{ color: COLORS.accent }}>En ligne</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
                  <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none text-sm" style={{ color: COLORS.dark }}>
                    Peux-tu me générer un plan pour une formation sur le Marketing Digital en Afrique ?
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 text-xs font-bold" style={{ backgroundColor: COLORS.primary }}>AI</div>
                  <div className="p-3 rounded-2xl rounded-tr-none text-sm" style={{ backgroundColor: "#d1fae5", color: COLORS.dark }}>
                    Bien sûr ! Voici une structure en 4 modules adaptée au marché africain :
                    <br /><br />
                    1. Fondamentaux et spécificités locales (WhatsApp, Facebook)<br />
                    2. Création d&apos;offres irrésistibles<br />
                    3. Publicité Facebook Ads à petit budget<br />
                    4. Vente et closing par téléphone
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                <input
                  className="flex-1 bg-slate-50 border-none rounded-full px-4 py-2 text-sm outline-none"
                  placeholder="Posez une question..."
                  type="text"
                />
                <button className="w-10 h-10 text-white rounded-full flex items-center justify-center hover:opacity-90 transition-opacity" style={{ backgroundColor: COLORS.primary }}>
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 6. BEST-SELLERS                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 md:mb-12">
            <CategoryPill>Déjà en vente</CategoryPill>
            <h2 className="text-3xl sm:text-4xl md:text-6xl" style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}>
              Les best-sellers du moment
            </h2>
          </div>
          <BestSellers />
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 7. PAYMENT FEATURE                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 md:py-24" style={{ backgroundColor: COLORS.primary }}>
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 md:mb-16">
              <span className="inline-block px-3 py-1 text-xs font-bold tracking-widest rounded-full mb-4 uppercase" style={{ ...satoshi, backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
                Paiements
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl mb-4" style={{ ...satoshiHeading, color: "white", lineHeight: 1.05 }}>
                Encaissez partout en Afrique
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto leading-[1.6]" style={{ color: "#a7f3d0" }}>
                Acceptez les paiements par Mobile Money de vos clients dans plusieurs pays d&apos;Afrique, et retirez vos fonds facilement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
              {/* Checkout */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 sm:transform sm:rotate-1 hover:rotate-0 transition-transform">
                <h3 className="text-xl mb-6" style={{ ...satoshiHeading, color: COLORS.dark, fontWeight: 600, letterSpacing: "-0.02em" }}>Paiement sécurisé</h3>
                <div className="border rounded-xl p-4 mb-4 flex justify-between items-center bg-slate-50 cursor-pointer ring-1" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "#1e88e5" }}>WAVE</div>
                    <span className="font-medium" style={{ color: COLORS.dark }}>Wave Mobile Money</span>
                  </div>
                  <span className="material-symbols-outlined" style={{ color: COLORS.primary }}>radio_button_checked</span>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 mb-6 flex justify-between items-center hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: "#f97316" }}>ORANGE</div>
                    <span className="font-medium" style={{ color: COLORS.dark }}>Orange Money</span>
                  </div>
                  <span className="material-symbols-outlined text-slate-300">radio_button_unchecked</span>
                </div>
                <button className="w-full text-white py-3 rounded-lg font-bold" style={{ ...satoshi, backgroundColor: COLORS.primary }}>
                  Payer maintenant
                </button>
              </div>

              {/* Withdrawal */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 sm:transform sm:-rotate-1 hover:rotate-0 transition-transform md:mt-16">
                <h3 className="text-xl mb-6" style={{ ...satoshiHeading, color: COLORS.dark, fontWeight: 600, letterSpacing: "-0.02em" }}>Retraits rapides</h3>
                <div className="rounded-xl p-6 mb-6 text-center" style={{ backgroundColor: COLORS.surfaceLow }}>
                  <div className="text-sm mb-1" style={{ color: COLORS.muted }}>Solde disponible</div>
                  <div className="text-3xl font-bold" style={{ ...satoshiHeading, color: COLORS.dark }}>— F</div>
                </div>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: COLORS.muted }}>Vers le compte :</span>
                    <span className="font-medium" style={{ color: COLORS.dark }}>Wave - 07 XX XX XX XX</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span style={{ color: COLORS.muted }}>Frais de retrait :</span>
                    <span className="font-medium" style={{ color: COLORS.dark }}>0 F</span>
                  </div>
                </div>
                <button className="w-full text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2" style={{ ...satoshi, backgroundColor: COLORS.dark }}>
                  <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                  Demander un retrait
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 7. SIMULATEUR DE REVENUS                                     */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <RevenueSimulator />

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 8. TESTIMONIALS                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 md:py-24" style={{ backgroundColor: "white" }} id="testimonials">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 md:mb-16">
            <CategoryPill>Ils utilisent Novakou</CategoryPill>
            <h2 className="text-3xl sm:text-4xl md:text-6xl mb-4" style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}>
              Rejoignez l&apos;élite des créateurs
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                name: "Fatou D.",
                role: "Coach Business, Dakar",
                text: "Avant Novakou, je perdais des ventes car mes clients ne pouvaient pas payer par carte. Depuis que j'ai intégré Mobile Money via la plateforme, je touche un public beaucoup plus large.",
              },
              {
                name: "Marc K.",
                role: "Formateur Design, Abidjan",
                text: "L'assistant IA est incroyable. Il m'a aidé à structurer ma formation sur le design graphique en quelques minutes. La plateforme est super intuitive, même sans connaissances techniques.",
              },
              {
                name: "Sarah L.",
                role: "Créatrice E-commerce, Lomé",
                text: "Le fait de n'avoir aucun abonnement fixe mensuel à payer quand on se lance est un vrai soulagement. On ne paie que si on vend. C'est le modèle parfait pour les créateurs africains.",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white p-8 rounded-2xl shadow-sm border" style={{ borderColor: COLORS.outlineVariant + "4D" }}>
                <div className="flex gap-1 mb-6" style={{ color: COLORS.accent }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="mb-8 text-base" style={{ color: COLORS.dark, lineHeight: 1.6 }}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-200" />
                  <div>
                    <div className="font-bold" style={{ color: COLORS.dark }}>{t.name}</div>
                    <div className="text-sm" style={{ color: COLORS.muted }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 9. PRICING                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6" id="pricing">
          <div className="text-center mb-10 md:mb-16">
            <CategoryPill>Tarification</CategoryPill>
            <h2 className="text-3xl sm:text-4xl md:text-6xl mb-4" style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}>
              Simple, transparent, équitable.
            </h2>
          </div>
          <div className="max-w-lg mx-auto bg-white rounded-3xl p-7 sm:p-10 shadow-xl border text-center relative overflow-hidden" style={{ borderColor: COLORS.outlineVariant + "33" }}>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-10" style={{ backgroundColor: COLORS.primary + "1A" }} />
            <div className="absolute bottom-0 left-0 w-32 h-32 rounded-tr-full -z-10" style={{ backgroundColor: COLORS.accent + "1A" }} />
            <h3 className="text-2xl mb-2" style={{ ...satoshiHeading, color: COLORS.dark, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Modèle Gagnant-Gagnant
            </h3>
            <p className="mb-8" style={{ color: COLORS.muted }}>Zéro abonnement. On gagne uniquement quand vous gagnez.</p>
            <div className="text-[96px] leading-none mb-8" style={{ ...satoshiHeading, color: COLORS.primary, fontWeight: 700 }}>10%</div>
            <p className="font-bold text-xl mb-8" style={{ color: COLORS.dark }}>de commission par vente</p>
            <ul className="space-y-4 text-left mb-10 border-t border-slate-100 pt-8">
              {[
                "0 F Frais d'installation",
                "0 F Abonnement mensuel",
                "Hébergement illimité inclus",
                "Toutes les fonctionnalités débloquées",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ color: COLORS.accent, fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span style={{ color: COLORS.dark }}>{t}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/inscription?role=vendeur"
              className="block w-full text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity"
              style={{ ...satoshi, backgroundColor: COLORS.primary }}
            >
              Commencer gratuitement
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 10. FAQ                                                      */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 md:py-24" style={{ backgroundColor: "white" }} id="faq">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 md:mb-16">
            <CategoryPill>Questions fréquentes</CategoryPill>
            <h2 className="text-3xl sm:text-4xl md:text-6xl mb-4" style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}>
              On vous dit tout.
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Quels pays sont pris en charge pour les retraits ?", a: "Nous supportons actuellement les retraits vers le Sénégal, la Côte d'Ivoire, le Togo, le Bénin, le Mali et le Burkina Faso via les solutions Mobile Money locales." },
              { q: "Dois-je payer un abonnement si je ne fais pas de ventes ?", a: "Non, l'utilisation de Novakou est sans abonnement fixe. Nous prélevons uniquement une commission de 10% sur vos ventes réussies." },
              { q: "Puis-je héberger mes vidéos directement sur Novakou ?", a: "Oui, l'hébergement vidéo sécurisé est inclus dans toutes vos formations sans frais supplémentaires." },
              { q: "Est-ce que je peux utiliser mon propre nom de domaine ?", a: "Oui, vous pouvez connecter votre propre nom de domaine personnalisé pour une image professionnelle." },
              { q: "En combien de temps puis-je retirer mon argent ?", a: "Les retraits par Mobile Money sont traités sous 24 à 48 h ouvrées maximum." },
              { q: "Comment fonctionne l'intelligence artificielle intégrée ?", a: "Notre IA vous assiste directement dans l'éditeur pour rédiger vos pages, structurer vos cours ou générer des quiz, en se basant sur le contexte de votre formation." },
              { q: "Mes contenus sont-ils protégés contre le téléchargement ?", a: "Oui, nous utilisons des technologies de chiffrement pour empêcher le téléchargement direct de vos vidéos et documents." },
              { q: "Proposez-vous un accompagnement pour débuter ?", a: "Absolument ! Notre équipe de support est là pour vous guider, et nous mettons à disposition une académie gratuite pour vous apprendre à vendre." },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border p-6 [&_summary::-webkit-details-marker]:hidden"
                style={{ borderColor: COLORS.outlineVariant + "4D" }}
              >
                <summary className="flex items-center justify-between cursor-pointer font-semibold text-base md:text-lg gap-3" style={{ ...satoshi, color: COLORS.dark }}>
                  {item.q}
                  <span className="transition group-open:rotate-180">
                    <span className="material-symbols-outlined">expand_more</span>
                  </span>
                </summary>
                <div className="mt-4 text-base leading-[1.6]" style={{ color: COLORS.muted }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 11. GUIDES DÉTAILLÉS                                         */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="w-full py-12 md:py-24 px-4 sm:px-6" style={{ backgroundColor: COLORS.surface }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <CategoryPill>Ressources gratuites</CategoryPill>
              <h2 className="text-3xl sm:text-4xl md:text-6xl mb-4" style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}>
                9 guides gratuits pour vendre en Afrique.
              </h2>
              <p className="text-base md:text-lg max-w-2xl mx-auto" style={{ color: COLORS.muted }}>
                Créer, vendre, automatiser — nos guides détaillés couvrent tout le parcours du créateur africain, de l&apos;idée à la première vente.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {/* Guide 1 */}
              <Link href="/guides/creer-son-produit" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #006e2f, #22c55e)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>package_2</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    12 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: `${COLORS.primary}10`, color: COLORS.primary }}>Débutant</span>
                    <span className="text-[10px] text-gray-400">8 étapes</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#006e2f] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Comment créer son premier produit digital
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    De l&apos;idée à la publication : identifiez votre expertise, structurez votre contenu, produisez avec un smartphone et publiez sur Novakou.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: COLORS.primary }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 2 */}
              <Link href="/guides/vendre-en-ligne" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #7c3aed, #ec4899)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    15 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#7c3aed10", color: "#7c3aed" }}>Intermédiaire</span>
                    <span className="text-[10px] text-gray-400">12 chapitres</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#7c3aed] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Comment vendre ses formations en Afrique
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    Pages de vente, tunnels, leviers psychologiques, réseaux sociaux, email marketing, affiliation. Toutes les stratégies qui marchent.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#7c3aed" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 3 */}
              <Link href="/guides/guide-complet-novakou" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #f59e0b, #ef4444)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    20 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#f59e0b10", color: "#f59e0b" }}>Complet</span>
                    <span className="text-[10px] text-gray-400">15 chapitres · 2500+ mots</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#f59e0b] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Le guide complet Novakou : de A à Z
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    De l&apos;inscription à votre première vente. Boutique, paiements, tunnels, IA, emails, affiliation, retraits. Tout est couvert.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#f59e0b" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 4 */}
              <Link href="/guides/trouver-son-idee-de-produit" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #2563eb, #06b6d4)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    10 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#2563eb10", color: "#2563eb" }}>Débutant</span>
                    <span className="text-[10px] text-gray-400">9 sections</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#2563eb] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Comment trouver son idée de produit digital
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    La méthode des 3 cercles, les niches portantes en Afrique, validation gratuite en 48h — de zéro idée à un concept validé.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#2563eb" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 5 */}
              <Link href="/guides/publicite-facebook" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #1877f2, #0ea5e9)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>campaign</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    18 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#1877f210", color: "#1877f2" }}>Avancé</span>
                    <span className="text-[10px] text-gray-400">12 chapitres</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#1877f2] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Publicité Facebook pour vendre en Afrique
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    Créer des campagnes rentables depuis 2 000 FCFA/jour. Ciblage Afrique francophone, pixel, visuels, optimisation ROAS.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#1877f2" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 6 */}
              <Link href="/guides/automatisations-novakou" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #06b6d4, #6366f1)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    12 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#06b6d410", color: "#06b6d4" }}>Intermédiaire</span>
                    <span className="text-[10px] text-gray-400">10 chapitres</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#06b6d4] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Automatisations Novakou : vendre pendant que vous dormez
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    Séquences de bienvenue, relance panier, certificats automatiques, upsell post-achat — configurez une fois, encaissez toujours.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#06b6d4" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 7 */}
              <Link href="/guides/sequences-emails" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #ec4899, #f59e0b)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    15 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#ec489910", color: "#ec4899" }}>Intermédiaire</span>
                    <span className="text-[10px] text-gray-400">12 chapitres</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#ec4899] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Séquences emails qui vendent en automatique
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    Lead magnets, séquence de bienvenue en 5 emails, relances, segmentation. 23 templates email inclus sur Novakou.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#ec4899" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 8 */}
              <Link href="/guides/description-produit" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #10b981, #06b6d4)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    10 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#10b98110", color: "#10b981" }}>Débutant</span>
                    <span className="text-[10px] text-gray-400">10 sections</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#10b981] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Rédiger une description de produit irrésistible
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    La structure AIDA, transformer vos modules en bénéfices, le titre parfait, la preuve sociale — avec 3 exemples avant/après.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#10b981" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>

              {/* Guide 9 */}
              <Link href="/guides/tunnel-de-vente-novakou" className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #7c3aed, #ec4899)` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span className="material-symbols-outlined text-white text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_tree</span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    15 min
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "#7c3aed10", color: "#7c3aed" }}>Intermédiaire</span>
                    <span className="text-[10px] text-gray-400">13 chapitres</span>
                  </div>
                  <h3 className="text-lg font-extrabold mb-2 group-hover:text-[#7c3aed] transition-colors" style={{ ...satoshi, color: COLORS.dark }}>
                    Tunnel de vente sur Novakou : guide pas-à-pas
                  </h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    Builder drag-and-drop, 30+ blocs, page de capture, page de vente, checkout Mobile Money, upsell, A/B testing.
                  </p>
                  <span className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all" style={{ color: "#7c3aed" }}>
                    Lire le guide <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>
            </div>

            {/* Lien "Voir tous les guides" */}
            <div className="mt-10 text-center">
              <Link
                href="/guides"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-base transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: COLORS.primary, color: "#fff", ...satoshi }}
              >
                Voir tous les guides
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section communauté par pays retirée — données réelles à venir */}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 13. FINAL CTA                                                */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="w-full py-14 md:py-24 px-4 sm:px-6 text-center" style={{ backgroundColor: COLORS.primary }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl md:text-7xl text-white mb-5 md:mb-6 leading-tight" style={{ ...satoshiHeading }}>
              Prêt à monétiser votre expertise ?
            </h2>
            <p className="text-base md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto leading-[1.6]" style={{ color: "#d1fae5" }}>
              Rejoignez plus de 1 000 créateurs qui vivent de leur passion en Afrique grâce à Novakou.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link
                href="/inscription?role=vendeur"
                className="w-full sm:w-auto bg-white font-bold text-lg py-4 px-8 rounded-lg hover:bg-slate-50 transition-colors"
                style={{ ...satoshi, color: COLORS.primary }}
              >
                Créer mon compte gratuitement
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
