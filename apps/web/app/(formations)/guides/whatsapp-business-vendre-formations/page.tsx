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
  slug: "whatsapp-business-vendre-formations",
  title: "WhatsApp Business pour vendre vos formations en Afrique",
  subtitle:
    "Status, catalogue, listes diffusion, groupes communauté. Convertir vos contacts WhatsApp en acheteurs sans paraître spam.",
  category: "Promouvoir",
  level: "Débutant",
  levelColor: "#16a34a",
  gradient: "linear-gradient(135deg, #25d366, #22c55e)",
  icon: "chat",
  time: "12 min",
  chapters: "10 sections",
  publishedAt: "2026-05-18",
  updatedAt: "2026-05-24",
  keywords: [
    "WhatsApp Business vendre formation",
    "WhatsApp Status promotion",
    "communauté WhatsApp Afrique",
    "vendre digital WhatsApp",
    "marketing WhatsApp Sénégal",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "WhatsApp Business : vendre formation Afrique";
const SEO_DESCRIPTION =
  "Vendez vos formations avec WhatsApp Business en Afrique : Status, catalogue, listes diffusion, groupes. Convertir vos contacts sans paraître spam.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "WhatsApp Business pour vendre formation",
)}&subtitle=${encodeURIComponent(
  "Status, catalogue, listes diffusion, groupes : la méthode 2026",
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
    label: "Pourquoi WhatsApp est votre arme n°1 en Afrique",
    content: (
      <>
        <GP>
          En Afrique francophone, WhatsApp a un taux de pénétration de <GStrong>92 % chez les internautes</GStrong>. C'est plus que Facebook, Instagram et TikTok réunis sur certains pays. Et surtout : les gens y consultent leurs messages <GStrong>plusieurs fois par heure</GStrong>.
        </GP>
        <GP>
          Pour un créateur digital, WhatsApp permet 3 choses qu'aucun autre canal ne fait aussi bien :
        </GP>
        <GUl>
          <GLi>Toucher votre réseau direct (contacts existants) gratuitement.</GLi>
          <GLi>Convertir en chat 1-1 (les acheteurs hésitants posent leurs questions et achètent dans la foulée).</GLi>
          <GLi>Garder le contact post-achat (support client, upsell, communauté).</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "compte-pro",
    label: "WhatsApp Business : pourquoi l'utiliser",
    content: (
      <>
        <GP>
          WhatsApp Business (gratuit, app séparée) ajoute des fonctionnalités essentielles pour un créateur :
        </GP>
        <GUl>
          <GLi><GStrong>Profil pro</GStrong> avec nom de marque, description, horaires, lien.</GLi>
          <GLi><GStrong>Catalogue produits</GStrong> visible dans l'app — vos formations comme des items.</GLi>
          <GLi><GStrong>Étiquettes</GStrong> pour classer vos chats (prospect, client, à relancer, etc.).</GLi>
          <GLi><GStrong>Réponses rapides</GStrong> avec raccourcis (/prix, /lien, etc.).</GLi>
          <GLi><GStrong>Messages d'accueil et d'absence</GStrong> automatiques.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "status",
    label: "Status WhatsApp : 3 publications par jour",
    content: (
      <>
        <GP>
          Le Status WhatsApp est <GStrong>le format le plus sous-estimé</GStrong> par les vendeurs débutants. Vos contacts directs voient vos status (qui disparaissent après 24 h), exactement comme Instagram Stories.
        </GP>
        <GH3>Stratégie 3 status par jour</GH3>
        <GUl>
          <GLi><GStrong>Matin (8h-10h)</GStrong> : conseil rapide ou astuce liée à votre expertise.</GLi>
          <GLi><GStrong>Après-midi (13h-15h)</GStrong> : témoignage, résultat client, preuve sociale.</GLi>
          <GLi><GStrong>Soir (19h-21h)</GStrong> : appel à l'action (lien vers votre formation, promo, etc.).</GLi>
        </GUl>
        <GCallout variant="tip" title="Le secret du Status qui convertit">
          Format vidéo selfie 15 secondes, sous-titres en bas (50 % des gens regardent en silence), CTA clair à la fin. Pas besoin de montage compliqué — naturel = crédible.
        </GCallout>
      </>
    ),
  },
  {
    id: "catalogue",
    label: "Configurer votre catalogue WhatsApp",
    content: (
      <>
        <GP>
          Dans WhatsApp Business : <GStrong>Paramètres → Outils Business → Catalogue</GStrong>. Ajoutez chacune de vos formations comme un item avec :
        </GP>
        <GUl>
          <GLi>Image carrée 1080x1080 (idéalement votre thumbnail Novakou).</GLi>
          <GLi>Nom court (max 50 caractères).</GLi>
          <GLi>Prix (en FCFA).</GLi>
          <GLi>Description (3-4 lignes max).</GLi>
          <GLi>Lien direct vers votre page produit Novakou.</GLi>
        </GUl>
        <GP>
          Avantage : quand un prospect vous écrit, vous lui envoyez l'item du catalogue en 1 clic. Plus pro que coller un lien brut.
        </GP>
      </>
    ),
  },
  {
    id: "listes",
    label: "Listes de diffusion : éviter le ban",
    content: (
      <>
        <GP>
          Une liste de diffusion permet d'envoyer le même message à plusieurs contacts <GStrong>sans qu'ils sachent qui sont les autres</GStrong> (contrairement à un groupe). Idéal pour les annonces commerciales.
        </GP>
        <GH3>Règles pour ne PAS se faire ban</GH3>
        <GUl>
          <GLi>Maximum <GStrong>256 contacts par liste</GStrong> (limite WhatsApp).</GLi>
          <GLi>Ne jamais ajouter quelqu'un qui n'a pas votre numéro enregistré — ils ne recevront pas vos messages.</GLi>
          <GLi>Pas plus de <GStrong>2 messages commerciaux par semaine</GStrong> max. Au-delà, les gens vous bloquent et WhatsApp détecte du spam.</GLi>
          <GLi>Toujours apporter de la valeur avant de vendre — règle des 80/20 (80 % valeur, 20 % promo).</GLi>
        </GUl>
        <GCallout variant="warning" title="Risque de blocage">
          Si trop de gens vous bloquent ou signalent comme spam dans une courte période, votre numéro est <GStrong>temporairement bloqué par WhatsApp</GStrong> (24-72 h). Pour les gros volumes, passez à l'API WhatsApp Business officielle.
        </GCallout>
      </>
    ),
  },
  {
    id: "groupes",
    label: "Groupes : créer votre communauté",
    content: (
      <>
        <GP>
          Une fois 20-50 acheteurs, créez un <GStrong>groupe privé pour vos élèves</GStrong>. Ça transforme une vente unique en relation long terme : ils posent leurs questions, partagent leurs progrès, vous demandent vos nouvelles formations en avant-première.
        </GP>
        <GH3>Règles d'un groupe sain</GH3>
        <GUl>
          <GLi>Description claire des règles (épingler en haut).</GLi>
          <GLi>Désactiver "Tout le monde peut envoyer des messages" si trop de bruit — passer en mode admin seulement avec topics.</GLi>
          <GLi>Sessions Q&A live programmées (1 par mois minimum).</GLi>
          <GLi>Modération active : vous bannissez les spammeurs immédiatement.</GLi>
        </GUl>
      </>
    ),
  },
  {
    id: "vente-1-1",
    label: "Convertir un prospect en chat 1-1",
    content: (
      <>
        <GP>
          Le scénario gagnant : un prospect vous écrit en privé "C'est combien votre formation ?". Au lieu de répondre juste le prix, suivez cette séquence :
        </GP>
        <GUl>
          <GLi><GStrong>1. Question de qualification</GStrong> : "Tu cherches à atteindre quel résultat précisément ?"</GLi>
          <GLi><GStrong>2. Empathie + valeur</GStrong> : "Beaucoup ont le même problème. Ma formation est faite pour exactement ça, voici comment elle aide."</GLi>
          <GLi><GStrong>3. Prix + urgence</GStrong> : "25 000 FCFA, mais j'ai une promo -30 % cette semaine seulement."</GLi>
          <GLi><GStrong>4. Lien direct</GStrong> : envoyer le lien Novakou avec le code promo pré-rempli.</GLi>
          <GLi><GStrong>5. Relance si pas de réponse en 24 h</GStrong> : "Tu as eu le temps de regarder ? Je suis là si tu as une question."</GLi>
        </GUl>
        <GCallout variant="success" title="Conversion mesurée">
          Sur Novakou en 2026, les vendeurs qui font du chat 1-1 actif convertissent <GStrong>en moyenne 18 %</GStrong> de leurs prospects WhatsApp en acheteurs. Contre 2-3 % pour ceux qui balancent juste un lien.
        </GCallout>
      </>
    ),
  },
  {
    id: "post-vente",
    label: "Post-vente : transformer en ambassadeur",
    content: (
      <>
        <GP>
          24-48 h après l'achat, envoyez un message personnalisé : "Hey ! T'as commencé la formation ? Si tu as une question, demande-moi direct."
        </GP>
        <GP>
          7 jours après : "Comment ça avance ? Qu'est-ce qui a le plus marché pour toi ?" → si réponse positive, demandez un <GStrong>témoignage audio de 30 secondes</GStrong>. Vous l'utilisez ensuite sur votre page produit et sur vos Status.
        </GP>
      </>
    ),
  },
  {
    id: "automatiser",
    label: "Combiner WhatsApp + emails Novakou",
    content: (
      <>
        <GP>
          WhatsApp pour la chaleur du contact direct. Email automatique Novakou pour la séquence structurée à long terme. Les deux sont complémentaires, pas concurrents.
        </GP>
        <GP>
          Voir aussi : <GA href="/guides/sequences-emails">Séquences emails qui vendent en automatique</GA> + <GA href="/guides/email-marketing-5-emails-vendent">5 emails indispensables qui vendent</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "outils",
    label: "Outils gratuits pour booster WhatsApp",
    content: (
      <>
        <GUl>
          <GLi><GStrong>InShot ou CapCut</GStrong> : éditer vos vidéos Status avec sous-titres.</GLi>
          <GLi><GStrong>Canva</GStrong> : créer des visuels Status (templates "Promo", "Nouveau produit").</GLi>
          <GLi><GStrong>Bitly</GStrong> : raccourcir vos liens Novakou pour les afficher proprement.</GLi>
          <GLi><GStrong>Calendly</GStrong> : pour les coachings, partager votre dispo en 1 lien.</GLi>
        </GUl>
      </>
    ),
  },
];

export default function WhatsAppGuidePage() {
  return <GuideArticleLayout meta={meta} sections={sections} />;
}
