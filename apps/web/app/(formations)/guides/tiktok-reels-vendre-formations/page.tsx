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
  slug: "tiktok-reels-vendre-formations",
  title: "TikTok & Reels : générer 10 000 vues par vidéo en Afrique (méthode 2026)",
  subtitle:
    "Hooks qui marchent, format vertical, hashtags Afrique francophone, transformer une vue en clic. Stratégie virale 0 budget pour vendre vos formations.",
  category: "Promouvoir",
  level: "Intermédiaire",
  levelColor: "#ec4899",
  gradient: "linear-gradient(135deg, #000000, #ec4899)",
  icon: "video_library",
  time: "12 min",
  chapters: "9 sections",
  publishedAt: "2026-05-15",
  updatedAt: "2026-05-24",
  keywords: [
    "TikTok vendre formation",
    "Reels Instagram Afrique",
    "viral TikTok francophone",
    "vidéo verticale marketing",
    "TikTok créateur digital Sénégal",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "TikTok & Reels : vendre formation 2026";
const SEO_DESCRIPTION =
  "Stratégie virale TikTok & Reels pour vendre vos formations en Afrique : hooks qui marchent, format vertical, hashtags francophones. 10 000 vues en 2026.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "TikTok & Reels pour vendre formation",
)}&subtitle=${encodeURIComponent(
  "Hooks, format vertical, hashtags Afrique : viral 0 budget en 2026",
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
    id: "pourquoi",
    label: "Pourquoi TikTok cartonne en Afrique en 2026",
    content: (
      <>
        <GP>
          TikTok a explosé en Afrique francophone en 2024-2026. Plus de <GStrong>45 millions d'utilisateurs actifs</GStrong> en zone UEMOA + CEMAC. Et surtout : <GStrong>l'algorithme TikTok est encore très généreux</GStrong> avec les petits comptes, contrairement à Instagram saturé.
        </GP>
        <GP>
          Un compte zéro followers peut faire 50 000 vues sur une vidéo en 48h si le contenu accroche. Sur Instagram, vous auriez besoin de 10k followers pour le même résultat.
        </GP>
        <GCallout variant="success" title="L'avantage compétitif">
          Très peu de créateurs digitaux francophones africains exploitent TikTok sérieusement aujourd'hui. C'est LA fenêtre d'opportunité 2026.
        </GCallout>
      </>
    ),
  },
  {
    id: "hook",
    label: "Les 3 premières secondes : le hook qui retient",
    content: (
      <>
        <GP>
          Sur TikTok, vous avez <GStrong>3 secondes</GStrong> pour empêcher quelqu'un de scroller. Si votre intro est faible, l'algorithme arrête de pousser votre vidéo après 50-100 vues.
        </GP>
        <GH3>10 hooks qui marchent à coup sûr</GH3>
        <GUl>
          <GLi>"Si tu fais [erreur X] arrête tout de suite."</GLi>
          <GLi>"Voici comment j'ai fait [résultat Y] en [temps court]."</GLi>
          <GLi>"3 trucs que personne ne te dit sur [sujet]."</GLi>
          <GLi>"Si tu vends en ligne en Afrique, regarde ça."</GLi>
          <GLi>"J'ai testé [méthode populaire] pendant 30 jours, résultats..."</GLi>
          <GLi>"Pourquoi 90 % des créateurs se plantent (et comment éviter)."</GLi>
          <GLi>"Avant de payer X FCFA pour [solution courante], regarde."</GLi>
          <GLi>"Mon premier mois sur Novakou : voici les chiffres."</GLi>
          <GLi>"Cette technique m'a fait gagner X FCFA en 1 semaine."</GLi>
          <GLi>"Les 5 produits digitaux qui se vendent le plus en Afrique."</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "format",
    label: "Format vertical : la check-list visuelle",
    content: (
      <>
        <GH3>Spécifications techniques</GH3>
        <GUl>
          <GLi><GStrong>Format</GStrong> : 9:16 vertical (1080×1920 ou 720×1280).</GLi>
          <GLi><GStrong>Durée idéale</GStrong> : 15-30 secondes pour viralité, jusqu'à 60 sec pour contenu pédagogique profond.</GLi>
          <GLi><GStrong>Audio</GStrong> : utilisez un son tendance (TikTok pousse + l'algorithme).</GLi>
          <GLi><GStrong>Sous-titres</GStrong> : <GStrong>obligatoires</GStrong>. 70 % des gens regardent en silence.</GLi>
          <GLi><GStrong>Cadrage</GStrong> : votre visage doit prendre 60-70 % de l'écran si vous parlez face caméra.</GLi>
        </GUl>
        <GH3>Outils de production gratuits</GH3>
        <GUl>
          <GLi><GStrong>CapCut</GStrong> (mobile + desktop) : montage + sous-titres auto + effets.</GLi>
          <GLi><GStrong>InShot</GStrong> : alternative légère.</GLi>
          <GLi><GStrong>Canva</GStrong> : templates de captions/thumbnails.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "themes",
    label: "10 idées de vidéos qui convertissent",
    content: (
      <>
        <GUl>
          <GLi><GStrong>Tutoriel express</GStrong> "Comment faire X en 30 secondes".</GLi>
          <GLi><GStrong>Erreur fréquente</GStrong> "L'erreur que TOUT le monde fait sur [sujet]".</GLi>
          <GLi><GStrong>Comparaison avant/après</GStrong> "J'ai changé X dans ma boutique, résultat..."</GLi>
          <GLi><GStrong>Témoignage client</GStrong> "Aïcha a fait 669k FCFA en 30 jours, voici comment".</GLi>
          <GLi><GStrong>Storytime</GStrong> "Comment j'ai trouvé l'idée de ma formation à 2h du matin".</GLi>
          <GLi><GStrong>Behind the scenes</GStrong> "Mon setup pour enregistrer des formations Excel".</GLi>
          <GLi><GStrong>Listicle</GStrong> "Top 5 niches porteuses en Afrique en 2026".</GLi>
          <GLi><GStrong>Mythe vs réalité</GStrong> "Non, tu n'as PAS besoin d'être influenceur pour vendre".</GLi>
          <GLi><GStrong>Réaction</GStrong> "Je teste cette stratégie de pub, voici ce qui se passe...".</GLi>
          <GLi><GStrong>Tendances détournées</GStrong> sur le son ou format viral du moment, appliqué à votre sujet.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "hashtags",
    label: "Hashtags Afrique francophone qui poussent",
    content: (
      <>
        <GP>
          Mélangez gros et niche. 4-6 hashtags max par vidéo (plus est inefficace sur TikTok contrairement à Instagram).
        </GP>
        <GUl>
          <GLi><GStrong>Gros</GStrong> : #afriquefrancophone #pourtoi #entrepreneurafricain</GLi>
          <GLi><GStrong>Moyens</GStrong> : #vendreenligne #createurdigital #formationenligne</GLi>
          <GLi><GStrong>Niche</GStrong> : selon votre sujet (#excelpro #marketingdigitalafrique #conseilbusiness)</GLi>
          <GLi><GStrong>Local</GStrong> : #senegal #cotedivoire #cameroun #benin</GLi>
        </GUl>
        <GCallout variant="tip" title="Le secret">
          Mentionnez explicitement votre pays cible dans la légende — l'algorithme TikTok personnalise géographiquement.
        </GCallout>
      </>
    ),
  },
  {
    id: "vue-vers-vente",
    label: "Transformer une vue en clic vers Novakou",
    content: (
      <>
        <GP>
          Avoir 10 000 vues qui ne convertissent pas en vente = perte de temps. Voici comment connecter TikTok à votre boutique Novakou :
        </GP>
        <GH3>1. Lien de bio optimisé</GH3>
        <GP>
          TikTok n'autorise qu'<GStrong>un seul lien</GStrong> (à 1000 followers). Pointez-le directement sur votre boutique Novakou ou utilisez un Linktree avec votre offre phare en tête.
        </GP>
        <GH3>2. CTA verbal explicite</GH3>
        <GP>
          Toujours finir vos vidéos avec : "Lien en bio pour la méthode complète" ou "Je t'explique tout dans ma formation, lien en bio."
        </GP>
        <GH3>3. Pinned video stratégique</GH3>
        <GP>
          Épinglez 3 vidéos en haut de votre profil : votre meilleur hook, votre cas pratique, et une présentation de votre offre. Premières choses vues par un visiteur.
        </GP>
        <GH3>4. Commentaire épinglé</GH3>
        <GP>
          Sur vos vidéos qui marchent, épinglez votre propre commentaire avec le lien (TikTok permet le lien dans les commentaires épinglés depuis 2025).
        </GP>
      </>
    ),
  },
  {
    id: "frequence",
    label: "Fréquence : pourquoi 1 vidéo/jour est nécessaire",
    content: (
      <>
        <GP>
          L'algorithme TikTok récompense la <GStrong>régularité</GStrong>. Si vous publiez 3 vidéos puis disparaissez 2 semaines, votre prochaine vidéo démarre à zéro.
        </GP>
        <GH3>Cadence minimum 90 premiers jours</GH3>
        <GUl>
          <GLi>1 vidéo par jour, 7 jours sur 7.</GLi>
          <GLi>Heures de publication idéales en Afrique : <GStrong>12h, 18h, 20h</GStrong> heure locale (pic d'audience).</GLi>
          <GLi>Variez les formats (tutoriel, storytime, témoignage, etc.).</GLi>
        </GUl>
        <GCallout variant="info" title="Astuce batch">
          Tournez <GStrong>7 vidéos en 1 après-midi</GStrong> (1 par jour de la semaine). Programmez-les avec Metricool, Buffer ou directement TikTok Pro. Vous tenez la cadence sans pression quotidienne.
        </GCallout>
      </>
    ),
  },
  {
    id: "ce-qui-marche",
    label: "Pourquoi votre vidéo a fait flop (et comment corriger)",
    content: (
      <>
        <GH3>Analyse simple</GH3>
        <GUl>
          <GLi><GStrong>&lt; 200 vues</GStrong> : hook trop faible. La majorité des gens scrollent dans les 3 premières secondes.</GLi>
          <GLi><GStrong>200-1000 vues</GStrong> : hook OK mais contenu pas assez intéressant. Les gens regardent puis quittent.</GLi>
          <GLi><GStrong>1000-5000 vues</GStrong> : début de viralité, l'algo pousse à des audiences proches.</GLi>
          <GLi><GStrong>5000-50000 vues</GStrong> : viralité confirmée, l'algo pousse à des inconnus.</GLi>
          <GLi><GStrong>50k+ vues</GStrong> : viralité réelle. Mais attention : sans CTA clair = aucune vente.</GLi>
        </GUl>
        <GH3>3 fixes prioritaires</GH3>
        <GUl>
          <GLi>Améliorer le hook (testez 5 variantes du même sujet sur 5 jours).</GLi>
          <GLi>Raccourcir : 30 sec convertit mieux que 60 sec dans 80 % des cas.</GLi>
          <GLi>Toujours sous-titrer (effet immédiat sur le watch time).</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "combiner",
    label: "Combiner TikTok avec vos autres canaux",
    content: (
      <>
        <GP>
          Une vidéo créée pour TikTok peut être réutilisée sur :
        </GP>
        <GUl>
          <GLi><GStrong>Instagram Reels</GStrong> (même format vertical, hashtags adaptés). Voir <GA href="/guides/instagram-vendre-formations-afrique">guide Instagram</GA>.</GLi>
          <GLi><GStrong>YouTube Shorts</GStrong> (algorithme YouTube pousse de plus en plus le Shorts).</GLi>
          <GLi><GStrong>WhatsApp Status</GStrong> (réutilisez la même vidéo pour votre cercle direct). Voir <GA href="/guides/whatsapp-business-vendre-formations">guide WhatsApp</GA>.</GLi>
          <GLi><GStrong>Pinterest Ideas Pins</GStrong> (la diaspora africaine y est active).</GLi>
        </GUl>
        <GP>
          1 tournage = 4 canaux exploités. Ratio effort/impact imbattable.
        </GP>
      </>
    ),
  },
];

export default function TikTokGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
