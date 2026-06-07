import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const OG_TITLE = "Vendre une formation en ligne au Cameroun en 2026";
const OG_SUBTITLE = "Le guide complet : MTN MoMo, Orange Money, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  // Évite le double suffix "| Novakou | Novakou" qui dépasse la limite Google.
  title: "Vendre une formation au Cameroun en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Cameroun en 2026 : MTN MoMo, Orange Money, Yango Pay, fiscalite freelance, lancement 30 jours et chiffres reels du marche de Douala et Yaounde.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Cameroun en 2026 | Guide Novakou",
    description:
      "MTN MoMo, Orange Money, Yango Pay, regime micro-fiscal, methode de lancement 30 jours : tout pour vendre ta formation digitale au Cameroun.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-cameroun-2026",
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
      <span style={{ color: C.dark }}>Vendre formation Cameroun 2026</span>
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
  { id: "introduction", label: "Pourquoi vendre une formation au Cameroun en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend vraiment" },
  { id: "paiements", label: "Encaisser - MTN MoMo, Orange Money, Yango Pay" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Cameroun ?",
    a: "Non. Au Cameroun en 2026, un compte MTN MoMo ou Orange Money suffit largement pour demarrer. Novakou verse directement tes gains sur ton numero Mobile Money. Le compte bancaire devient utile a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux ouvrir un compte pro a Afriland First Bank, UBA Cameroun, SGBC ou Ecobank pour structurer ta tresorerie et facturer en B2B.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Cameroun ?",
    a: "Le ticket median sur le marche camerounais en 2026 se situe entre 18 000 et 40 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute privee, certificat) montent a 80 000 - 250 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 6 000 - 14 000 FCFA. Atout cle a Douala et Yaounde : les formations bilingues francais-anglais peuvent etre vendues 30 a 50 pourcent plus cher car elles touchent les deux marches camerounais simultanement.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI camerounaise ?",
    a: "Oui, des le premier FCFA encaisse. Le statut le plus simple au Cameroun est le regime micro-fiscal de la DGI (Direction Generale des Impots). Tu te declares en agence DGI (ou en ligne via le portail) avec ta CNI et tu obtiens un Numero d'Identifiant Unique (NIU). Tant que tu restes sous le seuil de 10 millions FCFA de CA annuel, tu paies un impot synthetique liberatoire (taux fixe selon la tranche), tu es exonere de TVA et dispense de comptabilite reelle. Cet article est informatif - consulte un expert-comptable agree OEC Cameroun pour ta situation precise.",
  },
  {
    q: "MTN MoMo ou Orange Money, lequel choisir pour encaisser ?",
    a: "Les deux, sans hesiter. MTN MoMo domine au Cameroun avec environ 60 pourcent du marche Mobile Money (forte penetration a Douala, Bafoussam, Buea, Bamenda), Orange Money est tres present a Yaounde et dans le Centre-Sud. Novakou integre les deux par defaut : ton acheteur choisit, tu encaisses, tu recois ton solde en fin de cycle. Refuser l'un des deux, c'est se priver d'environ 35 a 45 pourcent du marche camerounais. Express Union Mobile complete utilement pour la diaspora et l'Ouest.",
  },
  {
    q: "Combien de temps avant ma premiere vente au Cameroun ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 12 et 20 jours pour la premiere vente si tu as deja une petite audience WhatsApp (50 - 200 contacts a Douala, Yaounde, Bafoussam ou la diaspora). Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Facebook ou TikTok. Les formateurs qui vont le plus vite sont ceux qui pre-vendent avant meme d'enregistrer le contenu, en s'appuyant sur leur reseau Buea/Silicon Mountain ou leur communaute professionnelle.",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Cameroun ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait deja office de site : page de vente, paiement, livraison automatique, espace eleve. 80 pourcent des vendeurs camerounais sur Novakou ne possedent aucun site separe. Le seul cas ou un site dedie devient utile : si tu veux ranker sur Google avec du SEO de fond (blog, articles longs) ou si tu vises des appels d'offres B2B avec des entreprises etablies a Douala, mais cela vient plus tard.",
  },
  {
    q: "Puis-je vendre une formation depuis Bafoussam, Bamenda, Buea ou Garoua ?",
    a: "Bien sur. La vente de formation en ligne au Cameroun n'est pas reservee a Douala et Yaounde. Avec une connexion 4G correcte (MTN, Orange ou Camtel), un smartphone recent et un micro-cravate a 6 000 FCFA, tu produis la meme qualite qu'a Bonanjo. Plusieurs formateurs Novakou bases a Buea (Silicon Mountain) et Bafoussam depassent 900 000 FCFA mensuels. Leur avantage : couts de vie plus bas, donc rentabilite superieure. Prevoir simplement un onduleur ou un power bank robuste : les coupures electriques restent un risque metier reel a integrer dans ton planning de tournage.",
  },
  {
    q: "Comment eviter que ma formation soit piratee et partagee gratuitement ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent dans la diaspora camerounaise. La meilleure defense : un service inclus (coaching, replays a jour, communaute privee Douala/Yaounde) que le pirate ne peut pas copier.",
  },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationCamerounPage() {
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
              "Vendre une formation en ligne au Cameroun en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Cameroun en 2026 : MTN MoMo, Orange Money, Yango Pay, fiscalite freelance, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-cameroun-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2500,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Cameroun" },
              { "@type": "Thing", name: "MTN MoMo Cameroun paiement" },
              { "@type": "Thing", name: "Orange Money Cameroun" },
              { "@type": "Thing", name: "Yango Pay Cameroun" },
              { "@type": "Thing", name: "Auto-entrepreneur Cameroun formation" },
              { "@type": "Thing", name: "Regime micro-fiscal Cameroun" },
              { "@type": "Thing", name: "Douala formation digitale" },
              { "@type": "Thing", name: "Yaounde tech hub" },
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
                name: "Vendre une formation en ligne au Cameroun en 2026",
                item: "https://novakou.com/guides/vendre-formation-cameroun-2026",
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
              Guide Cameroun
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              14 min de lecture
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
            <span style={{ color: C.primary }}>Cameroun</span> en 2026 : le
            guide complet
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            MTN MoMo, Orange Money, Yango Pay, fiscalite micro-fiscale,
            lancement en 30 jours sans budget. Le guide pratique base sur les
            chiffres reels du marche camerounais et la methode des formateurs
            qui dechirent a Douala, Yaounde et Buea en 2026.
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
                Equipe Novakou - Douala
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
            alt="Formateur camerounais enregistrant son cours en ligne depuis Douala"
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
          Pourquoi le moment est unique au Cameroun
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le Cameroun de 2026 vit une fenetre d&apos;opportunite rare. Avec
          plus de 28 millions d&apos;habitants, une mediane d&apos;age sous
          les 19 ans et un taux d&apos;equipement smartphone qui depasse 70
          pourcent dans les grandes villes (Douala, Yaounde, Bafoussam,
          Bamenda), le terrain pour{" "}
          <strong>vendre une formation en ligne au Cameroun</strong>{" "}
          n&apos;a jamais ete aussi favorable. La 4G couvre l&apos;essentiel
          du territoire urbain, la fibre s&apos;etend a Douala et Yaounde,
          et MTN MoMo et Orange Money ont normalise le paiement digital
          jusque dans les villages.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Dans le meme temps, la generation des 18 - 35 ans cherche
          activement a se former : entrepreneuriat, anglais business,
          design, agriculture moderne, religion, freelancing remote. Les
          ecoles classiques sont cheres (300 000 a 2 500 000 FCFA
          l&apos;annee a Douala), souvent decalees des realites du marche,
          et n&apos;offrent ni flexibilite horaire ni accompagnement de
          pair. Ta formation en ligne, livree par Mobile Money, accessible
          depuis un smartphone, repond exactement a cette demande.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Ce guide te donne la methode integrale : choisir un sujet qui se
          vend a <strong>Douala formation digitale</strong> et dans tout le
          pays, encaisser via <strong>MTN MoMo Cameroun</strong>,{" "}
          <strong>Orange Money Cameroun</strong> ou{" "}
          <strong>Yango Pay Cameroun</strong>, gerer ta fiscalite freelance
          dans le cadre du <strong>regime micro-fiscal Cameroun</strong>,
          promouvoir sans budget pub, lancer en 30 jours et comprendre les
          revenus realistes. Tout est aligne sur le terrain camerounais de
          2026, pas sur des recettes copiees du marche francais.
        </p>

        <MockupFrame title="Le marche de la formation digitale au Cameroun en 2026">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "28M+", label: "Population camerounaise" },
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
            Estimations 2026 - sources : INS Cameroun, ART, GSMA Intelligence.
          </p>
        </MockupFrame>

        <TipBox>
          <strong>Atout bilingue camerounais :</strong> le Cameroun est le
          seul pays d&apos;Afrique avec le francais ET l&apos;anglais comme
          langues officielles (80 pourcent francophones, 20 pourcent
          anglophones dans le Nord-Ouest et le Sud-Ouest). Une formation
          publiee en versions FR + EN double naturellement ton marche
          adressable, sans concurrent supplementaire significatif. Tres peu
          de formateurs exploitent ce levier en 2026 - c&apos;est un
          avantage competitif gratuit.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #1 - CHOISIR SON SUJET                             */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="sujets" number="1">
          Choisir son sujet - ce qui se vend vraiment au Cameroun
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tous les sujets ne se valent pas a Douala. Le marche camerounais
          a ses preferences propres, structurees par la demographie jeune,
          la culture entrepreneuriale du Mungo et de l&apos;Ouest, et la
          presence du <strong>Yaounde tech hub</strong> qui forme une
          nouvelle classe de talents techniques. Voici les six niches qui
          generent le plus de ventes de formations digitales en 2026,
          classees par volume de recherche et taux de conversion observes
          sur Novakou.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Entrepreneuriat et business local
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La niche n°1 au Cameroun. La culture entrepreneuriale est tres
          forte, notamment a Douala et a Bafoussam. Sujets qui marchent :
          import-export Chine-Cameroun, lancer son commerce a Mboppi,
          immobilier locatif Douala-Yaounde, e-commerce avec MTN MoMo,
          structuration d&apos;une SARL camerounaise, gestion de PME en
          zone CEMAC.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Anglais business et bilinguisme
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Specificite unique du marche camerounais : enorme demande
          francophone pour apprendre l&apos;anglais professionnel (acces a
          la zone CEMAC anglophone, freelancing international, embauche
          dans les grandes entreprises de Bonanjo). Les sujets premium :
          IELTS, TOEFL, business English pour developpeurs, anglais
          juridique pour cadres. Tickets eleves : 50 000 a 250 000 FCFA
          quand combines avec un objectif precis (visa, embauche).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Programmation et tech (Silicon Mountain)
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le Cameroun a son propre ecosysteme tech avec Silicon Mountain
          (Buea), ActivSpaces, Jangolo et Mountain Hub. La demande est
          forte pour les talents qui veulent passer freelance
          international. Sujets qui se vendent : developpement web
          (HTML/CSS/JavaScript, React), Python data, no-code (Bubble,
          Webflow), creation d&apos;applications mobiles, blockchain. Le
          talent camerounais cible aussi le freelance international en EUR
          ou USD - reel levier de prix.
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
          Logo design, identite visuelle pour PME camerounaises, motion
          design pour reseaux sociaux, retouche photo, montage video CapCut
          et Premiere Pro. Audience tres engagee, fortement portee par la
          communaute creative de Douala et Yaounde. Ticket moyen : 20 000
          a 75 000 FCFA, excellente recurrence si tu proposes des
          templates ou une communaute privee.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Agriculture moderne et agro-business
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Specificite camerounaise : l&apos;agriculture reste un pilier
          economique et la demande pour des methodes modernes explose.
          Sujets qui marchent : pisciculture, aviculture moderne,
          cacao-cafe haut de gamme, marketing produits agricoles,
          plantations bananeraies, transformation agro-alimentaire.
          Audience souvent peri-urbaine mais avec pouvoir
          d&apos;investissement reel - tickets a 35 000 - 150 000 FCFA.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Religion et developpement personnel
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Christianisme tres present (catholiques, protestants,
          evangeliques pentecotistes), avec une demande forte pour la
          predication, l&apos;enseignement biblique, le leadership
          chretien et le mariage. Audience tres loyale, faible churn.
          Communaute musulmane importante au Nord (Garoua, Maroua) avec
          besoins propres : tajwid, sciences islamiques, finance halal.
        </p>

        <MockupFrame title="Prix moyens observes sur Novakou - Cameroun 2026">
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
                  { type: "Entrepreneuriat / business", low: "25 000 FCFA", high: "180 000 FCFA" },
                  { type: "Anglais business / bilinguisme", low: "30 000 FCFA", high: "250 000 FCFA" },
                  { type: "Programmation / tech", low: "40 000 FCFA", high: "300 000 FCFA" },
                  { type: "Design / creation visuelle", low: "20 000 FCFA", high: "75 000 FCFA" },
                  { type: "Agriculture / agro-business", low: "35 000 FCFA", high: "150 000 FCFA" },
                  { type: "Religion / spiritualite", low: "9 000 FCFA", high: "50 000 FCFA" },
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
          formation est concret (decrocher un emploi a Bonanjo, obtenir
          un visa Canada, gagner X FCFA par mois, perdre Y kilos), plus
          ton ticket monte haut. Les formations &quot;decouverte&quot;
          vagues plafonnent autour de 18 000 FCFA, les formations
          &quot;transformation mesurable&quot; atteignent 120 000 - 350
          000 FCFA. Pour aller plus loin, lis le guide{" "}
          <Link
            href="/guides/trouver-son-idee-de-produit"
            style={{ color: C.primary }}
          >
            trouver son idee de produit qui se vend
          </Link>
          .
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #2 - ENCAISSER LES PAIEMENTS                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="paiements" number="2">
          Encaisser les paiements - MTN MoMo, Orange Money, Yango Pay
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est la pierre angulaire de ton business. Si ton acheteur
          galere a payer, il abandonne. Au Cameroun en 2026, le paiement
          digital est domine par quatre canaux qui doivent imperativement
          coexister sur ta page de vente.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          MTN MoMo Cameroun - le n°1
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>MTN MoMo Cameroun</strong> domine le marche avec environ
          60 pourcent des transactions Mobile Money. Tres forte penetration
          a Douala, Bafoussam, Buea, Bamenda et chez les jeunes. Pour un
          vendeur de formation, c&apos;est le moyen de paiement prefere
          des moins de 35 ans urbains. L&apos;integration MTN MoMo sur
          Novakou est native : ton acheteur clique sur &quot;Payer avec
          MTN MoMo&quot;, saisit son numero, valide via USSD ou app, et la
          transaction se confirme en quelques secondes.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Orange Money Cameroun - couverture nationale
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Orange Money Cameroun</strong> est tres present a
          Yaounde, dans le Centre, le Sud et l&apos;Est. Tres fort aussi
          aupres de la diaspora europeenne (France, Belgique, Allemagne)
          via Orange Money International qui permet a un cousin parisien
          d&apos;acheter la formation pour son neveu de Yaounde en
          quelques clics. Ne neglige jamais Orange Money comme canal -
          c&apos;est jusqu&apos;a 30 pourcent des paiements selon ta
          niche et ta region cible.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Yango Pay Cameroun - l&apos;outsider qui monte
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Yango Pay Cameroun</strong> est arrive en 2024 dans le
          sillage de Yango (VTC) et gagne du terrain chez les 20 - 30 ans
          urbains de Douala et Yaounde. Frais souvent plus bas, experience
          utilisateur tres moderne. Encore minoritaire en volume mais en
          forte croissance - inclure Yango Pay positionne ta boutique
          comme moderne et accessible a la jeunesse hyper-connectee.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Express Union Mobile et carte bancaire
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Express Union Mobile couvre une part residuelle mais utile dans
          l&apos;Ouest et le Nord-Ouest, ainsi qu&apos;aupres de la
          diaspora americaine et europeenne via les transferts. La carte
          bancaire (Visa, Mastercard) reste indispensable pour la diaspora
          camerounaise massive en France, Belgique, Allemagne et USA, qui
          souhaite acheter en EUR ou USD pour ses proches restes au pays.
          Novakou prend en charge tous ces moyens de paiement
          automatiquement, sans config supplementaire.
        </p>

        <MockupFrame title="Repartition typique des paiements - formateur camerounais 2026">
          <div className="space-y-3">
            {[
              { name: "MTN MoMo (Cameroun urbain)", pct: 48, color: "#fbbf24" },
              { name: "Orange Money (national + diaspora EU)", pct: 28, color: "#f97316" },
              { name: "Carte bancaire (diaspora EU/US)", pct: 14, color: "#2563eb" },
              { name: "Yango Pay + Express Union", pct: 10, color: C.primary },
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
          , MTN MoMo, Orange Money, Yango Pay et carte bancaire sont
          actives par defaut. Tu n&apos;ouvres aucun compte marchand,
          aucun contrat, aucune API : nous gerons les flux pour toi et te
          reversons ton solde net par cycle. Tu peux te concentrer sur
          ton contenu et ton marketing. Pour le detail de l&apos;encaissement
          digital, lis le guide{" "}
          <Link
            href="/guides/mobile-money-encaisser-paiements"
            style={{ color: C.primary }}
          >
            Mobile Money pour encaisser tes paiements
          </Link>
          .
        </ProTip>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #3 - FISCALITE                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="fiscalite" number="3">
          Le cadre fiscal du formateur freelance au Cameroun
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vendre une formation en ligne, c&apos;est un revenu, et un
          revenu se declare. Bonne nouvelle : le cadre camerounais a
          beaucoup simplifie les choses pour le freelance digital ces
          dernieres annees, notamment avec le regime micro-fiscal. Voici
          l&apos;essentiel a savoir sur la fiscalite freelance au
          Cameroun en 2026.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le statut auto-entrepreneur Cameroun et le NIU
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est le statut adapte pour 90 pourcent des formateurs
          digitaux qui demarrent. L&apos;
          <strong>auto-entrepreneur Cameroun</strong> beneficie
          d&apos;une declaration simplifiee, d&apos;un impot synthetique
          liberatoire (IL) qui remplace l&apos;IRPP et la patente, et
          d&apos;une comptabilite allegee. Inscription en agence DGI
          (Direction Generale des Impots) avec ta CNI, ton justificatif
          d&apos;adresse et l&apos;ouverture d&apos;un dossier
          contribuable. Tu obtiens un <strong>NIU</strong> (Numero
          d&apos;Identifiant Unique) en quelques jours, indispensable
          pour toute facturation B2B.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le seuil de 10 millions FCFA et le regime micro-fiscal
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tant que ton chiffre d&apos;affaires annuel reste sous 10
          millions FCFA (environ 15 200 EUR), tu releves du{" "}
          <strong>regime micro-fiscal Cameroun</strong> et tu es :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
          <li>Soumis a l&apos;impot synthetique liberatoire (IL) a taux fixe selon ta tranche de CA</li>
          <li>Dispense de tenir une comptabilite reelle complete</li>
          <li>Autorise a emettre des factures simplifiees avec ton NIU</li>
        </ul>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Entre 10 et 50 millions FCFA de CA, tu passes au regime simplifie
          (RSI), tu deviens assujetti TVA et tu dois tenir une
          comptabilite plus structuree. Au-dela de 50 millions FCFA, c&apos;est
          le regime du reel et un expert-comptable devient indispensable.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          IRPP simplifie et contribution forfaitaire
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          L&apos;impot synthetique liberatoire se calcule par tranches de
          CA. Pour donner un ordre d&apos;idee : un formateur qui realise
          5 millions FCFA de CA annuel paie en general autour de 220 000
          a 350 000 FCFA d&apos;impot total (selon ses charges
          deductibles et son secteur). C&apos;est significativement moins
          que le regime classique du reel. A ne pas oublier : la patente
          locale (mairie de Douala, Yaounde, Bafoussam...) et la CFPB
          (contribution forfaitaire) qui peuvent s&apos;ajouter selon ton
          activite et ta commune. La CNPS (securite sociale) est
          fortement conseillee en adhesion volontaire pour la couverture
          maladie et retraite.
        </p>

        <WarnBox>
          <strong>Avertissement :</strong> Cet article est purement
          informatif. La fiscalite evolue, ta situation personnelle est
          unique, et un mauvais choix peut couter cher.{" "}
          <strong>
            Consulte imperativement un expert-comptable agree par
            l&apos;Ordre National des Experts-Comptables du Cameroun
            (OEC Cameroun) ou un fiscaliste avant de finaliser ton
            statut.
          </strong>{" "}
          Le ticket moyen d&apos;un expert-comptable a Douala pour le
          setup initial : 60 000 a 180 000 FCFA. Un investissement qui
          se rentabilise des la premiere annee, surtout si tu vises le
          passage 10M de seuil.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #4 - PROMOTION                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="promotion" number="4">
          Promouvoir ta formation - les canaux qui marchent au Cameroun
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au Cameroun, le mix marketing pour vendre une formation
          digitale est radicalement different du marche europeen. Oublie
          les Ads Google ou la newsletter LinkedIn comme canal principal.
          La realite terrain en 2026 :
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          WhatsApp - le canal n°1 absolu
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au Cameroun, WhatsApp n&apos;est pas une app, c&apos;est
          l&apos;infrastructure sociale. Tes acheteurs y passent 3 a 5
          heures par jour. Trois leviers :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>
            <strong>Statuts WhatsApp</strong> quotidiens : temoignages
            clients, micro-conseils, coulisses tournage
          </li>
          <li>
            <strong>Listes de diffusion</strong> segmentees par interet
            (jamais de groupes de spam, mal vus a Douala)
          </li>
          <li>
            <strong>Groupes communautaires</strong> autour de ta niche
            (entrepreneurs Mboppi, devs Silicon Mountain, etc.)
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
          Facebook - tres fort au Cameroun
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Particularite camerounaise : Facebook reste extremement
          puissant, plus que dans d&apos;autres marches francophones.
          Les groupes Facebook entrepreneuriaux (Femmes d&apos;Affaires
          Cameroun, Business Douala, Investisseurs Yaounde...) drainent
          des audiences enormes. La publication native d&apos;un
          temoignage client genere souvent plus de ventes qu&apos;un
          Reel Instagram. Sois present sur 2 a 3 groupes pertinents avec
          du contenu de valeur (jamais de pub directe).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          TikTok - la jeunesse camerounaise s&apos;y rue
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Croissance explosive depuis 2024 chez les 16 - 28 ans.
          L&apos;algorithme TikTok est le plus accueillant pour les
          debutants : ton premier post peut faire 50 000 vues sans
          abonne. Cible ton contenu sur des micro-niches precises (par
          exemple &quot;comptabilite freelance Cameroun&quot; plutot que
          &quot;comptabilite&quot;). Hashtags qui performent :
          #Cameroun237 #Douala237 #Yaounde #SiliconMountain.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          LinkedIn - pour les niches B2B et Douala pro
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Si ta formation cible des entreprises de Bonanjo, des cadres
          ou des freelances qualifies (developpement, finance, RH,
          conseil), LinkedIn est ton terrain. Public plus reduit mais
          ticket moyen beaucoup plus eleve (souvent 80 000 - 350 000
          FCFA). Le pole tech camerounais (anciens d&apos;ActivSpaces,
          de Mountain Hub, de Jangolo) est tres actif sur LinkedIn.
        </p>

        <WarnBox>
          <strong>Pourquoi pas la pub Facebook au depart :</strong> les
          encheres publicitaires Facebook Ads au Cameroun restent moins
          cheres qu&apos;en Europe, mais pour un freelance debutant
          sans tunnel de vente teste, le ROI est negatif 7 fois sur 10.
          Reserve ce canal pour une phase 2, quand tu as deja vendu
          naturellement au moins 30 fois et compris ton message qui
          convertit. Le guide{" "}
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
          0 a 600 000 FCFA en un mois au Cameroun. Quatre semaines,
          quatre missions claires, zero euro de budget pub.
        </p>

        <MockupFrame title="Plan 30 jours pour vendre formation en ligne Cameroun">
          <div className="space-y-4">
            {[
              {
                week: "Semaine 1",
                focus: "Creer le contenu",
                desc: "3h/jour : structure des modules, enregistrement video au smartphone (prevoir power bank pour les coupures), montage CapCut. Objectif fin de semaine : 60 % de la formation enregistree.",
              },
              {
                week: "Semaine 2",
                focus: "Pre-vente WhatsApp",
                desc: "Liste de 10 testeurs proches (amis Douala/Yaounde, collegues Silicon Mountain, contacts WhatsApp). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees = validation marche.",
              },
              {
                week: "Semaine 3",
                focus: "Lancement public",
                desc: "Boutique Novakou en ligne. 5 Reels Instagram/TikTok + 7 statuts WhatsApp + 1 post LinkedIn + 1 post groupes Facebook Cameroun. Annonce officielle a ta communaute avec offre limitee 72h.",
              },
              {
                week: "Semaine 4",
                focus: "Optimiser et 2eme cohorte",
                desc: "Analyse des metriques (taux conversion, panier moyen, retours clients). Ajuste prix et page de vente. Relance pour 2eme cohorte avec temoignages de la 1ere. Envisage version EN si ta niche s'y prete.",
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
          aupres de tes 10 contacts les plus proches, c&apos;est que ton
          offre, ton prix ou ton message ne sont pas alignes. Mieux vaut
          ajuster maintenant que d&apos;investir 3 semaines de production
          dans le vide. Pour aller plus loin, le guide{" "}
          <Link
            href="/guides/lancement-30-jours"
            style={{ color: C.primary }}
          >
            lancement 30 jours
          </Link>{" "}
          decortique chaque jour.
        </p>

        <TipBox>
          <strong>Le moment cle :</strong> jour 21 du plan, soit
          dimanche soir / lundi matin de la semaine 3. C&apos;est ce
          moment precis que tu envoies ton message d&apos;ouverture sur
          tous tes canaux en meme temps (WhatsApp, Facebook, Instagram,
          TikTok, LinkedIn). La synchronisation cree un effet de masse
          qui declenche les premieres ventes spontanees, et c&apos;est
          aussi le jour ou tu lances ton hashtag de campagne pour les
          retweets entre amis.
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
          nets observees chez les formateurs Novakou bases au Cameroun
          en 2026. Pas des promesses : la moyenne du terrain, hors top
          1 pourcent.
        </p>

        <MockupFrame title="Revenus mensuels par niveau - formateur camerounais 2026">
          <div className="space-y-4">
            {[
              {
                level: "Debutant (0-6 mois)",
                range: "80 000 - 250 000 FCFA",
                desc: "1 a 6 ventes par semaine, ticket moyen 18 - 30K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp + groupes Facebook Cameroun.",
                color: "#22c55e",
              },
              {
                level: "Intermediaire (6-18 mois)",
                range: "400 000 - 1 200 000 FCFA",
                desc: "Audience Facebook/Instagram 3K - 12K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute privee), parfois version FR + EN.",
                color: "#2563eb",
              },
              {
                level: "Avance (1.5 ans+)",
                range: "1 800 000 - 6 000 000 FCFA+",
                desc: "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif, 1 a 2 lancements signature par an, marche FR+EN exploite. Vrais entrepreneurs.",
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
          Cas pratique - Mballa Christelle, 29 ans, formatrice anglais business
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Christelle habite a Bonamoussadi, Douala. Diplomee de
          l&apos;Universite de Buea (parfaitement bilingue, FR + EN),
          elle a travaille 4 ans dans une multinationale a Bonanjo avant
          de basculer formatrice en avril 2026. Son catalogue : une
          formation cle &quot;Business English pour cadres camerounais
          en 90 jours&quot; a 45 000 FCFA, une mini-formation
          &quot;Email anglais professionnel&quot; a 12 000 FCFA, une
          communaute WhatsApp Premium de coaching hebdomadaire a 7 500
          FCFA/mois.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En octobre 2026, son chiffre d&apos;affaires mensuel atteint
          1 500 000 FCFA. Repartition : 58 pourcent ventes de la
          formation principale (boostees par sa double cible FR + EN),
          22 pourcent ebook/mini-formation (souvent upsell), 20 pourcent
          abonnements communaute. Apres impot synthetique et commissions
          Novakou, il lui reste environ 1 180 000 FCFA nets - presque 3
          fois son salaire precedent, pour 25 heures de travail
          hebdomadaires. Profil fictif mais entierement aligne sur les
          metriques observees a Douala.
        </p>

        <ProTip>
          <strong>Le secret du passage 400K → 1.5M FCFA :</strong>{" "}
          construire un catalogue ET exploiter le bilinguisme. Une seule
          formation, meme excellente, plafonne. Ajoute un ebook
          d&apos;entree de gamme (10 - 14K FCFA), un upsell premium
          (coaching individuel 90 - 200K FCFA), une communaute privee
          recurrente (5 - 15K FCFA/mois), et si possible une version
          anglaise de ta formation phare pour les marches anglophones
          (Nord-Ouest, Sud-Ouest, Nigeria voisin). Le panier moyen
          double souvent, sans effort marketing supplementaire. Le
          guide{" "}
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
          Instagram, les groupes Facebook Cameroun et les WhatsApp de
          l&apos;equipe Novakou Douala.
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
            Pret a lancer ta boutique de formation au Cameroun ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Inscription gratuite en 3 minutes. MTN MoMo, Orange Money,
            Yango Pay et carte bancaire actives par defaut. Ta premiere
            vente peut tomber des cette semaine.
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
                desc: "MTN MoMo, Orange Money, Yango Pay : tout sur l'encaissement digital en Afrique francophone.",
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
