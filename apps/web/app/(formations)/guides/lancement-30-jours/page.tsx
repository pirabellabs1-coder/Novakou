import type { Metadata } from "next";
import {
  GuideArticleLayout,
  GP,
  GH3,
  GUl,
  GOl,
  GLi,
  GStrong,
  GA,
  GCallout,
  type GuideMeta,
  type GuideSection,
} from "@/components/formations/GuideArticleLayout";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://novakou.com";

const meta: GuideMeta = {
  slug: "lancement-30-jours",
  title: "Lancer sa formation en 30 jours : checklist actionnable jour par jour",
  subtitle:
    "Planning jour par jour de l'idée à la 1ère vente. Méthode validée par 100+ créateurs Novakou — 0 capital initial requis.",
  category: "Créer",
  level: "Intermédiaire",
  levelColor: "#ef4444",
  gradient: "linear-gradient(135deg, #ef4444, #f59e0b)",
  icon: "rocket_launch",
  time: "16 min",
  chapters: "12 étapes",
  publishedAt: "2026-05-14",
  updatedAt: "2026-05-24",
  keywords: [
    "lancer formation 30 jours",
    "lancement produit digital Afrique",
    "première vente formation",
    "checklist créateur",
    "méthode lancement",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Lancement formation en 30 jours : checklist";
const SEO_DESCRIPTION =
  "Planning jour par jour pour lancer votre formation en 30 jours, de l'idée à la première vente. Méthode validée par 100+ créateurs Novakou. 0 capital.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Lancer sa formation en 30 jours",
)}&subtitle=${encodeURIComponent(
  "Checklist jour par jour : de l'idée à la 1ère vente — 0 budget",
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
    id: "promesse",
    label: "La promesse : où vous êtes au jour 30",
    content: (
      <>
        <GP>
          En suivant cette méthode jour par jour, à la fin des 30 jours vous aurez :
        </GP>
        <GUl>
          <GLi>Une formation complète publiée sur Novakou.</GLi>
          <GLi>Une page produit optimisée avec témoignages.</GLi>
          <GLi>Entre <GStrong>5 et 30 ventes</GStrong> selon votre audience de départ.</GLi>
          <GLi>Un revenu net entre <GStrong>100 000 et 700 000 FCFA</GStrong>.</GLi>
          <GLi>Une méthodologie reproductible pour les lancements suivants.</GLi>
        </GUl>
        <GCallout variant="info" title="Pré-requis">
          1 à 2 heures par jour pendant 30 jours. Un smartphone récent suffit. Pas de capital initial requis (sauf 3-5k FCFA pour un micro-cravate).
        </GCallout>
      </>
    ),
  },
  {
    id: "j1-3",
    label: "Jours 1-3 : choisir et valider votre idée",
    content: (
      <>
        <GH3>Jour 1 — Brainstorming</GH3>
        <GP>
          Listez 5 sujets sur lesquels vous êtes capable de tenir 4 heures de discussion sans préparer. C'est votre vivier d'idées.
        </GP>
        <GH3>Jour 2 — Sélection</GH3>
        <GP>
          Pour chaque sujet, vérifiez 3 critères : <GStrong>compétence personnelle</GStrong>, <GStrong>demande existante</GStrong> (vos amis vous demandent ce conseil), <GStrong>monétisable</GStrong> (les gens paient ailleurs pour ce sujet).
        </GP>
        <GP>
          Voir aussi : <GA href="/guides/trouver-son-idee-de-produit">Comment trouver son idée de produit digital</GA>.
        </GP>
        <GH3>Jour 3 — Validation</GH3>
        <GP>
          Envoyez 5 messages WhatsApp à 5 personnes qui correspondent à votre client cible. "Si je proposais une formation qui [transformation X], tu paierais combien ?". <GStrong>3 oui sur 5</GStrong> = validé.
        </GP>
      </>
    ),
  },
  {
    id: "j4-10",
    label: "Jours 4-10 : produire le contenu",
    content: (
      <>
        <GH3>Jour 4 — Plan détaillé</GH3>
        <GP>
          4-5 modules. 3-5 leçons par module. Total : 2-4h de contenu. Plan sur Google Doc, validation par 1 ami expérimenté.
        </GP>
        <GH3>Jour 5 — Setup matériel</GH3>
        <GP>
          Achat micro-cravate (3 500-5 000 FCFA). Test enregistrement OBS Studio (gratuit). Test montage CapCut (gratuit).
        </GP>
        <GH3>Jours 6-9 — Enregistrement</GH3>
        <GP>
          <GStrong>2 leçons par soir</GStrong> après le travail. Filmez en lumière naturelle (face à une fenêtre). Ne refaites pas une prise pour des hésitations mineures — c'est plus humain et personne ne perd 4h pour refaire.
        </GP>
        <GH3>Jour 10 — Supports</GH3>
        <GP>
          Création des PDF d'exercice + récap. Outil : Google Docs → export PDF, ou Canva pour mise en page.
        </GP>
      </>
    ),
  },
  {
    id: "j11-12",
    label: "Jours 11-12 : mise en ligne sur Novakou",
    content: (
      <>
        <GH3>Jour 11 — Upload</GH3>
        <GP>
          Création compte vendeur (5 min). Upload des vidéos + PDF (compter 3 heures pour bien faire). Activation Mobile Money + carte.
        </GP>
        <GH3>Jour 12 — Page produit</GH3>
        <GP>
          Titre clair, prix <GStrong>milieu de gamme</GStrong> (25-35k FCFA pour une formation 4h), image cover soignée (capture d'écran de votre meilleur module), description structurée AIDA.
        </GP>
        <GP>
          Voir aussi : <GA href="/guides/description-produit">Rédiger une description de produit irrésistible</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "j13-17",
    label: "Jours 13-17 : premières ventes (warm)",
    content: (
      <>
        <GH3>Jour 13 — WhatsApp Status + DM directs</GH3>
        <GP>
          Status WhatsApp 15 sec face caméra : "C'est sorti. Formation [titre]. Prix promo -30 % cette semaine seulement. Lien dans bio."
        </GP>
        <GP>
          Messages directs aux 5 personnes du test initial (jour 3) + 20 autres contacts proches qui pourraient être intéressés.
        </GP>
        <GH3>Jours 14-15 — LinkedIn posts</GH3>
        <GP>
          1 post par jour. Format : un conseil concret lié à votre sujet, signature en bas avec lien discret. <GStrong>3 ventes en moyenne</GStrong> sur ces 2 jours pour les bons posts.
        </GP>
        <GH3>Jours 16-17 — Premiers témoignages</GH3>
        <GP>
          Contactez les 3-5 premiers acheteurs. Demandez un témoignage audio de 30 secondes. Ajoutez ça sur votre page produit. <GStrong>Conversion +30 %</GStrong> instantanément.
        </GP>
      </>
    ),
  },
  {
    id: "j18-22",
    label: "Jours 18-22 : amplification organique",
    content: (
      <>
        <GH3>Posts LinkedIn quotidiens</GH3>
        <GP>
          1 post chaque jour. Variez les formats : story personnelle, mini-tutoriel, mise en avant client, prise de position sectorielle.
        </GP>
        <GH3>Instagram Reels (3 par semaine)</GH3>
        <GP>
          Hook fort dans les 3 premières secondes, sous-titres, CTA "lien en bio". Voir <GA href="/guides/instagram-vendre-formations-afrique">guide Instagram</GA>.
        </GP>
        <GH3>WhatsApp Status (3 par jour)</GH3>
        <GP>
          Matin (conseil), après-midi (témoignage client), soir (CTA promo).
        </GP>
      </>
    ),
  },
  {
    id: "j23-28",
    label: "Jours 23-28 : pub Facebook (5 000 FCFA/jour)",
    content: (
      <>
        <GH3>Jour 23 — Setup Meta Ads</GH3>
        <GP>
          Création Business Manager. Installation Pixel via Novakou. Configuration carte de paiement. Voir le <GA href="/guides/publicite-facebook">guide pub Facebook</GA>.
        </GP>
        <GH3>Jours 24-26 — Première campagne</GH3>
        <GP>
          Audience large pays cible, 5 000 FCFA/jour, objectif "Conversion/Achat", créatif vidéo selfie. Attendre 3 jours avant d'analyser (algorithme apprend).
        </GP>
        <GH3>Jours 27-28 — Optimisation</GH3>
        <GP>
          Analyser CTR et conversion. Garder le créatif gagnant. Si pas de vente après 3 jours : problème pas dans la pub, mais dans la page produit ou le prix.
        </GP>
      </>
    ),
  },
  {
    id: "j29-30",
    label: "Jours 29-30 : bilan et suite",
    content: (
      <>
        <GH3>Jour 29 — Mesurer</GH3>
        <GUl>
          <GLi>Nombre total de ventes ?</GLi>
          <GLi>Chiffre d'affaires brut ?</GLi>
          <GLi>Coût pub total dépensé ?</GLi>
          <GLi>Commission Novakou (10 %) ?</GLi>
          <GLi>= <GStrong>Bénéfice net</GStrong> sur ces 30 jours.</GLi>
          <GLi>Quelle source a généré le plus de ventes ? (WhatsApp / LinkedIn / Pub Facebook)</GLi>
        </GUl>
        <GH3>Jour 30 — Planifier la suite</GH3>
        <GUl>
          <GLi>Augmenter le budget pub (max +20 %/jour, voir guide).</GLi>
          <GLi>Créer un <GStrong>upsell</GStrong> à proposer aux acheteurs (formation complémentaire à 50 % du prix principal).</GLi>
          <GLi>Lancer un <GStrong>programme d'affiliation</GStrong> avec vos meilleurs clients comme premiers affiliés.</GLi>
          <GLi>Voir <GA href="/guides/affiliation-recruter-affilies">guide affiliation</GA>.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "pieges",
    label: "Les 5 pièges fatals à éviter",
    content: (
      <>
        <GOl>
          <GLi><GStrong>Perfectionner avant de lancer</GStrong> : "j'attends d'avoir 8 modules au lieu de 4" = 3 mois perdus. Lancez à 80 %, améliorez ensuite.</GLi>
          <GLi><GStrong>Pricer trop bas par insécurité</GStrong> : 5k FCFA pour 4h de formation, vous attirez des acheteurs non-consommateurs. Visez 25-35k.</GLi>
          <GLi><GStrong>Pas de Pixel installé</GStrong> avant la pub. Vous brûlez 50k FCFA sans pouvoir optimiser.</GLi>
          <GLi><GStrong>Pas de paiement Mobile Money</GStrong> : -70 % de marché en Afrique. Activez tout.</GLi>
          <GLi><GStrong>Abandonner à J15 sans vente</GStrong> : les bonnes campagnes décollent souvent à J18-22. Tenez la cadence.</GLi>
        </GOl>
      </>
    ),
  },
  {
    id: "outils",
    label: "Boîte à outils complète (tout gratuit)",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Enregistrement écran</GStrong> : OBS Studio (gratuit).</GLi>
          <GLi><GStrong>Montage vidéo</GStrong> : CapCut (gratuit, mobile + desktop).</GLi>
          <GLi><GStrong>Mise en page PDF</GStrong> : Canva (gratuit).</GLi>
          <GLi><GStrong>Design visuels</GStrong> : Canva.</GLi>
          <GLi><GStrong>Hébergement formation + paiement</GStrong> : Novakou (gratuit, 10 % commission sur les ventes).</GLi>
          <GLi><GStrong>Pub Facebook</GStrong> : Meta Business Manager (gratuit, vous payez les pubs).</GLi>
          <GLi><GStrong>Tracker tunnel/conversions</GStrong> : intégré dans Novakou.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "cas-pratique",
    label: "Cas pratique : Aïcha, 669 000 FCFA en 30 jours",
    content: (
      <>
        <GP>
          Aïcha (28 ans, assistante admin Dakar) a appliqué cette méthode en mai 2026. Sujet : formation Excel pour reporting pro.
        </GP>
        <GUl>
          <GLi>Semaines 1-2 : sujet validé + production 16 vidéos.</GLi>
          <GLi>Semaine 3 : 12 ventes (WhatsApp + LinkedIn organique).</GLi>
          <GLi>Semaine 4 : 20 ventes additionnelles via pub Facebook.</GLi>
          <GLi><GStrong>Total : 32 ventes × 25k FCFA = 800k brut, 669k net</GStrong>.</GLi>
          <GLi>Capital initial : 0 FCFA.</GLi>
          <GLi>Investissement total : 51 000 FCFA (micro + pub).</GLi>
        </GUl>
        <GP>
          Vous n'avez rien d'exceptionnel à faire. Juste la méthode + la régularité quotidienne. <GA href="/inscription?role=vendeur">Créez votre compte maintenant</GA>.
        </GP>
      </>
    ),
  },
];

export default function Lancement30JoursGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
