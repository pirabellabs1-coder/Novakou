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
  slug: "vendre-coaching-en-ligne",
  title: "Vendre du coaching en ligne en Afrique : offres, prix et process",
  subtitle:
    "Le coaching est l'offre numérique la plus rentable : prix élevé, forte valeur, peu de clients suffisent. Voici comment définir votre offre, fixer un prix premium et dérouler tout le process avec Novakou, du premier message WhatsApp au paiement Mobile Money.",
  category: "Vendre",
  level: "Intermédiaire",
  levelColor: "#0891b2",
  gradient: "linear-gradient(135deg, #083344, #0891b2 60%, #22c55e)",
  icon: "psychology",
  time: "16 min",
  chapters: "10 sections",
  publishedAt: "2026-07-13",
  updatedAt: "2026-07-13",
  keywords: [
    "vendre du coaching en ligne",
    "coaching en ligne Afrique",
    "offre de coaching prix FCFA",
    "accompagnement en ligne Afrique",
    "devenir coach et vendre ses séances",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Vendre du coaching en ligne en Afrique : offres, prix et process";
const SEO_DESCRIPTION =
  "Guide complet pour vendre du coaching en ligne en Afrique francophone : définir votre offre, fixer un prix premium en FCFA, dérouler le process de A à Z et encaisser en Mobile Money avec Novakou.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Vendre du coaching en ligne en Afrique",
)}&subtitle=${encodeURIComponent(
  "Offres, prix premium et process, du WhatsApp au paiement Mobile Money",
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
  src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Coach africain accompagnant un client en visioconférence depuis son bureau",
  caption: "Le coaching : peu de clients, une forte valeur, un revenu premium encaissé en Mobile Money.",
};

const stats = [
  { value: "25 000 – 150 000", label: "FCFA : la fourchette réaliste d'une offre de coaching" },
  { value: "5 clients", label: "suffisent parfois à dépasser un salaire mensuel" },
  { value: "Mobile Money", label: "Wave, Orange, MTN, Moov + carte pour la diaspora" },
  { value: "Escrow", label: "paiement sécurisé qui rassure le client hésitant" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-rentable",
    label: "Pourquoi le coaching est l'offre la plus rentable",
    content: (
      <>
        <GP>
          Quand on vend des produits numériques en Afrique, on pense d'abord à l'ebook à 2 500 FCFA ou à la formation vidéo à 15 000 FCFA. Ce sont d'excellents produits d'appel, mais ils partagent une limite : pour bien gagner sa vie, il faut en vendre <GStrong>énormément</GStrong>. Le coaching renverse complètement cette logique. Une seule offre d'accompagnement à 80 000 FCFA rapporte autant que trente-deux ebooks — sans trente-deux fois le travail de vente.
        </GP>
        <GP>
          Le coaching est l'offre la plus rentable pour trois raisons simples. Le <GStrong>prix est élevé</GStrong> parce que vous vendez une transformation personnalisée, pas un fichier. La <GStrong>valeur perçue est forte</GStrong> parce que le client vous a en face de lui, il n'est plus seul devant une vidéo. Et surtout, <GStrong>peu de clients suffisent</GStrong> : avec cinq à dix accompagnements par mois, beaucoup de coachs africains dépassent déjà le salaire d'un cadre, sans jamais toucher à un stock ni à une logistique.
        </GP>
        <GStats
          items={[
            { value: "80 000 FCFA", label: "= l'équivalent de 32 ebooks à 2 500 FCFA, en une seule vente" },
            { value: "1 à 1", label: "relation directe : la valeur perçue explose face au client" },
            { value: "0 stock", label: "vous vendez votre temps et votre expertise, rien à produire" },
          ]}
        />
        <GP>
          Ajoutez à cela le contexte africain : la demande d'accompagnement — business, développement personnel, fitness, finances, carrière, spiritualité, parentalité — explose avec la génération connectée de Dakar, Abidjan, Douala ou Cotonou. Les gens ne veulent plus seulement <GStrong>savoir</GStrong>, ils veulent être <GStrong>guidés</GStrong>. Et ils sont prêts à payer pour ça, à condition qu'on leur rende le paiement facile et sécurisé. C'est exactement là que Novakou change la donne.
        </GP>
      </>
    ),
  },
  {
    id: "definir-offre",
    label: "Définir votre offre : résultat, format, durée, canaux",
    content: (
      <>
        <GP>
          Avant de parler prix, il faut définir précisément ce que vous vendez. Une offre de coaching floue ne se vend jamais. Quatre éléments doivent être limpides dans votre tête — et sur votre page — avant même le premier client.
        </GP>
        <GH3>1. Le résultat promis</GH3>
        <GP>
          C'est le cœur de tout. Vous ne vendez pas « des séances de coaching », vous vendez un <GStrong>résultat</GStrong>. « Lancer votre première boutique en ligne rentable en 6 semaines. » « Perdre 8 kg sans salle de sport. » « Décrocher trois clients freelance à l'international. » Plus le résultat est concret et daté, plus il se vend cher. Un résultat vague comme « améliorer votre mindset » vaut peu ; un résultat précis comme « écrire et publier votre livre en 90 jours » vaut une fortune.
        </GP>
        <GH3>2. Le format : individuel, groupe ou hybride</GH3>
        <GP>
          Le coaching <GStrong>individuel</GStrong> est le plus premium et le plus cher : toute votre attention pour une personne. Le coaching de <GStrong>groupe</GStrong> démultiplie votre revenu horaire (dix personnes payent, vous animez une seule session) et crée une émulation. L'<GStrong>hybride</GStrong> combine le meilleur des deux : sessions de groupe hebdomadaires plus un ou deux appels individuels. Chaque format a son prix et son public.
        </GP>
        <GH3>3. La durée et le nombre de séances</GH3>
        <GP>
          Un accompagnement a un début et une fin. « 6 séances sur 6 semaines », « 3 mois d'accompagnement, 12 appels ». Cette borne rassure le client (il sait où il met les pieds) et vous protège (vous n'êtes pas coach à vie gratuitement). C'est aussi ce qui transforme un service flou en produit vendable sur Novakou.
        </GP>
        <GH3>4. Les canaux</GH3>
        <GP>
          En Afrique francophone, le trio gagnant est clair : <GStrong>WhatsApp</GStrong> pour le contact quotidien et le suivi, <GStrong>Google Meet ou Zoom</GStrong> pour les séances en visio, et un groupe WhatsApp ou un espace membre pour la communauté. Précisez ces canaux dès le départ pour éviter les malentendus.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Coach et cliente en séance de travail devant un ordinateur portable"
          caption="Individuel, groupe ou hybride : chaque format de coaching a son prix et son public."
        />
      </>
    ),
  },
  {
    id: "packager",
    label: "Packager votre offre en un programme clair",
    content: (
      <>
        <GP>
          Une fois les quatre piliers posés, il faut les emballer en une offre qui se comprend en dix secondes. Le client doit lire le nom de votre programme et savoir immédiatement ce qu'il obtient. C'est la différence entre « je propose du coaching business » (invendable) et « Programme Lancement : de l'idée à ta première vente en 6 semaines » (vendable).
        </GP>
        <GP>
          Un bon package de coaching contient toujours un <GStrong>nom accrocheur</GStrong>, une <GStrong>promesse datée</GStrong>, une <GStrong>liste de ce qui est inclus</GStrong> (nombre de séances, support WhatsApp, ressources, modèles, bonus) et une <GStrong>garantie</GStrong> ou un cadre clair. Détaillez chaque semaine ou chaque étape : les clients adorent voir le chemin avant de payer. Sur Novakou, vous créez ce produit exactement comme n'importe quel autre — voir notre guide <GA href="/guides/creer-son-produit">créer son premier produit</GA> pour le pas-à-pas.
        </GP>
        <GCards
          items={[
            { icon: "person", title: "Coaching individuel", text: "1 à 1 sur 4 à 12 semaines. Le plus premium : 60 000 à 150 000 FCFA. Attention pleine, résultats rapides." },
            { icon: "groups", title: "Coaching de groupe", text: "6 à 15 personnes, sessions hebdomadaires. 25 000 à 60 000 FCFA par participant. Revenu horaire démultiplié." },
            { icon: "hub", title: "Programme hybride", text: "Groupe + 1-2 appels privés. 45 000 à 100 000 FCFA. Le meilleur rapport valeur perçue / temps investi." },
            { icon: "bolt", title: "Intensif / VIP day", text: "Une journée ou demi-journée d'accompagnement intense. 80 000 à 150 000 FCFA. Résultat concentré, prix élevé." },
          ]}
        />
        <GCallout variant="tip" title="Nommez la transformation, pas la méthode">
          « Programme Silhouette 90 jours » se vend mieux que « suivi fitness ». « Académie Freelance Pro » se vend mieux que « conseils pour trouver des clients ». Le nom doit projeter le client dans son résultat, pas décrire votre travail.
        </GCallout>
      </>
    ),
  },
  {
    id: "prix-premium",
    label: "Fixer un prix premium et le justifier",
    content: (
      <>
        <GP>
          C'est ici que la plupart des coachs africains se sabotent : ils bradent. Par peur du « c'est trop cher », ils vendent un accompagnement de trois mois à 20 000 FCFA — et attirent les clients les plus exigeants et les moins engagés. La règle d'or du coaching est contre-intuitive : <GStrong>un prix bas dévalorise votre offre</GStrong>. Un client qui paie 90 000 FCFA s'implique, fait ses exercices, obtient des résultats… et vous recommande.
        </GP>
        <GP>
          La clé pour justifier un prix premium tient en une phrase : <GStrong>vendez le résultat, pas le temps</GStrong>. Personne ne veut « six appels d'une heure ». Tout le monde veut « lancer un business qui rapporte 200 000 FCFA par mois ». Si votre accompagnement aide un freelance à décrocher son premier contrat international à 500 €, alors 100 000 FCFA est une évidence, pas une dépense. Comparez toujours votre prix à la valeur de la transformation, jamais à votre coût horaire.
        </GP>
        <GP>
          Pour ancrer votre tarif, appuyez-vous sur des repères solides. Notre guide dédié <GA href="/guides/fixer-prix-formation">fixer le prix d'une formation</GA> détaille les méthodes de pricing (valeur perçue, ancrage, offres en paliers) qui s'appliquent parfaitement au coaching. L'idée n'est pas de choisir un chiffre au hasard, mais de le construire sur ce que votre client gagne réellement.
        </GP>
        <GCallout variant="warning" title="L'erreur qui tue les coachs : sous-tarifer">
          Un prix trop bas envoie un signal : « mon accompagnement ne vaut pas grand-chose ». Vous travaillez plus pour gagner moins, avec des clients moins motivés. Doublez votre premier prix instinctif, puis justifiez-le par le résultat. Vous vendrez moins souvent, mais bien mieux.
        </GCallout>
      </>
    ),
  },
  {
    id: "process",
    label: "Le process de A à Z, du premier message à la dernière séance",
    content: (
      <>
        <GP>
          Une offre claire ne suffit pas : il faut un process fluide qui transforme un curieux en client accompagné. Voici le parcours complet, tel qu'il se déroule concrètement pour un coach au Sénégal, en Côte d'Ivoire ou au Cameroun avec Novakou.
        </GP>
        <GCards
          items={[
            { icon: "chat", title: "1. Prise de contact", text: "Le prospect vous découvre (Instagram, TikTok, WhatsApp) et échange avec vous. Vous qualifiez son besoin en quelques questions." },
            { icon: "description", title: "2. Présentation de l'offre", text: "Vous envoyez le lien de votre page de vente Novakou : promesse, contenu, prix, témoignages. Tout est clair et professionnel." },
            { icon: "payments", title: "3. Paiement sécurisé", text: "Le client paie en Mobile Money (Wave, Orange, MTN, Moov) ou par carte. L'escrow sécurise les fonds : il ose franchir le pas." },
            { icon: "event_available", title: "4. Onboarding & planning", text: "Confirmation automatique, questionnaire de démarrage, calendrier des séances. Le client sait exactement quoi faire ensuite." },
            { icon: "videocam", title: "5. Les séances", text: "Vous coachez en visio (Google Meet, Zoom) et suivez au quotidien sur WhatsApp. Vous livrez ressources et exercices." },
            { icon: "workspace_premium", title: "6. Bilan & suivi", text: "Séance de clôture, célébration des résultats, demande de témoignage et proposition de la suite (renouvellement, membership)." },
          ]}
        />
        <GP>
          Le point critique de ce parcours, c'est l'étape 3. En Afrique, une vente se perd presque toujours au moment du paiement : le client est convaincu, mais le virement est compliqué, il n'a pas de carte, il hésite à envoyer de l'argent à un inconnu. Novakou élimine ces trois frictions d'un coup : le <GStrong>Mobile Money natif</GStrong> permet de payer en quelques secondes avec le moyen que le client utilise déjà, et le <GStrong>paiement séquestré (escrow)</GStrong> le rassure — ses fonds sont protégés jusqu'à ce que la prestation soit confirmée.
        </GP>
        <GCallout variant="info" title="Un lien de paiement pour tout déclencher">
          Depuis Novakou, vous générez un lien de paiement pour votre offre de coaching et vous le collez directement dans la conversation WhatsApp. Le client clique, paie, et vous recevez la notification. Pas de site à construire, pas de logiciel externe : le paiement se conclut là où se passe déjà la discussion.
        </GCallout>
      </>
    ),
  },
  {
    id: "page-de-vente",
    label: "Votre page de vente : convaincre sans être là",
    content: (
      <>
        <GP>
          Vous ne pouvez pas discuter en direct avec chaque prospect. Votre <GStrong>page de vente</GStrong> doit vendre à votre place, 24 h/24. C'est elle qui transforme un simple lien partagé sur WhatsApp ou Instagram en client qui paie, même pendant que vous dormez ou que vous animez une autre séance.
        </GP>
        <GP>
          Une bonne page de vente de coaching suit une structure éprouvée : une <GStrong>promesse forte</GStrong> en haut (le résultat daté), le <GStrong>problème</GStrong> que vit votre prospect (pour qu'il se reconnaisse), votre <GStrong>solution</GStrong> (le programme, semaine par semaine), la <GStrong>preuve</GStrong> (témoignages, avant/après, vos résultats), le <GStrong>prix</GStrong> justifié par la valeur, une <GStrong>garantie</GStrong> qui lève le risque, et un <GStrong>bouton d'achat</GStrong> impossible à manquer. Chaque section répond à une objection silencieuse du client.
        </GP>
        <GP>
          Sur Novakou, vous n'avez pas besoin de savoir coder ni de payer un web designer. Notre guide <GA href="/guides/page-de-vente-qui-convertit">créer une page de vente qui convertit</GA> vous donne la trame complète, section par section, avec les mots qui déclenchent l'achat en contexte africain. Vous construisez votre page une fois, et elle travaille pour vous à chaque partage.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Coach travaillant sur la page de vente de son offre d'accompagnement en ligne"
          caption="Une page de vente bien structurée vend votre coaching même quand vous n'êtes pas disponible."
        />
      </>
    ),
  },
  {
    id: "automatiser",
    label: "Automatiser la prise de rendez-vous et les rappels",
    content: (
      <>
        <GP>
          Le coaching a un ennemi silencieux : le no-show. Un client qui oublie sa séance, un rendez-vous jamais fixé, un paiement de renouvellement en retard. Chaque oubli est du revenu et de la crédibilité perdus. La solution n'est pas de courir après chaque client — c'est d'<GStrong>automatiser</GStrong>.
        </GP>
        <GP>
          Avec les automatisations de Novakou, vous mettez en place une fois des enchaînements qui tournent tout seuls. Dès qu'un client paie son coaching, il reçoit automatiquement un e-mail de bienvenue, le questionnaire de démarrage et le lien pour réserver sa première séance. Deux jours avant chaque appel, un rappel part automatiquement. Trois jours avant la fin de l'accompagnement, une proposition de renouvellement s'envoie sans que vous y pensiez.
        </GP>
        <GUl>
          <GLi><GStrong>Après paiement</GStrong> → e-mail de bienvenue + questionnaire + lien de réservation, en une fraction de seconde.</GLi>
          <GLi><GStrong>Rappel de séance</GStrong> → message automatique 24 h et 1 h avant chaque rendez-vous Google Meet ou Zoom.</GLi>
          <GLi><GStrong>Suivi entre les séances</GStrong> → une relance programmée pour vérifier que le client fait ses exercices.</GLi>
          <GLi><GStrong>Fin d'accompagnement</GStrong> → demande de témoignage + offre de renouvellement ou de passage au membership.</GLi>
        </GUl>
        <GCallout variant="success" title="Votre temps reste sur le coaching, pas sur l'administratif">
          Automatiser les rappels et l'onboarding, c'est récupérer plusieurs heures par semaine et diviser vos no-shows. Vous concentrez votre énergie sur ce qui a de la valeur — accompagner — pendant que la plateforme gère la logistique.
        </GCallout>
      </>
    ),
  },
  {
    id: "escalier",
    label: "Monter une offre en escalier : de l'audit gratuit au membership",
    content: (
      <>
        <GP>
          Les meilleurs coachs ne vendent jamais une seule offre. Ils construisent un <GStrong>escalier de valeur</GStrong> : plusieurs marches, du gratuit au premium, chacune menant naturellement à la suivante. C'est ce qui transforme un coach qui galère à trouver des clients en un business qui monte en puissance.
        </GP>
        <GH3>Marche 1 — L'audit ou l'appel découverte gratuit</GH3>
        <GP>
          Un diagnostic de 20 à 30 minutes offert. Le prospect vous découvre, vous cernez son problème, et vous lui montrez le chemin. Cet appel n'est pas de la charité : c'est votre meilleur outil de vente. Il crée la confiance et débouche naturellement sur votre offre payante.
        </GP>
        <GH3>Marche 2 — Le coaching, votre offre cœur</GH3>
        <GP>
          Votre programme d'accompagnement premium à 60 000 – 150 000 FCFA. C'est là que se fait l'essentiel de votre chiffre d'affaires et que le client obtient sa transformation. C'est le centre de votre escalier.
        </GP>
        <GH3>Marche 3 — Le membership, pour un revenu récurrent</GH3>
        <GP>
          Une fois l'accompagnement terminé, le client ne doit pas disparaître. Proposez-lui un <GStrong>abonnement mensuel</GStrong> à une communauté, des sessions de groupe, du contenu renouvelé ou un accompagnement continu à prix réduit. C'est le graal : un revenu qui rentre <GStrong>chaque mois</GStrong> sans repartir de zéro. Notre guide <GA href="/guides/abonnement-membership-revenus-recurrents">abonnement et membership : les revenus récurrents</GA> montre exactement comment le construire sur Novakou.
        </GP>
        <GCallout variant="tip" title="Chaque marche finance la suivante">
          L'audit gratuit remplit votre coaching. Le coaching finance et alimente votre membership. Le membership vous donne une base de revenus stable qui vous libère pour créer d'autres offres. C'est un système, pas une vente isolée.
        </GCallout>
      </>
    ),
  },
  {
    id: "temoignages",
    label: "Obtenir des témoignages qui font vendre",
    content: (
      <>
        <GP>
          En Afrique francophone, où la méfiance en ligne est réelle, <GStrong>la preuve sociale vend plus que n'importe quel argument</GStrong>. Un prospect qui hésite à payer 90 000 FCFA à un inconnu sera rassuré par le témoignage d'une personne comme lui, qui a obtenu le résultat promis. Les témoignages ne sont pas un « bonus » : ils sont le moteur de vos ventes futures.
        </GP>
        <GP>
          Le meilleur moment pour demander un témoignage, c'est <GStrong>juste après un résultat obtenu</GStrong>, quand l'émotion est encore vive — d'où l'intérêt de l'automatiser en fin d'accompagnement. Ne demandez pas « qu'as-tu pensé du coaching ? » (réponse molle garantie). Demandez plutôt : « Où en étais-tu avant de commencer, et qu'est-ce qui a changé concrètement depuis ? » Vous obtiendrez un récit avant/après, précis et crédible.
        </GP>
        <GUl>
          <GLi><GStrong>Le format vidéo WhatsApp</GStrong> — une capture de 30 secondes du client qui raconte, authentique et imbattable.</GLi>
          <GLi><GStrong>La capture d'écran de conversation</GStrong> — un message spontané de remerciement vaut de l'or, floutez juste le nom si besoin.</GLi>
          <GLi><GStrong>Le résultat chiffré</GStrong> — « +3 clients en 6 semaines », « 8 kg perdus », « première vente à 45 000 FCFA ».</GLi>
          <GLi><GStrong>L'avant/après visuel</GStrong> — parfait pour le fitness, le design, la transformation de business.</GLi>
        </GUl>
        <GP>
          Placez ensuite ces témoignages partout : sur votre <GA href="/guides/page-de-vente-qui-convertit">page de vente</GA>, dans vos stories, dans vos messages WhatsApp de closing. Chaque nouveau client accompli devient un argument de vente pour le suivant — c'est un effet boule de neige.
        </GP>
      </>
    ),
  },
  {
    id: "exemple-chiffre",
    label: "Un exemple chiffré déroulé de A à Z",
    content: (
      <>
        <GP>
          Prenons Aïcha, coach business à Abidjan. Elle aide les jeunes entrepreneures à lancer leur activité en ligne. Voici comment elle structure et déroule son offre sur Novakou — chiffres à l'appui.
        </GP>
        <GP>
          <GStrong>Son offre cœur :</GStrong> « Académie Lancement », un programme hybride de 6 semaines à <GStrong>75 000 FCFA</GStrong>. Il inclut 6 sessions de groupe en visio (Google Meet), un groupe WhatsApp de soutien, deux appels individuels et un pack de modèles prêts à l'emploi. La promesse : « De ton idée à ta première vente en 6 semaines. »
        </GP>
        <GStats
          items={[
            { value: "8 clientes", label: "par session de groupe × 75 000 FCFA" },
            { value: "600 000 FCFA", label: "de chiffre d'affaires par cohorte de 6 semaines" },
            { value: "+150 000 FCFA", label: "de membership récurrent au mois suivant" },
          ]}
        />
        <GP>
          <GStrong>Le déroulé.</GStrong> Aïcha publie sur Instagram et propose un appel découverte gratuit de 20 minutes. Sur 20 appels, 8 femmes rejoignent l'Académie. Chacune paie ses 75 000 FCFA en Mobile Money via le lien Novakou collé dans WhatsApp — l'escrow les rassure, elles paient en 30 secondes. Résultat : <GStrong>600 000 FCFA encaissés</GStrong> pour une cohorte, avant même la première séance.
        </GP>
        <GP>
          <GStrong>L'escalier se met en route.</GStrong> À la fin des 6 semaines, l'automatisation demande un témoignage et propose « le Cercle », un membership à 15 000 FCFA par mois pour continuer l'accompagnement en groupe. Sur 8 clientes, 5 s'abonnent : <GStrong>75 000 FCFA de revenu récurrent</GStrong> chaque mois, qui s'ajoutent — cohorte après cohorte. En trois mois, Aïcha a lancé trois cohortes et cumulé plus de <GStrong>150 000 FCFA de revenus récurrents mensuels</GStrong> par-dessus ses ventes de coaching.
        </GP>
        <GCallout variant="success" title="La puissance du modèle">
          Aïcha ne vend pas des fichiers à des milliers de personnes. Elle accompagne 8 clientes à la fois, à prix premium, et transforme chaque cohorte en abonnés récurrents. Peu de clients, forte valeur, revenu qui grimpe : c'est toute la rentabilité du coaching résumée.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs-commencer",
    label: "Les erreurs à éviter et comment démarrer",
    content: (
      <>
        <GP>
          Avant de lancer votre offre, gardez en tête les pièges qui coûtent le plus cher aux coachs débutants en Afrique. Les éviter, c'est déjà prendre de l'avance sur la concurrence.
        </GP>
        <GUl>
          <GLi><GStrong>Sous-tarifer</GStrong> — le piège numéro un. Un prix bas dévalorise votre offre et attire des clients peu engagés. Vendez le résultat, pas l'heure.</GLi>
          <GLi><GStrong>Une offre floue</GStrong> — « je fais du coaching » ne se vend pas. Un résultat daté et un programme structuré, si.</GLi>
          <GLi><GStrong>Coacher à vie gratuitement</GStrong> — sans début ni fin clairs, vous vous épuisez. Bornez la durée et le nombre de séances.</GLi>
          <GLi><GStrong>Négliger le paiement</GStrong> — imposer un virement compliqué fait fuir. Le Mobile Money natif et l'escrow de Novakou lèvent cette friction.</GLi>
          <GLi><GStrong>Oublier les témoignages</GStrong> — sans preuve sociale, chaque vente repart de zéro. Collectez dès votre premier client.</GLi>
        </GUl>
        <GP>
          Pour démarrer concrètement, vous n'avez besoin que de trois choses : une offre claire, une page de vente et un moyen d'encaisser. Novakou vous donne les trois au même endroit, sans abonnement obligatoire ni compétence technique. Créez votre produit de coaching, générez votre lien de paiement, et partagez-le. Vous encaissez en Mobile Money dès votre premier client.
        </GP>
        <GP>
          Si vous hésitez encore sur l'outil, comparez les solutions dans notre guide <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA> — vous verrez pourquoi le Mobile Money natif et l'escrow font la différence pour un coach. Puis lancez-vous : <GA href="/inscription?role=vendeur">créez votre boutique vendeur gratuitement</GA> et publiez votre première offre d'accompagnement dès aujourd'hui.
        </GP>
        <GCallout variant="info" title="Commencez petit, montez en gamme">
          Vous n'êtes pas obligé de tout lancer d'un coup. Démarrez avec une seule offre de coaching et cinq clients. Encaissez, collectez des témoignages, ajustez votre prix. Puis ajoutez le groupe, le membership et l'automatisation au fur et à mesure. La rentabilité du coaching se construit une marche à la fois.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Combien coûte une offre de coaching en ligne en Afrique ?",
    a: "Une offre de coaching réaliste se situe entre 25 000 et 150 000 FCFA selon le format et la durée. Le coaching de groupe démarre autour de 25 000 – 60 000 FCFA par participant, tandis qu'un accompagnement individuel premium se vend 60 000 à 150 000 FCFA. Le prix doit refléter le résultat obtenu, pas votre temps passé.",
  },
  {
    q: "Comment se faire payer pour du coaching en Afrique francophone ?",
    a: "Avec Novakou, votre client paie en Mobile Money (Wave, Orange Money, MTN, Moov) ou par carte bancaire pour la diaspora. Vous générez un lien de paiement que vous collez dans WhatsApp ; le client paie en quelques secondes et le paiement séquestré (escrow) le rassure. Vous recevez les fonds dans votre portefeuille, retirables en Mobile Money ou par virement.",
  },
  {
    q: "Faut-il un site web pour vendre du coaching en ligne ?",
    a: "Non. Sur Novakou, vous créez une page de vente professionnelle sans coder ni payer de web designer. Vous pouvez aussi simplement générer un lien de paiement et le partager sur WhatsApp, Instagram ou TikTok. Beaucoup de coachs vendent leurs premières places uniquement via une conversation et un lien.",
  },
  {
    q: "Pourquoi le coaching est-il plus rentable qu'un ebook ou une formation ?",
    a: "Parce que le prix est élevé et que la valeur perçue d'un accompagnement personnalisé est forte. Une seule vente de coaching à 80 000 FCFA équivaut à des dizaines de ventes d'ebook. Avec cinq à dix clients par mois, beaucoup de coachs dépassent déjà un bon salaire, sans avoir à toucher un grand volume de clients.",
  },
  {
    q: "Comment éviter les rendez-vous manqués et les oublis de paiement ?",
    a: "En automatisant. Novakou déclenche automatiquement l'onboarding après paiement, envoie des rappels avant chaque séance Google Meet ou Zoom, et propose le renouvellement en fin d'accompagnement. Vous divisez vos no-shows et vous gardez votre énergie pour le coaching lui-même plutôt que pour l'administratif.",
  },
  {
    q: "Comment transformer mes clients de coaching en revenu récurrent ?",
    a: "En construisant un escalier de valeur : audit gratuit, puis coaching premium, puis membership. À la fin de l'accompagnement, proposez un abonnement mensuel à une communauté ou à des sessions de groupe. C'est ce qui génère un revenu récurrent chaque mois. Notre guide sur l'abonnement et le membership détaille toute la mise en place sur Novakou.",
  },
];

export default function VendreCoachingEnLigne() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
