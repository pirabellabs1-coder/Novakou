import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const OG_TITLE = "Vendre une formation en ligne en Côte d'Ivoire en 2026";
const OG_SUBTITLE = "Le guide complet : Wave, Orange Money, MTN, Moov, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  // Évite le double suffix "| Novakou | Novakou" qui dépasse la limite Google.
  title: "Vendre une formation en Côte d'Ivoire en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Côte d'Ivoire en 2026 : Wave CI, Orange Money, MTN MoMo, Moov Money, fiscalite CGA, lancement 30 jours et chiffres reels du marche abidjanais.",
  openGraph: {
    title:
      "Vendre une formation en ligne en Côte d'Ivoire en 2026 | Guide Novakou",
    description:
      "Wave Côte d'Ivoire, Orange Money, MTN MoMo, Moov Money, fiscalite CGA auto-entrepreneur, methode de lancement 30 jours : tout pour vendre ta formation digitale en CI.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-cote-divoire-2026",
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
      <span style={{ color: C.dark }}>Vendre formation Côte d&apos;Ivoire 2026</span>
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
  { id: "introduction", label: "Pourquoi vendre une formation en Côte d'Ivoire en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend vraiment a Abidjan" },
  { id: "paiements", label: "Encaisser - Wave CI, Orange Money, MTN, Moov, carte" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance en CI" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation en Côte d'Ivoire ?",
    a: "Non. En Côte d'Ivoire en 2026, un compte Wave, Orange Money, MTN MoMo ou Moov Money suffit largement pour commencer. Novakou verse directement tes gains sur ton numéro Mobile Money. Le compte bancaire devient utile a partir d'environ 1 million FCFA de chiffre d'affaires mensuel, quand tu veux ouvrir un compte pro a la SGBCI, NSIA Banque, Ecobank ou Orabank Abidjan pour structurer ta tresorerie et acceder a des services entreprises.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue en Côte d'Ivoire ?",
    a: "Le ticket median sur le marche ivoirien en 2026 se situe entre 20 000 et 45 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute privee, certificat) montent a 100 000 - 350 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 7 000 - 15 000 FCFA. La Côte d'Ivoire ayant le PIB par habitant le plus eleve de l'UEMOA, le pouvoir d'achat urbain Abidjan permet souvent des tickets plus eleves qu'a Dakar ou Bamako.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI ivoirienne ?",
    a: "Oui, des le premier FCFA encaisse. Le statut le plus simple en Côte d'Ivoire est l'entreprenant ou la micro-entreprise, gere via un CGA (Centre de Gestion Agree). Tu te declares en ligne sur le portail e-impots de la DGI, tu obtiens un IDU (Identifiant Unique) et tu paies l'Impot Synthetique. Tant que tu restes sous le seuil de 50 millions FCFA de CA annuel, tu beneficies de regimes allégés. Cet article est informatif - consulte un comptable agree pour ta situation precise.",
  },
  {
    q: "Wave, Orange Money, MTN ou Moov : lequel choisir pour encaisser ?",
    a: "Les quatre, sans hesiter. Wave domine Abidjan urbain (Cocody, Plateau, Marcory) avec des frais quasi-zero et une UX moderne. Orange Money est massif dans l'interieur (Bouake, Korhogo, Yamoussoukro) et garde une base utilisateurs enorme. MTN MoMo est très solide notamment chez les jeunes Abobo-Yopougon et la classe moyenne. Moov Money monte en puissance avec des partenariats commerciaux interessants. Novakou integre les quatre par defaut : ton acheteur choisit, tu encaisses, tu recois ton solde en fin de cycle. Refuser un de ces quatre canaux, c'est se priver de 15 a 25 pourcent du marche ivoirien.",
  },
  {
    q: "Combien de temps avant ma premiere vente ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 10 et 18 jours pour la premiere vente si tu as déjà une petite audience WhatsApp (50 - 200 contacts). Sans audience, compte 35 a 50 jours - le temps de construire 500 abonnes TikTok ou Instagram. Le marche abidjanais reagit souvent plus vite que les autres capitales UEMOA car la consommation digitale y est plus mature et le pouvoir d'achat plus eleve. Les formateurs qui vont le plus vite sont ceux qui pre-vendent avant meme d'enregistrer le contenu.",
  },
  {
    q: "Faut-il un site web pour vendre une formation en Côte d'Ivoire ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait déjà office de site : page de vente, paiement, livraison automatique, espace eleve. 80 pourcent des vendeurs ivoiriens sur Novakou ne possedent aucun site separe. Le seul cas ou un site dedie devient utile : si tu veux ranker sur Google avec du SEO de fond (blog, articles longs) ou si tu cibles des B2B grands comptes a Abidjan Plateau, mais cela vient plus tard.",
  },
  {
    q: "Puis-je vendre une formation depuis Bouake, Yamoussoukro ou San Pedro ?",
    a: "Bien sur. La vente de formation en ligne en Côte d'Ivoire n'est pas reservee a Abidjan. Avec une connexion 4G correcte (Orange, MTN, Moov), un smartphone recent et un micro-cravate a 6 000 FCFA, tu produis la meme qualité qu'a Cocody. Plusieurs formateurs Novakou bases en region (Bouake, Daloa, Korhogo) depassent 1 million FCFA mensuels - leur avantage : couts de vie plus bas, donc rentabilite superieure. Et la connexion fibre arrive desormais dans toutes les capitales regionales.",
  },
  {
    q: "Comment eviter que ma formation soit piratee et partagee gratuitement ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent (le marche ivoirien y est particulierement actif). La meilleure defense : un service inclus (coaching, replays a jour, communaute) que le pirate ne peut pas copier.",
  },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationCoteDIvoirePage() {
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
              "Vendre une formation en ligne en Côte d'Ivoire en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne en Côte d'Ivoire en 2026 : Wave CI, Orange Money, MTN MoMo, Moov Money, fiscalite CGA, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-cote-divoire-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2500,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Côte d'Ivoire" },
              { "@type": "Thing", name: "Wave Côte d'Ivoire paiement" },
              { "@type": "Thing", name: "Orange Money formation" },
              { "@type": "Thing", name: "MTN Mobile Money CI" },
              { "@type": "Thing", name: "Moov Money" },
              { "@type": "Thing", name: "Fiscalite auto-entrepreneur Côte d'Ivoire" },
              { "@type": "Thing", name: "CGA Côte d'Ivoire micro-entreprise" },
              { "@type": "Thing", name: "Abidjan formation digitale" },
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
                name: "Vendre une formation en ligne en Côte d'Ivoire en 2026",
                item: "https://novakou.com/guides/vendre-formation-cote-divoire-2026",
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
              Guide Côte d&apos;Ivoire
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
            Vendre une formation en ligne en{" "}
            <span style={{ color: C.primary }}>Côte d&apos;Ivoire</span> en
            2026 : le guide complet
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            Wave CI, Orange Money, MTN MoMo, Moov Money, fiscalite CGA,
            lancement en 30 jours sans budget. Le guide pratique base sur les
            chiffres reels du marche abidjanais et la methode des formateurs
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
                Equipe Novakou - Abidjan
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
            alt="Formateur ivoirien enregistrant son cours en ligne depuis Abidjan"
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
          Pourquoi le moment est unique en Côte d&apos;Ivoire
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La Côte d&apos;Ivoire de 2026 vit une fenetre d&apos;opportunite
          historique. Avec pres de 30 millions d&apos;habitants, un Abidjan
          metropolitain de plus de 6 millions d&apos;ames (deuxieme plus
          grande ville francophone d&apos;Afrique après Kinshasa), un PIB par
          habitant le plus eleve de l&apos;UEMOA et un taux d&apos;equipement
          smartphone qui depasse 75 pourcent dans le Grand Abidjan, le
          terrain pour <strong>vendre une formation en ligne en Côte
          d&apos;Ivoire</strong> n&apos;a jamais ete aussi favorable. La 4G
          couvre l&apos;ensemble du territoire urbain et la 5G arrive sur
          Cocody, Plateau et Marcory. Wave, Orange Money, MTN MoMo et Moov
          Money ont normalise le paiement digital quotidien.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Dans le meme temps, la generation des 18 - 35 ans cherche
          activement a se former : entrepreneuriat, programmation, marketing
          digital, design, langues etrangeres, finance Mobile Money, religion
          et developpement personnel. Les ecoles privees abidjanaises sont
          devenues onereuses (450 000 a 3 millions FCFA l&apos;annee),
          souvent decalees des realites du marche du travail, et
          n&apos;offrent ni flexibilite horaire ni accompagnement de pair.
          Ta formation en ligne, livree par Mobile Money, accessible depuis
          un smartphone, repond exactement a cette demande.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Ce guide te donne la methode integrale : choisir un sujet qui se
          vend a Abidjan et en region, encaisser via Wave Côte d&apos;Ivoire,
          gérer ta fiscalite freelance via un CGA, promouvoir sans budget
          pub, lancer en 30 jours et comprendre les revenus realistes. Tout
          est aligne sur le terrain ivoirien de 2026, pas sur des recettes
          copiees du marche français.
        </p>

        <MockupFrame title="Le marche de la formation digitale en Côte d'Ivoire en 2026">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "30M+", label: "Population ivoirienne" },
              { value: "~75 %", label: "Smartphones (urbain)" },
              { value: "6M+", label: "Population Grand Abidjan" },
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
            Estimations 2026 - sources : INS, ARTCI, GSMA Intelligence, Banque Mondiale.
          </p>
        </MockupFrame>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #1 - CHOISIR SON SUJET                             */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="sujets" number="1">
          Choisir son sujet - ce qui se vend vraiment en Côte d&apos;Ivoire
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tous les sujets ne se valent pas a Abidjan. Le marche ivoirien a
          ses préférences propres, structurees par une demographie jeune,
          une culture entrepreneuriale exceptionnellement forte (Abidjan est
          surnommee &quot;la Manhattan de l&apos;Afrique de l&apos;Ouest&quot;)
          et une diversite religieuse remarquable. Voici les six niches qui
          generent le plus de <strong>vente formation digitale
          Abidjan</strong> en 2026, classees par volume de recherche et taux
          de conversion observes sur Novakou.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Entrepreneuriat et business en ligne
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La niche n°1 en Côte d&apos;Ivoire. La culture
          &quot;debrouille&quot; ivoirienne fait que tout le monde veut
          monter son affaire. Sujets qui marchent : lancer un e-commerce
          Mobile Money, importation Chine - Abidjan, dropshipping local,
          ouvrir une boutique sur Instagram, freelance international en EUR
          / USD. Ticket eleve car le resultat est mesurable en FCFA.
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
          Abidjan est devenue un veritable hub tech d&apos;Afrique de
          l&apos;Ouest, avec des structures comme Free Hub, JOKKO, Babylab et
          de nombreux incubateurs. Demande forte : developpement web
          (HTML/CSS/JavaScript, React, Next.js), Python data, no-code (Bubble,
          Webflow), creation d&apos;applications mobiles Flutter. Le talent
          ivoirien cible aussi le freelance international en EUR / USD - le
          differentiel de change est un levier de prix enorme.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Marketing digital et e-commerce
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tout le monde veut apprendre a vendre sur Instagram, TikTok,
          WhatsApp Business. Sujets qui convertissent : publicite Facebook
          ciblee Afrique francophone, contenu Reels viral, tunnels de vente,
          copywriting pour vendeurs Abidjan, gestion de communaute pour PME
          ivoiriennes. Niche très concurrentielle mais aussi très profonde.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Design et creation visuelle
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Photoshop, Illustrator, Figma, Canva avance, motion design, UI/UX.
          La demande explose en Côte d&apos;Ivoire car les PME abidjanaises
          investissent massivement dans leur image de marque. Le design
          social media (templates Instagram, packaging produit) est
          particulierement demande. Ticket moyen : 25 000 - 75 000 FCFA.
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
          Anglais business pour expatriation Ghana / Nigeria / international,
          chinois mandarin (boom des relations Chine - CI), espagnol (visa
          et migration), arabe, allemand. La proximite frontaliere avec le
          Ghana anglophone cree une demande naturelle d&apos;anglais
          professionnel. Ticket eleve quand combine avec un objectif precis
          (TOEFL, embauche).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Religion, beaute et bien-etre
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La Côte d&apos;Ivoire est notoirement multireligieuse :
          predication chretienne (catholique et evangelique), sciences
          islamiques, developpement personnel inspire de la spiritualite
          locale. A cote, la beaute (cheveux afro, ongles, maquillage,
          peau noire), salle de sport a la maison, recettes traditionnelles
          ivoiriennes : audience massivement feminine et très engagee sur
          Instagram et TikTok.
        </p>

        <MockupFrame title="Prix moyens observes sur Novakou - Côte d'Ivoire 2026">
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
                  { type: "Entrepreneuriat / business", low: "30 000 FCFA", high: "250 000 FCFA" },
                  { type: "Programmation web", low: "40 000 FCFA", high: "350 000 FCFA" },
                  { type: "Marketing digital", low: "25 000 FCFA", high: "200 000 FCFA" },
                  { type: "Design / creation visuelle", low: "22 000 FCFA", high: "150 000 FCFA" },
                  { type: "Langues etrangeres", low: "20 000 FCFA", high: "180 000 FCFA" },
                  { type: "Religion / beaute / bien-etre", low: "12 000 FCFA", high: "75 000 FCFA" },
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
          <strong>Conseil terrain :</strong> Plus le resultat de ta
          formation est concret (decrocher un emploi a Plateau, obtenir un
          visa, gagner X FCFA par mois, perdre Y kilos), plus ton ticket
          monte haut. Les formations &quot;decouverte&quot; vagues plafonnent
          autour de 18 000 FCFA, les formations &quot;transformation
          mesurable&quot; atteignent 150 000 - 400 000 FCFA sur le marche
          ivoirien.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #2 - ENCAISSER LES PAIEMENTS                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="paiements" number="2">
          Encaisser les paiements - Wave, Orange Money, MTN, Moov, carte
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est la pierre angulaire de ton business. Si ton acheteur
          galere a payer, il abandonne. En Côte d&apos;Ivoire en 2026, le
          paiement digital est domine par cinq canaux qui doivent
          imperativement coexister sur ta page de vente.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Wave Côte d&apos;Ivoire - le n°1 a Abidjan
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Wave a explose en Côte d&apos;Ivoire depuis 2023 et domine
          aujourd&apos;hui Abidjan urbain (Cocody, Plateau, Marcory, Riviera).
          L&apos;application est gratuite, les transferts entre
          particuliers sont quasi sans frais (un changement de paradigme
          dans une region ou les commissions historiques de 3 - 5 pourcent
          etaient la norme), l&apos;expérience utilisateur est moderne. Pour
          un vendeur de formation, c&apos;est le moyen de paiement prefere
          des moins de 35 ans urbains et des CSP+. L&apos;integration{" "}
          <strong>Wave Côte d&apos;Ivoire paiement</strong> sur Novakou est
          native : ton acheteur clique sur &quot;Payer avec Wave&quot;,
          scanne le QR ou saisit son numéro, et la transaction se valide en
          quelques secondes.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Orange Money - massif a l&apos;interieur du pays
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Orange Money reste très puissant en Côte d&apos;Ivoire,
          particulierement dans l&apos;interieur (Bouake, Yamoussoukro,
          Korhogo, Daloa, San Pedro) et dans la diaspora francophone
          (France, Belgique, Canada). Les transferts internationaux entrants
          via Orange Money permettent a un cousin parisien d&apos;acheter la
          formation pour son neveu de Bouake en quelques clics. Ne neglige
          jamais <strong>Orange Money formation</strong> comme canal :
          c&apos;est jusqu&apos;a 30 pourcent des paiements selon ta niche
          et ta cible geographique.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          MTN Mobile Money CI - solide chez les jeunes
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          MTN MoMo est très ancre en Côte d&apos;Ivoire, notamment sur
          Yopougon, Abobo et chez les classes populaires-moyennes. Le
          reseau MTN est aussi très utilise dans la communaute ghaneenne
          installee en CI. Inclure <strong>MTN Mobile Money CI</strong>
          elargit naturellement ton marche a une frange importante de la
          population ivoirienne et ouvre meme sur le Cameroun, le Benin et
          le Ghana voisin (anglophone). C&apos;est en general 15 a 25
          pourcent des paiements pour un formateur ivoirien.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Moov Money - en hausse rapide
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Moov Money</strong> a connu une croissance significative
          en 2025 grace a des partenariats commerciaux agressifs (cashback,
          frais reduits sur transferts marchands). C&apos;est encore le n°4
          du marche ivoirien en parts, mais avec une base utilisateurs
          fidele particulierement sur la cote (Grand-Bassam, Assinie,
          Jacqueville) et chez les jeunes Anyama. Le couvrir est gratuit
          via Novakou et evite de perdre 5 - 10 pourcent du marche.
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
          La diaspora ivoirienne (forte en France, USA, Canada, Belgique)
          et les acheteurs en Europe utilisent leurs Visa et Mastercard.
          Pour eux, Mobile Money est une friction. La Côte d&apos;Ivoire a
          aussi un secteur bancaire en croissance, avec une classe moyenne
          qui possede de plus en plus de cartes bancaires SGBCI, NSIA, BICICI
          ou Ecobank. La carte bancaire est donc indispensable des que tu
          vises au-dela du Mobile Money. Novakou prend en charge les
          paiements carte automatiquement, sans config supplementaire.
        </p>

        <MockupFrame title="Repartition typique des paiements - formateur ivoirien 2026">
          <div className="space-y-3">
            {[
              { name: "Wave (Abidjan urbain)", pct: 36, color: C.primary },
              { name: "Orange Money (interieur + diaspora)", pct: 24, color: "#f97316" },
              { name: "MTN MoMo (Yopougon, Abobo, jeunes)", pct: 18, color: "#7c3aed" },
              { name: "Carte bancaire (CI + diaspora EU)", pct: 14, color: "#2563eb" },
              { name: "Moov Money (cote + Anyama)", pct: 8, color: "#0891b2" },
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
          <strong>Pourquoi Novakou integre les cinq sans config :</strong>{" "}
          quand tu crees ta boutique{" "}
          <Link href="/inscription" style={{ color: C.primary }}>
            sur Novakou
          </Link>
          , Wave, Orange Money, MTN MoMo, Moov Money et carte bancaire sont
          actives par defaut. Tu n&apos;ouvres aucun compte marchand, aucun
          contrat, aucune API : nous gerons les flux pour toi et te
          reversons ton solde net par cycle. Tu peux te concentrer sur ton
          contenu et ton marketing.
        </ProTip>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #3 - FISCALITE                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="fiscalite" number="3">
          Le cadre fiscal du formateur freelance en Côte d&apos;Ivoire
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vendre une formation en ligne, c&apos;est un revenu, et un
          revenu se declare. Bonne nouvelle : le cadre ivoirien a
          significativement simplifie les choses pour le freelance digital
          via le dispositif CGA (Centre de Gestion Agree) et le statut
          d&apos;entreprenant. Voici l&apos;essentiel a savoir sur la{" "}
          <strong>fiscalite auto-entrepreneur Côte d&apos;Ivoire</strong> en
          2026.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le statut d&apos;entreprenant et la micro-entreprise
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est le statut adapte pour 90 pourcent des formateurs
          digitaux qui demarrent. Le statut d&apos;entreprenant ou la
          micro-entreprise via un{" "}
          <strong>CGA Côte d&apos;Ivoire micro-entreprise</strong> beneficie
          d&apos;une declaration simplifiee, d&apos;un Impot Synthetique
          unique remplaçant l&apos;IRPP et l&apos;impot BIC, et d&apos;une
          comptabilite allegee. Inscription possible en ligne sur le portail
          e-impots DGI ou en agence (avec ta CNI ivoirienne ou ton titre de
          sejour, et un justificatif d&apos;adresse). Tu obtiens un IDU
          (Identifiant Unique) et un Registre du Commerce simplifie en
          quelques jours.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le seuil de 50 millions FCFA
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tant que ton chiffre d&apos;affaires annuel reste sous 50 millions
          FCFA (environ 76 000 EUR), tu es :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>Eligible au regime de l&apos;Impot Synthetique simplifie (en remplacement BIC + IRPP)</li>
          <li>Beneficiaire potentiel des abattements du CGA (jusqu&apos;a 30 pourcent sur le bénéfice imposable)</li>
          <li>Soumis a la TVA mais avec un regime simplifie possible si CA &lt; 200M FCFA selon la nature de l&apos;activite</li>
          <li>Dispense de tenir une comptabilite complete tant que tu es au regime de la micro-entreprise</li>
          <li>Autorise a emettre des factures simplifiees</li>
        </ul>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au-dela de 50 millions FCFA de CA, tu passes au regime du reel
          normal et tu dois t&apos;immatriculer pleinement a la TVA. A ce
          stade, un comptable inscrit a l&apos;ONECCA (Ordre National des
          Experts-Comptables et Comptables Agrees) devient indispensable.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le CGA : ton meilleur allie fiscal
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le <strong>CGA Côte d&apos;Ivoire</strong> (Centre de Gestion
          Agree) est un organisme qui accompagne les TPE et freelances dans
          leur gestion comptable et fiscale. Adherer a un CGA agree donne
          droit a des abattements significatifs sur l&apos;impot
          synthetique (jusqu&apos;a 30 pourcent du bénéfice imposable
          exonere), a l&apos;assistance pour les declarations periodiques,
          et a une securisation vis-a-vis de la DGI. Le cout annuel d&apos;un
          CGA tourne autour de 80 000 - 200 000 FCFA selon la structure,
          un investissement quasiment toujours rentable des la premiere
          annee.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          IRPP, BIC et impot synthetique - ce que tu paies vraiment
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour un formateur freelance en regime synthetique, l&apos;impot
          se calcule par tranches sur le CA ou le bénéfice. Pour donner un
          ordre d&apos;idee : un formateur qui realise 8 millions FCFA de
          CA annuel paie en general autour de 400 000 a 700 000 FCFA
          d&apos;impot total (selon ses charges deductibles et son
          abattement CGA). C&apos;est significativement moins que le regime
          classique de l&apos;IS. Reste a payer la CNPS (Caisse Nationale de
          Prevoyance Sociale) si tu y adheres volontairement - fortement
          conseille pour la protection retraite et sante.
        </p>

        <WarnBox>
          <strong>Avertissement :</strong> Cet article est purement
          informatif. La fiscalite evolue (la DGI ivoirienne met
          regulierement a jour ses bareme et regimes), ta situation
          personnelle est unique, et un mauvais choix peut couter cher.{" "}
          <strong>
            Consulte imperativement un expert-comptable agree (ONECCA Côte
            d&apos;Ivoire) ou un fiscaliste avant de finaliser ton statut.
          </strong>{" "}
          Le ticket moyen d&apos;un expert-comptable a Abidjan pour le setup
          initial : 100 000 a 300 000 FCFA. Un investissement qui se
          rentabilise des la premiere annee, surtout via les abattements
          CGA.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #4 - PROMOTION                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="promotion" number="4">
          Promouvoir ta formation - les canaux qui marchent en CI
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En Côte d&apos;Ivoire, le mix marketing pour vendre une formation
          digitale est radicalement different du marche europeen. Oublie
          les Ads Google ou la newsletter LinkedIn comme canal principal.
          La realite terrain a Abidjan en 2026 :
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          WhatsApp Business CI - le canal n°1
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En Côte d&apos;Ivoire, WhatsApp n&apos;est pas une app, c&apos;est
          l&apos;infrastructure sociale et commerciale. Tes acheteurs
          ivoiriens y passent 4 a 6 heures par jour - souvent plus qu&apos;a
          Dakar. Trois leviers :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>
            <strong>Statuts WhatsApp</strong> quotidiens : temoignages
            clients abidjanais, micro-conseils, coulisses
          </li>
          <li>
            <strong>Listes de diffusion</strong> segmentees par interet
            (jamais de groupes de spam)
          </li>
          <li>
            <strong>Groupes communautaires</strong> autour de ta niche
            (entrepreneuriat, beaute, business, dev)
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
          detaille toute la methode adaptee au marche africain francophone.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          TikTok ivoirien - l&apos;explosion 2025-2026
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          TikTok a litteralement explose en Côte d&apos;Ivoire ces deux
          dernieres annees. Les createurs ivoiriens cumulent des audiences
          continentales (Afrique francophone, diaspora) et l&apos;algorithme
          TikTok est le plus accueillant pour les debutants : ton premier
          post peut faire 50 000 vues sans abonne. Cible ton contenu sur
          des micro-niches precises (par exemple &quot;comptabilite Côte
          d&apos;Ivoire pour debutants&quot; plutot que
          &quot;comptabilite&quot;). Le guide{" "}
          <Link
            href="/guides/tiktok-reels-vendre-formations"
            style={{ color: C.primary }}
          >
            TikTok et Reels pour vendre des formations
          </Link>{" "}
          decortique la stratégie.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Instagram Reels - la classe moyenne urbaine
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour toucher les 22 - 35 ans urbains de Cocody, Riviera, Marcory,
          Instagram domine. Les Reels (videos courtes 30 - 60s) sont
          l&apos;algorithme le plus genereux en 2026 : un compte de 200
          abonnes peut faire 10 000 vues en quelques jours sur un sujet
          niche. Vise 3 a 5 Reels par semaine, ton de proximite, hashtags
          localises (#Abidjan #CoteDivoire #225 #FormatricesAfricaines).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          LinkedIn Plateau - pour les niches B2B et corporate
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Si ta formation cible des entreprises, des cadres ou des
          freelances qualifies (developpement, finance, RH, conseil,
          banque), LinkedIn est ton terrain. Le Plateau d&apos;Abidjan
          concentre une densite de cadres unique en Afrique de l&apos;Ouest
          (banques, telecoms, multinationales, NSIA, Orange, MTN, Cevital).
          Public plus reduit mais ticket moyen beaucoup plus eleve (souvent
          100 000 - 400 000 FCFA).
        </p>

        <WarnBox>
          <strong>Pourquoi pas la pub Facebook au depart :</strong> les
          encheres publicitaires Facebook Ads en Côte d&apos;Ivoire ont
          monte significativement depuis 2024 (Abidjan est un des marches
          africains les plus chers en CPM). Pour un freelance debutant sans
          tunnel de vente teste, le ROI est negatif 7 fois sur 10. Reserve
          ce canal pour une phase 2, quand tu as déjà vendu naturellement
          au moins 30 fois et compris ton message qui convertit. Le guide{" "}
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
          La methode appliquee par les formateurs Novakou qui passent de 0
          a 700 000 FCFA en un mois sur le marche ivoirien. Quatre semaines,
          quatre missions claires, zero euro de budget pub.
        </p>

        <MockupFrame title="Plan 30 jours pour vendre formation en ligne Côte d'Ivoire">
          <div className="space-y-4">
            {[
              {
                week: "Semaine 1",
                focus: "Créer le contenu",
                desc: "3h/jour : structure des modules, enregistrement video au smartphone, montage CapCut. Objectif fin de semaine : 60 % de la formation enregistree.",
              },
              {
                week: "Semaine 2",
                focus: "Pre-vente WhatsApp",
                desc: "Liste de 10 testeurs proches (amis, collegues, contacts WhatsApp Abidjan). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees en Wave / Orange Money = validation marche.",
              },
              {
                week: "Semaine 3",
                focus: "Lancement public",
                desc: "Boutique Novakou en ligne. 5 Reels Instagram + 7 statuts WhatsApp Business + 3 videos TikTok + 1 post LinkedIn. Annonce officielle a ta communaute avec offre limitee 72h.",
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
          aupres de tes 10 contacts les plus proches a Abidjan, c&apos;est
          que ton offre, ton prix ou ton message ne sont pas alignes. Mieux
          vaut ajuster maintenant que d&apos;investir 3 semaines de
          production dans le vide. Pour aller plus loin, le guide{" "}
          <Link
            href="/guides/lancement-30-jours"
            style={{ color: C.primary }}
          >
            lancement 30 jours
          </Link>{" "}
          decortique chaque jour.
        </p>

        <TipBox>
          <strong>Le moment cle :</strong> jour 21 du plan, soit dimanche
          soir / lundi matin de la semaine 3. C&apos;est ce moment precis
          que tu envoies ton message d&apos;ouverture sur tous tes canaux
          en meme temps. La synchronisation cree un effet de masse qui
          declenche les premieres ventes spontanees. Le lundi matin
          ivoirien est particulierement reactif : les acheteurs viennent
          juste de recevoir leur salaire de fin de mois et sont en mode
          &quot;investissement perso&quot;.
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
          Soyons concrets. Voici les fourchettes de revenus mensuels nets
          observees chez les formateurs Novakou bases en Côte d&apos;Ivoire
          en 2026. Pas des promesses : la moyenne du terrain abidjanais et
          regional, hors top 1 pourcent. Les tickets sont generalement plus
          eleves qu&apos;au Sénégal grace au pouvoir d&apos;achat ivoirien.
        </p>

        <MockupFrame title="Revenus mensuels par niveau - formateur ivoirien 2026">
          <div className="space-y-4">
            {[
              {
                level: "Debutant (0-6 mois)",
                range: "100 000 - 300 000 FCFA",
                desc: "1 a 6 ventes par semaine, ticket moyen 20 - 30K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp et TikTok.",
                color: "#22c55e",
              },
              {
                level: "Intermediaire (6-18 mois)",
                range: "500 000 - 1 500 000 FCFA",
                desc: "Audience Instagram / TikTok 3K - 15K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute privee).",
                color: "#2563eb",
              },
              {
                level: "Avance (1.5 ans+)",
                range: "2 000 000 - 8 000 000 FCFA+",
                desc: "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif, 1 a 2 lancements signature par an, eventuel coaching haute-prestation a Plateau / Cocody.",
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
          Cas pratique - Kouadio Daniel, 32 ans, formateur e-commerce
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Kouadio habite a Cocody Riviera 3, Abidjan. Diplome de l&apos;INPHB
          de Yamoussoukro, il a travaille 4 ans en e-commerce pour une
          enseigne abidjanaise avant de basculer formateur en janvier 2026.
          Son catalogue : une formation phare &quot;Lancer ton e-commerce
          Mobile Money en Afrique francophone&quot; a 45 000 FCFA, un ebook
          a 12 000 FCFA, une communaute WhatsApp Premium a 8 000 FCFA/mois
          avec 180 membres actifs.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En octobre 2026, son chiffre d&apos;affaires mensuel atteint
          2 100 000 FCFA. Repartition : 60 pourcent ventes de la formation
          principale, 15 pourcent ebook (souvent upsell), 25 pourcent
          abonnements communaute (recurrent). Après impot synthetique,
          adhesion CGA et commissions Novakou, il lui reste environ
          1 650 000 FCFA nets - presque 4 fois son salaire d&apos;agence
          precedent, pour 30 heures de travail hebdomadaires. Profil fictif
          mais entierement aligne sur les metriques observees a Abidjan.
        </p>

        <ProTip>
          <strong>Le secret du passage 500K → 2M FCFA :</strong>{" "}
          construire un catalogue. Une seule formation, meme excellente,
          plafonne. Ajoute un ebook d&apos;entree de gamme (10 - 15K FCFA),
          un upsell premium (coaching individuel 100 - 200K FCFA), une
          communaute privee recurrente (8 - 20K FCFA/mois). Le panier moyen
          double souvent, sans effort marketing supplementaire. Le guide{" "}
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
          Instagram et les WhatsApp de l&apos;equipe Novakou Abidjan.
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
            Pret a lancer ta boutique de formation en Côte d&apos;Ivoire ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Inscription gratuite en 3 minutes. Wave, Orange Money, MTN
            MoMo, Moov Money et carte bancaire actives par defaut. Ta
            premiere vente peut tomber des cette semaine.
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
                href: "/guides/vendre-formation-senegal-2026",
                title: "Vendre une formation au Sénégal en 2026",
                desc: "Le guide complet du marche senegalais : Wave, Orange Money, fiscalite auto-entrepreneur, lancement 30 jours.",
              },
              {
                href: "/guides/mobile-money-encaisser-paiements",
                title: "Encaisser tes paiements en Mobile Money",
                desc: "Wave, Orange Money, MTN MoMo, Moov Money : tout sur l'encaissement digital en Afrique francophone.",
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
