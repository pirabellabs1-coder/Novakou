import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title:
    "Publicité Facebook pour vendre ses formations en Afrique | Guide complet 2026 · Novakou",
  description:
    "Comment créer des publicités Facebook rentables pour vendre vos formations en ligne en Afrique francophone. Ciblage, budgets, audiences, pixel Facebook — tout expliqué.",
  keywords: [
    "publicité Facebook Afrique",
    "Facebook Ads formations en ligne",
    "ciblage Facebook Sénégal Côte d'Ivoire",
    "Meta Ads Afrique francophone",
    "vendre formations Facebook",
    "budget Facebook Ads FCFA",
  ],
  openGraph: {
    title:
      "Publicité Facebook pour vendre ses formations en Afrique | Guide complet 2026 · Novakou",
    description:
      "Comment créer des publicités Facebook rentables pour vendre vos formations en ligne en Afrique francophone. Ciblage, budgets, audiences, pixel Facebook — tout expliqué.",
    type: "article",
  },
};

/* ─── Typography ─── */
const S = {
  fontFamily:
    "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
const SH = { ...S, fontWeight: 700, letterSpacing: "-0.04em" } as const;

/* ─── Palette ─── */
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

/* ─── Helpers ─── */

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
      <span style={{ color: C.dark }}>Publicité Facebook</span>
    </nav>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 my-8 border"
      style={{ ...S, backgroundColor: C.tipBg, borderColor: C.tipBorder, color: C.dark }}
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
      style={{ ...S, backgroundColor: C.warnBg, borderColor: C.warnBorder, color: C.dark }}
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
      style={{ ...S, backgroundColor: C.proBg, borderColor: C.proBorder, color: C.dark }}
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
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: C.accent }} />
        <span className="ml-3 text-xs font-medium" style={{ ...S, color: C.muted }}>
          {title}
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

/* ─── TOC ─── */
const TOC = [
  { id: "introduction", label: "Facebook Ads en Afrique francophone en 2026" },
  { id: "gestionnaire", label: "Comprendre le Gestionnaire de publicités Meta" },
  { id: "structure", label: "Structure d'une campagne : Campagne → Ensemble → Publicité" },
  { id: "pixel", label: "Le Pixel Facebook : installation et utilisation" },
  { id: "ciblage-geo", label: "Ciblage géographique — Les pays qui convertissent le mieux" },
  { id: "audiences", label: "Ciblage par intérêts, audiences froides et sosies" },
  { id: "types-campagnes", label: "Les types de campagnes (Notoriété, Trafic, Conversions)" },
  { id: "creer-pub", label: "Créer la publicité parfaite : visuel + texte + CTA" },
  { id: "budgets", label: "Budgets : commencer avec 2 000 FCFA/jour" },
  { id: "analyser", label: "Analyser et optimiser (CPM, CPC, CTR, ROAS)" },
  { id: "erreurs", label: "Les 5 erreurs à éviter absolument" },
  { id: "cas-pratique", label: "Cas pratique : Campagne pour une formation à 25 000 FCFA" },
] as const;

/* ═══════════════════════════════════════ */
/* PAGE                                    */
/* ═══════════════════════════════════════ */

export default function PubliciteFacebookPage() {
  return (
    <div style={{ backgroundColor: C.surface, color: C.dark, ...S }}>
      {/* HERO */}
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
              Guide complet
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              16 min de lecture
            </span>
            <span className="text-sm" style={{ color: C.muted }}>
              Mis à jour le 25 avril 2026
            </span>
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-6"
            style={{ ...SH, color: C.dark }}
          >
            Publicité Facebook pour vendre ses{" "}
            <span style={{ color: C.primary }}>formations en Afrique</span>
          </h1>

          <p
            className="text-lg leading-relaxed mb-8 max-w-2xl"
            style={{ color: C.muted }}
          >
            Le guide complet pour créer des campagnes Facebook rentables et vendre
            vos formations en ligne en Afrique francophone. Ciblage, budgets,
            audiences, pixel — tout expliqué pour le marché africain.
          </p>

          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: C.primary }}
            >
              N
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: C.dark }}>
                Équipe Novakou
              </p>
              <p className="text-xs" style={{ color: C.muted }}>
                Guides et ressources pour les créateurs africains
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED IMAGE */}
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 pb-2">
        <div className="rounded-2xl overflow-hidden shadow-sm">
          <Image
            src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1200&q=80"
            alt="Interface Facebook Ads Manager — créer une campagne publicitaire"
            width={1200}
            height={500}
            className="w-full object-cover"
            style={{ maxHeight: 460 }}
            priority
          />
        </div>
        <div
          className="px-5 py-3 text-xs text-center rounded-b-2xl"
          style={{ backgroundColor: C.surfaceLow, color: C.muted, ...S }}
        >
          Le Gestionnaire de publicités Meta permet de cibler précisément votre audience en Afrique francophone.
        </div>
      </div>

      {/* BODY */}
      <section className="max-w-[860px] mx-auto px-6 pb-32">
        {/* TOC */}
        <div
          className="rounded-2xl p-6 sm:p-8 mb-16 mt-10 border"
          style={{ backgroundColor: C.white, borderColor: C.surfaceHigh }}
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

        {/* ════════════ SECTION 1 ════════════ */}
        <SectionHeading id="introduction">
          Facebook Ads en Afrique francophone en 2026
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Facebook est le réseau social dominant en Afrique francophone. Avec
          plus de 200 millions d&apos;utilisateurs actifs dans les 20 principaux
          pays francophones d&apos;Afrique, c&apos;est sans conteste la plateforme
          publicitaire la plus puissante pour toucher votre audience cible, qu&apos;il
          s&apos;agisse d&apos;entrepreneurs au Sénégal, de professionnels en Côte
          d&apos;Ivoire, de jeunes diplômés au Cameroun ou de femmes entrepreneures
          au Bénin.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La grande opportunité en 2026 : le coût de la publicité Facebook en
          Afrique reste significativement inférieur aux marchés occidentaux. Un
          CPM (coût pour mille impressions) de 200 à 600 FCFA est courant dans
          plusieurs pays africains, contre 3 000 à 8 000 FCFA en France ou en
          Belgique. Cela signifie que pour le même budget, vous toucherez 5 à 15
          fois plus de personnes. C&apos;est un avantage structurel massif pour
          les créateurs qui commencent avec des petits budgets.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Cependant, Facebook Ads reste complexe pour les débutants. Il existe
          des dizaines de paramètres à configurer, et une mauvaise configuration
          peut faire disparaître votre budget sans générer une seule vente. Ce
          guide vous donne une méthode claire, étape par étape, pour créer vos
          premières campagnes rentables avec un budget de départ aussi faible
          que 2 000 FCFA par jour.
        </p>

        <MockupFrame title="Statistiques Facebook Ads — Afrique francophone 2026">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { value: "200M+", label: "Utilisateurs actifs", sub: "Afrique francophone" },
              { value: "200–600", label: "FCFA CPM moyen", sub: "Vs 4 000+ en Europe" },
              { value: "18–35 ans", label: "Tranche la plus active", sub: "Sur mobile" },
              { value: "92%", label: "Accès via mobile", sub: "Afrique subsaharienne" },
            ].map((s) => (
              <div key={s.label} className="py-3">
                <p className="text-2xl font-bold mb-1" style={{ ...SH, color: C.primary }}>
                  {s.value}
                </p>
                <p className="text-xs font-semibold" style={{ color: C.dark }}>
                  {s.label}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 2 ════════════ */}
        <SectionHeading id="gestionnaire" number="1">
          Comprendre le Gestionnaire de publicités Meta
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Le Gestionnaire de publicités Meta (anciennement Facebook Ads Manager)
          est l&apos;interface centrale depuis laquelle vous créez, gérez et
          analysez toutes vos campagnes publicitaires sur Facebook et Instagram.
          Pour y accéder, rendez-vous sur business.facebook.com et créez un
          compte Business Manager si ce n&apos;est pas déjà fait.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La première étape est de créer votre page Facebook professionnelle si
          vous n&apos;en avez pas encore. Cette page sera l&apos;identité
          publique de votre activité de créateur. Choisissez un nom clair,
          ajoutez une photo de profil professionnelle et une photo de couverture
          attrayante. Remplissez complètement la description avec vos
          coordonnées et votre site web (votre boutique Novakou).
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Ensuite, créez un compte publicitaire dans le Business Manager. Vous
          devrez renseigner votre devise (FCFA pour les pays d&apos;Afrique de
          l&apos;Ouest, XAF pour l&apos;Afrique centrale), votre fuseau horaire
          et votre méthode de paiement. Facebook accepte les cartes Visa et
          Mastercard, ainsi que PayPal. Pour les créateurs africains sans carte
          internationale, une solution consiste à utiliser une carte prépayée
          Visa virtuelle (disponible chez certaines banques et fintechs locales).
        </p>

        <MockupFrame title="business.facebook.com — Vue d'ensemble du Gestionnaire">
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: "📊", label: "Aperçu du compte", active: false },
                { icon: "🎯", label: "Campagnes", active: true },
                { icon: "📦", label: "Ensembles de publicités", active: false },
                { icon: "🖼️", label: "Publicités", active: false },
              ].map((tab) => (
                <div
                  key={tab.label}
                  className="p-3 rounded-lg text-center text-xs border"
                  style={{
                    backgroundColor: tab.active ? C.primary : C.surfaceLow,
                    borderColor: tab.active ? C.primary : C.surfaceHigh,
                    color: tab.active ? C.white : C.dark,
                  }}
                >
                  <div className="text-lg mb-1">{tab.icon}</div>
                  <div className="font-medium">{tab.label}</div>
                </div>
              ))}
            </div>
            <div
              className="p-4 rounded-xl border"
              style={{ borderColor: C.surfaceHigh }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold" style={{ color: C.dark }}>
                  Campagnes actives
                </p>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: C.primary }}
                >
                  + Créer
                </span>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Formation Marketing Digital — Conversions", status: "Active", spend: "12 450 FCFA" },
                  { name: "Notoriété — Audience froide CI+SN", status: "Active", spend: "6 200 FCFA" },
                ].map((campaign) => (
                  <div
                    key={campaign.name}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: C.surfaceLow }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: C.dark }}>
                        {campaign.name}
                      </p>
                      <p className="text-xs" style={{ color: C.muted }}>
                        Dépensé aujourd&apos;hui : {campaign.spend}
                      </p>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: C.accent }}
                    >
                      {campaign.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 3 ════════════ */}
        <SectionHeading id="structure" number="2">
          Structure d&apos;une campagne : Campagne &rarr; Ensemble &rarr; Publicité
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La structure d&apos;une campagne Facebook est hiérarchique et comprend
          trois niveaux distincts. Comprendre cette hiérarchie est fondamental
          avant de créer votre première campagne. Chaque niveau a un rôle précis,
          et la configuration de chacun détermine l&apos;efficacité globale de
          votre publicité.
        </p>

        <MockupFrame title="Structure d'une campagne Meta Ads">
          <div className="space-y-3">
            {[
              {
                level: "Niveau 1 — CAMPAGNE",
                role: "Définit l'OBJECTIF global",
                examples: "Conversions, Trafic, Notoriété, Prospects",
                color: C.primary,
                bg: C.tipBg,
                icon: "🎯",
              },
              {
                level: "Niveau 2 — ENSEMBLE DE PUBLICITÉS",
                role: "Définit QUI vous ciblez et COMBIEN vous dépensez",
                examples: "Audience, géographie, budget, calendrier, placement",
                color: "#2563eb",
                bg: "#eff6ff",
                icon: "🎪",
              },
              {
                level: "Niveau 3 — PUBLICITÉ",
                role: "Définit CE QUE voient vos prospects",
                examples: "Visuel (image/vidéo), titre, texte principal, CTA, URL",
                color: "#7c3aed",
                bg: "#f5f3ff",
                icon: "🖼️",
              },
            ].map((level) => (
              <div
                key={level.level}
                className="p-4 rounded-xl border"
                style={{ backgroundColor: level.bg, borderColor: level.color + "44" }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{level.icon}</span>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: level.color }}>
                      {level.level}
                    </p>
                    <p className="text-sm font-semibold mb-1" style={{ color: C.dark }}>
                      {level.role}
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Configure ici : {level.examples}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div
              className="p-3 rounded-xl text-xs text-center font-medium"
              style={{ backgroundColor: C.surfaceLow, color: C.muted }}
            >
              Une campagne peut contenir plusieurs ensembles de publicités, chacun ciblant une audience différente.
            </div>
          </div>
        </MockupFrame>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Pour vendre une formation, vous choisirez généralement l&apos;objectif
          &quot;Conversions&quot; au niveau campagne (pour inciter à l&apos;achat),
          ou &quot;Trafic&quot; (pour envoyer des gens vers votre page de vente).
          Au niveau de l&apos;ensemble, vous définirez votre audience et votre
          budget quotidien. Au niveau publicité, vous créerez les visuels et
          les textes qui donneront envie à vos prospects de cliquer.
        </p>

        <TipBox>
          <strong>Bonne pratique structurelle :</strong> Pour commencer, créez
          une seule campagne avec 2 à 3 ensembles de publicités ciblant des
          audiences légèrement différentes (ex : Sénégal vs Côte d&apos;Ivoire,
          ou intérêt &quot;marketing&quot; vs intérêt &quot;entrepreneuriat&quot;).
          Pour chaque ensemble, créez 2 publicités avec des visuels différents.
          Cela vous permettra de tester rapidement ce qui fonctionne.
        </TipBox>

        {/* ════════════ SECTION 4 ════════════ */}
        <SectionHeading id="pixel" number="3">
          Le Pixel Facebook : installation et utilisation
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Le Pixel Meta (anciennement Pixel Facebook) est un petit bout de code
          JavaScript que vous installez sur votre site web ou votre boutique
          Novakou. Ce code invisible suit les actions des visiteurs : qui visite
          votre page de vente, qui ajoute au panier, qui achète. Ces données
          sont ensuite utilisées par Facebook pour optimiser vos campagnes et
          cibler des personnes similaires à vos acheteurs.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Le Pixel est <strong>absolument essentiel</strong> pour les campagnes
          de conversion. Sans lui, Facebook ne sait pas qui a acheté sur votre
          site et ne peut pas optimiser ses algorithmes pour vous trouver plus
          d&apos;acheteurs. Avec un Pixel bien configuré, votre coût par achat
          peut diminuer de 40 à 60 % après quelques semaines de données collectées.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Sur Novakou, l&apos;intégration du Pixel Meta est native. Dans votre
          tableau de bord, accédez à Paramètres &rarr; Intégrations &rarr; Meta Pixel.
          Copiez votre ID de Pixel depuis votre Gestionnaire d&apos;événements
          Meta et collez-le dans le champ correspondant. Novakou configurera
          automatiquement les événements standards : PageView (chaque visite),
          ViewContent (vue de votre page de vente), InitiateCheckout (début
          de paiement) et Purchase (achat confirmé).
        </p>

        <MockupFrame title="Novakou — Intégration Pixel Meta (Paramètres)">
          <div className="space-y-4 max-w-md mx-auto">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: C.surfaceLow }}>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: "#1877f2" }}
              >
                f
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: C.dark }}>
                  Meta Pixel
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  Suivi des conversions et audiences personnalisées
                </p>
              </div>
              <span
                className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: C.accent }}
              >
                Connecté
              </span>
            </div>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: C.muted }}>
                Votre ID Pixel Meta
              </p>
              <div
                className="h-10 rounded-lg border px-3 flex items-center text-sm font-mono"
                style={{ borderColor: C.accent, color: C.dark }}
              >
                1234567890123456
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: C.muted }}>
                Événements trackés automatiquement
              </p>
              {[
                { event: "PageView", desc: "Chaque visite de votre boutique" },
                { event: "ViewContent", desc: "Vue d'une page de formation" },
                { event: "InitiateCheckout", desc: "Début du processus de paiement" },
                { event: "Purchase", desc: "Achat confirmé" },
              ].map((e) => (
                <div
                  key={e.event}
                  className="flex items-center gap-3 p-2.5 rounded-lg"
                  style={{ backgroundColor: C.surfaceLow }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: C.accent }}
                  />
                  <span className="text-xs font-mono font-bold" style={{ color: C.primary }}>
                    {e.event}
                  </span>
                  <span className="text-xs" style={{ color: C.muted }}>
                    — {e.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 5 ════════════ */}
        <SectionHeading id="ciblage-geo" number="4">
          Ciblage géographique — Les pays qui convertissent le mieux
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Le ciblage géographique est l&apos;une des décisions les plus
          importantes de votre campagne. Tous les pays africains ne se valent
          pas en termes de pouvoir d&apos;achat, de pénétration mobile et de
          culture d&apos;achat de formations en ligne. Voici les données
          essentielles pour optimiser votre ciblage.
        </p>

        <div className="rounded-2xl overflow-hidden my-8 shadow-sm">
          <Image
            src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=900&q=80"
            alt="Analytics et données de ciblage pour les publicités Facebook"
            width={900}
            height={420}
            className="w-full object-cover"
          />
          <div
            className="px-5 py-3 text-xs text-center"
            style={{ backgroundColor: C.surfaceLow, color: C.muted, ...S }}
          >
            Analysez vos données de performance par pays pour concentrer votre budget là où il convertit le mieux.
          </div>
        </div>

        <MockupFrame title="Classement des pays par potentiel de conversion — Formations 2026">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: C.dark }}>
              <thead>
                <tr style={{ backgroundColor: C.surfaceLow }}>
                  <th className="text-left p-3 font-semibold rounded-tl-lg">Pays</th>
                  <th className="text-left p-3 font-semibold">CPM moyen</th>
                  <th className="text-left p-3 font-semibold">Pouvoir d&apos;achat</th>
                  <th className="text-left p-3 font-semibold">Recommandation</th>
                  <th className="text-left p-3 font-semibold rounded-tr-lg">Score</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    pays: "Sénégal",
                    cpm: "350–600 FCFA",
                    pouvoir: "Moyen-élevé",
                    reco: "Budget principal",
                    score: "⭐⭐⭐⭐⭐",
                    highlight: true,
                  },
                  {
                    pays: "Côte d'Ivoire",
                    cpm: "300–550 FCFA",
                    pouvoir: "Élevé",
                    reco: "Budget principal",
                    score: "⭐⭐⭐⭐⭐",
                    highlight: true,
                  },
                  {
                    pays: "Cameroun",
                    cpm: "250–450 FCFA",
                    pouvoir: "Moyen",
                    reco: "Bon volume",
                    score: "⭐⭐⭐⭐",
                    highlight: false,
                  },
                  {
                    pays: "Bénin",
                    cpm: "200–400 FCFA",
                    pouvoir: "Moyen",
                    reco: "Bon ROI",
                    score: "⭐⭐⭐⭐",
                    highlight: false,
                  },
                  {
                    pays: "Burkina Faso",
                    cpm: "150–300 FCFA",
                    pouvoir: "Moyen-bas",
                    reco: "Volume important",
                    score: "⭐⭐⭐",
                    highlight: false,
                  },
                  {
                    pays: "Mali",
                    cpm: "150–280 FCFA",
                    pouvoir: "Bas",
                    reco: "Test seulement",
                    score: "⭐⭐",
                    highlight: false,
                  },
                  {
                    pays: "France (diaspora)",
                    cpm: "2 500–5 000 FCFA",
                    pouvoir: "Très élevé",
                    reco: "Budget séparé",
                    score: "⭐⭐⭐⭐⭐",
                    highlight: true,
                  },
                ].map((row, idx) => (
                  <tr
                    key={row.pays}
                    style={{
                      backgroundColor: row.highlight
                        ? C.tipBg
                        : idx % 2 === 0
                        ? C.white
                        : C.surfaceLow,
                    }}
                  >
                    <td className="p-3 font-semibold">{row.pays}</td>
                    <td className="p-3 text-xs" style={{ color: C.muted }}>
                      {row.cpm}
                    </td>
                    <td className="p-3 text-xs">{row.pouvoir}</td>
                    <td
                      className="p-3 text-xs font-semibold"
                      style={{ color: row.highlight ? C.primary : C.dark }}
                    >
                      {row.reco}
                    </td>
                    <td className="p-3 text-xs">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MockupFrame>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La diaspora africaine en France, en Belgique, au Canada et aux États-Unis
          représente une audience souvent négligée mais extrêmement solvable. Ces
          personnes ont un fort attachement à la culture africaine, un pouvoir
          d&apos;achat en devises fortes, et cherchent souvent des contenus de
          formation qui comprennent leur identité et leur contexte. Un ciblage
          &quot;Origines africaines + France + Marketing&quot; peut générer des
          conversions à des prix 3 à 5 fois plus élevés que le marché local.
        </p>

        <ProTip>
          <strong>Stratégie géographique avancée :</strong> Créez des ensembles
          de publicités séparés pour chaque zone géographique. Ne mixez jamais
          le Sénégal et la France dans le même ensemble : les CPM sont trop
          différents, et votre budget sera dépensé majoritairement dans le pays
          le moins cher, pas forcément le plus rentable. Un ensemble par zone
          vous donne le contrôle total de votre allocation budgétaire.
        </ProTip>

        {/* ════════════ SECTION 6 ════════════ */}
        <SectionHeading id="audiences" number="5">
          Audiences froides, chaudes et sosies
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Facebook distingue trois types d&apos;audiences, chacun correspondant
          à une étape différente du parcours d&apos;achat de votre prospect.
          Comprendre ces trois types et savoir quand les utiliser est la clé
          d&apos;une stratégie publicitaire rentable.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Audiences froides :</strong> Ce sont des personnes qui ne vous
          connaissent pas encore. Vous les ciblez par intérêts, comportements ou
          données démographiques. Par exemple : &quot;Femmes, 25–40 ans, Côte
          d&apos;Ivoire, intéressées par l&apos;entrepreneuriat et le business
          en ligne.&quot; C&apos;est le point d&apos;entrée de votre entonnoir
          publicitaire. Le message doit être éducatif et créer de l&apos;intérêt,
          pas forcer la vente immédiate.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Audiences chaudes :</strong> Ce sont des personnes qui ont
          déjà interagi avec vous. Elles ont visité votre page, regardé une
          de vos vidéos, aimé votre page Facebook, cliqué sur une publicité
          précédente. Ces audiences sont créées via votre Pixel Meta et sont
          significativement plus proches de l&apos;achat. Un retargeting bien
          configuré vers ces audiences peut générer un ROAS (retour sur
          investissement publicitaire) 3 à 8 fois supérieur aux campagnes froides.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          <strong>Audiences sosies (Lookalike) :</strong> Facebook analyse les
          caractéristiques de vos acheteurs existants ou de vos meilleurs prospects
          et trouve des personnes similaires dans la population cible. Une audience
          sosie à 1 % (les personnes les plus similaires à votre source) est
          souvent la plus performante. Pour créer un sosie pertinent, vous avez
          besoin d&apos;au moins 100 personnes dans votre audience source, idéalement
          500 à 1 000.
        </p>

        <MockupFrame title="Meta Ads — Création d'une audience personnalisée">
          <div className="space-y-4">
            <p className="text-sm font-bold" style={{ color: C.dark }}>
              Créer une audience personnalisée basée sur :
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🌐", label: "Visiteurs du site web", active: true },
                { icon: "📹", label: "Vues de vidéos", active: false },
                { icon: "👍", label: "Interactions Page Facebook", active: false },
                { icon: "📋", label: "Liste de clients (emails)", active: false },
              ].map((opt) => (
                <div
                  key={opt.label}
                  className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer"
                  style={{
                    borderColor: opt.active ? C.primary : C.surfaceHigh,
                    backgroundColor: opt.active ? C.tipBg : C.surfaceLow,
                  }}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <p
                    className="text-xs font-medium"
                    style={{ color: opt.active ? C.primary : C.dark }}
                  >
                    {opt.label}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="p-3 rounded-xl border"
              style={{ borderColor: C.accent, backgroundColor: C.tipBg }}
            >
              <p className="text-xs font-bold mb-2" style={{ color: C.primary }}>
                Visiteurs de votre page de vente — Derniers 30 jours
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: C.surfaceHigh }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: "65%", backgroundColor: C.accent }}
                  />
                </div>
                <span className="text-xs font-bold" style={{ color: C.primary }}>
                  1 240 personnes
                </span>
              </div>
            </div>
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 7 ════════════ */}
        <SectionHeading id="types-campagnes" number="6">
          Les types de campagnes : Notoriété, Trafic, Conversions
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          L&apos;objectif de campagne que vous choisissez détermine ce que
          Facebook cherche à optimiser. Choisir le mauvais objectif est l&apos;une
          des erreurs les plus coûteuses que font les débutants. Voici quand
          utiliser chaque type.
        </p>

        <MockupFrame title="Choisir son objectif de campagne">
          <div className="space-y-4">
            {[
              {
                obj: "Notoriété",
                icon: "📢",
                color: "#f59e0b",
                quand: "Lancement d'une nouvelle formation, construire une audience",
                kpi: "CPM, portée, impressions",
                budget: "2 000–5 000 FCFA/jour",
                conseil: "Idéal pour vous faire connaître dans une nouvelle niche",
              },
              {
                obj: "Trafic",
                icon: "🚦",
                color: "#2563eb",
                quand: "Envoyer des visiteurs vers votre page de vente ou blog",
                kpi: "CPC, CTR, sessions",
                budget: "3 000–8 000 FCFA/jour",
                conseil: "Utile sans Pixel, mais moins optimisé que les conversions",
              },
              {
                obj: "Leads",
                icon: "📋",
                color: "#7c3aed",
                quand: "Collecter des emails avant de vendre (lead magnet)",
                kpi: "Coût par lead, taux de remplissage",
                budget: "2 000–6 000 FCFA/jour",
                conseil: "Excellent pour construire une liste email qualifiée",
              },
              {
                obj: "Conversions",
                icon: "💰",
                color: C.primary,
                quand: "Vendre directement votre formation (Pixel requis)",
                kpi: "ROAS, coût par achat, valeur de conversion",
                budget: "5 000–15 000 FCFA/jour",
                conseil: "L'objectif à utiliser dès que vous avez 50+ événements Pixel",
              },
            ].map((item) => (
              <div
                key={item.obj}
                className="flex items-start gap-4 p-4 rounded-xl border"
                style={{ borderColor: item.color + "33" }}
              >
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.obj}
                    </span>
                  </div>
                  <p className="text-sm mb-1" style={{ color: C.dark }}>
                    <strong>Quand l&apos;utiliser :</strong> {item.quand}
                  </p>
                  <p className="text-xs mb-1" style={{ color: C.muted }}>
                    <strong>KPIs clés :</strong> {item.kpi}
                  </p>
                  <p className="text-xs mb-1" style={{ color: C.muted }}>
                    <strong>Budget recommandé :</strong> {item.budget}
                  </p>
                  <p className="text-xs italic" style={{ color: item.color }}>
                    {item.conseil}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </MockupFrame>

        <WarnBox>
          <strong>L&apos;erreur de l&apos;objectif &quot;Conversions&quot; trop tôt :</strong> Facebook
          a besoin d&apos;au moins 50 événements de conversion par semaine pour
          optimiser efficacement une campagne &quot;Conversions&quot;. Si vous
          commencez avec peu de données Pixel, utilisez d&apos;abord
          l&apos;objectif &quot;Trafic&quot; ou &quot;Leads&quot; pour alimenter
          le Pixel, puis passez aux &quot;Conversions&quot; une fois les 50
          événements atteints.
        </WarnBox>

        {/* ════════════ SECTION 8 ════════════ */}
        <SectionHeading id="creer-pub" number="7">
          Créer la publicité parfaite : visuel + texte + CTA
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La qualité de votre publicité — visuel et texte — détermine votre
          taux de clic (CTR) et, par extension, votre coût par résultat. Une
          excellente publicité peut coûter 3 à 5 fois moins cher qu&apos;une
          publicité médiocre pour le même résultat, simplement parce que Facebook
          récompense les contenus que les utilisateurs apprécient et avec lesquels
          ils interagissent.
        </p>

        <h3 className="text-xl font-bold mt-10 mb-4" style={{ ...SH, color: C.dark }}>
          Le visuel : la première seconde qui compte
        </h3>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Vous avez 1 à 2 secondes pour stopper le scroll de votre prospect.
          Pour les formations, les visuels les plus performants en Afrique
          francophone sont : une photo de vous en train d&apos;enseigner ou de
          travailler (authenticité), un avant/après concret (transformation
          visible), ou une maquette de votre formation avec un titre fort.
          Évitez les photos génériques de stock — elles ne créent aucune
          connexion émotionnelle.
        </p>
        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          La vidéo surpasse l&apos;image fixe dans la majorité des tests.
          Une vidéo de 30 à 60 secondes où vous parlez directement à la caméra,
          en montrant votre expertise et en présentant le bénéfice principal
          de votre formation, est souvent le format le plus performant. Pas
          besoin de production professionnelle : authenticité et clarté priment.
        </p>

        <h3 className="text-xl font-bold mt-10 mb-4" style={{ ...SH, color: C.dark }}>
          Le texte : la structure en 4 parties
        </h3>

        <MockupFrame title="Modèle de texte publicitaire haute performance">
          <div className="space-y-4">
            {[
              {
                part: "Accroche (1–2 lignes)",
                content: "\"Tu veux lancer ton business en ligne mais tu ne sais pas par où commencer ?\"",
                tip: "Question qui résonne avec la douleur principale de votre audience",
                color: "#dc2626",
              },
              {
                part: "Corps (3–5 lignes)",
                content: "\"J'ai créé une formation complète qui t'explique étape par étape comment créer et vendre tes premières formations en ligne — même sans expérience et sans gros budget.\"",
                tip: "Présentez votre solution et le bénéfice principal",
                color: "#2563eb",
              },
              {
                part: "Preuve sociale (1–2 lignes)",
                content: "\"Plus de 340 entrepreneurs africains l'ont déjà suivie. 87% ont généré leurs premières ventes en moins de 30 jours.\"",
                tip: "Chiffres concrets, témoignages, résultats mesurables",
                color: C.primary,
              },
              {
                part: "CTA clair",
                content: "\"Clique sur le lien ci-dessous pour voir le programme complet et obtenir le prix de lancement.\"",
                tip: "Une seule action demandée, claire et directe",
                color: "#7c3aed",
              },
            ].map((part) => (
              <div
                key={part.part}
                className="p-4 rounded-xl border"
                style={{ borderColor: part.color + "33" }}
              >
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-bold text-white mb-2"
                  style={{ backgroundColor: part.color }}
                >
                  {part.part}
                </span>
                <p className="text-sm italic mb-2" style={{ color: C.dark }}>
                  {part.content}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  Objectif : {part.tip}
                </p>
              </div>
            ))}
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 9 ════════════ */}
        <SectionHeading id="budgets" number="8">
          Budgets : commencer avec 2 000 FCFA/jour
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          L&apos;un des grands avantages de Facebook Ads en Afrique est la
          possibilité de démarrer avec des budgets très modestes. Contrairement
          à ce que beaucoup croient, vous n&apos;avez pas besoin de 50 000 FCFA
          par jour pour obtenir des résultats. Voici une approche progressive
          qui vous permet d&apos;apprendre tout en limitant les risques.
        </p>

        <MockupFrame title="Plan de montée en charge budgétaire">
          <div className="space-y-4">
            {[
              {
                phase: "Phase 1 — Tests (Jours 1–7)",
                budget: "2 000 FCFA/jour",
                total: "14 000 FCFA",
                objectif: "Tester 2–3 visuels différents et 2 audiences",
                action: "Garder ce qui fonctionne, couper le reste",
                color: "#f59e0b",
              },
              {
                phase: "Phase 2 — Optimisation (Jours 8–21)",
                budget: "5 000 FCFA/jour",
                total: "70 000 FCFA",
                objectif: "Scaler les ensembles et publicités gagnants",
                action: "Créer des audiences sosies depuis vos acheteurs",
                color: "#2563eb",
              },
              {
                phase: "Phase 3 — Scale (Jour 22+)",
                budget: "10 000–20 000 FCFA/jour",
                total: "Variable",
                objectif: "Maximiser le ROAS sur les audiences validées",
                action: "Augmenter le budget de 15–20 % tous les 3–4 jours",
                color: C.primary,
              },
            ].map((phase) => (
              <div
                key={phase.phase}
                className="p-4 rounded-xl border"
                style={{ borderColor: phase.color + "44" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-bold" style={{ color: phase.color }}>
                    {phase.phase}
                  </p>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: C.dark }}>
                      {phase.budget}
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Inv. total : {phase.total}
                    </p>
                  </div>
                </div>
                <p className="text-xs mb-1" style={{ color: C.dark }}>
                  <strong>Objectif :</strong> {phase.objectif}
                </p>
                <p className="text-xs italic" style={{ color: C.muted }}>
                  Action : {phase.action}
                </p>
              </div>
            ))}
          </div>
        </MockupFrame>

        <TipBox>
          <strong>Règle d&apos;or du budget :</strong> N&apos;augmentez jamais
          un budget publicitaire de plus de 20 % en une seule fois. Les
          algorithmes Meta ont besoin de temps pour se réajuster à un nouveau
          budget. Une augmentation brutale relance la phase d&apos;apprentissage
          et peut faire exploser vos coûts.
        </TipBox>

        {/* ════════════ SECTION 10 ════════════ */}
        <SectionHeading id="analyser" number="9">
          Analyser et optimiser (CPM, CPC, CTR, ROAS)
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Les chiffres sont le langage de la publicité digitale. Comprendre les
          métriques clés vous permet de prendre des décisions basées sur les
          données plutôt que sur l&apos;intuition. Voici les 6 métriques
          essentielles que vous devez surveiller et les seuils de référence
          pour le marché africain francophone.
        </p>

        <MockupFrame title="Tableau de bord métriques — Références marché africain">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ color: C.dark }}>
              <thead>
                <tr style={{ backgroundColor: C.surfaceLow }}>
                  <th className="text-left p-3 font-semibold rounded-tl-lg">Métrique</th>
                  <th className="text-left p-3 font-semibold">Signification</th>
                  <th className="text-left p-3 font-semibold">Bon</th>
                  <th className="text-left p-3 font-semibold rounded-tr-lg">Mauvais</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    metric: "CPM",
                    def: "Coût pour 1 000 impressions",
                    good: "< 500 FCFA",
                    bad: "> 1 200 FCFA",
                  },
                  {
                    metric: "CTR",
                    def: "% de clics sur impressions",
                    good: "> 2%",
                    bad: "< 0.8%",
                  },
                  {
                    metric: "CPC",
                    def: "Coût par clic",
                    good: "< 150 FCFA",
                    bad: "> 500 FCFA",
                  },
                  {
                    metric: "Coût / Lead",
                    def: "Prix pour obtenir un contact",
                    good: "< 800 FCFA",
                    bad: "> 2 500 FCFA",
                  },
                  {
                    metric: "Coût / Achat",
                    def: "Prix pour générer une vente",
                    good: "< 25% du prix produit",
                    bad: "> 40% du prix produit",
                  },
                  {
                    metric: "ROAS",
                    def: "Revenus / Dépenses pub",
                    good: "> 3x",
                    bad: "< 1.5x",
                  },
                ].map((row, idx) => (
                  <tr
                    key={row.metric}
                    style={{ backgroundColor: idx % 2 === 0 ? C.white : C.surfaceLow }}
                  >
                    <td className="p-3 font-mono font-bold" style={{ color: C.primary }}>
                      {row.metric}
                    </td>
                    <td className="p-3 text-xs" style={{ color: C.muted }}>
                      {row.def}
                    </td>
                    <td className="p-3 text-xs font-semibold text-green-600">{row.good}</td>
                    <td className="p-3 text-xs font-semibold text-red-500">{row.bad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MockupFrame>

        {/* ════════════ SECTION 11 ════════════ */}
        <SectionHeading id="erreurs" number="10">
          Les 5 erreurs à éviter absolument
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Ces 5 erreurs sont responsables de la grande majorité des budgets
          Facebook gaspillés par les créateurs africains débutants. Les connaître
          vous fera économiser potentiellement des centaines de milliers de FCFA.
        </p>

        <div className="space-y-5 my-8">
          {[
            {
              num: "1",
              title: "Cibler une audience trop large",
              desc: "\"Toute l'Afrique, tous les âges, tous les intérêts\" — c'est l'erreur classique du débutant. Facebook ne sait pas à qui montrer votre publicité et la distribue au hasard. Résultat : des tonnes d'impressions et zéro vente. Commencez avec des audiences de 500 000 à 3 millions de personnes maximum.",
              color: "#dc2626",
            },
            {
              num: "2",
              title: "Couper les campagnes trop tôt",
              desc: "Facebook a besoin de 3 à 7 jours pour sortir de la \"phase d'apprentissage\". Beaucoup de créateurs coupent leurs campagnes après 24 heures parce qu'elles ne génèrent pas encore de ventes. Laissez tourner au moins 5 jours avant de prendre une décision.",
              color: "#f59e0b",
            },
            {
              num: "3",
              title: "Ne pas tester plusieurs visuels",
              desc: "Créer une seule publicité et espérer qu'elle performe est une erreur. Créez toujours au minimum 2 à 3 variations (différentes images ou vidéos) et laissez Facebook identifier naturellement la meilleure. Le visuel qui performe le mieux vous surprendra souvent.",
              color: "#7c3aed",
            },
            {
              num: "4",
              title: "Envoyer du trafic vers votre page d'accueil",
              desc: "Votre publicité doit mener vers une page de vente dédiée à la formation que vous promouvez, pas vers votre boutique générale. Chaque étape supplémentaire entre le clic et l'achat réduit votre taux de conversion de 30 à 50 %.",
              color: "#2563eb",
            },
            {
              num: "5",
              title: "Ignorer le score de pertinence",
              desc: "Facebook attribue un score de qualité à chaque publicité. Un mauvais score augmente votre CPM et réduit la diffusion. Si votre publicité est jugée peu pertinente par les utilisateurs (peu de clics, beaucoup de \"Je ne veux pas voir cette pub\"), refactorisez le visuel et le texte.",
              color: C.primary,
            },
          ].map((err) => (
            <div
              key={err.num}
              className="flex items-start gap-4 p-5 rounded-xl border"
              style={{ borderColor: err.color + "33", backgroundColor: err.color + "08" }}
            >
              <span
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: err.color }}
              >
                {err.num}
              </span>
              <div>
                <p className="text-sm font-bold mb-2" style={{ color: C.dark }}>
                  {err.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
                  {err.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ════════════ SECTION 12 ════════════ */}
        <SectionHeading id="cas-pratique" number="11">
          Cas pratique : Campagne pour une formation à 25 000 FCFA
        </SectionHeading>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Mettons tout cela en pratique avec un exemple concret. Kofi est un
          expert en marketing sur Instagram basé à Abidjan. Il a créé une
          formation &quot;Instagram Business Africa&quot; vendue 25 000 FCFA.
          Voici exactement comment il a configuré sa première campagne rentable
          avec 70 000 FCFA de budget (2 semaines × 5 000 FCFA/jour).
        </p>

        <MockupFrame title="Cas pratique — Campagne Instagram Business Africa">
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: C.surfaceLow }}>
                <p className="text-xs font-bold mb-1" style={{ color: C.muted }}>
                  Produit
                </p>
                <p className="text-sm font-semibold" style={{ color: C.dark }}>
                  Formation Instagram Business
                </p>
                <p className="text-xs" style={{ color: C.primary }}>
                  25 000 FCFA
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: C.surfaceLow }}>
                <p className="text-xs font-bold mb-1" style={{ color: C.muted }}>
                  Budget total
                </p>
                <p className="text-sm font-semibold" style={{ color: C.dark }}>
                  5 000 FCFA/jour
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  14 jours = 70 000 FCFA
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: C.primary }}>
                Structure de la campagne
              </p>
              <div className="space-y-2">
                {[
                  {
                    label: "Campagne",
                    detail: "Objectif : Trafic vers page de vente",
                    budget: null,
                    color: C.primary,
                  },
                  {
                    label: "Ensemble A — Côte d'Ivoire",
                    detail: "Femmes + Hommes, 22–40 ans, Intérêts : business, Instagram, entrepreneuriat",
                    budget: "2 500 FCFA/j",
                    color: "#2563eb",
                  },
                  {
                    label: "Ensemble B — Sénégal + Bénin",
                    detail: "Femmes + Hommes, 22–40 ans, Intérêts : réseaux sociaux, business en ligne",
                    budget: "2 500 FCFA/j",
                    color: "#7c3aed",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{ borderColor: item.color + "44" }}
                  >
                    <span
                      className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.label.split(" — ")[0]}
                    </span>
                    <p className="text-xs flex-1" style={{ color: C.dark }}>
                      {item.detail}
                    </p>
                    {item.budget && (
                      <span className="text-xs font-bold" style={{ color: item.color }}>
                        {item.budget}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold mb-2" style={{ color: C.primary }}>
                Résultats après 14 jours
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Budget dépensé", value: "67 400 FCFA" },
                  { label: "Ventes générées", value: "12 ventes" },
                  { label: "Revenus", value: "300 000 FCFA" },
                  { label: "Coût/vente", value: "5 617 FCFA" },
                  { label: "ROAS", value: "4.45x" },
                  { label: "Profit net", value: "~232 600 FCFA" },
                ].map((r) => (
                  <div key={r.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: C.tipBg }}>
                    <p className="text-lg font-bold" style={{ ...SH, color: C.primary }}>
                      {r.value}
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      {r.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MockupFrame>

        <p className="text-[16px] leading-[1.8] mb-5" style={{ color: C.dark }}>
          Ce résultat n&apos;est pas exceptionnel — c&apos;est ce qu&apos;une
          campagne bien configurée peut générer dès les premières semaines.
          Avec un ROAS de 4.45x, pour chaque franc CFA investi en publicité,
          Kofi en a récupéré 4.45. La clé a été la clarté de son ciblage
          géographique, la qualité de son texte publicitaire adapté au contexte
          africain, et sa page de vente Novakou qui convertissait bien.
        </p>

        {/* CTA */}
        <div
          className="rounded-2xl p-8 sm:p-12 text-center"
          style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, #004d21 100%)`,
          }}
        >
          <p className="text-2xl sm:text-3xl text-white mb-4" style={SH}>
            Prêt à lancer vos premières campagnes ?
          </p>
          <p
            className="text-base mb-8 max-w-lg mx-auto"
            style={{ ...S, color: "rgba(255,255,255,0.8)" }}
          >
            Créez votre boutique Novakou, configurez votre Pixel Meta et lancez
            vos premières publicités Facebook avec un budget de 2 000 FCFA/jour.
          </p>
          <Link
            href="/inscription?role=vendeur"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold transition-transform hover:scale-[1.03]"
            style={{ ...S, backgroundColor: C.white, color: C.primary }}
          >
            Créer ma boutique Novakou gratuitement
            <span aria-hidden="true" className="text-lg">&rarr;</span>
          </Link>
          <p
            className="text-sm mt-4"
            style={{ ...S, color: "rgba(255,255,255,0.6)" }}
          >
            10 % de commission uniquement sur vos ventes. Aucun frais caché.
          </p>
        </div>

        {/* Related guides */}
        <div className="mt-20">
          <p className="text-lg font-bold mb-6" style={{ ...SH, color: C.dark }}>
            Guides complémentaires
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                href: "/guides/trouver-son-idee-de-produit",
                title: "Trouver son idée de produit digital en Afrique",
                desc: "Avant d'investir en publicité, assurez-vous d'avoir une idée validée. La méthode des 3 cercles expliquée.",
              },
              {
                href: "/guides/automatisations-novakou",
                title: "Automatisations Novakou : vendre pendant que vous dormez",
                desc: "Combinez vos campagnes Facebook avec les automatisations Novakou pour maximiser chaque centime investi.",
              },
            ].map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="block p-5 rounded-xl border transition-shadow hover:shadow-md"
                style={{ backgroundColor: C.white, borderColor: C.surfaceHigh }}
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
