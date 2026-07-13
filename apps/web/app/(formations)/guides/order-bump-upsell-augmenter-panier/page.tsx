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
  slug: "order-bump-upsell-augmenter-panier",
  title: "Order bump, upsell et down-sell : augmenter son panier moyen",
  subtitle:
    "Le vrai levier de revenu n'est pas plus de visiteurs, c'est un panier moyen plus élevé. Order bump, upsell, down-sell, cross-sell : comment vendre plus à chaque client, avec un exemple chiffré en FCFA et la mise en place dans votre tunnel Novakou.",
  category: "Vendre",
  level: "Intermédiaire",
  levelColor: "#7c3aed",
  gradient: "linear-gradient(135deg, #2e1065, #7c3aed 60%, #22c55e)",
  icon: "trending_up",
  time: "15 min",
  chapters: "10 sections",
  publishedAt: "2026-07-13",
  updatedAt: "2026-07-13",
  keywords: [
    "order bump",
    "upsell downsell vente en ligne",
    "augmenter panier moyen",
    "vente additionnelle produit digital",
    "maximiser revenu par client Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Order bump, upsell et down-sell : augmenter son panier moyen | Novakou";
const SEO_DESCRIPTION =
  "Order bump, upsell, down-sell, cross-sell : le guide complet pour augmenter votre panier moyen et maximiser le revenu par client. Exemple chiffré en FCFA et mise en place dans le tunnel Novakou.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Order bump, upsell et down-sell",
)}&subtitle=${encodeURIComponent(
  "Augmenter son panier moyen sur Novakou",
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
  src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Panier moyen en hausse pour un vendeur de produits numériques en Afrique",
  caption: "Le même client, la même publicité — mais un panier deux fois plus gros grâce aux ventes additionnelles.",
};

const stats = [
  { value: "+30 à 80 %", label: "de panier moyen possible avec bump + upsell" },
  { value: "1 clic", label: "pour ajouter une offre après l'achat" },
  { value: "0 FCFA", label: "de publicité en plus pour ce revenu additionnel" },
  { value: "10 à 40 %", label: "des acheteurs cochent un order bump pertinent" },
];

const sections: GuideSection[] = [
  {
    id: "vrai-levier",
    label: "Le vrai levier de revenu n'est pas le trafic",
    content: (
      <>
        <GP>
          La plupart des créateurs africains se posent une seule question quand ils veulent gagner plus : <GStrong>« comment amener plus de monde sur ma page ? »</GStrong>. Plus de publicité, plus de posts, plus de followers. C'est le réflexe naturel — mais c'est aussi le plus coûteux et le plus fragile. Le trafic se paie, il fluctue, et un algorithme qui change peut couper votre robinet du jour au lendemain.
        </GP>
        <GP>
          Il existe un levier bien plus rentable, et surtout <GStrong>gratuit</GStrong> : augmenter ce que dépense chaque client qui achète déjà. C'est le panier moyen. Si vous faites passer votre panier moyen de 15 000 à 25 000 FCFA sur le même nombre de ventes, vous gagnez 66 % de plus sans dépenser un franc de publicité supplémentaire. Le visiteur est déjà là, il a déjà sorti sa carte ou son Wave — c'est le moment le plus précieux de toute la relation commerciale.
        </GP>
        <GP>
          Trois chiffres pilotent votre chiffre d'affaires : le nombre de visiteurs, le taux de conversion, et le panier moyen. Travailler le trafic est difficile et cher. Travailler le panier moyen est facile, immédiat, et ne dépend que de vous. C'est le sujet de ce guide.
        </GP>
        <GStats
          items={[
            { value: "3", label: "leviers de CA : trafic, conversion, panier moyen" },
            { value: "×2", label: "le panier moyen sans doubler le trafic" },
            { value: "Gratuit", label: "aucune dépense publicitaire additionnelle" },
          ]}
        />
        <GCallout variant="tip" title="La règle d'or">
          Il est cinq à dix fois plus cher d'attirer un nouveau client que de vendre davantage à un client déjà en train d'acheter. Les vendeurs qui gagnent le mieux ne sont pas ceux qui ont le plus de trafic, mais ceux qui monétisent le mieux chaque acheteur.
        </GCallout>
      </>
    ),
  },
  {
    id: "definitions",
    label: "Order bump, upsell, down-sell, cross-sell : les définitions",
    content: (
      <>
        <GP>
          Ces termes anglais font souvent peur, alors qu'ils décrivent des choses très simples que tout vendeur de marché connaît instinctivement. Voici les quatre mécaniques de vente additionnelle, sans jargon.
        </GP>
        <GH3>Order bump</GH3>
        <GP>
          C'est une <GStrong>petite offre présentée par une case à cocher, directement sur la page de paiement</GStrong>, juste avant que le client valide. Il voit son produit à 15 000 FCFA, et juste en dessous : « ☐ Ajoutez le pack de modèles pour seulement 4 000 FCFA de plus ». Un clic, et le montant s'ajoute au paiement en cours. Le client ne quitte jamais le checkout.
        </GP>
        <GH3>Upsell (vente montée)</GH3>
        <GP>
          C'est une offre présentée <GStrong>juste après l'achat</GStrong>, sur une page dédiée, en général en un clic (le client a déjà payé, sa méthode de paiement est enregistrée). « Merci pour votre achat ! Voulez-vous ajouter 3 séances de coaching à 20 000 FCFA ? » L'upsell est souvent une offre plus chère, complémentaire, qui prolonge la première.
        </GP>
        <GH3>Down-sell (offre de repli)</GH3>
        <GP>
          Si le client <GStrong>refuse l'upsell</GStrong>, on ne le laisse pas partir les mains vides : on lui propose une version plus légère et moins chère. Il a dit non aux 3 séances de coaching à 20 000 ? On lui propose alors une seule séance à 8 000 FCFA, ou l'enregistrement d'un atelier de groupe à 5 000. C'est le repli intelligent qui récupère une partie des « non ».
        </GP>
        <GH3>Cross-sell (vente croisée)</GH3>
        <GP>
          C'est proposer un <GStrong>produit connexe</GStrong> mais différent — la logique du « ceux qui ont acheté ceci ont aussi aimé cela ». Un acheteur de votre formation en montage vidéo peut se voir proposer votre pack de sons et transitions. Le cross-sell peut vivre dans un order bump, un upsell ou même un e-mail après-vente.
        </GP>
        <GCards
          items={[
            { icon: "check_box", title: "Order bump", text: "Case à cocher sur le checkout, avant de payer. Petite offre complémentaire, ajout en un clic." },
            { icon: "arrow_upward", title: "Upsell", text: "Offre en un clic juste après l'achat. Souvent plus chère et complémentaire." },
            { icon: "arrow_downward", title: "Down-sell", text: "Offre de repli, plus légère et moins chère, présentée si l'upsell est refusé." },
            { icon: "swap_horiz", title: "Cross-sell", text: "Produit connexe mais différent, dans la logique « souvent achetés ensemble »." },
          ]}
        />
      </>
    ),
  },
  {
    id: "psychologie",
    label: "La psychologie : le client est déjà en mode achat",
    content: (
      <>
        <GP>
          Pourquoi ces techniques fonctionnent-elles aussi bien ? Parce qu'elles exploitent un moment mental très particulier : celui où le client a <GStrong>déjà décidé d'acheter</GStrong>. La plus grande barrière dans toute vente, c'est de passer de « je regarde » à « je paie ». Une fois cette barrière franchie, le client est dans un état d'esprit ouvert, confiant, engagé. Sortir sa carte une première fois est difficile ; la deuxième fois, quelques secondes plus tard, ne coûte presque rien psychologiquement.
        </GP>
        <GP>
          C'est le principe de la <GStrong>cohérence</GStrong> : quelqu'un qui vient d'agir dans un sens (acheter votre formation) reste naturellement cohérent avec cette action (accepter le complément qui la rend meilleure). C'est exactement ce que fait le vendeur de téléphones qui vous propose la coque et le film de protection au moment de payer, ou le supermarché qui aligne les chewing-gums en caisse. Ces offres ne sont pas là par hasard.
        </GP>
        <GP>
          En Afrique francophone, cette logique est encore plus forte dans la vente sur WhatsApp et les réseaux : le client a déjà négocié, déjà fait confiance, déjà envoyé son Mobile Money. Lui proposer un complément pertinent à ce moment précis n'est pas de la pression — c'est un service. Vous lui évitez de revenir plus tard, de re-payer des frais, de refaire tout le parcours.
        </GP>
        <GCallout variant="info" title="Vendre plus n'est pas être insistant">
          Une bonne vente additionnelle aide vraiment le client à atteindre son objectif. La formatrice qui vend une méthode de couture et propose les patrons imprimables en bump ne « force » pas — elle rend son produit plus utile. Si l'offre est pertinente, le client vous remercie.
        </GCallout>
      </>
    ),
  },
  {
    id: "order-bump-detail",
    label: "L'order bump en détail : la case qui rapporte",
    content: (
      <>
        <GP>
          L'order bump est la vente additionnelle la plus simple à mettre en place et souvent la plus rentable au ratio effort/revenu. C'est une simple case à cocher sur la page de paiement, avec un titre accrocheur, une courte description et un prix. Bien conçu, un order bump pertinent est coché par <GStrong>10 à 40 % des acheteurs</GStrong> — un chiffre énorme quand on pense qu'il ne demande aucun travail supplémentaire une fois configuré.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Interface de paiement montrant une case order bump à cocher avant de payer"
          caption="L'order bump : une case, une petite offre, un ajout en un clic — sans jamais quitter le checkout."
        />
        <GP>
          Les règles d'un bon order bump sont simples. D'abord, il doit être <GStrong>complémentaire et de faible prix</GStrong> par rapport au produit principal — en général entre 20 % et 50 % du prix de base. On n'ajoute pas une offre à 30 000 FCFA sur un produit à 10 000. Ensuite, il doit être <GStrong>immédiatement compréhensible</GStrong> : le client lit une phrase et comprend la valeur. Enfin, il doit créer une petite urgence ou un sentiment de bonne affaire (« uniquement ici », « ajouté à votre commande pour X de moins »).
        </GP>
        <GH3>De bons exemples d'order bump</GH3>
        <GUl>
          <GLi>Formation vidéo à 15 000 FCFA → bump « Les modèles et checklists prêts à l'emploi (4 000 FCFA) ».</GLi>
          <GLi>Ebook de recettes à 3 000 FCFA → bump « La liste de courses imprimable + planning de la semaine (1 500 FCFA) ».</GLi>
          <GLi>Pack de templates Canva à 8 000 FCFA → bump « 30 modèles de stories supplémentaires (3 000 FCFA) ».</GLi>
          <GLi>Coaching business à 25 000 FCFA → bump « Le tableur de suivi financier prérempli (5 000 FCFA) ».</GLi>
        </GUl>
        <GP>
          Pour aller plus loin sur la manière de rendre la page de paiement irrésistible, lisez notre guide <GA href="/guides/page-de-vente-qui-convertit">construire une page de vente qui convertit</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "upsell-downsell",
    label: "Upsell et down-sell : l'offre d'après et le repli",
    content: (
      <>
        <GP>
          Après le paiement, le client atterrit sur une page de remerciement. C'est là que se joue l'upsell. Comme sa méthode de paiement est déjà enregistrée, il peut accepter votre offre <GStrong>en un seul clic</GStrong>, sans ressaisir ses informations. Cette absence de friction est ce qui rend l'upsell si puissant : la seule chose qui reste, c'est la décision « oui, je veux ça aussi ».
        </GP>
        <GP>
          L'upsell doit être une <GStrong>montée en valeur logique</GStrong>. Quelqu'un qui vient d'acheter votre formation « lancer sa boutique » est le candidat parfait pour un accompagnement personnalisé, un modèle avancé, ou un accès à une communauté. Le fil doit être évident : « vous avez la méthode, voici comment aller deux fois plus vite ».
        </GP>
        <GH3>Le down-sell : ne jamais gaspiller un « non »</GH3>
        <GP>
          Beaucoup de clients refuseront l'upsell — et c'est normal. L'erreur serait de les laisser partir sans rien proposer d'autre. Le down-sell est le filet de sécurité : une version <GStrong>plus légère, plus abordable</GStrong>, du même bénéfice. Le client a dit non à l'accompagnement complet à 30 000 FCFA ? Proposez l'enregistrement d'un atelier de groupe à 7 000, ou un simple appel de 20 minutes à 5 000. Vous récupérez ainsi une partie des acheteurs qui, sinon, seraient partis.
        </GP>
        <GP>
          En cascade, cela donne une séquence redoutable : produit principal → order bump → upsell → down-sell si refus. Chaque étape capte un segment différent de votre clientèle, selon son budget et son besoin du moment.
        </GP>
        <GCallout variant="warning" title="Une seule offre à la fois">
          La tentation est d'enchaîner cinq upsells d'affilée. Ne le faites pas. Après deux offres additionnelles maximum, le client se sent harcelé et son enthousiasme retombe. Mieux vaut un upsell excellent et bien ciblé qu'une avalanche d'offres qui abîment votre relation.
        </GCallout>
      </>
    ),
  },
  {
    id: "quoi-proposer",
    label: "Quoi proposer comme offre additionnelle",
    content: (
      <>
        <GP>
          La bonne offre additionnelle n'est pas un produit au hasard : c'est ce qui rend le premier achat <GStrong>plus efficace, plus rapide ou plus complet</GStrong>. Voici les grandes familles qui marchent le mieux pour les créateurs de produits numériques en Afrique francophone.
        </GP>
        <GCards
          items={[
            { icon: "description", title: "Le complément « prêt à l'emploi »", text: "Modèles, templates, checklists, tableurs préremplis qui font gagner du temps sur ce que la formation enseigne. Idéal en order bump." },
            { icon: "support_agent", title: "Le coaching ou l'accompagnement", text: "Séances individuelles, audit personnalisé, appel de démarrage. Idéal en upsell — forte valeur perçue, prix plus élevé." },
            { icon: "workspace_premium", title: "L'accès VIP ou communauté", text: "Groupe privé, sessions de questions-réponses, contenus bonus mensuels. Parfait pour introduire un abonnement récurrent." },
            { icon: "inventory_2", title: "Le pack ou le bundle", text: "Regrouper plusieurs produits à un prix groupé avantageux. Le client a l'impression de faire une excellente affaire." },
          ]}
        />
        <GP>
          Quelques déclinaisons concrètes, marché par marché :
        </GP>
        <GUl>
          <GLi>Une formatrice à <GStrong>Dakar</GStrong> vend une méthode de e-commerce et propose en upsell un audit personnalisé de la boutique de l'élève.</GLi>
          <GLi>Un coach à <GStrong>Abidjan</GStrong> vend un programme de remise en forme et ajoute en bump le plan de repas imprimable adapté aux produits locaux.</GLi>
          <GLi>Un créateur de templates à <GStrong>Douala</GStrong> vend un pack de visuels Instagram et propose en cross-sell son pack de légendes prêtes à publier.</GLi>
          <GLi>Un auteur à <GStrong>Cotonou</GStrong> vend un ebook de développement personnel et propose en VIP l'accès à un groupe de discussion mensuel.</GLi>
        </GUl>
        <GP>
          Dans tous les cas, l'offre additionnelle prolonge naturellement la promesse initiale. Si vous hésitez sur ce que vaut réellement votre offre principale, notre guide <GA href="/guides/fixer-prix-formation">bien fixer le prix de sa formation</GA> pose les bases.
        </GP>
      </>
    ),
  },
  {
    id: "fixer-prix",
    label: "Comment fixer le prix des offres additionnelles",
    content: (
      <>
        <GP>
          Le prix d'une offre additionnelle ne se fixe pas comme celui d'un produit vendu seul. La logique est différente : on cherche le prix qui maximise le <GStrong>nombre de clients qui disent oui sans réfléchir longtemps</GStrong>, tout en ajoutant une somme réelle au panier.
        </GP>
        <GH3>La règle du bump : petit par rapport au principal</GH3>
        <GP>
          Un order bump devrait coûter entre <GStrong>20 % et 50 %</GStrong> du produit principal. Sur une formation à 15 000 FCFA, un bump entre 3 000 et 7 000 fonctionne bien. Au-delà, le client réfléchit trop et l'effet « ajout impulsif » disparaît. L'order bump gagne par le volume de « oui », pas par un gros prix unitaire.
        </GP>
        <GH3>La règle de l'upsell : montée en valeur assumée</GH3>
        <GP>
          L'upsell peut être <GStrong>plus cher que le produit principal</GStrong>, parce qu'il apporte une valeur nettement supérieure (accompagnement humain, gain de temps massif, résultat garanti). Un upsell entre 1 et 3 fois le prix du produit de base est courant. La clé : la valeur perçue doit sauter aux yeux en une phrase.
        </GP>
        <GH3>La règle du down-sell : le seuil du « allez, d'accord »</GH3>
        <GP>
          Le down-sell doit tomber à un prix où le refus devient absurde — souvent <GStrong>30 % à 50 %</GStrong> du prix de l'upsell refusé. C'est le prix du « pourquoi pas, à ce tarif-là ». Il vaut mieux encaisser 5 000 FCFA de plus que zéro.
        </GP>
        <GCallout variant="tip" title="Pensez en valeur, pas en coût">
          Un client n'achète pas des « minutes de coaching » ou des « fichiers ». Il achète un résultat : gagner du temps, éviter une erreur, obtenir plus vite ce qu'il veut. Formulez toujours le prix face à ce résultat — « 5 000 FCFA pour économiser 10 heures de travail » se vend tout seul.
        </GCallout>
      </>
    ),
  },
  {
    id: "exemple-chiffre",
    label: "Exemple chiffré : de 15 000 à 27 000 FCFA de panier",
    content: (
      <>
        <GP>
          Rien ne vaut un cas concret. Prenons Aïcha, formatrice à Dakar, qui vend une formation vidéo « Créer et vendre ses bijoux en ligne » à <GStrong>15 000 FCFA</GStrong>. Elle fait 100 ventes par mois grâce à ses publicités et à sa page. Sans vente additionnelle, son chiffre est simple : 100 × 15 000 = <GStrong>1 500 000 FCFA</GStrong>.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Vendeuse africaine analysant la hausse de son panier moyen sur son tableau de bord"
          caption="Même trafic, même produit principal : les ventes additionnelles font passer le panier de 15 000 à 27 000 FCFA."
        />
        <GP>
          Aïcha ajoute maintenant trois offres, sans toucher à son trafic :
        </GP>
        <GUl>
          <GLi><GStrong>Order bump à 5 000 FCFA</GStrong> — « Les 50 modèles de fiches produits + la grille de prix ». Coché par 30 % des acheteurs, soit 30 personnes → 150 000 FCFA.</GLi>
          <GLi><GStrong>Upsell à 20 000 FCFA</GStrong> — « Un audit personnalisé de ta boutique par visio ». Accepté par 12 % des acheteurs, soit 12 personnes → 240 000 FCFA.</GLi>
          <GLi><GStrong>Down-sell à 8 000 FCFA</GStrong> — proposé aux 88 qui ont refusé l'upsell, accepté par 15 % d'entre eux, soit 13 personnes → 104 000 FCFA.</GLi>
        </GUl>
        <GP>
          Total additionnel : 150 000 + 240 000 + 104 000 = <GStrong>494 000 FCFA</GStrong>. Son chiffre passe de 1 500 000 à <GStrong>1 994 000 FCFA</GStrong> — soit près de <GStrong>+33 %</GStrong>, sur exactement le même nombre de visiteurs et de publicités. Et son panier moyen grimpe de 15 000 à environ 20 000 FCFA. Si elle affine ses offres (bump plus pertinent, upsell mieux formulé), elle atteint facilement 27 000 FCFA de panier moyen, doublant presque son revenu par client.
        </GP>
        <GStats
          items={[
            { value: "1,5 M", label: "FCFA sans vente additionnelle (100 ventes)" },
            { value: "+494 K", label: "FCFA ajoutés par bump + upsell + down-sell" },
            { value: "+33 %", label: "de chiffre d'affaires, même trafic" },
            { value: "27 000", label: "FCFA de panier moyen visé après optimisation" },
          ]}
        />
        <GCallout variant="success" title="Le calcul qui change tout">
          Aïcha aurait dû dépenser 33 % de publicité en plus pour obtenir ce résultat par le trafic. Avec les ventes additionnelles, elle l'obtient à coût zéro, une seule fois configuré. C'est pour ça que le panier moyen est le levier préféré des vendeurs expérimentés.
        </GCallout>
      </>
    ),
  },
  {
    id: "mise-en-place",
    label: "Mettre en place bump et upsell dans le tunnel Novakou",
    content: (
      <>
        <GP>
          La bonne nouvelle : sur Novakou, vous n'avez besoin d'aucun outil externe ni de compétence technique. L'order bump et l'upsell sont intégrés nativement au checkout et au <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente</GA>. Voici comment procéder.
        </GP>
        <GH3>Étape 1 — Préparer vos offres additionnelles</GH3>
        <GP>
          Créez d'abord les produits qui serviront de bump, d'upsell et de down-sell (un pack de modèles, une séance de coaching, un accès VIP). Ce sont des produits comme les autres dans votre boutique — vous les rattacherez ensuite à votre offre principale.
        </GP>
        <GH3>Étape 2 — Ajouter l'order bump au checkout</GH3>
        <GP>
          Dans la configuration de votre produit ou de votre tunnel, activez l'order bump, choisissez le produit complémentaire, rédigez un titre court et percutant, et fixez son prix. Il apparaîtra automatiquement comme case à cocher sur la page de paiement, en Mobile Money comme en carte.
        </GP>
        <GH3>Étape 3 — Configurer l'upsell et le down-sell après achat</GH3>
        <GP>
          Dans l'éditeur de tunnel, ajoutez une étape « upsell » après le paiement : l'acheteur la verra sur la page de remerciement, avec un bouton d'acceptation en un clic. Ajoutez ensuite une étape « down-sell » qui ne s'affiche que s'il refuse. Tout s'enchaîne visuellement, par glisser-déposer, sans écrire une ligne de code.
        </GP>
        <GCallout variant="info" title="Tout est relié au reste de votre boutique">
          Chaque vente additionnelle met à jour vos statistiques, déclenche vos automatisations et crédite l'affilié éventuel — automatiquement. Pour faire tourner ces relances et ces séquences toutes seules, voyez notre guide <GA href="/guides/automatiser-sa-boutique">automatiser sa boutique</GA>.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs",
    label: "Bonnes pratiques et erreurs à éviter",
    content: (
      <>
        <GP>
          Les ventes additionnelles sont puissantes, mais mal utilisées, elles peuvent agacer et faire fuir. Voici ce qui sépare une stratégie qui enrichit d'une stratégie qui abîme votre marque.
        </GP>
        <GH3>Les bonnes pratiques</GH3>
        <GUl>
          <GLi><GStrong>La pertinence avant tout</GStrong> — l'offre doit prolonger le produit acheté, jamais sortir de nulle part.</GLi>
          <GLi><GStrong>Une valeur évidente en une phrase</GStrong> — si le client doit réfléchir dix secondes, vous avez déjà perdu.</GLi>
          <GLi><GStrong>Un prix cohérent</GStrong> — bump modeste, upsell à forte valeur, down-sell irrésistible.</GLi>
          <GLi><GStrong>Un parcours court</GStrong> — deux offres additionnelles maximum, jamais une avalanche.</GLi>
          <GLi><GStrong>Tester et mesurer</GStrong> — regardez le taux de prise de chaque offre et ajustez le titre, le prix, le produit.</GLi>
        </GUl>
        <GH3>Les erreurs qui tuent le panier</GH3>
        <GUl>
          <GLi><GStrong>L'offre non pertinente</GStrong> — proposer un ebook de cuisine à quelqu'un qui achète une formation en comptabilité. Le client se sent incompris.</GLi>
          <GLi><GStrong>Trop d'étapes</GStrong> — quatre ou cinq écrans d'upsell d'affilée transforment l'enthousiasme en agacement, puis en demande de remboursement.</GLi>
          <GLi><GStrong>Un bump trop cher</GStrong> — au-delà de 50 % du produit principal, le réflexe impulsif disparaît.</GLi>
          <GLi><GStrong>Cacher le prix ou piéger le client</GStrong> — une case précochée à son insu détruit la confiance, votre bien le plus précieux en Afrique. La transparence gagne toujours.</GLi>
          <GLi><GStrong>Ne rien proposer du tout</GStrong> — c'est l'erreur la plus coûteuse : laisser partir un client prêt à dépenser plus.</GLi>
        </GUl>
        <GCallout variant="warning" title="Le remboursement guette la sur-vente">
          Un client à qui l'on force cinq offres finit souvent par tout annuler, y compris l'achat de départ. La règle est simple : chaque offre additionnelle doit rendre le client plus heureux, pas plus fatigué. Si vous avez un doute, retirez-la.
        </GCallout>
        <GP>
          Appliquez ces principes, et vos ventes additionnelles deviendront ce qu'elles doivent être : un service rendu au client qui, au passage, fait grimper votre revenu par acheteur — le levier le plus rentable de tout votre business.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Quelle est la différence entre un order bump et un upsell ?",
    a: "L'order bump est une case à cocher présentée sur la page de paiement, avant que le client valide : il ajoute une petite offre complémentaire en un clic sans quitter le checkout. L'upsell est une offre présentée juste après l'achat, sur une page dédiée, souvent plus chère, que le client accepte en un clic puisque sa méthode de paiement est déjà enregistrée.",
  },
  {
    q: "À quel prix fixer un order bump ?",
    a: "Un order bump fonctionne mieux entre 20 % et 50 % du prix du produit principal. Sur une formation à 15 000 FCFA, un bump entre 3 000 et 7 000 FCFA génère beaucoup de « oui » impulsifs. L'order bump gagne par le volume d'acheteurs qui cochent, pas par un prix unitaire élevé.",
  },
  {
    q: "Est-ce que ces techniques marchent en Afrique avec le Mobile Money ?",
    a: "Oui, parfaitement. Sur Novakou, l'order bump et l'upsell fonctionnent aussi bien en Mobile Money (Wave, Orange, MTN, Moov) qu'en carte bancaire. Le client ajoute l'offre en un clic dans le même paiement, sans refaire tout le parcours.",
  },
  {
    q: "Combien d'offres additionnelles proposer sans agacer le client ?",
    a: "Deux au maximum après l'achat : un upsell, puis un down-sell si l'upsell est refusé, en plus de l'order bump sur le checkout. Enchaîner quatre ou cinq offres transforme l'enthousiasme en agacement et augmente les demandes de remboursement. Mieux vaut une offre excellente que plusieurs médiocres.",
  },
  {
    q: "De combien peut augmenter mon panier moyen avec ces techniques ?",
    a: "Un order bump pertinent est coché par 10 à 40 % des acheteurs, et un upsell bien ciblé accepté par 5 à 15 %. Combinés, ils peuvent faire grimper le panier moyen de 30 à 80 %, sans une seule vente ni un franc de publicité en plus. Dans notre exemple, le panier passe de 15 000 à 27 000 FCFA.",
  },
  {
    q: "Comment activer l'order bump et l'upsell sur Novakou ?",
    a: "Tout est intégré, sans outil externe. Vous créez vos offres additionnelles comme des produits, puis vous les rattachez à votre produit ou tunnel : l'order bump s'active en case à cocher sur le checkout, l'upsell et le down-sell s'ajoutent en étapes visuelles après le paiement, par glisser-déposer, sans aucune compétence technique.",
  },
];

export default function OrderBumpUpsellPanier() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
