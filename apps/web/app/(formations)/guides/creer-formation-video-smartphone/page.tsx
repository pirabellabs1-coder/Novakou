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
  slug: "creer-formation-video-smartphone",
  title: "Créer une formation vidéo au smartphone : le guide complet 2026",
  subtitle:
    "Pas de studio, pas de caméra hors de prix : votre téléphone suffit. Valider votre sujet, filmer proprement, monter avec des outils gratuits, héberger, fixer le prix en FCFA et vendre en Mobile Money — la méthode complète pour lancer votre formation depuis l'Afrique.",
  category: "Créer",
  level: "Débutant",
  levelColor: "#16a34a",
  gradient: "linear-gradient(135deg, #14532d, #16a34a 60%, #84cc16)",
  icon: "videocam",
  time: "16 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "créer formation vidéo smartphone",
    "filmer une formation en ligne Afrique",
    "matériel formation vidéo pas cher",
    "structurer une formation en ligne",
    "vendre formation vidéo Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Créer une formation vidéo au smartphone : le guide complet 2026";
const SEO_DESCRIPTION =
  "Créez une formation vidéo professionnelle avec un simple smartphone : matériel pas cher, tournage, montage gratuit, hébergement, prix en FCFA et vente en Mobile Money sur Novakou.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Créer une formation vidéo au smartphone",
)}&subtitle=${encodeURIComponent(
  "Le guide complet 2026 pour filmer, monter et vendre en Afrique",
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
  src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Créateur africain filmant sa formation vidéo avec un smartphone sur trépied",
  caption: "Votre smartphone est déjà une caméra de formation. Il ne manque que la méthode.",
};

const stats = [
  { value: "0 FCFA", label: "de caméra à acheter : votre téléphone suffit" },
  { value: "5–15 min", label: "la durée idéale d'une leçon vidéo qui retient" },
  { value: "Gratuit", label: "monter avec CapCut ou iMovie, sans logiciel payant" },
  { value: "Mobile Money", label: "encaisser vos ventes en Wave, Orange, MTN, Moov" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-video",
    label: "Pourquoi la vidéo convertit mieux que tout le reste",
    content: (
      <>
        <GP>
          Un e‑book se lit en diagonale. Une vidéo, elle, se <GStrong>regarde</GStrong>. On voit votre visage, on entend votre voix, on ressent votre énergie. En quelques secondes, l'acheteur passe de « je ne connais pas cette personne » à « j'ai confiance en elle ». En Afrique francophone, où l'achat en ligne repose d'abord sur la confiance, ce lien humain vaut de l'or : c'est lui qui transforme un curieux en client, puis un client en ambassadeur.
        </GP>
        <GP>
          La vidéo permet aussi de <GStrong>vendre plus cher</GStrong>. Une formation vidéo structurée, avec modules et leçons, est perçue comme un vrai programme — pas comme un simple fichier. Un même contenu vendu 3 000 FCFA en PDF se vend sans problème 25 000 ou 35 000 FCFA en vidéo, parce que la valeur ressentie est bien supérieure. Et une fois filmée, la formation se vend à l'infini : vous la tournez une fois, vous l'encaissez cent fois.
        </GP>
        <GP>
          La bonne nouvelle ? Vous n'avez besoin ni d'un studio, ni d'une caméra à un million de francs, ni d'une équipe technique. Le téléphone que vous tenez en ce moment filme déjà en haute définition. Ce qui vous manque, ce n'est pas le matériel — c'est la <GStrong>méthode</GStrong>. C'est exactement ce que ce guide vous donne, étape par étape.
        </GP>
        <GStats
          items={[
            { value: "×5", label: "la valeur perçue d'une formation vidéo face au même contenu en PDF" },
            { value: "1 fois", label: "vous tournez, puis vous vendez sans limite de copies" },
            { value: "80 %", label: "de la qualité tient au son et à la lumière, pas à la caméra" },
          ]}
        />
      </>
    ),
  },
  {
    id: "valider-sujet",
    label: "Valider votre sujet avant de filmer",
    content: (
      <>
        <GP>
          L'erreur la plus fréquente, c'est de passer trois semaines à tout filmer… pour découvrir que personne n'en veut. Avant d'allumer la caméra, assurez‑vous que votre sujet répond à un <GStrong>vrai besoin</GStrong> pour lequel les gens sont prêts à payer.
        </GP>
        <GH3>Le bon sujet est à l'intersection de trois cercles</GH3>
        <GUl>
          <GLi><GStrong>Ce que vous savez faire</GStrong> mieux que la moyenne — une compétence, un métier, une expérience concrète.</GLi>
          <GLi><GStrong>Ce que les gens cherchent</GStrong> activement à apprendre et n'arrivent pas à trouver clairement expliqué.</GLi>
          <GLi><GStrong>Ce qui a une valeur économique</GStrong> : la formation aide à gagner de l'argent, en économiser, ou résoudre un problème pénible.</GLi>
        </GUl>
        <GP>
          Un exemple parlant : « Faire ses premières ventes en couture depuis WhatsApp », « Maîtriser la comptabilité d'une petite boutique à Cotonou », « Monter des vidéos TikTok qui font vendre ». Ces sujets sont précis, utiles, et parlent à un public identifiable. À l'inverse, « Réussir dans la vie » est trop vague pour convaincre qui que ce soit d'acheter.
        </GP>
        <GH3>Testez avant de tourner</GH3>
        <GP>
          Publiez un post sur WhatsApp, Facebook ou TikTok : « Je prépare une formation sur X. Ça vous intéresse ? » Comptez les réactions et les messages privés. Mieux : proposez une pré‑inscription à prix réduit. Si dix personnes paient un acompte avant même que la formation existe, vous avez la preuve absolue que votre sujet vend. Pour affiner votre offre, lisez aussi notre guide <GA href="/guides/creer-son-produit">créer son premier produit</GA>.
        </GP>
        <GCallout variant="tip" title="Un sujet vaut mieux que vingt">
          Ne cherchez pas à tout enseigner. Une formation ciblée qui résout un seul problème précis se vend dix fois mieux qu'un cours « fourre‑tout » qui survole tout sans rien approfondir. Commencez petit et spécifique.
        </GCallout>
      </>
    ),
  },
  {
    id: "structurer",
    label: "Structurer votre formation en modules et leçons",
    content: (
      <>
        <GP>
          Une formation qui se vend et qui se termine, c'est une formation <GStrong>bien découpée</GStrong>. Personne ne regarde une vidéo de deux heures d'affilée sur un téléphone. Le secret, c'est de fractionner votre savoir en petites unités digestes.
        </GP>
        <GH3>La hiérarchie qui marche</GH3>
        <GUl>
          <GLi><GStrong>La formation</GStrong> — la promesse globale : « À la fin, vous saurez faire X. »</GLi>
          <GLi><GStrong>Les modules</GStrong> — 3 à 6 grandes parties, chacune correspondant à une étape du parcours de l'apprenant.</GLi>
          <GLi><GStrong>Les leçons</GStrong> — dans chaque module, des vidéos courtes de <GStrong>5 à 15 minutes</GStrong>, une idée par leçon.</GLi>
        </GUl>
        <GP>
          Ce découpage en leçons courtes n'est pas un détail : c'est ce qui permet à votre élève d'avancer, de cocher, de progresser. Chaque leçon terminée est une petite victoire qui le motive à passer à la suivante. Un apprenant qui termine votre formation vous laisse un bon avis, vous recommande, et rachète votre prochaine offre.
        </GP>
        <GH3>Écrivez votre plan avant de filmer</GH3>
        <GP>
          Posez sur papier (ou dans une note du téléphone) le titre de chaque module et de chaque leçon, avec les 3 points clés à aborder. Ce plan devient votre script : vous ne bafouillez plus, vous ne vous répétez plus, et vous filmez chaque leçon d'une traite. Un bon plan, c'est la moitié du travail de tournage déjà faite.
        </GP>
        <GCallout variant="info" title="La règle de l'action">
          Terminez chaque leçon par une action concrète : « Maintenant, faites ceci. » Une formation qui fait passer à l'action donne des résultats, et une formation qui donne des résultats génère des témoignages qui vendent la suivante.
        </GCallout>
      </>
    ),
  },
  {
    id: "materiel",
    label: "Le matériel minimal (et pas cher)",
    content: (
      <>
        <GP>
          Voici la vérité que personne ne vous dit : la caméra n'est presque jamais le problème. Ce qui distingue une formation « amateur » d'une formation « pro », c'est le <GStrong>son</GStrong> et la <GStrong>lumière</GStrong>. Un smartphone de milieu de gamme filme parfaitement bien. Voici la trousse complète, du plus important au plus accessoire.
        </GP>
        <GCards
          items={[
            { icon: "smartphone", title: "Le smartphone", text: "Celui que vous avez déjà. Filmez en 1080p, caméra arrière (meilleure que la selfie), à l'horizontale pour les cours." },
            { icon: "wb_sunny", title: "La lumière naturelle", text: "Placez‑vous face à une fenêtre, jamais dos à elle. Gratuit, et plus flatteur que la plupart des lampes." },
            { icon: "mic", title: "Le micro‑cravate", text: "Le meilleur investissement : un micro‑cravate filaire coûte 3 000 à 8 000 FCFA et transforme votre son du tout au tout." },
            { icon: "camera_alt", title: "Le trépied", text: "Un trépied de téléphone ou un support improvisé (pile de livres) pour une image stable, sans tremblements." },
          ]}
        />
        <GH3>Pourquoi le micro avant tout</GH3>
        <GP>
          Un spectateur pardonne une image moyenne, mais pas un son mauvais. Un écho, un bruit de ventilateur, une voix lointaine, et il ferme la vidéo en dix secondes. Le micro‑cravate à quelques milliers de FCFA se clipse sur votre col, se branche dans le téléphone, et votre voix devient nette et proche. C'est l'accessoire qui offre le plus gros bond de qualité pour le moins d'argent.
        </GP>
        <GH3>La lumière qui ne coûte rien</GH3>
        <GP>
          À Dakar, Abidjan ou Douala, vous avez la meilleure source de lumière du monde à portée de main : le soleil. Filmez de jour, face à une fenêtre, avec la lumière qui éclaire votre visage. Évitez le contre‑jour (fenêtre derrière vous), qui vous transforme en ombre chinoise. Un anneau lumineux (ring light) à 5 000 FCFA est un bon complément pour filmer le soir, mais il n'est pas indispensable au départ.
        </GP>
        <GCallout variant="success" title="Budget total : moins de 15 000 FCFA">
          Micro‑cravate + trépied de téléphone, et vous êtes équipé pour produire une formation d'apparence professionnelle. Le reste — smartphone et lumière du jour — vous l'avez déjà. Pas d'excuse matérielle pour ne pas commencer.
        </GCallout>
      </>
    ),
  },
  {
    id: "filmer",
    label: "Filmer : cadre, son, lumière, plan par plan",
    content: (
      <>
        <GImage
          src="https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Smartphone sur trépied filmant une scène bien éclairée pour une formation en ligne"
          caption="Un cadre stable, un visage bien éclairé, un micro proche : les trois piliers d'une vidéo pro."
        />
        <GH3>Soignez le cadre</GH3>
        <GP>
          Placez le téléphone à hauteur des yeux, pas en contre‑plongée. Laissez un peu d'espace au‑dessus de la tête. Rangez l'arrière‑plan : un mur uni, une étagère ordonnée, ou un fond neutre suffisent. Un cadre propre inspire le sérieux ; un fond en désordre distrait et décrédibilise. Filmez à l'<GStrong>horizontale</GStrong> pour les cours à l'écran, ou à la verticale si vous visez d'abord un public mobile façon TikTok.
        </GP>
        <GH3>Le son avant tout</GH3>
        <GP>
          Branchez votre micro‑cravate et faites un test de 20 secondes que vous réécoutez au casque. Coupez le ventilateur, fermez la fenêtre côté rue, éloignez‑vous des surfaces qui résonnent. Filmez dans une pièce avec des rideaux ou des meubles, qui absorbent l'écho. Un son propre, c'est 80 % de l'impression de professionnalisme.
        </GP>
        <GH3>Filmez plan par plan, leçon par leçon</GH3>
        <GP>
          N'essayez pas de tout enregistrer d'une traite. Filmez chaque leçon séparément, en suivant votre plan. Si vous vous trompez, ne coupez pas : marquez une pause de deux secondes, reprenez la phrase, et vous couperez l'erreur au montage. Cette technique du « reprendre la phrase » vous évite de tout recommencer et fait gagner un temps fou.
        </GP>
        <GH3>Deux formats efficaces</GH3>
        <GUl>
          <GLi><GStrong>Visage caméra</GStrong> — vous parlez face à l'objectif. Idéal pour l'introduction, la motivation, les explications de concepts.</GLi>
          <GLi><GStrong>Partage d'écran</GStrong> — vous enregistrez l'écran de votre téléphone ou ordinateur pour montrer une manipulation (logiciel, application, démarche pas à pas).</GLi>
        </GUl>
        <GCallout variant="tip" title="Parlez comme à un ami">
          Regardez l'objectif comme vous regarderiez un ami à qui vous expliquez quelque chose. Souriez, respirez, prenez votre temps. L'authenticité vend bien mieux qu'une diction parfaite mais froide. Vos élèves achètent votre humanité autant que votre savoir.
        </GCallout>
      </>
    ),
  },
  {
    id: "monter",
    label: "Monter avec des outils gratuits (CapCut, iMovie)",
    content: (
      <>
        <GP>
          Le montage fait peur, mais pour une formation, il reste <GStrong>simple</GStrong> : couper les silences et les erreurs, ajouter un titre, un peu de musique douce, et exporter. Pas besoin de logiciel payant ni d'ordinateur puissant. Tout se fait sur le téléphone, gratuitement.
        </GP>
        <GCards
          items={[
            { icon: "movie", title: "CapCut", text: "Gratuit, sur Android et iPhone. Coupe, sous‑titres automatiques, titres et transitions. L'outil favori des créateurs africains." },
            { icon: "video_settings", title: "iMovie", text: "Gratuit et déjà installé sur iPhone. Interface simple pour couper, enchaîner les plans et exporter en HD." },
            { icon: "closed_caption", title: "Sous‑titres", text: "CapCut génère des sous‑titres automatiques. Essentiels : beaucoup regardent sans le son, dans le bus ou au bureau." },
            { icon: "graphic_eq", title: "Musique légère", text: "Un fond musical discret et libre de droits (sans copyright) dans l'intro rend le rendu instantanément plus pro." },
          ]}
        />
        <GH3>La recette de montage minimale</GH3>
        <GUl>
          <GLi>Importez les rushes d'une leçon, coupez le début et la fin ratés.</GLi>
          <GLi>Supprimez les silences et les phrases reprises (là où vous aviez fait votre pause de deux secondes).</GLi>
          <GLi>Ajoutez un titre de leçon au début et, si possible, des sous‑titres.</GLi>
          <GLi>Placez un léger fond musical uniquement sur l'introduction, puis coupez‑le quand vous parlez.</GLi>
          <GLi>Exportez en 1080p et vérifiez le rendu final au casque avant de valider.</GLi>
        </GUl>
        <GCallout variant="info" title="Ne cherchez pas la perfection">
          Une formation vidéo « bien faite et disponible » vaut mille fois mieux qu'une formation « parfaite mais jamais terminée ». Coupez l'essentiel, exportez, publiez. Vous améliorerez la version 2 avec les retours de vos premiers acheteurs.
        </GCallout>
      </>
    ),
  },
  {
    id: "heberger",
    label: "Héberger et protéger vos vidéos",
    content: (
      <>
        <GP>
          Vos vidéos sont votre gagne‑pain. Les mettre en libre accès sur un lien YouTube « non répertorié » ou un simple Google Drive, c'est prendre le risque qu'elles soient <GStrong>téléchargées, partagées et revendues</GStrong> par n'importe qui. Le lien fuite dans un groupe WhatsApp, et votre formation payante circule gratuitement. Fini les ventes.
        </GP>
        <GH3>Le problème du piratage</GH3>
        <GP>
          En Afrique comme ailleurs, dès qu'une formation a de la valeur, quelqu'un tente de la copier. Un fichier téléchargeable est un fichier qui vous échappe. La vraie protection, c'est d'héberger vos vidéos dans un espace <GStrong>sécurisé</GStrong>, où l'accès est réservé aux personnes qui ont payé, où le téléchargement est bloqué, et où vous gardez le contrôle.
        </GP>
        <GH3>La solution : héberger et vendre au même endroit</GH3>
        <GP>
          Sur <GA href="/guides/novakou-fonctionnalites-completes">Novakou</GA>, vos vidéos sont hébergées de façon sécurisée et protégées contre le téléchargement et le partage non autorisés. Seuls vos acheteurs y accèdent, dans leur espace élève, après paiement. Vous ne jonglez plus entre un hébergeur, un système de paiement et un espace membre : tout est réuni, et vos contenus restent les vôtres. C'est un argument de vente en soi — vos élèves savent qu'ils reçoivent un vrai programme structuré, pas un lien fragile.
        </GP>
        <GCallout variant="tip" title="Un espace élève rassure aussi l'acheteur">
          Un acheteur qui reçoit un accès propre, avec ses modules bien rangés et sa progression suivie, se sent pris au sérieux. Cette expérience soignée réduit les demandes de remboursement et multiplie les bons avis.
        </GCallout>
      </>
    ),
  },
  {
    id: "prix",
    label: "Fixer le prix de votre formation en FCFA",
    content: (
      <>
        <GP>
          C'est la question qui bloque tout le monde. Trop cher, personne n'achète ; trop bas, vous dévalorisez votre travail et vous vous épuisez pour rien. La bonne nouvelle : en vidéo, vous pouvez viser plus haut qu'en PDF, parce que la valeur perçue est bien supérieure.
        </GP>
        <GH3>Ne vendez pas des heures, vendez un résultat</GH3>
        <GP>
          Le prix ne dépend pas du nombre de minutes de vidéo, mais du <GStrong>résultat</GStrong> que vous promettez. Une formation qui aide à décrocher un premier client, à lancer une boutique ou à maîtriser une compétence monnayable vaut bien plus qu'une longue vidéo « informative » sans débouché. Demandez‑vous : « Combien vaut, pour mon élève, le problème que je résous ? »
        </GP>
        <GH3>Des fourchettes réalistes</GH3>
        <GUl>
          <GLi><GStrong>Formation d'initiation courte</GStrong> — 5 000 à 15 000 FCFA. Parfaite pour une première offre et attirer un large public.</GLi>
          <GLi><GStrong>Formation complète</GStrong> — 20 000 à 50 000 FCFA. Un vrai programme structuré, plusieurs modules, avec résultat clair.</GLi>
          <GLi><GStrong>Formation premium ou accompagnement</GStrong> — 60 000 FCFA et plus, avec suivi, coaching ou communauté privée.</GLi>
        </GUl>
        <GP>
          N'hésitez pas à proposer plusieurs paliers : une version simple et une version « avec accompagnement ». Pour aller au fond du sujet et éviter les erreurs classiques, lisez notre guide dédié <GA href="/guides/fixer-prix-formation">fixer le prix de votre formation</GA>.
        </GP>
        <GCallout variant="success" title="Le prix de lancement">
          Ouvrez les ventes avec un tarif de lancement réduit pour vos premiers élèves, en échange de leur avis. Ces premiers témoignages valent bien plus que la remise consentie : ce sont eux qui vendront la formation au prix plein ensuite.
        </GCallout>
      </>
    ),
  },
  {
    id: "vendre",
    label: "Publier sur Novakou et vendre en Mobile Money",
    content: (
      <>
        <GP>
          Votre formation est prête. Il reste le plus important : l'<GStrong>encaisser</GStrong>. Et en Afrique, cela veut dire une chose : accepter le Mobile Money. Un acheteur à Dakar ou à Abidjan ne sort pas une carte Visa — il paie en Wave, Orange Money ou MTN. Si votre moyen de paiement n'est pas fluide, la vente n'a jamais lieu, quelle que soit la qualité de votre formation.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Vendeuse africaine encaissant une vente de formation en Mobile Money sur son smartphone"
          caption="Wave, Orange Money, MTN, Moov ou carte : l'acheteur paie en quelques secondes, vous suivez tout en temps réel."
        />
        <GH3>Tout se passe au même endroit</GH3>
        <GP>
          Sur Novakou, vous créez la page de votre formation, vous fixez le prix en FCFA, vous mettez vos vidéos en ligne, et vous activez les moyens de paiement en un clic : Wave, Orange Money, MTN Mobile Money, Moov Money et carte bancaire pour la diaspora. L'acheteur paie en quelques secondes avec son moyen préféré, et accède aussitôt à son espace élève. Vous, vous suivez vos ventes en temps réel.
        </GP>
        <GStats
          items={[
            { value: "4+", label: "moyens Mobile Money acceptés nativement, plus la carte" },
            { value: "Escrow", label: "paiement sécurisé qui rassure l'acheteur hésitant" },
            { value: "0 FCFA", label: "pour créer votre boutique : commission simple sur les ventes" },
          ]}
        />
        <GH3>Vendez plus à chaque acheteur</GH3>
        <GP>
          Ajoutez un <GStrong>order bump</GStrong> (une petite offre cochable juste avant le paiement — un guide bonus, un modèle) et un <GStrong>upsell</GStrong> en un clic après l'achat (un accompagnement, un module avancé). Un élève qui achète votre formation à 30 000 FCFA peut ajouter un coaching à 15 000 FCFA d'un simple geste. Pour aller plus loin, construisez un véritable <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente</GA> qui convertit vos visiteurs en clients de façon automatique.
        </GP>
        <GCallout variant="tip" title="Le lien qui vend sur WhatsApp">
          Novakou génère un lien de paiement à coller directement dans une conversation WhatsApp, un post Facebook ou une bio TikTok. En Afrique, l'essentiel des ventes se joue dans une discussion : ce lien transforme chaque échange en opportunité de vente.
        </GCallout>
      </>
    ),
  },
  {
    id: "promouvoir",
    label: "Promouvoir votre formation et faire vos premières ventes",
    content: (
      <>
        <GP>
          Une formation ne se vend pas toute seule : il faut la faire connaître. La bonne nouvelle, c'est que vous n'avez pas besoin d'un gros budget publicitaire pour démarrer. Vos premières ventes viendront de votre audience directe et du bouche‑à‑oreille.
        </GP>
        <GH3>Commencez par votre cercle</GH3>
        <GUl>
          <GLi><GStrong>WhatsApp</GStrong> — statut, groupes, messages privés à ceux qui vous ont déjà posé des questions sur le sujet.</GLi>
          <GLi><GStrong>Réseaux sociaux</GStrong> — publiez de courts extraits de vos leçons en TikTok, Reels et YouTube Shorts. Donnez de la valeur gratuitement, et renvoyez vers la formation complète.</GLi>
          <GLi><GStrong>Le contenu utile</GStrong> — répondez aux questions de votre communauté avec des mini‑vidéos. Chaque conseil gratuit prouve votre expertise et attire des acheteurs.</GLi>
        </GUl>
        <GH3>Puis passez à la vitesse supérieure</GH3>
        <GP>
          Une fois vos premières ventes réalisées, activez les leviers qui font grandir : posez vos <GStrong>pixels</GStrong> Facebook, TikTok et Google pour lancer des publicités rentables et suivies, et ouvrez un programme d'<GStrong>affiliation</GStrong> pour que d'autres vendent votre formation contre une commission. C'est le bouche‑à‑oreille récompensé : une armée de vendeurs motivés, sans avancer un centime de publicité.
        </GP>
        <GP>
          Enfin, choisir la bonne plateforme fait toute la différence entre un business qui décolle et un projet qui s'enlise. Comparez les options dans notre guide <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA> — vous verrez pourquoi Novakou reste le choix n°1 pour vendre une formation vidéo depuis l'Afrique francophone.
        </GP>
        <GCallout variant="info" title="La régularité gagne">
          Ne comptez pas sur un « lancement magique » unique. Les créateurs qui réussissent publient régulièrement, récoltent des avis, améliorent leur formation, et vendent un peu plus chaque semaine. La constance bat le coup d'éclat.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Peut‑on vraiment créer une formation vidéo professionnelle avec un simple smartphone ?",
    a: "Oui, absolument. Les smartphones récents filment en haute définition, largement suffisant pour une formation. La qualité perçue tient surtout au son et à la lumière, pas à la caméra : avec un micro‑cravate à quelques milliers de FCFA et la lumière d'une fenêtre, votre rendu est déjà professionnel.",
  },
  {
    q: "Quel matériel minimum faut‑il pour filmer ma formation ?",
    a: "Votre smartphone, un micro‑cravate filaire (3 000 à 8 000 FCFA), un trépied ou un support stable, et la lumière naturelle d'une fenêtre. Budget total : moins de 15 000 FCFA, puisque le téléphone et la lumière du jour, vous les avez déjà.",
  },
  {
    q: "Combien de temps doit durer une leçon vidéo ?",
    a: "Entre 5 et 15 minutes par leçon, avec une seule idée par leçon. Ce découpage en unités courtes retient l'attention, facilite la progression de l'élève et augmente le taux de complétion de votre formation, donc vos avis positifs.",
  },
  {
    q: "Avec quel outil monter mes vidéos sans payer ?",
    a: "CapCut (gratuit, sur Android et iPhone) est l'outil favori des créateurs africains : il coupe, ajoute des sous‑titres automatiques et des titres. Sur iPhone, iMovie est déjà installé et gratuit. Aucun logiciel payant ni ordinateur puissant n'est nécessaire.",
  },
  {
    q: "Comment protéger ma formation contre le piratage ?",
    a: "N'utilisez pas de lien téléchargeable ni de Drive partagé, trop faciles à copier et revendre. Hébergez vos vidéos dans un espace sécurisé comme Novakou, où l'accès est réservé aux acheteurs, le téléchargement bloqué, et vos contenus protégés contre le partage non autorisé.",
  },
  {
    q: "Comment encaisser mes ventes en Mobile Money ?",
    a: "Sur Novakou, vous activez en un clic Wave, Orange Money, MTN Mobile Money, Moov Money et la carte bancaire pour la diaspora. L'acheteur paie en quelques secondes avec son moyen préféré et accède aussitôt à sa formation, pendant que vous suivez vos ventes en temps réel.",
  },
];

export default function CreerFormationVideoSmartphone() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
