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
  slug: "vendre-ebook-en-afrique",
  title: "Vendre un ebook en Afrique : de l'écriture à la première vente",
  subtitle:
    "Le guide complet pour créer un ebook rentable et le vendre en FCFA : trouver un sujet, écrire vite, mettre en page sur Canva, protéger le PDF, fixer le prix et encaisser en Mobile Money avec Novakou.",
  category: "Créer",
  level: "Débutant",
  levelColor: "#16a34a",
  gradient: "linear-gradient(135deg, #14532d, #16a34a 60%, #84cc16)",
  icon: "menu_book",
  time: "15 min",
  chapters: "10 sections",
  publishedAt: "2026-07-13",
  updatedAt: "2026-07-13",
  keywords: [
    "vendre un ebook Afrique",
    "créer un ebook et le vendre",
    "ebook PDF Mobile Money",
    "écrire un ebook rentable",
    "vendre livre numérique Afrique francophone",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Vendre un ebook en Afrique : le guide complet pour débuter (2026)";
const SEO_DESCRIPTION =
  "Comment créer un ebook et le vendre en Afrique francophone : trouver un sujet rentable, écrire vite, mettre en page sur Canva, protéger le PDF, fixer le prix en FCFA et encaisser en Mobile Money avec Novakou.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Vendre un ebook en Afrique",
)}&subtitle=${encodeURIComponent(
  "De l'écriture à la première vente, en FCFA et en Mobile Money",
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
  src: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Auteur africain écrivant son ebook sur un ordinateur portable pour le vendre en ligne",
  caption: "Un ebook, c'est un savoir mis en pages une fois — et vendu des centaines de fois.",
};

const stats = [
  { value: "0 FCFA", label: "de coût de production : votre seul investissement, c'est votre temps" },
  { value: "100 %", label: "de marge : rien à imprimer, rien à stocker, rien à expédier" },
  { value: "2 000+", label: "FCFA de prix de départ réaliste pour un premier ebook" },
  { value: "24 h/24", label: "votre ebook se vend même quand vous dormez" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-ebook",
    label: "Pourquoi l'ebook est le produit idéal pour débuter",
    content: (
      <>
        <GP>
          Si vous voulez gagner votre premier revenu numérique en Afrique francophone, l'ebook est presque toujours la meilleure porte d'entrée. Pourquoi ? Parce qu'il combine trois avantages que peu de produits réunissent : il demande <GStrong>peu de moyens</GStrong>, il dégage une <GStrong>marge de 100 %</GStrong>, et il devient un <GStrong>actif</GStrong> qui continue de se vendre longtemps après que vous l'avez écrit.
        </GP>
        <GP>
          Contrairement à une formation vidéo, un ebook ne réclame ni caméra, ni micro, ni logiciel de montage, ni bonne connexion pour tourner. Vous avez besoin d'un smartphone ou d'un ordinateur, de votre savoir, et d'un peu de méthode. À Dakar, Abidjan, Douala ou Cotonou, cette simplicité change tout : vous pouvez écrire dans un taxi, entre deux clients, ou le soir chez vous, sans dépenser un franc.
        </GP>
        <GP>
          Une fois écrit, votre ebook ne coûte rien à « fabriquer » de nouveau. Vendez-le une fois, dix fois ou mille fois : c'est le même fichier PDF. Il n'y a rien à imprimer, rien à stocker, rien à livrer par transporteur. Chaque vente est donc du revenu quasiment pur. C'est ce qu'on appelle un <GStrong>actif qui travaille pour vous</GStrong> : vous fournissez l'effort une fois, et il génère de l'argent « en dormant », mois après mois.
        </GP>
        <GStats
          items={[
            { value: "1 fois", label: "d'écriture pour un nombre illimité de ventes" },
            { value: "PDF", label: "un seul format universel, lisible sur tous les téléphones" },
            { value: "Mobile Money", label: "encaissé en Wave, Orange, MTN ou carte, en quelques secondes" },
          ]}
        />
        <GCallout variant="tip" title="Le meilleur brouillon d'un business plus grand">
          Beaucoup de créateurs à succès ont commencé par un simple ebook à 3 000 FCFA. Il leur a servi à tester un sujet, à construire une audience et à financer leur première formation. Voyez votre ebook comme la première marche, pas comme la destination.
        </GCallout>
      </>
    ),
  },
  {
    id: "trouver-sujet",
    label: "Trouver un sujet qui se vend vraiment",
    content: (
      <>
        <GP>
          C'est l'étape la plus importante — et celle que la plupart des débutants ratent. Un ebook ne se vend pas parce qu'il est « intéressant ». Il se vend parce qu'il <GStrong>résout un problème précis</GStrong> que quelqu'un veut résoudre <GStrong>maintenant</GStrong>. La règle d'or : un ebook = un problème = une solution.
        </GP>
        <GP>
          Fuyez les sujets trop larges comme « réussir dans la vie » ou « l'entrepreneuriat ». Personne ne cherche ça. Les gens cherchent des réponses concrètes : « comment ouvrir un compte Wave professionnel », « 30 recettes de jus naturels à vendre à Abidjan », « réussir le concours d'entrée à la fonction publique au Sénégal », « créer sa page boutique sur WhatsApp Business ». Plus le problème est précis, plus l'acheteur se dit « c'est exactement pour moi ».
        </GP>
        <GH3>Comment savoir si un sujet a de la demande</GH3>
        <GUl>
          <GLi><GStrong>Écoutez les questions qui reviennent</GStrong> autour de vous, dans les groupes WhatsApp, en commentaire sous les publications. Une question posée dix fois est un ebook qui attend d'être écrit.</GLi>
          <GLi><GStrong>Partez de votre propre expérience</GStrong> : ce que vous savez faire et que d'autres galèrent à apprendre. Votre métier, votre parcours, une compétence que vous maîtrisez.</GLi>
          <GLi><GStrong>Visez un public qui a un peu d'argent</GStrong> et une vraie urgence : préparer un concours, lancer une activité, gagner de l'argent, résoudre un souci de santé ou de démarches administratives.</GLi>
        </GUl>
        <GImage
          src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Personne notant les idées de sujets d'ebook dans un carnet à côté de livres"
          caption="Le bon sujet, c'est celui dont les gens vous parlent déjà : écoutez-les avant d'écrire."
        />
        <GCards
          items={[
            { icon: "school", title: "Concours & examens", text: "« Réussir le BAC / le concours ENA / le TOEFL » — annales, méthode, pièges à éviter." },
            { icon: "storefront", title: "Business & argent", text: "« Lancer sa boutique en ligne », « 10 activités rentables avec 50 000 FCFA »." },
            { icon: "restaurant", title: "Recettes & savoir-faire", text: "Recettes locales, couture, pâtisserie, coiffure, agriculture — un savoir concret." },
            { icon: "favorite", title: "Santé & bien-être", text: "Nutrition, remise en forme, remèdes naturels, gestion du stress — avec prudence et sérieux." },
          ]}
        />
        <GP>
          Avant de vous lancer, cette lecture complémentaire vous aidera à cadrer votre idée : <GA href="/guides/creer-produit-numerique-afrique">créer un produit numérique en Afrique</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "ecrire",
    label: "Écrire vite et bien (même depuis un smartphone)",
    content: (
      <>
        <GP>
          Beaucoup abandonnent ici, en imaginant qu'écrire un livre prend des mois. Faux. Un ebook utile fait <GStrong>entre 20 et 50 pages</GStrong> — soit 5 000 à 12 000 mots. Ce n'est pas un roman : c'est un guide pratique. Court, clair et actionnable vaut mille fois mieux que long et bavard. Votre lecteur veut un résultat, pas de la littérature.
        </GP>
        <GH3>1. Faites d'abord le plan</GH3>
        <GP>
          Ne commencez jamais à écrire dans le vide. Listez d'abord tous les chapitres, comme une table des matières. Un plan simple et efficace : une <GStrong>introduction</GStrong> (le problème et ce que le lecteur va gagner), <GStrong>5 à 10 chapitres</GStrong> qui déroulent la solution étape par étape, et une <GStrong>conclusion</GStrong> avec un plan d'action. Chaque chapitre répond à une question. Une fois le plan posé, vous ne remplissez plus que des cases — c'est dix fois plus rapide.
        </GP>
        <GH3>2. Écrivez comme vous parlez</GH3>
        <GP>
          Imaginez que vous expliquez à un ami assis en face de vous. Phrases courtes, mots simples, exemples concrets tirés du quotidien africain. Pas besoin d'un français académique : un français juste, clair et chaleureux vend beaucoup mieux qu'un style compliqué.
        </GP>
        <GH3>3. Utilisez les outils que vous avez déjà</GH3>
        <GP>
          Google Docs (gratuit) fonctionne sur téléphone comme sur ordinateur, sauvegarde tout automatiquement, et vous suit partout. Vous pouvez même <GStrong>dicter à la voix</GStrong> : parlez, le téléphone écrit, vous corrigez ensuite. C'est parfait si taper au clavier vous ralentit. Fixez-vous un rythme réaliste : une heure d'écriture par jour, et votre ebook est bouclé en deux à trois semaines.
        </GP>
        <GCallout variant="info" title="La règle des 30 minutes">
          Ne cherchez pas la perfection au premier jet. Écrivez tout d'une traite, sans vous relire, puis corrigez à froid le lendemain. Séparer « écrire » et « corriger » double votre vitesse et réduit l'angoisse de la page blanche.
        </GCallout>
        <GP>
          Pour aller plus loin sur la conception d'un produit qui plaît, consultez notre guide <GA href="/guides/creer-son-produit">créer son premier produit</GA>.
        </GP>
      </>
    ),
  },
  {
    id: "mise-en-page",
    label: "Mise en page et couverture : soigner l'emballage",
    content: (
      <>
        <GP>
          Un contenu excellent dans une présentation négligée se vend mal — c'est injuste, mais c'est ainsi. La bonne nouvelle : vous n'avez pas besoin d'être graphiste. <GStrong>Canva</GStrong> (gratuit) fait tout le travail, depuis votre téléphone ou votre ordinateur.
        </GP>
        <GH3>La couverture : votre meilleure vendeuse</GH3>
        <GP>
          La couverture est la première chose que voit l'acheteur, souvent la seule avant de décider. Elle doit être <GStrong>lisible en tout petit</GStrong> (comme une vignette sur WhatsApp) et donner immédiatement l'idée du bénéfice. Un titre gros et percutant, un sous-titre qui promet un résultat, une image ou une couleur forte. Canva propose des centaines de modèles « couverture de livre » : choisissez-en un, changez le texte et les couleurs, c'est réglé en 20 minutes.
        </GP>
        <GH3>L'intérieur : aéré et agréable à lire</GH3>
        <GUl>
          <GLi><GStrong>Des titres et sous-titres clairs</GStrong> pour que le lecteur se repère d'un coup d'œil.</GLi>
          <GLi><GStrong>Des paragraphes courts</GStrong>, des listes à puces, des encadrés pour les points importants.</GLi>
          <GLi><GStrong>Une police simple</GStrong> et une taille confortable — la plupart liront sur téléphone.</GLi>
          <GLi><GStrong>Une page de titre et une table des matières</GStrong> : ça fait tout de suite « produit sérieux ».</GLi>
        </GUl>
        <GCallout variant="tip" title="Ajoutez une touche de valeur perçue">
          Une page « À propos de l'auteur » avec votre photo, un mot de bienvenue, et pourquoi pas des modèles ou une checklist en bonus à la fin. Ces petits détails augmentent la valeur perçue et justifient un prix plus élevé.
        </GCallout>
      </>
    ),
  },
  {
    id: "pdf-protege",
    label: "Transformer en PDF (et protéger votre travail)",
    content: (
      <>
        <GP>
          Le format universel de l'ebook, c'est le <GStrong>PDF</GStrong>. Il s'ouvre sur n'importe quel téléphone, tablette ou ordinateur, sans application spéciale, et conserve exactement votre mise en page. Depuis Canva ou Google Docs, il suffit de choisir « Télécharger » puis « PDF ». En un clic, votre livre est prêt à être vendu.
        </GP>
        <GH3>Protéger votre ebook du piratage</GH3>
        <GP>
          C'est la peur numéro un des auteurs en Afrique : « et si un acheteur partageait mon PDF gratuitement à tout son groupe WhatsApp » ? Le risque existe, mais on le réduit fortement avec quelques réflexes :
        </GP>
        <GUl>
          <GLi><GStrong>Personnalisez chaque page</GStrong> avec un pied de page discret (« Exemplaire réservé à un usage personnel — Novakou »). Cela décourage le partage.</GLi>
          <GLi><GStrong>Ne diffusez jamais votre PDF en clair</GStrong> : ne l'envoyez pas manuellement par WhatsApp. Faites-le livrer automatiquement après paiement.</GLi>
          <GLi><GStrong>Hébergez le fichier sur une plateforme sécurisée</GStrong> plutôt que de le laisser traîner sur un drive public.</GLi>
        </GUl>
        <GCallout variant="success" title="La protection intégrée de Novakou">
          Sur Novakou, votre ebook est hébergé de façon sécurisée et livré uniquement à l'acheteur après paiement confirmé. Le fichier n'est pas exposé publiquement, ce qui protège votre travail contre le téléchargement et le partage non autorisés. Vous vendez sans envoyer le PDF à la main à chaque client.
        </GCallout>
      </>
    ),
  },
  {
    id: "fixer-prix",
    label: "Fixer le juste prix en FCFA",
    content: (
      <>
        <GP>
          La question qui angoisse tout le monde : « à combien vendre mon ebook » ? Trop cher, personne n'achète  trop bas, vous laissez de l'argent sur la table et vous donnez une image bon marché. Pour un premier ebook en Afrique francophone, une fourchette réaliste se situe <GStrong>entre 2 000 et 10 000 FCFA</GStrong>.
        </GP>
        <GH3>Comment vous situer dans la fourchette</GH3>
        <GUl>
          <GLi><GStrong>2 000 – 3 500 FCFA</GStrong> : un guide court et pratique, un premier produit pour tester votre sujet et faire du volume.</GLi>
          <GLi><GStrong>4 000 – 6 000 FCFA</GStrong> : un ebook complet, bien mis en page, avec des bonus (modèles, checklists). Le sweet spot le plus fréquent.</GLi>
          <GLi><GStrong>7 000 – 10 000 FCFA</GStrong> : un ebook très spécialisé qui fait gagner ou économiser beaucoup d'argent (business, concours, démarches). L'acheteur paie pour le résultat, pas pour le nombre de pages.</GLi>
        </GUl>
        <GP>
          Retenez le principe clé : on ne fixe pas le prix selon le nombre de pages, mais selon <GStrong>la valeur du résultat</GStrong>. Un ebook de 25 pages qui aide à décrocher un concours vaut plus qu'un pavé de 100 pages sans utilité claire. Pour approfondir la psychologie du prix, lisez notre guide dédié : <GA href="/guides/fixer-prix-formation">comment fixer le prix d'une formation ou d'un produit</GA>.
        </GP>
        <GCallout variant="warning" title="N'ayez pas peur de commencer, puis d'augmenter">
          Beaucoup de débutants bradent leur ebook à 1 000 FCFA par manque de confiance. Commencez plutôt à un prix honnête, observez les ventes, récoltez quelques avis, puis augmentez. Un produit qui a des avis et une preuve sociale peut se vendre plus cher sans problème.
        </GCallout>
      </>
    ),
  },
  {
    id: "publier-encaisser",
    label: "Publier sur Novakou et encaisser en Mobile Money",
    content: (
      <>
        <GP>
          Votre ebook est écrit, mis en page et prêt en PDF. Il reste le plus excitant : le mettre en vente et encaisser. C'est là que <GStrong>Novakou</GStrong> change la donne, parce que tout est pensé pour l'Afrique francophone : le Mobile Money natif, le FCFA par défaut, et une page de vente prête en quelques minutes.
        </GP>
        <GCards
          items={[
            { icon: "person_add", title: "1. Créer le compte", text: "Ouvrez votre compte vendeur gratuitement, en quelques secondes, sans carte bancaire." },
            { icon: "upload_file", title: "2. Ajouter l'ebook", text: "Titre, description, prix en FCFA, couverture, puis téléversez votre fichier PDF." },
            { icon: "account_balance_wallet", title: "3. Activer les paiements", text: "Wave, Orange, MTN, Moov et carte : cochez vos moyens et vous êtes prêt à encaisser." },
            { icon: "share", title: "4. Partager le lien", text: "Diffusez votre lien de paiement sur WhatsApp, TikTok, Facebook ou dans votre bio." },
          ]}
        />
        <GH3>Créer votre produit en quelques minutes</GH3>
        <GP>
          Créez votre compte vendeur gratuitement, cliquez sur « Ajouter un produit », choisissez le type « ebook / fichier numérique », puis renseignez le titre, la description, le prix en FCFA, la couverture, et téléversez votre PDF. Votre produit obtient aussitôt sa <GStrong>page de vente optimisée</GStrong> : visuel, description, prix, avis et bouton d'achat. Aucun site web à construire, aucune compétence technique.
        </GP>
        <GH3>Encaisser dans tous les moyens de paiement d'Afrique</GH3>
        <GP>
          C'est le point décisif. Sur Novakou, l'acheteur paie avec <GStrong>Wave, Orange Money, MTN Mobile Money, Moov Money</GStrong> ou par <GStrong>carte bancaire</GStrong> pour la diaspora. Le client local paie en Mobile Money en quelques secondes, comme il a l'habitude de le faire. Personne n'est bloqué au moment de payer — et en Afrique, un paiement fluide, c'est la vente qui se conclut au lieu de s'évaporer.
        </GP>
        <GStats
          items={[
            { value: "Wave", label: "Orange, MTN, Moov et carte : tous les moyens réunis" },
            { value: "PDF", label: "livré automatiquement à l'acheteur après paiement" },
            { value: "Escrow", label: "paiement sécurisé qui rassure l'acheteur et vous protège" },
          ]}
        />
        <GH3>Une page de vente qui convertit</GH3>
        <GP>
          Soignez votre page : un titre orienté bénéfice (« Réussissez votre concours en 30 jours »), une description qui parle du problème puis de la solution, un aperçu du sommaire, quelques avis, et un appel à l'action clair. Ajoutez la garantie « satisfait ou remboursé » et le badge de paiement sécurisé : ces signaux de confiance transforment un curieux hésitant en acheteur.
        </GP>
        <GCallout variant="success" title="Vous vendez, la livraison se fait toute seule">
          Dès qu'un paiement Mobile Money ou carte est confirmé, l'acheteur reçoit automatiquement l'accès à son ebook, et votre solde est crédité. Vous suivez vos ventes en temps réel et retirez vers votre compte Mobile Money. Zéro logistique, zéro envoi manuel.
        </GCallout>
      </>
    ),
  },
  {
    id: "promouvoir",
    label: "Promouvoir : WhatsApp, réseaux et lien de paiement",
    content: (
      <>
        <GP>
          Un ebook en ligne ne se vend pas tout seul le premier jour : il faut le faire connaître. La bonne nouvelle, c'est qu'en Afrique, les canaux les plus puissants sont gratuits et déjà dans votre poche.
        </GP>
        <GH3>WhatsApp, votre meilleur canal de vente</GH3>
        <GP>
          Le commerce social est roi en Afrique francophone. Depuis Novakou, générez un <GStrong>lien de paiement</GStrong> et partagez-le directement dans vos conversations, vos groupes et votre statut WhatsApp. Le client clique, il paie en Mobile Money, il reçoit l'ebook — le tout sans quitter la discussion. Racontez votre histoire, publiez un extrait, un témoignage, puis glissez le lien. C'est là que se jouent la majorité des ventes.
        </GP>
        <GH3>Les réseaux sociaux et le lien unique</GH3>
        <GUl>
          <GLi><GStrong>Facebook et TikTok</GStrong> : publiez des extraits, des astuces tirées de l'ebook, des vidéos courtes. Chaque publication finit par « lien en bio pour l'ebook complet ».</GLi>
          <GLi><GStrong>Instagram</GStrong> : une belle couverture, des carrousels de conseils, votre lien de paiement dans la bio.</GLi>
          <GLi><GStrong>Un extrait gratuit</GStrong> : offrez le premier chapitre en échange d'un contact, puis relancez vers la version complète.</GLi>
        </GUl>
        <GP>
          Le grand avantage du lien de paiement Novakou : il se colle <GStrong>partout</GStrong> — bio, message, publicité, statut — et mène droit au checkout. Pour tout comprendre, lisez : <GA href="/guides/vendre-partout-avec-lien-de-paiement">vendre partout avec un lien de paiement</GA>.
        </GP>
        <GCallout variant="tip" title="Recrutez des vendeurs à votre place">
          Activez l'affiliation sur votre ebook : d'autres personnes le recommandent avec leur propre lien et touchent une commission sur chaque vente. C'est le bouche-à-oreille, mais mesuré et récompensé — une armée de vendeurs motivés, sans avancer un centime de publicité.
        </GCallout>
      </>
    ),
  },
  {
    id: "exemple-concret",
    label: "Un exemple concret, déroulé de A à Z",
    content: (
      <>
        <GP>
          Prenons <GStrong>Aïcha</GStrong>, coiffeuse à Abidjan. Depuis des années, ses clientes et des débutantes lui posent la même question : « comment lancer mon salon avec peu d'argent » ? Elle décide d'en faire un ebook.
        </GP>
        <GUl>
          <GLi><GStrong>Le sujet</GStrong> : « Lancer son salon de coiffure à domicile avec 100 000 FCFA ». Précis, orienté résultat, avec un public qui a une vraie urgence.</GLi>
          <GLi><GStrong>L'écriture</GStrong> : elle fait un plan de 8 chapitres (matériel, prix, clientèle, hygiène, réseaux sociaux…) et dicte le contenu sur Google Docs, une heure par soir. En trois semaines, elle a 32 pages.</GLi>
          <GLi><GStrong>La mise en page</GStrong> : sur Canva, une couverture rose et dorée, un titre percutant, l'intérieur aéré, et une checklist de matériel en bonus. Elle exporte en PDF.</GLi>
          <GLi><GStrong>Le prix</GStrong> : elle fixe 5 000 FCFA. Son ebook fait gagner du temps et de l'argent  le prix est vite justifié.</GLi>
          <GLi><GStrong>La publication</GStrong> : elle crée son produit sur Novakou, active Wave, Orange et MTN, et obtient sa page de vente.</GLi>
          <GLi><GStrong>La promotion</GStrong> : elle poste des extraits sur TikTok, partage son lien de paiement dans son statut WhatsApp et dans deux groupes de coiffeuses.</GLi>
        </GUl>
        <GP>
          Résultat le premier mois : 24 ventes à 5 000 FCFA, soit <GStrong>120 000 FCFA</GStrong> encaissés en Mobile Money, sans un franc de publicité. Le mois suivant, ses premières acheteuses laissent des avis, le bouche-à-oreille s'enclenche, et les ventes continuent « en dormant ». Aïcha n'a écrit qu'une seule fois.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Entrepreneure africaine consultant les ventes de son ebook sur son téléphone"
          caption="Une première vente en change une deuxième : le plus dur, c'est de commencer."
        />
      </>
    ),
  },
  {
    id: "monter-en-gamme",
    label: "Monter en gamme : de l'ebook à la formation",
    content: (
      <>
        <GP>
          Votre ebook n'est pas une fin : c'est le début d'un business plus grand. Une fois vos premières ventes réalisées, vous détenez trois choses précieuses : un sujet qui marche, une audience qui vous fait confiance, et des acheteurs prêts à payer davantage pour aller plus loin.
        </GP>
        <GH3>La montée en gamme naturelle</GH3>
        <GUl>
          <GLi><GStrong>Une formation vidéo</GStrong> qui approfondit l'ebook, vendue 25 000 à 50 000 FCFA. Ceux qui ont aimé le livre veulent l'accompagnement complet.</GLi>
          <GLi><GStrong>Un accompagnement ou coaching</GStrong> individuel, pour ceux qui veulent des résultats plus vite.</GLi>
          <GLi><GStrong>Un abonnement</GStrong> à une communauté privée ou à des contenus renouvelés, pour des revenus récurrents chaque mois.</GLi>
          <GLi><GStrong>Un pack de plusieurs ebooks</GStrong> sur des sujets connexes, vendu plus cher que l'unité.</GLi>
        </GUl>
        <GP>
          Sur Novakou, tout cela se gère depuis le même compte : vous proposez un <GStrong>upsell</GStrong> juste après l'achat de l'ebook (« Ajoutez la formation vidéo pour 20 000 FCFA de plus »), vous automatisez des séquences d'e-mails qui accompagnent l'acheteur, et votre panier moyen grimpe sans effort supplémentaire. L'ebook devient la porte d'entrée d'un écosystème.
        </GP>
        <GCallout variant="info" title="Comparez et choisissez la bonne base">
          Avant de bâtir votre gamme, prenez cinq minutes pour comparer les solutions : <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">les meilleures plateformes pour vendre des produits digitaux en Afrique</GA>. Vous verrez pourquoi le Mobile Money natif et le tout-en-un font la différence sur le long terme.
        </GCallout>
        <GP>
          L'essentiel est ailleurs : le plus dur n'est pas d'écrire un chef-d'œuvre, c'est de <GStrong>publier et de faire votre première vente</GStrong>. Une fois cette barrière franchie, tout devient plus simple. Alors ouvrez Google Docs, posez votre plan, et lancez-vous — votre premier ebook peut être en vente avant la fin du mois.
        </GP>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Combien de pages doit faire un ebook pour se vendre ?",
    a: "Entre 20 et 50 pages suffisent largement pour un ebook pratique et rentable. L'important n'est pas la longueur mais l'utilité : un guide court et actionnable qui résout un problème précis se vend mieux qu'un long document bavard. Concentrez-vous sur le résultat que vous faites gagner à votre lecteur.",
  },
  {
    q: "À quel prix vendre mon premier ebook en FCFA ?",
    a: "Une fourchette réaliste en Afrique francophone se situe entre 2 000 et 10 000 FCFA. Un guide court et pratique se vend autour de 2 000 à 3 500 FCFA, un ebook complet avec bonus autour de 4 000 à 6 000 FCFA, et un ebook très spécialisé (business, concours) jusqu'à 7 000 à 10 000 FCFA. Fixez le prix selon la valeur du résultat, pas selon le nombre de pages.",
  },
  {
    q: "Ai-je besoin d'un ordinateur pour créer mon ebook ?",
    a: "Non. Un smartphone suffit. Vous pouvez écrire (ou dicter à la voix) sur Google Docs, créer votre couverture et votre mise en page sur Canva, exporter en PDF, puis publier sur Novakou — le tout depuis votre téléphone. C'est ce qui rend l'ebook idéal pour débuter sans investissement.",
  },
  {
    q: "Comment protéger mon ebook contre le piratage et le partage ?",
    a: "Ne diffusez jamais votre PDF en clair par WhatsApp. Personnalisez chaque page avec un pied de page discret et hébergez le fichier sur une plateforme sécurisée. Sur Novakou, votre ebook est stocké de façon sécurisée et livré uniquement à l'acheteur après paiement confirmé, ce qui protège votre travail contre le téléchargement et le partage non autorisés.",
  },
  {
    q: "Comment mes clients paient-ils mon ebook en Afrique ?",
    a: "Sur Novakou, vos acheteurs paient avec Wave, Orange Money, MTN Mobile Money, Moov Money ou par carte bancaire pour la diaspora. Le paiement se fait en quelques secondes, l'ebook est livré automatiquement après confirmation, et votre solde est crédité pour retrait vers votre compte Mobile Money.",
  },
  {
    q: "Combien de temps faut-il pour écrire et publier un ebook ?",
    a: "En consacrant environ une heure par jour, comptez deux à trois semaines pour écrire un ebook de 20 à 50 pages. La mise en page sur Canva prend quelques heures, et la publication sur Novakou seulement quelques minutes. Vous pouvez donc avoir votre premier ebook en vente avant la fin du mois.",
  },
];

export default function VendreEbookEnAfrique() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
