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
  slug: "lancer-pub-tiktok-produits-digitaux",
  title: "Lancer une publicité TikTok pour vendre ses produits digitaux en Afrique",
  subtitle:
    "TikTok Ads est devenu la machine à vendre la plus rentable d'Afrique francophone. Voici comment lancer votre première publicité, la cibler, la budgéter en FCFA et envoyer le trafic vers un lien de paiement ou un tunnel Novakou qui convertit.",
  category: "Promouvoir",
  level: "Intermédiaire",
  levelColor: "#0f172a",
  gradient: "linear-gradient(135deg, #0a0a0a, #1a1a1a 55%, #22c55e)",
  icon: "music_note",
  time: "16 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "publicité TikTok Afrique",
    "TikTok Ads produit digital",
    "vendre sur TikTok Afrique",
    "pub TikTok formation en ligne",
    "budget TikTok Ads FCFA",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Publicité TikTok pour vendre ses produits digitaux en Afrique : le guide";
const SEO_DESCRIPTION =
  "Lancez une publicité TikTok rentable pour vendre vos produits numériques en Afrique : compte Business, pixel TikTok, vidéo qui vend, ciblage, budget en FCFA et suivi des ventes avec Novakou.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Lancer une publicité TikTok qui vend",
)}&subtitle=${encodeURIComponent(
  "Vendre ses produits digitaux en Afrique avec TikTok Ads",
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
  src: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Créateur africain filmant une vidéo TikTok pour promouvoir son produit numérique",
  caption: "TikTok Ads : la publicité la plus abordable et la plus virale pour vendre en Afrique francophone.",
};

const stats = [
  { value: "2 000 FCFA", label: "budget de départ réaliste par jour et par campagne" },
  { value: "3 secondes", label: "pour capter l'attention ou perdre le spectateur" },
  { value: "Pixel", label: "TikTok installé sur vos pages Novakou = suivi des ventes" },
  { value: "24 h/24", label: "vos vidéos vendent même quand vous dormez" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-tiktok",
    label: "Pourquoi TikTok est une mine d'or en Afrique",
    content: (
      <>
        <GP>
          En quelques années, TikTok est devenu le réseau qui capte le plus d'attention en Afrique francophone. À Dakar, Abidjan, Douala ou Cotonou, des millions de personnes y passent plus d'une heure par jour, souvent sur un forfait data limité — mais TikTok, lui, tourne. C'est là que se trouve votre acheteur : jeune, connecté, habitué à découvrir des produits directement dans son fil, et prêt à acheter en Mobile Money s'il est convaincu.
        </GP>
        <GP>
          Contrairement à Facebook ou Instagram où la concurrence a fait exploser les coûts, la publicité TikTok reste <GStrong>abordable</GStrong> sur le marché africain. Un budget que vous jugeriez ridicule ailleurs peut vous apporter des dizaines de milliers de vues ici. Et surtout, l'algorithme TikTok est le plus généreux du marché : une bonne vidéo peut atteindre une audience largement supérieure à ce que vous payez, parce que la plateforme récompense le contenu qui retient l'attention.
        </GP>
        <GP>
          Pour un vendeur de produits numériques — formation, e‑book, template, coaching — c'est une opportunité rare. Vous n'avez pas de stock, pas de livraison, pas de frais logistiques. Vous filmez une vidéo de trente secondes, vous mettez quelques milliers de FCFA derrière, et vous envoyez les intéressés vers un <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente Novakou</GA> qui encaisse en Mobile Money. La marge est presque totale.
        </GP>
        <GStats
          items={[
            { value: "1 h+", label: "de temps passé par jour sur TikTok par l'utilisateur africain moyen" },
            { value: "70 %", label: "des utilisateurs découvrent de nouveaux produits directement sur la plateforme" },
            { value: "0", label: "coût logistique : un produit digital se livre automatiquement" },
          ]}
        />
        <GCallout variant="tip" title="Le bon moment">
          La publicité TikTok en Afrique est aujourd'hui dans sa fenêtre dorée : audience massive, coûts bas, concurrence encore faible sur les produits digitaux francophones. Les vendeurs qui s'y installent maintenant construisent une avance difficile à rattraper.
        </GCallout>
      </>
    ),
  },
  {
    id: "organique-vs-paye",
    label: "Organique ou payant : lequel choisir ?",
    content: (
      <>
        <GP>
          Il existe deux façons de vendre sur TikTok, et les meilleurs vendeurs utilisent les deux ensemble. Comprendre la différence vous évite de gaspiller votre argent.
        </GP>
        <GH3>L'organique : gratuit, mais lent et incertain</GH3>
        <GP>
          Poster des vidéos sans les sponsoriser ne coûte rien. Une vidéo peut devenir virale et vous apporter des milliers de vues gratuites — c'est le rêve. Mais c'est imprévisible : vous pouvez publier trente vidéos avant qu'une seule décolle. L'organique construit votre audience et votre crédibilité sur le long terme, mais vous ne pouvez pas <GStrong>décider</GStrong> de vendre demain avec l'organique seul. C'est un investissement de patience.
        </GP>
        <GH3>Le payant : contrôlé, mesurable, immédiat</GH3>
        <GP>
          La publicité (TikTok Ads) vous permet de choisir qui voit votre vidéo, combien de personnes, et quand. Vous payez, et le trafic arrive. Surtout, vous <GStrong>mesurez</GStrong> exactement combien chaque vente vous coûte, ce qui vous permet de réinvestir intelligemment. C'est le moteur qui transforme une bonne offre en business prévisible.
        </GP>
        <GP>
          La stratégie gagnante : produisez du contenu organique pour tester quelles vidéos accrochent le public, puis mettez du budget publicitaire derrière celles qui fonctionnent déjà naturellement. Pour maîtriser le format vidéo lui‑même, lisez notre guide <GA href="/guides/tiktok-reels-vendre-formations">TikTok et Reels pour vendre vos formations</GA>.
        </GP>
        <GCallout variant="info" title="Règle d'or">
          Ne sponsorisez jamais une vidéo qui n'a pas déjà prouvé qu'elle retient l'attention en organique. Mettre du budget derrière une mauvaise vidéo, c'est payer pour faire fuir les gens plus vite.
        </GCallout>
      </>
    ),
  },
  {
    id: "prerequis",
    label: "Les prérequis avant de lancer",
    content: (
      <>
        <GP>
          Avant de dépenser le moindre FCFA, deux fondations doivent être en place. Sans elles, vous naviguez à l'aveugle et vous perdez votre argent.
        </GP>
        <GH3>Un compte TikTok Business</GH3>
        <GP>
          La publicité passe par le <GStrong>TikTok Ads Manager</GStrong>, accessible avec un compte Business (gratuit). Basculez votre compte en profil Business dans les paramètres, puis créez votre compte publicitaire sur ads.tiktok.com. Vous y renseignez votre pays, votre devise (vous pouvez travailler en USD ou dans une devise locale selon la disponibilité) et votre moyen de paiement pour recharger votre budget publicitaire.
        </GP>
        <GH3>Le pixel TikTok installé sur vos pages Novakou</GH3>
        <GP>
          C'est le prérequis que la plupart des débutants oublient — et c'est le plus important. Le <GStrong>pixel TikTok</GStrong> est un petit code qui relie vos publicités à ce qui se passe réellement sur vos pages de vente. Sans lui, TikTok ne sait pas qui a payé, ne peut pas optimiser vers les acheteurs, et vous ne saurez jamais si votre pub est rentable.
        </GP>
        <GP>
          Bonne nouvelle : sur Novakou, vous n'avez pas besoin de toucher au code. Vous collez simplement votre identifiant de pixel dans les réglages, et il se déclenche automatiquement sur vos pages produit, votre checkout et vos liens de paiement. Le guide <GA href="/guides/installer-pixel-facebook-tiktok">installer le pixel Facebook et TikTok</GA> vous montre la marche à suivre en quelques minutes.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Tableau de bord de configuration du pixel TikTok sur une page de vente Novakou"
          caption="Le pixel TikTok posé sur vos pages Novakou : il suit chaque vue, chaque début de paiement et chaque achat."
        />
        <GCallout variant="warning" title="Ne lancez rien sans le pixel">
          Lancer une campagne sans pixel installé, c'est comme ouvrir une boutique sans caisse enregistreuse : vous vendez peut‑être, mais vous ne savez ni combien, ni à qui, ni quelle pub a marché. Installez le pixel d'abord, toujours.
        </GCallout>
      </>
    ),
  },
  {
    id: "video-qui-vend",
    label: "Créer une vidéo courte qui vend",
    content: (
      <>
        <GP>
          Votre publicité, c'est votre vidéo. Vous pouvez avoir le meilleur ciblage et le meilleur produit du monde : si la vidéo est ennuyeuse, personne n'achète. La bonne nouvelle, c'est qu'une vidéo qui vend sur TikTok ne demande ni matériel professionnel ni budget de production — juste un téléphone et la bonne structure.
        </GP>
        <GH3>L'accroche des 3 premières secondes</GH3>
        <GP>
          C'est la règle absolue. Dans les <GStrong>3 premières secondes</GStrong>, le spectateur décide de rester ou de glisser. Commencez par une phrase choc, un problème que votre audience ressent, ou un résultat surprenant : « Voici comment j'ai gagné mes 500 000 FCFA en vendant ce simple fichier », « Arrête de perdre ton argent dans des formations qui ne marchent pas », « Personne ne te dit ça sur le business en ligne au Sénégal ». Pas d'introduction, pas de « bonjour à tous » — vous entrez direct dans le vif.
        </GP>
        <GH3>Un format natif, pas une pub</GH3>
        <GP>
          Sur TikTok, les publicités qui ressemblent à des publicités sont ignorées. Filmez comme un créateur ordinaire : vertical, en pleine lumière, en parlant à la caméra comme à un ami. Le naturel vend mieux que le clinquant. Un fond simple, votre visage, une voix sincère : c'est exactement ce que l'algorithme et le public récompensent.
        </GP>
        <GH3>La preuve qui rassure</GH3>
        <GP>
          L'acheteur africain est prudent, et il a raison de l'être. Montrez une <GStrong>preuve</GStrong> : une capture de vos revenus, un témoignage d'un client satisfait, un aperçu du contenu de votre formation, un avant/après. La preuve désamorce la méfiance et transforme le « c'est peut‑être une arnaque » en « ça a l'air vrai ».
        </GP>
        <GH3>Un appel à l'action clair</GH3>
        <GP>
          Terminez en disant exactement quoi faire : « Clique sur le lien en bio pour recevoir ta formation », « Le lien de paiement est en commentaire, paie en Wave ou Orange Money en 30 secondes ». Un spectateur convaincu qui ne sait pas où cliquer est une vente perdue.
        </GP>
        <GCards
          items={[
            { icon: "bolt", title: "1. Accroche", text: "Une phrase choc dans les 3 premières secondes qui parle du problème ou du résultat." },
            { icon: "person", title: "2. Format natif", text: "Vertical, parlé à la caméra, filmé au téléphone — jamais un spot publicitaire clinquant." },
            { icon: "verified", title: "3. Preuve", text: "Capture de revenus, témoignage, aperçu du produit : rassurez un public méfiant." },
            { icon: "touch_app", title: "4. Appel à l'action", text: "Dites précisément où cliquer et comment payer en Mobile Money." },
          ]}
        />
      </>
    ),
  },
  {
    id: "ciblage",
    label: "Cibler la bonne audience",
    content: (
      <>
        <GP>
          Une pub montrée aux mauvaises personnes est de l'argent jeté. TikTok vous laisse choisir précisément qui voit votre vidéo — utilisez ce pouvoir avec méthode.
        </GP>
        <GH3>Le ciblage géographique et linguistique</GH3>
        <GP>
          Choisissez les pays où votre offre et votre moyen de paiement fonctionnent : Sénégal, Côte d'Ivoire, Cameroun, Bénin, Mali, Togo… Si votre produit s'adresse à un marché précis (par exemple une formation sur le business à Abidjan), concentrez le budget sur ce pays plutôt que de l'éparpiller. Ciblez la langue française pour parler à votre vraie audience.
        </GP>
        <GH3>L'âge, les centres d'intérêt et les comportements</GH3>
        <GP>
          Définissez une tranche d'âge cohérente avec votre client (souvent 18‑34 ans pour les produits digitaux) et affinez par centres d'intérêt : entrepreneuriat, finance, développement personnel, éducation. Vous pouvez aussi cibler les comportements — par exemple les personnes qui interagissent souvent avec du contenu business.
        </GP>
        <GH3>Laisser l'algorithme travailler</GH3>
        <GP>
          Le secret que beaucoup ignorent : sur TikTok, un ciblage <GStrong>trop restreint</GStrong> étouffe l'algorithme. Si votre pixel est bien installé et que votre objectif est l'achat, laissez une audience assez large et faites confiance à TikTok pour trouver les acheteurs. La machine apprend vite qui convertit, à condition qu'elle ait les données du pixel Novakou pour le faire.
        </GP>
        <GCallout variant="tip" title="Le reciblage, votre meilleur ami">
          Grâce au pixel, vous pourrez recibler les personnes qui ont vu votre produit sans acheter. Ce sont vos prospects les plus chauds : un rappel bien placé les fait souvent passer à l'achat, pour un coût bien plus bas que la première pub.
        </GCallout>
      </>
    ),
  },
  {
    id: "budget",
    label: "Budget réaliste en FCFA",
    content: (
      <>
        <GP>
          C'est la question que tout le monde se pose : « combien ça coûte ? ». La réponse honnête : vous pouvez commencer petit et grossir avec vos résultats. Ne jouez jamais tout votre argent d'un coup.
        </GP>
        <GH3>Commencez par tester</GH3>
        <GP>
          Un budget de départ raisonnable se situe entre <GStrong>2 000 et 3 000 FCFA par jour</GStrong> et par campagne. Ce n'est pas grand‑chose, mais suffisant pour que TikTok collecte des données et vous dise si votre vidéo et votre offre accrochent. Laissez tourner au moins 3 à 4 jours avant de juger : l'algorithme a besoin de ce temps pour trouver son rythme. Couper une campagne au bout de quelques heures, c'est l'erreur classique du débutant impatient.
        </GP>
        <GH3>Comptez votre rentabilité, pas votre dépense</GH3>
        <GP>
          Le vrai chiffre à surveiller n'est pas ce que vous dépensez, mais ce que chaque vente vous coûte. Si vous vendez une formation à 15 000 FCFA et qu'une vente vous coûte 4 000 FCFA de publicité, vous gagnez de l'argent — chaque jour, à volonté. Tant que ce ratio est bon, augmentez le budget progressivement (par paliers de 20 à 30 %, pas d'un coup, pour ne pas déstabiliser l'algorithme).
        </GP>
        <GStats
          items={[
            { value: "2 000‑3 000 FCFA", label: "budget quotidien de test par campagne" },
            { value: "3‑4 jours", label: "durée minimale avant de juger une campagne" },
            { value: "+20‑30 %", label: "augmentation de budget par paliers quand c'est rentable" },
          ]}
        />
        <GCallout variant="warning" title="Ne scalez pas trop vite">
          Multiplier votre budget par 5 du jour au lendemain fait souvent chuter les performances : l'algorithme repart en phase d'apprentissage. Montez doucement, palier par palier, en gardant l'œil sur le coût par vente.
        </GCallout>
      </>
    ),
  },
  {
    id: "trafic-novakou",
    label: "Envoyer le trafic vers un lien ou un tunnel Novakou",
    content: (
      <>
        <GP>
          Votre publicité TikTok fait une seule chose : amener des gens quelque part. Ce « quelque part » décide si le clic devient une vente. C'est ici que Novakou fait toute la différence, parce que la page qui reçoit le trafic est conçue pour convertir un acheteur africain, en Mobile Money.
        </GP>
        <GH3>Le lien de paiement direct</GH3>
        <GP>
          Pour une offre simple et un prix clair, envoyez le trafic vers un <GStrong>lien de paiement direct</GStrong> Novakou. Le spectateur clique, arrive sur le checkout, choisit Wave, Orange Money, MTN ou Moov, et paie en quelques secondes. Moins il y a d'étapes, plus vous vendez. Parfait pour une vente flash ou un e‑book à petit prix.
        </GP>
        <GH3>Le tunnel de vente pour convaincre davantage</GH3>
        <GP>
          Pour une offre à plus forte valeur (une formation à 25 000 ou 50 000 FCFA), un simple lien ne suffit pas : l'acheteur a besoin d'être rassuré et convaincu. Envoyez‑le alors vers un <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente Novakou</GA> : une page qui présente le problème, votre solution, les preuves, les témoignages, la garantie, puis le checkout. Vous pouvez même y ajouter un order bump et un upsell pour augmenter le panier moyen sans effort.
        </GP>
        <GP>
          Dans les deux cas, le pixel TikTok posé sur ces pages remonte chaque événement à votre compte publicitaire. Vous fermez ainsi la boucle : la pub amène le clic, la page Novakou encaisse, le pixel rapporte la vente à TikTok. Pour choisir la bonne plateforme d'accueil, notre guide <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA> détaille pourquoi Novakou domine sur ce point.
        </GP>
        <GCards
          items={[
            { icon: "link", title: "Lien de paiement direct", text: "Idéal pour une offre simple : clic → checkout Mobile Money en quelques secondes." },
            { icon: "filter_alt", title: "Tunnel de vente", text: "Idéal pour une offre premium : page qui rassure, convainc, puis vend avec upsell." },
            { icon: "payments", title: "Mobile Money natif", text: "Wave, Orange, MTN, Moov + carte : l'acheteur paie avec son moyen préféré." },
            { icon: "track_changes", title: "Pixel qui suit tout", text: "Chaque vue, début de paiement et achat remontent à TikTok pour optimiser." },
          ]}
        />
      </>
    ),
  },
  {
    id: "suivre-optimiser",
    label: "Suivre les résultats et optimiser",
    content: (
      <>
        <GP>
          Une publicité qui tourne sans être surveillée est une fuite d'argent. Grâce au pixel TikTok relié à vos pages Novakou, vous voyez exactement ce qui se passe et vous décidez avec des chiffres.
        </GP>
        <GUl>
          <GLi><GStrong>Le taux de rétention de la vidéo</GStrong> — si les gens décrochent avant 3 secondes, c'est votre accroche qu'il faut refaire, pas votre budget.</GLi>
          <GLi><GStrong>Le taux de clic (CTR)</GStrong> — combien de spectateurs cliquent vers votre page. Un CTR faible signale une vidéo qui accroche mais ne donne pas assez envie de cliquer.</GLi>
          <GLi><GStrong>Le taux de conversion de la page</GStrong> — combien de visiteurs achètent une fois arrivés. S'il est bas, le problème est sur votre page Novakou (prix, réassurance, moyens de paiement), pas sur la pub.</GLi>
          <GLi><GStrong>Le coût par achat</GStrong> — le chiffre roi : ce que vous payez pour chaque vente. C'est lui qui dit si vous gagnez ou perdez de l'argent.</GLi>
        </GUl>
        <GP>
          La méthode d'optimisation est simple : identifiez le maillon faible et corrigez‑le, un seul à la fois. Mauvaise rétention ? Nouvelle accroche. Bon clic mais peu d'achats ? Améliorez la page. Tout marche mais coût par vente trop élevé ? Testez une nouvelle audience ou un nouveau format vidéo. Vous avancez par expérimentations mesurées, jamais au hasard.
        </GP>
        <GCallout variant="tip" title="Testez plusieurs vidéos en parallèle">
          Ne misez pas tout sur une seule vidéo. Lancez 3 ou 4 accroches différentes avec un petit budget chacune, gardez celle qui coûte le moins par vente, et coupez les autres. C'est ainsi que les vendeurs rentables trouvent leur pépite.
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
          La plupart des vendeurs qui « n'y arrivent pas avec TikTok Ads » répètent les mêmes fautes. Les connaître à l'avance vous fait économiser du temps et de l'argent.
        </GP>
        <GCards
          items={[
            { icon: "block", title: "Lancer sans pixel", text: "Impossible de savoir ce qui marche ni d'optimiser vers les acheteurs. Installez le pixel Novakou d'abord." },
            { icon: "schedule", title: "Couper trop tôt", text: "Juger une campagne en quelques heures. Laissez 3‑4 jours à l'algorithme pour apprendre." },
            { icon: "movie", title: "Vidéo trop 'pub'", text: "Un spot clinquant est ignoré. Filmez naturel, vertical, au téléphone, comme un vrai créateur." },
            { icon: "trending_up", title: "Scaler d'un coup", text: "Multiplier le budget brutalement casse les performances. Montez par paliers de 20‑30 %." },
            { icon: "language", title: "Cibler trop large ou trop étroit", text: "Adaptez le pays à votre offre, laissez l'algorithme respirer avec une audience raisonnable." },
            { icon: "shopping_cart", title: "Négliger la page de vente", text: "Envoyer le trafic sur une page bancale. Un tunnel Novakou conçu pour convertir change tout." },
          ]}
        />
        <GCallout variant="warning" title="L'erreur la plus chère">
          Croire que la publicité va sauver une offre médiocre. TikTok Ads amplifie ce qui existe : une bonne offre devient rentable, une mauvaise offre perd juste de l'argent plus vite. Travaillez votre produit et votre page avant de payer pour du trafic.
        </GCallout>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Lancez votre première campagne dès aujourd'hui",
    content: (
      <>
        <GP>
          Vous savez désormais tout ce qu'il faut : pourquoi TikTok est une opportunité, comment créer une vidéo qui vend, comment cibler, budgéter en FCFA, et surtout comment envoyer le trafic vers une page qui encaisse en Mobile Money. Il ne reste plus qu'à passer à l'action — et l'action commence par avoir une page prête à recevoir vos premiers clics.
        </GP>
        <GUl>
          <GLi><GStrong>Créez votre boutique Novakou</GStrong> gratuitement et ajoutez le produit que vous voulez promouvoir.</GLi>
          <GLi><GStrong>Installez votre pixel TikTok</GStrong> sur vos pages en suivant le guide <GA href="/guides/installer-pixel-facebook-tiktok">installer le pixel</GA>.</GLi>
          <GLi><GStrong>Préparez votre lien de paiement ou votre tunnel</GStrong> pour recevoir le trafic et encaisser en Wave, Orange, MTN ou Moov.</GLi>
          <GLi><GStrong>Filmez 3 accroches</GStrong> différentes de 20 à 30 secondes avec votre téléphone.</GLi>
          <GLi><GStrong>Lancez avec 2 000‑3 000 FCFA par jour</GStrong>, mesurez, gardez la meilleure et montez le budget quand c'est rentable.</GLi>
        </GUl>
        <GP>
          Chaque grand vendeur africain a commencé par une première petite campagne. La différence entre celui qui réussit et celui qui abandonne, c'est la méthode et les bons outils. Vous avez maintenant les deux. <GA href="/inscription?role=vendeur">Créez votre compte vendeur Novakou</GA> et transformez vos vues TikTok en ventes réelles, dès cette semaine.
        </GP>
        <GCallout variant="success" title="Tout est déjà connecté">
          Avec Novakou, la pub TikTok, le pixel, le checkout Mobile Money, les tunnels et le suivi des ventes fonctionnent ensemble sans bricolage. Vous vous concentrez sur la création de vidéos qui accrochent ; la plateforme s'occupe d'encaisser et de mesurer.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Quel budget minimum pour lancer une pub TikTok en Afrique ?",
    a: "Vous pouvez démarrer avec 2 000 à 3 000 FCFA par jour et par campagne. C'est suffisant pour tester si votre vidéo et votre offre accrochent. Laissez tourner 3 à 4 jours avant de juger, puis augmentez le budget par paliers de 20 à 30 % tant que le coût par vente reste rentable.",
  },
  {
    q: "Ai‑je vraiment besoin du pixel TikTok pour vendre ?",
    a: "Oui, c'est indispensable. Sans le pixel installé sur vos pages Novakou, TikTok ne sait pas qui a acheté, ne peut pas optimiser vers les acheteurs, et vous ne saurez pas quelle pub est rentable. Sur Novakou, vous collez simplement votre identifiant de pixel dans les réglages, sans toucher au code.",
  },
  {
    q: "Faut‑il un compte TikTok Business pour faire de la publicité ?",
    a: "Oui. La publicité passe par le TikTok Ads Manager, qui nécessite un compte Business (gratuit). Basculez votre profil en Business dans les paramètres, puis créez votre compte publicitaire sur ads.tiktok.com et renseignez votre moyen de paiement pour recharger le budget.",
  },
  {
    q: "Vaut‑il mieux envoyer le trafic vers un lien de paiement ou un tunnel ?",
    a: "Pour une offre simple et un prix bas, un lien de paiement direct Novakou est parfait : moins d'étapes, plus de ventes. Pour une offre premium (formation à 25 000‑50 000 FCFA), utilisez un tunnel de vente qui rassure et convainc avant le checkout, avec order bump et upsell pour augmenter le panier moyen.",
  },
  {
    q: "Combien de temps avant de voir des résultats ?",
    a: "Laissez toujours une campagne tourner au moins 3 à 4 jours : l'algorithme TikTok a besoin de ce temps pour apprendre à qui montrer votre vidéo. Couper trop tôt est l'erreur la plus fréquente. Surveillez le coût par vente plutôt que les résultats des premières heures.",
  },
  {
    q: "L'organique suffit‑il ou dois‑je forcément payer ?",
    a: "L'organique (vidéos non sponsorisées) construit votre audience gratuitement mais reste lent et imprévisible. La publicité vous donne du trafic contrôlé et mesurable immédiatement. La meilleure stratégie combine les deux : testez vos vidéos en organique, puis mettez du budget derrière celles qui accrochent déjà naturellement.",
  },
];

export default function LancerPubTiktokProduitsDigitaux() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
