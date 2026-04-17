// ============================================================
// Help Center — Types & Articles Data
// ============================================================

export interface HelpCategory {
  id: string;
  name: string;
  icon: string; // material-symbols-outlined name
  description: string;
}

export interface HelpArticle {
  id: string;
  slug: string;
  title: string;
  category: string; // matches HelpCategory.id
  content: string; // HTML string
  relatedArticles: string[]; // slugs
  updatedAt: string; // ISO date
}

// ============================================================
// Categories
// ============================================================

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "demarrer",
    name: "Demarrer",
    icon: "rocket_launch",
    description: "Premiers pas sur Novakou et configuration initiale",
  },
  {
    id: "services",
    name: "Services",
    icon: "design_services",
    description: "Creer, gerer et optimiser vos services",
  },
  {
    id: "commandes",
    name: "Commandes",
    icon: "assignment",
    description: "Cycle de vie des commandes, livraisons et revisions",
  },
  {
    id: "paiements",
    name: "Paiements & Retraits",
    icon: "account_balance_wallet",
    description: "Methodes de paiement, retraits et commissions",
  },
  {
    id: "profil",
    name: "Profil",
    icon: "person",
    description: "Completer votre profil, portfolio et badges",
  },
  {
    id: "litiges",
    name: "Litiges",
    icon: "gavel",
    description: "Ouvrir et suivre un litige avec un client",
  },
  {
    id: "securite",
    name: "Securite",
    icon: "shield",
    description: "Double authentification, sessions et alertes",
  },
  {
    id: "abonnements",
    name: "Abonnements",
    icon: "card_membership",
    description: "Plans, fonctionnalites et changement de formule",
  },
];

// ============================================================
// Articles
// ============================================================

export const HELP_ARTICLES: HelpArticle[] = [
  // --- Demarrer ---
  {
    id: "1",
    slug: "premiers-pas-freelancehigh",
    title: "Premiers pas sur Novakou",
    category: "demarrer",
    content: `
<p>Bienvenue sur Novakou ! Cette plateforme vous permet de proposer vos services a une clientele internationale, avec un accent particulier sur l'Afrique francophone et la diaspora.</p>
<p>Apres votre inscription, vous accedez a votre tableau de bord freelance. C'est votre centre de commande : vous y retrouvez vos revenus, vos commandes actives, vos messages et vos statistiques de performance.</p>
<p>Pour demarrer efficacement, nous vous recommandons de suivre ces etapes dans l'ordre :</p>
<ol>
<li><strong>Completez votre profil</strong> — ajoutez une photo professionnelle, une bio accrocheuse et vos competences principales.</li>
<li><strong>Verifiez votre email et votre telephone</strong> — cela debloque les niveaux KYC 1 et 2, necessaires pour recevoir des commandes.</li>
<li><strong>Creez votre premier service</strong> — utilisez le wizard en 4 etapes pour publier votre premiere offre sur le marketplace.</li>
<li><strong>Configurez vos methodes de retrait</strong> — ajoutez un compte bancaire, un portefeuille Mobile Money ou PayPal.</li>
</ol>
<p>Une barre de progression dans votre profil vous guide a travers chaque etape. Plus votre profil est complet, plus vous apparaissez haut dans les resultats de recherche.</p>
`,
    relatedArticles: ["completer-profil", "creer-un-service", "verification-kyc"],
    updatedAt: "2026-02-28",
  },
  {
    id: "2",
    slug: "verification-kyc",
    title: "Comprendre la verification KYC",
    category: "demarrer",
    content: `
<p>Le KYC (Know Your Customer) est un processus de verification progressive qui renforce la confiance entre les utilisateurs de la plateforme. Novakou utilise 4 niveaux de verification.</p>
<h3>Niveau 1 — Email verifie</h3>
<p>Des votre inscription, un code OTP est envoye a votre adresse email. En le confirmant, vous accedez aux fonctionnalites de base : navigation sur le marketplace, consultation des profils et messagerie limitee.</p>
<h3>Niveau 2 — Telephone verifie</h3>
<p>Ajoutez et verifiez votre numero de telephone via un code SMS. Ce niveau vous permet d'envoyer des offres personnalisees et de recevoir des commandes.</p>
<h3>Niveau 3 — Piece d'identite</h3>
<p>Soumettez une copie de votre carte d'identite nationale, passeport ou permis de conduire. Une equipe de moderation verifie le document sous 24 a 48 heures. Ce niveau est obligatoire pour publier des services et effectuer des retraits de fonds.</p>
<h3>Niveau 4 — Verification professionnelle</h3>
<p>Fournissez des justificatifs supplementaires (diplomes, certifications, portfolio verifie). Ce niveau debloque le badge Elite et releve les limites de retrait mensuelles. Il est recommande pour les freelances souhaitant attirer des clients premium.</p>
<p>Vos niveaux KYC sont visibles dans la section Securite de vos parametres. Chaque niveau superieur augmente votre credibilite aupres des clients.</p>
`,
    relatedArticles: ["premiers-pas-freelancehigh", "configurer-2fa", "badges-certifications"],
    updatedAt: "2026-02-25",
  },
  {
    id: "3",
    slug: "naviguer-tableau-de-bord",
    title: "Naviguer dans le tableau de bord",
    category: "demarrer",
    content: `
<p>Le tableau de bord Novakou est concu pour vous donner une vue d'ensemble instantanee de votre activite. Voici un tour d'horizon des sections principales.</p>
<p><strong>Barre laterale gauche</strong> — Votre menu de navigation principal. Vous y trouvez tous les liens vers vos services, commandes, finances, messages, profil, parametres et cette page d'aide. Sur mobile, elle se transforme en menu hamburger.</p>
<p><strong>Panneau central</strong> — L'espace de travail principal. C'est la que s'affichent les pages que vous consultez : dashboard, liste de commandes, wizard de creation de service, etc.</p>
<p><strong>En-tete superieur</strong> — Contient le logo Novakou et la cloche de notifications. Un badge rouge indique le nombre de notifications non lues.</p>
<p><strong>Cartes statistiques</strong> — Sur la page d'accueil du dashboard, quatre cartes vous montrent vos revenus totaux, les montants en attente, le nombre de commandes en cours et les messages non lus. Ces chiffres se mettent a jour en temps reel.</p>
<p>Utilisez les raccourcis clavier pour naviguer plus rapidement : appuyez sur <kbd>/</kbd> pour ouvrir la recherche rapide depuis n'importe quelle page.</p>
`,
    relatedArticles: ["premiers-pas-freelancehigh", "completer-profil"],
    updatedAt: "2026-02-20",
  },

  // --- Services ---
  {
    id: "4",
    slug: "creer-un-service",
    title: "Comment creer un service",
    category: "services",
    content: `
<p>Creer un service est la premiere etape pour commencer a vendre sur Novakou. Le wizard de creation vous guide en 4 etapes simples.</p>
<h3>Etape 1 — Informations generales</h3>
<p>Choisissez un titre accrocheur (maximum 80 caracteres), selectionnez une categorie et une sous-categorie, ajoutez des tags pertinents et redigez une description detaillee de votre offre. La description doit expliquer clairement ce que le client recevra.</p>
<h3>Etape 2 — Forfaits et tarification</h3>
<p>Definissez jusqu'a 3 forfaits : Basique, Standard et Premium. Pour chaque forfait, indiquez le prix (en euros), le delai de livraison, le nombre de revisions incluses et les elements fournis. Les prix sont affiches dans la devise choisie par le visiteur.</p>
<h3>Etape 3 — Extras et FAQ</h3>
<p>Ajoutez des options payantes supplementaires (livraison express, revisions supplementaires, fichiers source). Completez aussi une FAQ pour repondre aux questions courantes des acheteurs.</p>
<h3>Etape 4 — Galerie et publication</h3>
<p>Uploadez jusqu'a 5 images et 1 video de presentation. Previsualisez votre service tel qu'il apparaitra sur le marketplace, puis publiez-le. Votre service sera soumis a la moderation avant d'etre visible publiquement.</p>
<p>Conseil : les services avec une video de presentation recoivent en moyenne 40% de clics en plus.</p>
`,
    relatedArticles: ["configurer-forfaits", "ajouter-images-service", "optimiser-service-seo"],
    updatedAt: "2026-03-01",
  },
  {
    id: "5",
    slug: "configurer-forfaits",
    title: "Configurer les forfaits de votre service",
    category: "services",
    content: `
<p>Les forfaits sont le coeur de votre offre commerciale. Un bon agencement de forfaits augmente significativement votre taux de conversion. Novakou vous permet de definir 3 niveaux.</p>
<h3>Forfait Basique</h3>
<p>C'est votre offre d'entree. Elle doit etre attractive et accessible pour inciter les clients a passer commande. Incluez le strict minimum de votre prestation avec un delai raisonnable. Exemple : pour un logo, le forfait Basique pourrait inclure 1 concept, 1 revision et une livraison en 5 jours.</p>
<h3>Forfait Standard</h3>
<p>C'est generalement le forfait le plus vendu. Ajoutez plus de valeur par rapport au Basique : plus de revisions, un delai plus court, des livrables supplementaires. Le prix devrait representer environ 1.5x a 2x le forfait Basique.</p>
<h3>Forfait Premium</h3>
<p>Votre offre haut de gamme. Incluez tout ce que vous pouvez offrir : livraison prioritaire, revisions illimitees, fichiers source, support etendu. Ce forfait cible les clients qui veulent le meilleur service possible et sont prets a payer en consequence.</p>
<p>Vous pouvez modifier vos forfaits a tout moment depuis la page de gestion de vos services. Les commandes en cours ne sont pas affectees par les modifications.</p>
<p><strong>Astuce :</strong> analysez les forfaits de vos concurrents dans la meme categorie pour positionner vos prix de maniere competitive.</p>
`,
    relatedArticles: ["creer-un-service", "comprendre-commissions", "ajouter-images-service"],
    updatedAt: "2026-02-27",
  },
  {
    id: "6",
    slug: "ajouter-images-service",
    title: "Ajouter des images et une video a votre service",
    category: "services",
    content: `
<p>Les visuels sont determinants pour attirer l'attention des acheteurs sur le marketplace. Novakou vous permet d'ajouter jusqu'a 5 images et 1 video de presentation par service.</p>
<h3>Images</h3>
<p>Utilisez des images de haute qualite qui illustrent concretement votre travail. Les formats acceptes sont JPG, PNG et WebP, avec une taille maximale de 10 Mo par image. La resolution recommandee est de 1200x800 pixels minimum.</p>
<p>La premiere image est celle qui apparait dans la vignette du marketplace — choisissez-la avec soin. Elle doit etre visuellement impactante et donner immediatement une idee de votre prestation.</p>
<h3>Video</h3>
<p>Vous pouvez ajouter une video de presentation de 30 secondes a 2 minutes. Presentez-vous, expliquez votre processus de travail et montrez des exemples concrets. Les formats acceptes sont MP4 et WebM, avec une taille maximale de 50 Mo.</p>
<p>Les images sont hebergees sur Cloudinary avec optimisation automatique (compression, redimensionnement, conversion en WebP). Vous n'avez pas besoin de vous soucier du poids des fichiers une fois uploades.</p>
<p><strong>Bon a savoir :</strong> les services avec au moins 3 images de qualite et une video ont un taux de conversion 2 a 3 fois superieur a ceux avec une seule image.</p>
`,
    relatedArticles: ["creer-un-service", "configurer-forfaits", "optimiser-service-seo"],
    updatedAt: "2026-02-22",
  },
  {
    id: "7",
    slug: "optimiser-service-seo",
    title: "Optimiser votre service pour la recherche",
    category: "services",
    content: `
<p>Un service bien optimise pour la recherche apparait plus souvent et plus haut dans les resultats du marketplace. Voici les bonnes pratiques a suivre.</p>
<h3>Le titre</h3>
<p>Votre titre doit etre clair, precis et contenir les mots-cles principaux que vos clients potentiels rechercheraient. Evitez les titres vagues comme "Je fais du graphisme" et preferez "Creation de logo professionnel et identite visuelle".</p>
<h3>La description</h3>
<p>Redigez une description detaillee d'au moins 300 mots. Expliquez ce que le client recevra, votre processus de travail, vos qualifications et ce qui vous differencie. Utilisez naturellement les mots-cles lies a votre domaine.</p>
<h3>Les tags</h3>
<p>Ajoutez 3 a 5 tags pertinents. Les tags aident le moteur de recherche a comprendre la nature de votre service. Consultez les tags populaires dans votre categorie pour vous inspirer.</p>
<h3>La categorie</h3>
<p>Choisissez la categorie et la sous-categorie les plus precises possible. Un service bien categorise est mieux reference et apparait aux bons acheteurs.</p>
<p>Novakou utilise la recherche full-text PostgreSQL pour indexer vos services. Les mots-cles dans le titre ont plus de poids que ceux dans la description. Mettez a jour regulierement votre service pour maintenir sa visibilite.</p>
`,
    relatedArticles: ["creer-un-service", "ajouter-images-service", "mettre-en-pause-service"],
    updatedAt: "2026-02-18",
  },
  {
    id: "8",
    slug: "mettre-en-pause-service",
    title: "Mettre en pause ou supprimer un service",
    category: "services",
    content: `
<p>Il peut arriver que vous souhaitiez temporairement retirer un service du marketplace sans le supprimer definitivement. Novakou propose deux options.</p>
<h3>Mise en pause</h3>
<p>La mise en pause desactive votre service sur le marketplace : il n'apparait plus dans les resultats de recherche et les clients ne peuvent plus le commander. Cependant, toutes vos statistiques, avis et donnees sont conserves. Vous pouvez reactiver le service a tout moment en un clic.</p>
<p>Cette option est ideale si vous partez en vacances (combinez-la avec le mode vacances de votre profil), si vous etes temporairement surcharge de commandes, ou si vous souhaitez mettre a jour votre offre avant de la republier.</p>
<h3>Suppression</h3>
<p>La suppression retire definitivement le service. Les commandes en cours ne sont pas affectees et doivent etre livrees normalement. En revanche, les avis associes et les statistiques seront perdus.</p>
<p>Avant de supprimer un service, envisagez plutot de le mettre en pause. Si vous souhaitez proposer une offre differente, vous pouvez aussi dupliquer un service existant et modifier la copie, ce qui vous fait gagner du temps.</p>
<p>Pour acceder a ces options, rendez-vous dans <strong>Mes Services</strong>, cliquez sur le menu contextuel (trois points) du service concerne et selectionnez l'action souhaitee.</p>
`,
    relatedArticles: ["creer-un-service", "comprendre-cycle-commande"],
    updatedAt: "2026-02-15",
  },

  // --- Commandes ---
  {
    id: "9",
    slug: "comprendre-cycle-commande",
    title: "Comprendre le cycle d'une commande",
    category: "commandes",
    content: `
<p>Chaque commande sur Novakou suit un cycle de vie precis. Comprendre ce cycle vous aide a gerer efficacement vos projets et a satisfaire vos clients.</p>
<h3>1. Nouvelle commande</h3>
<p>Lorsqu'un client passe commande, vous recevez une notification. Les fonds sont immediatement places en sequestre (escrow). Vous avez 24 heures pour accepter ou refuser la commande. Si vous ne reagissez pas, la commande est automatiquement acceptee.</p>
<h3>2. En cours</h3>
<p>Une fois acceptee, le compte a rebours du delai de livraison demarre. Vous pouvez communiquer avec le client via le chat integre a la commande, poser des questions et demander des precisions.</p>
<h3>3. Livraison</h3>
<p>Quand votre travail est termine, cliquez sur "Marquer comme livre" et joignez les fichiers de livraison. Le client a 3 jours pour valider ou demander une revision.</p>
<h3>4. Revision ou validation</h3>
<p>Si le client demande une revision, vous recevez ses commentaires detailles et devez effectuer les modifications dans le nombre de revisions incluses dans le forfait. Si le client valide la livraison, les fonds sont liberes dans votre portefeuille.</p>
<h3>5. Commande terminee</h3>
<p>Apres validation, les deux parties peuvent laisser un avis. La commande est archivee et les fonds deviennent disponibles pour le retrait. Si le client ne repond pas sous 3 jours, la livraison est automatiquement validee.</p>
`,
    relatedArticles: ["livrer-commande", "gerer-revisions", "ouvrir-litige"],
    updatedAt: "2026-03-02",
  },
  {
    id: "10",
    slug: "livrer-commande",
    title: "Livrer une commande",
    category: "commandes",
    content: `
<p>La livraison est l'etape cruciale de chaque commande. Voici comment proceder correctement sur Novakou.</p>
<h3>Preparer vos fichiers</h3>
<p>Rassemblez tous les livrables dans les formats convenus avec le client. Si le forfait inclut les fichiers source, n'oubliez pas de les joindre. Les formats acceptes incluent tous les types de fichiers courants : images, documents, archives ZIP, fichiers de design, code source, etc.</p>
<h3>Envoyer la livraison</h3>
<p>Depuis la page de detail de la commande, cliquez sur le bouton "Marquer comme livre". Uploadez vos fichiers (taille maximale : 200 Mo par fichier, 500 Mo au total par livraison) et ajoutez un message de livraison decrivant ce qui est fourni.</p>
<h3>Apres la livraison</h3>
<p>Le client recoit une notification et dispose de 3 jours pour examiner votre travail. Pendant cette periode, il peut valider la livraison (les fonds sont immediatement liberes), demander une revision (vous etes notifie des modifications souhaitees), ou ne rien faire (la livraison est automatiquement validee apres 3 jours).</p>
<p><strong>Conseil :</strong> envoyez toujours un message personnalise avec votre livraison. Expliquez ce que vous avez fait, les choix techniques ou creatifs que vous avez operes, et proposez d'echanger si le client a des questions. Cette attention augmente significativement les avis positifs.</p>
`,
    relatedArticles: ["comprendre-cycle-commande", "gerer-revisions", "demander-extension-delai"],
    updatedAt: "2026-03-01",
  },
  {
    id: "11",
    slug: "gerer-revisions",
    title: "Gerer les revisions d'une commande",
    category: "commandes",
    content: `
<p>Les revisions font partie integrante du processus de livraison. Bien les gerer est essentiel pour maintenir une bonne relation client et un taux de satisfaction eleve.</p>
<h3>Revisions incluses</h3>
<p>Chaque forfait definit un nombre de revisions incluses. Si le client demande une revision dans cette limite, vous devez effectuer les modifications sans cout supplementaire. Les commentaires du client sont visibles dans l'historique de la commande.</p>
<h3>Revisions supplementaires</h3>
<p>Si le client a epuise ses revisions incluses mais souhaite des modifications supplementaires, vous pouvez proposer un extra payant de revision. Le client doit accepter et payer avant que vous ne procediez.</p>
<h3>Bonnes pratiques</h3>
<p>Lisez attentivement les commentaires du client avant de commencer la revision. Si les demandes sont floues, posez des questions de clarification via le chat integre. Essayez de livrer la revision dans un delai raisonnable — idealement sous 24 a 48 heures.</p>
<p>Si vous estimez que les modifications demandees sortent du cadre initial de la commande, communiquez-le clairement au client et proposez une offre personnalisee pour le travail supplementaire. En cas de desaccord, vous pouvez ouvrir un litige.</p>
<p>Chaque revision est tracee dans la timeline de la commande, ce qui sert de preuve en cas de litige.</p>
`,
    relatedArticles: ["livrer-commande", "comprendre-cycle-commande", "ouvrir-litige"],
    updatedAt: "2026-02-26",
  },
  {
    id: "12",
    slug: "demander-extension-delai",
    title: "Demander une extension de delai",
    category: "commandes",
    content: `
<p>Parfois, des imprevus surviennent et vous ne pouvez pas respecter le delai de livraison initial. Novakou vous permet de demander une extension de delai aupres de votre client.</p>
<h3>Comment proceder</h3>
<p>Depuis la page de detail de la commande, cliquez sur "Demander une extension". Indiquez le nouveau delai souhaite et expliquez brievement la raison de votre demande. Le client recoit une notification et peut accepter ou refuser.</p>
<h3>Impact sur votre profil</h3>
<p>Les demandes d'extension sont prises en compte dans votre taux de livraison a temps. Un taux eleve de livraisons dans les delais ameliore votre classement dans les resultats de recherche et votre eligibilite aux badges (Rising Talent, Top Rated).</p>
<p>Cependant, une extension approuvee par le client a beaucoup moins d'impact negatif qu'une livraison en retard sans communication prealable. Communiquez toujours proactivement avec vos clients en cas de difficulte.</p>
<p><strong>Recommandation :</strong> demandez l'extension le plus tot possible, pas a la derniere minute. Les clients apprecient la transparence et sont generalement comprehensifs lorsqu'on les previent a l'avance.</p>
`,
    relatedArticles: ["comprendre-cycle-commande", "livrer-commande"],
    updatedAt: "2026-02-20",
  },

  // --- Paiements & Retraits ---
  {
    id: "13",
    slug: "methodes-retrait",
    title: "Methodes de retrait disponibles",
    category: "paiements",
    content: `
<p>Novakou propose plusieurs methodes de retrait adaptees a votre localisation geographique. Toutes les methodes sont accessibles depuis la section <strong>Finances</strong> de votre tableau de bord.</p>
<h3>Mobile Money (Afrique)</h3>
<p>C'est la methode privilegiee pour les freelances en Afrique francophone. Les operateurs supportes incluent Orange Money (Senegal, Cote d'Ivoire, Cameroun, Mali, Burkina Faso), Wave (Senegal, Cote d'Ivoire), et MTN Mobile Money (Cote d'Ivoire, Cameroun). Le retrait est generalement credite en moins de 24 heures via CinetPay.</p>
<h3>Virement SEPA</h3>
<p>Pour les freelances en zone euro (France, Belgique, etc.), le virement SEPA est la methode la plus economique. Le delai de reception est de 1 a 3 jours ouvrables. Aucun frais supplementaire n'est applique par Novakou pour les virements SEPA.</p>
<h3>PayPal</h3>
<p>Disponible dans la plupart des pays. Les fonds sont credites sur votre compte PayPal sous 24 a 48 heures. Des frais PayPal standard s'appliquent a la reception.</p>
<h3>Wise (TransferWise)</h3>
<p>Ideal pour les transferts internationaux avec des taux de change competitifs. Connectez votre compte Wise depuis les parametres de paiement et recevez vos fonds en 1 a 2 jours ouvrables.</p>
<p>Le retrait minimum est de 10 EUR (ou equivalent). Assurez-vous que votre verification KYC est au niveau 3 minimum avant de demander un retrait.</p>
`,
    relatedArticles: ["comprendre-commissions", "portefeuille-multi-devises", "facturation-freelance"],
    updatedAt: "2026-03-03",
  },
  {
    id: "14",
    slug: "comprendre-commissions",
    title: "Comprendre les commissions Novakou",
    category: "paiements",
    content: `
<p>Novakou preleve une commission sur chaque transaction pour financer le fonctionnement de la plateforme, le systeme d'escrow, le support client et le developpement de nouvelles fonctionnalites.</p>
<h3>Taux de commission par plan</h3>
<p>Le taux de commission depend de votre plan d'abonnement actuel :</p>
<ul>
<li><strong>Plan Gratuit :</strong> 20% de commission sur chaque vente</li>
<li><strong>Plan Pro (15 EUR/mois) :</strong> 15% de commission</li>
<li><strong>Plan Business (45 EUR/mois) :</strong> 10% de commission</li>
<li><strong>Plan Agence (99 EUR/mois) :</strong> 8% de commission</li>
</ul>
<h3>Comment ca fonctionne</h3>
<p>Lorsqu'un client paie 100 EUR pour votre service avec le plan Gratuit, vous recevez 80 EUR dans votre portefeuille. La commission est automatiquement deduite au moment de la liberation des fonds, apres validation de la livraison par le client.</p>
<h3>Rentabiliser un abonnement</h3>
<p>Le plan Pro devient rentable a partir de 300 EUR de ventes mensuelles (vous economisez 15 EUR de commission par rapport au plan Gratuit, soit le prix de l'abonnement). Evaluez votre volume de ventes pour choisir le plan optimal.</p>
<p>Les commissions sont detaillees dans chaque facture generee automatiquement. Vous pouvez telecharger vos factures en PDF depuis la section Finances.</p>
`,
    relatedArticles: ["methodes-retrait", "plans-abonnement", "facturation-freelance"],
    updatedAt: "2026-02-28",
  },
  {
    id: "15",
    slug: "portefeuille-multi-devises",
    title: "Portefeuille multi-devises",
    category: "paiements",
    content: `
<p>Novakou vous offre un portefeuille multi-devises qui vous permet de gerer vos fonds dans plusieurs monnaies simultanement.</p>
<h3>Devises supportees</h3>
<p>Votre portefeuille peut detenir des soldes en EUR (Euro), FCFA (Franc CFA), USD (Dollar americain), GBP (Livre sterling) et MAD (Dirham marocain). La devise par defaut de la plateforme est l'Euro.</p>
<h3>Conversion entre devises</h3>
<p>Vous pouvez convertir des fonds d'une devise a l'autre directement depuis votre portefeuille. Les taux de conversion sont mis a jour regulierement et affiches avant chaque operation. Un recapitulatif du montant converti, du taux applique et des eventuels frais est presente avant confirmation.</p>
<h3>Recevoir des paiements</h3>
<p>Les paiements sont recus dans la devise utilisee par le client lors de sa commande. Si un client en Cote d'Ivoire paie en FCFA et que votre devise preferee est l'EUR, le montant sera converti automatiquement au taux en vigueur.</p>
<p>L'historique de chaque transaction est disponible par devise, avec des filtres par periode, type d'operation (vente, retrait, conversion) et statut (en attente, complete, echoue).</p>
`,
    relatedArticles: ["methodes-retrait", "comprendre-commissions"],
    updatedAt: "2026-02-24",
  },
  {
    id: "16",
    slug: "facturation-freelance",
    title: "Facturation et documents comptables",
    category: "paiements",
    content: `
<p>Novakou genere automatiquement des factures pour chaque transaction, ce qui vous simplifie la gestion comptable.</p>
<h3>Factures de vente</h3>
<p>A chaque commande terminee, une facture PDF est generee contenant le detail de la prestation, le montant brut, la commission Novakou prelevee et le montant net credite dans votre portefeuille. Ces factures sont telechargables depuis la section <strong>Finances > Factures</strong>.</p>
<h3>Factures d'abonnement</h3>
<p>Si vous avez un plan payant (Pro, Business ou Agence), une facture mensuelle est emise pour le montant de votre abonnement. Ces factures sont conformes et incluent les mentions legales requises.</p>
<h3>Export comptable</h3>
<p>Vous pouvez exporter l'ensemble de vos transactions au format CSV pour les importer dans votre logiciel de comptabilite. Un rapport annuel recapitulatif est egalement disponible en PDF pour faciliter vos declarations fiscales.</p>
<p><strong>Note importante :</strong> Novakou fournit les documents pour faciliter votre gestion, mais ne constitue pas un conseil fiscal. Consultez un comptable ou un expert fiscal pour vos obligations declaratives specifiques a votre pays de residence.</p>
`,
    relatedArticles: ["comprendre-commissions", "methodes-retrait", "plans-abonnement"],
    updatedAt: "2026-02-21",
  },

  // --- Profil ---
  {
    id: "17",
    slug: "completer-profil",
    title: "Completer et optimiser votre profil",
    category: "profil",
    content: `
<p>Un profil complet et soigne est votre meilleure carte de visite sur Novakou. Les clients consultent votre profil avant de passer commande — c'est souvent le facteur decisif.</p>
<h3>Photo de profil</h3>
<p>Utilisez une photo professionnelle de qualite, bien eclairee, ou votre visage est clairement visible. Les profils avec photo recoivent 3 fois plus de clics que ceux sans.</p>
<h3>Bio et titre professionnel</h3>
<p>Votre titre apparait dans les resultats de recherche (ex : "Designer UX/UI Senior | Specialiste Mobile"). Votre bio doit resumer votre experience, vos specialites et ce qui vous differencie — le tout en 2-3 paragraphes percutants.</p>
<h3>Competences</h3>
<p>Ajoutez vos competences avec des niveaux (debutant, intermediaire, expert). Les competences sont indexees par le moteur de recherche et utilisees par les filtres du marketplace.</p>
<h3>Langues</h3>
<p>Indiquez toutes les langues que vous parlez avec votre niveau. C'est un critere de recherche frequent pour les clients internationaux.</p>
<h3>Liens externes</h3>
<p>Ajoutez vos liens LinkedIn, GitHub, Behance, Dribbble ou votre site personnel. Ces liens renforcent votre credibilite.</p>
<p>La barre de completion du profil dans vos parametres vous indique les elements manquants et vous guide pour atteindre 100%. Un profil complet ameliore votre position dans les resultats de recherche.</p>
`,
    relatedArticles: ["ajouter-portfolio", "badges-certifications", "premiers-pas-freelancehigh"],
    updatedAt: "2026-03-01",
  },
  {
    id: "18",
    slug: "ajouter-portfolio",
    title: "Ajouter et gerer votre portfolio",
    category: "profil",
    content: `
<p>Votre portfolio est la vitrine de votre savoir-faire. C'est l'element qui convainc les clients de votre expertise concrete, au-dela des descriptions.</p>
<h3>Ajouter un projet</h3>
<p>Depuis <strong>Dashboard > Portfolio</strong>, cliquez sur "Ajouter un projet". Renseignez un titre, une description du projet, les competences utilisees, la categorie, et uploadez des images illustrant le resultat final. Vous pouvez aussi ajouter un lien externe vers le projet en ligne.</p>
<h3>Organiser vos projets</h3>
<p>Reorganisez vos projets par glisser-deposer pour mettre les plus impressionnants en premier. Vous pouvez egalement marquer jusqu'a 3 projets comme "coup de coeur" — ils seront mis en evidence sur votre profil public.</p>
<h3>Conseils pour un portfolio efficace</h3>
<p>Privilegiez la qualite a la quantite : 5 projets excellents valent mieux que 20 mediocres. Pour chaque projet, expliquez brievement le contexte, le probleme resolu et le resultat obtenu. Utilisez des captures d'ecran ou des visuels de haute qualite.</p>
<p>Mettez a jour regulierement votre portfolio avec vos realisations les plus recentes. Un portfolio a jour montre que vous etes actif et en constante evolution.</p>
`,
    relatedArticles: ["completer-profil", "badges-certifications"],
    updatedAt: "2026-02-23",
  },
  {
    id: "19",
    slug: "badges-certifications",
    title: "Badges et certifications",
    category: "profil",
    content: `
<p>Les badges Novakou sont des marqueurs de confiance affiches sur votre profil public. Ils aident les clients a evaluer rapidement votre fiabilite et votre expertise.</p>
<h3>Types de badges</h3>
<ul>
<li><strong>Verifie :</strong> attribue automatiquement lorsque votre KYC atteint le niveau 3 (piece d'identite verifiee).</li>
<li><strong>Rising Talent :</strong> pour les freelances prometteurs avec un profil complet et de bonnes premieres evaluations.</li>
<li><strong>Top Rated :</strong> attribue aux freelances ayant maintenu une note moyenne de 4.8/5 ou plus sur au moins 20 commandes avec un taux de livraison a temps superieur a 95%.</li>
<li><strong>Pro :</strong> pour les freelances avec un abonnement Pro ou superieur et un profil d'excellence.</li>
<li><strong>Elite :</strong> le plus haut niveau, reserve aux freelances ayant atteint le KYC niveau 4 et repondant a des criteres stricts de performance.</li>
</ul>
<h3>Certifications IA (V3)</h3>
<p>Novakou preparera des tests de competences surveilles par intelligence artificielle. En reussissant un test, vous obtiendrez un badge de certification affiche sur votre profil. Les domaines couverts incluront le developpement web, le design graphique, la redaction, le marketing digital et bien d'autres.</p>
<p>Les badges sont reevalues periodiquement. Maintenez une qualite de service elevee pour conserver vos badges.</p>
`,
    relatedArticles: ["completer-profil", "verification-kyc", "ajouter-portfolio"],
    updatedAt: "2026-02-19",
  },

  // --- Litiges ---
  {
    id: "20",
    slug: "ouvrir-litige",
    title: "Ouvrir un litige",
    category: "litiges",
    content: `
<p>Si vous rencontrez un differend avec un client que vous ne parvenez pas a resoudre par la messagerie, Novakou met a votre disposition un systeme de litiges equitable.</p>
<h3>Quand ouvrir un litige</h3>
<p>Ouvrez un litige lorsque le client demande des modifications qui sortent du cadre de la commande initiale, refuse de valider une livraison conforme, ou adopte un comportement abusif. Essayez toujours de resoudre le probleme a l'amiable d'abord — les litiges doivent rester un dernier recours.</p>
<h3>Comment proceder</h3>
<p>Depuis la page de detail de la commande concernee, cliquez sur "Ouvrir un litige". Decrivez precisement le probleme, joignez des preuves (captures d'ecran, fichiers, extraits de conversation) et selectionnez la resolution souhaitee.</p>
<h3>Ce qui se passe ensuite</h3>
<p>Les fonds de la commande sont immediatement geles (escrow_status = 'disputed'). Un moderateur Novakou examine le dossier sous 48 a 72 heures. Les deux parties peuvent soumettre des preuves supplementaires pendant cette periode.</p>
<p><strong>Important :</strong> conservez toujours vos echanges dans le chat integre de la plateforme plutot que sur des messageries externes. Les messages dans le chat Novakou constituent des preuves recevables en cas de litige.</p>
`,
    relatedArticles: ["processus-resolution-litige", "comprendre-cycle-commande"],
    updatedAt: "2026-03-02",
  },
  {
    id: "21",
    slug: "processus-resolution-litige",
    title: "Processus de resolution d'un litige",
    category: "litiges",
    content: `
<p>Le systeme de resolution des litiges Novakou est concu pour etre rapide, equitable et transparent pour les deux parties.</p>
<h3>Etapes du processus</h3>
<ol>
<li><strong>Ouverture :</strong> L'une des parties ouvre un litige. Les fonds sont geles et un dossier est cree.</li>
<li><strong>Collecte de preuves :</strong> Chaque partie dispose de 48 heures pour soumettre ses arguments et preuves (messages, fichiers, captures d'ecran, brief initial).</li>
<li><strong>Examen par un moderateur :</strong> Un membre de l'equipe Novakou examine l'ensemble du dossier, y compris l'historique complet de la commande et des echanges.</li>
<li><strong>Verdict :</strong> Le moderateur rend une decision : fonds liberes en faveur du freelance, remboursement total au client, ou remboursement partiel avec repartition equitable.</li>
</ol>
<h3>Apres le verdict</h3>
<p>Le verdict est notifie aux deux parties par email et notification in-app. Les fonds sont distribues selon la decision. Les deux parties peuvent consulter la justification detaillee du verdict.</p>
<p>Le delai moyen de resolution d'un litige est de 3 a 5 jours ouvrables. Les litiges avec des preuves claires et completes sont resolus plus rapidement.</p>
<p><strong>Prevention :</strong> la meilleure facon d'eviter les litiges est de bien definir les attentes des le depart, de communiquer regulierement et de livrer conformement au forfait choisi.</p>
`,
    relatedArticles: ["ouvrir-litige", "comprendre-cycle-commande", "gerer-revisions"],
    updatedAt: "2026-02-27",
  },

  // --- Securite ---
  {
    id: "22",
    slug: "configurer-2fa",
    title: "Configurer la double authentification (2FA)",
    category: "securite",
    content: `
<p>La double authentification (2FA) ajoute une couche de securite supplementaire a votre compte. Meme si votre mot de passe est compromis, un attaquant ne pourra pas acceder a votre compte sans le code 2FA.</p>
<h3>Methode TOTP (Google Authenticator)</h3>
<p>C'est la methode recommandee. Depuis <strong>Parametres > Securite > Double authentification</strong>, activez l'option TOTP. Scannez le QR code affiche avec une application d'authentification (Google Authenticator, Authy, Microsoft Authenticator). L'application generera un code a 6 chiffres qui change toutes les 30 secondes.</p>
<h3>Methode SMS</h3>
<p>Si vous preferez, vous pouvez recevoir le code par SMS sur votre numero de telephone verifie. Cette methode est moins securisee que le TOTP (risque de SIM swapping) mais reste meilleure que pas de 2FA du tout.</p>
<h3>Codes de secours</h3>
<p>Lors de l'activation du 2FA, des codes de secours a usage unique vous sont fournis. Conservez-les precieusement dans un endroit sur (gestionnaire de mots de passe, impression papier). Ils vous permettront de vous connecter si vous perdez l'acces a votre application d'authentification.</p>
<p><strong>Recommandation forte :</strong> activez le 2FA des que possible, surtout si votre portefeuille Novakou contient des fonds. C'est une protection essentielle contre le vol de compte.</p>
`,
    relatedArticles: ["connexions-suspectes", "verification-kyc"],
    updatedAt: "2026-03-04",
  },
  {
    id: "23",
    slug: "connexions-suspectes",
    title: "Connexions suspectes et sessions actives",
    category: "securite",
    content: `
<p>Novakou surveille les connexions a votre compte et vous alerte en cas d'activite suspecte. Vous pouvez consulter et gerer vos sessions actives a tout moment.</p>
<h3>Alertes de connexion</h3>
<p>Chaque fois qu'une connexion est detectee depuis un nouvel appareil ou une nouvelle localisation geographique, vous recevez un email d'alerte. L'email contient les details de la connexion : appareil, navigateur, systeme d'exploitation, localisation approximative et adresse IP.</p>
<h3>Sessions actives</h3>
<p>Depuis <strong>Parametres > Securite > Sessions actives</strong>, vous voyez la liste de toutes les sessions ouvertes sur votre compte. Pour chaque session, vous pouvez voir l'appareil, le navigateur, la localisation et la derniere activite. La session actuelle est marquee d'un badge "Actif maintenant".</p>
<h3>Revoquer une session</h3>
<p>Si vous identifiez une session que vous ne reconnaissez pas, cliquez sur "Deconnecter" pour la revoquer immediatement. Vous pouvez aussi utiliser le bouton "Deconnecter toutes les autres sessions" pour une reinitialisation complete.</p>
<p>En cas de suspicion de compromission, changez immediatement votre mot de passe et activez le 2FA si ce n'est pas deja fait. Contactez le support Novakou si vous pensez que votre compte a ete utilise frauduleusement.</p>
`,
    relatedArticles: ["configurer-2fa", "verification-kyc"],
    updatedAt: "2026-02-25",
  },

  // --- Abonnements ---
  {
    id: "24",
    slug: "plans-abonnement",
    title: "Plans d'abonnement Novakou",
    category: "abonnements",
    content: `
<p>Novakou propose 4 plans pour s'adapter a tous les niveaux d'activite, du debutant au professionnel confirme.</p>
<h3>Plan Gratuit</h3>
<p>Ideal pour demarrer. Vous pouvez publier jusqu'a 3 services actifs et envoyer 5 candidatures par mois. La commission sur les ventes est de 20%. C'est un excellent moyen de tester la plateforme sans engagement.</p>
<h3>Plan Pro — 15 EUR/mois</h3>
<p>Pour les freelances reguliers. Jusqu'a 15 services actifs, 20 candidatures par mois, 1 boost publicitaire mensuel et acces aux certifications IA. La commission passe a 15%. Rentable a partir de 300 EUR de ventes mensuelles.</p>
<h3>Plan Business — 45 EUR/mois</h3>
<p>Pour les freelances a fort volume. Services et candidatures illimites, 5 boosts mensuels, acces aux cles API et webhooks. Commission de 10%. Rentable a partir de 450 EUR de ventes mensuelles.</p>
<h3>Plan Agence — 99 EUR/mois</h3>
<p>Concu pour les agences. Jusqu'a 20 membres d'equipe, 50 Go de stockage ressources, 10 boosts mensuels. Commission la plus basse a 8%. Ce plan inclut toutes les fonctionnalites de gestion d'equipe et de CRM.</p>
<p>Tous les plans peuvent etre souscrits en facturation mensuelle ou annuelle (2 mois offerts en annuel). Vous pouvez changer de plan a tout moment.</p>
`,
    relatedArticles: ["changer-plan", "comprendre-commissions"],
    updatedAt: "2026-03-05",
  },
  {
    id: "25",
    slug: "changer-plan",
    title: "Changer de plan d'abonnement",
    category: "abonnements",
    content: `
<p>Vous pouvez changer votre plan d'abonnement a tout moment depuis <strong>Dashboard > Abonnement</strong>. Le changement prend effet immediatement.</p>
<h3>Passage a un plan superieur (upgrade)</h3>
<p>Lorsque vous passez a un plan superieur, la difference de prix est calculee au prorata du temps restant dans votre cycle de facturation actuel. Vous beneficiez immediatement de toutes les fonctionnalites du nouveau plan, y compris le taux de commission reduit sur les prochaines ventes.</p>
<h3>Passage a un plan inferieur (downgrade)</h3>
<p>Le downgrade prend effet a la fin de votre cycle de facturation en cours. Vous conservez les avantages de votre plan actuel jusqu'a cette date. Attention : si vous avez plus de services actifs que la limite du nouveau plan, les services les plus recents seront automatiquement mis en pause.</p>
<h3>Annulation</h3>
<p>Vous pouvez annuler votre abonnement a tout moment. L'annulation prend effet a la fin du cycle de facturation en cours. Votre compte passe alors au plan Gratuit. Vos donnees, services et historique sont conserves, mais les limites du plan Gratuit s'appliquent.</p>
<p><strong>Conseil :</strong> avant de passer a un plan superieur, utilisez le calculateur de rentabilite dans la page Abonnement pour verifier que le volume de ventes previsionnel justifie le cout de l'abonnement.</p>
`,
    relatedArticles: ["plans-abonnement", "comprendre-commissions", "facturation-freelance"],
    updatedAt: "2026-03-01",
  },
];

// ============================================================
// Helper functions
// ============================================================

export function getArticlesByCategory(categoryId: string): HelpArticle[] {
  return HELP_ARTICLES.filter((a) => a.category === categoryId);
}

export function getArticleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getCategoryById(categoryId: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.id === categoryId);
}

export function searchArticles(query: string): HelpArticle[] {
  const normalised = query.toLowerCase().trim();
  if (!normalised) return [];
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(normalised) ||
      a.content.toLowerCase().includes(normalised)
  );
}
