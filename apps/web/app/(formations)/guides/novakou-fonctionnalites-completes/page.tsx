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
  GImage,
  GStats,
  GCards,
  type GuideMeta,
  type GuideSection,
  type GuideFaq,
} from "@/components/formations/GuideArticleLayout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

const meta: GuideMeta = {
  slug: "novakou-fonctionnalites-completes",
  title: "Novakou : toutes les fonctionnalités pour vendre vos produits numériques",
  subtitle:
    "Boutique, Mobile Money, tunnel de vente, automatisation, affiliation, pixels, escrow, abonnements, IA. Le tour complet de la plateforme n°1 de vente de produits numériques en Afrique — et dans le monde.",
  category: "Vendre",
  level: "Complet",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "auto_awesome",
  time: "15 min",
  chapters: "10 sections",
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

const heroImage = {
  src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Équipe de créateurs africains lançant leur business en ligne avec Novakou",
  caption: "Une plateforme, tout votre business : de la première vente au revenu récurrent.",
};

const stats = [
  { value: "Mobile Money", label: "Wave, Orange, MTN, Moov + carte, nativement" },
  { value: "Tout‑en‑un", label: "boutique, tunnel, e‑mails, affiliation, pixels" },
  { value: "Escrow", label: "paiement sécurisé pour l'acheteur et le vendeur" },
  { value: "Gratuit", label: "pour démarrer, commission simple sur les ventes" },
];

const sections: GuideSection[] = [
  {
    id: "tout-en-un",
    label: "Une seule plateforme pour tout votre business",
    content: (
      <>
        <GP>
          La plupart des créateurs africains jonglent avec cinq outils : un pour la boutique, un pour les paiements, un pour les e‑mails, un pour les tunnels, un pour les statistiques. Résultat : de l'argent perdu en abonnements, des heures gâchées à tout connecter, et des ventes qui passent à travers les mailles parce que deux outils ne « se parlent » pas.
        </GP>
        <GP>
          Novakou réunit <GStrong>tout au même endroit</GStrong> : encaisser, vendre, convertir, fidéliser, attirer et piloter. Un seul compte, un seul tableau de bord, une seule facture. Voici le tour complet — sans rien cacher.
        </GP>
        <GStats
          items={[
            { value: "1", label: "seule plateforme au lieu de 5 outils à connecter" },
            { value: "6", label: "briques : encaisser, vendre, convertir, fidéliser, attirer, piloter" },
            { value: "0", label: "abonnement obligatoire pour démarrer" },
          ]}
        />
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Entrepreneur africain gérant sa boutique en ligne tout-en-un sur Novakou"
          caption="Encaisser, vendre, automatiser et piloter : tout au même endroit, en FCFA et en Mobile Money."
        />
        <GCards
          items={[
            { icon: "payments", title: "Encaisser", text: "Mobile Money (Wave, Orange, MTN, Moov) et carte, avec paiement séquestré." },
            { icon: "storefront", title: "Vendre", text: "Boutique, liens de paiement et tunnels de vente professionnels." },
            { icon: "trending_up", title: "Convertir", text: "Order bump et upsell pour augmenter le panier moyen." },
            { icon: "autorenew", title: "Fidéliser", text: "Automatisations, séquences e‑mail et abonnements récurrents." },
            { icon: "campaign", title: "Attirer", text: "Affiliation, pixels publicitaires et référencement Google." },
            { icon: "insights", title: "Piloter", text: "Statistiques temps réel, multi‑devises et assistant IA." },
          ]}
        />
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
          Wave, Orange Money, MTN Mobile Money, Moov Money et carte bancaire. L'acheteur voit son moyen préféré dès la première étape et paie en quelques secondes. La <GStrong>diaspora</GStrong> paie par carte, le client local en Mobile Money — personne n'est laissé de côté. C'est la brique la plus importante : en Afrique, si le paiement n'est pas fluide, la vente n'a jamais lieu, quelle que soit la qualité de votre produit.
        </GP>
        <GH3>Paiement séquestré (escrow)</GH3>
        <GP>
          À chaque commande, les fonds sont <GStrong>sécurisés puis libérés</GStrong> une fois la vente confirmée. En cas de litige, ils sont gelés jusqu'à résolution. C'est la confiance qui fait acheter — et racheter. L'acheteur sait qu'il est protégé s'il ne reçoit pas son produit ; vous savez que votre argent est sécurisé. Cette protection à double sens est rare, et c'est un argument de vente puissant auprès d'un acheteur qui hésite.
        </GP>
        <GH3>Portefeuille, retraits et factures</GH3>
        <GP>
          Suivez votre solde disponible et en attente, retirez vers Mobile Money ou virement, et générez vos factures automatiquement en PDF. Tout est traçable, tout est clair. Voir <GA href="/guides/mobile-money-encaisser-paiements">encaisser en Mobile Money</GA> pour le détail.
        </GP>
        <GCallout variant="tip" title="Multi‑devises">
          Vos prix s'affichent en FCFA par défaut, mais aussi en USD, EUR et autres devises avec conversion automatique. Un acheteur au Sénégal voit le prix en FCFA, un client de la diaspora à Paris le voit en euros — sans que vous ayez rien à faire.
        </GCallout>
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
          Une boutique personnalisée avec vos couleurs, votre logo et vos produits — formations, e‑books, templates, coaching. Prête en quelques minutes, sans site web à construire ni compétence technique. Chaque produit a sa page optimisée, avec description, visuels, prix, avis et bouton d'achat.
        </GP>
        <GH3>Liens de paiement, à coller partout</GH3>
        <GP>
          Générez un lien de paiement pour n'importe quel produit et partagez‑le sur WhatsApp, dans une publicité ou par message. Deux liens possibles : la <GStrong>page produit</GStrong> complète, ou le <GStrong>paiement direct</GStrong> qui va droit au checkout. C'est parfait pour le commerce social africain, où l'essentiel des ventes se joue dans une conversation. Vous pouvez même intégrer ce lien sur votre propre site avec redirection et webhook, pour débloquer l'accès automatiquement chez vous.
        </GP>
        <GH3>Tunnels de vente professionnels</GH3>
        <GP>
          Des <GA href="/guides/tunnel-de-vente-novakou">tunnels de vente</GA> au niveau des meilleurs outils du marché : pages de capture, pages de vente, checkout, upsell et remerciement — avec des modèles prêts à l'emploi et un éditeur visuel par glisser‑déposer. Vous pouvez même <GA href="/guides/importer-systeme-io">importer votre tunnel Systeme.io</GA> en 30 secondes en collant son URL.
        </GP>
        <GCallout variant="tip" title="Vendre plus à chaque client">
          Order bump (une offre cochable juste avant le paiement) et upsell en un clic après l'achat : votre panier moyen grimpe sans effort supplémentaire. Un client qui achète à 25 000 FCFA peut en ajouter 9 000 d'un simple clic — c'est du revenu pur.
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
          Créez des <GA href="/guides/automatisations-novakou">workflows</GA> qui travaillent pour vous 24 h/24 : « après un achat → envoyer un e‑mail de bienvenue + ajouter un tag », « panier abandonné → relancer avec un rappel », « attendre 2 jours → proposer une offre complémentaire ». Vous mettez en place une fois, ça tourne tout seul, même quand vous dormez. C'est la différence entre un vendeur qui court après chaque client et un business qui tourne.
        </GP>
        <GH3>Séquences e‑mail</GH3>
        <GP>
          Des <GA href="/guides/sequences-emails">séquences d'e‑mails</GA> déclenchées automatiquement (bienvenue, éducation, relance, vente) pour transformer un curieux en acheteur puis en client fidèle. Un prospect qui télécharge votre guide gratuit reçoit, les jours suivants, une série de messages qui le mènent naturellement vers votre offre payante.
        </GP>
        <GH3>Abonnements et revenus récurrents</GH3>
        <GP>
          Vendez un accès mensuel à un espace membre, une communauté ou des contenus renouvelés. Des revenus qui rentrent <GStrong>chaque mois</GStrong>, avec essai gratuit et gestion automatique du renouvellement. C'est le graal du créateur : au lieu de repartir de zéro chaque mois, vous construisez une base de revenus prévisibles qui grandit.
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
          Laissez d'autres vendre à votre place. Chaque affilié reçoit un lien unique et une commission sur ses ventes — voir <GA href="/guides/affiliation-recruter-affilies">recruter des affiliés</GA>. C'est le bouche‑à‑oreille, mais mesuré et récompensé : une armée de vendeurs motivés qui font connaître vos produits, sans que vous avanciez un centime de publicité.
        </GP>
        <GH3>Pixels publicitaires sur toutes vos pages</GH3>
        <GP>
          Facebook, Instagram, TikTok, Snapchat, Pinterest et Google : posez votre pixel une fois, il se déclenche sur vos pages produit, votre checkout et vos liens de paiement. Vos campagnes suivent tout le tunnel — vue du produit, début de paiement, achat — pour être vraiment rentables et créer des audiences de reciblage. Sans pixel, vous dépensez en publicité à l'aveugle ; avec, vous savez exactement quelle pub rapporte.
        </GP>
        <GH3>Référencement (SEO) et partage</GH3>
        <GP>
          Chaque produit et boutique est optimisé pour Google (métadonnées, données structurées, images de partage soignées), pour être trouvé sans dépendre uniquement de la publicité. Un acheteur qui cherche « formation marketing Sénégal » peut tomber sur votre produit — c'est du trafic gratuit et durable.
        </GP>
      </>
    ),
  },
  {
    id: "piloter",
    label: "Piloter : statistiques, multi‑devises et IA",
    content: (
      <>
        <GP>
          Vendre sans mesurer, c'est conduire les yeux fermés. Novakou vous donne les instruments de bord pour décider avec des chiffres, pas des impressions.
        </GP>
        <GUl>
          <GLi><GStrong>Statistiques en temps réel</GStrong> — ventes, revenus, conversions, meilleurs produits, sources de trafic, en un coup d'œil.</GLi>
          <GLi><GStrong>Multi‑devises</GStrong> — FCFA par défaut, plus USD, EUR et autres, avec conversion automatique pour vendre à l'international sans friction.</GLi>
          <GLi><GStrong>Assistant IA</GStrong> — pour vous aider à rédiger vos descriptions de produits, vos e‑mails de vente et structurer vos offres, même si vous n'êtes pas à l'aise avec l'écriture.</GLi>
          <GLi><GStrong>Multi‑boutiques</GStrong> — gérez plusieurs marques ou plusieurs activités depuis un seul compte, chacune avec sa propre identité.</GLi>
        </GUl>
        <GCallout variant="info" title="Tout est lié">
          La force du tout‑en‑un, c'est que ces données circulent entre les briques : une vente met à jour vos stats, déclenche une automatisation, crédite l'affilié et envoie l'événement à vos pixels — automatiquement, en une fraction de seconde.
        </GCallout>
      </>
    ),
  },
  {
    id: "securite",
    label: "Sécurité, confiance et sérénité",
    content: (
      <>
        <GP>
          En Afrique, la méfiance en ligne est réelle : beaucoup d'acheteurs ont déjà été déçus par une arnaque ou un vendeur qui a disparu après le paiement. La confiance est donc votre premier levier de vente — et Novakou la construit pour vous, à chaque commande.
        </GP>
        <GH3>Paiement séquestré pour tous</GH3>
        <GP>
          L'argent est sécurisé au moment de l'achat et libéré au vendeur une fois la vente confirmée. L'acheteur ose franchir le pas parce qu'il sait qu'il est protégé ; vous encaissez sereinement. En cas de désaccord, une équipe tranche sur la base des preuves. Cette protection à double sens transforme un visiteur hésitant en acheteur.
        </GP>
        <GH3>Vendeurs vérifiés et contenus protégés</GH3>
        <GP>
          Les vendeurs qui encaissent et retirent des fonds passent une vérification d'identité (KYC) — un rempart contre la fraude qui rassure les acheteurs. Vos vidéos et documents sont hébergés de façon sécurisée et protégés contre le téléchargement et le partage non autorisés : votre travail ne se retrouve pas piraté et revendu ailleurs.
        </GP>
        <GH3>Paiements chiffrés et données protégées</GH3>
        <GP>
          Les paiements sont traités par des prestataires certifiés ; vos données bancaires et celles de vos clients ne transitent jamais en clair. Vos factures sont générées automatiquement, votre historique est traçable, et vous gardez le contrôle total sur votre boutique. Vous vendez l'esprit tranquille, sans jouer à l'administrateur système.
        </GP>
        <GCallout variant="success" title="La confiance se voit sur votre page">
          Badge de paiement sécurisé, garantie satisfait ou remboursé, avis vérifiés de vrais acheteurs : autant de signaux de réassurance qui, en Afrique comme ailleurs, font la différence entre un panier abandonné et une vente conclue.
        </GCallout>
      </>
    ),
  },
  {
    id: "pour-qui",
    label: "Pour qui ? Des cas d'usage concrets",
    content: (
      <>
        <GP>Novakou s'adapte à tous les créateurs de produits numériques. Quelques exemples :</GP>
        <GUl>
          <GLi><GStrong>La formatrice</GStrong> à Dakar qui vend une formation vidéo à 35 000 FCFA, avec un upsell coaching et une séquence e‑mail de bienvenue.</GLi>
          <GLi><GStrong>Le coach</GStrong> à Abidjan qui vend des séances individuelles et un abonnement mensuel à sa communauté privée.</GLi>
          <GLi><GStrong>La créatrice de templates</GStrong> à Douala qui vend des packs Canva et Notion via un simple lien de paiement partagé sur Instagram.</GLi>
          <GLi><GStrong>L'auteur d'ebook</GStrong> à Cotonou qui lance une vente flash à 2 500 FCFA et attire des clients avec une publicité Facebook suivie par pixel.</GLi>
          <GLi><GStrong>L'agence</GStrong> qui gère plusieurs marques et affilie un réseau de partenaires depuis un seul tableau de bord.</GLi>
        </GUl>
        <GP>
          Dans chaque cas, la même plateforme fait tout : encaisser en Mobile Money, vendre plus, fidéliser et mesurer. C'est ce qui fait de Novakou <GStrong>la n°1 en Afrique francophone</GStrong>.
        </GP>
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
          <GLi>Vous démarrez <GStrong>gratuitement</GStrong>, sans abonnement obligatoire, et la plateforme n'est payée que si elle vous rapporte.</GLi>
        </GUl>
        <GP>
          Pour aller plus loin, comparez les solutions dans notre guide <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA>, ou créez votre boutique et testez par vous‑même.
        </GP>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Commencer en 5 étapes",
    content: (
      <>
        <GP>
          La meilleure façon de comprendre tout ce que Novakou fait, c'est de l'essayer. Pas de carte bancaire ni d'engagement pour commencer — voici votre chemin :
        </GP>
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement en quelques secondes.</GLi>
          <GLi><GStrong>Ajoutez votre premier produit</GStrong> — formation, ebook, template ou coaching — avec titre, prix et visuel. Besoin d'aide ? Voir <GA href="/guides/creer-son-produit">créer son premier produit</GA>.</GLi>
          <GLi><GStrong>Activez vos moyens de paiement</GStrong> : Mobile Money (Wave, Orange, MTN, Moov) et carte, en un clic.</GLi>
          <GLi><GStrong>Partagez votre lien</GStrong> sur WhatsApp, Facebook ou TikTok — ou construisez un <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente</GA> pour convertir davantage.</GLi>
          <GLi><GStrong>Encaissez et pilotez</GStrong> : suivez vos ventes en temps réel, automatisez vos relances, et faites grandir votre business.</GLi>
        </GUl>
        <GP>
          Vous n'avez pas besoin de tout activer le premier jour. Commencez par une boutique et un produit, encaissez votre première vente, puis ajoutez progressivement les tunnels, l'automatisation, l'affiliation et les pixels au fur et à mesure que vous grandissez. La plateforme évolue avec vous — c'est aussi ça, être la n°1 en Afrique : vous accompagner du tout premier client jusqu'aux dizaines de milliers.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Novakou est‑elle vraiment gratuite pour commencer ?",
    a: "Oui. Vous créez votre boutique et vendez sans abonnement obligatoire ; Novakou se rémunère via une commission simple sur les ventes réalisées. Vous ne payez donc rien tant que vous n'avez pas encaissé.",
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
    a: "Oui, les deux sont inclus : tunnels de vente avec modèles prêts (page de vente, checkout, upsell) et automatisations marketing (workflows, séquences e‑mail, relances de panier), sans outil externe ni abonnement supplémentaire.",
  },
  {
    q: "Puis‑je suivre mes publicités Facebook ou TikTok ?",
    a: "Oui. Vous ajoutez vos pixels Facebook, Instagram, TikTok, Snapchat, Pinterest et Google ; ils se déclenchent sur vos pages produit, votre checkout et vos liens de paiement pour suivre tout le tunnel jusqu'à l'achat.",
  },
  {
    q: "Puis‑je gérer plusieurs boutiques ou marques ?",
    a: "Oui. Novakou permet de gérer plusieurs boutiques depuis un seul compte, chacune avec son identité, ses produits et ses statistiques.",
  },
];

export default function NovakouFonctionnalites() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
