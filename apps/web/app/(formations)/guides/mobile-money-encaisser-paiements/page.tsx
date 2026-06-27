import type { Metadata } from "next";
import {
  GuideArticleLayout,
  GP,
  GH3,
  GUl,
  GLi,
  GStrong,
  GA,
  GCallout,
  type GuideMeta,
  type GuideSection,
} from "@/components/formations/GuideArticleLayout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

const meta: GuideMeta = {
  slug: "mobile-money-encaisser-paiements",
  title: "Mobile Money : Wave, Orange, MTN, Moov — guide complet 2026",
  subtitle:
    "Recevoir vos paiements Mobile Money en Afrique francophone : frais réels, délais, configuration Novakou en 3 minutes, retraits sur votre numéro perso.",
  category: "Technique",
  level: "Débutant",
  levelColor: "#f59e0b",
  gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
  icon: "payments",
  time: "10 min",
  chapters: "8 sections",
  publishedAt: "2026-05-20",
  updatedAt: "2026-05-24",
  keywords: [
    "Mobile Money paiement formation",
    "Orange Money vendre en ligne",
    "Wave Sénégal Côte d'Ivoire",
    "MTN MoMo Cameroun",
    "encaisser paiements Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Encaisser Mobile Money Wave Orange MTN";
const SEO_DESCRIPTION =
  "Encaissez Wave, Orange Money, MTN MoMo, Moov pour vos formations en Afrique francophone. Frais réels, délais, configuration Novakou 3 min, retraits perso.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Encaisser Mobile Money en Afrique",
)}&subtitle=${encodeURIComponent(
  "Wave, Orange Money, MTN, Moov : frais, délais, configuration",
)}`;

export const metadata: Metadata = {
  title: SEO_TITLE,
  description: SEO_DESCRIPTION,
  keywords: meta.keywords,
  alternates: {
    canonical: `${APP_URL}/guides/${meta.slug}`,
    languages: {
      "fr-FR": `${APP_URL}/guides/${meta.slug}`,
      "fr-SN": `${APP_URL}/guides/${meta.slug}`,
      "fr-CI": `${APP_URL}/guides/${meta.slug}`,
      "fr-CM": `${APP_URL}/guides/${meta.slug}`,
      "fr-BJ": `${APP_URL}/guides/${meta.slug}`,
      "x-default": `${APP_URL}/guides/${meta.slug}`,
    },
  },
  openGraph: {
    type: "article",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    url: `${APP_URL}/guides/${meta.slug}`,
    siteName: "Novakou",
    publishedTime: meta.publishedAt,
    modifiedTime: meta.updatedAt,
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const sections: GuideSection[] = [
  {
    id: "panorama",
    label: "Le marché Mobile Money Afrique en 2026",
    content: (
      <>
        <GP>
          75 millions de comptes Mobile Money actifs en zone UEMOA en 2026 selon la BCEAO. C'est <GStrong>3 fois plus que les cartes bancaires</GStrong> en circulation sur la même zone. Si vous vendez en Afrique francophone sans accepter Mobile Money, vous coupez votre marché de 70 %.
        </GP>
        <GP>
          Les 4 acteurs majeurs en 2026 :
        </GP>
        <GUl>
          <GLi><GStrong>Orange Money</GStrong> — leader historique, présent dans 7 pays francophones (Sénégal, Côte d'Ivoire, Cameroun, Mali, Burkina Faso, Madagascar, Niger).</GLi>
          <GLi><GStrong>Wave</GStrong> — disrupteur qui a divisé les frais par 10. Domine Sénégal et Côte d'Ivoire. Frais d'envoi : 0 % côté payeur.</GLi>
          <GLi><GStrong>MTN MoMo</GStrong> — fort sur Côte d'Ivoire, Cameroun, Bénin et Guinée.</GLi>
          <GLi><GStrong>Moov Money</GStrong> — alternative présente dans 6 pays UEMOA.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "comparaison",
    label: "Frais réels par opérateur",
    content: (
      <>
        <GP>
          Côté vendeur, les frais Mobile Money sont <GStrong>très faibles</GStrong> comparés à la carte bancaire internationale (2,9 % + 0,30 € chez Stripe).
        </GP>
        <GUl>
          <GLi><GStrong>Wave</GStrong> : 0 % envoi côté payeur · 1 % retrait côté vendeur · versement instantané.</GLi>
          <GLi><GStrong>Orange Money</GStrong> : 1,5-2 % côté payeur · 0,5-1 % retrait vendeur · versement instantané.</GLi>
          <GLi><GStrong>MTN MoMo</GStrong> : 1-2 % côté payeur · 0,5-1 % retrait vendeur · versement instantané.</GLi>
          <GLi><GStrong>Moov Money</GStrong> : 1,5-2 % côté payeur · 0,5-1 % retrait vendeur · versement instantané.</GLi>
        </GUl>
        <GCallout variant="success" title="Le meilleur deal pour vous">
          Wave reste imbattable côté frais payeur (gratuit). Activez Wave en priorité au Sénégal et Côte d'Ivoire — taux de conversion mesuré <GStrong>+25 %</GStrong> vs Orange Money sur ces deux pays.
        </GCallout>
      </>
    ),
  },
  {
    id: "couverture",
    label: "Quel opérateur pour quel pays ?",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Sénégal</GStrong> : Wave + Orange Money en priorité (Free Money en alternative).</GLi>
          <GLi><GStrong>Côte d'Ivoire</GStrong> : Wave + Orange + MTN (Moov en alternative).</GLi>
          <GLi><GStrong>Cameroun</GStrong> : Orange Money + MTN MoMo.</GLi>
          <GLi><GStrong>Bénin</GStrong> : MTN MoMo + Moov Money (Celtiis Cash en alternative).</GLi>
          <GLi><GStrong>Mali</GStrong> : Orange Money + Moov Money.</GLi>
          <GLi><GStrong>Burkina Faso</GStrong> : Orange Money + Moov Money (Coris Money en alternative).</GLi>
          <GLi><GStrong>Togo</GStrong> : T-Money (Moov) + MTN (Flooz en alternative).</GLi>
        </GUl>
        <GCallout variant="tip" title="Règle d'or">
          Activez <GStrong>au moins 2 opérateurs par pays cible</GStrong>. Si Orange est down (ça arrive 1-2 fois par mois en moyenne), vous ne perdez pas toutes vos ventes ce jour-là.
        </GCallout>
      </>
    ),
  },
  {
    id: "integration",
    label: "Activer Mobile Money sur Novakou en 3 minutes",
    content: (
      <>
        <GP>
          Novakou a intégré nativement <GStrong>Moneroo</GStrong>, l'agrégateur de paiement leader en Afrique francophone. Vous ne contractez pas individuellement avec chaque opérateur.
        </GP>
        <GH3>Étape 1 — Activer les méthodes de paiement</GH3>
        <GP>
          Tableau de bord vendeur → <GStrong>Paramètrès → Méthodes de paiement</GStrong>. Toutes les méthodes Mobile Money sont actives par défaut. Vous pouvez en désactiver si vous ne ciblez qu'un pays précis.
        </GP>
        <GH3>Étape 2 — Configurer votre numéro de retrait</GH3>
        <GP>
          <GStrong>Finances → Méthodes de retrait</GStrong>. Ajoutez votre propre numéro Mobile Money (Wave, Orange, MTN, etc.). C'est sur ce numéro que vous recevrez vos gains. Vous pouvez ajouter plusieurs numéros et choisir au moment du retrait.
        </GP>
        <GH3>Étape 3 — Tester avec un petit montant</GH3>
        <GP>
          Créez un produit à 500 FCFA et achetez-le avec votre propre Mobile Money. L'argent arrive sur votre portefeuille Novakou en 24 h, vous demandez un retrait, l'argent arrive sur votre téléphone en moins de 2 minutes.
        </GP>
      </>
    ),
  },
  {
    id: "retrait",
    label: "Retirer son argent : délais et limites",
    content: (
      <>
        <GH3>Délai escrow de 48 heures</GH3>
        <GP>
          Quand un acheteur paie, l'argent arrive sur votre portefeuille Novakou mais reste <GStrong>"en attente" 48 h</GStrong> pour couvrir les éventuelles demandes de remboursement. Passé ce délai, les fonds passent en "disponible".
        </GP>
        <GH3>Demande de retrait</GH3>
        <GP>
          <GStrong>Finances → Retraits</GStrong>. Validation instantanée pour les montants inférieurs à 500 000 FCFA, vérification anti-fraude sous 24 h max au-delà. Ensuite l'argent arrive sur votre numéro Mobile Money en moins de 2 minutes.
        </GP>
        <GH3>Montant minimum et fréquence</GH3>
        <GP>
          Retrait possible à partir de <GStrong>2 000 FCFA</GStrong>, autant de fois que vous voulez dans le mois. Aucune limite mensuelle.
        </GP>
      </>
    ),
  },
  {
    id: "kyc",
    label: "KYC : pourquoi et quand le valider",
    content: (
      <>
        <GP>
          Pour retirer plus de <GStrong>200 000 FCFA cumulés</GStrong>, vous devez valider votre KYC sur Novakou (CNI ou passeport + selfie). C'est une obligation légale dans tous les pays — anti-blanchiment + protection contre l'usurpation.
        </GP>
        <GP>
          Le processus prend 24 à 48 h. Documents acceptés : CNI, passeport, permis de conduire, carte consulaire, carte d'électeur.
        </GP>
        <GCallout variant="warning" title="À anticiper">
          Ne pas attendre d'atteindre la limite pour valider — un délai de 48 h imprévu peut bloquer votre cash flow. Validez dès vos 50 premières ventes pour rester serein.
        </GCallout>
      </>
    ),
  },
  {
    id: "diaspora",
    label: "Vendre aussi à la diaspora (carte bancaire)",
    content: (
      <>
        <GP>
          Une grosse partie de vos acheteurs peut venir de la <GStrong>diaspora africaine</GStrong> en France, Belgique, Canada, USA. Ces personnes n'ont souvent pas de Mobile Money mais ont une carte Visa/Mastercard.
        </GP>
        <GP>
          Novakou active automatiquement le paiement carte selon le pays de l'acheteur — <GStrong>pas de config à faire</GStrong>. Sur une formation à 30 000 FCFA payée par un client en France, vous recevez environ 25 500 FCFA nets.
        </GP>
        <GP>
          Voir aussi : <GA href="/guides/vendre-diaspora-africaine">Vendre à la diaspora — guide complet</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "anti-fraude",
    label: "Sécurité et anti-fraude",
    content: (
      <>
        <GP>
          Novakou surveille les transactions atypiques (multiples retraits en rafale, achats avec cartes volées, etc.). En cas de suspicion, votre retrait peut être gelé temporairement (24-72 h) le temps de vérifier.
        </GP>
        <GP>
          Pour accélérer une vérification : gardez vos preuves prêtes (CNI scannée, justif de domicile récent). Email du support : <GA href="mailto:support@novakou.com">support@novakou.com</GA>.
        </GP>
        <GCallout variant="info" title="Stat rassurante">
          Sur Novakou en 2026, <GStrong>moins de 0,3 % des transactions</GStrong> sont gelées pour vérification. La grande majorité passe sans aucun frottement.
        </GCallout>
      </>
    ),
  },
];

export default function MobileMoneyGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
