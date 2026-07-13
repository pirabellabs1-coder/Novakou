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
  slug: "top-20-produits-digitaux-rentables-2026",
  title: "Top 20 des produits digitaux rentables à lancer en Afrique en 2026",
  subtitle:
    "20 idées concrètes de produits numériques à vendre sans stock, avec des fourchettes de prix en FCFA, créables depuis votre smartphone et payées en Mobile Money. De la formation vidéo aux templates Canva, choisissez votre première offre aujourd'hui.",
  category: "Créer",
  level: "Débutant",
  levelColor: "#7c3aed",
  gradient: "linear-gradient(135deg, #4c1d95, #7c3aed 60%, #22c55e)",
  icon: "lightbulb",
  time: "16 min",
  chapters: "10 sections",
  publishedAt: "2026-07-12",
  updatedAt: "2026-07-12",
  keywords: [
    "idées produits digitaux rentables Afrique 2026",
    "produits numériques à vendre Afrique",
    "quoi vendre en ligne Afrique",
    "business digital sans stock Afrique",
    "meilleurs produits digitaux 2026",
  ],
};

export const revalidate = 86400;

const SEO_TITLE = "Top 20 produits digitaux rentables en Afrique en 2026";
const SEO_DESCRIPTION =
  "20 idées de produits numériques rentables à vendre en Afrique en 2026 : formations, ebooks, templates, coaching, presets. Prix en FCFA, sans stock, paiement Mobile Money.";
const OG_IMAGE = `${APP_URL}/api/og?type=guide&title=${encodeURIComponent(
  "Top 20 des produits digitaux rentables en 2026",
)}&subtitle=${encodeURIComponent(
  "Idées concrètes à vendre sans stock en Afrique, prix en FCFA",
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
  src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400&h=700&fit=crop&q=80&auto=format",
  alt: "Créateur africain réfléchissant aux idées de produits digitaux à lancer en 2026",
  caption: "20 idées de produits numériques rentables — sans stock, créés au smartphone, payés en Mobile Money.",
};

const stats = [
  { value: "0 FCFA", label: "de stock à financer pour lancer un produit digital" },
  { value: "×∞", label: "vendez le même fichier une infinité de fois" },
  { value: "70–95 %", label: "de marge après commission, sans coût de fabrication" },
  { value: "Mobile Money", label: "Wave, Orange, MTN — encaissez dès la 1ʳᵉ vente" },
];

const sections: GuideSection[] = [
  {
    id: "pourquoi-2026",
    label: "Pourquoi le digital explose en Afrique en 2026",
    content: (
      <>
        <GP>
          Vendre un produit physique en Afrique, c'est avancer de l'argent pour acheter du stock, gérer la logistique, craindre l'invendu et courir après les livreurs. Vendre un <GStrong>produit numérique</GStrong>, c'est l'inverse : vous créez le fichier une seule fois, et vous le vendez ensuite des centaines de fois sans jamais le refabriquer. Pas de stock, pas de rupture, pas de frais de port. Un ebook ou une formation vidéo se duplique à l'infini pour zéro franc de coût supplémentaire.
        </GP>
        <GP>
          Trois forces se rejoignent en 2026 pour faire du digital l'opportunité de la décennie sur le continent. D'abord, <GStrong>le smartphone est partout</GStrong> : un jeune à Dakar, Abidjan ou Douala a en poche de quoi filmer, écrire, concevoir et vendre. Ensuite, <GStrong>le Mobile Money a résolu le problème du paiement</GStrong> : Wave, Orange Money et MTN Mobile Money permettent d'encaisser en quelques secondes, même sans carte bancaire ni compte en banque. Enfin, une génération entière cherche à apprendre, à se former et à consommer du contenu en français — et elle est prête à payer pour de la vraie valeur.
        </GP>
        <GP>
          Le résultat : des marges qu'aucun commerce classique n'offre. Là où un revendeur de vêtements se bat pour 15 % de marge, un créateur de produit digital garde l'essentiel de chaque vente. Reste une seule question, celle qui bloque la plupart des gens : <GStrong>quoi vendre ?</GStrong> Ce guide y répond avec 20 idées concrètes, classées par famille, chacune avec sa cible, sa fourchette de prix en FCFA et la raison précise pour laquelle elle se vend en Afrique.
        </GP>
        <GStats
          items={[
            { value: "1 fois", label: "créé une fois, vendu une infinité de fois" },
            { value: "24 h/24", label: "votre boutique vend même pendant votre sommeil" },
            { value: "0 stock", label: "aucun invendu, aucune logistique à gérer" },
          ]}
        />
        <GCallout variant="info" title="Un produit digital, c'est quoi exactement ?">
          Tout ce qui se télécharge ou se consulte en ligne : une formation vidéo, un ebook PDF, un template Canva ou Notion, un preset photo, un accès à une communauté privée, un coaching par visio. Le point commun : vous ne fabriquez rien de physique et vous livrez automatiquement après le paiement.
        </GCallout>
      </>
    ),
  },
  {
    id: "comment-lire",
    label: "6 familles, 20 idées : comment lire ce classement",
    content: (
      <>
        <GP>
          Pour vous aider à décider vite, nous avons regroupé les 20 idées en six grandes familles. Chacune correspond à une compétence ou une ressource que vous possédez peut-être déjà sans le savoir : un savoir-faire à transmettre, des mots à écrire, un talent de design, une capacité à accompagner, un œil artistique, ou simplement du temps organisé à louer.
        </GP>
        <GP>
          Ne cherchez pas la « meilleure » famille dans l'absolu : cherchez celle qui colle à ce que vous savez faire aujourd'hui. Le meilleur produit digital n'est pas le plus sophistiqué, c'est celui que vous pouvez lancer <GStrong>cette semaine</GStrong> et améliorer ensuite. Un fichier imparfait qui rapporte 50 000 FCFA vaut mille fois mieux qu'un projet parfait qui reste dans votre tête.
        </GP>
        <GCards
          items={[
            { icon: "smart_display", title: "1. Formations vidéo", text: "Transmettre une compétence ou un métier en vidéo. Idées 1 à 3." },
            { icon: "menu_book", title: "2. Ebooks & guides", text: "Écrire une fois ce que les gens cherchent. Idées 4 à 6." },
            { icon: "dashboard_customize", title: "3. Templates", text: "Canva, Notion, Excel : des modèles prêts à l'emploi. Idées 7 à 10." },
            { icon: "diversity_3", title: "4. Coaching & accompagnement", text: "Vendre votre temps et votre expertise. Idées 11 à 13." },
            { icon: "auto_awesome", title: "5. Packs, presets & prompts IA", text: "Des ressources créatives réutilisables. Idées 14 à 17." },
            { icon: "workspace_premium", title: "6. Abonnements & services", text: "Revenus récurrents et prestations claires. Idées 18 à 20." },
          ]}
        />
      </>
    ),
  },
  {
    id: "formations-video",
    label: "Famille 1 — Formations vidéo (idées 1 à 3)",
    content: (
      <>
        <GP>
          La formation vidéo est le produit digital le plus rentable d'Afrique francophone, et pour une raison simple : le savoir se paie cher. Une compétence qui fait gagner de l'argent ou du temps justifie un prix élevé, et la vidéo contourne l'obstacle de la lecture. Vous n'avez pas besoin d'un studio : un smartphone, une bonne lumière et un plan clair suffisent.
        </GP>
        <GH3>1. Formation compétence pro (marketing, community management, bureautique)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> étudiants, jeunes diplômés et salariés qui veulent une compétence monétisable rapidement. <GStrong>Prix :</GStrong> 15 000 à 75 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> face au chômage des jeunes, une formation « community manager » ou « publicité Facebook » promet un revenu concret. C'est un investissement, pas une dépense — et l'acheteur le perçoit ainsi.
        </GP>
        <GH3>2. Formation métier concret (couture, pâtisserie, coiffure, agriculture)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> femmes entrepreneures et jeunes qui veulent lancer une activité artisanale. <GStrong>Prix :</GStrong> 10 000 à 40 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> le savoir-faire manuel est très recherché, et le format vidéo montre le geste bien mieux qu'un livre. Une formation « pâtisserie maison pour vendre » ou « maraîchage rentable » trouve immédiatement son public.
        </GP>
        <GH3>3. Masterclass express (1 à 2 h sur un sujet précis)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> entrepreneurs pressés qui veulent un résultat sur un point précis. <GStrong>Prix :</GStrong> 5 000 à 20 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> le prix d'entrée bas déclenche l'achat impulsif, souvent directement depuis une conversation WhatsApp. « Réussir ses Reels en 1 h » ou « Maîtriser WhatsApp Business » sont des produits d'appel parfaits pour capter une première clientèle.
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1596526131083-e8c633064194?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Créatrice africaine filmant une formation vidéo avec son smartphone"
          caption="Un smartphone et un bon éclairage suffisent : la formation vidéo est le produit digital le plus rentable du continent."
        />
        <GCallout variant="tip" title="Commencez petit, montez en gamme">
          Lancez d'abord une masterclass à 10 000 FCFA pour valider l'intérêt, puis transformez-la en formation complète à 40 000 FCFA. Vous apprenez ce que veut votre audience avant d'investir des semaines de tournage.
        </GCallout>
      </>
    ),
  },
  {
    id: "ebooks-guides",
    label: "Famille 2 — Ebooks et guides (idées 4 à 6)",
    content: (
      <>
        <GP>
          L'ebook est le produit digital le plus accessible à créer : si vous savez écrire ce que d'autres cherchent, vous avez déjà un produit. Un guide PDF bien conçu résout un problème précis, et son prix — souvent celui d'un plat au restaurant — le rend irrésistible à l'achat impulsif. C'est aussi le format idéal pour un tout premier lancement, sans caméra ni montage.
        </GP>
        <GH3>4. Ebook pratique (recettes, business, développement personnel)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> le grand public, sur un thème du quotidien. <GStrong>Prix :</GStrong> 2 000 à 7 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> à ce prix, on n'hésite pas. Un ebook « 30 recettes africaines à petit budget » ou « Sortir de ses dettes en 90 jours » s'achète sur un coup de cœur, partagé de bouche à oreille sur WhatsApp.
        </GP>
        <GH3>5. Guide expert difficile à trouver (visa, création d'entreprise, immobilier)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> la diaspora, les futurs migrants, les entrepreneurs qui affrontent l'administration. <GStrong>Prix :</GStrong> 5 000 à 15 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> l'information rare a une valeur perçue élevée. Un « Guide complet du visa Canada depuis le Sénégal » ou « Créer sa SARL en Côte d'Ivoire, étape par étape » fait gagner des semaines et de l'argent — les acheteurs paient volontiers.
        </GP>
        <GH3>6. Planificateur ou carnet PDF à imprimer (budget, objectifs, repas)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> étudiants, mères de famille, personnes qui veulent s'organiser. <GStrong>Prix :</GStrong> 2 500 à 8 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> c'est un produit « utile tous les jours » qui se prête au partage et se décline facilement (planificateur de budget familial, carnet de tontine, agenda de révision).
        </GP>
        <GCallout variant="tip" title="Un ebook n'a pas besoin d'être long">
          Vingt à trente pages bien ciblées valent mieux qu'un pavé de deux cents pages. L'acheteur ne paie pas le nombre de pages, il paie la solution à son problème. Allez droit au but.
        </GCallout>
      </>
    ),
  },
  {
    id: "templates",
    label: "Famille 3 — Templates Canva, Notion et Excel (idées 7 à 10)",
    content: (
      <>
        <GP>
          Le template est un produit magique : vous concevez un modèle une fois, l'acheteur le duplique et l'adapte en quelques minutes. C'est le raccourci que tout entrepreneur cherche — gagner du temps et avoir l'air professionnel sans compétence technique. En Afrique, où chaque commerçant vend désormais sur Instagram et Facebook, la demande de visuels et d'outils prêts à l'emploi explose.
        </GP>
        <GH3>7. Templates Canva (posts réseaux, flyers, CV, cartes de visite)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> petits commerçants, community managers, chercheurs d'emploi. <GStrong>Prix :</GStrong> 3 000 à 15 000 FCFA le pack. <GStrong>Pourquoi ça se vend :</GStrong> tout le monde a besoin de visuels pro, personne n'a le temps de les créer de zéro. Un pack « 50 posts Instagram pour restaurant » se vend à répétition sans effort.
        </GP>
        <GH3>8. Templates Notion (gestion de projet, budget, CRM freelance)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> freelances, étudiants, jeunes cadres organisés. <GStrong>Prix :</GStrong> 4 000 à 20 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> Notion est devenu l'outil à la mode, mais le construire soi-même décourage. Un tableau de bord prêt à l'emploi fait gagner des heures.
        </GP>
        <GH3>9. Templates Excel et Google Sheets (comptabilité, stock, facturation, tontine)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> commerçants, PME, gestionnaires de tontine. <GStrong>Prix :</GStrong> 3 000 à 25 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> la gestion informelle est partout, et un fichier simple qui calcule le stock, les marges ou les cotisations de tontine remplace un logiciel coûteux. C'est un besoin quotidien et concret.
        </GP>
        <GH3>10. Templates de documents (contrats, devis, business plan)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> entrepreneurs et freelances qui veulent se professionnaliser. <GStrong>Prix :</GStrong> 5 000 à 30 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> un contrat ou un business plan clé en main rassure et fait gagner un temps précieux. La valeur perçue est élevée car l'alternative — payer un juriste ou un consultant — coûte bien plus cher.
        </GP>
        <GCards
          items={[
            { icon: "palette", title: "Canva", text: "Visuels, flyers, CV : le plus facile à créer et le plus demandé par les commerçants." },
            { icon: "grid_view", title: "Notion", text: "Tableaux de bord et systèmes d'organisation pour freelances et étudiants." },
            { icon: "table_chart", title: "Excel / Sheets", text: "Comptabilité, stock, tontine : des outils de gestion simples et concrets." },
            { icon: "description", title: "Documents", text: "Contrats, devis, business plans : la valeur perçue la plus élevée de la famille." },
          ]}
        />
      </>
    ),
  },
  {
    id: "coaching",
    label: "Famille 4 — Coaching et accompagnement (idées 11 à 13)",
    content: (
      <>
        <GP>
          Vous n'avez pas de fichier à vendre ? Vendez votre expertise directement. Le coaching et l'accompagnement se « productisent » très bien : vous transformez votre temps et votre savoir en une offre claire, au prix moyen le plus élevé de tout ce guide. La relation humaine et la promesse de résultat justifient des tarifs que peu de produits atteignent.
        </GP>
        <GH3>11. Coaching individuel (business, carrière, développement personnel, fitness)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> personnes motivées prêtes à investir sur elles-mêmes. <GStrong>Prix :</GStrong> 15 000 à 100 000 FCFA la séance ou le pack. <GStrong>Pourquoi ça se vend :</GStrong> l'accompagnement personnalisé donne des résultats et crée un lien de confiance. Un coach fitness ou un mentor business vend son attention, une ressource rare et donc chère.
        </GP>
        <GH3>12. Programme de groupe ou bootcamp (4 à 8 semaines)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> cohortes d'apprenants qui veulent avancer ensemble. <GStrong>Prix :</GStrong> 25 000 à 150 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> l'effet de groupe motive, et le prix moyen élevé rend l'activité très rentable avec peu de participants. Un « bootcamp lancement de business en 6 semaines » remplit facilement dix places à 50 000 FCFA.
        </GP>
        <GH3>13. Consultation express ou audit (30 min, relecture, diagnostic)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> entrepreneurs qui veulent un avis rapide et actionnable. <GStrong>Prix :</GStrong> 5 000 à 25 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> c'est rapide à livrer et facile à standardiser. « Audit de ton compte Instagram en 30 min » ou « Relecture de CV » sont des offres d'entrée qui mènent ensuite vers un accompagnement plus complet.
        </GP>
        <GCallout variant="success" title="Le coaching se combine avec le reste">
          La stratégie gagnante : une formation vidéo à bas prix comme produit d'appel, puis un coaching à prix élevé pour les clients les plus engagés. Vous montez naturellement en gamme et multipliez le revenu par client.
        </GCallout>
      </>
    ),
  },
  {
    id: "packs-presets-ia",
    label: "Famille 5 — Packs, presets et prompts IA (idées 14 à 17)",
    content: (
      <>
        <GP>
          Cette famille s'adresse aux créatifs et aux curieux de technologie. Ce sont des ressources réutilisables : on les crée une fois, on les vend en masse. Portées par l'explosion des créateurs de contenu et par la vague de l'intelligence artificielle, ces offres surfent sur les tendances de 2026 et attirent une clientèle jeune, connectée et prête à essayer.
        </GP>
        <GH3>14. Presets photo Lightroom et filtres vidéo</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> photographes amateurs, créateurs de contenu, influenceurs. <GStrong>Prix :</GStrong> 3 000 à 15 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> tout le monde veut de belles photos et une esthétique cohérente sur Instagram. Un pack de presets « ambiance dorée » donne en un clic le rendu d'un pro.
        </GP>
        <GH3>15. Packs audio, beats et sons</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> artistes, monteurs vidéo, podcasteurs. <GStrong>Prix :</GStrong> 5 000 à 30 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> la scène musicale africaine, portée par l'afrobeats, est en pleine effervescence. Un pack de beats ou de sons libres de droits trouve preneur auprès des créateurs qui produisent chaque jour.
        </GP>
        <GH3>16. Packs graphiques (icônes, mockups, polices, éléments)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> designers, community managers, petites agences. <GStrong>Prix :</GStrong> 5 000 à 20 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> ce sont des briques que les créatifs réutilisent projet après projet. Un « kit de mockups pour boutique en ligne » fait gagner des heures de travail.
        </GP>
        <GH3>17. Packs de prompts IA (ChatGPT pour entrepreneurs, marketing)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> entrepreneurs qui découvrent l'IA et veulent l'utiliser vite. <GStrong>Prix :</GStrong> 3 000 à 15 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> l'IA est le sujet de l'année, mais rares sont ceux qui savent bien la piloter. Un « pack de 100 prompts pour vendre plus » offre un raccourci concret et surfe sur une tendance brûlante.
        </GP>
        <GStats
          items={[
            { value: "2026", label: "l'année où l'IA et le contenu créatif atteignent le grand public" },
            { value: "3 000+", label: "FCFA le prix d'entrée d'un pack, idéal pour l'achat impulsif" },
            { value: "100 %", label: "réutilisable : créé une fois, vendu sans limite" },
          ]}
        />
      </>
    ),
  },
  {
    id: "abonnements-services",
    label: "Famille 6 — Abonnements et services productisés (idées 18 à 20)",
    content: (
      <>
        <GP>
          Les meilleures affaires sont celles qui rapportent chaque mois sans repartir de zéro. Cette dernière famille regroupe les modèles qui construisent un revenu stable : l'abonnement, la communauté et le service à prix fixe. C'est le passage du « vendeur qui court après chaque client » à « l'entrepreneur qui bâtit un business prévisible ».
        </GP>
        <GH3>18. Communauté ou espace membre payant</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> experts, influenceurs, coachs avec une audience fidèle. <GStrong>Prix :</GStrong> 3 000 à 15 000 FCFA par mois. <GStrong>Pourquoi ça se vend :</GStrong> les gens paient pour appartenir à un groupe, échanger et recevoir du contenu exclusif. Cent membres à 5 000 FCFA, c'est 500 000 FCFA récurrents chaque mois — la puissance de l'abonnement.
        </GP>
        <GH3>19. Newsletter ou contenu premium par abonnement</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> journalistes, analystes, experts d'un secteur de niche. <GStrong>Prix :</GStrong> 2 000 à 10 000 FCFA par mois. <GStrong>Pourquoi ça se vend :</GStrong> une analyse fiable et régulière (marchés, immobilier, crypto, agriculture) vaut de l'or pour ceux qui décident. L'abonnement transforme votre expertise en rente.
        </GP>
        <GH3>20. Service productisé (montage vidéo, design de logo, rédaction)</GH3>
        <GP>
          <GStrong>À qui ça s'adresse :</GStrong> freelances qui veulent des offres claires plutôt que des devis interminables. <GStrong>Prix :</GStrong> 10 000 à 75 000 FCFA. <GStrong>Pourquoi ça se vend :</GStrong> un service packagé — « logo livré en 48 h », « montage d'une vidéo courte », « rédaction de 5 posts » — se vend comme un produit, avec un prix fixe et un périmètre net. Le client sait exactement ce qu'il achète, et vous gagnez du temps.
        </GP>
        <GCallout variant="info" title="L'abonnement est le graal du créateur">
          Un produit vendu une fois vous oblige à retrouver un nouveau client chaque mois. Un abonnement fait rentrer de l'argent automatiquement tant que le membre reste. Novakou gère l'essai gratuit et le renouvellement pour vous — vous vous concentrez sur le contenu.
        </GCallout>
      </>
    ),
  },
  {
    id: "choisir-son-idee",
    label: "Comment choisir VOTRE idée parmi les 20",
    content: (
      <>
        <GP>
          Vingt idées, c'est vingt fois trop pour commencer. Le piège du débutant est de vouloir tout faire — et de ne rien lancer. Votre mission est d'en choisir <GStrong>une seule</GStrong>, celle qui coche le plus de cases pour vous aujourd'hui. Passez chaque idée qui vous attire à travers ces quatre filtres.
        </GP>
        <GUl>
          <GLi><GStrong>Compétence :</GStrong> avez-vous déjà le savoir ou le talent nécessaire ? Ne partez pas apprendre un métier pour le revendre — vendez ce que vous maîtrisez.</GLi>
          <GLi><GStrong>Public :</GStrong> connaissez-vous les gens qui en ont besoin ? Un produit sans audience précise se vend mal. Visez un groupe que vous comprenez.</GLi>
          <GLi><GStrong>Douleur :</GStrong> votre produit résout-il un vrai problème ou fait-il gagner du temps et de l'argent ? Plus la douleur est forte, plus le prix accepté est élevé.</GLi>
          <GLi><GStrong>Rapidité :</GStrong> pouvez-vous le lancer cette semaine ? Choisissez la version la plus simple, quitte à l'enrichir plus tard.</GLi>
        </GUl>
        <GP>
          Voici une lecture rapide des familles selon votre point de départ. Utilisez ce tableau comme boussole, pas comme règle absolue.
        </GP>
        <div className="my-8 overflow-x-auto">
          <table className="w-full text-left text-[15px] border-collapse">
            <thead>
              <tr className="border-b-2 border-[#7c3aed]/30">
                <th className="py-3 pr-4 font-bold text-[#191c1e]">Vous êtes…</th>
                <th className="py-3 pr-4 font-bold text-[#191c1e]">Famille conseillée</th>
                <th className="py-3 font-bold text-[#191c1e]">Prix de départ</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Expert d'un métier</td>
                <td className="py-3 pr-4">Formation vidéo</td>
                <td className="py-3">10 000–40 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">À l'aise à l'écrit</td>
                <td className="py-3 pr-4">Ebook ou guide</td>
                <td className="py-3">2 000–15 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Organisé / créatif</td>
                <td className="py-3 pr-4">Templates</td>
                <td className="py-3">3 000–25 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Pédagogue / mentor</td>
                <td className="py-3 pr-4">Coaching</td>
                <td className="py-3">15 000–100 000 FCFA</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 pr-4">Photographe / musicien</td>
                <td className="py-3 pr-4">Presets & packs</td>
                <td className="py-3">3 000–30 000 FCFA</td>
              </tr>
              <tr>
                <td className="py-3 pr-4">Avec une audience fidèle</td>
                <td className="py-3 pr-4">Abonnement / communauté</td>
                <td className="py-3">3 000–15 000 FCFA/mois</td>
              </tr>
            </tbody>
          </table>
        </div>
        <GP>
          Une fois votre idée choisie, ne la laissez pas dormir. La suite logique, c'est de la transformer en produit vendable — notre guide <GA href="/guides/creer-son-produit">créer son premier produit</GA> vous accompagne pas à pas, du fichier à la page de vente.
        </GP>
      </>
    ),
  },
  {
    id: "lancer-sur-novakou",
    label: "Comment lancer votre produit sur Novakou",
    content: (
      <>
        <GP>
          Avoir une bonne idée ne suffit pas : il faut un endroit pour encaisser, livrer et faire connaître. C'est exactement ce que Novakou fait pour vous, sans que vous ayez à construire un site web ni à jongler avec cinq outils. La plateforme est pensée pour l'Afrique : le Mobile Money est natif, les prix s'affichent en FCFA, et la livraison du produit est automatique après le paiement.
        </GP>
        <GP>
          Concrètement, en une seule après-midi, vous pouvez passer de l'idée à la boutique en ligne. Voici le chemin :
        </GP>
        <GImage
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1400&h=790&fit=crop&q=80&auto=format"
          alt="Entrepreneur africain lançant sa boutique de produits numériques sur Novakou depuis son ordinateur portable"
          caption="De l'idée à la première vente en une après-midi : boutique, Mobile Money et livraison automatique réunis."
        />
        <GUl>
          <GLi><GStrong>Créez votre compte vendeur</GStrong> gratuitement, sans carte bancaire ni engagement.</GLi>
          <GLi><GStrong>Ajoutez votre produit</GStrong> — formation, ebook, template, coaching ou abonnement — avec un titre, un prix en FCFA et un visuel.</GLi>
          <GLi><GStrong>Activez vos paiements</GStrong> : Wave, Orange Money, MTN Mobile Money et carte bancaire pour la diaspora, en quelques clics.</GLi>
          <GLi><GStrong>Partagez votre lien</GStrong> sur WhatsApp, Facebook ou TikTok, ou construisez un <GA href="/guides/tunnel-de-vente-novakou">tunnel de vente</GA> pour convertir davantage et augmenter votre panier moyen.</GLi>
          <GLi><GStrong>Encaissez et automatisez</GStrong> : la livraison se fait toute seule, et vous pilotez vos ventes en temps réel.</GLi>
        </GUl>
        <GP>
          Le paiement séquestré rassure vos acheteurs, l'affiliation vous amène des vendeurs partenaires, et les pixels publicitaires suivent vos campagnes jusqu'à la vente. Vous vous demandez pourquoi choisir Novakou plutôt qu'une autre solution ? Notre comparatif des <GA href="/guides/meilleures-plateformes-vendre-produits-digitaux-afrique">meilleures plateformes pour vendre en Afrique</GA> détaille tout, chiffres à l'appui.
        </GP>
        <GCallout variant="success" title="Le meilleur moment pour lancer, c'est maintenant">
          Ne cherchez pas la perfection. Choisissez une idée de cette liste, créez la version la plus simple possible, mettez-la en ligne et faites votre première vente. Vous améliorerez le produit avec les retours de vos vrais clients — c'est ainsi que naissent les créateurs à succès.
        </GCallout>
      </>
    ),
  },
];

const faq: GuideFaq[] = [
  {
    q: "Quel est le produit digital le plus rentable à lancer en Afrique en 2026 ?",
    a: "La formation vidéo reste la plus rentable car le savoir se paie cher (15 000 à 75 000 FCFA) et la vidéo contourne l'obstacle de la lecture. Mais le « meilleur » produit est celui qui correspond à votre compétence actuelle : un ebook, un template Canva ou un coaching peuvent être tout aussi rentables selon votre profil.",
  },
  {
    q: "Faut-il un budget de départ pour vendre un produit numérique ?",
    a: "Non. C'est l'avantage majeur du digital : aucun stock à financer, aucune logistique. Vous pouvez créer votre produit depuis votre smartphone et ouvrir votre boutique Novakou gratuitement. Vous ne payez qu'une commission simple sur les ventes réellement encaissées.",
  },
  {
    q: "Peut-on vraiment créer un produit digital avec un simple smartphone ?",
    a: "Oui. Un smartphone permet de filmer une formation, d'écrire un ebook, de concevoir un template sur Canva ou d'animer un coaching en visio. La plupart des créateurs à succès en Afrique ont démarré sans matériel professionnel, uniquement avec leur téléphone et une bonne idée.",
  },
  {
    q: "Comment mes clients paieront-ils mon produit digital ?",
    a: "Sur Novakou, l'acheteur paie en Mobile Money (Wave, Orange Money, MTN, Moov) ou par carte bancaire pour la diaspora. Le produit est livré automatiquement après le paiement, et les fonds sont sécurisés par le paiement séquestré jusqu'à confirmation de la vente.",
  },
  {
    q: "Combien puis-je vendre mon premier produit digital ?",
    a: "Cela dépend de la famille : un ebook se vend entre 2 000 et 7 000 FCFA, un template entre 3 000 et 25 000 FCFA, une formation entre 10 000 et 75 000 FCFA, et un coaching jusqu'à 100 000 FCFA. Commencez par un prix d'entrée accessible pour valider l'intérêt, puis montez en gamme.",
  },
  {
    q: "Quelle idée choisir si je débute totalement ?",
    a: "Choisissez la famille qui correspond à ce que vous savez déjà faire, puis la version la plus simple possible : un ebook court, une masterclass d'une heure ou un pack de templates. L'objectif est de lancer cette semaine, pas de viser la perfection. Notre guide « créer son premier produit » vous accompagne étape par étape.",
  },
];

export default function Top20ProduitsDigitaux2026() {
  return <GuideArticleLayout meta={meta} sections={sections} faq={faq} stats={stats} heroImage={heroImage} />;
}
