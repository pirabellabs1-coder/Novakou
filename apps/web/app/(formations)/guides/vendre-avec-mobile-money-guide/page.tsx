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
  slug: "vendre-avec-mobile-money-guide",
  title: "Vendre en ligne avec le Mobile Money en Afrique : le guide complet",
  subtitle:
    "70 % des Africains n'ont pas de carte bancaire, mais presque tous ont le Mobile Money. Wave, Orange Money, MTN MoMo, Moov : voici comment accepter ces paiements pour vendre vos produits numériques et ne plus jamais perdre une vente au checkout.",
  category: "Vendre",
  level: "Débutant",
  levelColor: "#006e2f",
  gradient: "linear-gradient(135deg, #003d1a, #006e2f 60%, #22c55e)",
  icon: "smartphone",
  time: "15 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "vendre avec Mobile Money",
    "accepter Wave Orange Money MTN en ligne",
    "encaisser Mobile Money produit digital",
    "paiement Mobile Money boutique en ligne",
    "vendre en ligne Afrique sans carte bancaire",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Vendre avec le Mobile Money en Afrique : le guide complet (Wave, Orange, MTN)";
const SEO_DESCRIPTION =
  "Comment accepter le Mobile Money (Wave, Orange Money, MTN MoMo, Moov) pour vendre vos produits numériques en Afrique. Parcours d'achat idéal, erreurs à éviter et intégration native Novakou + carte.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Vendre avec le Mobile Money en Afrique",
)}&subtitle=${encodeURIComponent(
  "Wave, Orange Money, MTN MoMo, Moov : le guide complet",
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
  alt: "Jeune entrepreneur africain payant un achat en ligne avec son téléphone en Mobile Money",
  caption: "En Afrique, la vente se conclut sur le téléphone, en Mobile Money — pas sur une carte bancaire.",
};

const stats = [
  { value: "70 %", label: "d'adultes non bancarisés en Afrique subsaharienne" },
  { value: "Wave, OM, MoMo", label: "les portefeuilles que vos clients utilisent déjà" },
  { value: "< 30 s", label: "pour payer quand le checkout est mobile-first" },
  { value: "FCFA", label: "la devise que voit l'acheteur, sans conversion" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-incontournable",
    label: "Pourquoi le Mobile Money est incontournable en Afrique",
    content: (
      <>
        <GP>
          Voici une vérité que trop de créateurs africains découvrent trop tard : en Afrique francophone, la carte bancaire n'est pas le moyen de paiement dominant. Elle est même minoritaire. Selon les données de la Banque mondiale, près de <GStrong>70 % des adultes en Afrique subsaharienne n'ont pas de compte bancaire classique</GStrong>. Mais ils ont presque tous une chose dans la poche : un téléphone avec un compte Mobile Money actif.
        </GP>
        <GP>
          Le Mobile Money — Wave, Orange Money, MTN Mobile Money, Moov Money — a fait ce que les banques n'ont jamais réussi : mettre un moyen de paiement dans la main de chaque personne, de l'étudiant à Dakar au commerçant à Bamako, de la maman entrepreneuse à Abidjan au jeune développeur à Cotonou. C'est devenu le réflexe de paiement du continent. On envoie de l'argent à sa famille en Mobile Money, on paie sa facture d'électricité en Mobile Money, on règle son taxi en Mobile Money.
        </GP>
        <GP>
          Alors quand vous vendez un produit numérique — une formation, un ebook, un template, un coaching — et que votre page de paiement ne propose <GStrong>que la carte bancaire</GStrong>, vous venez de fermer la porte à 7 acheteurs sur 10. Ce n'est pas une question de prix ni de qualité de votre produit : c'est une barrière de paiement. L'acheteur voulait acheter, mais il n'a pas pu.
        </GP>
        <GStats
          items={[
            { value: "70 %", label: "d'adultes sans compte bancaire en Afrique subsaharienne" },
            { value: "1er", label: "moyen de paiement quotidien : le Mobile Money" },
            { value: "7/10", label: "acheteurs perdus si vous n'acceptez que la carte" },
          ]}
        />
        <GCallout variant="info" title="Le vrai enjeu n'est pas d'attirer, c'est d'encaisser">
          Vous pouvez avoir la meilleure publicité, le meilleur produit et le meilleur prix : si le client ne peut pas payer avec Wave ou Orange Money, la vente n'existe pas. En Afrique, le paiement n'est pas la dernière étape — c'est celle qui décide de tout.
        </GCallout>
      </>
    ),
  },
  {
    id: "operateurs-par-pays",
    label: "Les principaux opérateurs Mobile Money par pays",
    content: (
      <>
        <GP>
          Le Mobile Money n'est pas un seul service : c'est un écosystème d'opérateurs, chacun dominant dans certains pays. Connaître qui utilise quoi vous évite de proposer un moyen de paiement absent là où sont vos clients. Voici les grands acteurs de l'Afrique francophone.
        </GP>
        <GCards
          items={[
            { icon: "waves", title: "Wave", text: "Le poids lourd au Sénégal et en Côte d'Ivoire. Frais bas, transferts quasi gratuits, application ultra-populaire chez les jeunes et les vendeurs en ligne." },
            { icon: "smartphone", title: "Orange Money", text: "Présent partout : Sénégal, Côte d'Ivoire, Mali, Cameroun, Burkina Faso, Guinée. Le portefeuille le plus universel de la zone francophone." },
            { icon: "sim_card", title: "MTN Mobile Money (MoMo)", text: "Leader en Côte d'Ivoire, Cameroun, Bénin et Guinée. Incontournable dès que vous vendez sur ces marchés." },
            { icon: "account_balance_wallet", title: "Moov Money", text: "Solide au Bénin, Togo, Côte d'Ivoire, Burkina Faso et Mali. Souvent le second réflexe après Orange ou MTN." },
          ]}
        />
        <GH3>Le bon opérateur dépend du pays de votre client</GH3>
        <GP>
          Un vendeur au Sénégal aura surtout besoin de <GStrong>Wave et Orange Money</GStrong>. En Côte d'Ivoire, le trio <GStrong>Wave, Orange Money et MTN MoMo</GStrong> couvre l'essentiel. Au Cameroun, ce sont <GStrong>Orange Money et MTN MoMo</GStrong> qui règnent. Au Bénin et au Togo, <GStrong>MTN MoMo et Moov Money</GStrong> dominent. Au Mali et au Burkina Faso, <GStrong>Orange Money et Moov</GStrong> sont les réflexes.
        </GP>
        <GP>
          La conclusion est simple : pour vendre à toute l'Afrique francophone, vous ne devez pas choisir <em>un</em> opérateur, vous devez tous les proposer. C'est exactement ce que fait une plateforme comme Novakou, qui agrège ces opérateurs pour que votre acheteur trouve toujours le sien. Pour les détails d'encaissement, voir notre guide <GA href="/guides/mobile-money-encaisser-paiements">encaisser des paiements en Mobile Money</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "accepter-mobile-money",
    label: "Comment accepter le Mobile Money pour vos produits numériques",
    content: (
      <>
        <GP>
          Beaucoup de créateurs débutent avec la « méthode manuelle » : ils affichent leur numéro Wave ou Orange Money, le client envoie l'argent, puis envoie une capture d'écran sur WhatsApp, et le vendeur livre le produit à la main. Ça fonctionne… pour cinq ventes par mois. Au-delà, c'est l'enfer : vous passez vos journées à vérifier des transferts, à courir après les preuves de paiement, à livrer manuellement, et à répondre « oui c'est bien reçu » cent fois par jour.
        </GP>
        <GP>
          Pire, cette méthode n'inspire aucune confiance. L'acheteur qui doit envoyer de l'argent à un numéro personnel, sans reçu, sans page sécurisée, hésite — et beaucoup renoncent. Vous avez besoin d'un vrai <GStrong>système d'encaissement</GStrong>, pas d'un numéro griffonné.
        </GP>
        <GH3>La bonne méthode : une page de paiement automatisée</GH3>
        <GP>
          La solution professionnelle, c'est une page de paiement qui accepte nativement le Mobile Money, encaisse automatiquement, envoie un reçu, et <GStrong>livre le produit tout seul</GStrong> dès que le paiement est confirmé. L'acheteur choisit Wave, Orange Money, MTN ou Moov, valide sur son téléphone, et reçoit instantanément l'accès à sa formation ou son fichier. Vous ne touchez à rien.
        </GP>
        <GUl>
          <GLi><GStrong>Encaissement automatique</GStrong> — plus de captures d'écran à vérifier, le paiement est confirmé par l'opérateur directement.</GLi>
          <GLi><GStrong>Livraison instantanée</GStrong> — le produit numérique se débloque seul, même à 3 h du matin pendant que vous dormez.</GLi>
          <GLi><GStrong>Reçu et facture</GStrong> — l'acheteur reçoit une preuve, vous gardez une trace comptable propre.</GLi>
          <GLi><GStrong>Zéro compétence technique</GStrong> — vous créez votre produit, la plateforme s'occupe de tout le reste.</GLi>
        </GUl>
        <GCallout variant="tip" title="Ne réinventez pas la roue du paiement">
          Intégrer soi-même les API de Wave, Orange, MTN et Moov demande des semaines de développement, des contrats avec chaque opérateur et une conformité complexe. Une plateforme spécialisée l'a déjà fait pour vous : vous branchez, vous vendez.
        </GCallout>
      </>
    ),
  },
  {
    id: "parcours-achat-ideal",
    label: "Le parcours d'achat idéal : mobile-first et ultra-rapide",
    content: (
      <>
        <GP>
          En Afrique, l'écrasante majorité des achats en ligne se font <GStrong>sur un smartphone</GStrong>, souvent avec une connexion 3G ou 4G capricieuse et un forfait data compté. Votre parcours d'achat doit être pensé pour ce contexte : léger, rapide, et sans la moindre étape superflue. Chaque seconde de chargement et chaque champ à remplir vous coûte des ventes.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Client validant un paiement Mobile Money sur son smartphone pour un produit numérique"
          caption="Le checkout idéal : moyen de paiement local visible d'emblée, validation en un geste sur le téléphone."
        />
        <GH3>À quoi ressemble un checkout qui convertit</GH3>
        <GUl>
          <GLi><GStrong>Le Mobile Money d'abord</GStrong> — Wave, Orange Money, MTN et Moov visibles dès la première étape, pas cachés derrière la carte.</GLi>
          <GLi><GStrong>Le prix en FCFA</GStrong> — l'acheteur voit un montant qu'il comprend, sans conversion mentale ni mauvaise surprise.</GLi>
          <GLi><GStrong>Le minimum de champs</GStrong> — un nom, un e-mail ou un numéro, et c'est tout. Chaque champ en trop est un client qui abandonne.</GLi>
          <GLi><GStrong>Une page qui charge vite</GStrong> — optimisée mobile, pour ne pas perdre l'acheteur sur une connexion lente.</GLi>
          <GLi><GStrong>Une réassurance visible</GStrong> — badge de paiement sécurisé, garantie, avis, pour vaincre la méfiance.</GLi>
        </GUl>
        <GP>
          Le but est qu'entre le clic sur « Acheter » et la confirmation du paiement, il s'écoule <GStrong>moins de 30 secondes</GStrong>. L'acheteur choisit son opérateur, saisit son numéro, valide le code reçu par SMS ou dans son application, et c'est terminé. Plus le chemin est court, plus vous convertissez.
        </GP>
        <GCallout variant="success" title="La règle d'or du checkout africain">
          Un clic de trop, un champ de trop, un moyen de paiement manquant : chacun fait chuter votre taux de conversion. Le meilleur checkout est celui qui se fait oublier.
        </GCallout>
      </>
    ),
  },
  {
    id: "erreurs-qui-font-fuir",
    label: "Les erreurs qui font fuir vos acheteurs",
    content: (
      <>
        <GP>
          Si vos publicités tournent bien mais que les ventes ne suivent pas, le coupable est presque toujours le paiement. Voici les erreurs les plus courantes — et les plus coûteuses — que commettent les vendeurs en Afrique.
        </GP>
        <GH3>Erreur nº 1 : n'accepter que la carte bancaire</GH3>
        <GP>
          C'est l'erreur fatale. Vous copiez le modèle des plateformes occidentales, vous ne proposez que Visa et Mastercard, et vous vous demandez pourquoi personne n'achète. La réponse est mécanique : la majorité de vos visiteurs n'ont pas de carte. Ils voulaient acheter, ils n'ont pas pu. C'est autant d'argent laissé sur la table, chaque jour.
        </GP>
        <GH3>Erreur nº 2 : un tunnel trop long</GH3>
        <GP>
          Créer un compte, confirmer un e-mail, remplir une adresse postale (pour un produit numérique !), cocher dix cases… Chaque étape supplémentaire divise votre conversion. Pour un produit digital, l'acheteur ne devrait avoir qu'à choisir son paiement et valider.
        </GP>
        <GH3>Erreur nº 3 : le paiement manuel et la méfiance</GH3>
        <GP>
          Demander à l'acheteur d'envoyer de l'argent à un numéro personnel puis d'envoyer une capture d'écran, c'est lui demander de vous faire une confiance aveugle. Beaucoup d'Africains ont déjà été victimes d'une arnaque en ligne : sans page sécurisée, sans reçu, sans garantie, ils reculent.
        </GP>
        <GCards
          items={[
            { icon: "credit_card_off", title: "Carte uniquement", text: "Vous excluez 7 acheteurs sur 10. Ajoutez toujours le Mobile Money local." },
            { icon: "steppers", title: "Trop d'étapes", text: "Chaque champ en trop fait fuir. Réduisez le checkout à l'essentiel." },
            { icon: "hourglass_empty", title: "Page trop lente", text: "Une page lourde sur connexion 3G perd l'acheteur avant même le paiement." },
            { icon: "gpp_maybe", title: "Aucune réassurance", text: "Sans badge sécurisé ni garantie, la méfiance l'emporte sur l'envie d'acheter." },
          ]}
        />
        <GCallout variant="warning" title="Le panier abandonné a une cause précise">
          Ce n'est presque jamais le prix. C'est un moyen de paiement absent, un formulaire interminable ou une page qui n'inspire pas confiance. Corrigez ces trois points et vos ventes décollent.
        </GCallout>
      </>
    ),
  },
  {
    id: "novakou-natif",
    label: "Comment Novakou intègre le Mobile Money nativement (+ carte)",
    content: (
      <>
        <GP>
          Novakou a été conçu dès le premier jour pour le marché africain — pas adapté après coup. Le Mobile Money n'y est pas une option cachée : c'est le cœur du système d'encaissement. Wave, Orange Money, MTN Mobile Money et Moov Money sont intégrés <GStrong>nativement</GStrong>, aux côtés de la carte bancaire pour la diaspora et l'international.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Créatrice africaine encaissant ses ventes de produits numériques en Mobile Money sur Novakou"
          caption="Un seul compte pour encaisser en Mobile Money localement et par carte à l'international."
        />
        <GH3>Le meilleur des deux mondes sur une seule page</GH3>
        <GP>
          Sur votre page de paiement Novakou, l'acheteur voit d'emblée son moyen préféré. Le client local à Dakar paie en <GStrong>Wave</GStrong>, celui d'Abidjan en <GStrong>Orange Money ou MTN</GStrong>, votre cousine de la diaspora à Paris règle par <GStrong>carte bancaire</GStrong> en euros. Personne n'est laissé de côté, et vous n'avez rien à configurer opérateur par opérateur.
        </GP>
        <GUl>
          <GLi><GStrong>Mobile Money agrégé</GStrong> — tous les grands opérateurs francophones réunis, en un seul checkout.</GLi>
          <GLi><GStrong>Carte bancaire mondiale</GStrong> — Visa et Mastercard pour capter la diaspora et l'international.</GLi>
          <GLi><GStrong>Multi-devises</GStrong> — FCFA par défaut, plus EUR, USD et autres, avec conversion automatique.</GLi>
          <GLi><GStrong>Paiement sécurisé (escrow)</GStrong> — les fonds sont protégés puis libérés, ce qui rassure l'acheteur et vous protège.</GLi>
          <GLi><GStrong>Livraison automatique</GStrong> — le produit numérique se débloque seul dès le paiement confirmé.</GLi>
        </GUl>
        <GP>
          Résultat : vous ne perdez plus une vente parce que « le paiement n'a pas marché ». Vous vendez à toute l'Afrique <em>et</em> au reste du monde depuis la même boutique. Pour comparer les solutions du marché, lisez notre guide des <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA>.
        </GP>
        <GCallout variant="tip" title="Local et mondial, sans compromis">
          La plupart des outils vous forcent à choisir : soit le Mobile Money, soit la carte internationale. Novakou vous offre les deux sur la même page, sans que vous ayez à jongler entre plusieurs services.
        </GCallout>
      </>
    ),
  },
  {
    id: "encaisser-retirer",
    label: "Encaisser, puis retirer votre argent",
    content: (
      <>
        <GP>
          Accepter le Mobile Money, c'est bien. Récupérer son argent facilement, c'est essentiel. Chez Novakou, le cycle de l'argent est pensé pour être aussi simple que la vente elle-même : vous encaissez, votre solde grandit, vous retirez vers votre propre compte Mobile Money ou votre banque.
        </GP>
        <GCards
          items={[
            { icon: "shopping_cart_checkout", title: "1. L'acheteur paie", text: "Il choisit Wave, Orange Money, MTN ou Moov et valide sur son téléphone en quelques secondes." },
            { icon: "lock", title: "2. Les fonds sont sécurisés", text: "Le paiement séquestré protège l'acheteur et le vendeur, puis les fonds sont libérés dans votre portefeuille." },
            { icon: "account_balance_wallet", title: "3. Votre solde grandit", text: "Vous suivez en temps réel votre solde disponible et en attente, avec chaque vente tracée." },
            { icon: "payments", title: "4. Vous retirez", text: "Vers votre compte Mobile Money ou par virement, avec une facture PDF générée automatiquement." },
          ]}
        />
        <GH3>Un portefeuille clair, des retraits maîtrisés</GH3>
        <GP>
          Vous voyez à tout moment combien vous avez gagné, combien est disponible au retrait, et combien est encore en cours de validation. Fini le flou des transferts manuels éparpillés sur trois numéros différents. Tout est centralisé, tout est traçable, et vos factures sont prêtes pour votre comptabilité.
        </GP>
        <GP>
          Cette clarté change tout quand votre activité grandit : au lieu de compter à la main les captures d'écran WhatsApp, vous pilotez un vrai tableau de bord financier. C'est la différence entre bricoler une vente et faire tourner un business.
        </GP>
      </>
    ),
  },
  {
    id: "exemples-par-pays",
    label: "Exemples concrets, pays par pays",
    content: (
      <>
        <GP>
          Le Mobile Money prend un visage différent selon l'endroit où sont vos clients. Voici comment un vendeur Novakou l'utilise concrètement, du Sénégal au Cameroun.
        </GP>
        <GUl>
          <GLi><GStrong>Sénégal</GStrong> — Aïssatou vend une formation en marketing digital à 25 000 FCFA. Ses clients règlent majoritairement en <GStrong>Wave</GStrong>, quelques-uns en Orange Money. La diaspora sénégalaise de France paie par carte en euros.</GLi>
          <GLi><GStrong>Côte d'Ivoire</GStrong> — Kouassi vend des templates Canva à 5 000 FCFA. Ses acheteurs utilisent <GStrong>Wave, Orange Money et MTN MoMo</GStrong> selon leur opérateur. Le lien de paiement circule sur WhatsApp et Instagram.</GLi>
          <GLi><GStrong>Cameroun</GStrong> — Nadia vend un coaching en développement personnel. À Douala et Yaoundé, <GStrong>Orange Money et MTN Mobile Money</GStrong> couvrent la quasi-totalité de ses ventes.</GLi>
          <GLi><GStrong>Bénin</GStrong> — Rodrigue lance un ebook à 3 000 FCFA. Ses clients paient en <GStrong>MTN MoMo et Moov Money</GStrong>, les deux réflexes du pays.</GLi>
          <GLi><GStrong>Mali</GStrong> — Fatoumata vend un pack de fichiers professionnels. <GStrong>Orange Money et Moov</GStrong> dominent, et la boutique affiche les prix en FCFA que tout le monde comprend.</GLi>
        </GUl>
        <GP>
          Dans chaque cas, le vendeur n'a rien configuré de spécial : il a créé son produit, la plateforme propose automatiquement les bons opérateurs à chaque acheteur. C'est cette adaptation locale, invisible mais décisive, qui fait la différence entre une vente conclue et un panier abandonné.
        </GP>
        <GCallout variant="info" title="Un seul produit, tous les pays">
          Vous n'avez pas besoin de créer une boutique par pays. Le même produit, le même lien et la même page servent le Sénégal, la Côte d'Ivoire, le Cameroun, le Bénin, le Mali et au-delà — chacun payant avec son opérateur habituel.
        </GCallout>
      </>
    ),
  },
  {
    id: "promouvoir-whatsapp",
    label: "Promouvoir et vendre sur WhatsApp",
    content: (
      <>
        <GP>
          En Afrique, une grande partie du commerce en ligne ne se joue pas sur un site web mais dans une <GStrong>conversation WhatsApp</GStrong>. C'est là que se nouent la confiance, la négociation et la décision d'achat. Votre stratégie de vente Mobile Money doit donc épouser ce réflexe.
        </GP>
        <GH3>Le lien de paiement, votre meilleur allié sur WhatsApp</GH3>
        <GP>
          Avec Novakou, vous générez un <GStrong>lien de paiement</GStrong> pour chaque produit et vous le collez directement dans la conversation. Le client clique, arrive sur une page propre et sécurisée, choisit son Mobile Money et paie — sans quitter son téléphone, sans créer de compte compliqué. Vous transformez une discussion en vente encaissée en quelques minutes.
        </GP>
        <GUl>
          <GLi><GStrong>Répondez avec un lien, pas un numéro</GStrong> — au lieu de dicter votre numéro Wave, envoyez une page de paiement pro qui rassure et livre automatiquement.</GLi>
          <GLi><GStrong>Utilisez le statut WhatsApp</GStrong> — publiez votre produit et son lien en statut pour toucher tous vos contacts chaque jour.</GLi>
          <GLi><GStrong>Créez des listes de diffusion</GStrong> — prévenez vos anciens acheteurs de vos nouveautés et vos ventes flash.</GLi>
          <GLi><GStrong>Relancez les indécis</GStrong> — un message personnalisé avec le lien direct au checkout convertit les hésitants.</GLi>
        </GUl>
        <GP>
          Pour aller plus loin, combinez WhatsApp avec les <GA href="/guides/creer-son-produit">bonnes pratiques de création de produit</GA> et vos publicités : une pub Facebook ou TikTok qui renvoie vers WhatsApp, où le lien de paiement Mobile Money conclut la vente. C'est le tunnel africain par excellence : social, mobile, et payé en Mobile Money.
        </GP>
        <GCallout variant="success" title="Le commerce conversationnel, encaissé proprement">
          WhatsApp crée la relation, le lien de paiement encaisse la vente. En reliant les deux, vous vendez comme un pro tout en gardant la proximité qui fait acheter en Afrique.
        </GCallout>
      </>
    ),
  },
  {
    id: "commencer",
    label: "Commencer à vendre en Mobile Money aujourd'hui",
    content: (
      <>
        <GP>
          Vous n'avez pas besoin de compétences techniques, ni de contrats avec les opérateurs, ni d'un développeur. Vous avez besoin d'un produit et d'une plateforme qui encaisse le Mobile Money à votre place. Voici votre chemin, étape par étape.
        </GP>
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement, en quelques secondes, sans carte bancaire.</GLi>
          <GLi><GStrong>Ajoutez votre premier produit</GStrong> — formation, ebook, template ou coaching — avec titre, prix en FCFA et visuel.</GLi>
          <GLi><GStrong>Activez les paiements</GStrong> — Mobile Money (Wave, Orange, MTN, Moov) et carte sont prêts, sans configuration complexe.</GLi>
          <GLi><GStrong>Partagez votre lien</GStrong> sur WhatsApp, Facebook, Instagram ou TikTok, et laissez la page encaisser et livrer toute seule.</GLi>
          <GLi><GStrong>Encaissez et retirez</GStrong> — suivez vos ventes en temps réel et retirez votre argent vers votre Mobile Money.</GLi>
        </GUl>
        <GP>
          Le Mobile Money a démocratisé le paiement en Afrique. Novakou démocratise la <GStrong>vente</GStrong> : il met entre vos mains le même système d'encaissement que les grands, sans le coût ni la complexité. Vous commencez petit, avec un produit, et vous grandissez à votre rythme. Pour approfondir la mécanique d'encaissement, gardez sous la main notre guide <GA href="/guides/mobile-money-encaisser-paiements">encaisser des paiements en Mobile Money</GA>.
        </GP>
        <GCallout variant="tip" title="La meilleure façon de comprendre, c'est d'essayer">
          En moins de dix minutes, vous pouvez avoir une boutique en ligne, un produit publié et un lien de paiement Mobile Money prêt à partager. Votre première vente n'attend plus qu'un clic.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Puis-je vraiment vendre en ligne sans carte bancaire en Afrique ?",
    a: "Oui, et c'est même la norme. La majorité des Africains paient en Mobile Money (Wave, Orange Money, MTN MoMo, Moov). Avec une plateforme comme Novakou, l'acheteur paie directement depuis son portefeuille mobile, sans jamais avoir besoin d'une carte bancaire.",
  },
  {
    q: "Quels opérateurs Mobile Money sont acceptés ?",
    a: "Les grands opérateurs de l'Afrique francophone : Wave, Orange Money, MTN Mobile Money et Moov Money. La carte bancaire (Visa/Mastercard) reste disponible en complément pour la diaspora et les paiements internationaux. L'acheteur choisit son moyen préféré au checkout.",
  },
  {
    q: "Comment le produit est-il livré après un paiement Mobile Money ?",
    a: "Automatiquement. Dès que le paiement est confirmé par l'opérateur, l'acheteur reçoit instantanément l'accès à sa formation, son ebook ou son fichier, ainsi qu'un reçu. Vous n'avez rien à faire manuellement, même la nuit.",
  },
  {
    q: "Comment je récupère l'argent encaissé en Mobile Money ?",
    a: "Vos ventes alimentent votre portefeuille sur la plateforme. Vous suivez votre solde disponible en temps réel et vous retirez vers votre propre compte Mobile Money ou par virement bancaire, avec une facture PDF générée automatiquement.",
  },
  {
    q: "Est-ce que je peux vendre à la diaspora en même temps ?",
    a: "Oui. La même page de paiement accepte le Mobile Money pour vos clients locaux et la carte bancaire pour la diaspora et l'international, avec affichage multi-devises (FCFA, EUR, USD…). Vous vendez à toute l'Afrique et au reste du monde depuis une seule boutique.",
  },
  {
    q: "Faut-il des compétences techniques pour accepter le Mobile Money ?",
    a: "Non. Vous n'avez ni à intégrer les API des opérateurs, ni à signer des contrats individuels, ni à coder quoi que ce soit. Vous créez votre compte, ajoutez votre produit et partagez votre lien : la plateforme s'occupe de tout l'encaissement.",
  },
];

export default function VendreAvecMobileMoney() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
