import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const OG_TITLE = "Vendre une formation en ligne au Benin en 2026";
const OG_SUBTITLE = "Le guide complet : MTN MoMo, Moov Money, Celtiis Cash, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  title: "Vendre une formation au Bénin en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Benin en 2026 : MTN MoMo, Moov Money, Celtiis Cash, fiscalite micro-entreprise, lancement 30 jours et chiffres reels du marche cotonois.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Benin en 2026 | Guide Novakou",
    description:
      "MTN MoMo, Moov Money, Celtiis Cash, fiscalite auto-entrepreneur, methode 30 jours : tout pour vendre ta formation digitale au Benin.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-benin-2026",
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
      <span style={{ color: C.dark }}>Vendre formation Benin 2026</span>
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
  { id: "introduction", label: "Pourquoi vendre une formation au Benin en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend vraiment" },
  { id: "paiements", label: "Encaisser - MTN MoMo, Moov Money, Celtiis Cash" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Benin ?",
    a: "Non. Au Benin en 2026, un compte MTN MoMo, Moov Money ou Celtiis Cash suffit largement pour commencer. Novakou verse directement tes gains sur ton numéro Mobile Money beninois. Le compte bancaire devient utile a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux ouvrir un compte pro a Bank of Africa, Ecobank Benin, NSIA Banque ou BSIC pour structurer ta tresorerie.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Benin ?",
    a: "Le ticket median sur le marche beninois en 2026 se situe entre 12 000 et 30 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute privee, certificat) montent a 60 000 - 180 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 4 500 - 10 000 FCFA. Plus le resultat est concret (decrocher un emploi, monter son business, obtenir un visa), plus tu peux monter en prix - la diaspora beninoise en France paie sans hesiter 75 000 FCFA pour une formation transformante.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI Benin ?",
    a: "Oui, des le premier FCFA encaisse. Le statut le plus simple au Benin en 2026 est celui d'entreprise individuelle au regime du forfait (TPS - Taxe Professionnelle Synthetique). Tu te declares en ligne sur le portail e-services DGI ou en agence DGID, tu obtiens un IFU (Identifiant Fiscal Unique), et tu paies un impot synthetique. Tant que ton CA reste sous le seuil de 30 millions FCFA annuels, le forfait est avantageux. Cet article est informatif - consulte un expert-comptable agree (ONECCA Benin) pour ta situation precise.",
  },
  {
    q: "MTN MoMo ou Moov Money, lequel choisir pour encaisser au Benin ?",
    a: "Les deux, sans hesiter. MTN MoMo domine Cotonou, Porto-Novo et Abomey-Calavi (frais bas, app moderne, base utilisateurs massive). Moov Money est très fort dans le nord (Parakou, Natitingou, Djougou) et dans les villes secondaires. Celtiis Cash (operateur Celtiis lance 2024) gagne du terrain chez les 18-30 ans urbains. Novakou integre les trois par defaut : ton acheteur choisit, tu encaisses sur ton numéro prefere. Refuser un operateur, c'est se priver d'environ 25 a 35 pourcent du marche beninois.",
  },
  {
    q: "Combien de temps avant ma premiere vente au Benin ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as déjà une petite audience WhatsApp (50 - 200 contacts) a Cotonou ou en region. Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram ou TikTok. Les formateurs beninois qui vont le plus vite sont ceux qui pre-vendent dans leur entourage immediat (eglise, mosquee, ecole, association de quartier).",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Benin ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait déjà office de site : page de vente, paiement, livraison automatique, espace eleve. 80 pourcent des vendeurs beninois sur Novakou ne possedent aucun site separe. Le seul cas ou un site dedie devient utile : si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard quand ton catalogue depasse 3 a 4 produits.",
  },
  {
    q: "Puis-je vendre une formation depuis Porto-Novo, Parakou ou Abomey ?",
    a: "Bien sur. La vente de formation en ligne au Benin n'est pas reservee a Cotonou. Avec une connexion 4G correcte (MTN ou Moov), un smartphone recent et un micro-cravate a 5 000 FCFA, tu produis la meme qualité qu'aux Cocotiers. Plusieurs formateurs Novakou bases a Porto-Novo, Parakou ou Bohicon depassent 700 000 FCFA mensuels - leur avantage : couts de vie plus bas qu'a Cotonou, donc rentabilite nette superieure.",
  },
  {
    q: "Comment eviter que ma formation soit piratee et partagee gratuitement ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent au Benin comme partout. La meilleure defense reste un service inclus (coaching, replays a jour, communaute WhatsApp privee) que le pirate ne peut pas copier.",
  },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationBeninPage() {
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
              "Vendre une formation en ligne au Benin en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Benin en 2026 : MTN MoMo, Moov Money, Celtiis Cash, fiscalite micro-entreprise, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-benin-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Benin" },
              { "@type": "Thing", name: "MTN MoMo Benin paiement" },
              { "@type": "Thing", name: "Moov Money Benin formation" },
              { "@type": "Thing", name: "Celtiis Cash Benin" },
              { "@type": "Thing", name: "Auto-entrepreneur Benin micro-entreprise" },
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
                name: "Vendre une formation en ligne au Benin en 2026",
                item: "https://novakou.com/guides/vendre-formation-benin-2026",
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
              Guide Benin
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
            <span style={{ color: C.primary }}>Benin</span> en 2026 : le
            guide complet
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            MTN MoMo, Moov Money, Celtiis Cash, fiscalite micro-entreprise,
            lancement en 30 jours sans budget. Le guide pratique base sur les
            chiffres reels du marche beninois et la methode des formateurs
            qui dechirent depuis Cotonou en 2026.
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
                Equipe Novakou - Cotonou
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
            alt="Formateur beninois enregistrant son cours en ligne depuis Cotonou"
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
          Pourquoi le moment est unique au Benin
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le Benin de 2026 vit une fenetre d&apos;opportunite reelle. Avec
          plus de 13 millions d&apos;habitants, une jeunesse massive (mediane
          d&apos;age sous les 18 ans), un taux d&apos;equipement smartphone
          qui depasse 60 pourcent dans les centres urbains (Cotonou,
          Porto-Novo, Parakou, Abomey-Calavi), le terrain pour{" "}
          <strong>vendre une formation en ligne au Benin</strong> n&apos;a
          jamais ete aussi favorable. La 4G couvre l&apos;ensemble du
          territoire urbain, la fibre arrive jusqu&apos;a Calavi et Seme-Podji,
          MTN MoMo et Moov Money ont normalise le paiement digital quotidien.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Dans le meme temps, la generation des 18 - 35 ans beninoise cherche
          activement a se former : marketing digital, programmation,
          entrepreneuriat, langues etrangeres, immigration, beaute, religion.
          Les ecoles superieures classiques restent cheres (350 000 a 2
          millions FCFA l&apos;annee), souvent decalees des realites du marche,
          et n&apos;offrent ni flexibilite horaire ni accompagnement de pair.
          Ta formation en ligne, livree par Mobile Money, accessible depuis
          un smartphone Android d&apos;entree de gamme, repond exactement a
          cette demande.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Avec Sème City (le campus tech-savoir-faire), Etrilabs, le CIPCRE
          et une diaspora beninoise structuree en France, en Belgique et au
          Canada, le pays a déjà un ecosysteme digital qui ne demande
          qu&apos;a accueillir ton expertise. Ce guide te donne la methode
          integrale : choisir un sujet qui se vend a Cotonou et en region,
          encaisser via MTN MoMo Benin, gérer ta fiscalite micro-entreprise,
          promouvoir sans budget pub, lancer en 30 jours et comprendre les
          revenus realistes. Tout est aligne sur le terrain beninois de 2026,
          pas sur des recettes copiees du marche français ou ivoirien.
        </p>

        <MockupFrame title="Le marche de la formation digitale au Benin en 2026">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "13M+", label: "Population beninoise" },
              { value: "~62 %", label: "Smartphones (urbain)" },
              { value: "18 ans", label: "Age median" },
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
            Estimations 2026 - sources : INSAE, ARCEP Benin, GSMA Intelligence.
          </p>
        </MockupFrame>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #1 - CHOISIR SON SUJET                             */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="sujets" number="1">
          Choisir son sujet - ce qui se vend vraiment au Benin
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tous les sujets ne se valent pas a Cotonou. Le marche beninois a
          ses préférences propres, structurees par la demographie jeune, la
          culture entrepreneuriale très active (le Benin est un hub portuaire
          ouest-africain), la dimension religieuse plurielle (christianisme,
          islam, vodun) et la diaspora structuree. Voici les six niches qui
          generent le plus de{" "}
          <strong>vente formation digitale Cotonou</strong> en 2026, classees
          par volume de recherche et taux de conversion observes sur Novakou.
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
          La niche n°1 au Benin. Tout le monde veut apprendre a vendre sur
          Instagram, TikTok, WhatsApp Business. Sujets qui marchent :
          publicite Facebook ciblee Benin, contenu Reels viral, tunnels de
          vente, copywriting pour vendeuses de Dantokpa, e-commerce
          import-export Cotonou-Lagos. Le port autonome de Cotonou cree une
          demande naturelle d&apos;outils numeriques pour l&apos;import.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Immigration, visas et expatriation
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Niche en explosion au Benin en 2026. Avec une diaspora massive en
          France, au Canada (Quebec surtout), en Belgique et en Allemagne,
          les sujets &quot;preparer son dossier Campus France&quot;,
          &quot;immigrer au Canada via le PEQ&quot;, &quot;obtenir un visa
          etudiant Allemagne&quot; cartonnent. Ticket moyen eleve (45 000 -
          150 000 FCFA) car le ROI est evident pour l&apos;apprenant.
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
          Forte demande grace a Sème City et a l&apos;ecosysteme tech beninois
          (Etrilabs, BeninExcellence). Les sujets qui se vendent :
          developpement web (HTML/CSS/JavaScript, React, Next.js), Python
          data, no-code (Bubble, Webflow), creation d&apos;applications
          mobiles Flutter. Le talent beninois cible aussi le freelance
          international en EUR via Upwork et Malt - reel levier de prix.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Business en ligne et freelance
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Comment lancer son business depuis zero, comment trouver des
          clients freelance internationaux, comment encaisser en devises
          etrangeres via Wise ou Payoneer, comment structurer son entreprise
          individuelle beninoise. Ces sujets convertissent très bien car le
          resultat est mesurable - et la jeunesse beninoise est très
          entrepreneuriale par culture.
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
          Cheveux afro, ongles, maquillage, soins de la peau noire,
          melanotique, fabrication de cosmetiques naturels (karite, neem),
          perte de poids, salle de sport a la maison. Audience massivement
          feminine, très engagee sur Instagram et TikTok. Ticket moyen :
          10 000 a 30 000 FCFA, très bonne recurrence et upsell vers
          coaching individuel.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Langues etrangeres et soft skills
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Anglais business pour expatriation et freelance international,
          allemand (visa etudiant Allemagne), espagnol, mandarin (lien avec
          le commerce Cotonou-Asie). La diaspora francophone beninoise est
          aussi très demandeuse de cours d&apos;anglais en ligne pour ses
          enfants. Ticket eleve quand combine avec un objectif precis (TOEFL,
          DELE, embauche internationale).
        </p>

        <MockupFrame title="Prix moyens observes sur Novakou - Benin 2026">
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
                  { type: "Marketing digital", low: "18 000 FCFA", high: "140 000 FCFA" },
                  { type: "Immigration / visa", low: "45 000 FCFA", high: "180 000 FCFA" },
                  { type: "Programmation web", low: "30 000 FCFA", high: "230 000 FCFA" },
                  { type: "Business / freelance", low: "22 000 FCFA", high: "170 000 FCFA" },
                  { type: "Beaute / bien-etre", low: "10 000 FCFA", high: "60 000 FCFA" },
                  { type: "Langues etrangeres", low: "15 000 FCFA", high: "110 000 FCFA" },
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
          <strong>Conseil terrain :</strong> Plus le resultat de ta formation
          est concret (decrocher un emploi, obtenir un visa Campus France ou
          Canada, gagner X FCFA par mois, perdre Y kilos), plus ton ticket
          monte haut. Les formations &quot;decouverte&quot; vagues plafonnent
          autour de 12 000 FCFA, les formations &quot;transformation
          mesurable&quot; atteignent 80 000 - 250 000 FCFA - et la diaspora
          beninoise paie volontiers ce ticket.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #2 - ENCAISSER LES PAIEMENTS                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="paiements" number="2">
          Encaisser les paiements - MTN MoMo, Moov Money, Celtiis Cash
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est la pierre angulaire de ton business. Si ton acheteur
          beninois galere a payer, il abandonne. Au Benin en 2026, le paiement
          digital est domine par trois canaux Mobile Money plus la carte
          bancaire pour la diaspora. Tous doivent imperativement coexister
          sur ta page de vente.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          MTN MoMo Benin - le n°1
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          MTN MoMo Benin domine Cotonou, Porto-Novo, Abomey-Calavi, Ouidah et
          toutes les villes du sud. L&apos;application est gratuite, les
          transferts entre particuliers sont quasi sans frais, l&apos;expérience
          utilisateur est moderne. Pour un vendeur de formation, c&apos;est
          le moyen de paiement prefere des moins de 35 ans urbains beninois.
          L&apos;integration{" "}
          <strong>MTN MoMo Benin paiement</strong> sur Novakou est native :
          ton acheteur clique sur &quot;Payer avec MTN MoMo&quot;, scanne le
          QR ou saisit son numéro, valide avec son code PIN MoMo, et la
          transaction se boucle en quelques secondes.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Moov Money Benin - couverture nord et villes secondaires
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Moov Money reste très fort dans le nord du pays (Parakou, Djougou,
          Natitingou, Kandi) et dans les villes secondaires ou Moov a une
          meilleure couverture reseau que MTN. Les transferts internationaux
          entrants via Moov Money permettent aussi a un membre de la diaspora
          a Lome ou Niamey d&apos;acheter ta formation pour son cousin de
          Bohicon en quelques clics. Ne neglige jamais{" "}
          <strong>Moov Money Benin formation</strong> comme canal -
          c&apos;est jusqu&apos;a 30 pourcent des paiements selon ta niche.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Celtiis Cash - l&apos;entrant qui monte
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Lance plus recemment par Celtiis (operateur public beninois),{" "}
          <strong>Celtiis Cash Benin</strong> gagne du terrain rapidement,
          particulierement chez les fonctionnaires et chez la jeunesse
          urbaine. L&apos;offre tarifaire est competitive et l&apos;Etat
          beninois pousse son adoption. L&apos;inclure dans ta page de vente
          montre que tu es a jour - c&apos;est un signal de modernite qui
          rassure ton acheteur, meme si le volume actuel reste secondaire.
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
          La diaspora beninoise (France, Belgique, Canada, USA) utilise ses
          Visa et Mastercard. Pour eux, Mobile Money est une friction (il
          faudrait ouvrir un compte au Benin). La carte bancaire est donc
          indispensable des que tu vises au-dela des frontieres beninoises -
          et la diaspora represente souvent 20 a 30 pourcent du CA d&apos;un
          formateur beninois etabli. Novakou prend en charge les paiements
          carte automatiquement, sans config supplementaire.
        </p>

        <MockupFrame title="Repartition typique des paiements - formateur beninois 2026">
          <div className="space-y-3">
            {[
              { name: "MTN MoMo (Benin urbain)", pct: 44, color: C.primary },
              { name: "Moov Money (national + nord)", pct: 26, color: "#f97316" },
              { name: "Carte bancaire (diaspora EU/CA)", pct: 21, color: "#2563eb" },
              { name: "Celtiis Cash (jeunesse urbaine)", pct: 9, color: "#7c3aed" },
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
          <strong>Pourquoi Novakou integre les trois sans config :</strong>{" "}
          quand tu crees ta boutique{" "}
          <Link href="/inscription" style={{ color: C.primary }}>
            sur Novakou
          </Link>
          , MTN MoMo, Moov Money, Celtiis Cash et carte bancaire sont actives
          par defaut. Tu n&apos;ouvres aucun compte marchand, aucun contrat,
          aucune API : nous gerons les flux pour toi et te reversons ton
          solde net par cycle. Tu peux te concentrer sur ton contenu et ton
          marketing. Pour aller plus loin, voir le guide{" "}
          <Link
            href="/guides/mobile-money-encaisser-paiements"
            style={{ color: C.primary }}
          >
            encaisser tes paiements en Mobile Money
          </Link>
          .
        </ProTip>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #3 - FISCALITE                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="fiscalite" number="3">
          Le cadre fiscal du formateur freelance au Benin
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vendre une formation en ligne, c&apos;est un revenu, et un revenu
          se declare. Bonne nouvelle : le cadre beninois a beaucoup simplifie
          les choses pour le freelance digital depuis la mise en place de la
          Taxe Professionnelle Synthetique (TPS). Voici l&apos;essentiel a
          savoir sur la{" "}
          <strong>fiscalite freelance Benin</strong> en 2026.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          L&apos;entreprise individuelle au regime du forfait
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est le statut adapte pour 90 pourcent des formateurs
          digitaux beninois qui demarrent. L&apos;
          <strong>auto-entrepreneur Benin micro-entreprise</strong> beneficie
          d&apos;une declaration simplifiee, de la TPS qui remplace la
          patente et plusieurs taxes locales, et d&apos;une comptabilite
          allegee. Inscription possible en ligne sur le portail e-services
          de la DGI (impots.bj) ou en agence DGID (avec ta CNI ou ton
          passeport et un justificatif d&apos;adresse). Tu obtiens un IFU
          (Identifiant Fiscal Unique) et un Registre du Commerce simplifie en
          quelques jours via l&apos;APIEX ou directement au Tribunal de
          commerce.
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
          Tant que ton chiffre d&apos;affaires annuel reste sous 30 millions
          FCFA (environ 45 700 EUR), tu es :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
          <li>Soumis a la TPS (Taxe Professionnelle Synthetique)</li>
          <li>Dispense de tenir une comptabilite complete</li>
          <li>Autorise a emettre des factures simplifiees</li>
        </ul>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au-dela de 30 millions FCFA, tu passes au regime du reel simplifie
          (RRS) puis au regime du reel normal (RRN). A ce stade, un expert-
          comptable inscrit a l&apos;ONECCA Benin devient indispensable pour
          gérer ta TVA, ta CGA et ton IS.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          TPS - ce que tu paies vraiment
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          La Taxe Professionnelle Synthetique se calcule par tranches en
          fonction de ton chiffre d&apos;affaires annuel declare. Pour donner
          un ordre d&apos;idee : un formateur beninois qui realise 5 millions
          FCFA de CA annuel paie en general autour de 200 000 a 350 000 FCFA
          d&apos;impot total (selon ses charges deductibles et sa commune).
          C&apos;est significativement moins que le regime classique de
          l&apos;IS et de la patente cumules. Reste a payer les cotisations
          CNSS Benin si tu y adheres volontairement - fortement conseille
          pour ta retraite et ta couverture sociale.
        </p>

        <WarnBox>
          <strong>Avertissement :</strong> Cet article est purement informatif.
          La fiscalite beninoise evolue (reforme DGI en cours), ta situation
          personnelle est unique, et un mauvais choix peut couter cher.{" "}
          <strong>
            Consulte imperativement un expert-comptable agree (ONECCA Benin)
            ou un fiscaliste avant de finaliser ton statut.
          </strong>{" "}
          Le ticket moyen d&apos;un comptable a Cotonou pour le setup
          initial : 60 000 a 175 000 FCFA. Un investissement qui se
          rentabilise des la premiere annee fiscale, surtout pour optimiser
          la deduction de tes charges (materiel video, abonnements logiciels,
          internet).
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #4 - PROMOTION                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="promotion" number="4">
          Promouvoir ta formation - les canaux qui marchent au Benin
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au Benin, le mix marketing pour vendre une formation digitale est
          radicalement different du marche europeen. Oublie Google Ads ou la
          newsletter LinkedIn comme canal principal au demarrage. La realite
          terrain en 2026 :
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
          Au Benin, WhatsApp n&apos;est pas une app, c&apos;est
          l&apos;infrastructure sociale. Tes acheteurs y passent 3 a 5 heures
          par jour. Trois leviers :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>
            <strong>Statuts WhatsApp</strong> quotidiens : temoignages
            clients, micro-conseils, coulisses de ta semaine
          </li>
          <li>
            <strong>Listes de diffusion</strong> segmentees par interet
            (jamais de groupes de spam)
          </li>
          <li>
            <strong>Groupes communautaires</strong> autour de ta niche
            (immigration, beaute, business, religion)
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
          detaille toute la methode adaptee a l&apos;Afrique francophone.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Instagram Reels - la generation Z beninoise
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour toucher les 18 - 28 ans urbains de Cotonou et Porto-Novo,
          Instagram domine. Les Reels (videos courtes 30 - 60s) sont
          l&apos;algorithme le plus genereux en 2026 : un compte de 200
          abonnes peut faire 10 000 vues en quelques jours sur un sujet
          niche. Vise 3 a 5 Reels par semaine, ton de proximite, hashtags
          localises (#Cotonou #Benin229 #FormatricesBeninoises #SemeCity).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          TikTok - explosion silencieuse au Benin
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Sous-utilise par les vendeurs beninois de formation en 2026, donc
          enorme opportunite. L&apos;algorithme TikTok est le plus accueillant
          pour les debutants : ton premier post peut faire 50 000 vues sans
          aucun abonne. Cible ton contenu sur des micro-niches precises (par
          exemple &quot;visa Canada PEQ depuis Cotonou&quot; plutot que
          &quot;immigration&quot;). Le guide{" "}
          <Link
            href="/guides/tiktok-reels-vendre-formations"
            style={{ color: C.primary }}
          >
            TikTok et Reels pour vendre des formations
          </Link>{" "}
          decortique la mecanique.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          LinkedIn - pour les niches B2B et pro
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Si ta formation cible des entreprises beninoises, des cadres ou
          des freelances qualifies (developpement, finance, RH, conseil),
          LinkedIn est ton terrain. Public plus reduit mais ticket moyen
          beaucoup plus eleve (souvent 60 000 - 280 000 FCFA). La diaspora
          beninoise active sur LinkedIn (Paris, Bruxelles, Montreal) achete
          aussi pour ses parents restes au pays.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Facebook - encore puissant au Benin
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Contrairement a la France, Facebook reste très utilise au Benin
          (notamment via Facebook Lite). Les groupes Facebook locaux (par
          ville, par profession, par sujet) sont des mines d&apos;or pour
          le bouche-a-oreille. Publie de la valeur reelle dans 5-10 groupes
          alignes a ta niche, sans spam direct - les ventes viennent en DM.
        </p>

        <WarnBox>
          <strong>Pourquoi pas la pub Facebook au depart :</strong> les
          encheres publicitaires Facebook Ads au Benin ont monte
          significativement depuis 2024. Pour un freelance debutant sans
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
          La methode appliquee par les formateurs Novakou beninois qui passent
          de 0 a 450 000 FCFA en un mois. Quatre semaines, quatre missions
          claires, zero franc CFA de budget pub.
        </p>

        <MockupFrame title="Plan 30 jours pour vendre formation en ligne Benin">
          <div className="space-y-4">
            {[
              {
                week: "Semaine 1",
                focus: "Créer le contenu",
                desc: "3h/jour : structure des modules, enregistrement video au smartphone (Galaxy A ou iPhone d'occasion), montage CapCut. Objectif fin de semaine : 60 % de la formation enregistree.",
              },
              {
                week: "Semaine 2",
                focus: "Pre-vente WhatsApp",
                desc: "Liste de 10 testeurs proches (amis, collegues, contacts WhatsApp Cotonou ou diaspora). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees via MTN MoMo = validation marche.",
              },
              {
                week: "Semaine 3",
                focus: "Lancement public",
                desc: "Boutique Novakou en ligne. 5 Reels Instagram + 7 stories WhatsApp Business + 1 post LinkedIn + 3 posts groupes Facebook Benin. Annonce officielle a ta communaute avec offre limitee 72h.",
              },
              {
                week: "Semaine 4",
                focus: "Optimiser et 2eme cohorte",
                desc: "Analyse des metriques (taux conversion, panier moyen, retours clients). Ajuste prix et page de vente. Relance pour 2eme cohorte avec temoignages video de la 1ere - massif effet de preuve sociale.",
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
          aupres de tes 10 contacts les plus proches a Cotonou ou
          Porto-Novo, c&apos;est que ton offre, ton prix ou ton message ne
          sont pas alignes au marche beninois. Mieux vaut ajuster maintenant
          que d&apos;investir 3 semaines de production dans le vide. Pour
          aller plus loin, le guide{" "}
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
          en meme temps (WhatsApp, Instagram, Facebook, LinkedIn). La
          synchronisation cree un effet de masse qui declenche les premieres
          ventes spontanees, et les statuts WhatsApp de tes amis qui
          relaient amplifient l&apos;onde.
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
          observees chez les formateurs Novakou bases au Benin en 2026.
          Pas des promesses : la moyenne du terrain, hors top 1 pourcent.
        </p>

        <MockupFrame title="Revenus mensuels par niveau - formateur beninois 2026">
          <div className="space-y-4">
            {[
              {
                level: "Debutant (0-6 mois)",
                range: "50 000 - 200 000 FCFA",
                desc: "1 a 5 ventes par semaine, ticket moyen 12 - 25K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp Cotonou + entourage proche.",
                color: "#22c55e",
              },
              {
                level: "Intermediaire (6-18 mois)",
                range: "300 000 - 900 000 FCFA",
                desc: "Audience Instagram 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute WhatsApp privee), diaspora active.",
                color: "#2563eb",
              },
              {
                level: "Avance (1.5 ans+)",
                range: "1 500 000 - 5 000 000 FCFA+",
                desc: "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif, 1 a 2 lancements signature par an, partenariats avec ecoles ou Sème City.",
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
          Cas pratique - Adjovi Marius, 31 ans, formateur immigration &
          expatriation
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Marius habite a Akpakpa, Cotonou. Diplome en droit des affaires de
          l&apos;Universite d&apos;Abomey-Calavi, il a travaille 4 ans dans
          un cabinet de conseil en immigration avant de basculer formateur
          en fevrier 2026. Son catalogue : une formation cle &quot;Dossier
          Campus France 2026 sans erreur&quot; a 38 000 FCFA, un guide
          condense &quot;PEQ Quebec depuis le Benin&quot; a 12 000 FCFA, une
          communaute WhatsApp Premium &quot;Visa Club&quot; a 7 500
          FCFA/mois (suivi mensuel + Q&A live).
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En octobre 2026, son chiffre d&apos;affaires mensuel atteint 1 180
          000 FCFA. Repartition : 58 pourcent ventes de la formation Campus
          France (sa période est mars-avril et septembre-octobre), 22
          pourcent guide PEQ Quebec (transactions diaspora), 20 pourcent
          abonnements Visa Club (recurrence formidable). Après TPS et
          commissions Novakou, il lui reste environ 900 000 FCFA nets -
          presque 3 fois son salaire de cabinet precedent, pour 30 heures
          de travail hebdomadaires. Profil fictif mais entierement aligne
          sur les metriques observees sur la plateforme.
        </p>

        <ProTip>
          <strong>Le secret du passage 300K → 1M FCFA :</strong> construire
          un catalogue. Une seule formation, meme excellente, plafonne.
          Ajoute un ebook d&apos;entree de gamme (7 - 12K FCFA), un upsell
          premium (coaching individuel 65 - 150K FCFA), une communaute
          privee recurrente (5 - 15K FCFA/mois). Le panier moyen double
          souvent, sans effort marketing supplementaire. Le guide{" "}
          <Link
            href="/guides/scaler-catalogue-produits"
            style={{ color: C.primary }}
          >
            scaler ton catalogue de produits
          </Link>{" "}
          explique la sequence exacte adaptee a l&apos;Afrique francophone.
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
          Les huit questions qui reviennent en boucle dans les DMs Instagram
          et les WhatsApp de l&apos;equipe Novakou Cotonou.
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
            Pret a lancer ta boutique de formation au Benin ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Inscription gratuite en 3 minutes. MTN MoMo, Moov Money, Celtiis
            Cash et carte bancaire actives par defaut. Ta premiere vente
            peut tomber des cette semaine.
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
                desc: "MTN MoMo, Moov Money, Wave, Orange Money : tout sur l'encaissement digital en Afrique francophone.",
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
