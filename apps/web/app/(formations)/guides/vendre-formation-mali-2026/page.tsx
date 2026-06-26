import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const OG_TITLE = "Vendre une formation en ligne au Mali en 2026";
const OG_SUBTITLE = "Le guide complet : Orange Money, Moov Money, Wave Mali, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  title: "Vendre une formation au Mali en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Mali en 2026 : Orange Money, Moov Money, Wave Mali, fiscalite micro-entreprise, lancement 30 jours et chiffres reels du marche bamakois.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Mali en 2026 | Guide Novakou",
    description:
      "Orange Money, Moov Money, Wave Mali, fiscalite simplifiee, methode 30 jours : tout pour vendre ta formation digitale au Mali.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-mali-2026",
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
      <span style={{ color: C.dark }}>Vendre formation Mali 2026</span>
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
  { id: "introduction", label: "Pourquoi vendre une formation au Mali en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend vraiment" },
  { id: "paiements", label: "Encaisser - Orange Money, Moov Money, Wave Mali" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Mali ?",
    a: "Non. Au Mali en 2026, un compte Orange Money, Moov Money ou Wave Mali suffit largement pour commencer. Novakou verse directement tes gains sur ton numéro Mobile Money malien. Le compte bancaire devient utile a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux ouvrir un compte pro a BDM-SA, Ecobank Mali, BMS, BOA Mali ou Coris Bank pour structurer ta tresorerie.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Mali ?",
    a: "Le ticket median sur le marche malien en 2026 se situe entre 12 000 et 28 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute privee, certificat) montent a 55 000 - 170 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 4 000 - 9 000 FCFA. Plus le resultat est concret (decrocher un emploi, monter un projet agricole rentable, partir a l'etranger), plus tu peux monter en prix - la diaspora malienne en France, Espagne et USA paie sans hesiter 80 000 FCFA pour une formation a ROI prouve.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI Mali ?",
    a: "Oui, des le premier FCFA encaisse. Le statut le plus simple au Mali pour un formateur freelance est l'entreprise individuelle au regime simplifie. Tu te declares en ligne sur le portail de la DGI Mali ou en agence (Centre des Impots de ta commune), tu obtiens un NIF (Numéro d'Identification Fiscale), et tu paies l'ISCP (Impot Synthetique sur la Contribution des Patentes) qui regroupe plusieurs taxes. Tant que ton CA reste sous le seuil de 25 millions FCFA annuels, le regime simplifie reste avantageux. Cet article est informatif - consulte un expert-comptable agree (ONECCA Mali) pour ta situation precise.",
  },
  {
    q: "Orange Money ou Moov Money, lequel choisir pour encaisser au Mali ?",
    a: "Les deux, plus Wave. Orange Money domine historiquement le Mali (Bamako, Kayes, Sikasso, Segou, Mopti) avec la plus large base utilisateurs et les meilleurs reseaux d'agents physiques. Moov Money est très fort dans le sud-est et chez les jeunes urbains de Bamako. Wave a commence son deploiement au Mali en 2024-2025 et seduit la generation Instagram avec sa gratuite totale entre particuliers. Novakou integre les trois par defaut : ton acheteur choisit, tu encaisses sur ton numéro prefere. Refuser un operateur, c'est se priver d'environ 25 a 40 pourcent du marche malien.",
  },
  {
    q: "Combien de temps avant ma premiere vente au Mali ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as déjà une petite audience WhatsApp (50 - 200 contacts) a Bamako ou en region. Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram ou TikTok. Les formateurs maliens qui vont le plus vite sont ceux qui pre-vendent dans leur entourage immediat et dans leur diaspora familiale (le cousin de Paris ou de Madrid achete très facilement pour son petit frere de Bamako).",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Mali ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait déjà office de site : page de vente, paiement, livraison automatique, espace eleve. 80 pourcent des vendeurs maliens sur Novakou ne possedent aucun site separe. Le seul cas ou un site dedie devient utile : si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard quand ton catalogue depasse 3 a 4 produits et que tu vises l'international (diaspora ou marche UEMOA elargi).",
  },
  {
    q: "Puis-je vendre une formation depuis Sikasso, Segou ou Mopti ?",
    a: "Bien sur. La vente de formation en ligne au Mali n'est pas reservee a Bamako. Avec une connexion 4G correcte (Orange ou Malitel), un smartphone recent et un micro-cravate a 5 000 FCFA, tu produis la meme qualité qu'a l'ACI 2000. Plusieurs formateurs Novakou bases a Sikasso, Segou ou Kayes depassent 600 000 FCFA mensuels - leur avantage : couts de vie plus bas qu'a Bamako, donc rentabilite nette superieure. Et leurs formations parlent souvent au monde rural mieux que celles des Bamakois.",
  },
  {
    q: "Comment eviter que ma formation soit piratee et partagee gratuitement ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent au Mali comme partout en Afrique francophone. La meilleure defense reste un service inclus (coaching, replays a jour, communaute WhatsApp privee, sessions Q&A live en bambara ou en français) que le pirate ne peut pas copier.",
  },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationMaliPage() {
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
              "Vendre une formation en ligne au Mali en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Mali en 2026 : Orange Money, Moov Money, Wave Mali, fiscalite micro-entreprise, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-mali-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Mali" },
              { "@type": "Thing", name: "Orange Money Mali paiement" },
              { "@type": "Thing", name: "Moov Money Mali formation" },
              { "@type": "Thing", name: "Wave Mali Bamako" },
              { "@type": "Thing", name: "Fiscalite micro-entreprise Mali" },
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
                name: "Vendre une formation en ligne au Mali en 2026",
                item: "https://novakou.com/guides/vendre-formation-mali-2026",
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
              Guide Mali
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
            <span style={{ color: C.primary }}>Mali</span> en 2026 : le
            guide complet
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            Orange Money, Moov Money, Wave Mali, fiscalite micro-entreprise,
            lancement en 30 jours sans budget. Le guide pratique base sur les
            chiffres reels du marche malien et la methode des formateurs qui
            dechirent depuis Bamako en 2026.
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
                Equipe Novakou - Bamako
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
            alt="Formatrice malienne enregistrant son cours en ligne depuis Bamako"
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
          Pourquoi le moment est unique au Mali
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le Mali de 2026 vit une fenetre d&apos;opportunite massive,
          souvent sous-estimee. Avec plus de 22 millions d&apos;habitants et
          Bamako qui depasse 3 millions, une jeunesse ecrasante (mediane
          d&apos;age sous les 17 ans) et un taux d&apos;equipement smartphone
          qui depasse 55 pourcent dans les centres urbains (Bamako, Sikasso,
          Segou, Mopti, Kayes), le terrain pour{" "}
          <strong>vendre une formation en ligne au Mali</strong> n&apos;a
          jamais ete aussi favorable. La 4G couvre l&apos;ensemble du
          territoire urbain, la fibre arrive dans les principales villes,
          Orange Money et Moov Money ont normalise le paiement digital
          quotidien et Wave Mali bouscule le marche.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Dans le meme temps, la generation des 18 - 35 ans malienne cherche
          activement a se former : agriculture moderne et agro-business,
          marketing digital, programmation, entrepreneuriat, langues
          etrangeres pour l&apos;expatriation, beaute, religion. Les ecoles
          superieures classiques restent cheres (300 000 a 1.8 million FCFA
          l&apos;annee), souvent decalees des realites du marche, et
          n&apos;offrent ni flexibilite horaire ni accompagnement de pair.
          Ta formation en ligne, livree par Mobile Money, accessible depuis
          un smartphone Android d&apos;entree de gamme, repond exactement a
          cette demande.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Avec Donilab, IMPACT Hub Bamako, Tuwindi Foundation et une
          diaspora malienne massive (la 3eme source de devises du pays après
          l&apos;or et le coton, structuree en France, en Espagne, aux USA
          et en Cote d&apos;Ivoire), le pays a déjà un ecosysteme digital
          qui ne demande qu&apos;a accueillir ton expertise. Ce guide te
          donne la methode integrale : choisir un sujet qui se vend a
          Bamako et en region, encaisser via Orange Money Mali, gérer ta
          fiscalite micro-entreprise, promouvoir sans budget pub, lancer en
          30 jours et comprendre les revenus realistes. Tout est aligne sur
          le terrain malien de 2026, pas sur des recettes copiees du marche
          français ou ivoirien.
        </p>

        <MockupFrame title="Le marche de la formation digitale au Mali en 2026">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "22M+", label: "Population malienne" },
              { value: "~57 %", label: "Smartphones (urbain)" },
              { value: "17 ans", label: "Age median" },
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
            Estimations 2026 - sources : INSTAT, AMRTP, GSMA Intelligence.
          </p>
        </MockupFrame>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #1 - CHOISIR SON SUJET                             */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="sujets" number="1">
          Choisir son sujet - ce qui se vend vraiment au Mali
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tous les sujets ne se valent pas a Bamako. Le marche malien a ses
          préférences propres, structurees par la demographie jeune, le
          poids economique de l&apos;agriculture et de l&apos;artisanat
          (l&apos;or et le coton restent les premiers piliers), la dimension
          religieuse forte (islam majoritaire) et la diaspora structuree.
          Voici les six niches qui generent le plus de{" "}
          <strong>vente formation digitale Bamako</strong> en 2026, classees
          par volume de recherche et taux de conversion observes sur Novakou.
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
          Specificite forte du Mali : niche n°1 sur Novakou avec un taux de
          conversion superieur a la moyenne. Sujets qui marchent : maraichage
          intensif, aviculture moderne, embouche bovine, cultures
          irrigation goutte-a-goutte, transformation des produits agricoles
          (karite, beurre de karite, neem, bissap, fonio), permaculture
          adaptee au Sahel. Audience très engagee : les jeunes diplomes
          maliens qui retournent au village ET les entrepreneurs urbains qui
          veulent diversifier.
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
          Forte demande a Bamako. Tout le monde veut apprendre a vendre sur
          Instagram, TikTok, WhatsApp Business. Sujets qui marchent :
          publicite Facebook ciblee Mali, contenu Reels viral, tunnels de
          vente, copywriting pour vendeuses du marche de Medina-Coura,
          dropshipping depuis le Mali avec fournisseurs ivoiriens ou chinois.
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
          Demande qui explose grace a l&apos;ecosysteme Donilab, IMPACT Hub
          Bamako, Orange Digital Center. Les sujets qui se vendent :
          developpement web (HTML/CSS/JavaScript, React), Python pour data
          et automatisation, no-code (Bubble, Webflow), creation
          d&apos;applications mobiles Flutter. Le talent malien cible aussi
          le freelance international en EUR ou USD - reel levier de prix.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Religion et sciences islamiques
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le Mali etant majoritairement musulman avec une forte tradition de
          savoir islamique (medersa, ecoles coraniques), les formations en
          apprentissage du Coran, tajwid, hadiths, sciences islamiques,
          finance islamique (sukuk, halal banking) ont une audience massive
          et très loyale. Ticket moyen plus modere mais churn quasi nul.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Beaute, soin de soi et cosmetiques naturels
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Cheveux afro, ongles, maquillage, soins de la peau noire,
          fabrication de cosmetiques naturels (karite, neem, baobab, hibiscus
          - ingredients locaux abondants), perte de poids, salle de sport a
          la maison. Audience massivement feminine, très engagee sur
          Instagram et TikTok. Ticket moyen : 10 000 a 28 000 FCFA, et
          excellente recurrence par communaute privee.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Langues etrangeres et expatriation
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Anglais business pour freelance international et expatriation USA,
          espagnol (forte communaute malienne en Espagne), arabe litteraire,
          mandarin (relations Mali-Chine et bourses chinoises). La diaspora
          francophone malienne est très demandeuse de cours en ligne pour
          ses enfants restes au pays. Ticket eleve quand combine avec un
          objectif precis (TOEFL, IELTS, DELE, embauche internationale).
        </p>

        <MockupFrame title="Prix moyens observes sur Novakou - Mali 2026">
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
                  { type: "Agriculture / agro-business", low: "22 000 FCFA", high: "175 000 FCFA" },
                  { type: "Marketing digital", low: "17 000 FCFA", high: "130 000 FCFA" },
                  { type: "Programmation web", low: "28 000 FCFA", high: "220 000 FCFA" },
                  { type: "Religion / sciences islamiques", low: "7 000 FCFA", high: "40 000 FCFA" },
                  { type: "Beaute / cosmetiques naturels", low: "10 000 FCFA", high: "55 000 FCFA" },
                  { type: "Langues / expatriation", low: "15 000 FCFA", high: "100 000 FCFA" },
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
          est concret (decrocher un emploi, monter un projet agricole
          rentable, obtenir un visa, gagner X FCFA par mois en agro-business,
          perdre Y kilos), plus ton ticket monte haut. Les formations
          &quot;decouverte&quot; vagues plafonnent autour de 12 000 FCFA,
          les formations &quot;transformation mesurable&quot; atteignent
          80 000 - 220 000 FCFA - et la diaspora malienne en France ou en
          Espagne paie volontiers ce ticket pour son frere reste au pays.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #2 - ENCAISSER LES PAIEMENTS                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="paiements" number="2">
          Encaisser les paiements - Orange Money, Moov Money, Wave Mali
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est la pierre angulaire de ton business. Si ton acheteur
          malien galere a payer, il abandonne. Au Mali en 2026, le paiement
          digital est domine par trois canaux Mobile Money plus la carte
          bancaire pour la diaspora. Tous doivent imperativement coexister
          sur ta page de vente.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Orange Money Mali - le n°1 historique
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Orange Money Mali</strong> domine toutes les regions :
          Bamako, Kayes, Sikasso, Segou, Mopti, Kati, Koulikoro. Le reseau
          d&apos;agents physiques est le plus dense du pays, ce qui rassure
          les acheteurs ruraux qui veulent pouvoir cash-out facilement.
          L&apos;application est gratuite, les transferts entre particuliers
          sont très bon marche, l&apos;expérience utilisateur s&apos;est
          modernisee. Pour un vendeur de formation, c&apos;est le moyen de
          paiement prefere de la majorite des Maliens, toutes generations
          confondues. L&apos;integration Orange Money Mali sur Novakou est
          native.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Moov Money Mali - challenger urbain
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Moov Money Mali</strong> reste très fort a Bamako et dans
          les villes secondaires du sud (Sikasso, Bougouni, Koutiala) ou
          Moov a une meilleure couverture reseau qu&apos;Orange. Très
          populaire chez les 18-30 ans urbains qui apprecient son offre
          tarifaire competitive et ses promotions reseau. Les transferts
          internationaux entrants via Moov Money permettent a un membre de
          la diaspora a Abidjan ou Ouagadougou d&apos;acheter ta formation
          pour son cousin de Bamako en quelques clics. Couvre jusqu&apos;a
          25 pourcent des paiements selon ta niche.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Wave Mali - l&apos;entrant disruptif
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          <strong>Wave Mali</strong> a lance son deploiement au Mali en
          2024-2025, après avoir conquis le Senegal et la Cote d&apos;Ivoire.
          Sa promesse : transferts gratuits entre particuliers, app moderne,
          expérience type fintech europeenne. En 2026, Wave seduit
          principalement la jeunesse urbaine bamakoise (18-30 ans), les
          freelances et les commercants e-commerce. L&apos;inclure dans ta
          page de vente est un signal fort de modernite et te rend
          accessible aux digital natives maliens - meme si le volume actuel
          reste secondaire par rapport a Orange Money.
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
          La diaspora malienne (France, Espagne, USA, Cote d&apos;Ivoire,
          Senegal) utilise ses Visa et Mastercard. Pour eux, Mobile Money est
          une friction (il faudrait ouvrir un compte au Mali). La carte
          bancaire est donc indispensable des que tu vises au-dela des
          frontieres maliennes - et la diaspora represente souvent 25 a 35
          pourcent du CA d&apos;un formateur malien etabli (la diaspora est
          la 3eme source de devises du pays). Novakou prend en charge les
          paiements carte automatiquement, sans config supplementaire.
        </p>

        <MockupFrame title="Repartition typique des paiements - formateur malien 2026">
          <div className="space-y-3">
            {[
              { name: "Orange Money (national)", pct: 48, color: "#f97316" },
              { name: "Carte bancaire (diaspora EU/USA)", pct: 22, color: "#2563eb" },
              { name: "Moov Money (urbain + sud)", pct: 21, color: C.primary },
              { name: "Wave Mali (jeunesse Bamako)", pct: 9, color: "#7c3aed" },
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
          , Orange Money, Moov Money, Wave et carte bancaire sont actives
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
          Le cadre fiscal du formateur freelance au Mali
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vendre une formation en ligne, c&apos;est un revenu, et un revenu
          se declare. Bonne nouvelle : le cadre malien permet plusieurs voies
          simples pour le freelance digital. Voici l&apos;essentiel a
          savoir sur la{" "}
          <strong>fiscalite micro-entreprise Mali</strong> en 2026.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          L&apos;entreprise individuelle au regime simplifie
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est le statut adapte pour 90 pourcent des formateurs
          digitaux maliens qui demarrent. Le freelance malien beneficie
          d&apos;une declaration simplifiee, de l&apos;ISCP (Impot
          Synthetique sur la Contribution des Patentes) qui regroupe
          plusieurs taxes, et d&apos;une comptabilite allegee. Inscription
          possible en ligne sur le portail e-services de la DGI Mali ou en
          agence (Centre des Impots de ta commune, avec ta CNI ou ton
          passeport et un justificatif d&apos;adresse). Tu obtiens un NIF
          (Numéro d&apos;Identification Fiscale) et un Registre du Commerce
          en quelques jours via l&apos;API-Mali (Agence pour la Promotion
          des Investissements).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le seuil des 25 millions FCFA
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tant que ton chiffre d&apos;affaires annuel reste sous 25 millions
          FCFA (environ 38 000 EUR), tu es :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
          <li>Soumis a l&apos;ISCP / impot synthetique simplifie</li>
          <li>Dispense de tenir une comptabilite complete</li>
          <li>Autorise a emettre des factures simplifiees</li>
        </ul>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au-dela de 25 millions FCFA, tu passes au regime du reel simplifie
          et tu dois t&apos;immatriculer a la TVA. A ce stade, un expert-
          comptable inscrit a l&apos;ONECCA Mali devient indispensable pour
          gérer ta declaration TVA, ta CSS et ton BIC (Bénéfices Industriels
          et Commerciaux).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          ISCP - ce que tu paies vraiment
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          L&apos;Impot Synthetique sur la Contribution des Patentes se
          calcule par tranches en fonction de ton chiffre d&apos;affaires
          annuel declare et de ta commune. Pour donner un ordre d&apos;idee :
          un formateur malien qui realise 5 millions FCFA de CA annuel paie
          en general autour de 200 000 a 350 000 FCFA d&apos;impot total
          (selon ses charges deductibles et sa commune). C&apos;est
          significativement moins que le regime classique BIC + patente
          separes. Reste a payer les cotisations INPS Mali si tu y adheres
          volontairement - fortement conseille pour ta retraite et ta
          couverture maladie.
        </p>

        <WarnBox>
          <strong>Avertissement :</strong> Cet article est purement informatif.
          La fiscalite malienne evolue (reformes DGI en cours), ta situation
          personnelle est unique, et un mauvais choix peut couter cher.{" "}
          <strong>
            Consulte imperativement un expert-comptable agree (ONECCA Mali)
            ou un fiscaliste avant de finaliser ton statut.
          </strong>{" "}
          Le ticket moyen d&apos;un comptable a Bamako pour le setup
          initial : 50 000 a 150 000 FCFA. Un investissement qui se
          rentabilise des la premiere annee fiscale, surtout pour optimiser
          la deduction de tes charges (materiel video, abonnements logiciels,
          internet, amortissements).
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #4 - PROMOTION                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="promotion" number="4">
          Promouvoir ta formation - les canaux qui marchent au Mali
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au Mali, le mix marketing pour vendre une formation digitale est
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
          Au Mali, WhatsApp n&apos;est pas une app, c&apos;est
          l&apos;infrastructure sociale. Tes acheteurs y passent 3 a 5 heures
          par jour. Trois leviers :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>
            <strong>Statuts WhatsApp</strong> quotidiens : temoignages
            clients, micro-conseils, coulisses de ton activité
          </li>
          <li>
            <strong>Listes de diffusion</strong> segmentees par interet
            (jamais de groupes de spam)
          </li>
          <li>
            <strong>Groupes communautaires</strong> autour de ta niche
            (agriculture, beaute, business, religion)
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
          Facebook - encore très puissant au Mali
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Contrairement a la France, Facebook reste massivement utilise au
          Mali, surtout via Facebook Lite (peu gourmand en data). Les groupes
          Facebook locaux (par ville, par profession, par sujet agricole)
          sont des mines d&apos;or pour le bouche-a-oreille. Publie de la
          valeur reelle dans 5-10 groupes alignes a ta niche, sans spam
          direct - les ventes viennent en DM. Sous-estime par les vendeurs
          urbains modernes, mais redoutable d&apos;efficacite pour atteindre
          la majorite silencieuse.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Instagram Reels - la generation Z bamakoise
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour toucher les 18 - 28 ans urbains de Bamako, Sikasso et Segou,
          Instagram domine. Les Reels (videos courtes 30 - 60s) sont
          l&apos;algorithme le plus genereux en 2026 : un compte de 200
          abonnes peut faire 10 000 vues en quelques jours sur un sujet
          niche. Vise 3 a 5 Reels par semaine, ton de proximite, hashtags
          localises (#Bamako #Mali223 #FormatricesMaliennes #DoniLab).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          TikTok - explosion silencieuse au Mali
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Sous-utilise par les vendeurs maliens de formation en 2026, donc
          enorme opportunite. L&apos;algorithme TikTok est le plus accueillant
          pour les debutants : ton premier post peut faire 50 000 vues sans
          aucun abonne. Cible ton contenu sur des micro-niches precises
          (par exemple &quot;aviculture rentable au Mali pour 200K&quot;
          plutot que &quot;agriculture&quot;). Le guide{" "}
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
          LinkedIn - pour les niches B2B et la diaspora
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Si ta formation cible des entreprises maliennes, des cadres ou des
          freelances qualifies (developpement, finance, RH, conseil),
          LinkedIn est ton terrain. Public plus reduit mais ticket moyen
          beaucoup plus eleve (souvent 55 000 - 250 000 FCFA). La diaspora
          malienne active sur LinkedIn (Paris, Madrid, New York, Abidjan,
          Dakar) achete aussi pour ses parents ou freres restes au pays -
          c&apos;est un puissant canal souvent neglige.
        </p>

        <WarnBox>
          <strong>Pourquoi pas la pub Facebook au depart :</strong> les
          encheres publicitaires Facebook Ads au Mali ont monte
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
          La methode appliquee par les formateurs Novakou maliens qui passent
          de 0 a 450 000 FCFA en un mois. Quatre semaines, quatre missions
          claires, zero franc CFA de budget pub.
        </p>

        <MockupFrame title="Plan 30 jours pour vendre formation en ligne Mali">
          <div className="space-y-4">
            {[
              {
                week: "Semaine 1",
                focus: "Créer le contenu",
                desc: "3h/jour : structure des modules, enregistrement video au smartphone (Galaxy A ou Tecno recent), montage CapCut. Objectif fin de semaine : 60 % de la formation enregistree.",
              },
              {
                week: "Semaine 2",
                focus: "Pre-vente WhatsApp",
                desc: "Liste de 10 testeurs proches (amis, collegues, contacts WhatsApp Bamako ou diaspora). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees via Orange Money = validation marche.",
              },
              {
                week: "Semaine 3",
                focus: "Lancement public",
                desc: "Boutique Novakou en ligne. 5 Reels Instagram + 7 stories WhatsApp Business + 1 post LinkedIn + 5 posts groupes Facebook Mali (par region ou niche). Annonce officielle avec offre limitee 72h.",
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
          aupres de tes 10 contacts les plus proches a Bamako ou en region,
          c&apos;est que ton offre, ton prix ou ton message ne sont pas
          alignes au marche malien. Mieux vaut ajuster maintenant que
          d&apos;investir 3 semaines de production dans le vide. Pour aller
          plus loin, le guide{" "}
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
          ventes spontanees. Pense aussi a une version courte en bambara
          si ta niche le permet - effet de proximite immediat.
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
          observees chez les formateurs Novakou bases au Mali en 2026.
          Pas des promesses : la moyenne du terrain, hors top 1 pourcent.
        </p>

        <MockupFrame title="Revenus mensuels par niveau - formateur malien 2026">
          <div className="space-y-4">
            {[
              {
                level: "Debutant (0-6 mois)",
                range: "60 000 - 180 000 FCFA",
                desc: "1 a 5 ventes par semaine, ticket moyen 12 - 22K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp Bamako + entourage proche + diaspora familiale.",
                color: "#22c55e",
              },
              {
                level: "Intermediaire (6-18 mois)",
                range: "280 000 - 800 000 FCFA",
                desc: "Audience Instagram 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute WhatsApp privee), diaspora maliennne (France/Espagne) active.",
                color: "#2563eb",
              },
              {
                level: "Avance (1.5 ans+)",
                range: "1 200 000 - 4 000 000 FCFA+",
                desc: "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif, 1 a 2 lancements signature par an, partenariats avec ONG agricoles ou IMPACT Hub Bamako.",
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
          Cas pratique - Toure Aminata, 35 ans, formatrice agriculture moderne
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Aminata habite a Faladie, Bamako. Ingenieure agronome diplomee de
          l&apos;IPR/IFRA de Katibougou, elle a travaille 7 ans dans un
          projet de developpement rural finance par la Banque mondiale avant
          de basculer formatrice en janvier 2026. Son catalogue : une
          formation cle &quot;Maraichage rentable au Sahel - 4 cultures qui
          rapportent&quot; a 42 000 FCFA, un guide pratique &quot;Embouche
          ovine pour Tabaski - rendement 80 %&quot; a 18 000 FCFA, une
          communaute WhatsApp Premium &quot;Agro Club Mali&quot; a 6 000
          FCFA/mois (suivi mensuel + Q&A live en bambara et français +
          calendrier cultural).
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En novembre 2026, son chiffre d&apos;affaires mensuel atteint 1
          340 000 FCFA. Repartition : 52 pourcent ventes de la formation
          maraichage, 28 pourcent guide embouche ovine (saisonnalite
          Tabaski qui boost), 20 pourcent abonnements Agro Club Mali
          (recurrence stable). Après ISCP et commissions Novakou, il lui
          reste environ 1 060 000 FCFA nets - presque 4 fois son salaire de
          projet precedent, pour 30 heures de travail hebdomadaires. Profil
          fictif mais entierement aligne sur les metriques observees sur la
          plateforme. La force d&apos;Aminata : sa formation parle a une
          vraie douleur (rentabiliser sa terre familiale) et propose des
          chiffres concrets verifiables.
        </p>

        <ProTip>
          <strong>Le secret du passage 300K → 1M FCFA :</strong> construire
          un catalogue. Une seule formation, meme excellente, plafonne.
          Ajoute un ebook d&apos;entree de gamme (7 - 12K FCFA), un upsell
          premium (coaching individuel 60 - 140K FCFA), une communaute
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
          et les WhatsApp de l&apos;equipe Novakou Bamako.
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
            Pret a lancer ta boutique de formation au Mali ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Inscription gratuite en 3 minutes. Orange Money, Moov Money,
            Wave Mali et carte bancaire actives par defaut. Ta premiere
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
                desc: "Orange Money, Moov Money, Wave, MTN MoMo : tout sur l'encaissement digital en Afrique francophone.",
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
