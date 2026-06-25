import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const OG_TITLE = "Vendre une formation en ligne au Togo en 2026";
const OG_SUBTITLE = "Le guide complet : T-Money, Flooz, Mixx, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  // Évite le double suffix "| Novakou | Novakou" qui dépasse la limite Google.
  title: "Vendre une formation au Togo en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Togo en 2026 : T-Money, Flooz, Mixx, fiscalite micro-entreprise, lancement 30 jours et chiffres reels du marche lomeen.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Togo en 2026 | Guide Novakou",
    description:
      "T-Money, Flooz, Mixx, fiscalite micro-entreprise Togo, methode de lancement 30 jours : tout pour vendre ta formation digitale au Togo.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-togo-2026",
  },
};

/* ─── Typographies Satoshi inline ─────────────────────────── */
const S = {
  fontFamily:
    "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;

/* ─── Palette Novakou ─────────────────────────────────────── */
const C = {
  primary: "#006e2f",
  accent: "#22c55e",
  dark: "#191c1e",
  muted: "#5c647a",
  surface: "#f6fbf2",
  surfaceLow: "#f0f5ec",
  surfaceHigh: "#e5eae1",
  white: "#ffffff",
  tipBg: "#ecfdf5",
  tipBorder: "#a7f3d0",
  warnBg: "#fffbeb",
  warnBorder: "#fde68a",
  proBg: "#eff6ff",
  proBorder: "#bfdbfe",
} as const;

/* ─── Helper components ───────────────────────────────────── */

function Breadcrumb() {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-2 text-sm mb-6"
      style={{ ...S, color: C.muted }}
    >
      <Link href="/" className="hover:underline" style={{ color: C.primary }}>
        Accueil
      </Link>
      <span>/</span>
      <Link
        href="/guides/guide-complet-novakou"
        className="hover:underline"
        style={{ color: C.primary }}
      >
        Guides
      </Link>
      <span>/</span>
      <span style={{ color: C.dark }}>Vendre formation Togo 2026</span>
    </nav>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{
        ...S,
        backgroundColor: C.tipBg,
        borderColor: C.tipBorder,
        color: C.dark,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: C.accent }}
        >
          i
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{
        ...S,
        backgroundColor: C.warnBg,
        borderColor: C.warnBorder,
        color: C.dark,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold bg-amber-500">
          !
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function ProTip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{
        ...S,
        backgroundColor: C.proBg,
        borderColor: C.proBorder,
        color: C.dark,
      }}
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white bg-blue-600">
          PRO
        </span>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function SectionHeading({
  id,
  number,
  children,
}: {
  id: string;
  number?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className="text-2xl sm:text-3xl mt-16 mb-6 scroll-mt-28"
      style={{ ...SH, color: C.dark }}
    >
      {number && (
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-full text-base mr-3 text-white"
          style={{ backgroundColor: C.primary }}
        >
          {number}
        </span>
      )}
      {children}
    </h2>
  );
}

function MockupFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden my-10 border"
      style={{ borderColor: C.surfaceHigh, backgroundColor: C.white }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ backgroundColor: C.surfaceLow, borderColor: C.surfaceHigh }}
      >
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: "#ef4444" }}
        />
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: "#f59e0b" }}
        />
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: C.accent }}
        />
        <span
          className="ml-3 text-xs font-medium"
          style={{ ...S, color: C.muted }}
        >
          {title}
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

/* ─── Table of Contents data ──────────────────────────────── */
const TOC = [
  { id: "introduction", label: "Pourquoi vendre une formation au Togo en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend a Lome et au Togo" },
  { id: "paiements", label: "Encaisser - T-Money, Flooz, Mixx, carte" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance (regime forfait)" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Togo ?",
    a: "Non. Au Togo en 2026, un compte T-Money, Flooz ou Mixx suffit largement pour demarrer. Novakou verse directement tes gains sur ton numero Mobile Money. Le compte bancaire pro (Ecobank Togo, UTB, Orabank, BTCI) devient pertinent a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux structurer ta tresorerie et acceder aux financements PME.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Togo ?",
    a: "Le ticket median sur le marche togolais en 2026 se situe entre 12 000 et 28 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute, certificat) montent a 55 000 - 160 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 4 000 - 9 000 FCFA. Le Togo etant un carrefour logistique, les formations e-commerce et import/export peuvent depasser ces fourchettes.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI togolaise ?",
    a: "Oui, des le premier FCFA encaisse. Au Togo, le statut le plus simple pour un formateur digital qui demarre est le regime du forfait pour les TPE (tres petites entreprises). Tu te declares en ligne via e-services OTR (Office Togolais des Recettes) ou en agence, tu obtiens un NIF (Numero d'Identification Fiscale), et tu paies l'AIB (Acompte sur Impot sur les Benefices) selon ton CA estime. Tant que tu restes sous le seuil de 30 millions FCFA de CA annuel, tu beneficies du regime du forfait simplifie. Cet article est informatif - consulte un expert-comptable agree par l'ONECCA-Togo pour ta situation precise.",
  },
  {
    q: "T-Money, Flooz ou Mixx, lequel privilegier pour encaisser ?",
    a: "Les trois, sans exception. T-Money (operateur Togocom, ex-Togocel) domine la couverture nationale et la base d'utilisateurs. Flooz (Moov Africa Togo) est tres fort chez les jeunes urbains et la diaspora togolaise en Cote d'Ivoire et au Benin. Mixx by Yas (anciennement Mixx, lance par Yas / ex-Moov dans certaines zones) gagne du terrain a Lome. Refuser un operateur, c'est se priver de 25 a 35 pourcent du marche togolais. Novakou integre les trois nativement.",
  },
  {
    q: "Combien de temps avant ma premiere vente ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as deja un petit reseau WhatsApp (50 - 200 contacts a Lome ou Kara). Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram, TikTok ou Facebook. Les formateurs togolais qui vont le plus vite sont ceux qui pre-vendent a leurs contacts d'Innov'Up, d'Africa Lab ou des incubateurs de Lome avant meme d'enregistrer le contenu.",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Togo ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait deja office de site : page de vente, paiement, livraison automatique, espace eleve. Environ 85 pourcent des vendeurs togolais sur Novakou ne possedent aucun site separe. Un site dedie devient utile uniquement si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard quand tu as deja un catalogue actif.",
  },
  {
    q: "Puis-je vendre une formation depuis Kara, Kpalime ou Sokode ?",
    a: "Bien sur. La vente de formation en ligne au Togo n'est pas reservee a Lome. Avec une connexion 4G correcte (Togocom ou Moov Africa Togo), un smartphone recent et un micro-cravate a 4 000 FCFA, tu produis la meme qualite qu'au Boulevard du Mono. Plusieurs formateurs Novakou bases a Kara, Atakpame ou Kpalime depassent 550 000 FCFA mensuels - leur avantage : couts de vie plus bas, donc rentabilite nette superieure.",
  },
  {
    q: "Comment proteger ma formation contre le piratage et le partage gratuit ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent surtout autour de Lome. La meilleure defense : un service inclus (coaching live, replays a jour, communaute privee) que le pirate ne peut pas copier.",
  },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationTogoPage() {
  const ogImageUrl = `https://novakou.com/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`;

  return (
    <div style={{ backgroundColor: C.surface, color: C.dark, ...S }}>
      {/* ───────────────── JSON-LD : Article ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline:
              "Vendre une formation en ligne au Togo en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Togo en 2026 : T-Money, Flooz, Mixx, fiscalite micro-entreprise, lancement 30 jours et chiffres reels.",
            author: { "@type": "Organization", name: "Novakou" },
            publisher: {
              "@type": "Organization",
              name: "Novakou",
              url: "https://novakou.com",
              logo: {
                "@type": "ImageObject",
                url: "https://novakou.com/logo.png",
              },
            },
            datePublished: "2026-06-07",
            dateModified: "2026-06-07",
            mainEntityOfPage:
              "https://novakou.com/guides/vendre-formation-togo-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Togo" },
              { "@type": "Thing", name: "T-Money Togo paiement" },
              { "@type": "Thing", name: "Flooz Togo formation" },
              { "@type": "Thing", name: "Mixx Togo" },
              { "@type": "Thing", name: "Lome formation digitale" },
              { "@type": "Thing", name: "Fiscalite micro-entreprise Togo" },
            ],
          }),
        }}
      />

      {/* ───────────────── JSON-LD : FAQPage ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />

      {/* ───────────────── JSON-LD : BreadcrumbList ───────────────── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Accueil",
                item: "https://novakou.com/",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Guides",
                item: "https://novakou.com/guides/guide-complet-novakou",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Vendre une formation en ligne au Togo en 2026",
                item: "https://novakou.com/guides/vendre-formation-togo-2026",
              },
            ],
          }),
        }}
      />

      {/* ───────────────── HERO ───────────────── */}
      <section
        className="pt-8 pb-16"
        style={{
          background: `linear-gradient(180deg, ${C.white} 0%, ${C.surface} 100%)`,
        }}
      >
        <div className="max-w-[860px] mx-auto px-6">
          <Breadcrumb />

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase"
              style={{ backgroundColor: C.surfaceHigh, color: C.primary, ...S }}
            >
              Guide Togo
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              15 min de lecture
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              Publie le 7 juin 2026
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-6"
            style={{ ...SH, color: C.dark }}
          >
            Vendre une formation en ligne au{" "}
            <span style={{ color: C.primary }}>Togo</span> en 2026 : le
            guide complet
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            T-Money, Flooz, Mixx, fiscalite micro-entreprise, lancement en
            30 jours sans budget. Le guide pratique base sur les chiffres
            reels du marche lomeen et la methode des formateurs togolais
            qui dechirent en 2026.
          </p>

          {/* Author / meta */}
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: C.primary }}
            >
              N
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.dark }}>
                Equipe Novakou - Lome
              </p>
              <p className="text-xs" style={{ color: C.muted }}>
                Guides et ressources pour les formateurs africains francophones
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── FEATURED IMAGE ───────────────── */}
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 pb-2">
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <Image
            src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80"
            alt="Formateur togolais enregistrant son cours en ligne depuis Lome"
            width={1200}
            height={500}
            className="w-full object-cover"
            style={{ maxHeight: 460 }}
            priority
          />
        </div>
      </div>

      {/* ───────────────── BODY ───────────────── */}
      <section className="max-w-[860px] mx-auto px-6 pb-32">
        {/* Table of Contents */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-16 border"
          style={{
            backgroundColor: C.white,
            borderColor: C.surfaceHigh,
          }}
        >
          <p className="text-lg font-bold mb-4" style={{ ...SH, color: C.dark }}>
            Sommaire
          </p>
          <ol className="space-y-2">
            {TOC.map((item, idx) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="flex items-start gap-3 py-1.5 text-[15px] hover:underline transition-colors"
                  style={{ color: C.primary }}
                >
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                    style={{ backgroundColor: C.accent }}
                  >
                    {idx + 1}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  INTRODUCTION                                          */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="introduction">
          Pourquoi le moment est unique au Togo
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le Togo de 2026 vit une fenetre d&apos;opportunite remarquable.
          Avec ses 9 millions d&apos;habitants (le plus petit pays de
          l&apos;UEMOA mais densement urbanise), une mediane d&apos;age
          sous les 19 ans et une agglomeration de Lome qui concentre 1,5
          million d&apos;habitants, le terrain pour{" "}
          <strong>vendre une formation en ligne au Togo</strong> n&apos;a
          jamais ete aussi favorable. La 4G de Togocom et Moov Africa
          Togo couvre l&apos;ensemble du territoire urbain, la fibre
          progresse rapidement, et T-Money, Flooz et Mixx ont normalise
          le paiement digital.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Particularite togolaise : le pays est un carrefour logistique
          regional grace au Port Autonome de Lome, premier port en eaux
          profondes de la sous-region. Cette position genere une culture
          tres forte du commerce, de l&apos;import-export et de la
          revente. Couple a une jeunesse hyperconnectee, cela cree un
          marche unique pour les formations e-commerce, Alibaba, Amazon,
          dropshipping et logistique digitale. Les ecoles classiques
          (Universite de Lome, ESGIS, ISCAM) restent cheres et souvent
          decalees du terrain - ta formation en ligne, livree par Mobile
          Money, repond a une demande precise.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Ce guide te donne la methode integrale : choisir un sujet qui
          se vend a Lome et en region, encaisser via T-Money, Flooz ou
          Mixx, gerer ta fiscalite forfait, promouvoir sans budget pub,
          lancer en 30 jours et comprendre les revenus realistes. Tout
          est aligne sur le terrain togolais de 2026, pas sur des
          recettes copiees du marche francais.
        </p>

        <MockupFrame title="Le marche de la formation digitale au Togo en 2026">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "9M+", label: "Population togolaise" },
              { value: "~70 %", label: "Smartphones (urbain)" },
              { value: "19 ans", label: "Age median" },
            ].map((stat) => (
              <div key={stat.label} className="py-4">
                <p
                  className="text-2xl sm:text-3xl font-bold mb-1"
                  style={{ ...SH, color: C.primary }}
                >
                  {stat.value}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p
            className="text-[11px] mt-3 text-center"
            style={{ color: C.muted }}
          >
            Estimations 2026 - sources : INSEED-Togo, ARCEP-Togo, GSMA
            Intelligence.
          </p>
        </MockupFrame>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #1 - CHOISIR SON SUJET                             */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="sujets" number="1">
          Choisir son sujet - ce qui se vend vraiment au Togo
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tous les sujets ne se valent pas a Lome. Le marche togolais a
          ses preferences propres, structurees par la demographie jeune,
          la culture commerciale heritee du port et l&apos;ecosysteme
          startup naissant. Voici les six niches qui generent le plus de{" "}
          <strong>vente formation digitale Lome</strong> en 2026, classees
          par volume de recherche et taux de conversion observes sur
          Novakou.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          E-commerce, import-export et Alibaba / Amazon
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Specificite togolaise n°1. Grace au Port de Lome, plaque
          tournante logistique de l&apos;Afrique de l&apos;Ouest, la
          formation a l&apos;import depuis la Chine (Alibaba, 1688), la
          revente sur les marketplaces locales, l&apos;optimisation
          douanes UEMOA et le dropshipping Amazon vers la diaspora est
          devenue une niche extremement rentable. Tickets eleves (50 -
          200K FCFA) car les apprenants generent des resultats rapides.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Marketing digital et social media
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Niche universelle, forte demande a Lome. Tout le monde veut
          apprendre a vendre sur WhatsApp Business, TikTok, Instagram et
          Facebook. Sujets gagnants : publicite Facebook ciblee Afrique
          de l&apos;Ouest, contenu Reels viral, tunnels de vente,
          copywriting pour vendeurs lomeens.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Programmation et tech
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          L&apos;ecosysteme Innov&apos;Up Togo, Africa Lab, le Coworking
          Lome et l&apos;Etrilabs ont seme une communaute dev qui grandit
          vite. Sujets qui se vendent : developpement web (React,
          Next.js), Python data, no-code (Bubble, Webflow), creation
          d&apos;applications mobiles. Le talent togolais cible aussi le
          freelance international en EUR - reel levier de prix.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Business en ligne et freelance international
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Comment lancer son business depuis zero, comment trouver des
          clients freelance, comment encaisser en devises etrangeres,
          comment structurer son entreprise individuelle togolaise. Ces
          sujets convertissent tres bien car le resultat est mesurable
          et la diaspora togolaise (France, USA, Canada) finance souvent
          la formation pour ses jeunes au pays.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Beaute, soin de soi et bien-etre
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Cheveux afro, ongles, maquillage, soins de la peau noire en
          climat humide, perte de poids, salle de sport a la maison.
          Audience massivement feminine, tres engagee sur Instagram et
          TikTok. Ticket moyen : 10 000 a 28 000 FCFA, tres bonne
          recurrence avec communautes privees.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Langues etrangeres
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Anglais business pour migration economique vers le Ghana voisin
          ou le Nigeria, mandarin (pour les commercants qui importent de
          Chine), espagnol (visa et migration), turc. La forte composante
          commerciale du Togo fait de l&apos;anglais et du mandarin des
          atouts professionnels reels. Ticket eleve quand combine avec
          un objectif precis (TOEFL, deal avec un fournisseur chinois).
        </p>

        <MockupFrame title="Prix moyens observes sur Novakou - Togo 2026">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: C.dark }}>
              <thead>
                <tr style={{ backgroundColor: C.surfaceLow }}>
                  <th className="text-left p-3 rounded-tl-lg font-semibold">
                    Niche
                  </th>
                  <th className="text-left p-3 font-semibold">Ticket median</th>
                  <th className="text-left p-3 rounded-tr-lg font-semibold">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: C.surfaceHigh }}>
                {[
                  { type: "E-commerce / import-export", low: "35 000 FCFA", high: "200 000 FCFA" },
                  { type: "Marketing digital", low: "18 000 FCFA", high: "120 000 FCFA" },
                  { type: "Programmation web", low: "30 000 FCFA", high: "180 000 FCFA" },
                  { type: "Business / freelance", low: "22 000 FCFA", high: "150 000 FCFA" },
                  { type: "Beaute / bien-etre", low: "10 000 FCFA", high: "50 000 FCFA" },
                  { type: "Langues etrangeres", low: "15 000 FCFA", high: "100 000 FCFA" },
                ].map((row) => (
                  <tr key={row.type}>
                    <td className="p-3 font-medium">{row.type}</td>
                    <td
                      className="p-3 font-semibold"
                      style={{ color: C.primary }}
                    >
                      {row.low}
                    </td>
                    <td className="p-3" style={{ color: C.muted }}>
                      {row.high}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MockupFrame>

        <TipBox>
          <strong>Conseil terrain :</strong> Au Togo, exploite a fond
          l&apos;angle &quot;carrefour logistique&quot;. Les formations
          qui montrent comment tirer parti du Port de Lome pour
          importer / revendre / exporter cassent les plafonds. Une
          formation &quot;decouverte&quot; e-commerce plafonne autour de
          15 000 FCFA, mais une formation &quot;Importer un container de
          Shenzhen a Lome et revendre&quot; atteint 100 000 - 250 000
          FCFA sans probleme.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #2 - ENCAISSER LES PAIEMENTS                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="paiements" number="2">
          Encaisser les paiements - T-Money, Flooz, Mixx, carte
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est la pierre angulaire de ton business. Si ton acheteur
          galere a payer, il abandonne. Au Togo en 2026, le paiement
          digital est domine par quatre canaux qui doivent imperativement
          coexister sur ta page de vente. Particularite : le Togo ne
          dispose ni d&apos;Orange Money ni de Wave - c&apos;est un
          paysage Mobile Money 100 pourcent local.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          T-Money - le leader togolais
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>T-Money Togo</strong> (operateur Togocom, ex-Togocel)
          domine sans partage le pays. Couverture nationale complete,
          base d&apos;utilisateurs massive, application moderne et reseau
          d&apos;agents dense jusque dans les villages. Pour un vendeur
          de formation, c&apos;est le moyen de paiement par defaut sur
          toutes les tranches d&apos;age. L&apos;integration T-Money sur
          Novakou est native : ton acheteur clique sur &quot;Payer avec
          T-Money&quot;, valide via le code USSD ou l&apos;app, et la
          transaction se finalise en quelques secondes.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Flooz Togo - challenger fort
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Flooz Togo</strong> (Moov Africa Togo) est le second
          pilier incontournable. Particulierement fort chez les jeunes
          urbains de Lome, dans la diaspora togolaise au Benin et en
          Cote d&apos;Ivoire, et pour les transferts vers les villes
          frontalieres. Ne neglige jamais ce canal : c&apos;est jusqu&apos;a
          30 pourcent des paiements selon ta niche et ton audience. Les
          formateurs qui ciblent les commercants du Grand Marche
          d&apos;Adawlato touchent souvent via Flooz.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Mixx by Yas - le nouveau acteur en montee
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Mixx Togo</strong> (anciennement deploye par
          l&apos;ex-Moov dans certaines zones, refondu sous la marque
          Yas) gagne du terrain depuis 2024 - 2025, particulierement
          chez les moins de 30 ans urbains. En 2026, l&apos;adoption
          reste plus contenue que T-Money ou Flooz mais grandit vite.
          Pour un formateur, c&apos;est un canal a integrer des le
          depart pour ne rater aucun acheteur. Novakou supporte Mixx
          nativement.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Carte bancaire internationale
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La diaspora togolaise (France, USA, Canada, Allemagne) et les
          acheteurs hors Afrique utilisent leurs Visa et Mastercard. Pour
          eux, Mobile Money est une friction. La carte bancaire est donc
          indispensable des que tu vises au-dela des frontieres
          togolaises. Novakou prend en charge les paiements carte
          automatiquement, sans config supplementaire.
        </p>

        <MockupFrame title="Repartition typique des paiements - formateur togolais 2026">
          <div className="space-y-3">
            {[
              { name: "T-Money (Togocom)", pct: 45, color: C.primary },
              { name: "Flooz (Moov Africa)", pct: 28, color: "#7c3aed" },
              { name: "Mixx by Yas", pct: 10, color: "#06b6d4" },
              { name: "Carte bancaire (diaspora EU/US)", pct: 17, color: "#2563eb" },
            ].map((p) => (
              <div key={p.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: C.dark }}>{p.name}</span>
                  <span className="font-semibold" style={{ color: p.color }}>
                    {p.pct} %
                  </span>
                </div>
                <div
                  className="h-2.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: C.surfaceLow }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${p.pct}%`,
                      backgroundColor: p.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>

        <ProTip>
          <strong>Pourquoi Novakou integre les quatre sans config :</strong>{" "}
          quand tu crees ta boutique{" "}
          <Link href="/inscription" style={{ color: C.primary }}>
            sur Novakou
          </Link>
          , T-Money, Flooz, Mixx et carte bancaire sont actives par
          defaut. Tu n&apos;ouvres aucun compte marchand, aucun contrat,
          aucune API : nous gerons les flux pour toi et te reversons ton
          solde net par cycle. Tu peux te concentrer sur ton contenu et
          ton marketing. Pour aller plus loin sur l&apos;encaissement,
          lis le guide{" "}
          <Link
            href="/guides/mobile-money-encaisser-paiements"
            style={{ color: C.primary }}
          >
            Mobile Money - encaisser tes paiements
          </Link>
          .
        </ProTip>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #3 - FISCALITE                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="fiscalite" number="3">
          Le cadre fiscal du formateur freelance au Togo
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vendre une formation en ligne, c&apos;est un revenu, et un
          revenu se declare. Bonne nouvelle : le cadre togolais a
          beaucoup simplifie les choses pour le freelance digital ces
          dernieres annees grace a la modernisation de l&apos;OTR
          (Office Togolais des Recettes). Voici l&apos;essentiel a
          savoir sur la <strong>fiscalite micro-entreprise Togo</strong>{" "}
          en 2026.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le regime du forfait pour les TPE
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est le statut adapte pour 90 pourcent des formateurs
          digitaux qui demarrent au Togo. Le regime du forfait pour les
          tres petites entreprises permet une declaration simplifiee, un
          impot synthetique unique remplaçant en grande partie
          l&apos;IRPP et la patente, et une comptabilite allegee.
          Inscription possible en ligne via le portail e-services OTR ou
          en agence (avec ta CNI et un justificatif d&apos;adresse). Tu
          obtiens un NIF (Numero d&apos;Identification Fiscale) et un
          recepisse d&apos;inscription en quelques jours.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le seuil de 30 millions FCFA
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tant que ton chiffre d&apos;affaires annuel reste sous environ
          30 millions FCFA (environ 46 000 EUR), tu es :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>Eligible au regime du forfait (declaration simplifiee)</li>
          <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
          <li>Soumis à l&apos;AIB (Acompte sur Impôt sur les Bénéfices) calculé sur ton CA</li>
          <li>Dispense de tenir une comptabilite complete (registre simplifie)</li>
          <li>Autorise a emettre des factures simplifiees</li>
        </ul>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au-dela de 30 millions FCFA, tu passes au regime du reel
          simplifie ou du reel normal et tu dois t&apos;immatriculer a la
          TVA. A ce stade, un comptable agree devient indispensable.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          AIB et impot synthetique - ce que tu paies vraiment
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          L&apos;AIB se calcule selon des taux progressifs en fonction
          du CA declare. Pour donner un ordre d&apos;idee : un formateur
          qui realise 5 millions FCFA de CA annuel paie en general autour
          de 200 000 a 350 000 FCFA d&apos;impot total annuel (selon ses
          charges deductibles et activites). C&apos;est nettement moins
          que le regime classique de l&apos;IS. Reste a envisager une
          CNSS volontaire pour la protection sociale - fortement
          conseille pour la retraite et la maladie.
        </p>

        <WarnBox>
          <strong>Avertissement :</strong> Cet article est purement
          informatif. La fiscalite evolue, ta situation personnelle est
          unique, et un mauvais choix peut couter cher.{" "}
          <strong>
            Consulte imperativement un expert-comptable agree par
            l&apos;ONECCA-Togo (Ordre National des Experts-Comptables et
            Comptables Agrees du Togo) ou un fiscaliste avant de
            finaliser ton statut.
          </strong>{" "}
          Le ticket moyen d&apos;un comptable a Lome pour le setup
          initial : 40 000 a 130 000 FCFA. Un investissement qui se
          rentabilise des la premiere annee.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #4 - PROMOTION                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="promotion" number="4">
          Promouvoir ta formation - les canaux qui marchent au Togo
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au Togo, le mix marketing pour vendre une formation digitale
          est specifique. Oublie les Ads Google ou la newsletter LinkedIn
          comme canal principal. La realite terrain en 2026 :
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          WhatsApp Business - le canal n°1
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au Togo, WhatsApp n&apos;est pas une app, c&apos;est
          l&apos;infrastructure sociale. Tes acheteurs y passent 3 a 5
          heures par jour. Trois leviers :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>
            <strong>Statuts WhatsApp</strong> quotidiens : temoignages
            clients, micro-conseils, coulisses
          </li>
          <li>
            <strong>Listes de diffusion</strong> segmentees par interet
            (jamais de groupes de spam)
          </li>
          <li>
            <strong>Groupes communautaires</strong> autour de ta niche
            (e-commerce, beaute, business)
          </li>
        </ul>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le guide{" "}
          <Link
            href="/guides/whatsapp-business-vendre-formations"
            style={{ color: C.primary }}
          >
            WhatsApp Business pour vendre des formations
          </Link>{" "}
          detaille toute la methode.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Facebook - tres dominant au Togo
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Particularite togolaise : Facebook reste extremement utilise,
          notamment via les groupes locaux puissants (Lome Buzz, Togo
          Business Network, Adawlato Commercants, 228 Tech). Lives
          commentes en ewe et mina, communautes thematiques actives.
          C&apos;est un canal a ne pas sous-estimer, surtout pour
          toucher au-dela des 25 ans et la classe commercante.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          TikTok et Instagram Reels - la generation Z
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour toucher les 16 - 28 ans urbains, TikTok explose au Togo
          depuis 2024. Sous-utilise par les vendeurs locaux, donc enorme
          opportunite. L&apos;algorithme TikTok est genereux pour les
          comptes debutants. Cible ton contenu sur des micro-niches
          precises (par exemple &quot;importer de Chine vers Lome pour
          debutants&quot; plutot que &quot;import-export&quot;).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Hubs et incubateurs locaux
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Si ta formation cible des techs, devs, entrepreneurs digitaux,
          les hubs sont incontournables : Innov&apos;Up Togo, Africa Lab,
          Etrilabs, Coworking Lome. Y intervenir comme conferencier
          benevole genere des dizaines de prospects qualifies. Le bouche
          a oreille est extremement puissant a Lome ou tout le monde se
          connait dans le milieu digital.
        </p>

        <WarnBox>
          <strong>Pourquoi pas la pub Facebook au depart :</strong> les
          encheres publicitaires Facebook Ads sur le Togo ont monte en
          2024 - 2025. Pour un freelance debutant sans tunnel de vente
          teste, le ROI est negatif 7 fois sur 10. Reserve ce canal pour
          une phase 2, quand tu as deja vendu naturellement au moins 30
          fois et compris ton message qui convertit. Le guide{" "}
          <Link
            href="/guides/publicite-facebook"
            style={{ color: C.primary }}
          >
            publicite Facebook pour formations
          </Link>{" "}
          explique quand et comment basculer.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #5 - LANCEMENT 30 JOURS                            */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="lancement" number="5">
          Lancer en 30 jours sans budget - la methode Novakou
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La methode appliquee par les formateurs Novakou qui passent de
          0 a 400 000 FCFA en un mois au Togo. Quatre semaines, quatre
          missions claires, zero euro de budget pub.
        </p>

        <MockupFrame title="Plan 30 jours pour vendre formation en ligne Togo">
          <div className="space-y-4">
            {[
              {
                week: "Semaine 1",
                focus: "Creer le contenu",
                desc: "3h/jour : structure des modules, enregistrement video au smartphone, montage CapCut. Objectif fin de semaine : 60 % de la formation enregistree.",
              },
              {
                week: "Semaine 2",
                focus: "Pre-vente WhatsApp",
                desc: "Liste de 10 testeurs proches (amis, collegues Lome ou Kara, contacts Innov'Up). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees = validation marche.",
              },
              {
                week: "Semaine 3",
                focus: "Lancement public",
                desc: "Boutique Novakou en ligne. 5 Reels Instagram + 7 statuts WhatsApp + 3 posts Facebook + 1 live communautaire. Annonce officielle a ta communaute avec offre limitee 72h.",
              },
              {
                week: "Semaine 4",
                focus: "Optimiser et 2eme cohorte",
                desc: "Analyse des metriques (taux conversion, panier moyen, retours clients). Ajuste prix et page de vente. Relance pour 2eme cohorte avec temoignages de la 1ere.",
              },
            ].map((w) => (
              <div
                key={w.week}
                className="flex items-start gap-4 p-4 rounded-xl border"
                style={{ borderColor: C.surfaceHigh }}
              >
                <span
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ backgroundColor: C.primary }}
                >
                  {w.week}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-sm mb-1"
                    style={{ color: C.dark }}
                  >
                    {w.focus}
                  </p>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: C.muted }}
                  >
                    {w.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La cle, c&apos;est la semaine 2 : la pre-vente WhatsApp. Si tu
          n&apos;arrives pas a obtenir 5 pre-ventes a tarif preferentiel
          aupres de tes 10 contacts les plus proches a Lome, c&apos;est
          que ton offre, ton prix ou ton message ne sont pas alignes.
          Mieux vaut ajuster maintenant que d&apos;investir 3 semaines
          de production dans le vide. Pour aller plus loin, le guide{" "}
          <Link
            href="/guides/lancement-30-jours"
            style={{ color: C.primary }}
          >
            lancement 30 jours
          </Link>{" "}
          decortique chaque jour.
        </p>

        <TipBox>
          <strong>Le moment cle au Togo :</strong> jour 21 du plan, soit
          dimanche soir / lundi matin de la semaine 3. C&apos;est ce
          moment precis que tu envoies ton message d&apos;ouverture sur
          tous tes canaux en meme temps. A Lome, beaucoup d&apos;acheteurs
          regardent leur telephone le dimanche soir entre la sortie du
          temple ou de la messe et le repas familial - timing optimal
          pour creer l&apos;effet de masse.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #6 - REVENUS                                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="revenus" number="6">
          Combien on peut gagner ? (chiffres reels)
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Soyons concrets. Voici les fourchettes de revenus mensuels
          nets observees chez les formateurs Novakou bases au Togo en
          2026. Pas des promesses : la moyenne du terrain, hors top 1
          pourcent.
        </p>

        <MockupFrame title="Revenus mensuels par niveau - formateur togolais 2026">
          <div className="space-y-4">
            {[
              {
                level: "Debutant (0-6 mois)",
                range: "40 000 - 130 000 FCFA",
                desc: "1 a 4 ventes par semaine, ticket moyen 12 - 20K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp et Facebook groupes.",
                color: "#22c55e",
              },
              {
                level: "Intermediaire (6-18 mois)",
                range: "220 000 - 600 000 FCFA",
                desc: "Audience Instagram/TikTok 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute privee WhatsApp).",
                color: "#2563eb",
              },
              {
                level: "Avance (1.5 ans+)",
                range: "900 000 - 3 000 000 FCFA+",
                desc: "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif (relais a Kara, Atakpame, Sokode), 1 a 2 lancements signature par an.",
                color: "#7c3aed",
              },
            ].map((lvl) => (
              <div
                key={lvl.level}
                className="p-4 rounded-xl border"
                style={{ borderColor: C.surfaceHigh }}
              >
                <div className="flex items-center justify-between mb-2 gap-3">
                  <span
                    className="font-bold text-sm"
                    style={{ color: C.dark }}
                  >
                    {lvl.level}
                  </span>
                  <span
                    className="font-bold text-sm"
                    style={{ color: lvl.color }}
                  >
                    {lvl.range}
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: C.muted }}
                >
                  {lvl.desc}
                </p>
              </div>
            ))}
          </div>
        </MockupFrame>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Cas pratique - Agbenye Koffi, 28 ans, formateur e-commerce Alibaba / Amazon
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Koffi habite au quartier Tokoin Hospital, Lome. Diplome de
          l&apos;Universite de Lome en commerce international, il a
          travaille 4 ans comme transitaire au Port autonome avant de
          basculer formateur en mars 2026. Son catalogue : une formation
          cle &quot;Importer de Chine vers Lome et revendre en 30
          jours&quot; a 45 000 FCFA, un ebook checklist douaniere a
          9 000 FCFA, une communaute WhatsApp Premium &quot;Importateurs
          Togo&quot; a 6 000 FCFA/mois.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En octobre 2026, son chiffre d&apos;affaires mensuel atteint
          870 000 FCFA. Repartition : 62 pourcent ventes de la formation
          principale, 13 pourcent ebook (souvent upsell), 25 pourcent
          abonnements communaute. Apres impot forfait et commissions
          Novakou, il lui reste environ 680 000 FCFA nets - presque 3,5
          fois son salaire de transitaire precedent, pour 25 heures de
          travail hebdomadaires. Profil fictif mais entierement aligne
          sur les metriques observees a Lome.
        </p>

        <ProTip>
          <strong>Le secret du passage 220K → 900K FCFA au Togo :</strong>{" "}
          exploiter le positionnement commercial unique du pays.
          Construire un catalogue ET adresser la niche import/export qui
          plafonne 2 a 3 fois plus haut. Une seule formation, meme
          excellente, plafonne. Ajoute un ebook d&apos;entree de gamme
          (7 - 10K FCFA), un upsell premium (coaching individuel sur un
          deal Alibaba reel, 80 - 180K FCFA), une communaute privee
          recurrente (5 - 12K FCFA/mois). Le guide{" "}
          <Link
            href="/guides/scaler-catalogue-produits"
            style={{ color: C.primary }}
          >
            scaler ton catalogue de produits
          </Link>{" "}
          explique la sequence exacte.
        </ProTip>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #7 - FAQ                                           */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="faq" number="7">
          FAQ - les questions qu&apos;on me pose tout le temps
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Les huit questions qui reviennent en boucle dans les DMs
          Instagram, les Facebook Messenger et les WhatsApp de l&apos;
          equipe Novakou Lome.
        </p>

        <div className="space-y-4 mb-10">
          {FAQ_ITEMS.map((item, idx) => (
            <details
              key={idx}
              className="rounded-xl border overflow-hidden"
              style={{
                backgroundColor: C.white,
                borderColor: C.surfaceHigh,
              }}
            >
              <summary
                className="cursor-pointer px-5 py-4 font-semibold text-[15px] list-none flex items-start gap-3"
                style={{ color: C.dark }}
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                  style={{ backgroundColor: C.primary }}
                >
                  {idx + 1}
                </span>
                <span className="flex-1">{item.q}</span>
              </summary>
              <div
                className="px-5 pb-5 pt-1 text-[15px] leading-relaxed pl-14"
                style={{ color: C.muted }}
              >
                {item.a}
              </div>
            </details>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  CTA FINAL                                              */}
        {/* ════════════════════════════════════════════════════════ */}
        <div
          className="rounded-2xl p-8 sm:p-12 text-center mt-16"
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, #004d21 100%)`,
          }}
        >
          <p className="text-2xl sm:text-3xl text-white mb-4" style={SH}>
            Pret a lancer ta boutique de formation au Togo ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Inscription gratuite en 3 minutes. T-Money, Flooz, Mixx et
            carte bancaire actives par defaut. Ta premiere vente peut
            tomber des cette semaine.
          </p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-transform hover:scale-[1.03]"
            style={{
              ...S,
              backgroundColor: C.white,
              color: C.primary,
            }}
          >
            Lancer ma boutique Novakou en 3 minutes
            <span aria-hidden="true" className="text-lg">
              &rarr;
            </span>
          </Link>
          <p
            className="text-sm mt-4"
            style={{ ...S, color: "rgba(255,255,255,0.6)" }}
          >
            0 abonnement - paiements Mobile Money inclus - 0 frais cache.
          </p>
        </div>

        {/* Related guides */}
        <div className="mt-20">
          <p className="text-lg font-bold mb-6" style={{ ...SH, color: C.dark }}>
            Guides complementaires
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                href: "/guides/mobile-money-encaisser-paiements",
                title: "Encaisser tes paiements en Mobile Money",
                desc: "T-Money, Flooz, Mixx, MTN MoMo : tout sur l'encaissement digital en Afrique francophone.",
              },
              {
                href: "/guides/fixer-prix-formation",
                title: "Comment fixer le prix de ta formation",
                desc: "La methode complete de pricing adaptee au marche africain en FCFA.",
              },
              {
                href: "/guides/lancement-30-jours",
                title: "Plan de lancement en 30 jours",
                desc: "Le calendrier exact jour par jour pour aller du zero a la premiere cohorte.",
              },
              {
                href: "/explorer",
                title: "Explorer les formations Novakou",
                desc: "Inspire-toi des meilleures formations vendues sur la plateforme en Afrique francophone.",
              },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="block p-5 rounded-xl border transition-shadow hover:shadow-md"
                style={{
                  backgroundColor: C.white,
                  borderColor: C.surfaceHigh,
                }}
              >
                <p className="text-sm font-bold mb-1" style={{ color: C.dark }}>
                  {guide.title}
                </p>
                <p className="text-sm" style={{ color: C.muted }}>
                  {guide.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
