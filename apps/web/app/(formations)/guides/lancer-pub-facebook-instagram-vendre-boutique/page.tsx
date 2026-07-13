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
  slug: "lancer-pub-facebook-instagram-vendre-boutique",
  title: "Lancer une publicité Facebook & Instagram pour vendre sa boutique (2026)",
  subtitle:
    "Le guide pratique pour lancer une pub Meta qui vend en Afrique : page Facebook, compte Business, pixel installé sur vos pages Novakou, audience, visuel qui convertit, budget réaliste en FCFA et lecture des résultats. Du premier clic à la première vente.",
  category: "Promouvoir",
  level: "Intermédiaire",
  levelColor: "#1d4ed8",
  gradient: "linear-gradient(135deg, #0a1f52, #1d4ed8 60%, #22c55e)",
  icon: "campaign",
  time: "16 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "publicité Facebook Afrique vendre",
    "pub Instagram produit digital Afrique",
    "Facebook Ads formation en ligne",
    "budget publicité Facebook FCFA",
    "vendre boutique en ligne avec la pub",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Publicité Facebook & Instagram pour vendre sa boutique en Afrique (2026)";
const SEO_DESCRIPTION =
  "Lancez une pub Meta qui vend en Afrique : page Facebook, compte Business, pixel sur vos pages Novakou, audience, visuel, budget en FCFA à partir de 2 000 FCFA/jour et optimisation.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Lancer une pub Facebook & Instagram qui vend",
)}&subtitle=${encodeURIComponent(
  "Le guide pratique pour vendre sa boutique en Afrique",
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
  alt: "Entrepreneur africain lançant une campagne publicitaire Facebook et Instagram pour vendre sa boutique en ligne",
  caption: "Une pub bien ciblée et suivie par pixel transforme 3 000 FCFA/jour en ventes mesurables.",
};

const stats = [
  { value: "2 000 F", label: "budget de départ réaliste par jour pour tester" },
  { value: "Pixel", label: "suivi vue → paiement → achat sur vos pages Novakou" },
  { value: "Meta", label: "Facebook + Instagram, la plus grande audience d'Afrique" },
  { value: "Mobile Money", label: "l'acheteur paie en Wave, Orange, MTN ou carte" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-meta",
    label: "Pourquoi la pub Meta marche si bien en Afrique",
    content: (
      <>
        <GP>
          En Afrique francophone, Facebook et Instagram ne sont pas de simples réseaux sociaux : ce sont les places de marché où se passe la vie numérique. Un vendeur à Dakar, Abidjan, Douala ou Cotonou touche, en quelques clics, des dizaines de milliers de personnes qui font déjà défiler leur fil chaque jour. La régie publicitaire de Meta — qui réunit Facebook, Instagram, Messenger et le réseau Audience — est l'outil le plus puissant et le plus abordable pour mettre votre produit numérique sous les yeux des bonnes personnes.
        </GP>
        <GP>
          Ce qui change tout, c'est la <GStrong>précision du ciblage</GStrong>. Vous ne payez pas pour crier dans le vide : vous choisissez le pays, la ville, l'âge, les centres d'intérêt et les comportements de votre audience. Une formatrice en marketing digital peut ne montrer sa pub qu'aux Sénégalais de 22 à 40 ans intéressés par l'entrepreneuriat. C'est de la publicité chirurgicale, à un coût que la radio ou l'affichage ne permettront jamais.
        </GP>
        <GStats
          items={[
            { value: "+80 %", label: "du trafic web africain passe par mobile — vos pubs aussi" },
            { value: "1er", label: "canal d'acquisition payante pour les créateurs digitaux du continent" },
            { value: "24 h", label: "suffisent pour lancer une campagne et voir les premiers clics" },
          ]}
        />
        <GP>
          Mais attention : la pub Meta n'est pas magique. Sans suivi, sans page qui vend et sans moyen de paiement fluide, votre budget part en fumée. C'est précisément là que <GStrong>Novakou</GStrong> fait la différence — en reliant votre publicité à un checkout Mobile Money et à un pixel qui mesure chaque étape. Ce guide vous montre comment tout assembler, du premier clic à la première vente.
        </GP>
      </>
    ),
  },
  {
    id: "prerequis",
    label: "Les prérequis avant de dépenser le moindre franc",
    content: (
      <>
        <GP>
          Avant de lancer une campagne, il faut poser des fondations. Beaucoup de débutants brûlent leur budget parce qu'ils démarrent sans ces trois pièces. Prenez une heure pour les mettre en place — c'est le meilleur investissement de tout le processus.
        </GP>
        <GCards
          items={[
            { icon: "thumb_up", title: "1. Une page Facebook professionnelle", text: "Impossible de faire de la pub depuis un profil personnel. Créez une page au nom de votre marque, avec photo, description claire et quelques publications récentes qui inspirent confiance." },
            { icon: "business_center", title: "2. Un compte Meta Business", text: "Le Gestionnaire de publicités (business.facebook.com) centralise vos campagnes, votre pixel et votre moyen de paiement. Il relie votre page Facebook et votre compte Instagram professionnel." },
            { icon: "monitoring", title: "3. Le pixel Meta installé", text: "C'est le mouchard qui mesure ce qui se passe sur vos pages Novakou : qui voit le produit, qui commence à payer, qui achète. Sans lui, vous pilotez à l'aveugle." },
            { icon: "storefront", title: "4. Une page qui vend", text: "Un lien de paiement direct ou un tunnel Novakou prêt à recevoir le trafic. Envoyer une pub vers une page bancale, c'est remplir un seau percé." },
          ]}
        />
        <GCallout variant="warning" title="Le compte Instagram compte aussi">
          Reliez votre compte Instagram professionnel à votre page Facebook dans le Business Manager. Une seule campagne peut ainsi diffuser à la fois dans le fil Facebook, le fil Instagram, les Stories et les Reels — là où l'attention africaine se concentre en 2026.
        </GCallout>
        <GP>
          Une fois ces éléments réunis, vous êtes prêt. Si vous partez de zéro sur la stratégie publicitaire, notre guide complémentaire <GA href="/guides/publicite-facebook">publicité Facebook pas à pas</GA> détaille chaque réglage du Gestionnaire de publicités. Ici, on se concentre sur la mécanique qui fait vendre <GStrong>votre boutique Novakou</GStrong>.
        </GP>
      </>
    ),
  },
  {
    id: "installer-pixel",
    label: "Installer le pixel Meta sur vos pages Novakou (l'étape clé)",
    content: (
      <>
        <GP>
          Si vous ne retenez qu'une seule chose de ce guide, retenez celle-ci : <GStrong>installez votre pixel avant de lancer la moindre pub</GStrong>. Le pixel est un petit code fourni par Meta qui rapporte à Facebook et Instagram ce que font les visiteurs venus de vos publicités. C'est lui qui transforme une dépense incertaine en investissement mesurable.
        </GP>
        <GH3>Ce que Novakou permet, que d'autres ne permettent pas</GH3>
        <GP>
          Novakou vous laisse <GStrong>coller votre identifiant de pixel Facebook / Instagram</GStrong> directement sur vos pages produit, votre tunnel de vente et votre checkout — sans toucher à une ligne de code. Le pixel se déclenche alors automatiquement aux moments qui comptent : quand un visiteur <GStrong>voit la page produit</GStrong>, quand il <GStrong>commence le paiement</GStrong>, et quand il <GStrong>achète</GStrong>. Vous suivez ainsi tout l'entonnoir, de la vue jusqu'à la vente confirmée en Mobile Money.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Tableau de bord d'analyse de campagne publicitaire suivie par pixel sur une boutique Novakou"
          caption="Le pixel relie chaque clic à un événement mesuré : vue du produit, début de paiement, achat."
        />
        <GH3>Comment procéder en pratique</GH3>
        <GUl>
          <GLi>Dans le Gestionnaire d'événements de Meta, créez votre pixel et copiez son <GStrong>identifiant</GStrong> (une suite de chiffres).</GLi>
          <GLi>Dans votre tableau de bord Novakou, ouvrez les réglages de suivi / pixels et <GStrong>collez cet identifiant</GStrong>. Il s'applique à vos pages produit, à vos liens de paiement et à votre checkout.</GLi>
          <GLi>Vérifiez avec l'extension Meta Pixel Helper que les événements <GStrong>ViewContent</GStrong>, <GStrong>InitiateCheckout</GStrong> et <GStrong>Purchase</GStrong> se déclenchent bien.</GLi>
          <GLi>Laissez le pixel « apprendre » : plus il enregistre d'achats, plus Meta trouve seul des acheteurs qui vous ressemblent.</GLi>
        </GUl>
        <GCallout variant="success" title="Pourquoi c'est votre meilleur levier de rentabilité">
          Avec le pixel, vous savez exactement quelle pub, quelle image et quelle audience génèrent des ventes — pas juste des clics. Vous pouvez couper ce qui coûte, doubler ce qui rapporte, et créer des audiences de reciblage (les gens qui ont vu le produit sans acheter). Sans pixel, vous naviguez à l'aveugle et vous payez le prix fort.
        </GCallout>
      </>
    ),
  },
  {
    id: "audience",
    label: "Définir la bonne audience",
    content: (
      <>
        <GP>
          Une pub montrée à la mauvaise personne est de l'argent jeté. Meta vous donne trois grands types d'audiences — apprenez à les combiner selon votre maturité.
        </GP>
        <GH3>1. L'audience par centres d'intérêt (pour démarrer)</GH3>
        <GP>
          C'est votre point de départ quand personne ne vous connaît encore. Vous ciblez par <GStrong>pays et ville</GStrong> (Sénégal, Côte d'Ivoire, Cameroun, Bénin, ou une diaspora à Paris et Montréal), par <GStrong>âge</GStrong>, et par <GStrong>centres d'intérêt</GStrong> : entrepreneuriat, marketing digital, développement personnel, e-commerce. Une vendeuse de formation Canva ciblera « graphisme », « petites entreprises » et « freelance ».
        </GP>
        <GH3>2. L'audience personnalisée (le reciblage)</GH3>
        <GP>
          Grâce à votre pixel, Meta reconstitue la liste des gens qui ont <GStrong>déjà vu votre produit sans acheter</GStrong>. Les recibler coûte peu et convertit énormément : ils vous connaissent déjà, il ne manquait qu'un rappel. C'est souvent votre campagne la plus rentable.
        </GP>
        <GH3>3. L'audience similaire (pour passer à l'échelle)</GH3>
        <GP>
          Une fois que le pixel a enregistré assez d'achats, demandez à Meta de trouver des gens qui <GStrong>ressemblent à vos acheteurs</GStrong>. C'est le levier qui fait grandir une campagne rentable au-delà du cercle initial.
        </GP>
        <GCallout variant="tip" title="Commencez large, laissez Meta apprendre">
          Ne sur-restreignez pas votre audience au départ (évitez d'empiler dix centres d'intérêt). Donnez à l'algorithme un vivier de 300 000 à 1 million de personnes dans votre pays, un budget modeste, et laissez le pixel repérer seul ceux qui achètent. Vous affinerez ensuite avec les données.
        </GCallout>
      </>
    ),
  },
  {
    id: "creer-pub",
    label: "Créer une publicité qui convertit vraiment",
    content: (
      <>
        <GP>
          Dans le fil d'un Sénégalais ou d'un Ivoirien, votre pub se bat contre des centaines d'autres contenus. Vous avez moins de deux secondes pour arrêter le pouce. Une pub qui vend repose sur trois piliers.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Création d'une publicité Facebook et Instagram sur smartphone pour promouvoir un produit numérique en Afrique"
          caption="Un visuel lumineux, une accroche centrée sur le résultat et une preuve sociale : le trio qui convertit."
        />
        <GH3>Le visuel : arrêter le défilement</GH3>
        <GP>
          Une image nette, lumineuse, avec un visage humain ou un aperçu concret du produit fonctionne mieux qu'un montage compliqué. La vidéo courte (Reel de 15 à 30 secondes) est reine en 2026 : montrez-vous en train de parler, expliquez le bénéfice, restez authentique. Le format vertical (9:16) est indispensable pour les Stories et Reels où se joue l'essentiel de l'attention mobile africaine.
        </GP>
        <GH3>L'accroche : parler du résultat, pas du produit</GH3>
        <GP>
          Personne n'achète « une formation de 3 heures ». On achète « gagner ses premiers 100 000 FCFA avec Canva, même en partant de zéro ». Votre première ligne doit toucher un désir ou une douleur précise. Ajoutez un appel à l'action clair : « Clique pour recevoir la formation maintenant ».
        </GP>
        <GH3>La preuve sociale : rassurer avant de vendre</GH3>
        <GP>
          En Afrique, la méfiance en ligne est réelle. Une capture d'un témoignage WhatsApp, un chiffre (« déjà 240 personnes formées »), un badge de paiement sécurisé : ces signaux transforment un curieux hésitant en acheteur. Le paiement séquestré de Novakou renforce cette confiance — l'acheteur sait qu'il est protégé.
        </GP>
        <GCards
          items={[
            { icon: "bolt", title: "Accroche forte", text: "Première ligne centrée sur le résultat concret, dans les mots de votre client." },
            { icon: "image", title: "Visuel qui stoppe", text: "Image lumineuse ou vidéo verticale courte, un visage, un bénéfice visible." },
            { icon: "verified", title: "Preuve sociale", text: "Témoignage, nombre de clients, avis vérifiés, badge de paiement sécurisé." },
            { icon: "ads_click", title: "Appel à l'action", text: "Un seul bouton, une seule action : « Commander maintenant » vers votre lien Novakou." },
          ]}
        />
      </>
    ),
  },
  {
    id: "budget",
    label: "Le budget réaliste en FCFA : commencer petit et intelligent",
    content: (
      <>
        <GP>
          La plus grande peur des débutants, c'est le budget. Bonne nouvelle : on ne lance pas une pub avec 100 000 FCFA d'un coup. On <GStrong>teste petit, on mesure, puis on augmente ce qui marche</GStrong>. C'est la seule méthode qui protège votre argent.
        </GP>
        <GH3>La phase de test</GH3>
        <GP>
          Démarrez avec <GStrong>2 000 à 3 000 FCFA par jour</GStrong> pendant 4 à 5 jours. Ce budget modeste suffit à récolter les premières données : quel visuel attire les clics, quelle audience réagit, à quel coût vous obtenez une vue de produit ou un début de paiement. Vous ne cherchez pas encore la rentabilité — vous cherchez le signal.
        </GP>
        <GStats
          items={[
            { value: "2 000 F", label: "budget quotidien de départ pour un premier test" },
            { value: "4-5 j", label: "durée minimale pour laisser le pixel apprendre" },
            { value: "×2", label: "on augmente le budget seulement quand une pub est rentable" },
          ]}
        />
        <GH3>La phase de montée en puissance</GH3>
        <GP>
          Une fois qu'une publicité est rentable — c'est-à-dire qu'elle rapporte plus qu'elle ne coûte, grâce aux ventes suivies par pixel — augmentez son budget <GStrong>progressivement</GStrong> : +20 à +30 % tous les deux ou trois jours. Une hausse brutale casse l'apprentissage de l'algorithme et fait remonter vos coûts. La patience est ici une compétence financière.
        </GP>
        <GCallout variant="info" title="Comment savoir si c'est rentable ?">
          Règle simple : si vous vendez une formation à 15 000 FCFA et que le pixel indique une vente pour 5 000 FCFA de pub dépensés, vous êtes largement gagnant. Le pixel vous donne ce chiffre — le fameux ROAS (retour sur dépense publicitaire). Sans lui, vous devinez ; avec lui, vous décidez avec des faits.
        </GCallout>
      </>
    ),
  },
  {
    id: "destination",
    label: "Où envoyer le trafic : lien de paiement direct ou tunnel",
    content: (
      <>
        <GP>
          Une pub réussie n'est que la moitié du travail. L'autre moitié, c'est la page qui reçoit le clic. Avec Novakou, vous avez deux excellentes destinations selon votre offre.
        </GP>
        <GH3>Le lien de paiement direct (offre simple)</GH3>
        <GP>
          Pour un produit unique à prix clair — un ebook à 2 500 FCFA, un pack de templates, une masterclass — envoyez le trafic vers un <GStrong>lien de paiement direct</GStrong>. Le visiteur arrive presque au checkout, choisit Wave, Orange Money, MTN ou carte, et paie en quelques secondes. Moins d'étapes, moins d'abandons. C'est parfait pour les offres impulsives et les ventes flash.
        </GP>
        <GH3>Le tunnel de vente (offre à construire)</GH3>
        <GP>
          Pour une formation à plus forte valeur, un accompagnement, ou quand vous voulez maximiser le panier moyen, dirigez la pub vers un <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente Novakou</GA>. Le visiteur passe par une page de vente qui installe le désir, puis un checkout, puis un <GStrong>order bump</GStrong> et un <GStrong>upsell</GStrong> qui augmentent chaque commande. Un client venu pour une formation à 25 000 FCFA peut repartir à 34 000 FCFA d'un simple clic.
        </GP>
        <GCallout variant="tip" title="Le pixel suit les deux">
          Que vous choisissiez le lien direct ou le tunnel, votre pixel Meta est déjà posé sur les deux. Vue de la page, début de paiement, achat : chaque événement remonte à Facebook. Vous comparez ainsi objectivement quelle destination convertit le mieux votre trafic payant.
        </GCallout>
        <GP>
          Dans les deux cas, l'acheteur paie en <GStrong>Mobile Money</GStrong> ou par carte, et vos fonds sont sécurisés par le paiement séquestré. Le trafic que vous avez payé se transforme en argent réellement encaissé — pas en simple promesse.
        </GP>
      </>
    ),
  },
  {
    id: "lire-resultats",
    label: "Lire les résultats et optimiser sans se tromper",
    content: (
      <>
        <GP>
          Le Gestionnaire de publicités affiche beaucoup de colonnes. Ne vous noyez pas : trois ou quatre chiffres suffisent à décider, et le pixel vous en donne les plus importants.
        </GP>
        <GUl>
          <GLi><GStrong>Le coût par achat</GStrong> — combien vous dépensez en pub pour une vente. C'est LE chiffre roi. Il doit rester bien en dessous de votre prix de vente.</GLi>
          <GLi><GStrong>Le ROAS (retour sur dépense)</GStrong> — combien de FCFA de ventes chaque FCFA de pub rapporte. Un ROAS de 3 signifie 3 000 FCFA gagnés pour 1 000 dépensés.</GLi>
          <GLi><GStrong>Le taux de clic (CTR)</GStrong> — indique si votre visuel et votre accroche attirent. Faible ? Le problème est dans la pub, pas dans la page.</GLi>
          <GLi><GStrong>Le taux de conversion</GStrong> — parmi ceux qui cliquent, combien achètent. Faible malgré de bons clics ? Le problème est sur votre page ou votre prix.</GLi>
        </GUl>
        <GP>
          La méthode d'optimisation est simple et sans pitié : <GStrong>on coupe ce qui ne convertit pas, on renforce ce qui vend</GStrong>. Une pub avec beaucoup de clics mais zéro achat après trois jours ? On la met en pause. Une pub qui vend à un coût acceptable ? On augmente doucement son budget. Le pixel rend cette décision factuelle, pas émotionnelle.
        </GP>
        <GCallout variant="success" title="Testez toujours deux ou trois versions">
          Ne misez jamais tout sur une seule pub. Lancez deux ou trois visuels et deux accroches différentes, laissez Meta répartir le budget, et gardez le gagnant. Ce petit réflexe, répété, fait toute la différence entre un budget gaspillé et une machine à vendre qui s'améliore chaque semaine.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs",
    label: "Les erreurs qui brûlent votre budget",
    content: (
      <>
        <GP>
          La plupart des échecs publicitaires en Afrique ne viennent pas d'un manque de budget, mais de pièges évitables. Voici les plus fréquents — et comment les esquiver.
        </GP>
        <GCards
          items={[
            { icon: "block", title: "Lancer sans pixel", text: "L'erreur n°1. Sans suivi, vous ne saurez jamais quelle pub vend. Installez votre pixel sur vos pages Novakou avant tout." },
            { icon: "hourglass_disabled", title: "Couper trop vite", text: "Juger une pub après quelques heures. Laissez-lui 3 à 4 jours pour que l'algorithme apprenne avant de décider." },
            { icon: "link_off", title: "Une page qui ne vend pas", text: "Envoyer du trafic payant vers une page lente, confuse ou sans preuve sociale. Soignez la destination autant que la pub." },
            { icon: "payments", title: "Oublier le Mobile Money", text: "Proposer seulement la carte à un public africain. Activez Wave, Orange, MTN et Moov au checkout, sinon la vente n'a pas lieu." },
            { icon: "trending_down", title: "Multiplier le budget d'un coup", text: "Passer de 3 000 à 30 000 FCFA du jour au lendemain casse l'apprentissage et fait exploser les coûts." },
            { icon: "target", title: "Cibler trop étroit", text: "Empiler dix critères jusqu'à réduire l'audience à néant. Laissez de la marge à l'algorithme pour trouver vos acheteurs." },
          ]}
        />
        <GP>
          Évitez ces six pièges et vous serez déjà devant 90 % des annonceurs débutants. Le fil conducteur reste le même : <GStrong>mesurez avec le pixel, décidez avec les chiffres, et envoyez le trafic vers une page Novakou pensée pour vendre</GStrong>.
        </GP>
      </>
    ),
  },
  {
    id: "lancer",
    label: "Lancer votre première campagne aujourd'hui",
    content: (
      <>
        <GP>
          Vous avez maintenant la méthode complète. La meilleure façon d'apprendre la publicité, c'est de lancer une première petite campagne et d'observer. Voici votre plan d'action, du plus simple au plus rentable.
        </GP>
        <GUl>
          <GLi><GStrong>Préparez votre boutique Novakou</GStrong> : un produit clair, un prix en FCFA, un lien de paiement ou un tunnel prêt à recevoir le trafic.</GLi>
          <GLi><GStrong>Installez votre pixel Meta</GStrong> sur vos pages produit et votre checkout — l'étape non négociable qui rend tout mesurable.</GLi>
          <GLi><GStrong>Créez une pub simple</GStrong> : un visuel qui stoppe le pouce, une accroche centrée sur le résultat, un appel à l'action clair.</GLi>
          <GLi><GStrong>Ciblez votre pays et vos centres d'intérêt</GStrong>, avec un budget de 2 000 à 3 000 FCFA par jour pendant 4 à 5 jours.</GLi>
          <GLi><GStrong>Lisez les résultats</GStrong> via le pixel, coupez ce qui ne vend pas, et augmentez doucement ce qui rapporte.</GLi>
        </GUl>
        <GP>
          La publicité n'est qu'un des leviers de croissance. Pour la vue d'ensemble, comparez les solutions dans notre guide des <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA>, et approfondissez chaque réglage avec le guide <GA href="/guides/publicite-facebook">publicité Facebook</GA>. Mais la vérité, c'est qu'aucun guide ne remplace une première campagne lancée. Avec le pixel Novakou posé sur vos pages, chaque franc dépensé vous apprend quelque chose — et vous rapproche de la rentabilité.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Quel budget minimum faut-il pour lancer une pub Facebook en Afrique ?",
    a: "Vous pouvez démarrer avec 2 000 à 3 000 FCFA par jour pendant 4 à 5 jours. Ce petit budget de test suffit à récolter des données : quel visuel attire, quelle audience réagit, à quel coût vous obtenez une vue ou un achat. On n'augmente le budget qu'une fois une publicité prouvée rentable grâce au pixel.",
  },
  {
    q: "Pourquoi dois-je installer un pixel avant de lancer ma publicité ?",
    a: "Le pixel Meta mesure ce que font les visiteurs venus de vos pubs : vue du produit, début de paiement, achat. Sans lui, vous ne savez pas quelle pub vend réellement et vous dépensez à l'aveugle. Novakou vous permet de coller votre identifiant de pixel Facebook/Instagram directement sur vos pages produit et votre checkout, sans code.",
  },
  {
    q: "Comment installer mon pixel Facebook sur mes pages Novakou ?",
    a: "Créez votre pixel dans le Gestionnaire d'événements de Meta et copiez son identifiant. Dans votre tableau de bord Novakou, ouvrez les réglages de suivi/pixels et collez cet identifiant : il s'applique à vos pages produit, vos liens de paiement et votre checkout. Vérifiez ensuite avec l'extension Meta Pixel Helper que les événements se déclenchent.",
  },
  {
    q: "Vaut-il mieux envoyer la pub vers un lien de paiement ou un tunnel ?",
    a: "Pour une offre simple à prix clair (ebook, pack de templates), le lien de paiement direct réduit les étapes et les abandons. Pour une offre à plus forte valeur où vous voulez maximiser le panier moyen avec order bump et upsell, un tunnel de vente Novakou convertit mieux. Le pixel suit les deux, à vous de comparer.",
  },
  {
    q: "Mes clients pourront-ils payer en Mobile Money depuis ma publicité ?",
    a: "Oui. Le trafic de votre pub arrive sur une page Novakou où l'acheteur choisit Wave, Orange Money, MTN Mobile Money, Moov Money ou la carte bancaire. C'est essentiel en Afrique : sans Mobile Money au checkout, une grande partie des ventes ne se conclut jamais.",
  },
  {
    q: "Comment savoir si ma publicité est rentable ?",
    a: "Regardez le coût par achat et le ROAS (retour sur dépense publicitaire), tous deux fournis par le pixel. Si vous vendez une formation à 15 000 FCFA et que le pixel indique une vente pour 5 000 FCFA de pub dépensés, vous êtes gagnant. On coupe ce qui ne convertit pas et on renforce ce qui vend.",
  },
];

export default function LancerPubFacebookInstagram() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
