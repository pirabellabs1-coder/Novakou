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
  slug: "meilleures-plateformes-vendre-produits-digitaux-afrique",
  title: "Les meilleures plateformes pour vendre des produits digitaux en Afrique (2026)",
  subtitle:
    "Comparatif complet : Mobile Money, frais, tunnel de vente, sécurité. Pourquoi Novakou est la plateforme n°1 pour vendre vos formations et produits numériques en Afrique francophone.",
  category: "Vendre",
  level: "Complet",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "storefront",
  time: "12 min",
  chapters: "7 sections",
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

/* Petit composant de tableau comparatif responsive */
function Row({ crit, novakou, autres }: { crit: string; novakou: string; autres: string }) {
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="py-3 pr-4 font-semibold text-[#191c1e] text-sm">{crit}</td>
      <td className="py-3 pr-4 text-sm text-[#006e2f] font-semibold">{novakou}</td>
      <td className="py-3 text-sm text-gray-600">{autres}</td>
    </tr>
  );
}

const sections: GuideSection[] = [
  {
    id: "pourquoi",
    label: "Pourquoi le choix de la plateforme change tout en Afrique",
    content: (
      <>
        <GP>
          En Afrique francophone, choisir sa plateforme de vente n'est pas un détail technique : c'est la décision qui détermine si vous <GStrong>encaissez réellement</GStrong> ou si vous regardez vos acheteurs abandonner au moment de payer.
        </GP>
        <GP>
          La raison est simple. Le taux de bancarisation reste faible dans une grande partie du continent, alors que le <GStrong>Mobile Money est massif</GStrong>. Une plateforme qui n'accepte que la carte bancaire ou PayPal, c'est se couper de plus de <GStrong>70 % de sa clientèle locale</GStrong>. Wave, Orange Money, MTN Mobile Money ne sont pas une option : ce sont les moyens de paiement par défaut de vos acheteurs.
        </GP>
        <div className="my-8 rounded-2xl overflow-hidden border border-gray-200">
          <Image
            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&h=630&fit=crop&q=80&auto=format"
            alt="Entrepreneure africaine gérant sa boutique en ligne depuis son ordinateur"
            width={1200}
            height={630}
            className="w-full h-auto"
          />
        </div>
        <GCallout variant="tip" title="La bonne question à se poser">
          Ne demandez pas « quelle plateforme est la plus jolie ? » mais « avec laquelle mon acheteur de Dakar, d'Abidjan ou de Douala peut‑il payer <GStrong>en 30 secondes avec son téléphone</GStrong> ? ». Tout le reste en découle.
        </GCallout>
      </>
    ),
  },
  {
    id: "criteres",
    label: "Les 7 critères d'une bonne plateforme",
    content: (
      <>
        <GP>Avant de comparer les noms, voici ce qui compte vraiment quand on vend des produits numériques en Afrique :</GP>
        <GUl>
          <GLi><GStrong>Mobile Money natif</GStrong> — Wave, Orange Money, MTN, Moov, en plus de la carte. Sans lui, rien d'autre ne compte.</GLi>
          <GLi><GStrong>Frais raisonnables et clairs</GStrong> — une commission simple, sans abonnement obligatoire pour démarrer.</GLi>
          <GLi><GStrong>Tunnel de vente intégré</GStrong> — page de vente, order bump, upsell : pour vendre plus à chaque client, pas juste encaisser.</GLi>
          <GLi><GStrong>Sécurité et confiance</GStrong> — paiement séquestré (escrow), protection acheteur/vendeur, contenus protégés contre le piratage.</GLi>
          <GLi><GStrong>Livraison automatique</GStrong> — l'acheteur reçoit son accès immédiatement, sans intervention manuelle.</GLi>
          <GLi><GStrong>Marketing inclus</GStrong> — e‑mails, automatisations, affiliation, pixels publicitaires (Facebook, TikTok…) pour attirer et retenir.</GLi>
          <GLi><GStrong>Pensé pour l'Afrique francophone</GStrong> — FCFA, français, support qui comprend votre réalité, pages par pays.</GLi>
        </GUl>
        <GCallout variant="warning" title="Le piège des outils « globaux »">
          Systeme.io, Podia ou Gumroad sont d'excellents outils… conçus pour l'Europe et les États‑Unis. Le Mobile Money y est absent ou bricolé via un intermédiaire, et le rapatriement des fonds vers un compte africain devient un casse‑tête. Vous payez pour des fonctionnalités que vos acheteurs ne peuvent pas utiliser.
        </GCallout>
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
            <tbody className="px-4">
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
          La lecture est nette : les outils globaux gagnent sur le tunnel mais perdent sur le paiement local ; les plateformes africaines gagnent sur le Mobile Money mais offrent rarement un tunnel complet, l'escrow et l'automatisation. <GStrong>Novakou est la seule à réunir les deux mondes.</GStrong>
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
          Novakou a été pensée dès le premier jour pour le créateur africain qui veut vendre <GStrong>sérieusement</GStrong> — pas juste encaisser un paiement, mais construire un vrai business en ligne.
        </GP>
        <GH3>Encaisser partout, tout de suite</GH3>
        <GP>
          Wave, Orange Money, MTN Mobile Money, Moov et carte bancaire — l'acheteur voit son moyen préféré dès la première étape et paie en quelques secondes. La diaspora paie par carte ; le voisin de quartier paie en Mobile Money. Personne n'est laissé de côté.
        </GP>
        <div className="my-8 rounded-2xl overflow-hidden border border-gray-200">
          <Image
            src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=630&fit=crop&q=80&auto=format"
            alt="Créateurs de contenu collaborant sur le lancement d'une formation en ligne"
            width={1200}
            height={630}
            className="w-full h-auto"
          />
        </div>
        <GH3>Vendre plus à chaque client</GH3>
        <GP>
          Tunnel de vente complet avec modèles prêts à l'emploi, <GA href="/guides/tunnel-de-vente-novakou">page de vente</GA>, order bump et upsell en un clic. Vous ne vous contentez pas d'une vente : vous augmentez le panier moyen automatiquement.
        </GP>
        <GH3>Vendre en confiance</GH3>
        <GP>
          Le paiement est <GStrong>séquestré</GStrong> : les fonds sont sécurisés puis libérés une fois la vente confirmée. Vos contenus vidéo et documents sont protégés contre le téléchargement non autorisé. Acheteur et vendeur sont protégés — c'est ce qui fait revenir les clients.
        </GP>
        <GH3>Attirer et fidéliser sans outil externe</GH3>
        <GP>
          <GA href="/guides/automatisations-novakou">Automatisations</GA> et séquences e‑mail, affiliation pour que d'autres vendent à votre place, et <GStrong>pixels publicitaires</GStrong> (Facebook, Instagram, TikTok, Snapchat, Pinterest) sur toutes vos pages pour suivre et rentabiliser vos campagnes. Tout est inclus, rien à brancher.
        </GP>
        <GCallout variant="success" title="Et au‑delà de l'Afrique">
          Grâce à la carte bancaire et aux paiements internationaux, vous vendez aussi à la <GStrong>diaspora</GStrong> et au reste du monde depuis la même boutique. Local pour encaisser, mondial pour grandir.
        </GCallout>
      </>
    ),
  },
  {
    id: "profil",
    label: "Quelle plateforme selon votre profil ?",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Vous débutez et vendez à une audience africaine</GStrong> → Novakou : Mobile Money, gratuit pour commencer, tout est guidé.</GLi>
          <GLi><GStrong>Vous vendez formations + coaching + abonnements</GStrong> → Novakou : tunnel, escrow, abonnements et automatisation dans un seul endroit.</GLi>
          <GLi><GStrong>Vous ciblez surtout l'Europe/USA en carte</GStrong> → un outil global peut suffire, mais vous perdez le marché local.</GLi>
          <GLi><GStrong>Vous venez de Systeme.io</GStrong> → vous pouvez <GA href="/guides/importer-systeme-io">importer votre tunnel en 30 secondes</GA> et garder votre travail.</GLi>
        </GUl>
        <GP>
          Dans la grande majorité des cas — un créateur africain qui veut vendre à la fois localement et à la diaspora — <GStrong>Novakou est le choix qui coche toutes les cases sans compromis.</GStrong>
        </GP>
      </>
    ),
  },
  {
    id: "demarrer",
    label: "Démarrer en 5 minutes sur Novakou",
    content: (
      <>
        <GP>Pas de carte bancaire ni d'engagement pour commencer :</GP>
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement.</GLi>
          <GLi><GStrong>Ajoutez votre premier produit</GStrong> (formation, ebook, template, coaching) — voir <GA href="/guides/creer-son-produit">créer son premier produit</GA>.</GLi>
          <GLi><GStrong>Activez le Mobile Money</GStrong> et la carte en un clic.</GLi>
          <GLi><GStrong>Partagez votre lien</GStrong> — page produit, lien de paiement direct, ou tunnel — sur WhatsApp, Facebook, TikTok.</GLi>
          <GLi><GStrong>Encaissez</GStrong> et suivez vos ventes en temps réel.</GLi>
        </GUl>
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
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} />;
}
