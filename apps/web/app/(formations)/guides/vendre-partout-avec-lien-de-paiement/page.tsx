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
  slug: "vendre-partout-avec-lien-de-paiement",
  title: "Vendre partout avec un lien de paiement (WhatsApp, réseaux, votre site)",
  subtitle:
    "Le lien de paiement est l'outil le plus simple pour vendre en Afrique : un lien à coller sur WhatsApp, en bio, dans une pub ou sur votre site. L'acheteur paie en Mobile Money et reçoit son accès automatiquement.",
  category: "Vendre",
  level: "Débutant",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "link",
  time: "14 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "lien de paiement Afrique",
    "vendre sur WhatsApp lien de paiement",
    "encaisser avec un lien Mobile Money",
    "lien de paiement produit digital",
    "vendre sans site web Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Lien de paiement : vendre partout en Afrique (WhatsApp, réseaux, site)";
const SEO_DESCRIPTION =
  "Comment vendre vos produits numériques avec un simple lien de paiement : WhatsApp, bio Instagram, pubs, e-mail, votre site. Paiement Mobile Money et accès automatique avec Novakou.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Vendre partout avec un lien de paiement",
)}&subtitle=${encodeURIComponent(
  "WhatsApp, réseaux, votre site — l'acheteur paie en Mobile Money",
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
  src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Créateur africain partageant un lien de paiement pour vendre son produit numérique en ligne",
  caption: "Un seul lien, collé partout : c'est la façon la plus rapide de vendre en Afrique.",
};

const stats = [
  { value: "1 lien", label: "à coller sur WhatsApp, en bio ou dans une pub" },
  { value: "Mobile Money", label: "Wave, Orange, MTN, Moov — et la carte" },
  { value: "0 site web", label: "requis pour encaisser votre première vente" },
  { value: "Accès auto", label: "livré à l'acheteur dès le paiement validé" },
];

const sections: GuideSection[] = [
  {
    id: "cest-quoi",
    label: "Un lien de paiement, c'est quoi exactement ?",
    content: (
      <>
        <GP>
          Un lien de paiement, c'est une adresse web unique (par exemple <GStrong>novakou.com/produit/ma-formation</GStrong>) qui mène directement à l'achat d'un de vos produits. Vous le copiez, vous le collez où vous voulez, et n'importe qui peut cliquer, payer et repartir avec son produit. Pas de site à construire, pas de code à écrire, pas de logiciel à installer.
        </GP>
        <GP>
          C'est l'outil <GStrong>le plus simple qui existe</GStrong> pour vendre en ligne, et c'est précisément pour cela qu'il est si puissant en Afrique. Ici, la vente se joue dans une conversation WhatsApp, dans un statut, dans les commentaires d'un post Facebook. Le lien de paiement épouse exactement cette réalité : là où vous discutez déjà avec vos clients, vous pouvez désormais encaisser.
        </GP>
        <GP>
          Concrètement, un vendeur à Dakar qui parle de sa formation dans un groupe WhatsApp n'a plus besoin de dire « envoie-moi ton Wave et je te confirme ». Il colle un lien, l'acheteur paie en dix secondes, et l'accès arrive tout seul. Le lien remplace toute la friction — la négociation, le numéro à retenir, la capture d'écran du paiement à envoyer — par un seul clic.
        </GP>
        <GCallout variant="tip" title="Retenez ceci">
          Un lien de paiement transforme n'importe quel endroit où vous avez une audience — une conversation, une bio, un commentaire, une publicité — en point de vente. Vous vendez là où vos clients sont déjà, sans les faire sortir de leur habitude.
        </GCallout>
      </>
    ),
  },
  {
    id: "pourquoi",
    label: "Pourquoi c'est l'arme n°1 pour vendre en Afrique",
    content: (
      <>
        <GP>
          En Afrique francophone, la majorité des créateurs vendent sans site web — et c'est parfaitement viable. Le lien de paiement est la brique qui rend cela possible, parce qu'il coche exactement les besoins du marché : mobile d'abord, Mobile Money, et social avant tout.
        </GP>
        <GStats
          items={[
            { value: "Mobile", label: "l'essentiel du trafic africain vient du téléphone" },
            { value: "WhatsApp", label: "le premier canal de vente sur le continent" },
            { value: "Mobile Money", label: "le moyen de paiement dominant, avant la carte" },
            { value: "1 clic", label: "entre voir votre offre et payer" },
          ]}
        />
        <GP>
          La force du lien, c'est qu'il <GStrong>supprime chaque étape où l'on perd une vente</GStrong>. Pas de « je te rappelle », pas de « comment je paie ? », pas de « attends je cherche mon numéro Orange Money ». L'acheteur clique, il voit le prix en FCFA, il choisit Wave ou MTN, il valide. La vente se conclut au moment exact où l'envie est là — chaude, immédiate.
        </GP>
        <GP>
          Ajoutez à cela la sécurité : sur Novakou, chaque paiement passe par un système sécurisé, et l'acheteur reçoit son produit automatiquement. Fini les arnaques qui font peur au marché — celui qui vous a envoyé de l'argent obtient bien ce qu'il a payé, sans que vous ayez à faire quoi que ce soit manuellement. Pour approfondir cette confiance, lisez notre guide sur <GA href="/guides/mobile-money-encaisser-paiements">encaisser des paiements en Mobile Money</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "comment-marche",
    label: "Comment ça marche, de la génération à la livraison",
    content: (
      <>
        <GP>
          Le parcours est d'une simplicité désarmante. Voici ce qui se passe, du côté vendeur puis du côté acheteur :
        </GP>
        <GH3>Côté vendeur : générer le lien</GH3>
        <GUl>
          <GLi>Vous créez votre produit sur Novakou (formation, ebook, template, coaching) avec un titre, un prix en FCFA et un visuel. Besoin d'un pas-à-pas ? Voir <GA href="/guides/creer-son-produit">créer son premier produit</GA>.</GLi>
          <GLi>Novakou génère <GStrong>automatiquement</GStrong> le lien de paiement de ce produit. Vous le trouvez dans votre tableau de bord, avec un bouton « Copier le lien ».</GLi>
          <GLi>Vous le collez où vous voulez. C'est tout. Le lien ne périme pas et fonctionne pour un nombre illimité d'acheteurs en même temps.</GLi>
        </GUl>
        <GH3>Côté acheteur : payer et recevoir</GH3>
        <GUl>
          <GLi>L'acheteur clique sur le lien depuis son téléphone.</GLi>
          <GLi>Il voit votre offre, le prix affiché en FCFA (ou dans sa devise s'il est dans la diaspora), et il choisit son moyen de paiement.</GLi>
          <GLi>Il paie en Mobile Money (Wave, Orange, MTN, Moov) ou par carte, en quelques secondes.</GLi>
          <GLi>Dès le paiement validé, <GStrong>l'accès au produit lui est livré automatiquement</GStrong> — il télécharge son fichier ou accède à son espace, et reçoit une confirmation.</GLi>
        </GUl>
        <GImage
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Acheteur africain payant un produit numérique via un lien de paiement sur son smartphone"
          caption="Cliquer, payer en Mobile Money, recevoir son accès : tout se fait sur le téléphone, en une minute."
        />
        <GCallout variant="success" title="Zéro travail manuel">
          Vous n'avez rien à envoyer vous-même. Pas de fichier à transférer à la main, pas de code d'accès à taper. Vous dormez, votre lien vend, et l'acheteur est servi. C'est la différence entre un job de livreur et un vrai business qui tourne.
        </GCallout>
      </>
    ),
  },
  {
    id: "deux-liens",
    label: "Sur Novakou : deux liens pour chaque produit",
    content: (
      <>
        <GP>
          C'est un détail qui change tout, et que peu de plateformes proposent. Sur Novakou, chaque produit vous donne <GStrong>deux liens différents</GStrong>, à utiliser selon la situation :
        </GP>
        <GCards
          items={[
            {
              icon: "description",
              title: "1. La page produit complète",
              text: "Un lien vers la page de vente entière : visuels, description détaillée, avis, prix des forfaits, garanties. Idéal quand l'acheteur découvre le produit et a besoin d'être convaincu avant de payer.",
            },
            {
              icon: "bolt",
              title: "2. Le paiement direct",
              text: "Un lien qui va droit au checkout (format /checkout?pids=...). L'acheteur atterrit directement sur l'écran de paiement, sans page intermédiaire. Parfait pour un public déjà chaud.",
            },
          ]}
        />
        <GP>
          Quand choisir l'un ou l'autre ? La règle est simple : <GStrong>plus votre audience est déjà convaincue, plus vous raccourcissez le chemin</GStrong>.
        </GP>
        <GUl>
          <GLi>Un inconnu qui tombe sur votre post pour la première fois ? Envoyez-le vers la <GStrong>page produit complète</GStrong> — il a besoin de comprendre et d'avoir confiance.</GLi>
          <GLi>Un abonné qui vous suit depuis des semaines, ou un prospect à qui vous venez d'expliquer l'offre en message privé ? Envoyez-le en <GStrong>paiement direct</GStrong> — chaque écran de trop est une occasion d'abandonner.</GLi>
          <GLi>Une vente flash annoncée dans votre statut WhatsApp ? Le paiement direct capte l'impulsion avant qu'elle ne retombe.</GLi>
        </GUl>
        <GCallout variant="info" title="Astuce de pro">
          Utilisez la page produit dans vos publications publiques (SEO, découverte), et le paiement direct dans vos messages privés et relances (conversion). Le même produit, deux armes, deux moments du parcours d'achat.
        </GCallout>
      </>
    ),
  },
  {
    id: "ou-utiliser",
    label: "Où coller votre lien : tous vos canaux de vente",
    content: (
      <>
        <GP>
          Un lien de paiement se colle littéralement partout où vous avez une présence. Voici les canaux qui rapportent le plus en Afrique francophone :
        </GP>
        <GCards
          items={[
            {
              icon: "chat",
              title: "WhatsApp (messages & groupes)",
              text: "Le canal roi. Envoyez le lien en conversation privée après avoir présenté l'offre, ou partagez-le dans vos groupes de prospects. Voir vendre sur WhatsApp Business.",
            },
            {
              icon: "circle",
              title: "Statuts WhatsApp",
              text: "Annoncez une vente flash ou un nouveau produit en statut, avec le lien en clair. Vos contacts cliquent depuis leur fil, sans quitter WhatsApp.",
            },
            {
              icon: "groups",
              title: "Groupes Facebook",
              text: "Postez le lien dans les groupes de votre niche (entrepreneuriat, formation, votre pays). Un commentaire, un lien, une vente possible.",
            },
            {
              icon: "alternate_email",
              title: "Bio Instagram, TikTok, X",
              text: "Mettez le lien en bio (« lien en bio ! ») et renvoyez-y depuis vos stories et vidéos. Le seul endroit cliquable sur ces réseaux devient votre caisse.",
            },
            {
              icon: "campaign",
              title: "Publicités payantes",
              text: "Collez le lien comme destination de vos pubs Facebook, Instagram ou TikTok. Voir lancer une pub qui vend. Avec le pixel, vous suivez chaque euro dépensé.",
            },
            {
              icon: "mail",
              title: "E-mail & votre site",
              text: "Insérez le lien dans vos e-mails, vos signatures, ou en bouton sur votre blog / site vitrine. Où qu'un lecteur clique, il peut acheter.",
            },
          ]}
        />
        <GP>
          Le point commun de tous ces canaux ? Vous n'y vendez pas « en poussant » les gens vers un site lointain. Vous placez le point de vente <GStrong>exactement là où l'attention est déjà</GStrong>. Pour approfondir le canal le plus rentable, lisez <GA href="/guides/whatsapp-business-vendre-formations">vendre ses formations sur WhatsApp Business</GA>, et pour transformer une pub en ventes, notre guide <GA href="/guides/lancer-pub-facebook-instagram-vendre-boutique">lancer une pub Facebook & Instagram</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "cas-usage",
    label: "Trois cas concrets qui vendent tous les jours",
    content: (
      <>
        <GP>
          La théorie, c'est bien. Voici comment de vrais créateurs utilisent le lien de paiement au quotidien :
        </GP>
        <GCards
          items={[
            {
              icon: "menu_book",
              title: "L'ebook vendu sur WhatsApp",
              text: "Awa, à Abidjan, vend un ebook de recettes à 3 000 FCFA. Elle en parle dans son statut, colle le lien de paiement direct. Ses contactes cliquent, paient par Wave, et reçoivent le PDF automatiquement. Zéro échange manuel.",
            },
            {
              icon: "ads_click",
              title: "Le lien dans une publicité",
              text: "Moussa, à Dakar, lance une pub Facebook pour sa formation à 25 000 FCFA. Le lien de sa page produit est la destination. Le pixel suit chaque vue et chaque achat : il sait exactement quelle pub rapporte.",
            },
            {
              icon: "person",
              title: "Le lien en bio Instagram",
              text: "Grace, à Douala, vend des packs Canva à 5 000 FCFA. Elle met son lien en bio, en parle dans ses reels (« lien en bio »). Ses abonnés cliquent, paient en Orange Money, téléchargent leur pack aussitôt.",
            },
            {
              icon: "workspace_premium",
              title: "Le coaching en message privé",
              text: "Éric, à Cotonou, vend des séances de coaching à 40 000 FCFA. Après avoir échangé en privé, il envoie le lien de paiement direct. Le client paie en MTN Mobile Money, la séance est réservée, tout est tracé.",
            },
          ]}
        />
        <GP>
          Dans chaque cas, remarquez le schéma : <GStrong>une audience quelque part, un lien collé, un paiement Mobile Money, un accès automatique</GStrong>. C'est le même mécanisme, décliné sur des produits et des canaux différents. Une fois que vous l'avez compris, vous le reproduisez à l'infini.
        </GP>
      </>
    ),
  },
  {
    id: "sur-son-site",
    label: "Intégrer le lien sur votre propre site",
    content: (
      <>
        <GP>
          Vous avez déjà un site WordPress, un blog ou une page vitrine ? Le lien de paiement s'y intègre sans effort, et Novakou va plus loin : il peut <GStrong>débloquer l'accès chez vous, automatiquement</GStrong>, après le paiement. Deux mécanismes rendent cela possible.
        </GP>
        <GH3>La redirection après paiement</GH3>
        <GP>
          Vous pouvez configurer une <GStrong>page de redirection</GStrong> : une fois le paiement réussi, l'acheteur est renvoyé vers l'URL de votre choix — votre espace membre, une page de remerciement personnalisée, un lien de téléchargement hébergé chez vous. L'expérience reste fluide et à votre image, alors que le paiement, lui, a été géré de façon sécurisée par Novakou.
        </GP>
        <GH3>Le webhook signé</GH3>
        <GP>
          C'est la brique technique qui automatise tout. À chaque vente, Novakou envoie une <GStrong>notification signée</GStrong> (un webhook) à votre serveur : « ce client a payé ce produit ». Votre site vérifie la signature — pour être certain que le message vient bien de Novakou et n'est pas une fraude — puis débloque l'accès : il crée le compte, active l'abonnement, ou envoie le contenu. Tout se fait en une fraction de seconde, sans intervention humaine.
        </GP>
        <GCallout variant="warning" title="Vérifiez toujours la signature">
          Le webhook est signé avec un secret que vous seul et Novakou connaissez. Votre code doit contrôler cette signature avant d'accorder l'accès. C'est ce qui garantit qu'un petit malin ne peut pas simuler un faux « paiement réussi » pour obtenir votre produit gratuitement.
        </GCallout>
        <GP>
          Résultat : votre site vitrine ou votre plateforme membre encaisse en Mobile Money via un simple lien, sans que vous ayez à intégrer vous-même Wave, Orange ou une passerelle bancaire. Vous gardez votre design, Novakou fait le paiement et la livraison.
        </GP>
      </>
    ),
  },
  {
    id: "mobile-money-auto",
    label: "Mobile Money + livraison automatique = la magie",
    content: (
      <>
        <GP>
          Le cœur de tout, c'est cette combinaison : l'acheteur paie avec le moyen qu'il utilise tous les jours, et il reçoit son produit sans que personne ne bouge le petit doigt. Décortiquons pourquoi c'est si important en Afrique.
        </GP>
        <GH3>Le paiement dans sa langue habituelle</GH3>
        <GP>
          Un client à Bamako, à Dakar ou à Yaoundé n'a souvent pas de carte bancaire — mais il a son compte Orange Money ou Wave dans la poche. En lui proposant le Mobile Money dès le lien, vous parlez son langage. La diaspora à Paris ou Montréal, elle, paie par carte. Le même lien sert les deux, avec les prix affichés dans la bonne devise. Pour tout comprendre, voir <GA href="/guides/mobile-money-encaisser-paiements">encaisser en Mobile Money</GA>.
        </GP>
        <GH3>La livraison qui ne dort jamais</GH3>
        <GP>
          Une vente à 2 h du matin ? L'acheteur est servi immédiatement. Vous êtes en déplacement, sans réseau ? Vos liens continuent de vendre et de livrer. C'est ce qui sépare un revenu qui dépend de votre disponibilité d'un <GStrong>revenu qui tombe pendant que vous vivez votre vie</GStrong>. Le lien travaille pour vous 24 heures sur 24, 7 jours sur 7.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1596526131083-e8c633064194?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Paiement Mobile Money sur téléphone après un clic sur un lien de paiement Novakou"
          caption="Wave, Orange Money, MTN, Moov : l'acheteur paie avec ce qu'il a dans la poche, et reçoit son accès aussitôt."
        />
        <GCallout variant="success" title="La confiance intégrée">
          Parce que le paiement est sécurisé et la livraison automatique, l'acheteur n'a aucune raison d'hésiter : il sait qu'en payant, il reçoit. Cette certitude fait grimper votre taux de conversion — surtout sur un marché encore marqué par la peur de l'arnaque en ligne.
        </GCallout>
      </>
    ),
  },
  {
    id: "bonnes-pratiques",
    label: "Bonnes pratiques pour vendre plus avec un lien",
    content: (
      <>
        <GP>
          Le lien fait le gros du travail, mais quelques réflexes simples décuplent vos résultats :
        </GP>
        <GUl>
          <GLi><GStrong>Accompagnez toujours le lien d'un message clair</GStrong> — « Voici l'accès à la formation, paiement Wave/Orange sécurisé, tu reçois tout de suite ». Un lien nu sans contexte fait moins cliquer.</GLi>
          <GLi><GStrong>Choisissez le bon des deux liens</GStrong> — page produit pour convaincre un nouveau, paiement direct pour un public déjà chaud. Ne renvoyez jamais un prospect brûlant vers une longue page qui pourrait le refroidir.</GLi>
          <GLi><GStrong>Posez votre pixel</GStrong> avant de lancer une pub, pour mesurer quelle campagne rapporte réellement et recibler ceux qui ont failli acheter.</GLi>
          <GLi><GStrong>Créez de l'urgence honnête</GStrong> — une vente flash de 48 h, un tarif de lancement, un bonus pour les premiers acheteurs. Le lien capte l'impulsion, l'urgence la provoque.</GLi>
          <GLi><GStrong>Relancez ceux qui n'ont pas payé</GStrong> — un message de rappel avec le lien de paiement direct récupère une part des indécis. Novakou peut même automatiser ces relances de panier abandonné.</GLi>
          <GLi><GStrong>Testez vos prix et vos accroches</GStrong> — le même produit à 15 000 ou 25 000 FCFA, avec deux messages différents, vous apprend vite ce qui parle à votre marché.</GLi>
        </GUl>
        <GP>
          Enfin, gardez en tête que le lien de paiement n'est que la porte d'entrée. Une fois la vente faite, vous pouvez ajouter un upsell, déclencher une séquence e-mail, créditer un affilié — tout ce que Novakou orchestre autour de la vente. Pour voir l'ensemble, comparez les solutions dans notre guide des <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Votre premier lien de paiement en 4 étapes",
    content: (
      <>
        <GP>
          Vous pouvez avoir votre premier lien qui vend cet après-midi. Voici le chemin, sans détour :
        </GP>
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement sur Novakou — pas de carte bancaire, pas d'abonnement pour commencer.</GLi>
          <GLi><GStrong>Ajoutez votre produit</GStrong> avec un titre, un prix en FCFA et un visuel. Novakou génère aussitôt vos deux liens (page produit et paiement direct).</GLi>
          <GLi><GStrong>Activez vos moyens de paiement</GStrong> — Wave, Orange Money, MTN, Moov et carte — en un clic depuis votre tableau de bord.</GLi>
          <GLi><GStrong>Copiez votre lien et collez-le</GStrong> sur WhatsApp, en bio, dans un groupe ou une pub. Chaque vente arrive dans votre portefeuille, l'accès part tout seul chez l'acheteur.</GLi>
        </GUl>
        <GP>
          Pas besoin de tout maîtriser le premier jour. Commencez par un produit et un lien, encaissez votre première vente en Mobile Money, puis élargissez : plusieurs produits, plusieurs canaux, des pubs, de l'affiliation. Le lien de paiement est la marche la plus facile pour entrer dans le monde de la vente en ligne — et sur Novakou, c'est aussi la plus rapide. C'est pour cela que Novakou est <GStrong>la plateforme n°1 de vente de produits numériques en Afrique francophone</GStrong>.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Ai-je besoin d'un site web pour utiliser un lien de paiement ?",
    a: "Non. C'est tout l'intérêt : Novakou génère votre lien de paiement automatiquement, et vous le collez directement sur WhatsApp, en bio Instagram, dans un groupe Facebook ou une pub. L'acheteur paie et reçoit son accès sans que vous ayez le moindre site à construire.",
  },
  {
    q: "Quelle est la différence entre les deux liens de Novakou ?",
    a: "Le premier lien mène à la page produit complète (description, avis, forfaits) — idéal pour convaincre un nouveau prospect. Le second va droit au checkout (paiement direct, format /checkout?pids=...) — idéal pour un public déjà chaud, une vente flash ou une relance en message privé.",
  },
  {
    q: "Comment l'acheteur paie-t-il et reçoit-il son produit ?",
    a: "Il clique sur le lien depuis son téléphone, voit le prix en FCFA, choisit son moyen de paiement (Wave, Orange Money, MTN, Moov ou carte) et valide en quelques secondes. Dès le paiement confirmé, l'accès au produit lui est livré automatiquement, sans aucune action de votre part.",
  },
  {
    q: "Puis-je intégrer le lien de paiement sur mon propre site ?",
    a: "Oui. Vous pouvez configurer une redirection après paiement vers l'URL de votre choix, et recevoir un webhook signé qui prévient votre serveur de chaque vente. Après vérification de la signature, votre site débloque l'accès automatiquement — sans que vous ayez à intégrer vous-même une passerelle Mobile Money.",
  },
  {
    q: "Le lien de paiement fonctionne-t-il pour la diaspora ?",
    a: "Oui. Le même lien affiche le prix dans la bonne devise et accepte la carte bancaire (Visa/Mastercard) pour les acheteurs hors d'Afrique, tout en proposant le Mobile Money aux clients locaux. Un seul lien sert les deux publics.",
  },
  {
    q: "Combien coûte l'utilisation des liens de paiement sur Novakou ?",
    a: "Créer votre compte et générer vos liens est gratuit, sans abonnement obligatoire. Novakou se rémunère via une commission simple sur les ventes réalisées — vous ne payez donc rien tant que vous n'avez pas encaissé.",
  },
];

export default function VendrePartoutAvecLienDePaiement() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
