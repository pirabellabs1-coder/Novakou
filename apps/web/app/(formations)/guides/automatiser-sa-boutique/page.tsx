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
  slug: "automatiser-sa-boutique",
  title: "Automatiser sa boutique en ligne : workflows, e-mails et relances",
  subtitle:
    "E-mail de bienvenue après achat, relance de panier abandonné, upsell, séquences de vente : mettez votre boutique en pilote automatique et vendez pendant que vous dormez, sans perdre une seule vente.",
  category: "Automatiser",
  level: "Intermédiaire",
  levelColor: "#0891b2",
  gradient: "linear-gradient(135deg, #083344, #0891b2 60%, #22c55e)",
  icon: "smart_toy",
  time: "15 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "automatiser boutique en ligne Afrique",
    "automatisation marketing vendeur",
    "séquence email automatique",
    "relance panier abandonné",
    "workflow vente automatique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Automatiser sa boutique en ligne : workflows, e-mails et relances | Novakou";
const SEO_DESCRIPTION =
  "Le guide complet pour automatiser votre boutique en Afrique : workflows si X → alors Y, séquences e-mail, relance de panier abandonné, upsell après achat. Vendez pendant que vous dormez avec Novakou.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Automatiser sa boutique en ligne",
)}&subtitle=${encodeURIComponent(
  "Workflows, séquences e-mail et relances automatiques avec Novakou",
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
  src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Créateur africain automatisant sa boutique en ligne et ses e-mails avec Novakou",
  caption: "Mettez votre boutique en pilote automatique : chaque vente déclenche la bonne action, toute seule.",
};

const stats = [
  { value: "24 h/24", label: "vos relances et e-mails tournent même quand vous dormez" },
  { value: "70 %", label: "des paniers sont abandonnés — la relance en récupère une partie" },
  { value: "0 clic", label: "à faire une fois le workflow lancé : tout est automatique" },
  { value: "+30 %", label: "de panier moyen possible avec un upsell bien placé" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-automatiser",
    label: "Pourquoi automatiser sa boutique",
    content: (
      <>
        <GP>
          Un créateur qui débute fait tout à la main : il répond à chaque message, envoie l'accès au produit après chaque paiement, relance les clients un par un sur WhatsApp. Ça fonctionne… tant qu'il y a trois ventes par semaine. Le jour où il en fait trente, il se noie. Il oublie des acheteurs, envoie l'accès en retard, laisse filer des dizaines de clients qui étaient à deux doigts d'acheter. L'automatisation résout exactement ce problème.
        </GP>
        <GP>
          Automatiser, ce n'est pas devenir un robot froid. C'est <GStrong>préparer une fois</GStrong> les bons messages et les bonnes actions, puis laisser la plateforme les exécuter au bon moment, pour chaque client, sans que vous ayez à y penser. Trois bénéfices concrets pour un vendeur en Afrique francophone.
        </GP>
        <GUl>
          <GLi><GStrong>Gagner du temps</GStrong> — vous ne réécrivez plus le même message de bienvenue cinquante fois. Vous le rédigez une fois, il part tout seul à chaque achat.</GLi>
          <GLi><GStrong>Vendre pendant que vous dormez</GStrong> — un client de la diaspora achète à 3 h du matin, heure de Dakar. Sans automatisation, il attend votre réveil. Avec, il reçoit son accès et son e-mail de bienvenue en dix secondes.</GLi>
          <GLi><GStrong>Ne perdre aucune vente</GStrong> — la plupart des acheteurs hésitants ne reviennent jamais d'eux-mêmes. Une relance automatique, envoyée au bon moment, en récupère une partie que vous auriez perdue à jamais.</GLi>
        </GUl>
        <GStats
          items={[
            { value: "1 fois", label: "vous configurez, la plateforme exécute des centaines de fois" },
            { value: "10 s", label: "délai entre l'achat et la livraison automatique de l'accès" },
            { value: "3 h", label: "un client peut acheter la nuit et être servi sans vous" },
          ]}
        />
        <GCallout variant="info" title="L'automatisation, c'est de l'argent qui dort">
          Chaque tâche répétitive que vous faites à la main est du temps que vous ne passez pas à créer ou à vendre. Chaque relance que vous oubliez d'envoyer est une vente qui n'aura jamais lieu. Automatiser, c'est transformer ces fuites en revenus.
        </GCallout>
      </>
    ),
  },
  {
    id: "ce-qu-on-peut-automatiser",
    label: "Ce que vous pouvez automatiser",
    content: (
      <>
        <GP>
          Avant de plonger dans le « comment », regardons le « quoi ». Voici les automatisations qui rapportent le plus à un vendeur de produits numériques, de la plus simple à la plus avancée. Vous n'avez pas besoin de toutes les activer le premier jour — commencez par une, puis empilez les autres.
        </GP>
        <GCards
          items={[
            { icon: "waving_hand", title: "E-mail de bienvenue après achat", text: "Dès qu'un client paie, il reçoit un message chaleureux avec son accès, un mot de remerciement et les prochaines étapes. La première impression est cruciale." },
            { icon: "shopping_cart", title: "Relance de panier abandonné", text: "L'acheteur a commencé le paiement puis a fermé la page. Un rappel automatique quelques heures plus tard le ramène au checkout." },
            { icon: "trending_up", title: "Upsell après achat", text: "Deux jours après l'achat, proposez une offre complémentaire : coaching, module avancé, pack de templates. Le panier moyen grimpe." },
            { icon: "mark_email_read", title: "Séquence de vente pour un prospect", text: "Un curieux télécharge votre guide gratuit ? Une suite de messages l'éduque puis l'amène vers votre offre payante." },
            { icon: "notifications_active", title: "Relance des inactifs", text: "Un client n'a rien acheté depuis 30 jours ? Un message de réactivation, parfois avec une promo, le réveille." },
            { icon: "label", title: "Ajout de tags automatique", text: "Chaque action (achat, clic, téléchargement) range le contact dans le bon segment pour lui envoyer, plus tard, la bonne offre." },
          ]}
        />
        <GP>
          Toutes ces automatisations reposent sur deux briques disponibles nativement dans Novakou : les <GStrong>workflows</GStrong> (une règle « si ceci se produit → alors fais cela ») et les <GStrong>séquences d'e-mails</GStrong> (une suite de messages envoyés dans le temps). Voyons chacune en détail.
        </GP>
      </>
    ),
  },
  {
    id: "workflows",
    label: "Les workflows Novakou : si X → alors Y",
    content: (
      <>
        <GP>
          Un workflow, c'est une règle logique que la plateforme suit à votre place. Elle se lit toujours de la même façon : <GStrong>« si tel événement se produit, alors exécute telle action »</GStrong>. C'est aussi simple qu'une phrase, mais infiniment puissant, car la plateforme applique cette règle à chaque client, en permanence, sans jamais se fatiguer ni oublier.
        </GP>
        <GH3>Les déclencheurs (le « si X »)</GH3>
        <GP>
          Un déclencheur est l'événement qui met le workflow en marche. Sur Novakou, ce sont typiquement : un <GStrong>achat confirmé</GStrong>, un <GStrong>panier abandonné</GStrong>, une <GStrong>inscription à votre liste</GStrong>, un <GStrong>téléchargement de produit gratuit</GStrong>, ou encore l'<GStrong>ajout d'un tag</GStrong> à un contact. C'est le point de départ : dès que l'événement survient, la machine s'enclenche.
        </GP>
        <GH3>Les actions (le « alors Y »)</GH3>
        <GP>
          L'action, c'est ce que la plateforme fait en réponse. Envoyer un e-mail, attendre un certain délai (2 heures, 2 jours, 1 semaine), ajouter ou retirer un tag, démarrer une séquence, proposer une offre. Vous pouvez enchaîner plusieurs actions : envoyer un e-mail, <GStrong>attendre</GStrong> deux jours, puis envoyer un second e-mail. C'est ce délai qui transforme une simple notification en véritable stratégie de vente.
        </GP>
        <GCallout variant="tip" title="Le délai, votre meilleur allié">
          L'action « attendre » est la plus sous-estimée. C'est elle qui vous permet de laisser respirer votre client : un e-mail de bienvenue tout de suite, puis on attend 48 heures avant de proposer un upsell — le temps que le client découvre son produit et vous fasse confiance. Sans ce timing, l'upsell arrive trop tôt et agace.
        </GCallout>
        <GH3>Un exemple qui parle</GH3>
        <GP>
          « <GStrong>Si</GStrong> un client achète ma formation → <GStrong>alors</GStrong> envoie l'e-mail de bienvenue + ajoute le tag <em>client-formation</em> + attends 2 jours + propose mon coaching à -20 %. » Vous écrivez cette règle une fois, dans l'éditeur de workflows. Ensuite, qu'il y ait un ou mille acheteurs, chacun reçoit exactement ce parcours, au bon rythme. Pour aller plus loin, notre guide dédié aux <GA href="/guides/automatisations-novakou">automatisations Novakou</GA> détaille tous les déclencheurs et actions disponibles.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Tableau de bord d'automatisation marketing montrant un workflow si achat alors e-mail sur Novakou"
          caption="Un workflow se construit visuellement : un déclencheur à gauche, une suite d'actions à droite. Simple à lire, puissant à l'usage."
        />
      </>
    ),
  },
  {
    id: "sequences",
    label: "Les séquences d'e-mails déclenchées",
    content: (
      <>
        <GP>
          Là où le workflow décrit la logique globale, la <GStrong>séquence d'e-mails</GStrong> est la série de messages qui part automatiquement dans le temps. C'est le cœur de la relation avec vos clients : c'est par l'e-mail que vous les accueillez, les rassurez, les éduquez et, finalement, les faites acheter — encore et encore.
        </GP>
        <GH3>Pourquoi l'e-mail plutôt que WhatsApp ?</GH3>
        <GP>
          WhatsApp est excellent pour le contact direct, mais impossible à automatiser proprement à grande échelle : vous ne pouvez pas programmer un message à chacun de vos 500 clients, au bon moment, sans y passer vos journées. L'e-mail, lui, s'automatise parfaitement. Il vous appartient (contrairement à un compte réseau social qui peut être bloqué du jour au lendemain), il arrive dans une boîte que le client consulte, et il se déclenche tout seul.
        </GP>
        <GH3>Une séquence type, étape par étape</GH3>
        <GUl>
          <GLi><GStrong>Jour 0 — Bienvenue</GStrong> : « Merci pour votre confiance ! Voici votre accès. » Le client est rassuré, il a bien reçu ce qu'il a payé.</GLi>
          <GLi><GStrong>Jour 2 — Valeur</GStrong> : un conseil, une astuce, un premier résultat rapide à obtenir avec le produit. Vous prouvez votre expertise.</GLi>
          <GLi><GStrong>Jour 4 — Preuve</GStrong> : un témoignage d'un autre client, à Abidjan ou Dakar, qui a réussi. La confiance monte d'un cran.</GLi>
          <GLi><GStrong>Jour 6 — Offre</GStrong> : vous proposez l'étape suivante (coaching, module avancé). Le client est prêt, le moment est juste.</GLi>
        </GUl>
        <GP>
          Cette structure n'est pas figée — vous l'adaptez à votre produit. Pour maîtriser l'art d'écrire ces messages, lisez nos guides sur les <GA href="/guides/sequences-emails">séquences d'e-mails</GA> et sur les <GA href="/guides/email-marketing-5-emails-vendent">5 e-mails qui vendent</GA>, qui donnent des modèles prêts à copier.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Vendeuse africaine préparant ses séquences d'e-mails automatiques sur son ordinateur portable"
          caption="Une séquence d'e-mails bien pensée accueille, rassure et vend — automatiquement, pour chaque nouveau contact."
        />
        <GCallout variant="success" title="Une séquence, ça se réutilise à l'infini">
          Vous rédigez votre séquence de bienvenue une seule fois. Chaque nouveau client, aujourd'hui comme dans deux ans, la reçoit automatiquement. C'est un actif : vous construisez une machine à convertir qui travaille sans vous, chaque jour un peu plus rentable.
        </GCallout>
      </>
    ),
  },
  {
    id: "exemple-bienvenue",
    label: "Exemple concret : le parcours après achat",
    content: (
      <>
        <GP>
          Rien ne vaut un cas réel. Prenons Aïcha, formatrice à Dakar, qui vend une formation en marketing digital à 35 000 FCFA. Voici l'automatisation qu'elle met en place — et que vous pouvez copier en quelques minutes.
        </GP>
        <GH3>Le déclencheur</GH3>
        <GP>
          <GStrong>Si</GStrong> un client paie la formation « Marketing digital », le workflow démarre. Le paiement est confirmé par Mobile Money ou carte, les fonds sont sécurisés par l'escrow Novakou, et l'automatisation s'enclenche dans la foulée.
        </GP>
        <GH3>La suite d'actions</GH3>
        <GUl>
          <GLi><GStrong>Immédiatement</GStrong> — envoi de l'e-mail de bienvenue avec le lien d'accès à la formation et un mot personnel d'Aïcha. Ajout du tag <em>client-formation</em>.</GLi>
          <GLi><GStrong>Après 1 jour</GStrong> — un e-mail « Comment tirer le maximum de votre formation », avec le premier module à regarder en priorité. Le client passe à l'action, ne laisse pas dormir son achat.</GLi>
          <GLi><GStrong>Après 2 jours</GStrong> — la proposition d'upsell : « Vous voulez que je vous accompagne en direct ? Voici mon coaching à -20 % réservé aux élèves. » Le client, déjà satisfait, ajoute 25 000 FCFA d'un clic.</GLi>
          <GLi><GStrong>Après 7 jours</GStrong> — une demande d'avis. Ces témoignages nourrissent la preuve sociale et rassurent les futurs acheteurs.</GLi>
        </GUl>
        <GP>
          Résultat : Aïcha a construit ce parcours <GStrong>une seule fois</GStrong>. Depuis, chaque acheteuse le vit intégralement, de jour comme de nuit. Elle ne touche plus à rien, encaisse les upsells automatiquement, et récolte des avis sans les réclamer un par un. C'est exactement ce que fait une boutique automatisée : elle transforme chaque vente en un petit parcours qui rapporte davantage.
        </GP>
        <GCallout variant="tip" title="L'upsell après achat est le plus facile à vendre">
          Un client qui vient de payer vous fait confiance et a sa carte ou son Mobile Money encore en tête. C'est le meilleur moment pour proposer un complément. Bien placé, deux jours après, cet upsell peut ajouter jusqu'à 30 % à votre chiffre d'affaires sans un seul nouveau client à acquérir.
        </GCallout>
      </>
    ),
  },
  {
    id: "exemple-panier",
    label: "Exemple : récupérer les paniers abandonnés",
    content: (
      <>
        <GP>
          C'est l'automatisation qui rapporte le plus vite, et pourtant la plus négligée. Un acheteur clique sur « Payer », arrive au checkout, puis s'arrête : réseau instable, hésitation de dernière minute, téléphone qui sonne, solde Mobile Money insuffisant. Il part. Dans une boutique classique, il est perdu. Sur Novakou, un workflow le rattrape.
        </GP>
        <GH3>Comment ça marche</GH3>
        <GUl>
          <GLi><GStrong>Déclencheur</GStrong> — « panier abandonné » : le client a commencé le paiement sans le terminer.</GLi>
          <GLi><GStrong>Après 1 heure</GStrong> — un premier e-mail doux : « Vous avez oublié quelque chose ? Votre produit vous attend, terminez en un clic. » avec le lien direct vers le checkout.</GLi>
          <GLi><GStrong>Après 24 heures</GStrong> — un second rappel, avec une raison de revenir maintenant : une réponse à l'objection classique, ou une petite garantie « satisfait ou remboursé ».</GLi>
          <GLi><GStrong>Après 3 jours</GStrong> — une dernière relance, parfois avec un code promo de -10 % pour lever la dernière hésitation.</GLi>
        </GUl>
        <GP>
          Sur la plupart des boutiques, près de <GStrong>70 % des paniers sont abandonnés</GStrong>. Même en n'en récupérant qu'une petite fraction grâce à ces relances, vous ajoutez des ventes qui étaient tout simplement perdues. Pour un vendeur au Cameroun ou au Bénin qui fait 40 tentatives de paiement par mois, ce sont plusieurs ventes de plus, mois après mois, sans effort supplémentaire.
        </GP>
        <GCallout variant="warning" title="Une vente perdue ne revient presque jamais toute seule">
          Un acheteur qui abandonne et que personne ne relance ne reviendra quasiment jamais de lui-même. La relance de panier n'est pas un bonus : c'est de l'argent que vous laissez sur la table tant qu'elle n'est pas activée. C'est la toute première automatisation à mettre en place.
        </GCallout>
      </>
    ),
  },
  {
    id: "premiere-automatisation",
    label: "Mettre en place votre première automatisation",
    content: (
      <>
        <GP>
          Assez de théorie. Voici comment lancer votre première automatisation sur Novakou, concrètement, en moins de quinze minutes. Nous commençons par la plus simple et la plus utile : l'e-mail de bienvenue après achat.
        </GP>
        <GUl>
          <GLi><GStrong>Étape 1 — Rédigez votre message</GStrong> : dans votre tableau de bord, ouvrez la section Automatisations et créez un nouvel e-mail de bienvenue. Chaleureux, court, avec le remerciement, l'accès et une prochaine étape claire.</GLi>
          <GLi><GStrong>Étape 2 — Choisissez le déclencheur</GStrong> : sélectionnez « achat confirmé » et, si vous voulez, ciblez un produit précis ou toute votre boutique.</GLi>
          <GLi><GStrong>Étape 3 — Ajoutez les actions</GStrong> : « envoyer l'e-mail de bienvenue », puis éventuellement « ajouter le tag client » et « attendre 2 jours → proposer l'upsell ».</GLi>
          <GLi><GStrong>Étape 4 — Testez</GStrong> : faites un achat test ou utilisez le mode de prévisualisation pour vérifier que le message part bien et que les liens fonctionnent.</GLi>
          <GLi><GStrong>Étape 5 — Activez</GStrong> : mettez le workflow en marche. À partir de maintenant, chaque nouvel acheteur le suivra automatiquement.</GLi>
        </GUl>
        <GP>
          Une fois cette première automatisation en place et vérifiée, ajoutez la relance de panier abandonné. Puis, quand vous serez à l'aise, la séquence de vente pour vos prospects gratuits. Vous empilez les briques une par une, sans jamais vous sentir dépassé. C'est la beauté d'une plateforme tout-en-un : tout est déjà connecté, vous n'avez rien à brancher.
        </GP>
        <GCallout variant="info" title="Commencez petit, mais commencez">
          N'attendez pas d'avoir la « stratégie parfaite ». Un seul e-mail de bienvenue automatique vaut mieux que dix idées jamais mises en place. Activez-en une aujourd'hui, observez, améliorez. L'automatisation se construit par couches, pas d'un coup.
        </GCallout>
      </>
    ),
  },
  {
    id: "bonnes-pratiques",
    label: "Les bonnes pratiques pour convertir",
    content: (
      <>
        <GP>
          Une automatisation mal réglée peut agacer autant qu'une bonne peut convertir. Voici les principes qui font la différence, éprouvés sur des milliers de boutiques.
        </GP>
        <GUl>
          <GLi><GStrong>Une action, un message</GStrong> — chaque e-mail doit avoir un seul objectif clair : accueillir, éduquer, ou vendre. Ne mélangez pas tout dans un pavé illisible.</GLi>
          <GLi><GStrong>Respectez le rythme du client</GStrong> — laissez respirer entre deux messages. Un e-mail par jour maximum en séquence, jamais plusieurs par jour, sauf urgence réelle.</GLi>
          <GLi><GStrong>Écrivez comme à un ami</GStrong> — un ton humain, simple, direct convertit mieux qu'un langage corporate. Vos clients à Dakar ou Cotonou veulent parler à une personne, pas à une entreprise.</GLi>
          <GLi><GStrong>Un seul appel à l'action</GStrong> — chaque message se termine par une action évidente : un bouton, un lien. Ne noyez pas votre client sous les choix.</GLi>
          <GLi><GStrong>Segmentez avec les tags</GStrong> — un client qui a déjà acheté ne doit pas recevoir la même séquence qu'un prospect. Les tags rangent vos contacts pour leur parler juste.</GLi>
          <GLi><GStrong>Mesurez et ajustez</GStrong> — regardez quels e-mails sont ouverts, cliqués, quels workflows convertissent. Gardez ce qui marche, coupez le reste.</GLi>
        </GUl>
        <GCallout variant="success" title="La règle d'or : apporter de la valeur avant de vendre">
          Un client qui reçoit de vous conseils, astuces et résultats concrets avant qu'on lui demande de racheter est un client fidèle. Vos séquences ne doivent pas être une suite de « achète, achète, achète » : donnez d'abord, la vente suit naturellement.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs",
    label: "Les erreurs à éviter absolument",
    content: (
      <>
        <GP>
          L'automatisation est un couteau à double tranchant. Bien réglée, elle multiplie vos ventes ; mal réglée, elle brûle votre relation client. Voici les pièges les plus courants et comment les éviter.
        </GP>
        <GH3>Envoyer trop d'e-mails</GH3>
        <GP>
          L'erreur numéro un. Un vendeur enthousiaste programme cinq messages en trois jours et se retrouve marqué comme indésirable. Résultat : ses e-mails n'arrivent même plus. <GStrong>Moins mais mieux</GStrong> : mieux vaut trois e-mails utiles bien espacés que dix messages agressifs. Respectez la boîte de réception de votre client comme vous respecteriez son domicile.
        </GP>
        <GH3>Un mauvais timing</GH3>
        <GP>
          Proposer un upsell coaching à 25 000 FCFA <GStrong>cinq minutes</GStrong> après l'achat, alors que le client n'a même pas encore ouvert son produit, ne fonctionne pas : il ne vous fait pas encore assez confiance. À l'inverse, relancer un panier abandonné une semaine plus tard, c'est trop tard, l'envie est passée. Le bon délai est tout : une heure pour un panier, deux jours pour un upsell, quelques jours pour une séquence.
        </GP>
        <GP>
          En pratique, testez et ajustez vos délais en observant vos résultats. Il n'y a pas de chiffre magique universel — il y a le rythme qui convient à votre audience.
        </GP>
        <GH3>Oublier l'humain derrière l'automatisation</GH3>
        <GP>
          Un e-mail automatique ne doit jamais <em>sonner</em> automatique. Signez de votre nom, parlez à la première personne, montrez que c'est bien vous, la formatrice de Dakar ou le coach d'Abidjan, qui écrivez. Un message robotique et impersonnel donne l'impression d'une usine, pas d'un créateur en qui on a envie d'investir.
        </GP>
        <GH3>Automatiser sans jamais vérifier</GH3>
        <GP>
          Un lien cassé, un accès qui n'arrive pas, un e-mail avec le mauvais prénom : ces petits bugs, répétés à des centaines de clients, font de gros dégâts. <GStrong>Testez chaque workflow</GStrong> avant de l'activer, et relisez vos statistiques de temps en temps. L'automatisation travaille seule, mais elle mérite une inspection régulière.
        </GP>
        <GCallout variant="warning" title="Automatisé ne veut pas dire abandonné">
          Mettre en pilote automatique ne signifie pas ne plus jamais regarder. Une fois par mois, ouvrez vos automatisations, vérifiez qu'elles tournent, lisez ce que reçoivent vos clients. Une machine qui déraille sans surveillance coûte plus cher qu'une tâche faite à la main.
        </GCallout>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Lancez votre boutique automatisée",
    content: (
      <>
        <GP>
          Automatiser sa boutique n'est plus réservé aux grandes entreprises ni aux experts techniques. Avec Novakou, un créateur seul, à Dakar, Abidjan, Douala ou Cotonou, peut mettre en place en quelques minutes ce qui, hier encore, demandait cinq outils et un développeur. Tout est intégré : les paiements en Mobile Money, la boutique, les workflows et les séquences d'e-mails se parlent nativement.
        </GP>
        <GP>
          Récapitulons le chemin : commencez par l'<GStrong>e-mail de bienvenue après achat</GStrong>, ajoutez la <GStrong>relance de panier abandonné</GStrong>, puis un <GStrong>upsell deux jours après l'achat</GStrong>, et enfin une <GStrong>séquence de vente</GStrong> pour vos prospects. Chaque brique posée est du revenu supplémentaire qui rentre sans effort, jour et nuit. Vous ne courez plus après vos clients : votre boutique travaille pour vous.
        </GP>
        <GCards
          items={[
            { icon: "looks_one", title: "Bienvenue après achat", text: "La première brique : accueillir, livrer l'accès et poser le décor d'une bonne relation." },
            { icon: "looks_two", title: "Relance de panier", text: "La plus rentable : récupérer les paiements interrompus par le réseau ou l'hésitation." },
            { icon: "looks_3", title: "Upsell à J+2", text: "Proposer un complément quand la confiance est installée, pour gonfler le panier moyen." },
            { icon: "looks_4", title: "Séquence de vente", text: "Transformer vos prospects gratuits en acheteurs, message après message, sur la durée." },
          ]}
        />
        <GP>
          La meilleure façon de comprendre la puissance de l'automatisation, c'est de la vivre. <GA href="/inscription?role=vendeur">Créez votre boutique vendeur gratuitement</GA> et activez votre première automatisation dès aujourd'hui. Pour choisir la bonne plateforme en connaissance de cause, comparez aussi les <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA> — vous verrez pourquoi Novakou est la seule à réunir Mobile Money, escrow et automatisation en un seul endroit.
        </GP>
        <GCallout variant="tip" title="Votre prochaine étape">
          N'essayez pas de tout automatiser d'un coup. Ouvrez votre tableau de bord, créez votre e-mail de bienvenue, choisissez le déclencheur « achat confirmé », activez. C'est votre première brique. Le reste suivra, naturellement, au rythme de votre croissance.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Faut-il des compétences techniques pour automatiser sa boutique sur Novakou ?",
    a: "Non. Les workflows se construisent visuellement, en choisissant un déclencheur (par exemple « achat confirmé ») puis des actions (envoyer un e-mail, attendre, ajouter un tag). Tout est en français, sans code, et des modèles prêts à l'emploi vous font gagner du temps.",
  },
  {
    q: "Quelle est la première automatisation à mettre en place ?",
    a: "L'e-mail de bienvenue après achat, suivi de très près par la relance de panier abandonné. La première améliore l'expérience et prépare les upsells ; la seconde récupère des ventes qui étaient tout simplement perdues. Commencez par ces deux-là avant d'aller plus loin.",
  },
  {
    q: "Qu'est-ce qu'un workflow « si X → alors Y » exactement ?",
    a: "C'est une règle que la plateforme applique automatiquement : « si tel événement se produit (un achat, un panier abandonné, une inscription), alors exécute telle action (envoyer un e-mail, attendre un délai, ajouter un tag, proposer une offre) ». Vous la configurez une fois, elle tourne ensuite pour chaque client, 24 h/24.",
  },
  {
    q: "L'automatisation risque-t-elle d'agacer mes clients ?",
    a: "Seulement si elle est mal réglée. Les deux erreurs à éviter sont d'envoyer trop d'e-mails et de mauvais timing. Espacez vos messages (un par jour maximum en séquence), apportez de la valeur avant de vendre, et signez de votre nom pour garder un ton humain. Bien faite, l'automatisation renforce la relation au lieu de la casser.",
  },
  {
    q: "La relance de panier abandonné fonctionne-t-elle vraiment en Afrique ?",
    a: "Oui, et elle est même particulièrement utile : de nombreux paiements échouent à cause d'un réseau instable, d'un solde Mobile Money insuffisant ou d'une hésitation de dernière minute. Une relance envoyée une heure puis un jour après le panier abandonné ramène une partie de ces acheteurs au checkout, souvent avec un rappel simple et rassurant.",
  },
  {
    q: "L'automatisation est-elle incluse dans Novakou ou faut-il un outil externe ?",
    a: "Tout est inclus nativement : workflows, séquences d'e-mails, relances de panier, tags et upsells se pilotent depuis votre tableau de bord Novakou, sans abonnement à un outil tiers ni intégration à brancher. Comme les paiements et la boutique sont sur la même plateforme, chaque vente déclenche automatiquement les bonnes actions.",
  },
];

export default function AutomatiserSaBoutique() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
