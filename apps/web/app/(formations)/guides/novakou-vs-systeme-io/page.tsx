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
  slug: "novakou-vs-systeme-io",
  title: "Novakou vs Systeme.io : lequel choisir pour vendre en Afrique ?",
  subtitle:
    "Comparatif honnête et détaillé de deux plateformes de vente en ligne. Systeme.io excelle sur les tunnels et l'automatisation, mais sans Mobile Money natif il reste inadapté au marché africain. Voici pourquoi Novakou réunit tout ce dont un créateur d'Afrique francophone a besoin — et comment migrer en 30 secondes.",
  category: "Vendre",
  level: "Complet",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "compare_arrows",
  time: "15 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "Novakou vs Systeme.io",
    "alternative Systeme.io Afrique",
    "Systeme.io mobile money",
    "vendre formation Afrique plateforme",
    "comparatif tunnel de vente Afrique",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Novakou vs Systeme.io : lequel choisir en Afrique ? (2026)";
const SEO_DESCRIPTION =
  "Comparatif 2026 Novakou vs Systeme.io pour vendre formations et produits digitaux en Afrique : Mobile Money, frais, tunnel, escrow, automatisation. Verdict honnête et guide de migration.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Novakou vs Systeme.io : lequel choisir en Afrique ?",
)}&subtitle=${encodeURIComponent(
  "Comparatif 2026 : Mobile Money, frais, tunnel, automatisation",
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
  alt: "Tableau de bord d'analyse des ventes en ligne affiché sur un ordinateur portable",
  caption:
    "La meilleure plateforme n'est pas la plus connue : c'est celle avec laquelle votre acheteur paie réellement, comme il en a l'habitude.",
};

const stats = [
  { value: "0", label: "moyen de paiement Mobile Money natif chez Systeme.io" },
  { value: "5", label: "moyens natifs sur Novakou : Wave, Orange, MTN, Moov, carte" },
  { value: "30 s", label: "pour importer un tunnel Systeme.io vers Novakou" },
  { value: "0 FCFA", label: "pour démarrer sur Novakou, sans abonnement" },
];

const sections: GuideSection[] = [
  {
    id: "intro",
    label: "Deux plateformes, deux philosophies",
    content: (
      <>
        <GP>
          Si vous vendez des formations, des ebooks ou du coaching depuis Dakar, Abidjan, Douala ou
          Cotonou, vous avez forcément entendu parler de <GStrong>Systeme.io</GStrong>. C'est l'un des
          outils les plus populaires de la francophonie pour construire des tunnels de vente. Et
          probablement avez‑vous aussi découvert <GStrong>Novakou</GStrong>, la plateforme n°1 de vente de
          produits numériques pensée dès le premier jour pour l'Afrique francophone. La question qui revient
          sans cesse : <GStrong>lequel choisir pour vendre en Afrique ?</GStrong>
        </GP>
        <GP>
          Ce comparatif est honnête. Systeme.io est un excellent produit, et nous allons le dire clairement
          là où il brille. Mais un bon outil au mauvais endroit reste un mauvais choix. La vraie question
          n'est pas « lequel est le meilleur dans l'absolu ? » — c'est « lequel fait <GStrong>réellement</GStrong>{" "}
          encaisser un acheteur qui paie avec Wave ou Orange Money depuis son téléphone, sans carte
          bancaire ? ». Et sur ce terrain, les deux plateformes ne jouent pas dans la même cour.
        </GP>
        <GP>
          Résumons les deux philosophies avant d'entrer dans le détail. Systeme.io est un couteau suisse du
          marketing conçu pour l'Europe : tunnels, e‑mails, automatisation, le tout piloté par un
          <GStrong> abonnement mensuel</GStrong>. Novakou est une plateforme tout‑en‑un conçue pour le
          marché africain : Mobile Money natif, tunnel de vente, paiement séquestré, automatisation et
          pixels, le tout <GStrong>gratuit pour démarrer</GStrong> avec une simple commission sur les ventes.
          L'un optimise le marketing occidental ; l'autre optimise l'encaissement africain <GStrong>et</GStrong>{" "}
          le marketing. C'est toute la différence.
        </GP>
        <GCallout variant="info" title="Ce que ce guide va trancher">
          Nous comparons les deux plateformes sur les 8 critères qui décident vraiment de vos ventes en
          Afrique, avec un tableau détaillé, une section honnête sur les cas où Systeme.io reste pertinent,
          et la marche à suivre pour migrer sans rien perdre.
        </GCallout>
      </>
    ),
  },
  {
    id: "criteres",
    label: "Les critères qui comptent vraiment en Afrique",
    content: (
      <>
        <GP>
          Un comparatif n'a de sens que si l'on compare sur les bons critères. Un créateur parisien et une
          créatrice à Bamako n'ont pas les mêmes priorités : la première encaisse en carte et cherche des
          automatisations fines, la seconde a besoin que son acheteur puisse payer en Mobile Money en 30
          secondes. Voici les 7 points sur lesquels nous notons Novakou et Systeme.io tout au long de ce
          guide.
        </GP>
        <GCards
          items={[
            {
              icon: "smartphone",
              title: "1. Mobile Money natif",
              text: "Wave, Orange Money, MTN, Moov intégrés directement. Sans lui, aucun autre critère ne compte vraiment pour une audience africaine.",
            },
            {
              icon: "payments",
              title: "2. Frais et modèle économique",
              text: "Abonnement mensuel fixe que l'on paie avant de vendre, ou commission simple qui n'est prélevée que sur une vente réelle ?",
            },
            {
              icon: "filter_alt",
              title: "3. Tunnel de vente",
              text: "Page de vente, order bump, upsell : pour vendre plus à chaque client, pas seulement encaisser une fois.",
            },
            {
              icon: "verified_user",
              title: "4. Escrow et confiance",
              text: "Paiement séquestré, protection acheteur et vendeur, contenus protégés contre le piratage.",
            },
            {
              icon: "campaign",
              title: "5. Automatisation et e‑mails",
              text: "Séquences, relances de panier abandonné, workflows conditionnels pour fidéliser sans effort.",
            },
            {
              icon: "ads_click",
              title: "6. Pixels publicitaires",
              text: "Facebook, Instagram, TikTok, Snapchat, Pinterest sur toutes les pages pour rentabiliser vos campagnes.",
            },
            {
              icon: "public",
              title: "7. Adapté à l'Afrique + diaspora",
              text: "FCFA, français, pages par pays, support qui comprend votre réalité, et carte bancaire pour la diaspora.",
            },
          ]}
        />
        <GP>
          Gardez ces sept critères en tête. Vous verrez que Systeme.io excelle sur deux d'entre eux (le
          tunnel et l'automatisation), qu'il est correct sur deux autres, et qu'il échoue sur le plus
          important pour l'Afrique — le Mobile Money. Novakou, elle, coche les sept sans compromis. C'est la
          conclusion que le reste du guide va démontrer, point par point.
        </GP>
      </>
    ),
  },
  {
    id: "systemeio",
    label: "Systeme.io : ses vraies forces",
    content: (
      <>
        <GP>
          Soyons justes : Systeme.io mérite sa popularité. Créé en France, il a démocratisé le tunnel de
          vente pour des dizaines de milliers d'entrepreneurs francophones. Voici ce qu'il fait très bien, et
          qu'il serait malhonnête de minimiser.
        </GP>
        <GH3>Un constructeur de tunnels puissant</GH3>
        <GP>
          C'est le cœur historique de Systeme.io. Vous enchaînez page de capture, page de vente, page de
          commande, page de remerciement, avec order bumps et upsells en un clic. L'éditeur est mûr, éprouvé
          par des années d'usage, et permet de construire des séquences de vente sophistiquées. Pour un
          marketeur qui vit et respire les tunnels, c'est un environnement confortable et complet.
        </GP>
        <GH3>Une automatisation marketing complète</GH3>
        <GP>
          Séquences d'e‑mails, règles conditionnelles, tags, déclencheurs, campagnes : Systeme.io propose un
          arsenal d'automatisation qui rivalise avec des outils bien plus chers. Vous pouvez relancer un
          prospect, segmenter votre audience, déclencher un e‑mail selon un comportement. C'est un vrai point
          fort, et sur ce terrain la plateforme est solide.
        </GP>
        <GH3>Un écosystème mature</GH3>
        <GP>
          Blog intégré, espaces de formation, programme d'affiliation, webinaires : Systeme.io est un
          couteau suisse. Beaucoup de créateurs européens y font tourner l'intégralité de leur business.
          L'outil est stable, documenté, et sa communauté francophone est active.
        </GP>
        <GCallout variant="success" title="Reconnaissons‑le">
          Sur le tunnel de vente et l'automatisation marketing pure, Systeme.io est un excellent outil.
          Si votre audience paie exclusivement par carte bancaire, en Europe ou en Amérique du Nord, c'est un
          choix parfaitement valable. Le problème n'est pas la qualité de l'outil — c'est le marché pour
          lequel il a été conçu.
        </GCallout>
      </>
    ),
  },
  {
    id: "mobile-money",
    label: "Le point de rupture : le Mobile Money",
    content: (
      <>
        <GP>
          Voici où tout bascule. Systeme.io a été pensé pour un monde où l'acheteur possède une carte Visa ou
          Mastercard. Or, en Afrique francophone, ce monde est minoritaire. Le taux de bancarisation reste
          faible, tandis que le <GStrong>Mobile Money est devenu le portefeuille par défaut</GStrong> de
          centaines de millions de personnes. Wave et Orange Money au Sénégal et en Côte d'Ivoire, MTN Mobile
          Money au Cameroun et au Bénin, Moov Money ailleurs : ce ne sont pas des « options en plus », ce
          sont LE moyen de payer.
        </GP>
        <GStats
          items={[
            { value: "+70 %", label: "des acheteurs perdus si vous n'acceptez que la carte" },
            { value: "0", label: "intégration Mobile Money native chez Systeme.io" },
            { value: "1 clic", label: "pour payer en Mobile Money quand c'est bien intégré" },
          ]}
        />
        <GP>
          Concrètement, que se passe‑t‑il sur Systeme.io en Afrique ? L'acheteur arrive sur une page de
          paiement qui lui demande un numéro de carte bancaire qu'il n'a pas. La vente s'arrête net. Pour
          contourner le problème, les créateurs africains doivent <GStrong>bricoler</GStrong> : brancher un
          intermédiaire de paiement tiers, jongler avec des redirections, gérer manuellement la
          réconciliation des paiements. Chaque étape ajoutée est une friction, et chaque friction fait chuter
          la conversion. Sans compter le casse‑tête du <GStrong>rapatriement des fonds</GStrong> vers un
          compte africain.
        </GP>
        <GP>
          Sur Novakou, il n'y a rien à bricoler. Wave, Orange Money, MTN Mobile Money, Moov et la carte
          bancaire sont intégrés nativement. L'acheteur de Cotonou voit son moyen préféré dès la première
          étape et paie en quelques secondes ; la tante de la diaspora à Paris paie par carte sur la même
          page. Personne n'est laissé de côté. C'est le critère n°1, et c'est celui qui, à lui seul, sépare
          une plateforme « qui encaisse en Afrique » d'une plateforme « qui pourrait encaisser en Afrique si
          on la bricole ».
        </GP>
        <GCallout variant="warning" title="Le piège des outils « globaux »">
          Systeme.io, Podia, Gumroad ou Kajabi sont d'excellents outils conçus pour l'Occident. Le Mobile
          Money y est absent ou passe par un intermédiaire fragile. Vous payez chaque mois pour des
          fonctionnalités que votre acheteur de quartier ne peut même pas déclencher, faute de carte bancaire.
        </GCallout>
      </>
    ),
  },
  {
    id: "frais",
    label: "Abonnement mensuel ou commission sur les ventes ?",
    content: (
      <>
        <GP>
          Le deuxième grand écart entre les deux plateformes est économique, et il est souvent sous‑estimé.
          Le prix affiché n'est jamais le vrai prix — ce qui compte, c'est <GStrong>quand</GStrong> et{" "}
          <GStrong>pourquoi</GStrong> vous payez.
        </GP>
        <GH3>Le modèle Systeme.io : l'abonnement</GH3>
        <GP>
          Systeme.io fonctionne par abonnement mensuel. Il existe un palier gratuit limité, mais dès que vous
          voulez plus de contacts, de tunnels ou de fonctionnalités, vous passez à un forfait payant fixe,
          que vous vendiez ou non. Pour un créateur qui démarre, c'est un poids : les premiers mois, vous
          dépensez avant d'avoir encaissé le moindre franc. Si vous mettez trois mois à trouver votre marché,
          vous avez déjà payé trois mois « à vide ».
        </GP>
        <GH3>Le modèle Novakou : la commission</GH3>
        <GP>
          Novakou est <GStrong>gratuit pour démarrer</GStrong>. Vous ne payez qu'une commission simple sur
          chaque vente réelle. Pas de vente, pas de frais. La plateforme n'est rémunérée que si elle vous
          rapporte — vos intérêts sont parfaitement alignés. Vous lancez votre boutique à{" "}
          <GStrong>0 FCFA</GStrong>, sans risque, et vous investissez votre trésorerie dans votre produit et
          votre publicité plutôt que dans un abonnement.
        </GP>
        <GCallout variant="tip" title="Exemple concret">
          Vous lancez une formation à <GStrong>25 000 FCFA</GStrong>. Avec un abonnement mensuel, vous êtes
          déjà en négatif avant votre première vente, mois après mois. Avec la commission Novakou, vous ne
          payez rien tant que vous n'avez pas vendu, et sur chaque vente l'essentiel reste dans votre poche.
          Pour un créateur qui démarre au Sénégal ou au Bénin, c'est le jour et la nuit sur la trésorerie.
        </GCallout>
        <GP>
          Attention aussi aux <GStrong>coûts cachés</GStrong>. Une plateforme « pas chère » qui vous oblige à
          brancher un intermédiaire de paiement, un outil d'e‑mailing externe et un service de pixels revient
          finalement bien plus cher qu'une solution tout‑en‑un. Additionnez tout : l'abonnement affiché n'est
          que la partie visible de la facture.
        </GP>
      </>
    ),
  },
  {
    id: "novakou",
    label: "Novakou : tout réuni au même endroit",
    content: (
      <>
        <GP>
          Novakou n'a pas été conçue pour « aussi » fonctionner en Afrique : elle a été bâtie{" "}
          <GStrong>pour</GStrong> l'Afrique francophone, du premier écran jusqu'au retrait des fonds. Voici ce
          qui en fait une plateforme complète, sans outil externe à brancher.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Tableau de bord de suivi des ventes et des statistiques d'une boutique en ligne"
          caption="Une seule boutique pour encaisser en Mobile Money et par carte, avec tunnel, escrow et automatisation inclus."
        />
        <GH3>Encaisser partout, tout de suite</GH3>
        <GP>
          Wave, Orange Money, MTN Mobile Money, Moov et carte bancaire, sans intermédiaire. L'acheteur choisit
          son moyen préféré et paie en quelques secondes, qu'il soit à Abidjan ou dans la diaspora à
          Montréal. Vos ventes ne s'arrêtent jamais à cause d'un blocage de paiement.
        </GP>
        <GH3>Vendre plus à chaque client</GH3>
        <GP>
          Un <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente</GA> complet avec modèles prêts à
          l'emploi, order bump et upsell en un clic. Un acheteur qui prend votre formation à 25 000 FCFA peut
          ajouter, d'un clic, un pack de modèles à 9 000 FCFA. Vous augmentez le panier moyen automatiquement,
          exactement comme sur les meilleurs outils occidentaux — mais avec le Mobile Money derrière.
        </GP>
        <GH3>Vendre en confiance</GH3>
        <GP>
          Le paiement est <GStrong>séquestré</GStrong> (escrow) : les fonds sont sécurisés puis libérés une
          fois la vente confirmée. Vos vidéos et documents sont protégés contre le téléchargement non
          autorisé. Acheteur et vendeur sont protégés — c'est ce qui fait revenir les clients et bâtit votre
          réputation.
        </GP>
        <GH3>Attirer et fidéliser sans outil externe</GH3>
        <GP>
          Automatisations et séquences e‑mail, relances de panier abandonné, affiliation pour que d'autres
          vendent à votre place, et <GStrong>pixels publicitaires</GStrong> (Facebook, Instagram, TikTok,
          Snapchat, Pinterest) sur toutes vos pages. Tout est inclus, rien à brancher, aucun abonnement
          supplémentaire.
        </GP>
      </>
    ),
  },
  {
    id: "comparatif",
    label: "Novakou vs Systeme.io : le comparatif en un tableau",
    content: (
      <>
        <GP>
          Voici, critère par critère, comment se situent les deux plateformes sur ce qui décide réellement de
          vos ventes en Afrique francophone.
        </GP>
        <div className="my-6 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr className="bg-[#f6fbf2] text-left">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-600">Critère</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-[#006e2f]">Novakou</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-600">Systeme.io</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Mobile Money natif</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Wave, Orange, MTN, Moov + carte</td>
                <td className="py-3 px-4 text-sm text-gray-600">❌ Absent, uniquement via intermédiaire tiers</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Modèle économique</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Gratuit, commission simple par vente</td>
                <td className="py-3 px-4 text-sm text-gray-600">Abonnement mensuel fixe (palier gratuit limité)</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Tunnel de vente (bump, upsell)</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Inclus, modèles prêts</td>
                <td className="py-3 px-4 text-sm text-gray-600">✅ Très complet, point fort historique</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Automatisation & e‑mails</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Séquences, workflows, relances</td>
                <td className="py-3 px-4 text-sm text-gray-600">✅ Très complet, point fort</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Paiement séquestré (escrow)</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Oui, protection des 2 parties</td>
                <td className="py-3 px-4 text-sm text-gray-600">❌ Non</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Pixels pub (FB, TikTok, Snap, Pinterest)</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Sur toutes les pages</td>
                <td className="py-3 px-4 text-sm text-gray-600">Partiel (FB principalement)</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Devise & langue</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ FCFA, français, pages pays</td>
                <td className="py-3 px-4 text-sm text-gray-600">Euro par défaut, français OK</td>
              </tr>
              <tr className="align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Retrait des fonds en Afrique</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">✅ Direct vers Mobile Money / compte local</td>
                <td className="py-3 px-4 text-sm text-gray-600">❌ Complexe, dépend de l'intermédiaire</td>
              </tr>
            </tbody>
          </table>
        </div>
        <GP>
          La lecture est nette. Systeme.io fait jeu égal — voire mieux — sur le tunnel et l'automatisation.
          Mais sur les critères qui décident réellement d'une vente en Afrique — Mobile Money, escrow, devise
          FCFA, retrait local — <GStrong>Novakou l'emporte sans discussion</GStrong>. Et surtout, elle ne
          sacrifie rien du côté marketing pour y arriver.
        </GP>
      </>
    ),
  },
  {
    id: "quand-systemeio",
    label: "Quand Systeme.io reste un bon choix",
    content: (
      <>
        <GP>
          Ce guide serait malhonnête s'il prétendait que Systeme.io n'a jamais sa place. Il en a une, bien
          réelle. Voici les situations où il peut être le meilleur choix pour vous.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Entrepreneurs travaillant ensemble sur une stratégie de vente en ligne"
          caption="Chaque outil a son terrain de jeu : le vôtre dépend d'abord de qui sont vos acheteurs."
        />
        <GUl>
          <GLi>
            <GStrong>Votre audience est à 100 % en Europe ou en Amérique du Nord</GStrong> et paie
            exclusivement par carte bancaire. Le Mobile Money ne vous manque pas, et l'écosystème tunnel de
            Systeme.io est confortable.
          </GLi>
          <GLi>
            <GStrong>Vous êtes déjà un marketeur avancé</GStrong> qui exploite des tunnels multi‑étapes très
            fins, des webinaires automatisés et des séquences comportementales complexes, et c'est le cœur de
            votre métier.
          </GLi>
          <GLi>
            <GStrong>Vous avez déjà tout votre business installé dessus</GStrong> depuis des années, avec une
            audience carte qui convertit très bien, et aucun besoin africain à court terme.
          </GLi>
        </GUl>
        <GP>
          Dans ces cas, Systeme.io est un choix défendable. Mais dès qu'une part significative de vos
          acheteurs se trouve en Afrique — au Sénégal, en Côte d'Ivoire, au Cameroun, au Bénin — l'absence de
          Mobile Money natif devient un plafond de verre. Vous laissez sur la table la majorité d'un marché
          que vous pourriez servir. Et c'est précisément là que Novakou change la donne, sans vous priver des
          outils marketing que vous appréciez.
        </GP>
        <GCallout variant="tip" title="Bonne nouvelle : ce n'est pas « l'un ou l'autre » pour toujours">
          Rien ne vous empêche de tester Novakou en parallèle, d'importer votre tunnel existant, et de
          comparer vos taux de conversion en Mobile Money. Le marché africain est trop grand pour être ignoré
          — autant le mesurer par vous‑même.
        </GCallout>
      </>
    ),
  },
  {
    id: "pourquoi-novakou",
    label: "Pourquoi Novakou gagne en Afrique francophone",
    content: (
      <>
        <GP>
          Récapitulons ce que démontre ce comparatif. Novakou ne gagne pas parce qu'elle serait « meilleure
          en tout » dans l'absolu — Systeme.io reste redoutable sur son terrain. Novakou gagne en Afrique
          parce qu'elle réunit, au même endroit, les deux choses qu'aucun concurrent ne combine :{" "}
          <GStrong>l'encaissement local complet</GStrong> et <GStrong>les outils de vente avancés</GStrong>.
        </GP>
        <GUl>
          <GLi>
            <GStrong>Le paiement local ne se bricole plus</GStrong> : Wave, Orange, MTN et Moov sont natifs,
            pas branchés au forceps. Votre acheteur paie comme il en a l'habitude.
          </GLi>
          <GLi>
            <GStrong>Vous démarrez sans risque</GStrong> : 0 FCFA, aucune facture avant votre première vente,
            une commission alignée sur votre réussite.
          </GLi>
          <GLi>
            <GStrong>Vous ne sacrifiez pas le marketing</GStrong> : tunnel, order bump, upsell,
            automatisation, affiliation et pixels sont inclus, sans outil externe.
          </GLi>
          <GLi>
            <GStrong>Vous vendez aussi à la diaspora et au monde</GStrong> : la carte bancaire et les
            paiements internationaux ouvrent la même boutique à Paris, Bruxelles ou Toronto.
          </GLi>
          <GLi>
            <GStrong>Vous êtes tranquille</GStrong> : escrow, factures automatiques, protection des contenus
            et retrait direct vers votre Mobile Money. Vous créez et vous vendez, la plateforme gère le reste.
          </GLi>
        </GUl>
        <GP>
          Pour aller plus loin dans la comparaison de l'ensemble du marché, lisez notre panorama des{" "}
          <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">
            meilleures plateformes pour vendre des produits digitaux en Afrique
          </GA>
          . Vous y retrouverez Systeme.io, Chariow, Selar et les outils globaux, notés sur les mêmes critères.
        </GP>
        <GCallout variant="success" title="Le verdict">
          Pour un créateur d'Afrique francophone qui veut vendre localement (Mobile Money) et à la diaspora
          (carte), <GStrong>Novakou est le choix qui coche toutes les cases sans compromis</GStrong>.
          Systeme.io reste excellent pour une audience 100 % occidentale en carte — mais il n'est pas fait
          pour encaisser à Dakar, Abidjan ou Douala.
        </GCallout>
      </>
    ),
  },
  {
    id: "migrer",
    label: "Comment migrer de Systeme.io sans rien perdre",
    content: (
      <>
        <GP>
          La crainte la plus fréquente quand on a déjà bâti quelque chose sur Systeme.io : « je vais devoir
          tout recommencer ». Bonne nouvelle — non. Novakou a prévu une passerelle qui récupère votre travail
          en quelques secondes.
        </GP>
        <GH3>L'import en 30 secondes</GH3>
        <GP>
          Vous collez simplement l'URL de votre tunnel ou de votre page de vente Systeme.io dans Novakou.
          Titre, textes et images sont récupérés automatiquement, prêts en brouillon. Vous n'avez plus qu'à
          brancher vos moyens de paiement Mobile Money et à publier. Tout est détaillé dans notre guide{" "}
          <GA href="/guides/importer-systeme-io">importer un tunnel Systeme.io vers Novakou</GA>.
        </GP>
        <GH3>Les 5 étapes pour basculer</GH3>
        <GUl>
          <GLi>
            <GStrong>Créez votre compte vendeur Novakou</GStrong> gratuitement, sans carte bancaire.
          </GLi>
          <GLi>
            <GStrong>Importez votre tunnel Systeme.io</GStrong> en collant son URL — le contenu arrive en
            brouillon.
          </GLi>
          <GLi>
            <GStrong>Activez le Mobile Money et la carte</GStrong> en un clic (Wave, Orange, MTN, Moov +
            carte).
          </GLi>
          <GLi>
            <GStrong>Partagez votre lien</GStrong> sur WhatsApp, Facebook et TikTok — page produit, lien de
            paiement direct ou tunnel complet.
          </GLi>
          <GLi>
            <GStrong>Encaissez et suivez vos ventes</GStrong> en temps réel dans votre tableau de bord, avec
            retrait direct vers votre Mobile Money.
          </GLi>
        </GUl>
        <GP>
          Vous pouvez même garder Systeme.io pour votre audience carte le temps de la transition, et laisser
          Novakou capter le marché africain en Mobile Money. Vous ne perdez rien, vous ajoutez un canal qui
          vous manquait. Puis, quand les chiffres parlent d'eux‑mêmes, vous basculez sereinement.
        </GP>
        <GCallout variant="info" title="Prochaine étape">
          Votre première vente en Mobile Money peut tomber aujourd'hui. Créez votre boutique, importez votre
          tunnel, activez Wave et Orange Money, et partagez votre lien sur WhatsApp. C'est aussi simple que ça.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Peut‑on utiliser Systeme.io en Afrique ?",
    a: "Techniquement oui, mais avec une limite majeure : Systeme.io n'a pas de Mobile Money natif. Vos acheteurs qui paient avec Wave, Orange Money ou MTN ne peuvent pas régler directement ; il faut passer par un intermédiaire de paiement tiers, ce qui ajoute des frictions au parcours d'achat et complique le rapatriement des fonds. Pour une audience majoritairement africaine, cela fait perdre la plupart des ventes. Novakou, elle, intègre Wave, Orange Money, MTN et Moov nativement.",
  },
  {
    q: "Comment migrer de Systeme.io vers Novakou ?",
    a: "En 30 secondes. Vous collez l'URL de votre tunnel ou page de vente Systeme.io dans Novakou : titre, textes et images sont récupérés automatiquement en brouillon. Vous activez ensuite le Mobile Money et la carte en un clic, puis vous publiez. Vous pouvez même garder Systeme.io en parallèle le temps de la transition. Le guide « importer un tunnel Systeme.io » détaille chaque étape.",
  },
  {
    q: "Novakou est‑elle vraiment meilleure que Systeme.io ?",
    a: "Cela dépend de votre marché. Systeme.io est excellent sur les tunnels et l'automatisation pour une audience carte en Europe ou en Amérique du Nord. Mais pour vendre en Afrique francophone, il lui manque l'essentiel : le Mobile Money natif, l'escrow, la devise FCFA et le retrait local. Novakou réunit le paiement local complet ET les outils de vente avancés, ce qui en fait le meilleur choix pour un créateur africain.",
  },
  {
    q: "Faut‑il payer un abonnement pour vendre sur Novakou ?",
    a: "Non. Contrairement au modèle par abonnement de Systeme.io, Novakou est gratuit pour démarrer et se rémunère via une simple commission sur les ventes réelles. Aucun frais fixe avant votre première vente, donc aucun risque financier au lancement — idéal quand on démarre au Sénégal, en Côte d'Ivoire, au Cameroun ou au Bénin.",
  },
  {
    q: "Puis‑je accepter Wave, Orange Money et MTN sur Novakou ?",
    a: "Oui, nativement. Novakou accepte Wave, Orange Money, MTN Mobile Money et Moov, en plus de la carte bancaire pour les paiements internationaux de la diaspora. L'acheteur choisit son moyen préféré au moment de payer, sans intermédiaire ni redirection compliquée.",
  },
  {
    q: "Puis‑je vendre à la fois en Afrique et à la diaspora avec Novakou ?",
    a: "Oui. C'est justement l'avantage de Novakou : le Mobile Money encaisse localement (Dakar, Abidjan, Douala, Cotonou) tandis que la carte bancaire et les paiements internationaux vous ouvrent la diaspora et le reste du monde, depuis la même boutique. Local pour encaisser, mondial pour grandir.",
  },
];

export default function NovakouVsSystemeIo() {
  return (
    <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />
  );
}
