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
  slug: "installer-pixel-facebook-tiktok",
  title: "Installer un pixel Facebook, TikTok, Snapchat & Pinterest (guide complet)",
  subtitle:
    "Un pixel de suivi transforme une publicité « à l'aveugle » en machine à ventes mesurée. Voici comment récupérer votre ID de pixel sur chaque plateforme et le poser nativement sur toutes vos pages Novakou — produit, checkout et liens de paiement.",
  category: "Promouvoir",
  level: "Intermédiaire",
  levelColor: "#1d4ed8",
  gradient: "linear-gradient(135deg, #0a1f52, #1d4ed8 60%, #22c55e)",
  icon: "track_changes",
  time: "14 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "installer pixel Facebook",
    "pixel TikTok Snapchat Pinterest",
    "suivre conversions publicité Afrique",
    "pixel de suivi boutique en ligne",
    "retargeting Afrique pixel",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Installer un pixel Facebook, TikTok, Snapchat & Pinterest — guide complet";
const SEO_DESCRIPTION =
  "Récupérez votre ID de pixel Facebook, TikTok, Snapchat, Pinterest et Google, posez-le nativement sur vos pages Novakou (produit, checkout, liens de paiement) et suivez chaque vente. Le guide complet du suivi de conversions en Afrique.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Installer un pixel Facebook, TikTok, Snapchat & Pinterest",
)}&subtitle=${encodeURIComponent(
  "Suivre vos conversions publicitaires nativement sur Novakou",
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
  src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Tableau de bord d'analyse publicitaire et suivi de conversions pour une boutique en ligne",
  caption: "Sans pixel, vous dépensez à l'aveugle. Avec, vous savez exactement quelle publicité vous rapporte.",
};

const stats = [
  { value: "5", label: "régies suivies : Facebook, Google, TikTok, Snapchat, Pinterest" },
  { value: "3", label: "événements clés : ViewContent, InitiateCheckout, Purchase" },
  { value: "100 %", label: "de vos pages couvertes : produit, checkout, liens de paiement" },
  { value: "2 min", label: "pour coller un ID de pixel dans Marketing → Pixels" },
];

const sections: GuideSection[] = [
  {
    id: "quest-ce-quun-pixel",
    label: "Qu'est-ce qu'un pixel et pourquoi c'est indispensable",
    content: (
      <>
        <GP>
          Un <GStrong>pixel</GStrong> est un petit bout de code invisible que vous placez sur vos pages de vente. Chaque fois qu'un visiteur consulte un produit, commence à payer ou finalise un achat, le pixel envoie discrètement l'information à la régie publicitaire concernée — Facebook, TikTok, Snapchat, Pinterest ou Google. En clair, c'est le <GStrong>lien manquant</GStrong> entre votre publicité et vos ventes réelles.
        </GP>
        <GP>
          Sans pixel, votre publicité est aveugle. Vous savez combien de personnes ont cliqué, mais pas combien ont acheté, ni lesquelles, ni pour quel montant. Vous dépensez 50 000 FCFA de budget publicitaire à Dakar ou Abidjan sans jamais savoir si la campagne a rapporté 10 000 FCFA ou 500 000 FCFA. C'est comme verser de l'eau dans un seau percé sans regarder le fond : vous devinez, vous espérez, mais vous ne pilotez rien.
        </GP>
        <GCallout variant="warning" title="La règle d'or de la publicité rentable">
          Ne lancez jamais une publicité payante avant d'avoir installé votre pixel. Une campagne sans pixel, c'est de l'argent que vous ne récupérerez jamais sous forme de données. Chaque jour de pub sans suivi est un jour d'apprentissage perdu pour l'algorithme — et pour vous.
        </GCallout>
        <GP>
          La bonne nouvelle : sur Novakou, vous n'avez aucune ligne de code à écrire ni à copier dans le &lt;head&gt; d'un site. Vous collez un simple identifiant, et la plateforme s'occupe de tout, sur toutes vos pages. On voit comment plus bas, mais commençons par comprendre <GStrong>ce qu'un pixel change vraiment</GStrong> dans votre business.
        </GP>
      </>
    ),
  },
  {
    id: "ce-que-le-pixel-permet",
    label: "Ce qu'un pixel permet concrètement",
    content: (
      <>
        <GP>
          Un pixel ne se contente pas de compter les clics. Il vous ouvre trois pouvoirs que les vendeurs qui réussissent maîtrisent tous, et que ceux qui échouent ignorent.
        </GP>
        <GH3>1. Suivre le parcours complet : vue → paiement → achat</GH3>
        <GP>
          Le pixel enregistre chaque étape de votre tunnel : la <GStrong>vue du produit</GStrong>, le <GStrong>début du paiement</GStrong>, et l'<GStrong>achat confirmé avec son montant en FCFA</GStrong>. Vous voyez enfin où les gens décrochent. Si 200 personnes voient votre formation mais que 5 seulement commencent à payer, le problème est votre page produit. Si 50 commencent à payer mais que 5 finissent, le problème est votre checkout. Le pixel transforme une intuition floue en diagnostic précis.
        </GP>
        <GH3>2. Créer des audiences de reciblage</GH3>
        <GP>
          C'est l'arme secrète. Le pixel mémorise les visiteurs qui ont vu votre produit sans acheter. Vous pouvez ensuite leur montrer une publicité <GStrong>rien que pour eux</GStrong> — « Vous avez regardé notre formation, voici 20 % de réduction ce week-end ». Ces personnes vous connaissent déjà : elles convertissent 3 à 5 fois mieux qu'un public froid, pour un coût bien plus bas. C'est le reciblage, et c'est là que se cachent la plupart de vos ventes perdues.
        </GP>
        <GH3>3. Optimiser automatiquement vos campagnes</GH3>
        <GP>
          Quand le pixel renvoie les achats à la régie, l'algorithme de Facebook ou TikTok apprend <GStrong>à quoi ressemble votre acheteur</GStrong> et va chercher des profils similaires, tout seul. Sans cette donnée, l'algorithme optimise pour des clics — pas pour des ventes. Avec elle, il optimise pour l'argent qui rentre. La différence sur une même campagne peut être du simple au triple.
        </GP>
        <GStats
          items={[
            { value: "×3 à ×5", label: "meilleure conversion d'un public reciblé vs un public froid" },
            { value: "−40 %", label: "de coût par vente typique quand l'algorithme optimise sur l'achat" },
            { value: "1 seule", label: "installation pour débloquer les 3 pouvoirs du pixel" },
          ]}
        />
      </>
    ),
  },
  {
    id: "novakou-natif",
    label: "Novakou pose vos pixels nativement, partout",
    content: (
      <>
        <GP>
          Voici ce qui rend Novakou différent : la plateforme pose vos pixels <GStrong>nativement sur toutes vos pages</GStrong>, sans plugin, sans développeur, sans manipuler de code. Que la vente se joue sur une page produit, dans le checkout ou via un simple lien de paiement partagé sur WhatsApp, le suivi fonctionne partout, de la même manière.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Analyse de données de conversion et statistiques de campagnes publicitaires sur écran"
          caption="Un seul identifiant collé dans Novakou couvre pages produit, checkout et liens de paiement."
        />
        <GP>
          Concrètement, Novakou prend en charge <GStrong>cinq régies</GStrong> majeures. Vous activez celles dont vous avez besoin, une par une, en collant simplement leur identifiant :
        </GP>
        <GCards
          items={[
            { icon: "thumb_up", title: "Facebook & Instagram", text: "Le Meta Pixel, indispensable pour toute publicité sur Facebook et Instagram — les deux réseaux les plus utilisés en Afrique francophone." },
            { icon: "music_note", title: "TikTok", text: "Le TikTok Pixel, pour suivre les ventes issues de vos vidéos et de vos campagnes TikTok Ads, en pleine explosion chez les jeunes acheteurs." },
            { icon: "photo_camera", title: "Snapchat", text: "Le Snap Pixel, précieux pour toucher une audience mobile jeune, souvent moins saturée et moins chère à convertir." },
            { icon: "push_pin", title: "Pinterest", text: "Le Pinterest Tag, idéal pour les produits visuels : templates, e-books, packs Canva, coaching lifestyle." },
            { icon: "search", title: "Google", text: "Le suivi Google Ads et Google Analytics, pour mesurer vos campagnes Search, YouTube et votre trafic organique." },
            { icon: "layers", title: "Toutes vos pages", text: "Produit, checkout et liens de paiement : chaque page publique de votre boutique déclenche les événements automatiquement." },
          ]}
        />
        <GCallout variant="tip" title="Vous pouvez cumuler plusieurs pixels">
          Rien ne vous oblige à choisir. Vous pouvez activer Facebook + TikTok + Google en même temps si vous faites de la publicité sur ces trois canaux. Chaque régie reçoit ses propres événements, en parallèle, sans conflit.
        </GCallout>
      </>
    ),
  },
  {
    id: "recuperer-id-facebook",
    label: "Récupérer votre ID de pixel Facebook (Meta)",
    content: (
      <>
        <GP>
          Commençons par le plus important en Afrique francophone : le <GStrong>Meta Pixel</GStrong>, qui couvre à la fois Facebook et Instagram. Vous le trouvez dans le <GStrong>Gestionnaire d'événements</GStrong> (Events Manager) de Meta Business Suite.
        </GP>
        <GUl>
          <GLi>Rendez-vous sur <GStrong>business.facebook.com</GStrong> et ouvrez le menu <GStrong>Gestionnaire d'événements</GStrong> (Events Manager).</GLi>
          <GLi>Si vous n'avez pas encore de pixel, cliquez sur <GStrong>Connecter des sources de données → Web</GStrong>, puis créez un nouveau pixel et donnez-lui un nom (ex. « Boutique Novakou »).</GLi>
          <GLi>Une fois le pixel créé, son <GStrong>identifiant</GStrong> apparaît : c'est une suite de 15 à 16 chiffres, du type <GStrong>1234567890123456</GStrong>.</GLi>
          <GLi>Copiez uniquement ce numéro. C'est lui que vous collerez dans Novakou.</GLi>
        </GUl>
        <GCallout variant="info" title="Vous n'avez pas besoin du code, juste du numéro">
          Meta vous proposera d'installer le code manuellement ou via un partenaire. Ignorez ces options : sur Novakou, seul l'identifiant numérique compte. Ne copiez pas le bloc de code JavaScript, uniquement l'ID.
        </GCallout>
        <GP>
          Astuce pour un vendeur au Sénégal ou en Côte d'Ivoire : créez votre pixel <GStrong>avant</GStrong> de lancer votre première campagne, même si vous n'êtes pas encore prêt à faire de la pub. Le pixel commencera à collecter des données dès que du trafic arrivera sur votre boutique, et vous aurez déjà une audience quand vous déciderez de payer pour de la publicité.
        </GP>
      </>
    ),
  },
  {
    id: "recuperer-id-autres",
    label: "Récupérer votre ID sur TikTok, Snapchat, Pinterest & Google",
    content: (
      <>
        <GP>
          Le principe est le même partout : chaque régie vous fournit un identifiant unique que vous copiez, sans jamais toucher au code. Voici où le trouver sur chacune.
        </GP>
        <GH3>TikTok</GH3>
        <GP>
          Ouvrez <GStrong>TikTok Ads Manager</GStrong>, allez dans <GStrong>Outils → Événements → Événements du site web</GStrong>. Créez un pixel « Configuration manuelle » : TikTok génère un <GStrong>Pixel ID</GStrong> (une suite alphanumérique). Copiez-le, c'est tout ce dont Novakou a besoin.
        </GP>
        <GH3>Snapchat</GH3>
        <GP>
          Dans <GStrong>Snapchat Ads Manager</GStrong>, ouvrez <GStrong>Gestion d'événements</GStrong> (Events Manager) et créez un <GStrong>Snap Pixel</GStrong>. Snapchat vous fournit un <GStrong>Pixel ID</GStrong> au format identifiant (souvent avec des tirets). Récupérez cet identifiant.
        </GP>
        <GH3>Pinterest</GH3>
        <GP>
          Dans <GStrong>Pinterest Business → Ads → Conversions</GStrong>, créez un <GStrong>Pinterest Tag</GStrong>. Pinterest génère un <GStrong>Tag ID</GStrong> numérique. Copiez-le.
        </GP>
        <GH3>Google</GH3>
        <GP>
          Deux cas selon votre besoin. Pour <GStrong>Google Analytics 4</GStrong>, récupérez l'<GStrong>ID de mesure</GStrong> au format <GStrong>G-XXXXXXXXXX</GStrong> (Administration → Flux de données). Pour <GStrong>Google Ads</GStrong>, récupérez votre <GStrong>ID de conversion</GStrong> au format <GStrong>AW-XXXXXXXXXX</GStrong> (Outils → Conversions). Collez celui qui correspond à votre objectif.
        </GP>
        <GCallout variant="tip" title="Notez vos identifiants au même endroit">
          Gardez tous vos ID (Facebook, TikTok, Snapchat, Pinterest, Google) dans une note ou un fichier. Vous les recollerez peut-être un jour, et cela évite de retourner fouiller dans chaque plateforme. Un créateur à Douala qui gère trois pixels gagne un temps précieux à les avoir sous la main.
        </GCallout>
      </>
    ),
  },
  {
    id: "ajouter-dans-novakou",
    label: "Ajouter le pixel dans Novakou (Marketing → Pixels)",
    content: (
      <>
        <GP>
          C'est ici que la magie opère. Une fois vos identifiants en main, l'installation dans Novakou prend moins de deux minutes, sans aucune compétence technique.
        </GP>
        <GCards
          items={[
            { icon: "login", title: "1. Ouvrez Marketing → Pixels", text: "Depuis votre tableau de bord vendeur Novakou, rendez-vous dans la section Marketing, puis dans l'onglet Pixels." },
            { icon: "content_paste", title: "2. Collez votre identifiant", text: "Choisissez la régie (Facebook, TikTok, Snapchat, Pinterest, Google) et collez l'ID copié depuis sa plateforme." },
            { icon: "toggle_on", title: "3. Activez le suivi", text: "Enregistrez. Le pixel est immédiatement actif sur toutes vos pages — produit, checkout et liens de paiement." },
            { icon: "verified", title: "4. Répétez si besoin", text: "Ajoutez d'autres régies de la même façon. Chacune cohabite sans conflit et reçoit ses propres événements." },
          ]}
        />
        <GP>
          Aucun fichier à modifier, aucun développeur à payer, aucun risque de casser votre boutique. Novakou insère le bon code, au bon endroit, avec les bons événements — vous vous contentez de coller un numéro. C'est exactement cette simplicité qui fait de Novakou <GStrong>la plateforme n°1 de vente de produits numériques en Afrique francophone</GStrong> : la puissance des grands outils, sans leur complexité.
        </GP>
        <GCallout variant="success" title="Un seul geste, toutes les pages couvertes">
          Contrairement à un site classique où il faut coller le code sur chaque page, ici un seul enregistrement suffit. Votre lien de paiement partagé sur WhatsApp est suivi exactement comme votre page produit ou votre checkout. Rien ne passe à travers les mailles.
        </GCallout>
      </>
    ),
  },
  {
    id: "evenements-suivis",
    label: "Les événements suivis : ViewContent, InitiateCheckout, Purchase",
    content: (
      <>
        <GP>
          Un pixel bien installé ne compte pas seulement les visites : il envoie des <GStrong>événements standards</GStrong>, reconnus par toutes les régies, qui décrivent précisément ce que fait le visiteur. Novakou déclenche automatiquement les trois plus importants.
        </GP>
        <GUl>
          <GLi>
            <GStrong>ViewContent (vue de produit)</GStrong> — se déclenche quand quelqu'un consulte une page produit. C'est le signal « ce visiteur est intéressé » qui alimente vos audiences de reciblage.
          </GLi>
          <GLi>
            <GStrong>InitiateCheckout (début de paiement)</GStrong> — se déclenche quand le visiteur entre dans le checkout. C'est le signal « intention d'achat forte » : ces gens sont à un cheveu de la vente, ce sont vos meilleures cibles de relance.
          </GLi>
          <GLi>
            <GStrong>Purchase (achat)</GStrong> — se déclenche à la vente confirmée, <GStrong>avec le montant exact en FCFA</GStrong>. C'est le Graal : il permet à l'algorithme de calculer votre retour sur dépense publicitaire et d'optimiser pour l'argent, pas pour les clics.
          </GLi>
        </GUl>
        <GP>
          Le fait que l'événement Purchase remonte <GStrong>avec sa valeur</GStrong> change tout. La régie sait qu'une campagne a généré 180 000 FCFA de ventes pour 40 000 FCFA de budget, et elle va spontanément pousser vers les profils qui ressemblent à vos acheteurs les plus rentables. Pour un e-book vendu 3 500 FCFA à Cotonou comme pour un coaching à 75 000 FCFA à Abidjan, la mécanique est la même — et redoutablement efficace.
        </GP>
        <GCallout variant="info" title="Ces événements alimentent l'IA des régies">
          Les algorithmes de Meta, TikTok et Google sont extrêmement performants — mais seulement si on les nourrit. Les événements ViewContent, InitiateCheckout et Purchase sont exactement le carburant dont ils ont besoin pour trouver vos futurs clients à votre place.
        </GCallout>
      </>
    ),
  },
  {
    id: "verifier",
    label: "Vérifier que votre pixel fonctionne vraiment",
    content: (
      <>
        <GP>
          Installer un pixel sans vérifier qu'il « tire » (qu'il envoie bien ses événements), c'est repartir à l'aveugle. Heureusement, la vérification est simple et gratuite.
        </GP>
        <GH3>La méthode la plus fiable : le testeur de la régie</GH3>
        <GUl>
          <GLi>
            <GStrong>Facebook</GStrong> : dans le Gestionnaire d'événements, ouvrez l'onglet <GStrong>Événements de test</GStrong>, saisissez l'URL de votre boutique, puis naviguez sur votre page produit. Vous devez voir apparaître ViewContent en temps réel.
          </GLi>
          <GLi>
            <GStrong>L'extension navigateur</GStrong> : installez « Meta Pixel Helper » (ou l'équivalent TikTok) sur Chrome. Une petite icône vous indique, sur chaque page, si le pixel est détecté et quels événements se déclenchent.
          </GLi>
          <GLi>
            <GStrong>Un achat test</GStrong> : réalisez une commande à petit prix sur votre propre boutique. L'événement Purchase, avec son montant, doit remonter dans le tableau de bord de la régie sous quelques minutes.
          </GLi>
        </GUl>
        <GCallout variant="warning" title="Erreur fréquente : le mauvais identifiant">
          90 % des « pixels qui ne marchent pas » viennent d'un ID mal copié — un espace en trop, un caractère manquant, ou l'ID d'un autre compte publicitaire. Si rien ne remonte, revérifiez d'abord que l'identifiant collé dans Novakou correspond exactement à celui de votre Events Manager.
        </GCallout>
        <GP>
          Une fois que vous voyez vos trois événements se déclencher, vous êtes prêt. Vous pouvez lancer vos campagnes en sachant que chaque euro et chaque franc CFA dépensés seront mesurés, attribués et optimisés.
        </GP>
      </>
    ),
  },
  {
    id: "reciblage-optimisation",
    label: "Utiliser le pixel pour le reciblage et l'optimisation",
    content: (
      <>
        <GP>
          Votre pixel installé et vérifié, vous détenez maintenant un actif qui prend de la valeur chaque jour. Voici comment le faire travailler.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Icônes de réseaux sociaux sur un smartphone symbolisant le reciblage publicitaire multi-plateformes"
          caption="Reciblage et audiences similaires : votre pixel transforme chaque visiteur en future vente."
        />
        <GH3>Le reciblage : récupérer les ventes perdues</GH3>
        <GP>
          La majorité des visiteurs n'achètent pas à la première visite — c'est normal, en Afrique comme partout. Grâce au pixel, vous créez dans votre régie une <GStrong>audience personnalisée</GStrong> des gens qui ont vu votre produit ou commencé à payer sans finir. Vous leur diffusez ensuite une pub ciblée : témoignage d'un client satisfait, rappel d'une offre à durée limitée, ou petite réduction. Ce sont vos ventes les moins chères à conclure, car ces personnes vous connaissent déjà.
        </GP>
        <GH3>L'audience similaire : cloner vos meilleurs clients</GH3>
        <GP>
          À partir de vos acheteurs (événement Purchase), les régies savent créer une <GStrong>audience similaire</GStrong> (lookalike) : des dizaines de milliers de personnes qui ressemblent à vos clients actuels, dans les mêmes pays. C'est le moyen le plus puissant d'agrandir votre marché sans deviner votre cible. Un vendeur de formations à Yaoundé peut ainsi toucher, au Cameroun et au-delà, des profils quasi identiques à ceux qui achètent déjà.
        </GP>
        <GH3>L'optimisation pour l'achat</GH3>
        <GP>
          Enfin, réglez toujours vos campagnes pour optimiser sur l'<GStrong>événement Purchase</GStrong>, jamais sur les clics ou les vues. Vous direz à l'algorithme : « trouve-moi des gens qui achètent », pas « trouve-moi des gens qui cliquent ». C'est cette bascule, rendue possible uniquement par le pixel, qui sépare une campagne qui brûle du budget d'une campagne qui multiplie votre chiffre.
        </GP>
        <GP>
          Pour aller plus loin, nos guides détaillés vous accompagnent : <GA href="/guides/publicite-facebook">les bases de la publicité Facebook</GA>, <GA href="/guides/lancer-pub-facebook-instagram-vendre-boutique">lancer une pub Facebook & Instagram pour vendre votre boutique</GA>, et <GA href="/guides/lancer-pub-tiktok-produits-digitaux">lancer une pub TikTok pour vos produits digitaux</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Passez à l'action dès aujourd'hui",
    content: (
      <>
        <GP>
          Le pixel n'est pas une option réservée aux gros annonceurs : c'est le b.a.-ba de toute publicité rentable, du premier e-book vendu à 2 500 FCFA jusqu'aux campagnes à plusieurs centaines de milliers de francs. Et sur Novakou, il n'y a aucune barrière technique — juste un numéro à coller.
        </GP>
        <GUl>
          <GLi><GStrong>Créez vos pixels</GStrong> sur les régies où vous ferez de la pub (Facebook en priorité, puis TikTok, Snapchat, Pinterest, Google selon vos canaux).</GLi>
          <GLi><GStrong>Copiez chaque identifiant</GStrong> depuis son Events Manager respectif.</GLi>
          <GLi><GStrong>Collez-les dans Novakou</GStrong>, section Marketing → Pixels, en moins de deux minutes.</GLi>
          <GLi><GStrong>Vérifiez</GStrong> que ViewContent, InitiateCheckout et Purchase se déclenchent.</GLi>
          <GLi><GStrong>Lancez vos campagnes</GStrong>, créez vos audiences de reciblage, et optimisez sur l'achat.</GLi>
        </GUl>
        <GP>
          Une boutique Novakou avec ses pixels bien posés, c'est une machine à ventes qui apprend et s'améliore toute seule à chaque commande. Pour découvrir tout ce que la plateforme sait faire au-delà des pixels, lisez notre panorama complet : <GA href="/guides/novakou-fonctionnalites-completes">toutes les fonctionnalités de Novakou</GA>.
        </GP>
        <GCallout variant="success" title="Votre suivi commence par votre boutique">
          Pas encore de boutique ? Vous ne pouvez pas installer de pixel sans pages à suivre. La première étape, gratuite et sans engagement, est de créer votre espace vendeur — vous poserez vos pixels juste après.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Ai-je besoin de savoir coder pour installer un pixel sur Novakou ?",
    a: "Non, absolument pas. Vous n'écrivez ni ne copiez aucune ligne de code. Vous récupérez un simple identifiant numérique sur la plateforme publicitaire (Facebook, TikTok, etc.) et vous le collez dans Novakou, section Marketing → Pixels. La plateforme insère automatiquement le bon code sur toutes vos pages.",
  },
  {
    q: "Quels pixels puis-je installer sur Novakou ?",
    a: "Cinq régies sont prises en charge nativement : Facebook & Instagram (Meta Pixel), TikTok, Snapchat, Pinterest et Google (Analytics et Ads). Vous pouvez en activer plusieurs en même temps ; chacune reçoit ses propres événements sans conflit.",
  },
  {
    q: "Sur quelles pages le pixel se déclenche-t-il ?",
    a: "Sur toutes vos pages publiques : pages produit, checkout et liens de paiement partagés (par exemple sur WhatsApp). Un seul enregistrement suffit pour couvrir l'ensemble, contrairement à un site classique où il faut poser le code page par page.",
  },
  {
    q: "Quels événements Novakou envoie-t-il aux régies ?",
    a: "Les trois événements standards les plus importants : ViewContent (vue d'un produit), InitiateCheckout (début de paiement) et Purchase (achat confirmé, avec son montant exact en FCFA). C'est le montant qui permet aux algorithmes d'optimiser vos campagnes pour les ventes réelles.",
  },
  {
    q: "Comment vérifier que mon pixel fonctionne ?",
    a: "Utilisez l'outil « Événements de test » de votre régie, une extension navigateur comme Meta Pixel Helper, ou réalisez un petit achat test sur votre boutique. Vous devez voir ViewContent, InitiateCheckout et Purchase remonter en temps réel. Si rien n'apparaît, revérifiez que l'identifiant collé est exactement le bon.",
  },
  {
    q: "À quoi sert vraiment un pixel pour un petit vendeur en Afrique ?",
    a: "À arrêter de dépenser à l'aveugle. Il vous permet de savoir quelle publicité rapporte, de recibler les visiteurs qui n'ont pas acheté (des ventes 3 à 5 fois plus faciles à conclure), et de laisser l'algorithme trouver des acheteurs similaires aux vôtres. Même avec un budget modeste, un pixel rend chaque franc CFA investi bien plus rentable.",
  },
];

export default function InstallerPixelFacebookTiktok() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
