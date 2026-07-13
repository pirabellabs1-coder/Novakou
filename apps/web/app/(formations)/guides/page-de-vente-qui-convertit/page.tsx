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
  slug: "page-de-vente-qui-convertit",
  title: "Créer une page de vente qui convertit (structure, copywriting, exemples)",
  subtitle:
    "L'anatomie complète d'une page de vente qui transforme un visiteur en acheteur : accroche, agitation du problème, bénéfices, preuve sociale, offre, garantie et appel à l'action. Structures AIDA et PAS, erreurs à éviter, et construction pas à pas dans le tunnel de vente Novakou avec paiement Mobile Money.",
  category: "Vendre",
  level: "Intermédiaire",
  levelColor: "#b45309",
  gradient: "linear-gradient(135deg, #451a03, #b45309 60%, #f59e0b)",
  icon: "ads_click",
  time: "16 min",
  chapters: "10 sections",
  publishedAt: "2026-07-13",
  updatedAt: "2026-07-13",
  keywords: [
    "page de vente qui convertit",
    "copywriting page de vente Afrique",
    "structure page de vente produit digital",
    "argumentaire de vente en ligne",
    "landing page formation Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Page de vente qui convertit : structure, copywriting et exemples";
const SEO_DESCRIPTION =
  "Le guide complet pour créer une page de vente qui convertit en Afrique : anatomie, copywriting, structures AIDA et PAS, erreurs à éviter, et construction dans le tunnel Novakou avec Mobile Money.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Créer une page de vente qui convertit",
)}&subtitle=${encodeURIComponent(
  "Structure, copywriting et exemples pour vendre en Afrique",
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
  src: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Créateur africain rédigeant la page de vente de sa formation en ligne",
  caption: "Une page de vente bien construite travaille pour vous 24 h/24 : elle vend même quand vous dormez.",
};

const stats = [
  { value: "1 mot", label: "l'accroche décide en moins de 5 secondes" },
  { value: "×2 à ×5", label: "l'écart de conversion entre une bonne et une mauvaise page" },
  { value: "1 objectif", label: "une page = une offre = un seul bouton d'achat" },
  { value: "Mobile Money", label: "checkout intégré, paiement en quelques secondes" },
];

const sections: GuideSection[] = [
  {
    id: "a-quoi-sert",
    label: "À quoi sert une page de vente et pourquoi elle change tout",
    content: (
      <>
        <GP>
          Une page de vente, c'est votre meilleur vendeur — celui qui ne dort jamais, ne tombe jamais malade, et répète le même argumentaire parfait à chaque visiteur, qu'il en arrive un ou mille. Là où un post WhatsApp se contente de dire « voici ma formation, 15 000 FCFA », une vraie page de vente prend le prospect par la main, comprend son problème, lui montre la solution, lève ses doutes un par un et le conduit naturellement jusqu'au bouton de paiement.
        </GP>
        <GP>
          C'est la différence entre <GStrong>montrer un produit</GStrong> et <GStrong>vendre une transformation</GStrong>. En Afrique francophone, où la majorité des ventes de produits numériques se jouent sur mobile et via des conversations, une page claire et convaincante est souvent le seul élément qui sépare un curieux d'un client. Le même trafic, la même publicité, le même produit : avec une page faible, vous convertissez 1 visiteur sur 100 ; avec une page qui convertit, vous en convertissez 3, 5, parfois 8. Vous n'avez pas dépensé un franc de plus en publicité — vous avez simplement mieux vendu.
        </GP>
        <GStats
          items={[
            { value: "24 h/24", label: "votre page vend même la nuit et le week-end" },
            { value: "×3", label: "de ventes possibles à trafic égal, avec une meilleure page" },
            { value: "0 friction", label: "du bouton d'achat au paiement Mobile Money" },
          ]}
        />
        <GCallout variant="info" title="Une page, un objectif">
          Une page de vente n'est pas une page « à propos » ni un catalogue. Elle a un seul rôle : vendre un produit précis à une personne précise. Chaque phrase, chaque image, chaque bouton doit pousser vers cet unique objectif. Tout le reste distrait — et distraire, c'est perdre la vente.
        </GCallout>
      </>
    ),
  },
  {
    id: "anatomie",
    label: "L'anatomie d'une page qui convertit",
    content: (
      <>
        <GP>
          Une page de vente performante n'est pas un texte improvisé : c'est un enchaînement de blocs, chacun avec une mission. Pris ensemble, ils forment un chemin psychologique qui mène du « je regarde » au « j'achète ». Voici l'ossature complète, dans l'ordre où elle se déroule à l'écran.
        </GP>
        <GCards
          items={[
            { icon: "bolt", title: "1. Accroche + promesse", text: "Le premier écran. Une grande phrase qui capte l'attention et promet un résultat concret." },
            { icon: "sentiment_dissatisfied", title: "2. Agitation du problème", text: "Nommez la douleur du prospect avec ses propres mots pour qu'il se sente compris." },
            { icon: "lightbulb", title: "3. Présentation de la solution", text: "Votre produit apparaît comme la réponse évidente au problème que vous venez de nommer." },
            { icon: "star", title: "4. Bénéfices, pas caractéristiques", text: "Ce que le client GAGNE (temps, argent, confiance), pas ce que le produit contient." },
            { icon: "reviews", title: "5. Preuve sociale", text: "Témoignages, avis, captures de résultats : la preuve que d'autres ont réussi." },
            { icon: "sell", title: "6. Offre + prix", text: "Détaillez ce qui est inclus, ancrez la valeur, puis annoncez le prix comme une évidence." },
            { icon: "verified_user", title: "7. Garantie", text: "Levez le risque : satisfait ou remboursé, accès à vie, support inclus." },
            { icon: "help", title: "8. FAQ", text: "Répondez aux dernières objections avant qu'elles ne bloquent l'achat." },
            { icon: "shopping_cart", title: "9. Appel à l'action", text: "Un bouton clair, répété, qui dit exactement quoi faire : « Je m'inscris maintenant »." },
            { icon: "schedule", title: "10. Urgence / rareté honnête", text: "Une vraie raison d'agir aujourd'hui : places limitées, bonus qui expire, prix de lancement." },
          ]}
        />
        <GP>
          Ces dix blocs ne sont pas facultatifs. Une page qui saute la preuve sociale laisse le doute s'installer ; une page sans garantie fait porter tout le risque à l'acheteur ; une page sans urgence laisse le prospect remettre à « plus tard » — et « plus tard » veut presque toujours dire « jamais ». La force d'une bonne page vient de l'<GStrong>enchaînement</GStrong>, pas d'un bloc isolé.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Structure d'une page de vente affichée sur écran, du premier écran au bouton d'achat"
          caption="Chaque bloc a une mission : capter, convaincre, rassurer, faire agir. L'ordre compte autant que le contenu."
        />
      </>
    ),
  },
  {
    id: "accroche",
    label: "L'accroche et la promesse : le premier écran décide de tout",
    content: (
      <>
        <GP>
          Vous avez moins de cinq secondes. Sur mobile, un visiteur qui arrive sur votre page décide presque instantanément s'il reste ou s'il repart. Ce premier écran — l'accroche — est donc le bloc le plus important de toute la page. S'il rate, tout le reste ne sera jamais lu.
        </GP>
        <GH3>Une accroche promet un résultat, pas un contenu</GH3>
        <GP>
          Comparez ces deux titres pour une même formation. Le premier : « Formation complète en marketing digital ». Le second : « Trouvez vos 10 premiers clients en 30 jours, même sans budget publicité ». Le premier décrit un contenu ; le second promet une <GStrong>transformation datée et mesurable</GStrong>. C'est le second qui vend. Une bonne accroche répond à la question silencieuse du prospect : « Qu'est-ce que ça change concrètement pour moi ? »
        </GP>
        <GH3>La formule d'une accroche qui accroche</GH3>
        <GUl>
          <GLi><GStrong>Un résultat désirable</GStrong> — ce que le client veut vraiment obtenir (des clients, des revenus, du temps libre, une compétence).</GLi>
          <GLi><GStrong>Un délai ou une facilité</GStrong> — « en 30 jours », « en une semaine », « sans compétence technique ».</GLi>
          <GLi><GStrong>Une levée d'objection</GStrong> — « même si vous débutez », « même sans budget », « même avec un petit téléphone ».</GLi>
        </GUl>
        <GP>
          Sous l'accroche, une phrase de soutien (le sous-titre) précise pour qui c'est et comment vous tenez cette promesse. Puis, dès le premier écran, un premier bouton d'achat : certains visiteurs sont déjà convaincus, ne les faites pas défiler pour rien. Pour aller plus loin sur le texte de vos fiches, lisez notre guide sur la <GA href="/guides/description-produit">description de produit qui donne envie d'acheter</GA>.
        </GP>
        <GCallout variant="tip" title="Testez votre accroche à voix haute">
          Lisez votre accroche à un proche qui ne connaît pas votre produit. S'il ne comprend pas en une phrase ce qu'il va obtenir et pour qui c'est, réécrivez-la. Une accroche floue ne se rattrape jamais plus bas dans la page.
        </GCallout>
      </>
    ),
  },
  {
    id: "probleme-solution",
    label: "Agiter le problème, puis présenter la solution",
    content: (
      <>
        <GP>
          Personne n'achète une solution à un problème qu'il ne ressent pas. Avant de présenter votre produit, vous devez d'abord réveiller la douleur — non pas pour manipuler, mais pour montrer au prospect que vous le comprenez mieux que personne.
        </GP>
        <GH3>Agiter le problème avec les mots du client</GH3>
        <GP>
          Décrivez la situation actuelle du prospect avec une précision qui le fait sursauter : « Vous publiez chaque jour sur WhatsApp et Instagram, vous répondez à des dizaines de messages, mais à la fin du mois vous n'avez vendu que deux ou trois fois. Vous commencez à vous demander si vendre en ligne fonctionne vraiment pour vous. » Quand le prospect se reconnaît à ce point, il pense : « Cette personne sait exactement ce que je vis. » Et qui comprend votre problème est perçu comme celui qui a la solution.
        </GP>
        <GH3>Présenter la solution comme une évidence</GH3>
        <GP>
          Une fois la douleur nommée, votre produit entre en scène — non pas comme « une formation de plus », mais comme le pont exact entre la situation actuelle (frustration) et la situation désirée (résultat). « C'est précisément pour sortir de cette impasse que j'ai créé cette méthode. » La transition doit être fluide : le problème appelle la solution, la solution répond au problème. C'est le cœur de la structure PAS, que nous détaillons plus bas.
        </GP>
        <GCallout variant="warning" title="Ne restez pas dans la douleur">
          Agiter le problème, oui — mais brièvement. Le but n'est pas de déprimer le prospect, c'est de le faire se sentir compris avant de lui offrir l'espoir. Passez vite de « voici ce qui ne va pas » à « voici comment ça change ». Trop de négatif tue l'envie d'agir.
        </GCallout>
      </>
    ),
  },
  {
    id: "benefices",
    label: "Bénéfices vs caractéristiques, et preuve sociale",
    content: (
      <>
        <GP>
          C'est l'erreur la plus courante, et la plus coûteuse : vendre ce que le produit <GStrong>contient</GStrong> au lieu de ce qu'il <GStrong>apporte</GStrong>. « 5 modules, 12 vidéos, 40 pages de PDF » sont des caractéristiques. Le client ne s'en soucie pas. Ce qu'il veut, c'est le résultat que ces modules produisent dans sa vie.
        </GP>
        <GH3>Traduire chaque caractéristique en bénéfice</GH3>
        <GUl>
          <GLi><GStrong>Caractéristique :</GStrong> « Module 3 : les tunnels de vente. » → <GStrong>Bénéfice :</GStrong> « Vous mettez en place un système qui vend à votre place, même quand vous dormez. »</GLi>
          <GLi><GStrong>Caractéristique :</GStrong> « Modèles Canva inclus. » → <GStrong>Bénéfice :</GStrong> « Vous lancez une publicité pro en 10 minutes, sans savoir dessiner. »</GLi>
          <GLi><GStrong>Caractéristique :</GStrong> « Accès à un groupe WhatsApp privé. » → <GStrong>Bénéfice :</GStrong> « Vous n'êtes plus seul : posez une question, obtenez une réponse le jour même. »</GLi>
        </GUl>
        <GP>
          La règle d'or : après chaque caractéristique, ajoutez mentalement « … ce qui veut dire que vous… » et écrivez ce qui suit. C'est ça, le bénéfice. Le prospect achète un futur meilleur, pas une liste de fichiers.
        </GP>
        <GH3>La preuve sociale : la confiance qui déclenche l'achat</GH3>
        <GP>
          En Afrique francophone, la méfiance en ligne est réelle : beaucoup d'acheteurs ont déjà été déçus par un vendeur qui a disparu après le paiement. La preuve sociale est donc votre levier le plus puissant. Un témoignage de Fatou à Dakar qui a doublé ses ventes, une capture de résultat de Kwame à Abidjan, une note de 4,8 étoiles sur 120 avis : ces éléments disent au prospect « d'autres comme toi ont essayé, et ça a marché ». Ajoutez des visages, des prénoms, des villes, des chiffres réels. Un témoignage précis et vérifiable vaut dix promesses que vous faites vous-même.
        </GP>
        <GCallout variant="success" title="Récoltez la preuve dès votre première vente">
          Chaque client satisfait est un futur témoignage. Demandez systématiquement un retour après l'achat — une phrase, une capture, une note. Sur Novakou, les avis vérifiés de vrais acheteurs s'affichent sur votre page et rassurent les suivants automatiquement.
        </GCallout>
      </>
    ),
  },
  {
    id: "offre-prix",
    label: "Présenter l'offre, le prix, la garantie et l'urgence",
    content: (
      <>
        <GP>
          Une fois le prospect convaincu de la valeur, il reste trois obstacles : le prix lui paraît-il justifié ? Que risque-t-il si ça ne marche pas ? Pourquoi agir maintenant plutôt que plus tard ? Ces trois blocs — offre, garantie, urgence — lèvent les derniers freins.
        </GP>
        <GH3>Ancrer la valeur avant d'annoncer le prix</GH3>
        <GP>
          Ne jetez jamais le prix seul. Empilez d'abord la valeur : « La formation (valeur 25 000 FCFA) + les 15 modèles Canva (10 000 FCFA) + le groupe privé (accès à vie) + 3 séances de questions-réponses en direct. » Le prospect additionne mentalement. Puis vous annoncez : « Le tout, aujourd'hui, pour 15 000 FCFA. » Le prix paraît alors petit face à ce qu'il reçoit. C'est l'<GStrong>effet d'ancrage</GStrong> : la valeur perçue doit toujours dépasser largement le prix demandé. Pour choisir le bon montant, lisez notre guide sur <GA href="/guides/fixer-prix-formation">comment fixer le prix de sa formation</GA>.
        </GP>
        <GH3>La garantie : transférez le risque sur vous</GH3>
        <GP>
          « Satisfait ou remboursé sous 14 jours. » Quatre mots qui font sauter le principal frein à l'achat. Le prospect se dit : « Si ça ne me convient pas, je récupère mon argent — je ne risque rien. » Une garantie claire augmente les ventes bien plus qu'elle ne génère de remboursements, car elle inverse la charge du risque : ce n'est plus au client de faire confiance à l'aveugle, c'est à vous d'assumer la promesse.
        </GP>
        <GP>
          Sur Novakou, le <GStrong>paiement séquestré (escrow)</GStrong> renforce cette confiance : les fonds sont sécurisés au moment de l'achat et libérés une fois la vente confirmée. L'acheteur ose franchir le pas parce qu'il sait qu'il est protégé — un argument de réassurance que vous pouvez afficher directement sur votre page.
        </GP>
        <GH3>L'urgence et la rareté, mais honnêtes</GH3>
        <GP>
          « Prix de lancement valable jusqu'à dimanche », « 20 places seulement pour garder un suivi de qualité », « bonus offert aux 30 premiers ». Une vraie raison d'agir aujourd'hui multiplie les ventes, car elle combat le « je verrai plus tard ». Mais l'urgence doit être <GStrong>vraie</GStrong> : un faux compte à rebours qui se réinitialise à chaque visite détruit votre crédibilité le jour où le prospect s'en aperçoit — et il s'en aperçoit toujours.
        </GP>
        <GCallout variant="warning" title="L'urgence factice se paie cher">
          « Il ne reste que 2 places ! » affiché en permanence pendant six mois est un mensonge, et votre audience n'est pas dupe. En Afrique, où la réputation circule vite sur WhatsApp, une seule fausse promesse peut brûler votre marque. Créez une vraie rareté — un vrai bonus qui expire, une vraie cohorte limitée — et respectez-la.
        </GCallout>
      </>
    ),
  },
  {
    id: "copywriting",
    label: "Le copywriting qui vend : parler à une seule personne",
    content: (
      <>
        <GP>
          Le copywriting, c'est l'art d'écrire pour vendre. Ce n'est ni de la belle littérature, ni du jargon marketing : c'est une conversation calibrée pour faire agir. Trois principes suffisent à transformer un texte plat en argumentaire qui convertit.
        </GP>
        <GH3>Parlez à UNE personne, pas à une foule</GH3>
        <GP>
          « Chers clients, notre formation permet à ceux qui le souhaitent de… » — froid, distant, mort. Écrivez plutôt comme si vous parliez à une seule personne, en face de vous : « Tu publies tous les jours mais tu ne vends presque pas. Je vais te montrer pourquoi — et comment y remédier. » Utilisez « vous » ou « tu » (selon votre marque), au singulier. Chaque lecteur doit avoir l'impression que vous vous adressez à lui personnellement. C'est ce tête-à-tête qui crée la connexion, et la connexion qui crée la vente.
        </GP>
        <GH3>Vendez la transformation, pas le produit</GH3>
        <GP>
          Les gens n'achètent pas une perceuse, ils achètent un trou dans le mur. Ils n'achètent pas votre formation, ils achètent la personne qu'ils vont devenir grâce à elle : quelqu'un qui vit de son activité en ligne, qui n'a plus peur de la fin du mois, qui est fier de montrer ses résultats à sa famille. Peignez cette image du « après ». Plus le prospect se voit dans ce futur, plus le prix devient secondaire.
        </GP>
        <GH3>Levez les objections avant qu'elles ne bloquent</GH3>
        <GP>
          Chaque prospect a des « oui, mais » : « je n'ai pas le temps », « c'est trop cher », « ça ne marchera pas pour moi », « je ne suis pas doué en technique ». Répondez-y explicitement dans le texte : « Tu penses ne pas avoir le temps ? La méthode tient en 20 minutes par jour. » Une objection nommée et désamorcée ne bloque plus l'achat. La FAQ, en bas de page, est l'endroit idéal pour traiter les dernières.
        </GP>
        <GCallout variant="tip" title="Écrivez comme vous parlez">
          Le meilleur copywriting sonne comme un message vocal à un ami. Phrases courtes. Mots simples. Zéro jargon. Si une phrase ne passerait pas dans un vocal WhatsApp, réécrivez-la. Votre page doit se lire sans effort, sur un petit écran, dans un taxi.
        </GCallout>
      </>
    ),
  },
  {
    id: "aida-pas",
    label: "Les structures qui marchent : AIDA et PAS",
    content: (
      <>
        <GP>
          Vous n'avez pas à réinventer la roue. Deux structures éprouvées depuis des décennies guident presque toutes les grandes pages de vente. Choisissez celle qui colle à votre produit, et déroulez-la.
        </GP>
        <GH3>AIDA : Attention, Intérêt, Désir, Action</GH3>
        <GUl>
          <GLi><GStrong>Attention</GStrong> — l'accroche capte le regard dès le premier écran.</GLi>
          <GLi><GStrong>Intérêt</GStrong> — vous éveillez la curiosité en montrant que vous comprenez le problème.</GLi>
          <GLi><GStrong>Désir</GStrong> — bénéfices, preuve sociale et transformation font naître l'envie.</GLi>
          <GLi><GStrong>Action</GStrong> — l'offre, la garantie et le bouton déclenchent l'achat.</GLi>
        </GUl>
        <GH3>PAS : Problème, Agitation, Solution</GH3>
        <GUl>
          <GLi><GStrong>Problème</GStrong> — vous nommez la douleur précise du prospect.</GLi>
          <GLi><GStrong>Agitation</GStrong> — vous montrez ce que ça coûte de ne rien changer (temps perdu, argent laissé sur la table, frustration qui dure).</GLi>
          <GLi><GStrong>Solution</GStrong> — votre produit apparaît comme la sortie évidente.</GLi>
        </GUl>
        <GP>
          PAS est particulièrement efficace pour un public qui ressent une douleur forte mais ne connaît pas encore la solution — le cas de la plupart des acheteurs de formations et d'ebooks. AIDA convient mieux quand le désir est déjà présent et qu'il faut le canaliser. Rien ne vous empêche de les combiner : une accroche AIDA, puis un corps de page en PAS. Une fois votre page structurée, il ne reste qu'à l'insérer dans un <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente Novakou</GA> pour la connecter au paiement et aux relances.
        </GP>
        <GCallout variant="info" title="La structure d'abord, le style ensuite">
          Beaucoup de créateurs se bloquent à chercher « la belle phrase ». Posez d'abord l'ossature — accroche, problème, solution, bénéfices, preuve, offre, garantie, CTA — puis remplissez chaque bloc. Une page bien structurée mais simplement écrite vend toujours mieux qu'un beau texte sans direction.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs",
    label: "Les erreurs qui tuent la conversion",
    content: (
      <>
        <GP>
          Une page peut cocher toutes les cases et pourtant ne rien vendre, à cause d'une poignée d'erreurs classiques. Les repérer sur votre propre page, c'est souvent gagner des ventes du jour au lendemain.
        </GP>
        <GCards
          items={[
            { icon: "list", title: "Parler du produit, pas du client", text: "Une page qui dit « je », « ma formation », « mon expérience » au lieu de « tu », « ton résultat », « ton problème »." },
            { icon: "call_split", title: "Trop de boutons différents", text: "Un lien vers Facebook, un vers votre blog, un menu de navigation : chaque sortie est une vente perdue. Une page = un seul objectif." },
            { icon: "psychology_alt", title: "Aucune preuve sociale", text: "Sans témoignage ni avis, le prospect doute et repart « réfléchir ». Réfléchir = ne jamais acheter." },
            { icon: "price_check", title: "Prix sans valeur ancrée", text: "Annoncer 15 000 FCFA sans avoir d'abord empilé la valeur : le prix paraît alors élevé au lieu de dérisoire." },
            { icon: "block", title: "Aucune raison d'agir maintenant", text: "Sans urgence honnête ni garantie, le prospect remet à plus tard — et ne revient jamais." },
            { icon: "phonelink_off", title: "Page illisible sur mobile", text: "Textes minuscules, images lourdes, bouton introuvable : en Afrique, 9 acheteurs sur 10 sont sur téléphone." },
          ]}
        />
        <GP>
          Ajoutez à cela les erreurs qui minent la crédibilité : les fautes d'orthographe (relisez, toujours), un checkout compliqué qui demande dix informations, ou l'absence de Mobile Money — car un prospect prêt à payer qui ne trouve pas Wave ou Orange Money à l'étape du paiement abandonne, tout simplement. La conversion se joue jusqu'au dernier clic.
        </GP>
        <GCallout variant="warning" title="Le test du pouce">
          Ouvrez votre page sur votre propre téléphone et faites-la défiler avec un seul pouce, comme un client. Le texte est-il lisible ? Le bouton est-il évident ? Le paiement est-il fluide ? Si vous hésitez une seule fois, votre prospect, lui, est déjà parti.
        </GCallout>
      </>
    ),
  },
  {
    id: "construire-novakou",
    label: "Construire sa page dans le tunnel Novakou : exemple concret",
    content: (
      <>
        <GP>
          La théorie ne vend rien tant qu'elle n'est pas en ligne. Sur Novakou, vous n'avez besoin ni de site web, ni de développeur, ni de compétence technique : le tunnel de vente inclut un éditeur visuel par glisser-déposer et des modèles de pages de vente prêts à remplir. Déroulons un exemple complet.
        </GP>
        <GH3>Le cas : une formation à 15 000 FCFA</GH3>
        <GP>
          Awa, à Dakar, vend une formation vidéo « Trouve tes 10 premiers clients en 30 jours » à 15 000 FCFA. Voici comment elle construit sa page dans Novakou, bloc par bloc :
        </GP>
        <GUl>
          <GLi><GStrong>Accroche</GStrong> — « Trouve tes 10 premiers clients en 30 jours, même sans budget publicité. » Un bouton « Je m'inscris — 15 000 FCFA » dès le premier écran.</GLi>
          <GLi><GStrong>Problème + agitation</GStrong> — « Tu publies tous les jours, tu réponds à tous les messages, mais tu vends à peine. Chaque mois qui passe sans méthode, ce sont des clients qui achètent chez quelqu'un d'autre. »</GLi>
          <GLi><GStrong>Solution</GStrong> — la présentation de la formation comme le système exact qui manque.</GLi>
          <GLi><GStrong>Bénéfices</GStrong> — « Tu sauras exactement quoi publier, à qui parler, et comment transformer une conversation WhatsApp en vente. »</GLi>
          <GLi><GStrong>Preuve sociale</GStrong> — trois témoignages d'anciennes élèves avec prénom, ville et résultat, plus les avis vérifiés Novakou.</GLi>
          <GLi><GStrong>Offre + prix ancré</GStrong> — « La formation (25 000 FCFA) + les modèles de messages (5 000) + le groupe privé. Aujourd'hui : 15 000 FCFA. »</GLi>
          <GLi><GStrong>Garantie</GStrong> — « Satisfaite ou remboursée sous 14 jours », renforcée par le paiement séquestré Novakou.</GLi>
          <GLi><GStrong>FAQ + urgence</GStrong> — réponses aux objections, et « Prix de lancement valable jusqu'à dimanche ».</GLi>
        </GUl>
        <GH3>Brancher le paiement Mobile Money en un clic</GH3>
        <GP>
          À la fin de la page, le bouton d'achat mène directement au checkout Novakou. Awa n'a rien à configurer côté technique : Wave, Orange Money, MTN, Moov et la carte bancaire s'affichent automatiquement. Le client sénégalais paie en Wave en quelques secondes ; la cousine de la diaspora à Paris paie par carte, en euros, grâce à la conversion automatique. La vente déclenche l'accès au produit, crédite le portefeuille d'Awa, et peut lancer une <GA href="/guides/email-marketing-5-emails-vendent">séquence e-mail</GA> de bienvenue — tout cela sans intervention de sa part.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Paiement Mobile Money finalisé sur mobile après une page de vente Novakou"
          caption="Du bouton d'achat au paiement Wave ou Orange Money : un checkout fluide qui ne perd aucune vente."
        />
        <GP>
          C'est là toute la force d'une plateforme pensée pour l'Afrique : votre page de vente et votre paiement vivent au même endroit, sans coupure. Pour comparer les options disponibles, consultez notre guide des <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre des produits digitaux en Afrique</GA>. Puis créez votre première page et regardez-la convertir.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Quelle est la longueur idéale d'une page de vente ?",
    a: "Il n'y a pas de règle fixe : la page doit être assez longue pour convaincre, pas plus. Un produit peu cher (2 500 FCFA) se vend souvent sur une page courte ; une formation à 15 000 FCFA ou plus mérite une page complète avec tous les blocs (problème, bénéfices, preuve, offre, garantie, FAQ). La vraie règle : chaque phrase doit faire avancer vers l'achat, sinon supprimez-la.",
  },
  {
    q: "Faut-il mettre le prix en haut ou en bas de la page ?",
    a: "Annoncez le prix après avoir démontré la valeur, jamais avant. Empilez d'abord tout ce que le client reçoit, puis révélez un prix qui paraît petit face à cette valeur. Vous pouvez placer un bouton d'achat dès le premier écran pour les prospects déjà convaincus, mais le détail du prix vient plus bas, une fois l'argumentaire déroulé.",
  },
  {
    q: "Comment obtenir des témoignages quand je débute et n'ai aucune vente ?",
    a: "Offrez votre produit gratuitement ou à prix réduit à 3 à 5 premières personnes en échange d'un retour honnête. Leurs témoignages deviennent votre preuve sociale de départ. Ensuite, sur Novakou, les avis vérifiés de vrais acheteurs s'accumulent automatiquement sur votre page à chaque vente.",
  },
  {
    q: "AIDA ou PAS : quelle structure choisir ?",
    a: "Utilisez PAS (Problème, Agitation, Solution) quand votre audience ressent une douleur forte mais ne connaît pas encore la solution — le cas de la plupart des formations et ebooks. Utilisez AIDA quand le désir existe déjà et qu'il faut le canaliser. Vous pouvez aussi combiner les deux : une accroche AIDA, puis un corps de page en PAS.",
  },
  {
    q: "Ai-je besoin d'un site web pour créer une page de vente ?",
    a: "Non. Sur Novakou, le tunnel de vente inclut un éditeur visuel par glisser-déposer et des modèles de pages prêts à remplir. Vous construisez votre page sans code ni site web, et le paiement Mobile Money (Wave, Orange, MTN, Moov) et carte est déjà intégré au checkout.",
  },
  {
    q: "Comment brancher le paiement Mobile Money à ma page de vente ?",
    a: "Sur Novakou, c'est automatique : le bouton d'achat de votre page mène au checkout, qui affiche Wave, Orange Money, MTN, Moov et la carte bancaire sans configuration de votre part. La vente déclenche l'accès au produit, crédite votre portefeuille et peut lancer vos automatisations e-mail.",
  },
];

export default function PageDeVenteQuiConvertit() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
