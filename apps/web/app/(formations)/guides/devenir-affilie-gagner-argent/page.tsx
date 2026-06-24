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
  slug: "devenir-affilie-gagner-argent",
  title: "Devenir affilié Novakou : gagner de l'argent en recommandant",
  subtitle:
    "Comment toucher 40 % de commission sur chaque vente que vous générez, sans rien créer ni vendre vous-même. Le guide complet, étape par étape.",
  category: "Gagner",
  level: "Débutant",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #006e2f, #22c55e)",
  icon: "group",
  time: "8 min",
  chapters: "7 sections",
  publishedAt: "2026-06-24",
  updatedAt: "2026-06-24",
  keywords: [
    "devenir affilié Afrique",
    "gagner argent affiliation",
    "programme affiliation Novakou",
    "commission affilié 40%",
    "affiliation Mobile Money",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Devenir affilié Novakou et gagner 40 %";
const SEO_DESCRIPTION =
  "Gagnez 40 % de commission en recommandant des formations et produits digitaux sur Novakou. Sans rien créer : partagez votre lien, encaissez via Mobile Money.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Devenir affilié Novakou",
)}&subtitle=${encodeURIComponent(
  "40 % de commission · sans rien créer · payé via Mobile Money",
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
    id: "cest-quoi",
    label: "L'affiliation, c'est quoi ?",
    content: (
      <>
        <GP>
          L'affiliation, c'est le moyen le plus simple de gagner de l'argent en ligne <GStrong>sans rien créer</GStrong>. Vous recommandez une formation ou un produit digital qui existe déjà sur Novakou, et à chaque fois que quelqu'un achète grâce à vous, vous touchez une commission.
        </GP>
        <GP>Vous n'avez pas besoin de :</GP>
        <GUl>
          <GLi>créer un produit ou une formation ;</GLi>
          <GLi>gérer les paiements, les livraisons ou le service client ;</GLi>
          <GLi>avoir un site web ou une grande audience.</GLi>
        </GUl>
        <GP>
          Un simple lien, partagé au bon endroit, suffit pour commencer.
        </GP>
      </>
    ),
  },
  {
    id: "combien",
    label: "Combien pouvez-vous gagner ?",
    content: (
      <>
        <GP>
          Sur Novakou, la commission affilié est de <GStrong>40 % du montant de chaque vente</GStrong> que vous générez. C'est l'un des taux les plus élevés du marché.
        </GP>
        <GCallout variant="success" title="Exemple concret">
          Vous recommandez une formation à 35 000 FCFA. Une personne l'achète via votre lien → vous gagnez <GStrong>14 000 FCFA</GStrong>. 10 ventes dans le mois = 140 000 FCFA, juste en partageant un lien.
        </GCallout>
        <GP>
          Il n'y a aucune limite : plus vous recommandez à des personnes réellement intéressées, plus vous gagnez.
        </GP>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Comment commencer en 3 étapes",
    content: (
      <>
        <GH3>1. Rejoignez le programme</GH3>
        <GP>
          Créez un compte sur Novakou (gratuit) et activez votre profil affilié depuis la page <GA href="/affiliation">Affiliation</GA>. Vous obtenez immédiatement votre <GStrong>lien unique</GStrong> du type <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">novakou.com/a/VOTRE-CODE</code>.
        </GP>
        <GH3>2. Partagez votre lien</GH3>
        <GP>
          Diffusez-le là où se trouve votre audience : WhatsApp, statuts WhatsApp, TikTok, Instagram, Facebook, groupes thématiques, votre chaîne YouTube ou votre newsletter.
        </GP>
        <GH3>3. Encaissez vos commissions</GH3>
        <GP>
          Dès qu'une personne achète via votre lien, votre commission est enregistrée. Vous suivez tout en temps réel depuis votre espace affilié.
        </GP>
      </>
    ),
  },
  {
    id: "parcours",
    label: "Quand et comment êtes-vous payé",
    content: (
      <>
        <GP>Vos gains passent par 3 étapes simples :</GP>
        <GUl>
          <GLi><GStrong>En validation (14 jours)</GStrong> : dès la vente, votre commission est enregistrée mais bloquée pendant 14 jours, le temps de la période de remboursement de l'acheteur.</GLi>
          <GLi><GStrong>Validée</GStrong> : passé ces 14 jours sans remboursement, votre commission devient 100 % sûre et s'ajoute à votre solde retirable.</GLi>
          <GLi><GStrong>Payée</GStrong> : vous demandez un retrait (à partir de 5 000 FCFA) via Orange Money, Wave, MTN MoMo ou virement bancaire, quand vous voulez.</GLi>
        </GUl>
        <GCallout variant="info" title="Pourquoi 14 jours ?">
          Ce délai protège tout le monde : si un acheteur se fait rembourser, la commission liée est simplement annulée. Une fois validé, votre solde ne bouge plus — vous êtes sûr d'être payé.
        </GCallout>
      </>
    ),
  },
  {
    id: "ou-partager",
    label: "Où partager pour vendre vraiment",
    content: (
      <>
        <GH3>WhatsApp (le plus efficace en Afrique)</GH3>
        <GP>
          Vos statuts WhatsApp et vos groupes sont vus par des gens qui vous font déjà confiance. Une recommandation sincère convertit énormément.
        </GP>
        <GH3>TikTok & Reels</GH3>
        <GP>
          Une courte vidéo qui montre le problème résolu par la formation, avec votre lien en bio ou en commentaire épinglé.
        </GP>
        <GH3>Groupes Facebook thématiques</GH3>
        <GP>
          Repérez les groupes liés au sujet (entrepreneuriat, design, marketing…) et apportez de la valeur avant de recommander — jamais de spam.
        </GP>
        <GCallout variant="tip" title="La règle d'or">
          Recommandez uniquement ce que vous trouvez réellement utile. La confiance se gagne une fois et se perd définitivement.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs",
    label: "Les erreurs à éviter",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Spammer</GStrong> des groupes ou des inconnus : ça nuit à votre réputation et peut entraîner un bannissement.</GLi>
          <GLi><GStrong>S'acheter à soi-même</GStrong> via son propre lien pour toucher la commission : c'est détecté automatiquement et annulé.</GLi>
          <GLi><GStrong>Promettre des résultats irréalistes</GStrong> (« gagne 1M en 3 jours ») : vous perdez en crédibilité.</GLi>
          <GLi><GStrong>Partager partout sans cibler</GStrong> : 10 personnes vraiment intéressées valent mieux que 1 000 indifférentes.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "demarrer",
    label: "Prêt à démarrer ?",
    content: (
      <>
        <GP>
          L'affiliation est le moyen le plus accessible de générer un premier revenu en ligne en Afrique francophone : zéro investissement, zéro création, payé en Mobile Money.
        </GP>
        <GP>
          Activez votre lien dès maintenant sur la page <GA href="/affiliation">Affiliation</GA> et partagez votre première recommandation aujourd'hui.
        </GP>
        <GCallout variant="info" title="Vous vendez aussi vos propres produits ?">
          Les deux sont cumulables. Découvrez comment <GA href="/guides/affiliation-recruter-affilies">recruter vos propres affiliés</GA> pour démultiplier vos ventes.
        </GCallout>
      </>
    ),
  },
];

export default function DevenirAffilieGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
