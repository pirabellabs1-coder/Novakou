import type { Metadata } from "next";
import {
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import GuidesFilteredGrid from "./_GuidesFilteredGrid";

export const metadata: Metadata = {
  title: "Guides gratuits pour créateurs africains | Novakou",
  description:
    "20 guides complets et gratuits pour créer, vendre et automatiser vos formations en ligne en Afrique francophone. De l'idée à la première vente.",
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
    href: "/guides/novakou-fonctionnalites-completes",
    gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
    icon: "auto_awesome",
    time: "13 min",
    level: "Complet",
    levelColor: "#006e2f",
    chapters: "8 sections",
    title: "Toutes les fonctionnalités de Novakou",
    desc: "Boutique, Mobile Money, tunnel de vente, automatisation, affiliation, pixels, escrow, abonnements, IA : le tour complet de la plateforme n°1 de vente de produits numériques en Afrique.",
    category: "Vendre",
  },
  {
    href: "/guides/meilleures-plateformes-vendre-produits-digitaux-afrique",
    gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
    icon: "storefront",
    time: "12 min",
    level: "Complet",
    levelColor: "#006e2f",
    chapters: "7 sections",
    title: "Meilleures plateformes pour vendre des produits digitaux en Afrique",
    desc: "Comparatif 2026 : Mobile Money, frais, tunnel, sécurité. Pourquoi Novakou est la plateforme n°1 pour vendre vos formations et produits numériques en Afrique francophone.",
    category: "Vendre",
  },
  {
    href: "/guides/top-20-produits-digitaux-rentables-2026",
    gradient: "linear-gradient(135deg, #4c1d95, #7c3aed 60%, #22c55e)",
    icon: "lightbulb",
    time: "16 min",
    level: "Débutant",
    levelColor: "#7c3aed",
    chapters: "10 sections",
    title: "Top 20 des produits digitaux rentables à lancer en 2026",
    desc: "20 idées concrètes de produits numériques à lancer en Afrique en 2026, avec fourchettes de prix en FCFA, cible et raison de vente. De l'ebook au coaching en passant par les templates et les prompts IA.",
    category: "Créer",
  },
  {
    href: "/guides/novakou-vs-systeme-io",
    gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
    icon: "compare_arrows",
    time: "15 min",
    level: "Complet",
    levelColor: "#006e2f",
    chapters: "10 sections",
    title: "Novakou vs Systeme.io : lequel choisir en Afrique ?",
    desc: "Comparatif honnête : Mobile Money, frais, tunnel, escrow, automatisation. Systeme.io excelle sur les tunnels mais n'a pas de Mobile Money natif — Novakou réunit tout pour l'Afrique.",
    category: "Vendre",
  },
  {
    href: "/guides/novakou-vs-chariow",
    gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
    icon: "compare_arrows",
    time: "15 min",
    level: "Complet",
    levelColor: "#006e2f",
    chapters: "10 sections",
    title: "Novakou vs Chariow : le comparatif pour vendre en Afrique",
    desc: "Deux plateformes africaines face à face. Chariow est solide sur le Mobile Money ; Novakou va plus loin avec tunnels avancés, escrow, automatisation, abonnements et pixels multi-plateformes.",
    category: "Vendre",
  },
  {
    href: "/guides/alternative-systeme-io-afrique",
    gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
    icon: "swap_horiz",
    time: "14 min",
    level: "Complet",
    levelColor: "#006e2f",
    chapters: "10 sections",
    title: "La meilleure alternative à Systeme.io en Afrique (Mobile Money)",
    desc: "Pourquoi Systeme.io ne suffit pas en Afrique et ce qu'il faut exiger d'une alternative : Mobile Money, gratuit pour démarrer, tunnel, escrow, automatisation. Comment migrer en 30 secondes.",
    category: "Vendre",
  },
  {
    href: "/guides/creer-produit-numerique-afrique",
    gradient: "linear-gradient(135deg, #14532d, #16a34a 60%, #84cc16)",
    icon: "rocket_launch",
    time: "16 min",
    level: "Débutant",
    levelColor: "#16a34a",
    chapters: "10 sections",
    title: "Créer son produit numérique en Afrique : le guide complet 2026",
    desc: "De l'idée à la première vente : trouver son idée, choisir le type de produit, le créer au smartphone, fixer son prix en FCFA, publier sur Novakou et vendre en Mobile Money.",
    category: "Créer",
  },
  {
    href: "/guides/importer-systeme-io",
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)",
    icon: "download",
    time: "9 min",
    level: "Débutant",
    levelColor: "#0ea5e9",
    chapters: "6 sections",
    title: "Importer son tunnel Systeme.io sur Novakou",
    desc: "Vous venez de Systeme.io ? Collez l'URL de votre tunnel : titre, texte et image sont importés automatiquement en brouillon. Migration en 30 secondes, captures à l'appui.",
    category: "Technique",
  },
  {
    href: "/guides/devenir-affilie-gagner-argent",
    gradient: "linear-gradient(135deg, #006e2f, #22c55e)",
    icon: "group",
    time: "8 min",
    level: "Débutant",
    levelColor: "#006e2f",
    chapters: "7 sections",
    title: "Devenir affilié Novakou : gagner en recommandant",
    desc: "Touchez 40 % de commission sur chaque vente générée, sans rien créer. Lien unique, où le partager, validation 14 j, retrait Mobile Money dès 5 000 FCFA.",
    category: "Gagner",
  },
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
  // ───────── 11 NOUVEAUX GUIDES (mai 2026) ─────────
  {
    href: "/guides/mobile-money-encaisser-paiements",
    gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
    icon: "payments",
    time: "10 min",
    level: "Débutant",
    levelColor: "#f59e0b",
    chapters: "8 sections",
    title: "Mobile Money : Wave, Orange, MTN, Moov — guide complet",
    desc: "Recevoir vos paiements Mobile Money en Afrique : frais réels, délais, configuration en 3 minutes sur Novakou, retraits.",
    category: "Technique",
  },
  {
    href: "/guides/fixer-prix-formation",
    gradient: "linear-gradient(135deg, #16a34a, #84cc16)",
    icon: "sell",
    time: "9 min",
    level: "Débutant",
    levelColor: "#16a34a",
    chapters: "6 sections",
    title: "Combien faire payer ma formation ? Méthode pricing complète",
    desc: "Tableaux de prix par type de contenu en FCFA. Comment éviter de sous-vendre, justifier un prix premium, prix d'ancrage et upsell.",
    category: "Vendre",
  },
  {
    href: "/guides/whatsapp-business-vendre-formations",
    gradient: "linear-gradient(135deg, #25d366, #22c55e)",
    icon: "chat",
    time: "12 min",
    level: "Débutant",
    levelColor: "#16a34a",
    chapters: "10 sections",
    title: "WhatsApp Business pour vendre vos formations en Afrique",
    desc: "Status, catalogue, listes diffusion, groupes communauté. Convertir vos contacts WhatsApp en acheteurs sans paraître spam.",
    category: "Promouvoir",
  },
  {
    href: "/guides/instagram-vendre-formations-afrique",
    gradient: "linear-gradient(135deg, #ec4899, #f97316)",
    icon: "photo_camera",
    time: "13 min",
    level: "Intermédiaire",
    levelColor: "#ec4899",
    chapters: "11 sections",
    title: "Instagram pour vendre vos formations : stratégie organique",
    desc: "Bio optimisée, Reels qui convertissent, DM stratégique, hashtags Afrique francophone. 0 budget pub, résultats en 30 jours.",
    category: "Promouvoir",
  },
  {
    href: "/guides/affiliation-recruter-affilies",
    gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    icon: "group_add",
    time: "11 min",
    level: "Intermédiaire",
    levelColor: "#8b5cf6",
    chapters: "9 sections",
    title: "Recruter des affiliés pour démultiplier vos ventes",
    desc: "Construire un programme d'affiliation rentable : commission idéale, recrutement, tracking sur Novakou, gestion des paiements.",
    category: "Vendre",
  },
  {
    href: "/guides/tiktok-reels-vendre-formations",
    gradient: "linear-gradient(135deg, #000000, #ec4899)",
    icon: "video_library",
    time: "12 min",
    level: "Intermédiaire",
    levelColor: "#ec4899",
    chapters: "9 sections",
    title: "TikTok & Reels : générer 10 000 vues par vidéo",
    desc: "Hooks qui marchent, format vertical, hashtags Afrique, transformer une vue en clic. Stratégie virale 0 budget.",
    category: "Promouvoir",
  },
  {
    href: "/guides/lancement-30-jours",
    gradient: "linear-gradient(135deg, #ef4444, #f59e0b)",
    icon: "rocket_launch",
    time: "16 min",
    level: "Intermédiaire",
    levelColor: "#ef4444",
    chapters: "12 étapes",
    title: "Lancer sa formation en 30 jours : checklist actionnable",
    desc: "Planning jour par jour de l'idée à la 1ère vente. Méthode validée par 100+ créateurs Novakou — 0 capital initial requis.",
    category: "Créer",
  },
  {
    href: "/guides/email-marketing-5-emails-vendent",
    gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
    icon: "mark_email_read",
    time: "12 min",
    level: "Intermédiaire",
    levelColor: "#0ea5e9",
    chapters: "8 sections",
    title: "Les 5 emails indispensables qui font vendre",
    desc: "Welcome, valeur, autorité, objection, dernier appel — la séquence éprouvée + 5 templates emails complets prêts à copier.",
    category: "Automatiser",
  },
  {
    href: "/guides/linkedin-personal-branding-expert",
    gradient: "linear-gradient(135deg, #0077b5, #0ea5e9)",
    icon: "person",
    time: "14 min",
    level: "Intermédiaire",
    levelColor: "#0077b5",
    chapters: "10 sections",
    title: "Personal branding LinkedIn pour expert africain",
    desc: "Profil optimisé, 3 posts par semaine qui marchent, DM commercial sans paraître spammy, convertir followers en acheteurs.",
    category: "Promouvoir",
  },
  {
    href: "/guides/vendre-diaspora-africaine",
    gradient: "linear-gradient(135deg, #14b8a6, #06b6d4)",
    icon: "public",
    time: "11 min",
    level: "Avancé",
    levelColor: "#14b8a6",
    chapters: "9 sections",
    title: "Vendre à la diaspora : encaisser en euros depuis l'Afrique",
    desc: "Activer paiement carte international, ciblage Facebook France/Belgique/Canada, communauté diaspora, prix multi-devises.",
    category: "Vendre",
  },
  {
    href: "/guides/scaler-catalogue-produits",
    gradient: "linear-gradient(135deg, #d946ef, #ec4899)",
    icon: "inventory_2",
    time: "13 min",
    level: "Avancé",
    levelColor: "#d946ef",
    chapters: "10 sections",
    title: "Passer de 1 formation à un catalogue complet (10x revenu)",
    desc: "Bundles, abonnements, formations complémentaires, ladder de prix. Multiplier le panier moyen et la lifetime value client.",
    category: "Vendre",
  },
];

const CATEGORIES = ["Tous", "Gagner", "Créer", "Vendre", "Promouvoir", "Automatiser", "Technique"];

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
            20 guides complets pour créer, vendre et automatiser vos formations en ligne depuis l&apos;Afrique francophone. Aucune inscription requise — lisez, appliquez, vendez.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.primary }}>
              <CheckCircle2 size={18} />
              20 guides
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.primary }}>
              <CheckCircle2 size={18} />
              100 % gratuits
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: COLORS.primary }}>
              <CheckCircle2 size={18} />
              Écrits pour l&apos;Afrique
            </div>
          </div>
        </div>
      </section>

      {/* Filtres + grille : déplacés dans un client component pour pouvoir
          gérer l'état actif. Le SEO content (cards, links, titres) reste
          présent dans le HTML server-rendered initial via les props. */}
      <GuidesFilteredGrid guides={GUIDES} categories={CATEGORIES} />

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
                  <ChevronDown size={20} className="flex-shrink-0 transition-transform group-open:rotate-180" />
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
