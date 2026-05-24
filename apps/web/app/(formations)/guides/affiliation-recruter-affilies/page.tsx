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
  slug: "affiliation-recruter-affilies",
  title: "Recruter des affiliés pour démultiplier vos ventes (méthode Novakou)",
  subtitle:
    "Construire un programme d'affiliation rentable : commission idéale, recrutement, tracking sur Novakou, gestion des paiements.",
  category: "Vendre",
  level: "Intermédiaire",
  levelColor: "#8b5cf6",
  gradient: "linear-gradient(135deg, #8b5cf6, #6366f1)",
  icon: "group_add",
  time: "11 min",
  chapters: "9 sections",
  publishedAt: "2026-05-16",
  updatedAt: "2026-05-24",
  keywords: [
    "affiliation Afrique",
    "programme affiliés",
    "marketing d'affiliation Novakou",
    "commission affilié digital",
    "recruter affiliés formation",
  ],
};

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${meta.title} | Guides Novakou`,
  description: meta.subtitle,
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
    title: meta.title,
    description: meta.subtitle,
    url: `${APP_URL}/guides/${meta.slug}`,
    siteName: "Novakou",
    publishedTime: meta.publishedAt,
    modifiedTime: meta.updatedAt,
  },
};

const sections: GuideSection[] = [
  {
    id: "pourquoi",
    label: "Pourquoi l'affiliation change tout",
    content: (
      <>
        <GP>
          L'affiliation transforme votre business : au lieu de vendre seul, vous avez <GStrong>10, 50 ou 200 personnes qui vendent pour vous</GStrong> en échange d'une commission. Vous payez seulement quand une vente est réalisée — risque zéro.
        </GP>
        <GP>
          Les avantages côté créateur :
        </GP>
        <GUl>
          <GLi><GStrong>Scaling rapide</GStrong> sans budget pub.</GLi>
          <GLi><GStrong>Audiences nouvelles</GStrong> que vous n'auriez pas atteintes seul.</GLi>
          <GLi><GStrong>Coût d'acquisition prévisible</GStrong> (commission fixée à l'avance).</GLi>
          <GLi><GStrong>Preuve sociale</GStrong> : avoir des affiliés crédibilise votre formation.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "commission",
    label: "Quelle commission proposer ?",
    content: (
      <>
        <GP>
          C'est <GStrong>LE</GStrong> facteur déterminant. Trop bas → personne ne veut promouvoir. Trop haut → vous travaillez à perte.
        </GP>
        <GH3>Benchmark Novakou 2026</GH3>
        <GUl>
          <GLi><GStrong>20 %</GStrong> : minimum acceptable. Affiliés casuels qui partagent à leur audience existante.</GLi>
          <GLi><GStrong>30 %</GStrong> : sweet spot. Attire des affiliés qui investissent du temps (posts, vidéos, emails).</GLi>
          <GLi><GStrong>40 %</GStrong> : super-affiliés qui font de la pub payante avec votre lien.</GLi>
          <GLi><GStrong>50 % et plus</GStrong> : réservé aux lancements/relances ponctuelles. Pas viable en permanent.</GLi>
        </GUl>
        <GCallout variant="tip" title="Calcul simple">
          Si votre formation est à 35 000 FCFA et votre marge brute (après Mobile Money + Novakou 10 %) est ~30 000 FCFA, donner 30 % = 10 500 FCFA à l'affilié = 19 500 FCFA pour vous. Encore largement rentable.
        </GCallout>
      </>
    ),
  },
  {
    id: "activer",
    label: "Activer le programme d'affiliation sur Novakou",
    content: (
      <>
        <GP>
          Tableau de bord vendeur → <GStrong>Marketing → Affiliation</GStrong>. Configuration en 5 minutes :
        </GP>
        <GUl>
          <GLi>Activer le programme.</GLi>
          <GLi>Fixer la commission (% par vente).</GLi>
          <GLi>Définir la durée du cookie (30 jours recommandé).</GLi>
          <GLi>Choisir les produits éligibles (par défaut : tous).</GLi>
          <GLi>Conditions d'approbation (acceptation manuelle ou auto).</GLi>
        </GUl>
        <GP>
          Une fois activé, chaque affilié approuvé obtient un <GStrong>lien personnalisé</GStrong> du type <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">novakou.com/a/CODE</code> qui track ses ventes.
        </GP>
      </>
    ),
  },
  {
    id: "trouver",
    label: "Où trouver vos premiers affiliés",
    content: (
      <>
        <GH3>1. Vos meilleurs clients</GH3>
        <GP>
          Les acheteurs satisfaits sont vos meilleurs affiliés potentiels. Identifiez ceux qui ont laissé un avis 5 étoiles, contactez-les en DM : "Tu as adoré ma formation, veux-tu en gagner X FCFA pour chaque ami que tu nous présentes ?"
        </GP>
        <GH3>2. Micro-influenceurs de votre niche</GH3>
        <GP>
          Cherchez sur Instagram/TikTok des créateurs avec <GStrong>1k-10k followers qualifiés</GStrong> dans votre niche. Ils ont une audience engagée et ne sont pas (encore) inondés de propositions sponsor.
        </GP>
        <GH3>3. Groupes Facebook/WhatsApp thématiques</GH3>
        <GP>
          Identifiez les admins de groupes liés à votre sujet (ex: "Entrepreneurs Sénégal"). Beaucoup acceptent de recommander une formation en échange d'une commission, surtout si le contenu apporte de la valeur à leur communauté.
        </GP>
        <GH3>4. Blogueurs / Youtubeurs</GH3>
        <GP>
          Les créateurs de contenu long-format ont besoin de monétiser. Une mention bien faite dans un article ou une vidéo peut générer 5-15 ventes selon leur audience.
        </GP>
      </>
    ),
  },
  {
    id: "kit",
    label: "Créer un kit affilié irrésistible",
    content: (
      <>
        <GP>
          Plus c'est facile pour l'affilié, plus il vendra. Préparez un <GStrong>"kit affilié"</GStrong> que vous envoyez à chaque nouvel affilié approuvé :
        </GP>
        <GUl>
          <GLi><GStrong>5 visuels prêts à poster</GStrong> (Instagram square + story + Reel thumbnail). Format Canva éditable + PNG exporté.</GLi>
          <GLi><GStrong>3 emails templates</GStrong> à envoyer à sa liste (présentation, urgence, dernière chance).</GLi>
          <GLi><GStrong>3 scripts WhatsApp Status</GStrong> (15-30 sec chacun).</GLi>
          <GLi><GStrong>Argumentaire de vente</GStrong> (1 page) avec les bénéfices, objections fréquentes et réponses.</GLi>
          <GLi><GStrong>Code promo unique</GStrong> par affilié (ex: -15 % avec leur prénom).</GLi>
        </GUl>
        <GCallout variant="success" title="Impact direct">
          Les programmes d'affiliation avec kit fourni convertissent <GStrong>3 à 5 fois mieux</GStrong> que ceux qui laissent l'affilié se débrouiller. Investissez 1 journée à créer le kit — vous gagnerez des mois.
        </GCallout>
      </>
    ),
  },
  {
    id: "paiement",
    label: "Comment et quand payer vos affiliés",
    content: (
      <>
        <GP>
          Sur Novakou, les commissions affiliés sont calculées automatiquement à chaque vente confirmée. Le délai escrow standard est de <GStrong>14 jours</GStrong> (couvre la fenêtre de remboursement potentielle).
        </GP>
        <GH3>Cycle de paiement</GH3>
        <GP>
          Paiement mensuel le 5 du mois suivant. Minimum de retrait : 5 000 FCFA. Les affiliés reçoivent automatiquement via Mobile Money ou virement bancaire selon leur configuration.
        </GP>
        <GH3>Cas concret</GH3>
        <GP>
          Si un affilié fait 8 ventes en mai à 30 % de commission de 35 000 FCFA → 8 × 10 500 = 84 000 FCFA. Versement le 5 juin sur son numéro Mobile Money.
        </GP>
      </>
    ),
  },
  {
    id: "motiver",
    label: "Motiver vos affiliés sur la durée",
    content: (
      <>
        <GP>
          80 % des affiliés ne font aucune vente. Vos 20 % top performers font 80 % du chiffre. Concentrez votre énergie sur eux :
        </GP>
        <GUl>
          <GLi><GStrong>Newsletter affiliés mensuelle</GStrong> avec nouvelles ressources, témoignages, chiffres clés.</GLi>
          <GLi><GStrong>Concours mensuels</GStrong> : "Top affilié du mois reçoit un bonus de 50 000 FCFA".</GLi>
          <GLi><GStrong>Commission majorée temporaire</GStrong> sur les nouveaux produits (40 % les 30 premiers jours).</GLi>
          <GLi><GStrong>Reconnaissance publique</GStrong> : Hall of Fame sur votre site/réseaux.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "limites",
    label: "Pièges à éviter",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Auto-affiliation</GStrong> : ne pas accepter d'affiliés qui s'achètent eux-mêmes pour toucher la commission. Novakou détecte automatiquement (même téléphone, IP, etc.).</GLi>
          <GLi><GStrong>Promotion abusive</GStrong> : interdire la pub Google Ads sur votre nom de marque (vous payeriez pour acquérir vos propres clients).</GLi>
          <GLi><GStrong>Spam</GStrong> : exiger des affiliés qu'ils ne spamment pas (groupes Facebook publics, emails non sollicités). Ban immédiat si ça arrive.</GLi>
          <GLi><GStrong>Promesses fausses</GStrong> : surveillez les visuels que vos affiliés créent. Ne laissez pas des promesses irréalistes (ex: "Gagne 1M FCFA en 7 jours") qui peuvent vous mettre en risque légal.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "scaler",
    label: "Passer de 5 à 50 affiliés actifs",
    content: (
      <>
        <GP>
          Quand vous avez validé le modèle (5-10 affiliés actifs qui génèrent du CA), c'est le moment de <GStrong>structurer le recrutement</GStrong> :
        </GP>
        <GUl>
          <GLi>Page publique "Devenir affilié" avec formulaire de candidature.</GLi>
          <GLi>Webinaire mensuel "Comment promouvoir nos formations" (30 min, gratuit).</GLi>
          <GLi>Groupe WhatsApp privé entre affiliés (ils s'entraident, partagent leurs scripts).</GLi>
          <GLi>Outil de tracking dashboard pour les affiliés (Novakou fournit déjà ça gratuitement).</GLi>
        </GUl>
        <GCallout variant="info" title="Pour aller plus loin">
          Voir aussi : <GA href="/guides/scaler-catalogue-produits">Scaler son catalogue pour augmenter la commission par vente</GA>.
        </GCallout>
      </>
    ),
  },
];

export default function AffiliationGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
