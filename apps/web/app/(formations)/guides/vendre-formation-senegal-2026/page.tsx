import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const OG_TITLE = "Vendre une formation en ligne au Senegal en 2026";
const OG_SUBTITLE = "Le guide complet : Wave, Orange Money, fiscalite, lancement 30 jours";

export const metadata: Metadata = {
  // Title sans "| Novakou" — le template root l'ajoute automatiquement.
  // Évite le double suffix "| Novakou | Novakou" qui dépasse la limite Google.
  title: "Vendre une formation au Sénégal en 2026 — Guide complet",
  description:
    "Le guide pratique pour vendre formation en ligne Senegal en 2026 : Wave, Orange Money, fiscalite freelance, lancement 30 jours et chiffres reels du marche dakarois.",
  openGraph: {
    title:
      "Vendre une formation en ligne au Senegal en 2026 | Guide Novakou",
    description:
      "Wave, Orange Money, fiscalite auto-entrepreneur, methode de lancement 30 jours : tout pour vendre ta formation digitale au Senegal.",
    type: "article",
    images: [
      `/api/og?type=guide&title=${encodeURIComponent(OG_TITLE)}&subtitle=${encodeURIComponent(OG_SUBTITLE)}`,
    ],
  },
  alternates: {
    canonical: "/guides/vendre-formation-senegal-2026",
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
      <span style={{ color: C.dark }}>Vendre formation Senegal 2026</span>
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
  { id: "introduction", label: "Pourquoi vendre une formation au Senegal en 2026" },
  { id: "sujets", label: "Choisir son sujet - ce qui se vend vraiment" },
  { id: "paiements", label: "Encaisser - Wave, Orange Money, carte" },
  { id: "fiscalite", label: "Le cadre fiscal du formateur freelance" },
  { id: "promotion", label: "Promouvoir ta formation - les canaux qui marchent" },
  { id: "lancement", label: "Lancer en 30 jours sans budget" },
  { id: "revenus", label: "Combien on peut gagner ? (chiffres reels)" },
  { id: "faq", label: "FAQ - les questions qu'on me pose tout le temps" },
] as const;

/* ─── FAQ data (utilisee pour le rendu ET le JSON-LD) ─────── */
const FAQ_ITEMS = [
  {
    q: "Faut-il un compte bancaire pour vendre une formation au Senegal ?",
    a: "Non. Au Senegal en 2026, un compte Wave ou Orange Money suffit largement pour commencer. Novakou verse directement tes gains sur ton numero Mobile Money. Le compte bancaire devient utile a partir d'environ 500 000 FCFA de chiffre d'affaires mensuel, quand tu veux ouvrir un compte pro a la SGBS, Ecobank ou BICIS pour structurer ta tresorerie.",
  },
  {
    q: "Quel est le prix moyen d'une formation vendue au Senegal ?",
    a: "Le ticket median sur le marche senegalais en 2026 se situe entre 15 000 et 35 000 FCFA pour une formation de 3 a 6 heures. Les formations premium (avec coaching, communaute privee, certificat) montent a 75 000 - 200 000 FCFA. Les mini-formations express (1h - 2h) se vendent autour de 5 000 - 12 000 FCFA. Plus le resultat est concret (decrocher un emploi, gagner un client, monter un business), plus tu peux monter en prix.",
  },
  {
    q: "Est-ce que je dois declarer mes revenus a la DGI ?",
    a: "Oui, des le premier FCFA encaisse. Le statut le plus simple au Senegal est l'auto-entrepreneur (Loi 2019-04). Tu te declares en ligne sur le portail DGI ou en agence, tu obtiens un NINEA, et tu paies un impot synthetique simplifie. Tant que tu restes sous le seuil de 25 millions FCFA de CA annuel, tu es exonere de TVA. Cet article est informatif - consulte un comptable agree pour ta situation precise.",
  },
  {
    q: "Wave ou Orange Money, lequel choisir pour encaisser ?",
    a: "Les deux, sans hesiter. Wave domine Dakar et les villes (frais zero ou tres bas, app moderne, transferts instantanes), Orange Money couvre mieux les zones rurales et la diaspora francophone. Novakou integre les deux par defaut : ton acheteur choisit, tu encaisses, tu recois ton solde en fin de cycle. Refuser l'un des deux, c'est se priver d'environ 30 a 40 pourcent du marche senegalais.",
  },
  {
    q: "Combien de temps avant ma premiere vente ? 🤔",
    a: "Avec la methode 30 jours decrite plus haut : entre 14 et 21 jours pour la premiere vente si tu as deja une petite audience WhatsApp (50 - 200 contacts). Sans audience, compte 45 a 60 jours - le temps de construire 500 abonnes Instagram ou TikTok. Les formateurs qui vont le plus vite sont ceux qui pre-vendent avant meme d'enregistrer le contenu.",
  },
  {
    q: "Faut-il un site web pour vendre une formation au Senegal ?",
    a: "Non, plus en 2026. Ta boutique Novakou (novakou.com/ton-pseudo) fait deja office de site : page de vente, paiement, livraison automatique, espace eleve. 80 pourcent des vendeurs senegalais sur Novakou ne possedent aucun site separe. Le seul cas ou un site dedie devient utile : si tu veux ranker sur Google avec du SEO de fond (blog, articles longs), mais cela vient plus tard.",
  },
  {
    q: "Puis-je vendre une formation depuis Thies, Saint-Louis ou Ziguinchor ?",
    a: "Bien sur. La vente de formation en ligne au Senegal n'est pas reservee a Dakar. Avec une connexion 4G correcte (Orange ou Free), un smartphone recent et un micro-cravate a 5 000 FCFA, tu produis la meme qualite qu'a Almadies. Plusieurs formateurs Novakou bases en region depassent 800 000 FCFA mensuels - leur avantage : couts de vie plus bas, donc rentabilite superieure.",
  },
  {
    q: "Comment eviter que ma formation soit piratee et partagee gratuitement ? 🔒",
    a: "Le risque zero n'existe pas, mais Novakou applique : streaming protege (videos non telechargeables), filigrane dynamique avec le mail de l'acheteur, lien personnalise par compte, blocage automatique si plusieurs IP simultanees. Reste vigilant sur Telegram et WhatsApp ou des groupes de revente existent. La meilleure defense : un service inclus (coaching, replays a jour, communaute) que le pirate ne peut pas copier.",
  },
] as const;

/* ═════════════════════════════════════════════════════════════ */
/* PAGE COMPONENT                                               */
/* ═════════════════════════════════════════════════════════════ */

export default function VendreFormationSenegalPage() {
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
              "Vendre une formation en ligne au Senegal en 2026 : le guide complet",
            description:
              "Le guide pratique pour vendre une formation en ligne au Senegal en 2026 : Wave, Orange Money, fiscalite freelance, lancement 30 jours et chiffres reels.",
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
              "https://novakou.com/guides/vendre-formation-senegal-2026",
            image: ogImageUrl,
            articleSection: "Guides vendeurs",
            wordCount: 2400,
            inLanguage: "fr",
            about: [
              { "@type": "Thing", name: "Vendre formation en ligne Senegal" },
              { "@type": "Thing", name: "Wave Senegal paiement" },
              { "@type": "Thing", name: "Orange Money formation" },
              { "@type": "Thing", name: "Fiscalite freelance Senegal" },
              { "@type": "Thing", name: "Auto-entrepreneur Senegal formation" },
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
                name: "Vendre une formation en ligne au Senegal en 2026",
                item: "https://novakou.com/guides/vendre-formation-senegal-2026",
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
              Guide Senegal
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
            <span style={{ color: C.primary }}>Senegal</span> en 2026 : le
            guide complet
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            Wave, Orange Money, fiscalite auto-entrepreneur, lancement en 30
            jours sans budget. Le guide pratique base sur les chiffres reels
            du marche senegalais et la methode des formateurs qui dechirent
            en 2026.
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
                Equipe Novakou - Dakar
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
            alt="Formatrice senegalaise enregistrant son cours en ligne depuis Dakar"
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
          Pourquoi le moment est unique au Senegal
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Le Senegal de 2026 vit une fenetre d&apos;opportunite rare. Avec
          plus de 17 millions d&apos;habitants, une mediane d&apos;age sous
          les 19 ans et un taux d&apos;equipement smartphone estime autour de
          70 pourcent dans les centres urbains, le terrain pour{" "}
          <strong>vendre une formation en ligne au Senegal</strong> n&apos;a
          jamais ete aussi favorable. La 4G couvre l&apos;ensemble du
          territoire urbain, la fibre arrive jusqu&apos;a Saly et Mbour,
          Wave et Orange Money ont normalise le paiement digital.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Dans le meme temps, la generation des 18 - 35 ans cherche
          activement a se former : marketing digital, programmation,
          entrepreneuriat, langues etrangeres, beaute, religion. Les ecoles
          classiques sont chers (250 000 a 2 millions FCFA l&apos;annee),
          souvent decalees des realites du marche, et n&apos;offrent ni
          flexibilite horaire ni accompagnement de pair. Ta formation en
          ligne, livree par Mobile Money, accessible depuis un smartphone,
          repond exactement a cette demande.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Ce guide te donne la methode integrale : choisir un sujet qui se
          vend a Dakar et en region, encaisser via Wave Senegal, gerer ta
          fiscalite freelance, promouvoir sans budget pub, lancer en 30
          jours et comprendre les revenus realistes. Tout est aligne sur le
          terrain senegalais de 2026, pas sur des recettes copiees du
          marche francais.
        </p>

        <MockupFrame title="Le marche de la formation digitale au Senegal en 2026">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { value: "17M+", label: "Population senegalaise" },
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
            Estimations 2026 - sources : ANSD, ARTP, GSMA Intelligence.
          </p>
        </MockupFrame>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #1 - CHOISIR SON SUJET                             */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="sujets" number="1">
          Choisir son sujet - ce qui se vend vraiment au Senegal
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tous les sujets ne se valent pas a Dakar. Le marche senegalais a
          ses preferences propres, structurees par la demographie jeune, la
          culture entrepreneuriale et la dimension religieuse. Voici les six
          niches qui generent le plus de{" "}
          <strong>vente formation digitale Dakar</strong> en 2026, classees
          par volume de recherche et taux de conversion observes sur
          Novakou.
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
          La niche n°1 au Senegal. Tout le monde veut apprendre a vendre
          sur Instagram, TikTok, WhatsApp Business. Sujets qui marchent :
          publicite Facebook ciblee Afrique, contenu Reels viral, tunnels
          de vente, copywriting pour vendeurs Dakar.
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
          Forte demande mais audience plus exigeante. Les sujets qui se
          vendent : developpement web (HTML/CSS/JavaScript, React), Python
          data, no-code (Bubble, Webflow), creation d&apos;applications
          mobiles. Le talent senegalais cible aussi le freelance
          international en EUR - reel levier de prix.
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
          clients freelance, comment encaisser en devises etrangeres, comment
          structurer son auto-entreprise senegalaise. Ces sujets convertissent
          tres bien car le resultat est mesurable.
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
          Cheveux afro, ongles, maquillage, soins de la peau noire, perte
          de poids, salle de sport a la maison. Audience massivement
          feminine, tres engagee sur Instagram et TikTok. Ticket moyen :
          12 000 a 35 000 FCFA, tres bonne recurrence.
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
          Apprentissage de la lecture du Coran, tajwid, hadiths, sciences
          islamiques, mais aussi predication chretienne pour les communautes
          minoritaires, developpement personnel inspire de la spiritualite
          locale. Audience tres loyale, faible churn.
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
          Anglais business pour expatriation et freelance international,
          arabe litteraire, espagnol (visa et migration), turc, mandarin.
          La diaspora francophone est aussi tres demandeuse de cours en
          ligne pour ses enfants. Ticket eleve quand combine avec un
          objectif precis (TOEFL, embauche).
        </p>

        <MockupFrame title="Prix moyens observes sur Novakou - Senegal 2026">
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
                  { type: "Marketing digital", low: "20 000 FCFA", high: "150 000 FCFA" },
                  { type: "Programmation web", low: "35 000 FCFA", high: "250 000 FCFA" },
                  { type: "Business / freelance", low: "25 000 FCFA", high: "180 000 FCFA" },
                  { type: "Beaute / bien-etre", low: "12 000 FCFA", high: "65 000 FCFA" },
                  { type: "Religion / spiritualite", low: "8 000 FCFA", high: "45 000 FCFA" },
                  { type: "Langues etrangeres", low: "18 000 FCFA", high: "120 000 FCFA" },
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
          formation est concret (decrocher un emploi, obtenir un visa,
          gagner X FCFA par mois, perdre Y kilos), plus ton ticket monte
          haut. Les formations &quot;decouverte&quot; vagues plafonnent
          autour de 15 000 FCFA, les formations &quot;transformation
          mesurable&quot; atteignent 100 000 - 300 000 FCFA.
        </TipBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #2 - ENCAISSER LES PAIEMENTS                       */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="paiements" number="2">
          Encaisser les paiements - Wave, Orange Money, carte
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est la pierre angulaire de ton business. Si ton acheteur
          galere a payer, il abandonne. Au Senegal en 2026, le paiement
          digital est domine par trois canaux qui doivent imperativement
          coexister sur ta page de vente.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Wave Senegal - le n°1
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Wave domine Dakar, Thies, Saint-Louis et toutes les villes
          intermediaires. L&apos;application est gratuite, les transferts
          entre particuliers sont quasi sans frais, l&apos;experience
          utilisateur est moderne. Pour un vendeur de formation, c&apos;est
          le moyen de paiement prefere des moins de 35 ans urbains.
          L&apos;integration{" "}
          <strong>Wave Senegal paiement</strong> sur Novakou est native :
          ton acheteur clique sur &quot;Payer avec Wave&quot;, scanne le QR
          ou saisit son numero, et la transaction se valide en quelques
          secondes.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Orange Money - couverture rurale et diaspora
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Orange Money reste le n°1 historique, particulierement fort en
          zones rurales (Tambacounda, Kolda, Matam) et dans la diaspora
          (Italie, Espagne, France). Les transferts internationaux entrants
          via Orange Money permettent a un cousin parisien d&apos;acheter
          la formation pour son neveu de Saint-Louis en quelques clics.
          Ne neglige jamais{" "}
          <strong>Orange Money formation</strong> comme canal -
          c&apos;est jusqu&apos;a 35 pourcent des paiements selon ta niche.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          MTN Mobile Money - secondaire au Senegal
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          MTN n&apos;est pas operateur natif au Senegal mais ton public
          comprend probablement des acheteurs basés en Cote d&apos;Ivoire,
          au Cameroun ou au Benin. Inclure MTN MoMo elargit naturellement
          ton marche a l&apos;Afrique francophone entiere sans effort
          marketing supplementaire.
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
          La diaspora et les acheteurs en Europe utilisent leurs Visa et
          Mastercard. Pour eux, Mobile Money est une friction. La carte
          bancaire est donc indispensable des que tu vises au-dela des
          frontieres senegalaises. Novakou prend en charge les paiements
          carte automatiquement, sans config supplementaire.
        </p>

        <MockupFrame title="Repartition typique des paiements - formateur senegalais 2026">
          <div className="space-y-3">
            {[
              { name: "Wave (Senegal urbain)", pct: 42, color: C.primary },
              { name: "Orange Money (national + diaspora)", pct: 31, color: "#f97316" },
              { name: "Carte bancaire (diaspora EU)", pct: 18, color: "#2563eb" },
              { name: "MTN MoMo (CI, CM, BJ)", pct: 9, color: "#7c3aed" },
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
          , Wave, Orange Money et carte bancaire sont actives par defaut.
          Tu n&apos;ouvres aucun compte marchand, aucun contrat, aucune
          API : nous gerons les flux pour toi et te reversons ton solde
          net par cycle. Tu peux te concentrer sur ton contenu et ton
          marketing.
        </ProTip>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #3 - FISCALITE                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="fiscalite" number="3">
          Le cadre fiscal du formateur freelance au Senegal
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Vendre une formation en ligne, c&apos;est un revenu, et un
          revenu se declare. Bonne nouvelle : le cadre senegalais a
          beaucoup simplifie les choses pour le freelance digital depuis
          la Loi 2019-04. Voici l&apos;essentiel a savoir sur la{" "}
          <strong>fiscalite freelance Senegal</strong> en 2026.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le statut auto-entrepreneur senegalais
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          C&apos;est le statut adapte pour 90 pourcent des formateurs
          digitaux qui demarrent. L&apos;
          <strong>auto-entrepreneur Senegal formation</strong> beneficie
          d&apos;une declaration simplifiee, d&apos;un impot synthetique
          unique remplaçant l&apos;IRPP et la patente, et d&apos;une
          comptabilite allegee. Inscription possible en ligne sur le
          portail DGI ou en agence (avec ta CNI et un justificatif
          d&apos;adresse). Tu obtiens un NINEA et un Registre du Commerce
          simplifie en quelques jours.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          Le seuil de 25 millions FCFA
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Tant que ton chiffre d&apos;affaires annuel reste sous 25
          millions FCFA (environ 38 000 EUR), tu es :
        </p>
        <ul
          className="text-[16px] leading-[1.8] mb-5 pl-6 list-disc"
          style={{ color: C.dark }}
        >
          <li>Exonere de TVA (pas besoin de la facturer ni de la reverser)</li>
          <li>Soumis a l&apos;impot synthetique simplifie (taux progressif)</li>
          <li>Dispense de tenir une comptabilite complete</li>
          <li>Autorise a emettre des factures simplifiees</li>
        </ul>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au-dela de 25 millions FCFA, tu passes au regime du reel et tu
          dois t&apos;immatriculer a la TVA. A ce stade, un comptable
          devient indispensable.
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          IRPP simplifie - ce que tu paies vraiment
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          L&apos;impot synthetique se calcule par tranches. Pour donner
          un ordre d&apos;idee : un formateur qui realise 5 millions FCFA
          de CA annuel paie en general autour de 250 000 a 400 000 FCFA
          d&apos;impot total (selon ses charges deductibles). C&apos;est
          significativement moins que le regime classique de l&apos;IS.
          Reste a payer la CSS (Caisse de Securite Sociale) si tu y
          adheres volontairement - fortement conseille pour la protection.
        </p>

        <WarnBox>
          <strong>Avertissement :</strong> Cet article est purement
          informatif. La fiscalite evolue, ta situation personnelle est
          unique, et un mauvais choix peut couter cher.{" "}
          <strong>
            Consulte imperativement un comptable agree (Ordre des Experts
            Comptables du Senegal) ou un fiscaliste avant de finaliser
            ton statut.
          </strong>{" "}
          Le ticket moyen d&apos;un comptable a Dakar pour le setup
          initial : 50 000 a 150 000 FCFA. Un investissement qui se
          rentabilise des la premiere annee.
        </WarnBox>

        {/* ════════════════════════════════════════════════════════ */}
        {/*  H2 #4 - PROMOTION                                     */}
        {/* ════════════════════════════════════════════════════════ */}
        <SectionHeading id="promotion" number="4">
          Promouvoir ta formation - les canaux qui marchent au Senegal
        </SectionHeading>

        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Au Senegal, le mix marketing pour vendre une formation digitale
          est radicalement different du marche europeen. Oublie les Ads
          Google ou la newsletter LinkedIn comme canal principal. La
          realite terrain en 2026 :
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
          Au Senegal, WhatsApp n&apos;est pas une app, c&apos;est
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
            (cuisine, beaute, business)
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
          Instagram Reels - la generation Z
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Pour toucher les 18 - 28 ans urbains, Instagram domine. Les
          Reels (videos courtes 30 - 60s) sont l&apos;algorithme le plus
          genereux en 2026 : un compte de 200 abonnes peut faire 10 000
          vues en quelques jours sur un sujet niche. Vise 3 a 5 Reels par
          semaine, ton de proximite, hashtags localises (#Dakar
          #Senegal227 #FormatricesAfricaines).
        </p>

        <h3
          className="text-xl font-bold mt-10 mb-4"
          style={{ ...SH, color: C.dark }}
        >
          TikTok - explosion silencieuse
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Sous-utilise par les vendeurs senegalais en 2026, donc enorme
          opportunite. L&apos;algorithme TikTok est le plus accueillant
          pour les debutants : ton premier post peut faire 50 000 vues
          sans abonne. Cible ton contenu sur des micro-niches precises
          (par exemple &quot;comptabilite Senegal pour debutants&quot;
          plutot que &quot;comptabilite&quot;).
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
          Si ta formation cible des entreprises, des cadres ou des
          freelances qualifies (developpement, finance, RH, conseil),
          LinkedIn est ton terrain. Public plus reduit mais ticket moyen
          beaucoup plus eleve (souvent 75 000 - 300 000 FCFA).
        </p>

        <WarnBox>
          <strong>Pourquoi pas la pub Facebook au depart :</strong> les
          enchères publicitaires Facebook Ads au Senegal ont monte
          significativement depuis 2024. Pour un freelance debutant sans
          tunnel de vente teste, le ROI est negatif 7 fois sur 10. Reserve
          ce canal pour une phase 2, quand tu as deja vendu naturellement
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
          a 500 000 FCFA en un mois. Quatre semaines, quatre missions
          claires, zero euro de budget pub.
        </p>

        <MockupFrame title="Plan 30 jours pour vendre formation en ligne Senegal">
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
                desc: "Liste de 10 testeurs proches (amis, collegues, contacts WhatsApp). Offre pre-lancement a -50 %. Objectif : 5 pre-ventes payees = validation marche.",
              },
              {
                week: "Semaine 3",
                focus: "Lancement public",
                desc: "Boutique Novakou en ligne. 5 Reels Instagram + 7 stories WhatsApp Business + 1 post LinkedIn. Annonce officielle a ta communaute avec offre limitee 72h.",
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
          <strong>Le moment cle :</strong> jour 21 du plan, soit dimanche
          soir / lundi matin de la semaine 3. C&apos;est ce moment precis
          que tu envoies ton message d&apos;ouverture sur tous tes canaux
          en meme temps. La synchronisation cree un effet de masse qui
          declenche les premieres ventes spontanees.
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
          observees chez les formateurs Novakou bases au Senegal en 2026.
          Pas des promesses : la moyenne du terrain, hors top 1 pourcent.
        </p>

        <MockupFrame title="Revenus mensuels par niveau - formateur senegalais 2026">
          <div className="space-y-4">
            {[
              {
                level: "Debutant (0-6 mois)",
                range: "50 000 - 150 000 FCFA",
                desc: "1 a 5 ventes par semaine, ticket moyen 15 - 25K FCFA. Pas encore d'audience etablie, beaucoup de prospection manuelle WhatsApp.",
                color: "#22c55e",
              },
              {
                level: "Intermediaire (6-18 mois)",
                range: "300 000 - 800 000 FCFA",
                desc: "Audience Instagram 2K - 10K, sequences email actives, 1 a 3 formations dans le catalogue, debut de recurrence (communaute privee).",
                color: "#2563eb",
              },
              {
                level: "Avance (1.5 ans+)",
                range: "1 500 000 - 5 000 000 FCFA+",
                desc: "Catalogue de 4 a 8 produits, tunnel de vente automatise, programme d'affiliation actif, 1 a 2 lancements signature par an. Vrais entrepreneurs.",
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
          Cas pratique - Awa Diop, 27 ans, formatrice marketing digital
        </h3>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          Awa habite a Mermoz, Dakar. Diplomee de Sup&apos;Imax, elle a
          travaille 3 ans en agence digitale avant de basculer formatrice
          en mars 2026. Son catalogue : une formation cle &quot;Lancer ton
          business Instagram en Afrique francophone&quot; a 35 000 FCFA,
          un ebook a 9 000 FCFA, une communaute WhatsApp Premium a 5 000
          FCFA/mois.
        </p>
        <p
          className="text-[16px] leading-[1.8] mb-5"
          style={{ color: C.dark }}
        >
          En septembre 2026, son chiffre d&apos;affaires mensuel atteint
          1 230 000 FCFA. Repartition : 65 pourcent ventes de la formation
          principale, 18 pourcent ebook (souvent upsell), 17 pourcent
          abonnements communaute. Apres impot synthetique et commissions
          Novakou, il lui reste environ 950 000 FCFA nets - presque 3 fois
          son salaire d&apos;agence precedent, pour 25 heures de travail
          hebdomadaires. Profil fictif mais entierement aligne sur les
          metriques observees.
        </p>

        <ProTip>
          <strong>Le secret du passage 300K → 1M FCFA :</strong>{" "}
          construire un catalogue. Une seule formation, meme excellente,
          plafonne. Ajoute un ebook d&apos;entree de gamme (9 - 12K FCFA),
          un upsell premium (coaching individuel 75 - 150K FCFA), une
          communaute privee recurrente (5 - 15K FCFA/mois). Le panier moyen
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
          Instagram et les WhatsApp de l&apos;equipe Novakou Dakar.
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
            Pret a lancer ta boutique de formation au Senegal ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Inscription gratuite en 3 minutes. Wave, Orange Money, carte
            bancaire et MTN MoMo actives par defaut. Ta premiere vente peut
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
                desc: "Wave, Orange Money, MTN MoMo : tout sur l'encaissement digital en Afrique francophone.",
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
