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
  slug: "creer-produit-numerique-afrique",
  title: "Créer son produit numérique en Afrique : le guide complet 2026",
  subtitle:
    "De l'idée à la première vente. Comment trouver un sujet rentable, créer votre formation, ebook ou template avec un simple smartphone, fixer votre prix en FCFA, publier sur Novakou et encaisser en Mobile Money — même en partant de zéro.",
  category: "Créer",
  level: "Débutant",
  levelColor: "#16a34a",
  gradient: "linear-gradient(135deg, #14532d, #16a34a 60%, #84cc16)",
  icon: "rocket_launch",
  time: "16 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "créer produit numérique Afrique",
    "créer produit digital Afrique",
    "comment créer un produit numérique",
    "vendre produit numérique débutant",
    "créer formation ebook Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Créer son produit numérique en Afrique : guide complet 2026 (débutant)";
const SEO_DESCRIPTION =
  "Le guide pas à pas pour créer et vendre votre premier produit numérique en Afrique : trouver l'idée, créer avec un smartphone, fixer le prix en FCFA, publier sur Novakou et encaisser en Mobile Money.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Créer son produit numérique en Afrique",
)}&subtitle=${encodeURIComponent("De l'idée à la première vente — le guide complet 2026")}`;

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
  src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Créateur africain concevant son premier produit numérique sur ordinateur portable",
  caption: "Votre savoir vaut de l'argent : transformez-le en un produit numérique vendable à toute l'Afrique.",
};

const stats = [
  { value: "0 FCFA", label: "de stock : un produit vendu à l'infini" },
  { value: "1 smartphone", label: "suffit pour créer votre premier produit" },
  { value: "Wave / OM / MTN", label: "encaissez en Mobile Money sur Novakou" },
  { value: "Afrique + diaspora", label: "un marché de plusieurs centaines de millions" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi",
    label: "Pourquoi créer un produit numérique en Afrique",
    content: (
      <>
        <GP>
          Un produit numérique, c'est un savoir, une compétence ou un outil que vous transformez en fichier vendable en ligne : une formation vidéo, un e‑book, un modèle Canva, un pack de presets, une séance de coaching. Vous le créez <GStrong>une seule fois</GStrong>, puis vous le vendez à autant de personnes que vous voulez, sans jamais retomber en rupture de stock.
        </GP>
        <GP>
          C'est précisément ce qui en fait l'activité la plus adaptée au contexte africain. Pas de local commercial à louer, pas de marchandise à stocker à Sandaga ou à Adjamé, pas de livreur à payer. Votre matière première, c'est ce que vous savez déjà faire mieux que les autres — et votre boutique tient dans votre téléphone.
        </GP>
        <GStats
          items={[
            { value: "1 fois", label: "créé, vendu un nombre illimité de fois" },
            { value: "≈ 90 %", label: "de marge : quasiment que du bénéfice net" },
            { value: "24 h/24", label: "votre boutique vend même quand vous dormez" },
          ]}
        />
        <GP>
          Le troisième avantage est décisif : votre marché n'est pas limité à votre quartier ni à votre ville. Un formateur à Dakar peut vendre à un client à Abidjan, à Douala, à Cotonou et à un membre de la diaspora à Paris ou Montréal — dans la même journée. Le local paie en <GStrong>Mobile Money</GStrong>, la diaspora paie par carte, et vous encaissez tout au même endroit.
        </GP>
        <GCallout variant="tip" title="Le meilleur moment, c'est maintenant">
          La connexion mobile, WhatsApp et le Mobile Money ont mis un moyen de paiement dans la poche de dizaines de millions d'Africains francophones. La demande de formations, de modèles et de contenus utiles n'a jamais été aussi forte. Ce guide vous emmène pas à pas, de l'idée jusqu'à votre première vente.
        </GCallout>
      </>
    ),
  },
  {
    id: "trouver-idee",
    label: "Trouver et valider votre idée",
    content: (
      <>
        <GH3>Partez de ce que vous savez déjà</GH3>
        <GP>
          La meilleure idée de produit n'est pas à inventer : elle est déjà en vous. Posez‑vous trois questions simples. Qu'est‑ce que les gens vous demandent souvent de leur expliquer ? Quel problème avez‑vous résolu pour vous‑même et qui bloque encore des milliers d'autres personnes ? Sur quel sujet pourriez‑vous parler pendant une heure sans notes ?
        </GP>
        <GP>
          Un coiffeur qui maîtrise les tresses modernes, une comptable qui sait remplir une déclaration fiscale, un développeur qui connaît WordPress, une maman qui gère un budget serré avec brio : chacun est assis sur un produit numérique. Votre <GStrong>expertise du quotidien</GStrong> est un trésor pour celui qui débute là où vous en êtes déjà.
        </GP>
        <GH3>Visez un problème précis et douloureux</GH3>
        <GP>
          Un bon sujet est étroit et concret. « Le marketing » est trop vague ; « Comment trouver ses 10 premiers clients sur WhatsApp quand on vend des habits » se vend. Plus la promesse est précise, plus l'acheteur se reconnaît et sort son téléphone pour payer. Pour creuser cette étape, lisez notre guide dédié : <GA href="/guides/trouver-son-idee-de-produit">trouver son idée de produit</GA>.
        </GP>
        <GH3>Validez avant de tout créer</GH3>
        <GP>
          Ne passez pas trois mois enfermé à produire un cours que personne n'attend. Testez d'abord. Parlez de votre idée dans un groupe WhatsApp, publiez un post sur Facebook, demandez à votre audience TikTok : « Est‑ce que ça vous intéresserait ? » Si dix personnes disent « oui, préviens‑moi quand c'est prêt », vous tenez quelque chose. Mieux : ouvrez les précommandes. Une seule vente réelle vaut cent « bonne idée ».
        </GP>
        <GCallout variant="info" title="La règle des 3 signaux">
          Votre idée est validée si : (1) des gens vous posent déjà la question, (2) ils cherchent activement une solution, et (3) au moins quelques‑uns sont prêts à payer pour l'obtenir plus vite. Deux signaux sur trois, et vous pouvez foncer.
        </GCallout>
      </>
    ),
  },
  {
    id: "types-produits",
    label: "Les grands types de produits numériques",
    content: (
      <>
        <GP>
          Une même expertise peut prendre plusieurs formes. Choisissez celle qui correspond à votre sujet, à vos moyens et à votre aisance. Voici les six formats qui marchent le mieux en Afrique francophone :
        </GP>
        <GCards
          items={[
            { icon: "play_circle", title: "Formation vidéo", text: "Le format roi. Vous filmez votre méthode en modules. Idéal pour tout ce qui se montre : couture, code, montage, comptabilité, beauté." },
            { icon: "menu_book", title: "E‑book / guide PDF", text: "Le plus simple pour débuter. Un guide clair et actionnable, écrit une fois, vendu à l'infini. Parfait pour les recettes, méthodes et checklists." },
            { icon: "dashboard_customize", title: "Template / modèle", text: "Modèles Canva, tableaux Notion, feuilles Excel, contrats types, CV. Vous vendez un gain de temps immédiat, prêt à l'emploi." },
            { icon: "person_raised_hand", title: "Coaching / séance", text: "Vous vendez votre temps et votre attention : séances individuelles, audits, accompagnement. Prix élevé, création quasi nulle." },
            { icon: "palette", title: "Presets / assets", text: "Presets Lightroom, LUT vidéo, polices, illustrations, sons. Les créateurs et photographes en raffolent pour gagner en style." },
            { icon: "inventory_2", title: "Pack / bundle", text: "Plusieurs produits réunis à prix groupé : formation + modèles + checklist. Le panier moyen grimpe, la valeur perçue explose." },
          ]}
        />
        <GP>
          Vous hésitez ? Commencez petit. Un <GStrong>e‑book</GStrong> ou un <GStrong>pack de modèles</GStrong> se crée en quelques jours et vous apprend tout le processus : créer, fixer un prix, publier, vendre. Vous pourrez toujours sortir votre grande formation vidéo ensuite, avec l'expérience et les premiers témoignages en poche.
        </GP>
      </>
    ),
  },
  {
    id: "creer-concretement",
    label: "Créer avec un smartphone et des outils gratuits",
    content: (
      <>
        <GP>
          Voici la vérité qui libère : vous n'avez besoin d'aucun matériel coûteux. Un smartphone récent, une bonne lumière naturelle et un endroit calme suffisent pour produire un cours que les gens paieront sans hésiter. Ce qui compte n'est pas la caméra à un million de FCFA, mais la <GStrong>clarté de ce que vous transmettez</GStrong>.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Créatrice africaine filmant sa formation avec un smartphone et une lumière naturelle"
          caption="Un smartphone, la lumière du jour et un plan clair : tout ce qu'il faut pour votre premier produit."
        />
        <GH3>La boîte à outils gratuite du débutant</GH3>
        <GUl>
          <GLi><GStrong>Écrire</GStrong> — Google Docs pour rédiger votre e‑book ou votre script, gratuitement, depuis le téléphone ou l'ordinateur.</GLi>
          <GLi><GStrong>Filmer</GStrong> — l'appareil photo natif de votre smartphone en mode paysage, ou l'enregistreur d'écran intégré pour un tutoriel sur ordinateur.</GLi>
          <GLi><GStrong>Monter</GStrong> — CapCut (gratuit, en français) pour couper, ajouter des titres et du son ; parfait pour un rendu propre sans compétence technique.</GLi>
          <GLi><GStrong>Habiller</GStrong> — Canva pour la couverture de l'e‑book, les visuels de votre boutique et les vignettes de vos modules.</GLi>
          <GLi><GStrong>Exporter</GStrong> — un PDF pour l'e‑book, des fichiers MP4 pour la vidéo. C'est ce que vous téléverserez ensuite sur Novakou.</GLi>
        </GUl>
        <GCallout variant="tip" title="Le son avant l'image">
          Les acheteurs pardonnent une image simple, jamais un son inaudible. Filmez dans une pièce sans écho, coupez le ventilateur, éloignez‑vous du bruit de la rue. Des écouteurs à micro à quelques milliers de FCFA améliorent déjà énormément le rendu.
        </GCallout>
      </>
    ),
  },
  {
    id: "structurer",
    label: "Structurer, filmer et finaliser votre produit",
    content: (
      <>
        <GP>
          Un produit qui se vend et qui rend fier n'est pas un long fichier confus : c'est un chemin clair du point A au point B. Suivez ces quatre étapes de production, dans l'ordre :
        </GP>
        <GCards
          items={[
            { icon: "account_tree", title: "1. Structurer", text: "Découpez votre sujet en 4 à 8 modules courts, chacun avec un objectif unique. Un plan clair, c'est 80 % du travail fait." },
            { icon: "videocam", title: "2. Filmer / rédiger", text: "Enregistrez un module à la fois, script sous les yeux. En version écrite, rédigez un chapitre par séance. Fait vaut mieux que parfait." },
            { icon: "content_cut", title: "3. Monter", text: "Coupez les blancs, ajoutez un titre par module, une intro de 10 secondes. Restez sobre : la valeur prime sur les effets." },
            { icon: "workspace_premium", title: "4. Emballer", text: "Une couverture soignée, un module « bonus », une checklist finale. Ces détails justifient le prix et déclenchent les avis 5 étoiles." },
          ]}
        />
        <GP>
          Une astuce d'expert : créez d'abord la <GStrong>version 1</GStrong>, imparfaite mais complète, et lancez‑la. Vos premiers acheteurs vous diront exactement quoi améliorer. Vous enrichirez ensuite le produit sans jamais perdre une vente à attendre la perfection. Pour un mode d'emploi détaillé de la mise en ligne, suivez notre guide <GA href="/guides/creer-son-produit">créer son premier produit</GA>.
        </GP>
        <GCallout variant="success" title="Fait vaut mieux que parfait">
          Le plus grand ennemi du créateur africain n'est pas le manque de talent, c'est l'attente du « moment parfait ». Un produit lancé et amélioré bat toujours un chef‑d'œuvre jamais terminé.
        </GCallout>
      </>
    ),
  },
  {
    id: "fixer-prix",
    label: "Fixer votre prix en FCFA (grilles)",
    content: (
      <>
        <GP>
          C'est l'étape qui bloque le plus de débutants. La peur classique : « c'est trop cher, personne ne va acheter. » En réalité, un prix trop bas envoie le signal « produit de faible valeur » et attire les clients les plus difficiles. Vous ne vendez pas des fichiers, vous vendez une <GStrong>transformation</GStrong> : le temps, l'argent et les erreurs que votre acheteur va s'épargner.
        </GP>
        <GH3>Grilles indicatives par type de produit</GH3>
        <GUl>
          <GLi><GStrong>E‑book / guide PDF</GStrong> — de 2 000 à 10 000 FCFA. Idéal comme premier produit et comme produit d'appel.</GLi>
          <GLi><GStrong>Pack de modèles / presets</GStrong> — de 5 000 à 25 000 FCFA selon le nombre et la qualité.</GLi>
          <GLi><GStrong>Formation vidéo</GStrong> — de 15 000 à 75 000 FCFA selon la profondeur et la promesse (un résultat concret justifie un prix élevé).</GLi>
          <GLi><GStrong>Coaching / accompagnement</GStrong> — de 25 000 à 150 000 FCFA et plus, car vous vendez votre temps et un résultat sur mesure.</GLi>
        </GUl>
        <GStats
          items={[
            { value: "×10", label: "un prix trop bas peut faire fuir vos meilleurs clients" },
            { value: "3 forfaits", label: "Basique, Standard, Premium : chacun choisit son niveau" },
            { value: "+30 %", label: "de panier moyen possible avec un order bump" },
          ]}
        />
        <GP>
          Proposez idéalement trois niveaux : une version essentielle abordable, une version complète (la plus vendue) et une version premium avec bonus ou accompagnement. La plupart des acheteurs choisissent le milieu — et vous encaissez plus qu'avec un prix unique. Pour poser un tarif solide et argumenté, lisez <GA href="/guides/fixer-prix-formation">fixer le prix de sa formation</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "publier-novakou",
    label: "Publier sur Novakou et encaisser en Mobile Money",
    content: (
      <>
        <GP>
          Votre produit est prêt : il faut maintenant une boutique qui encaisse vraiment en Afrique. C'est là que la plupart des créateurs se heurtent à un mur — les outils étrangers n'acceptent ni Wave, ni Orange Money, ni MTN. Novakou est pensée pour ça : <GStrong>la plateforme n°1 de vente de produits numériques en Afrique francophone</GStrong>.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Vendeur africain publiant son produit numérique et suivant ses ventes sur Novakou"
          caption="Créez votre boutique, téléversez votre produit, activez le Mobile Money : vous êtes prêt à vendre."
        />
        <GH3>Mettre son produit en ligne en quelques minutes</GH3>
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement, sans abonnement obligatoire ni carte bancaire.</GLi>
          <GLi><GStrong>Ajoutez votre produit</GStrong> : titre clair, description qui vend la transformation, visuel de couverture, prix en FCFA, et téléversement de vos fichiers.</GLi>
          <GLi><GStrong>Activez vos moyens de paiement</GStrong> : Wave, Orange Money, MTN et Moov Money, plus la carte pour la diaspora.</GLi>
          <GLi><GStrong>Récupérez votre lien de paiement</GStrong> et partagez‑le partout — la livraison du fichier à l'acheteur est automatique.</GLi>
        </GUl>
        <GCallout variant="success" title="Le paiement sécurisé rassure l'acheteur">
          Sur Novakou, les fonds sont sécurisés à l'achat puis libérés une fois la vente confirmée, et vos vidéos sont protégées contre le partage non autorisé. Cette confiance transforme un curieux hésitant en acheteur — un argument décisif dans un marché où beaucoup ont peur des arnaques.
        </GCallout>
        <GP>
          Vous voulez comparer avant de vous lancer ? Notre panorama <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre des produits digitaux en Afrique</GA> détaille pourquoi le Mobile Money natif et l'escrow font la différence.
        </GP>
      </>
    ),
  },
  {
    id: "promouvoir",
    label: "Promouvoir : WhatsApp, Facebook et TikTok",
    content: (
      <>
        <GP>
          Le meilleur produit du monde ne se vend pas s'il reste secret. La bonne nouvelle : en Afrique, vos trois canaux les plus puissants sont gratuits et déjà dans votre poche.
        </GP>
        <GH3>WhatsApp : votre meilleure arme de vente</GH3>
        <GP>
          C'est ici que se joue l'essentiel du commerce africain. Mettez votre lien Novakou dans votre statut, créez une liste de diffusion de prospects, répondez aux questions en message privé. Une conversation personnelle convertit dix fois mieux qu'une publicité anonyme. Un simple statut « Ma formation sort demain, prix de lancement pour les 20 premiers » peut déclencher vos premières ventes.
        </GP>
        <GH3>Facebook : les groupes et la preuve sociale</GH3>
        <GP>
          Identifiez les groupes où se trouve votre audience (entrepreneuriat, beauté, informatique, selon votre sujet), apportez de la valeur avant de vendre, puis partagez votre lien. Publiez les captures de vos premiers avis clients : la <GStrong>preuve sociale</GStrong> est le carburant de la confiance.
        </GP>
        <GH3>TikTok : la vitrine qui rend viral</GH3>
        <GP>
          Une vidéo courte qui donne un conseil concret tiré de votre produit peut toucher des milliers de personnes sans un franc de publicité. Montrez un extrait, un résultat, un « avant / après », puis renvoyez vers votre boutique. Un seul contenu qui perce peut remplir votre journée de ventes.
        </GP>
        <GCallout variant="tip" title="Un contenu, un appel à l'action">
          Terminez chaque publication par une consigne claire et unique : « Clique sur le lien en bio », « Écris‑moi PRIX en privé ». Sans appel à l'action, même un contenu vu par des milliers de personnes ne génère aucune vente.
        </GCallout>
      </>
    ),
  },
  {
    id: "premiere-vente",
    label: "Faire votre première vente",
    content: (
      <>
        <GP>
          La première vente est un cap psychologique plus que technique. Une fois qu'un inconnu vous a payé pour ce que vous avez créé, tout change : vous savez que ça marche, et vous n'avez plus qu'à répéter. Voici comment la provoquer vite.
        </GP>
        <GUl>
          <GLi><GStrong>Offre de lancement</GStrong> — un prix réduit pour les premiers acheteurs, en échange d'un avis honnête. Créez l'urgence : « les 20 premiers seulement ».</GLi>
          <GLi><GStrong>Parlez à vos proches d'abord</GStrong> — votre réseau immédiat (WhatsApp, famille, collègues) est le plus susceptible de vous faire confiance en premier.</GLi>
          <GLi><GStrong>Demandez un avis, puis affichez‑le</GStrong> — chaque témoignage rassure les suivants et fait boule de neige.</GLi>
          <GLi><GStrong>Relancez les intéressés</GStrong> — beaucoup veulent acheter mais oublient. Un simple rappel poli débloque énormément de ventes.</GLi>
          <GLi><GStrong>Facilitez le paiement</GStrong> — un lien direct vers le checkout Mobile Money supprime toute friction entre l'envie et l'achat.</GLi>
        </GUl>
        <GCallout variant="info" title="Après la première vente, tout s'accélère">
          Une fois la mécanique rodée, ajoutez progressivement les outils qui font grandir un business : tunnels de vente, order bump, séquences e‑mail et programme d'affiliation. Novakou réunit tout cela au même endroit, pour passer de la première vente à un revenu régulier.
        </GCallout>
      </>
    ),
  },
  {
    id: "passer-a-laction",
    label: "Passez à l'action dès aujourd'hui",
    content: (
      <>
        <GP>
          Récapitulons le chemin complet, de l'idée à l'argent sur votre compte. Vous êtes parti de votre expertise, vous avez validé un problème précis, choisi un format, créé une première version avec votre smartphone, fixé un prix juste en FCFA, publié sur une boutique qui encaisse en Mobile Money, et fait connaître votre produit sur WhatsApp, Facebook et TikTok. Rien d'insurmontable — juste une suite d'étapes simples franchies dans l'ordre.
        </GP>
        <GP>
          Le seul vrai risque, c'est de refermer cette page et de ne rien faire. Le savoir sans action ne remplit pas un portefeuille. Choisissez <GStrong>une seule idée</GStrong> aujourd'hui, ouvrez votre document, écrivez le plan des modules, et donnez‑vous une date de lancement. Vous corrigerez en route ; personne ne réussit du premier coup, mais tout le monde progresse en avançant.
        </GP>
        <GP>
          Des milliers de créateurs africains — au Sénégal, en Côte d'Ivoire, au Cameroun, au Bénin et dans la diaspora — vivent aujourd'hui de leurs produits numériques. Ils n'avaient ni plus de talent ni plus de moyens que vous. Ils ont simplement commencé. À votre tour : créez votre boutique gratuitement et lancez votre premier produit dès cette semaine.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Faut‑il du matériel coûteux pour créer un produit numérique ?",
    a: "Non. Un smartphone récent, une bonne lumière naturelle et un endroit calme suffisent pour filmer une formation ou enregistrer un tutoriel. Pour un e‑book ou un pack de modèles, un simple téléphone ou ordinateur avec des outils gratuits (Google Docs, Canva, CapCut) suffit largement. La clarté de ce que vous transmettez compte bien plus que le matériel.",
  },
  {
    q: "Je débute totalement, quel produit créer en premier ?",
    a: "Commencez par un e‑book / guide PDF ou un pack de modèles : ils se créent en quelques jours et vous font apprendre tout le processus (créer, fixer le prix, publier, vendre). Vous pourrez lancer votre grande formation vidéo ensuite, fort de vos premiers témoignages clients.",
  },
  {
    q: "Comment savoir si mon idée va se vendre ?",
    a: "Validez avant de tout créer. Parlez de votre idée dans un groupe WhatsApp, publiez un post, ouvrez les précommandes. Si des gens vous posent déjà la question, cherchent une solution et sont prêts à payer pour aller plus vite, votre idée est validée. Une seule vente réelle vaut cent avis « bonne idée ».",
  },
  {
    q: "À quel prix vendre mon produit numérique en FCFA ?",
    a: "En repère : e‑book de 2 000 à 10 000 FCFA, pack de modèles de 5 000 à 25 000 FCFA, formation vidéo de 15 000 à 75 000 FCFA, coaching à partir de 25 000 FCFA. Vous vendez une transformation, pas un fichier : un prix trop bas fait fuir vos meilleurs clients. Proposez idéalement trois forfaits.",
  },
  {
    q: "Comment encaisser en Mobile Money quand je vends mon produit ?",
    a: "En publiant sur Novakou. La plateforme accepte nativement Wave, Orange Money, MTN et Moov Money, plus la carte bancaire pour la diaspora. Vous activez vos moyens de paiement en un clic, partagez votre lien, et la livraison du fichier à l'acheteur est automatique.",
  },
  {
    q: "Combien de temps pour créer et lancer mon premier produit ?",
    a: "Quelques jours à deux semaines pour un premier produit simple : un à deux jours pour structurer, quelques jours pour créer, et l'après‑midi pour publier sur Novakou. La clé est de lancer une version 1 imparfaite mais complète, puis de l'améliorer grâce aux retours de vos premiers acheteurs.",
  },
];

export default function CreerProduitNumeriqueAfrique() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
