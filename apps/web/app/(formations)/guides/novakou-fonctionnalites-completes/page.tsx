import type { Metadata } from "next";
import Image from "next/image";
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
  type GuideFaq,
} from "@/components/formations/GuideArticleLayout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

const meta: GuideMeta = {
  slug: "novakou-fonctionnalites-completes",
  title: "Novakou : toutes les fonctionnalités pour vendre vos produits numériques",
  subtitle:
    "Boutique, Mobile Money, tunnel de vente, automatisation, affiliation, pixels, escrow, abonnements, IA. Le tour complet de la plateforme n°1 de vente de produits numériques en Afrique.",
  category: "Vendre",
  level: "Complet",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "auto_awesome",
  time: "13 min",
  chapters: "8 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "fonctionnalités Novakou",
    "plateforme n°1 vente produits numériques Afrique",
    "boutique en ligne Mobile Money Afrique",
    "tunnel de vente automatisation affiliation",
    "vendre formation ebook coaching Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Novakou : la plateforme n°1 de vente de produits numériques en Afrique";
const SEO_DESCRIPTION =
  "Découvrez toutes les fonctionnalités de Novakou : Mobile Money, tunnel de vente, automatisation, affiliation, pixels, escrow, abonnements et IA. Tout pour vendre en Afrique.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Toutes les fonctionnalités de Novakou",
)}&subtitle=${encodeURIComponent(
  "La plateforme n°1 de vente de produits numériques en Afrique",
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
    id: "tout-en-un",
    label: "Une seule plateforme pour tout votre business",
    content: (
      <>
        <GP>
          La plupart des créateurs africains jonglent avec cinq outils : un pour la boutique, un pour les paiements, un pour les e‑mails, un pour les tunnels, un pour les statistiques. Résultat : de l'argent perdu en abonnements, des heures gâchées à tout connecter, et des ventes qui passent à travers les mailles.
        </GP>
        <GP>
          Novakou réunit <GStrong>tout au même endroit</GStrong> : encaisser, vendre, convertir, fidéliser, attirer et piloter. Voici le tour complet — sans rien cacher.
        </GP>
        <div className="my-8 rounded-2xl overflow-hidden border border-gray-200">
          <Image
            src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=630&fit=crop&q=80&auto=format"
            alt="Entrepreneur africain gérant sa boutique en ligne tout-en-un sur Novakou"
            width={1200}
            height={630}
            className="w-full h-auto"
          />
        </div>
      </>
    ),
  },
  {
    id: "encaisser",
    label: "Encaisser : Mobile Money, carte et paiement sécurisé",
    content: (
      <>
        <GH3>Tous les moyens de paiement d'Afrique</GH3>
        <GP>
          Wave, Orange Money, MTN Mobile Money, Moov Money et carte bancaire. L'acheteur voit son moyen préféré dès la première étape et paie en quelques secondes. La <GStrong>diaspora</GStrong> paie par carte, le client local en Mobile Money — personne n'est laissé de côté.
        </GP>
        <GH3>Paiement séquestré (escrow)</GH3>
        <GP>
          À chaque commande, les fonds sont <GStrong>sécurisés puis libérés</GStrong> une fois la vente confirmée. En cas de litige, ils sont gelés jusqu'à résolution. C'est la confiance qui fait acheter — et racheter.
        </GP>
        <GH3>Portefeuille et retraits</GH3>
        <GP>
          Suivez votre solde, retirez vers Mobile Money ou virement, et générez vos factures automatiquement. Voir <GA href="/guides/mobile-money-encaisser-paiements">encaisser en Mobile Money</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "vendre",
    label: "Vendre : boutique, liens de paiement et tunnels",
    content: (
      <>
        <GH3>Votre boutique en ligne</GH3>
        <GP>
          Une boutique personnalisée avec vos couleurs, votre logo et vos produits — formations, e‑books, templates, coaching. Prête en quelques minutes, sans site web à construire.
        </GP>
        <GH3>Liens de paiement, à coller partout</GH3>
        <GP>
          Générez un lien de paiement pour n'importe quel produit et partagez‑le sur WhatsApp, dans une publicité ou par message. Deux liens possibles : la <GStrong>page produit</GStrong> complète, ou le <GStrong>paiement direct</GStrong> qui va droit au checkout. Vous pouvez même l'intégrer sur votre propre site avec redirection et webhook.
        </GP>
        <GH3>Tunnels de vente professionnels</GH3>
        <GP>
          Des <GA href="/guides/tunnel-de-vente-novakou">tunnels de vente</GA> au niveau des meilleurs outils du marché : pages de capture, pages de vente, checkout, upsell et remerciement — avec des modèles prêts à l'emploi et un éditeur visuel. Vous pouvez même <GA href="/guides/importer-systeme-io">importer votre tunnel Systeme.io</GA> en 30 secondes.
        </GP>
        <GCallout variant="tip" title="Vendre plus à chaque client">
          Order bump (une offre cochable juste avant le paiement) et upsell en un clic après l'achat : votre panier moyen grimpe sans effort supplémentaire.
        </GCallout>
      </>
    ),
  },
  {
    id: "fideliser",
    label: "Fidéliser : automatisation, e‑mails et abonnements",
    content: (
      <>
        <GH3>Automatisations marketing</GH3>
        <GP>
          Créez des <GA href="/guides/automatisations-novakou">workflows</GA> qui travaillent pour vous : « après un achat → envoyer un e‑mail + ajouter un tag », « panier abandonné → relancer », « attendre 2 jours → proposer une offre ». Vous mettez en place une fois, ça tourne tout seul.
        </GP>
        <GH3>Séquences e‑mail</GH3>
        <GP>
          Des <GA href="/guides/sequences-emails">séquences d'e‑mails</GA> déclenchées automatiquement (bienvenue, relance, vente) pour transformer un curieux en acheteur puis en client fidèle.
        </GP>
        <GH3>Abonnements et revenus récurrents</GH3>
        <GP>
          Vendez un accès mensuel à un espace membre, une communauté ou des contenus renouvelés. Des revenus qui rentrent chaque mois, avec essai gratuit et gestion automatique du renouvellement.
        </GP>
      </>
    ),
  },
  {
    id: "attirer",
    label: "Attirer : affiliation, pixels publicitaires et SEO",
    content: (
      <>
        <GH3>Programme d'affiliation</GH3>
        <GP>
          Laissez d'autres vendre à votre place. Chaque affilié reçoit un lien unique et une commission sur ses ventes — voir <GA href="/guides/affiliation-recruter-affilies">recruter des affiliés</GA>. C'est le bouche‑à‑oreille, mais mesuré et récompensé.
        </GP>
        <GH3>Pixels publicitaires sur toutes vos pages</GH3>
        <GP>
          Facebook, Instagram, TikTok, Snapchat, Pinterest et Google : posez votre pixel une fois, il se déclenche sur vos pages produit, votre checkout et vos liens de paiement. Vos campagnes suivent tout le tunnel — vue, début de paiement, achat — pour être vraiment rentables.
        </GP>
        <GH3>Référencement (SEO) et partage</GH3>
        <GP>
          Chaque produit et boutique est optimisé pour Google (métadonnées, données structurées, images de partage), pour être trouvé sans dépendre uniquement de la publicité.
        </GP>
      </>
    ),
  },
  {
    id: "piloter",
    label: "Piloter : statistiques, multi‑devises et IA",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Statistiques en temps réel</GStrong> — ventes, revenus, conversions, meilleurs produits, en un coup d'œil.</GLi>
          <GLi><GStrong>Multi‑devises</GStrong> — FCFA par défaut, plus USD, EUR et autres, avec conversion automatique pour vendre à l'international.</GLi>
          <GLi><GStrong>Assistant IA</GStrong> — pour vous aider à rédiger vos descriptions, vos e‑mails et structurer vos offres.</GLi>
          <GLi><GStrong>Multi‑boutiques</GStrong> — gérez plusieurs marques depuis un seul compte.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "pourquoi-n1",
    label: "Pourquoi Novakou est la n°1 en Afrique",
    content: (
      <>
        <GP>
          D'autres plateformes font une ou deux de ces choses. <GStrong>Aucune ne les fait toutes</GStrong>, avec le Mobile Money natif, l'escrow, et une conception pensée pour l'Afrique francophone.
        </GP>
        <GUl>
          <GLi>Vous encaissez <GStrong>localement</GStrong> (Mobile Money) et <GStrong>mondialement</GStrong> (carte) depuis la même boutique.</GLi>
          <GLi>Vous vendez <GStrong>plus</GStrong> grâce aux tunnels, à l'automatisation et à l'affiliation.</GLi>
          <GLi>Vous vendez <GStrong>en confiance</GStrong> grâce au paiement séquestré et à la protection des contenus.</GLi>
          <GLi>Vous démarrez <GStrong>gratuitement</GStrong>, sans abonnement obligatoire.</GLi>
        </GUl>
        <GP>
          Pour aller plus loin, comparez les solutions dans notre guide <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Commencer maintenant",
    content: (
      <>
        <GP>
          Créez votre boutique gratuitement, ajoutez votre premier produit et partagez votre lien. En quelques minutes, vous encaissez vos premières ventes en Mobile Money et par carte.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Novakou est‑elle vraiment gratuite pour commencer ?",
    a: "Oui. Vous créez votre boutique et vendez sans abonnement obligatoire ; Novakou se rémunère via une commission simple sur les ventes réalisées.",
  },
  {
    q: "Quels moyens de paiement Novakou accepte‑t‑elle ?",
    a: "Wave, Orange Money, MTN Mobile Money, Moov Money et la carte bancaire (Visa/Mastercard) pour les paiements internationaux. L'acheteur choisit son moyen préféré au checkout.",
  },
  {
    q: "Que puis‑je vendre sur Novakou ?",
    a: "Des formations vidéo, des e‑books, des templates et fichiers numériques, du coaching, des abonnements et des accès à des espaces membres. Tout produit numérique ou service en ligne.",
  },
  {
    q: "Novakou inclut‑elle un tunnel de vente et l'automatisation ?",
    a: "Oui, les deux sont inclus : tunnels de vente avec modèles prêts (page de vente, checkout, upsell) et automatisations marketing (workflows, séquences e‑mail, relances de panier), sans outil externe.",
  },
  {
    q: "Puis‑je suivre mes publicités Facebook ou TikTok ?",
    a: "Oui. Vous ajoutez vos pixels Facebook, Instagram, TikTok, Snapchat, Pinterest et Google ; ils se déclenchent sur vos pages produit, votre checkout et vos liens de paiement pour suivre tout le tunnel jusqu'à l'achat.",
  },
];

export default function NovakouFonctionnalites() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} />;
}
