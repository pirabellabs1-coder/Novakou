import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides gratuits pour créateurs africains | Novakou",
  description:
    "9 guides complets et gratuits pour créer, vendre et automatiser vos formations en ligne en Afrique francophone. De l'idée à la première vente.",
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
} as const;

/* ─── Helpers ─────────────────────────────────────────────── */
function CategoryPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase mb-4"
      style={{ ...satoshi, backgroundColor: "#e5eae1", color: COLORS.dark }}
    >
      {children}
    </span>
  );
}

/* ─── Données des guides ──────────────────────────────────── */
const GUIDES = [
  {
    href: "/guides/creer-son-produit",
    gradient: "linear-gradient(135deg, #006e2f, #22c55e)",
    icon: "package_2",
    time: "12 min",
    level: "Débutant",
    levelColor: "#006e2f",
    chapters: "8 étapes",
    title: "Comment créer son premier produit digital",
    desc: "De l'idée à la publication : identifiez votre expertise, structurez votre contenu, produisez avec un smartphone et publiez sur Novakou.",
    category: "Créer",
  },
  {
    href: "/guides/vendre-en-ligne",
    gradient: "linear-gradient(135deg, #7c3aed, #ec4899)",
    icon: "trending_up",
    time: "15 min",
    level: "Intermédiaire",
    levelColor: "#7c3aed",
    chapters: "12 chapitres",
    title: "Comment vendre ses formations en Afrique",
    desc: "Pages de vente, tunnels, leviers psychologiques, réseaux sociaux, email marketing, affiliation. Toutes les stratégies qui marchent.",
    category: "Vendre",
  },
  {
    href: "/guides/guide-complet-novakou",
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
    icon: "menu_book",
    time: "20 min",
    level: "Complet",
    levelColor: "#f59e0b",
    chapters: "15 chapitres · 2500+ mots",
    title: "Le guide complet Novakou : de A à Z",
    desc: "De l'inscription à votre première vente. Boutique, paiements, tunnels, IA, emails, affiliation, retraits. Tout est couvert.",
    category: "Technique",
  },
  {
    href: "/guides/trouver-son-idee-de-produit",
    gradient: "linear-gradient(135deg, #2563eb, #06b6d4)",
    icon: "lightbulb",
    time: "10 min",
    level: "Débutant",
    levelColor: "#2563eb",
    chapters: "9 sections",
    title: "Comment trouver son idée de produit digital",
    desc: "La méthode des 3 cercles, les niches portantes en Afrique, validation gratuite en 48h — de zéro idée à un concept validé.",
    category: "Créer",
  },
  {
    href: "/guides/publicite-facebook",
    gradient: "linear-gradient(135deg, #1877f2, #0ea5e9)",
    icon: "campaign",
    time: "18 min",
    level: "Avancé",
    levelColor: "#1877f2",
    chapters: "12 chapitres",
    title: "Publicité Facebook pour vendre en Afrique",
    desc: "Créer des campagnes rentables depuis 2 000 FCFA/jour. Ciblage Afrique francophone, pixel, visuels, optimisation ROAS.",
    category: "Promouvoir",
  },
  {
    href: "/guides/automatisations-novakou",
    gradient: "linear-gradient(135deg, #06b6d4, #6366f1)",
    icon: "bolt",
    time: "12 min",
    level: "Intermédiaire",
    levelColor: "#06b6d4",
    chapters: "10 chapitres",
    title: "Automatisations Novakou : vendre pendant que vous dormez",
    desc: "Séquences de bienvenue, relance panier, certificats automatiques, upsell post-achat — configurez une fois, encaissez toujours.",
    category: "Automatiser",
  },
  {
    href: "/guides/sequences-emails",
    gradient: "linear-gradient(135deg, #ec4899, #f59e0b)",
    icon: "mail",
    time: "15 min",
    level: "Intermédiaire",
    levelColor: "#ec4899",
    chapters: "12 chapitres",
    title: "Séquences emails qui vendent en automatique",
    desc: "Lead magnets, séquence de bienvenue en 5 emails, relances, segmentation. 23 templates email inclus sur Novakou.",
    category: "Automatiser",
  },
  {
    href: "/guides/description-produit",
    gradient: "linear-gradient(135deg, #10b981, #06b6d4)",
    icon: "edit_note",
    time: "10 min",
    level: "Débutant",
    levelColor: "#10b981",
    chapters: "10 sections",
    title: "Rédiger une description de produit irrésistible",
    desc: "La structure AIDA, transformer vos modules en bénéfices, le titre parfait, la preuve sociale — avec 3 exemples avant/après.",
    category: "Vendre",
  },
  {
    href: "/guides/tunnel-de-vente-novakou",
    gradient: "linear-gradient(135deg, #7c3aed, #ec4899)",
    icon: "account_tree",
    time: "15 min",
    level: "Intermédiaire",
    levelColor: "#7c3aed",
    chapters: "13 chapitres",
    title: "Tunnel de vente sur Novakou : guide pas-à-pas",
    desc: "Builder drag-and-drop, 30+ blocs, page de capture, page de vente, checkout Mobile Money, upsell, A/B testing.",
    category: "Technique",
  },
];

const CATEGORIES = ["Tous", "Créer", "Vendre", "Promouvoir", "Automatiser", "Technique"];

const FAQ = [
  {
    q: "Les guides sont-ils vraiment gratuits ?",
    a: "Oui, tous les guides Novakou sont 100 % gratuits et accessibles sans inscription. Ils sont rédigés par notre équipe et mis à jour régulièrement pour rester pertinents.",
  },
  {
    q: "Faut-il être déjà inscrit sur Novakou pour en profiter ?",
    a: "Non. Vous pouvez lire tous les guides sans compte. Pour appliquer les techniques directement sur votre boutique, créez un compte gratuitement en 3 minutes.",
  },
  {
    q: "Par quel guide commencer quand on est débutant ?",
    a: "Commencez par « Comment trouver son idée de produit digital » puis enchaînez avec « Comment créer son premier produit digital ». Ces deux guides en moins de 25 minutes vous donnent une base solide.",
  },
  {
    q: "Les stratégies fonctionnent-elles vraiment en Afrique ?",
    a: "Tous nos guides sont écrits spécifiquement pour le contexte africain : paiement Mobile Money, audiences Facebook francophones, niches porteuses au Sénégal, en Côte d'Ivoire, au Cameroun, etc.",
  },
  {
    q: "Comment être prévenu des nouveaux guides ?",
    a: "Inscrivez-vous sur Novakou (gratuit) et activez les notifications. Chaque nouveau guide vous est envoyé par email dès sa publication.",
  },
];

export default function GuidesIndexPage() {
  return (
    <div className="min-h-screen bg-white" style={satoshi}>
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="w-full pt-16 pb-12 md:pt-24 md:pb-16 px-4 sm:px-6 text-center" style={{ backgroundColor: COLORS.surface }}>
        <div className="max-w-3xl mx-auto">
          <CategoryPill>Ressources gratuites</CategoryPill>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl mb-5"
            style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.05 }}
          >
            Tous nos guides gratuits
          </h1>
          <p className="text-base md:text-lg mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: COLORS.muted }}>
            9 guides complets pour créer, vendre et automatiser vos formations en ligne depuis l&apos;Afrique francophone. Aucune inscription requise — lisez, appliquez, vendez.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.primary }}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              9 guides
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.primary }}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              100 % gratuits
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.primary }}>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Écrits pour l&apos;Afrique
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTRES PAR CATÉGORIE ───────────────────────────────── */}
      <section className="w-full py-6 px-4 sm:px-6 border-b border-gray-100 sticky top-0 z-10 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="px-4 py-2 rounded-full text-sm font-bold cursor-pointer transition-all hover:shadow-sm"
              style={
                cat === "Tous"
                  ? { backgroundColor: COLORS.primary, color: "#fff" }
                  : { backgroundColor: "#f3f4f6", color: COLORS.dark }
              }
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* ── GRILLE DES GUIDES ───────────────────────────────────── */}
      <section className="w-full py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Bannière */}
                <div className="h-48 relative overflow-hidden" style={{ background: guide.gradient }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5">
                      <span
                        className="material-symbols-outlined text-white text-[48px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {guide.icon}
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    {guide.time}
                  </div>
                  {/* Badge catégorie */}
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
                    {guide.category}
                  </div>
                </div>

                {/* Corps */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ backgroundColor: `${guide.levelColor}10`, color: guide.levelColor }}
                    >
                      {guide.level}
                    </span>
                    <span className="text-[10px] text-gray-400">{guide.chapters}</span>
                  </div>
                  <h2
                    className="text-lg font-extrabold mb-2 transition-colors"
                    style={{ ...satoshi, color: COLORS.dark }}
                  >
                    {guide.title}
                  </h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: COLORS.muted }}>
                    {guide.desc}
                  </p>
                  <span
                    className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ color: guide.levelColor }}
                  >
                    Lire le guide{" "}
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section className="w-full py-12 md:py-20 px-4 sm:px-6" style={{ backgroundColor: COLORS.surface }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <CategoryPill>Questions fréquentes</CategoryPill>
            <h2
              className="text-3xl sm:text-4xl mb-4"
              style={{ ...satoshiHeading, color: COLORS.dark, lineHeight: 1.1 }}
            >
              Tout ce que vous voulez savoir sur nos guides
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {FAQ.map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer list-none gap-3">
                  <span className="font-bold text-base" style={{ color: COLORS.dark }}>
                    {item.q}
                  </span>
                  <span
                    className="material-symbols-outlined text-[20px] flex-shrink-0 transition-transform group-open:rotate-180"
                    style={{ color: COLORS.primary }}
                  >
                    expand_more
                  </span>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.muted }}>
                    {item.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────── */}
      <section
        className="w-full py-14 md:py-24 px-4 sm:px-6 text-center"
        style={{ backgroundColor: COLORS.primary }}
      >
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-4xl sm:text-5xl md:text-6xl text-white mb-5 leading-tight"
            style={{ ...satoshiHeading }}
          >
            Prêt à commencer ?
          </h2>
          <p className="text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: "#d1fae5" }}>
            Créez votre boutique Novakou gratuitement et mettez en pratique ces guides dès aujourd&apos;hui. Zéro abonnement, 10 % seulement sur vos ventes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/inscription?role=vendeur"
              className="w-full sm:w-auto bg-white font-bold text-lg py-4 px-8 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ ...satoshi, color: COLORS.primary }}
            >
              Créer mon compte gratuitement
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto border-2 border-white/40 text-white font-bold text-lg py-4 px-8 rounded-xl hover:bg-white/10 transition-colors"
              style={{ ...satoshi }}
            >
              Découvrir Novakou
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
