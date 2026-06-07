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
  slug: "email-marketing-5-emails-vendent",
  title: "Les 5 emails indispensables qui font vendre (+ templates copiables)",
  subtitle:
    "Welcome, valeur, autorité, objection, dernier appel — la séquence éprouvée + 5 templates emails complets prêts à copier pour votre première campagne.",
  category: "Automatiser",
  level: "Intermédiaire",
  levelColor: "#0ea5e9",
  gradient: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
  icon: "mark_email_read",
  time: "12 min",
  chapters: "8 sections",
  publishedAt: "2026-05-13",
  updatedAt: "2026-05-24",
  keywords: [
    "email marketing vendre formation",
    "séquence emails templates",
    "email autorité conversion",
    "emails qui vendent Afrique",
    "automation email Novakou",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Email marketing : 5 emails qui vendent formation";
const SEO_DESCRIPTION =
  "Les 5 emails indispensables qui font vendre votre formation : welcome, valeur, autorité, objection, dernier appel. 5 templates prêts à copier inclus.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "5 emails qui font vendre formation",
)}&subtitle=${encodeURIComponent(
  "Welcome, valeur, autorité, objection, dernier appel — templates",
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
    id: "pourquoi",
    label: "Pourquoi l'email reste roi de la conversion",
    content: (
      <>
        <GP>
          Malgré l'explosion des réseaux sociaux, l'email reste <GStrong>le canal le plus rentable</GStrong> en marketing digital. ROI moyen mesuré : <GStrong>36 € pour 1 € investi</GStrong> selon Litmus 2025. Beaucoup mieux que la pub Facebook (3-5×) ou Instagram organique (1-2×).
        </GP>
        <GP>
          3 raisons :
        </GP>
        <GUl>
          <GLi><GStrong>Vous possédez votre audience</GStrong> (contrairement à TikTok ou Instagram qui peuvent vous "déranker" du jour au lendemain).</GLi>
          <GLi><GStrong>Taux d'ouverture en Afrique : 35-45 %</GStrong>, beaucoup plus que les marchés occidentaux (18-25 %).</GLi>
          <GLi><GStrong>Personnalisation impossible ailleurs</GStrong> (prénom, segmentation, déclencheurs comportementaux).</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "preparer",
    label: "Préparer votre liste d'emails (avant les templates)",
    content: (
      <>
        <GH3>D'où viennent les bons emails ?</GH3>
        <GUl>
          <GLi><GStrong>Lead magnet gratuit</GStrong> sur votre tunnel Novakou (PDF, vidéo, mini-cours). Voir <GA href="/guides/tunnel-de-vente-novakou">guide tunnel</GA>.</GLi>
          <GLi><GStrong>Acheteurs existants</GStrong> (auto-importés dans Novakou à chaque vente).</GLi>
          <GLi><GStrong>Inscription newsletter</GStrong> via formulaire sur votre boutique.</GLi>
          <GLi><GStrong>Lien WhatsApp Bio</GStrong> qui pointe sur votre lead magnet.</GLi>
        </GUl>
        <GCallout variant="warning" title="N'achetez JAMAIS de liste">
          Les listes achetées convertissent à 0,1 % et peuvent vous faire blacklister par Gmail/Outlook. Une liste de 100 emails gagnés vaut mieux que 10 000 achetés.
        </GCallout>
      </>
    ),
  },
  {
    id: "email1",
    label: "Email 1 — Welcome (envoyé J+0)",
    content: (
      <>
        <GH3>Objectif</GH3>
        <GP>
          Confirmer la livraison de votre lead magnet + planter votre personnage. Premier email = 60-80 % de taux d'ouverture (le plus élevé de la séquence).
        </GP>
        <GH3>Template copiable</GH3>
        <GCallout variant="info" title="Email Welcome">
          <GP>
            <GStrong>Objet :</GStrong> [Prénom], voici ton [nom du lead magnet] (+ un cadeau bonus)
          </GP>
          <GP>
            Salut [Prénom] !
            <br /><br />
            Merci d'avoir téléchargé [nom du lead magnet]. Tu peux le récupérer ici : [lien].
            <br /><br />
            Petit cadeau bonus que je donne aux nouveaux inscrits : [donnez quelque chose en plus, ex: 1 vidéo bonus, 1 template Canva].
            <br /><br />
            Vite fait, voici qui je suis : [2-3 lignes max sur vous + votre crédibilité].
            <br /><br />
            Demain je t'envoie [teaser email 2]. Ça va te servir si tu cherches [bénéfice clair].
            <br /><br />
            À demain !
            <br />[Votre nom]
          </GP>
        </GCallout>
      </>
    ),
  },
  {
    id: "email2",
    label: "Email 2 — Valeur pure (envoyé J+1)",
    content: (
      <>
        <GH3>Objectif</GH3>
        <GP>
          Donner sans rien demander. Renforce la confiance + active le principe de réciprocité (Cialdini). Vous ne vendez RIEN dans cet email.
        </GP>
        <GH3>Template</GH3>
        <GCallout variant="info" title="Email Valeur">
          <GP>
            <GStrong>Objet :</GStrong> Le truc qui m'a changé la vie il y a [X temps]
          </GP>
          <GP>
            [Prénom],
            <br /><br />
            Je voulais te partager une astuce qui a complètement changé ma façon de [sujet].
            <br /><br />
            Le contexte : [court récit personnel, 3-4 lignes].
            <br /><br />
            Voici ce que j'ai appris : [astuce concrète + actionnable, 1 paragraphe].
            <br /><br />
            Étapes à appliquer aujourd'hui :
            <br />1. [Action 1]
            <br />2. [Action 2]
            <br />3. [Action 3]
            <br /><br />
            Teste-le et dis-moi en répondant à cet email !
            <br /><br />
            [Votre nom]
          </GP>
        </GCallout>
      </>
    ),
  },
  {
    id: "email3",
    label: "Email 3 — Autorité (envoyé J+3)",
    content: (
      <>
        <GH3>Objectif</GH3>
        <GP>
          Prouver que vous savez de quoi vous parlez avec un cas client. C'est le pré-vente : ils commencent à imaginer leur propre transformation.
        </GP>
        <GH3>Template</GH3>
        <GCallout variant="info" title="Email Cas Client">
          <GP>
            <GStrong>Objet :</GStrong> Comment [prénom client] a obtenu [résultat] en [délai]
          </GP>
          <GP>
            [Prénom],
            <br /><br />
            Tu te souviens de [nom client] ? Voici son histoire :
            <br /><br />
            <GStrong>Situation de départ :</GStrong> [contexte du client]
            <br /><GStrong>Méthode appliquée :</GStrong> [étapes courtes]
            <br /><GStrong>Résultat :</GStrong> [chiffres concrets, dates précises]
            <br /><br />
            "[Citation directe du client, 1-2 lignes]"
            <br /><br />
            La bonne nouvelle : [prénom client] n'a rien d'exceptionnel. Si tu veux la méthode exacte qu'on a appliquée ensemble, elle est dans [nom de ta formation] : [lien Novakou].
            <br /><br />
            [Votre nom]
          </GP>
        </GCallout>
      </>
    ),
  },
  {
    id: "email4",
    label: "Email 4 — Lever l'objection (envoyé J+5)",
    content: (
      <>
        <GH3>Objectif</GH3>
        <GP>
          Désamorcer le frein principal qui empêche d'acheter. Top 3 des objections :
        </GP>
        <GUl>
          <GLi><GStrong>"Trop cher"</GStrong> → comparez avec ce que ça coûte de NE PAS résoudre le problème.</GLi>
          <GLi><GStrong>"Pas le temps"</GStrong> → montrez que c'est 15 min/jour et l'accès à vie.</GLi>
          <GLi><GStrong>"Est-ce que ça marche pour moi ?"</GStrong> → montrez 3 profils différents qui ont réussi.</GLi>
        </GUl>
        <GH3>Template (objection prix)</GH3>
        <GCallout variant="info" title="Email Objection">
          <GP>
            <GStrong>Objet :</GStrong> "C'est trop cher" — vrai ou faux ?
          </GP>
          <GP>
            Souvent on me dit "Ta formation à [prix] FCFA, c'est trop cher pour moi."
            <br /><br />
            Je comprends. Mais regardons ensemble :
            <br /><br />
            ▸ [Bénéfice 1 chiffré : ex "Tu vas gagner 10h/semaine"]
            <br />▸ [Bénéfice 2 : ex "Tu vas potentiellement gagner +50k FCFA/mois"]
            <br />▸ [Bénéfice 3 : ex "Tu vas éviter de payer 200k pour un coach individuel"]
            <br /><br />
            Si je calcule, le ROI est entre [X] et [Y] fois ton investissement.
            <br /><br />
            Et si vraiment ça ne te convient pas dans les 14 premiers jours : <GStrong>remboursement intégral, sans questions</GStrong>.
            <br /><br />
            Le lien si tu te lances : [lien Novakou]
            <br /><br />
            [Votre nom]
          </GP>
        </GCallout>
      </>
    ),
  },
  {
    id: "email5",
    label: "Email 5 — Dernier appel (envoyé J+7)",
    content: (
      <>
        <GH3>Objectif</GH3>
        <GP>
          Créer l'urgence légitime. Soit promo qui se termine, soit fermeture de cohorte, soit hausse de prix imminente.
        </GP>
        <GH3>Template</GH3>
        <GCallout variant="info" title="Email Dernier Appel">
          <GP>
            <GStrong>Objet :</GStrong> Ferme ce soir [+ courte info]
          </GP>
          <GP>
            [Prénom],
            <br /><br />
            Je serai bref. La promo de lancement à -30 % sur [nom formation] se termine <GStrong>ce soir à 23h59</GStrong>.
            <br /><br />
            À partir de demain, retour au prix plein de [prix normal].
            <br /><br />
            Si tu hésitais, c'est le moment : [lien Novakou].
            <br /><br />
            Si ce n'est pas pour toi, ce n'est pas grave. Je continuerai à t'envoyer des conseils utiles dans les prochains emails.
            <br /><br />
            [Votre nom]
            <br /><br />
            P.S. : 27 personnes se sont inscrites cette semaine. Tu peux être la 28e ou ne rien changer. À toi de voir.
          </GP>
        </GCallout>
        <GCallout variant="success" title="Conversion mesurée">
          La séquence complète 5 emails convertit en moyenne <GStrong>8 à 15 %</GStrong> des inscrits selon Novakou Analytics. Sur 1000 inscrits = 80-150 ventes.
        </GCallout>
      </>
    ),
  },
  {
    id: "automatiser",
    label: "Automatiser tout ça sur Novakou",
    content: (
      <>
        <GP>
          Configurez la séquence UNE fois dans <GStrong>Marketing → Séquences emails</GStrong>. Chaque nouvel inscrit (via tunnel, lead magnet, newsletter) reçoit automatiquement les 5 emails aux bons intervalles.
        </GP>
        <GP>
          Avantages Novakou natif :
        </GP>
        <GUl>
          <GLi>Variables {`{{prenom}}`}, {`{{produit}}`}, {`{{prix}}`} insérables.</GLi>
          <GLi>Tracking ouvertures + clics intégré.</GLi>
          <GLi>A/B test sur les objets.</GLi>
          <GLi>Segmentation (envoyer uniquement aux non-acheteurs, etc.).</GLi>
          <GLi>Pas de surcoût (inclus dans les 10 % de commission Novakou).</GLi>
        </GUl>
        <GP>
          Voir aussi : <GA href="/guides/sequences-emails">Guide complet séquences emails Novakou</GA>.
        </GP>
      </>
    ),
  },
];

export default function EmailMarketingGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
