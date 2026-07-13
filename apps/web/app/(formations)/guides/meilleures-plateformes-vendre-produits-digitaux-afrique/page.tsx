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
  slug: "meilleures-plateformes-vendre-produits-digitaux-afrique",
  title: "Les meilleures plateformes pour vendre des produits digitaux en Afrique (2026)",
  subtitle:
    "Comparatif complet : Mobile Money, frais, tunnel de vente, sécurité. Pourquoi Novakou est la plateforme n°1 pour vendre vos formations et produits numériques en Afrique francophone — et dans le monde.",
  category: "Vendre",
  level: "Complet",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "storefront",
  time: "14 min",
  chapters: "8 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "meilleure plateforme vendre produits digitaux Afrique",
    "plateforme vente formation en ligne Afrique",
    "vendre produits numériques Mobile Money",
    "alternative Systeme.io Chariow Afrique",
    "plateforme n°1 produits digitaux Afrique",
    "vendre formation Wave Orange Money MTN",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Meilleure plateforme vendre produits digitaux Afrique 2026";
const SEO_DESCRIPTION =
  "Comparatif 2026 des plateformes pour vendre vos produits digitaux et formations en Afrique : Mobile Money, frais, tunnel, sécurité. Pourquoi Novakou est la n°1.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Meilleures plateformes pour vendre en Afrique",
)}&subtitle=${encodeURIComponent(
  "Comparatif 2026 : Mobile Money, frais, tunnel, sécurité",
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
  src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Entrepreneure africaine gérant sa boutique en ligne et ses ventes depuis son ordinateur",
  caption: "La bonne plateforme, c'est celle avec laquelle votre acheteur paie en 30 secondes depuis son téléphone.",
};

const stats = [
  { value: "70 %", label: "des Africains paient en Mobile Money, pas par carte" },
  { value: "5", label: "moyens de paiement natifs : Wave, Orange, MTN, Moov, carte" },
  { value: "0 FCFA", label: "pour démarrer sur Novakou (sans abonnement)" },
  { value: "3 min", label: "pour ouvrir sa boutique et vendre" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi",
    label: "Pourquoi le choix de la plateforme change tout en Afrique",
    content: (
      <>
        <GP>
          En Afrique francophone, choisir sa plateforme de vente n'est pas un détail technique : c'est la décision qui détermine si vous <GStrong>encaissez réellement</GStrong> ou si vous regardez vos acheteurs abandonner au moment de payer. On peut avoir le meilleur produit du monde — si le client ne peut pas payer comme il en a l'habitude, la vente n'a jamais lieu.
        </GP>
        <GP>
          La raison est structurelle. Le taux de bancarisation reste faible dans une grande partie du continent, alors que le <GStrong>Mobile Money est devenu le moyen de paiement par défaut</GStrong>. Wave, Orange Money, MTN Mobile Money, Moov : ce ne sont pas des options « en plus », ce sont les portefeuilles quotidiens de vos acheteurs à Dakar, Abidjan, Douala, Cotonou ou Bamako.
        </GP>
        <GStats
          items={[
            { value: "+70 %", label: "de clients potentiels perdus si vous n'acceptez que la carte" },
            { value: "1 clic", label: "pour payer en Mobile Money quand c'est bien intégré" },
            { value: "24/7", label: "des ventes qui tombent même la nuit, sans intervention" },
          ]}
        />
        <GCallout variant="warning" title="Le piège des outils « globaux »">
          Systeme.io, Podia ou Gumroad sont d'excellents outils… conçus pour l'Europe et les États‑Unis. Le Mobile Money y est absent ou bricolé via un intermédiaire, et le rapatriement des fonds vers un compte africain devient un casse‑tête. Vous payez chaque mois pour des fonctionnalités que vos acheteurs locaux ne peuvent même pas utiliser.
        </GCallout>
        <GP>
          La bonne question n'est donc pas « quelle plateforme est la plus jolie ? » mais : <GStrong>« avec laquelle mon acheteur de quartier peut‑il payer en 30 secondes avec son téléphone, pendant que la diaspora paie par carte ? »</GStrong>. Tout le reste en découle.
        </GP>
      </>
    ),
  },
  {
    id: "criteres",
    label: "Les 7 critères d'une vraie bonne plateforme",
    content: (
      <>
        <GP>
          Avant de comparer les noms, voici ce qui compte réellement quand on vend des produits numériques en Afrique. Notez chaque plateforme sur ces 7 points — vous verrez vite qui coche toutes les cases.
        </GP>
        <GCards
          items={[
            { icon: "smartphone", title: "1. Mobile Money natif", text: "Wave, Orange Money, MTN, Moov, en plus de la carte. Sans lui, aucun autre critère ne compte vraiment." },
            { icon: "payments", title: "2. Frais clairs, sans abonnement", text: "Une commission simple sur les ventes, gratuit pour démarrer. Pas d'abonnement mensuel qui vous coûte avant même votre première vente." },
            { icon: "filter_alt", title: "3. Tunnel de vente intégré", text: "Page de vente, order bump, upsell : pour vendre plus à chaque client, pas seulement encaisser une fois." },
            { icon: "verified_user", title: "4. Sécurité et confiance", text: "Paiement séquestré (escrow), protection acheteur/vendeur, contenus protégés contre le piratage." },
            { icon: "bolt", title: "5. Livraison automatique", text: "L'acheteur reçoit son accès immédiatement après paiement, sans que vous ayez à envoyer quoi que ce soit à la main." },
            { icon: "campaign", title: "6. Marketing inclus", text: "E‑mails, automatisations, affiliation et pixels publicitaires (Facebook, TikTok…) pour attirer et fidéliser." },
            { icon: "public", title: "7. Pensé pour l'Afrique", text: "FCFA, français, pages par pays, et un support qui comprend votre réalité de créateur africain." },
          ]}
        />
      </>
    ),
  },
  {
    id: "comparatif",
    label: "Le comparatif 2026",
    content: (
      <>
        <GP>
          Voici comment se situent les principales plateformes utilisées par les créateurs africains, sur les critères qui décident réellement de vos ventes.
        </GP>
        <div className="my-6 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="bg-[#f6fbf2] text-left">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-600">Critère</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-[#006e2f]">Novakou</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-600">Les autres</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Mobile Money natif</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Wave, Orange, MTN, Moov + carte</td><td className="py-3 px-4 text-sm text-gray-600">Variable : natif chez Chariow/Selar, absent ou via intermédiaire chez Systeme.io/Gumroad</td></tr>
              <tr className="border-b border-gray-100 align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Frais pour démarrer</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Gratuit, commission simple</td><td className="py-3 px-4 text-sm text-gray-600">Souvent un abonnement mensuel obligatoire (Systeme.io) ou commission variable</td></tr>
              <tr className="border-b border-gray-100 align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Tunnel de vente (bump, upsell)</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Inclus, modèles prêts</td><td className="py-3 px-4 text-sm text-gray-600">Fort chez Systeme.io ; limité chez la plupart des plateformes africaines</td></tr>
              <tr className="border-b border-gray-100 align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Paiement séquestré (escrow)</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Oui, protection des 2 parties</td><td className="py-3 px-4 text-sm text-gray-600">Rare</td></tr>
              <tr className="border-b border-gray-100 align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Automatisation & e‑mails</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Séquences, workflows, relances</td><td className="py-3 px-4 text-sm text-gray-600">Complet chez Systeme.io ; basique ailleurs</td></tr>
              <tr className="border-b border-gray-100 align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Pixels pub (FB, TikTok, Snap, Pinterest)</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Sur toutes les pages</td><td className="py-3 px-4 text-sm text-gray-600">Partiel</td></tr>
              <tr className="border-b border-gray-100 align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Affiliation intégrée</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Oui</td><td className="py-3 px-4 text-sm text-gray-600">Chez certains</td></tr>
              <tr className="align-top"><td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Pensé Afrique francophone</td><td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ FCFA, français, pages pays</td><td className="py-3 px-4 text-sm text-gray-600">Chariow/Selar oui ; outils globaux non</td></tr>
            </tbody>
          </table>
        </div>
        <GP>
          La lecture est nette : les outils globaux gagnent sur le tunnel mais perdent sur le paiement local ; les plateformes africaines gagnent sur le Mobile Money mais offrent rarement un tunnel complet, l'escrow et l'automatisation réunis. <GStrong>Novakou est la seule à combiner les deux mondes</GStrong> — le paiement local ET les outils de vente avancés.
        </GP>
      </>
    ),
  },
  {
    id: "novakou",
    label: "Novakou : la plateforme n°1 en Afrique francophone",
    content: (
      <>
        <GP>
          Novakou a été pensée dès le premier jour pour le créateur africain qui veut vendre <GStrong>sérieusement</GStrong> — pas juste encaisser un paiement, mais construire un vrai business en ligne, prévisible et durable.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Créateurs de contenu collaborant sur le lancement d'une formation en ligne"
          caption="De la formation vidéo à l'ebook en passant par le coaching : une seule boutique pour tout vendre."
        />
        <GH3>Encaisser partout, tout de suite</GH3>
        <GP>
          Wave, Orange Money, MTN Mobile Money, Moov et carte bancaire — l'acheteur voit son moyen préféré dès la première étape et paie en quelques secondes. La diaspora paie par carte ; le voisin de quartier paie en Mobile Money. Personne n'est laissé de côté, et vos ventes ne s'arrêtent jamais à cause d'un blocage de paiement.
        </GP>
        <GH3>Vendre plus à chaque client</GH3>
        <GP>
          Tunnel de vente complet avec modèles prêts à l'emploi, <GA href="/guides/tunnel-de-vente-novakou">page de vente</GA> qui convertit, order bump et upsell en un clic. Vous ne vous contentez pas d'une vente : vous augmentez le panier moyen automatiquement, sans effort supplémentaire.
        </GP>
        <GH3>Vendre en confiance</GH3>
        <GP>
          Le paiement est <GStrong>séquestré</GStrong> : les fonds sont sécurisés puis libérés une fois la vente confirmée. Vos contenus vidéo et documents sont protégés contre le téléchargement non autorisé. Acheteur et vendeur sont protégés — et c'est exactement ce qui fait revenir les clients et bâtit votre réputation.
        </GP>
        <GH3>Attirer et fidéliser sans outil externe</GH3>
        <GP>
          <GA href="/guides/automatisations-novakou">Automatisations</GA> et séquences e‑mail, affiliation pour que d'autres vendent à votre place, et <GStrong>pixels publicitaires</GStrong> (Facebook, Instagram, TikTok, Snapchat, Pinterest) sur toutes vos pages pour suivre et rentabiliser vos campagnes. Tout est inclus, rien à brancher, aucun abonnement supplémentaire.
        </GP>
        <GCallout variant="success" title="Et au‑delà de l'Afrique">
          Grâce à la carte bancaire et aux paiements internationaux, vous vendez aussi à la <GStrong>diaspora</GStrong> et au reste du monde depuis la même boutique. Local pour encaisser, mondial pour grandir : c'est ça, la n°1 en Afrique — et dans le monde.
        </GCallout>
      </>
    ),
  },
  {
    id: "profil",
    label: "Quelle plateforme selon votre profil ?",
    content: (
      <>
        <GP>Toutes les plateformes ne se valent pas selon ce que vous vendez et à qui. Voici comment décider en 10 secondes :</GP>
        <GUl>
          <GLi><GStrong>Vous débutez et vendez à une audience africaine</GStrong> → Novakou : Mobile Money natif, gratuit pour commencer, tout est guidé étape par étape.</GLi>
          <GLi><GStrong>Vous vendez formations + coaching + abonnements</GStrong> → Novakou : tunnel, escrow, abonnements et automatisation réunis au même endroit.</GLi>
          <GLi><GStrong>Vous ciblez uniquement l'Europe/USA en carte</GStrong> → un outil global peut suffire, mais vous vous coupez du marché local africain.</GLi>
          <GLi><GStrong>Vous venez de Systeme.io</GStrong> → vous pouvez <GA href="/guides/importer-systeme-io">importer votre tunnel en 30 secondes</GA> et garder tout votre travail.</GLi>
        </GUl>
        <GP>
          Dans la grande majorité des cas — un créateur africain qui veut vendre à la fois localement et à la diaspora — <GStrong>Novakou est le choix qui coche toutes les cases sans compromis.</GStrong>
        </GP>
      </>
    ),
  },
  {
    id: "erreurs",
    label: "Les erreurs qui coûtent des ventes",
    content: (
      <>
        <GP>Même avec une bonne plateforme, ces erreurs font fuir les acheteurs. Évitez‑les dès le départ :</GP>
        <GUl>
          <GLi><GStrong>Ne pas proposer le Mobile Money</GStrong> — l'erreur n°1. Vous perdez la majorité des acheteurs locaux avant même qu'ils essaient.</GLi>
          <GLi><GStrong>Une page de paiement encombrée</GStrong> — trop de champs, de liens, de distractions. Chaque étape en trop fait chuter la conversion.</GLi>
          <GLi><GStrong>Aucune réassurance</GStrong> — pas de garantie, pas d'avis, pas de logo de sécurité. L'acheteur hésite et part.</GLi>
          <GLi><GStrong>Payer un abonnement avant d'avoir vendu</GStrong> — vous brûlez de la trésorerie sur un outil au lieu d'investir dans votre produit et votre publicité.</GLi>
          <GLi><GStrong>Dépendre d'un seul canal</GStrong> — misez sur WhatsApp, Facebook, TikTok et le référencement ensemble, pas sur un seul.</GLi>
        </GUl>
        <GCallout variant="tip" title="La règle d'or">
          Facilitez le paiement au maximum et rassurez à chaque étape. En Afrique, la <GStrong>confiance</GStrong> et la <GStrong>simplicité de paiement</GStrong> convertissent plus que n'importe quelle astuce marketing.
        </GCallout>
      </>
    ),
  },
  {
    id: "demarrer",
    label: "Démarrer en 5 minutes sur Novakou",
    content: (
      <>
        <GP>Pas de carte bancaire ni d'engagement pour commencer. Voici les 5 étapes :</GP>
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement.</GLi>
          <GLi><GStrong>Ajoutez votre premier produit</GStrong> (formation, ebook, template, coaching) — voir <GA href="/guides/creer-son-produit">créer son premier produit</GA>.</GLi>
          <GLi><GStrong>Activez le Mobile Money</GStrong> et la carte en un clic.</GLi>
          <GLi><GStrong>Partagez votre lien</GStrong> — page produit, lien de paiement direct, ou tunnel — sur WhatsApp, Facebook, TikTok.</GLi>
          <GLi><GStrong>Encaissez</GStrong> et suivez vos ventes en temps réel dans votre tableau de bord.</GLi>
        </GUl>
        <GP>
          Pour approfondir, lisez notre guide <GA href="/guides/novakou-fonctionnalites-completes">toutes les fonctionnalités de Novakou</GA> ou passez directement à l'action.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Quelle est la meilleure plateforme pour vendre des produits digitaux en Afrique ?",
    a: "Pour un créateur africain qui veut vendre localement (Mobile Money) et à la diaspora (carte), Novakou est la plateforme la plus complète : elle réunit Mobile Money natif, tunnel de vente, paiement séquestré, automatisation, affiliation et pixels publicitaires, en FCFA et en français. Les outils globaux comme Systeme.io excellent sur le tunnel mais n'ont pas de Mobile Money natif.",
  },
  {
    q: "Faut‑il payer un abonnement pour vendre sur Novakou ?",
    a: "Non. Vous créez votre boutique et vendez gratuitement ; Novakou se rémunère via une commission simple sur les ventes. Aucun abonnement obligatoire pour démarrer.",
  },
  {
    q: "Puis‑je accepter Wave, Orange Money et MTN ?",
    a: "Oui. Novakou accepte nativement Wave, Orange Money, MTN Mobile Money et Moov, en plus de la carte bancaire pour les paiements internationaux. L'acheteur choisit son moyen préféré au moment du paiement.",
  },
  {
    q: "Je viens de Systeme.io, dois‑je tout recommencer ?",
    a: "Non. Vous pouvez importer votre tunnel Systeme.io sur Novakou en collant simplement son URL : titre, textes et images sont récupérés automatiquement en brouillon.",
  },
  {
    q: "Est‑ce que je peux vendre en dehors de l'Afrique ?",
    a: "Oui. Avec la carte bancaire et les paiements internationaux, vous vendez à la diaspora et dans le monde entier depuis la même boutique, tout en encaissant localement en Mobile Money.",
  },
];

export default function MeilleuresPlateformesAfrique() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
