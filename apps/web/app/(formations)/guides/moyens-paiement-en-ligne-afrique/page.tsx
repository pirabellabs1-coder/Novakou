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
  slug: "moyens-paiement-en-ligne-afrique",
  title: "Les moyens de paiement en ligne en Afrique : le guide complet 2026",
  subtitle:
    "Mobile Money, carte bancaire, agrégateurs : le panorama complet des moyens de paiement en ligne en Afrique francophone, opérateur par opérateur et pays par pays. Ce qu'il faut vraiment accepter pour vendre vos produits numériques — et comment Novakou intègre tout, nativement.",
  category: "Vendre",
  level: "Débutant",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "account_balance_wallet",
  time: "15 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "moyens de paiement en ligne Afrique",
    "accepter paiement en ligne Afrique",
    "Mobile Money Wave Orange MTN",
    "agrégateur de paiement Afrique",
    "payer en ligne Afrique francophone",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Moyens de paiement en ligne en Afrique : le guide complet 2026";
const SEO_DESCRIPTION =
  "Mobile Money (Wave, Orange, MTN, Moov), carte bancaire et agrégateurs : le guide complet des moyens de paiement en ligne en Afrique francophone, pays par pays, pour vendre vos produits numériques.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Les moyens de paiement en ligne en Afrique",
)}&subtitle=${encodeURIComponent(
  "Mobile Money, carte et agrégateurs — le guide complet 2026",
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
  src: "https://images.unsplash.com/photo-1596526131083-e8c633064194?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Paiement mobile en ligne en Afrique francophone avec un smartphone et Mobile Money",
  caption: "En Afrique, le paiement passe d'abord par le téléphone : le Mobile Money est roi.",
};

const stats = [
  { value: "Mobile Money", label: "le moyen de paiement n°1 en Afrique de l'Ouest et centrale" },
  { value: "4 réseaux", label: "Wave, Orange Money, MTN MoMo et Moov Money couvrent l'essentiel" },
  { value: "Carte", label: "indispensable pour vendre à la diaspora et à l'international" },
  { value: "Natif", label: "Novakou intègre tous ces moyens sans agrégateur à connecter" },
];

const sections: GuideSection[] = [
  {
    id: "le-paysage",
    label: "Le paysage du paiement en ligne en Afrique francophone",
    content: (
      <>
        <GP>
          Vendre un produit numérique en Afrique francophone, ce n'est pas seulement avoir un bon produit et une belle page. C'est surtout laisser l'acheteur payer <GStrong>avec le moyen qu'il utilise déjà tous les jours</GStrong>. Et sur le continent, ce moyen n'est presque jamais la carte bancaire : c'est le téléphone. Un vendeur qui n'accepte que la carte se coupe volontairement de 8 clients sur 10.
        </GP>
        <GP>
          Le paysage est en réalité assez simple à comprendre une fois qu'on le décompose. Il y a trois grandes familles de moyens de paiement en ligne : le <GStrong>Mobile Money</GStrong> (l'argent stocké et transféré depuis un numéro de téléphone), la <GStrong>carte bancaire</GStrong> (Visa, Mastercard, surtout utilisée par la diaspora et les entreprises), et les <GStrong>agrégateurs de paiement</GStrong> (des intermédiaires techniques qui relient votre boutique à tous ces réseaux). Ce guide vous explique chacune de ces familles, opérateur par opérateur et pays par pays, puis vous montre exactement ce qu'il faut accepter pour vendre sereinement.
        </GP>
        <GStats
          items={[
            { value: "80 %+", label: "des paiements en ligne se font en Mobile Money en Afrique de l'Ouest" },
            { value: "17 pays", label: "d'Afrique francophone couverts par les grands réseaux Mobile Money" },
            { value: "3 familles", label: "Mobile Money, carte bancaire et agrégateurs de paiement" },
          ]}
        />
        <GP>
          L'objectif de ce guide est double : vous donner une vision claire du terrain, puis vous éviter le casse-tête technique. Car la bonne nouvelle, c'est qu'avec la bonne plateforme, vous n'avez pas à choisir, ni à brancher chaque opérateur un par un. On y revient à la fin — mais gardez déjà en tête ce principe : <GStrong>Mobile Money d'abord, carte ensuite</GStrong>.
        </GP>
      </>
    ),
  },
  {
    id: "mobile-money",
    label: "Le Mobile Money, roi incontesté du paiement africain",
    content: (
      <>
        <GP>
          Le Mobile Money a fait sur le continent ce que la carte bancaire n'a jamais réussi : mettre un « compte » de paiement dans la poche de presque tout le monde, sans agence, sans banque, sans papiers compliqués. Un numéro de téléphone suffit. On dépose de l'argent chez un agent au coin de la rue, on paie et on reçoit directement depuis son mobile. Pour vendre du numérique, c'est l'infrastructure idéale : instantanée, familière et accessible même à ceux qui n'ont jamais eu de compte en banque.
        </GP>
        <GP>
          Quatre grands réseaux structurent le marché francophone. Voici ce qu'il faut savoir de chacun.
        </GP>
        <GCards
          items={[
            {
              icon: "bolt",
              title: "Wave",
              text: "Le trublion sénégalais et ivoirien. Frais très bas, application ultra simple, adoption massive chez les jeunes. Souvent le premier réflexe au Sénégal et en Côte d'Ivoire.",
            },
            {
              icon: "smartphone",
              title: "Orange Money",
              text: "Le réseau le plus étendu de la zone franc. Présent au Sénégal, en Côte d'Ivoire, au Cameroun, au Mali, au Burkina Faso et bien au-delà. Une valeur sûre partout.",
            },
            {
              icon: "sim_card",
              title: "MTN Mobile Money (MoMo)",
              text: "Le géant en Côte d'Ivoire, au Cameroun et au Bénin. Incontournable dans les pays anglophones voisins aussi, pratique pour toucher une clientèle plus large.",
            },
            {
              icon: "payments",
              title: "Moov Money",
              text: "Solide au Bénin, au Togo, au Mali, au Burkina Faso et en Côte d'Ivoire. Le quatrième pilier qui complète la couverture là où les autres sont moins forts.",
            },
          ]}
        />
        <GCallout variant="tip" title="Pourquoi accepter plusieurs opérateurs">
          Un client a rarement de l'argent sur tous ses comptes en même temps. S'il a du solde sur Orange Money mais que vous n'acceptez que Wave, la vente est perdue — non pas parce que votre produit ne plaît pas, mais parce que le paiement bloque. Accepter les quatre grands réseaux, c'est supprimer cette fuite invisible.
        </GCallout>
        <GP>
          Il existe d'autres portefeuilles selon les pays (Free Money au Sénégal, T-Money et Flooz au Togo, Celtiis au Bénin, Sama Money au Mali, etc.), mais Wave, Orange, MTN et Moov couvrent à eux seuls la très grande majorité des transactions. Pour aller plus loin sur l'encaissement, lisez notre guide dédié <GA href="/guides/mobile-money-encaisser-paiements">encaisser vos paiements en Mobile Money</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "par-pays",
    label: "Le Mobile Money pays par pays",
    content: (
      <>
        <GP>
          Chaque pays a ses habitudes. Au Sénégal, Wave et Orange dominent le quotidien. En Côte d'Ivoire, les quatre réseaux cohabitent. Au Cameroun, Orange et MTN se partagent le terrain. Connaître la carte des opérateurs de votre marché principal vous aide à parler la langue de vos acheteurs. Voici un récapitulatif clair des opérateurs Mobile Money les plus utilisés dans les principaux pays d'Afrique francophone.
        </GP>
        <div className="my-6 overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="bg-[#f6fbf2] text-left">
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-600">Pays</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-[#006e2f]">Mobile Money principaux</th>
                <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-gray-600">Carte (diaspora)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Sénégal</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">Wave, Orange Money, Free Money</td>
                <td className="py-3 px-4 text-sm text-gray-600">Visa / Mastercard</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Côte d'Ivoire</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">Wave, Orange Money, MTN MoMo, Moov Money</td>
                <td className="py-3 px-4 text-sm text-gray-600">Visa / Mastercard</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Cameroun</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">Orange Money, MTN MoMo</td>
                <td className="py-3 px-4 text-sm text-gray-600">Visa / Mastercard</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Bénin</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">MTN MoMo, Moov Money, Celtiis</td>
                <td className="py-3 px-4 text-sm text-gray-600">Visa / Mastercard</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Mali</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">Orange Money, Moov Money, Sama Money</td>
                <td className="py-3 px-4 text-sm text-gray-600">Visa / Mastercard</td>
              </tr>
              <tr className="border-b border-gray-100 align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Togo</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">T-Money (Yas), Moov Money (Flooz)</td>
                <td className="py-3 px-4 text-sm text-gray-600">Visa / Mastercard</td>
              </tr>
              <tr className="align-top">
                <td className="py-3 px-4 font-semibold text-[#191c1e] text-sm">Burkina Faso</td>
                <td className="py-3 px-4 text-sm text-[#006e2f] font-semibold">Orange Money, Moov Money</td>
                <td className="py-3 px-4 text-sm text-gray-600">Visa / Mastercard</td>
              </tr>
            </tbody>
          </table>
        </div>
        <GP>
          La lecture de ce tableau donne un enseignement simple : dans la zone franc (FCFA), <GStrong>Wave, Orange Money, MTN et Moov reviennent sans cesse</GStrong>. Si votre boutique accepte ces quatre réseaux plus la carte, vous couvrez pratiquement tous les acheteurs, quel que soit leur pays. Inutile de vous perdre dans une dizaine de portefeuilles de niche : mieux vaut couvrir parfaitement les grands réseaux.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Client africain payant un achat en ligne avec son téléphone via Mobile Money"
          caption="Un checkout qui propose Wave, Orange, MTN et Moov capte l'acheteur dans son réflexe naturel."
        />
      </>
    ),
  },
  {
    id: "carte-bancaire",
    label: "La carte bancaire : la clé de la diaspora",
    content: (
      <>
        <GP>
          Si le Mobile Money est roi sur le continent, la carte bancaire reste indispensable pour une catégorie précieuse de clients : la <GStrong>diaspora</GStrong>. Un Sénégalais à Paris, une Ivoirienne à Montréal, un Camerounais à Bruxelles n'utilisent pas Orange Money au quotidien — mais ils ont une carte Visa ou Mastercard, et ils achètent volontiers des formations, des e-books et des services depuis leur pays d'origine. C'est souvent une clientèle au pouvoir d'achat plus élevé.
        </GP>
        <GP>
          La carte sert aussi pour les entreprises, les professionnels et tout acheteur international qui tombe sur votre produit via une publicité ou une recherche Google. Ignorer la carte, c'est laisser sur la table les paniers les plus rentables. C'est pour cela que la règle d'or n'est pas « Mobile Money OU carte », mais bien « Mobile Money ET carte ».
        </GP>
        <GCallout variant="info" title="Le bon dosage local / international">
          Pensez votre boutique comme une porte à deux battants. Le premier battant, large, c'est le Mobile Money : il fait entrer la masse des acheteurs locaux. Le second, la carte, fait entrer la diaspora et l'international. Fermer l'un des deux, c'est diviser vos ventes potentielles.
        </GCallout>
        <GP>
          Concrètement, un checkout bien conçu affiche le Mobile Money en premier (car c'est le réflexe local) tout en gardant l'option carte visible et rassurante. L'acheteur choisit, paie, et vous encaissez — sans qu'il ait à quitter votre page.
        </GP>
      </>
    ),
  },
  {
    id: "agregateurs",
    label: "Les agrégateurs de paiement : à quoi servent-ils ?",
    content: (
      <>
        <GP>
          Voici la partie que beaucoup de créateurs ne comprennent pas — et c'est normal, car elle est technique. Un opérateur comme Wave ou Orange Money ne se « branche » pas tout seul sur votre boutique. Chacun a sa propre technologie, ses règles, ses démarches. Brancher les quatre réseaux plus la carte, un par un, demanderait des semaines de paperasse et de développement. C'est là qu'interviennent les <GStrong>agrégateurs de paiement</GStrong>.
        </GP>
        <GP>
          Un agrégateur est un intermédiaire technique. Vous vous connectez à lui une seule fois, et lui se charge de vous relier à tous les opérateurs d'un coup. Il encaisse pour vous, gère la sécurité, puis vous reverse l'argent. C'est le « traducteur » entre votre boutique et les réseaux de paiement.
        </GP>
        <GCards
          items={[
            {
              icon: "hub",
              title: "CinetPay",
              text: "Agrégateur majeur d'Afrique de l'Ouest et centrale. Couvre Mobile Money multi-opérateurs et carte sur de nombreux pays de la zone FCFA.",
            },
            {
              icon: "account_tree",
              title: "PayDunya",
              text: "Solution sénégalaise très présente dans la sous-région. Regroupe Mobile Money et carte derrière une seule intégration.",
            },
            {
              icon: "lan",
              title: "Autres passerelles",
              text: "Flutterwave, Paystack, Kkiapay et d'autres jouent le même rôle selon les pays et les couvertures.",
            },
            {
              icon: "warning",
              title: "Le revers",
              text: "Chaque agrégateur demande un compte, des vérifications, une intégration technique et un suivi. Pour un créateur seul, c'est vite un métier à part entière.",
            },
          ]}
        />
        <GCallout variant="warning" title="Le piège du bricolage">
          Beaucoup de vendeurs commencent par ouvrir un compte agrégateur, s'inscrire chez chaque opérateur, coller des bouts de code sur un site fait maison… puis passent plus de temps à réparer les paiements qu'à créer et vendre. L'énergie qui devrait aller au produit part dans la plomberie technique.
        </GCallout>
        <GP>
          Retenez ceci : les agrégateurs sont utiles, mais ce sont des outils pour développeurs. En tant que créateur, ce que vous voulez, ce n'est pas gérer un agrégateur — c'est que les paiements marchent, point. La vraie question n'est donc pas « quel agrégateur choisir ? », mais « quelle plateforme me libère complètement de cette question ? ».
        </GP>
      </>
    ),
  },
  {
    id: "quoi-accepter",
    label: "Ce qu'il faut accepter pour vendre du numérique",
    content: (
      <>
        <GP>
          Passons au concret. Vous vendez une formation, un e-book, un template ou du coaching. Quels moyens de paiement devez-vous absolument proposer ? La réponse tient en une phrase : <GStrong>Mobile Money d'abord, carte ensuite, et rien de compliqué pour l'acheteur</GStrong>.
        </GP>
        <GH3>La liste minimale qui capte presque tout le monde</GH3>
        <GUl>
          <GLi><GStrong>Wave</GStrong> — incontournable au Sénégal et en Côte d'Ivoire, adoré des jeunes acheteurs.</GLi>
          <GLi><GStrong>Orange Money</GStrong> — la couverture la plus large de la zone FCFA, partout ou presque.</GLi>
          <GLi><GStrong>MTN Mobile Money</GStrong> — indispensable en Côte d'Ivoire, au Cameroun et au Bénin.</GLi>
          <GLi><GStrong>Moov Money</GStrong> — pour compléter au Bénin, au Togo, au Mali et au Burkina Faso.</GLi>
          <GLi><GStrong>Carte bancaire (Visa / Mastercard)</GStrong> — pour la diaspora et l'international.</GLi>
        </GUl>
        <GP>
          Avec ces cinq options, un vendeur basé à Dakar peut encaisser aussi bien un étudiant à Cotonou (MTN MoMo), une commerçante à Bamako (Orange Money), un client à Lomé (Moov / Flooz) qu'un membre de la diaspora à Lyon (carte). C'est exactement ce dont un business de produits numériques a besoin.
        </GP>
        <GH3>Ce qui compte autant que le moyen : la fluidité</GH3>
        <GP>
          Accepter les bons moyens ne suffit pas si le parcours est pénible. En Afrique, l'essentiel des ventes se joue dans une conversation WhatsApp ou après une publicité : l'acheteur est chaud, mais impatient. S'il doit sortir de la discussion, copier un numéro, faire un transfert manuel, envoyer une capture d'écran et attendre une confirmation, une bonne partie abandonne en route. Un paiement fluide, intégré à la page, où l'on choisit son opérateur et où l'accès au produit se débloque tout seul, change radicalement le taux de conversion.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Créatrice africaine gérant les paiements de sa boutique de produits numériques"
          caption="Le bon objectif : que l'acheteur choisisse son moyen et paie sans jamais quitter votre page."
        />
        <GP>
          Pour la méthode pas à pas côté vente, notre guide <GA href="/guides/vendre-avec-mobile-money-guide">vendre avec le Mobile Money</GA> détaille comment transformer ces moyens de paiement en ventes réelles.
        </GP>
      </>
    ),
  },
  {
    id: "frais",
    label: "Comprendre les frais (et ne pas se faire piéger)",
    content: (
      <>
        <GP>
          Aucun paiement n'est totalement gratuit : encaisser de l'argent a un coût, en Afrique comme partout. Ce coût, ce sont les <GStrong>frais de transaction</GStrong>. Les comprendre vous évite deux erreurs classiques : rogner votre marge sans le savoir, ou au contraire fixer des prix trop bas qui ne couvrent pas les frais.
        </GP>
        <GH3>D'où viennent les frais</GH3>
        <GUl>
          <GLi><GStrong>Les frais opérateur</GStrong> — chaque réseau (Wave, Orange, MTN, Moov) prélève un petit pourcentage ou un montant fixe sur l'encaissement.</GLi>
          <GLi><GStrong>Les frais de carte</GStrong> — les paiements par carte coûtent généralement un peu plus cher que le Mobile Money, à cause des réseaux internationaux.</GLi>
          <GLi><GStrong>Les frais de plateforme ou d'agrégateur</GStrong> — l'intermédiaire qui fait fonctionner tout cela prend aussi sa part, sous forme de commission.</GLi>
        </GUl>
        <GP>
          La bonne pratique consiste à <GStrong>intégrer les frais dans votre prix</GStrong> plutôt que de les subir. Si vous voulez toucher net 25 000 FCFA sur une formation, fixez le prix affiché un peu au-dessus pour absorber la commission. Vos clients ne verront qu'un prix rond, et votre marge sera protégée.
        </GP>
        <GCallout variant="tip" title="Le vrai coût à comparer">
          Ne comparez jamais deux solutions sur le seul pourcentage de commission. Regardez le coût total : abonnement mensuel éventuel, frais fixes par transaction, frais de retrait, et surtout le temps que vous passez à faire fonctionner le tout. Une plateforme « gratuite à l'affichage » mais qui exige un abonnement mensuel peut vous coûter plus cher qu'une commission simple sur vos ventes réelles.
        </GCallout>
        <GP>
          Le modèle le plus sain pour un créateur qui démarre reste la commission sur les ventes : vous ne payez que quand vous encaissez. Pas de vente, pas de frais. Pour approfondir la question du coût réel des différentes solutions, consultez notre comparatif des <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "novakou-integre",
    label: "Comment Novakou intègre tout, nativement",
    content: (
      <>
        <GP>
          Vous avez maintenant la carte complète du terrain : Mobile Money multi-opérateurs, carte pour la diaspora, agrégateurs techniques en coulisses, frais à maîtriser. La question naturelle est : « dois-je vraiment gérer tout ça moi-même ? » La réponse, avec Novakou, est <GStrong>non</GStrong>.
        </GP>
        <GP>
          Novakou intègre <GStrong>nativement</GStrong> tous ces moyens de paiement. Wave, Orange Money, MTN Mobile Money, Moov Money et la carte bancaire sont déjà connectés dans la plateforme. Vous n'ouvrez pas de compte agrégateur, vous ne collez pas de code, vous ne signez pas dix contrats avec dix opérateurs. Vous activez vos moyens de paiement en un clic, et l'acheteur les voit tous au checkout.
        </GP>
        <GCards
          items={[
            {
              icon: "toggle_on",
              title: "Activation en un clic",
              text: "Tous les grands réseaux Mobile Money et la carte sont déjà branchés. Vous choisissez ce que vous acceptez, c'est tout.",
            },
            {
              icon: "shield",
              title: "Paiement séquestré (escrow)",
              text: "Les fonds sont sécurisés à l'achat puis libérés une fois la vente confirmée. L'acheteur ose acheter, vous encaissez sereinement.",
            },
            {
              icon: "currency_exchange",
              title: "Multi-devises",
              text: "Prix en FCFA pour le local, en euros ou dollars pour la diaspora, avec conversion automatique. Rien à calculer.",
            },
            {
              icon: "receipt_long",
              title: "Portefeuille et retraits",
              text: "Solde, factures PDF automatiques et retrait vers Mobile Money ou virement, dans un seul tableau de bord clair.",
            },
          ]}
        />
        <GP>
          Le résultat : votre acheteur au Cameroun paie en MTN MoMo, celui du Sénégal en Wave, la cliente de Bamako en Orange Money, le contact de Lomé en Moov, et le cousin installé à Bruxelles par carte — sur la <GStrong>même page produit</GStrong>, sans que vous ayez rien branché. Et grâce à l'escrow, chacun paie en confiance. C'est cette simplicité qui fait de Novakou la plateforme n°1 de vente de produits numériques en Afrique francophone.
        </GP>
        <GCallout variant="success" title="Ce que vous n'avez plus à faire">
          Pas d'inscription chez chaque opérateur, pas de compte agrégateur à maintenir, pas de code de paiement à déboguer, pas de transferts manuels ni de captures d'écran à vérifier. Vous vous concentrez sur votre produit et vos ventes ; Novakou s'occupe de la plomberie des paiements.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs",
    label: "Les erreurs à éviter avec les paiements",
    content: (
      <>
        <GP>
          Après avoir vu ce qui marche, voici les pièges qui coûtent des ventes chaque jour à des créateurs pourtant talentueux. Les éviter est parfois plus rentable que d'améliorer le produit lui-même.
        </GP>
        <GUl>
          <GLi><GStrong>N'accepter qu'un seul opérateur.</GStrong> Vous perdez tous les clients qui n'ont du solde que sur un autre réseau. Couvrez les quatre grands.</GLi>
          <GLi><GStrong>Oublier la carte.</GStrong> C'est renoncer à la diaspora et à l'international, souvent vos paniers les plus rentables.</GLi>
          <GLi><GStrong>Le paiement manuel.</GStrong> Demander un transfert vers votre numéro puis une capture d'écran fait fuir les acheteurs pressés et ouvre la porte aux fausses preuves de paiement.</GLi>
          <GLi><GStrong>Un checkout qui sort de la page.</GStrong> Chaque redirection, chaque étape de trop fait chuter la conversion. Le paiement doit rester fluide et intégré.</GLi>
          <GLi><GStrong>Ignorer les frais.</GStrong> Fixer un prix sans tenir compte de la commission grignote votre marge en silence.</GLi>
          <GLi><GStrong>Négliger la confiance.</GStrong> Sans escrow ni signaux de réassurance, l'acheteur africain — souvent échaudé par des arnaques — hésite et abandonne.</GLi>
        </GUl>
        <GCallout variant="info" title="La règle d'or, résumée">
          Mobile Money multi-opérateurs + carte, dans un checkout fluide et sécurisé, avec des prix qui intègrent les frais. C'est la formule gagnante — et c'est exactement ce que Novakou vous donne par défaut, sans configuration.
        </GCallout>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Commencer à encaisser dès aujourd'hui",
    content: (
      <>
        <GP>
          Vous connaissez désormais tout le paysage : les réseaux Mobile Money opérateur par opérateur, la carte pour la diaspora, le rôle des agrégateurs, les frais à maîtriser et les erreurs à éviter. La dernière étape est la plus simple : mettre tout cela en pratique sans vous transformer en informaticien.
        </GP>
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement — pas de carte bancaire ni d'engagement pour démarrer.</GLi>
          <GLi><GStrong>Ajoutez votre premier produit</GStrong> (formation, e-book, template, coaching) avec un prix en FCFA.</GLi>
          <GLi><GStrong>Activez vos moyens de paiement</GStrong> : Wave, Orange Money, MTN, Moov et carte, en un clic.</GLi>
          <GLi><GStrong>Partagez votre lien</GStrong> sur WhatsApp, Facebook ou TikTok, et encaissez votre première vente.</GLi>
        </GUl>
        <GP>
          En quelques minutes, vous passez d'un vendeur qui court après des transferts manuels à un business qui encaisse proprement, en Mobile Money et par carte, avec des paiements sécurisés. C'est la différence entre bricoler et vendre sérieusement. Pour la vue d'ensemble de tout ce que la plateforme peut faire, explorez aussi notre guide <GA href="/guides/mobile-money-encaisser-paiements">encaisser en Mobile Money</GA> et lancez-vous.
        </GP>
        <GP>
          Le paiement n'est plus un obstacle : c'est un avantage. En acceptant le bon éventail de moyens, fluidement et en confiance, vous levez le dernier frein entre votre produit et l'argent de vos clients. Il ne vous reste plus qu'à créer votre boutique et à ouvrir la porte grande ouverte à tous vos acheteurs, du Sénégal au Cameroun, de Bamako à la diaspora.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Quels moyens de paiement dois-je accepter pour vendre en Afrique ?",
    a: "Le trio gagnant : le Mobile Money multi-opérateurs (Wave, Orange Money, MTN Mobile Money, Moov Money) pour les clients locaux, plus la carte bancaire (Visa/Mastercard) pour la diaspora et l'international. Cette combinaison couvre la quasi-totalité des acheteurs francophones.",
  },
  {
    q: "Le Mobile Money ou la carte bancaire : que choisir ?",
    a: "Ce n'est pas l'un ou l'autre, c'est les deux. Le Mobile Money capte la masse des acheteurs sur le continent (c'est leur réflexe quotidien), tandis que la carte fait entrer la diaspora et les clients internationaux, souvent au pouvoir d'achat plus élevé. Fermer l'un des deux, c'est diviser vos ventes.",
  },
  {
    q: "À quoi sert un agrégateur de paiement comme CinetPay ou PayDunya ?",
    a: "Un agrégateur est un intermédiaire technique qui relie votre boutique à tous les opérateurs (Mobile Money et carte) via une seule connexion. Il est utile, mais son intégration reste un travail de développeur. Avec Novakou, vous n'avez pas à gérer d'agrégateur : tous les moyens de paiement sont déjà intégrés nativement.",
  },
  {
    q: "Les moyens de paiement varient-ils selon les pays ?",
    a: "Oui. Au Sénégal, Wave et Orange dominent ; au Cameroun, Orange et MTN ; au Bénin, MTN et Moov ; au Mali, Orange et Moov ; au Togo, T-Money et Flooz. Mais Wave, Orange, MTN et Moov reviennent partout dans la zone FCFA : les accepter tous vous rend compatible avec tous les pays.",
  },
  {
    q: "Combien coûtent les paiements en ligne en Afrique ?",
    a: "Chaque transaction supporte des frais : frais opérateur pour le Mobile Money, frais un peu plus élevés pour la carte, et commission de la plateforme. La bonne pratique est d'intégrer ces frais dans votre prix affiché. Le modèle le plus sain pour démarrer est la commission sur les ventes réelles, sans abonnement mensuel : pas de vente, pas de frais.",
  },
  {
    q: "Comment Novakou gère-t-elle tous ces moyens de paiement ?",
    a: "Nativement et en un clic. Wave, Orange Money, MTN Mobile Money, Moov Money et la carte bancaire sont déjà connectés dans la plateforme, avec paiement séquestré (escrow), multi-devises et retraits. Vous activez ce que vous voulez accepter, et l'acheteur voit tous ses moyens préférés au checkout — sans que vous ayez rien à brancher.",
  },
];

export default function MoyensPaiementAfrique() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
