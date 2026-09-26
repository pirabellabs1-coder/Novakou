import type { ReactNode } from "react";
import Link from "next/link";
import {
  Award,
  BarChart3,
  BellRing,
  Bot,
  Brain,
  Captions,
  Check,
  CreditCard,
  Database,
  Gauge,
  GitCompare,
  Globe,
  GraduationCap,
  GripVertical,
  HelpCircle,
  Languages,
  LayoutDashboard,
  Link2,
  Lock,
  Mail,
  Megaphone,
  MonitorSmartphone,
  Package,
  Palette,
  Pencil,
  Percent,
  PlayCircle,
  Receipt,
  Repeat,
  Search,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Tag,
  Timer,
  TrendingUp,
  Tv,
  UploadCloud,
  UserPlus,
  Users,
  Wallet,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { CoquePublique } from "@/components/formations/public/CoquePublique";
import { EnTetePage } from "@/components/formations/public/EnTetePage";
import { BoutonVerre } from "@/components/formations/public/BoutonVerre";
import { Accordeon } from "@/components/formations/public/Accordeon";
import {
  VisuelAffiliation,
  VisuelBoutique,
  VisuelCertificat,
  VisuelFlux,
  VisuelIA,
  VisuelPaiement,
  VisuelRetrait,
  VisuelTunnel,
  VisuelVideo,
  VisuelWorkflow,
} from "@/components/formations/public/Visuels";

/*
 * Page Fonctionnalités — Server Component. Les métadonnées vivent dans
 * layout.tsx. Quatre familles, les mêmes que le méga-menu (Vendre,
 * Encaisser, Créer, Automatiser), chacune en bento asymétrique ; chaque
 * carte porte l'ancre visée par le menu (#boutique, #funnels, #pricing,
 * #paiements, #retraits, #ia, #video, #certificats, #emails,
 * #automatisations, #affiliation) — ne pas renommer.
 */

type Fonction = { icon: LucideIcon; titre: string; desc: string };

/* ─── Vendre ─────────────────────────────────────────────────── */
const BOUTIQUE: Fonction[] = [
  { icon: Palette, titre: "Design 100 % personnalisable", desc: "Couleurs, logo, polices, bannière, palette de couleurs — tout reflète votre marque, pas la nôtre. Chaque créateur a une boutique unique qui renforce son image professionnelle auprès de ses clients." },
  { icon: MonitorSmartphone, titre: "100 % responsive mobile", desc: "Expérience parfaite sur smartphone Android ou iPhone, tablette et desktop. Votre boutique est conçue pour le mobile dès le départ." },
  { icon: Search, titre: "SEO automatique intégré", desc: "Balises meta générées automatiquement, URLs propres et lisibles, sitemap dynamique soumis à Google, schema.org pour les produits. Votre boutique se positionne naturellement dans les résultats de recherche sans effort technique de votre part." },
  { icon: Link2, titre: "Domaine personnalisé gratuit", desc: "Connectez votre propre nom de domaine (monsite.com) en quelques clics pour une image 100 % professionnelle. Fini les URLs génériques — votre marque s'affiche partout." },
  { icon: Tag, titre: "Catalogue organisé intelligemment", desc: "Catégories hiérarchisées, filtres avancés par prix, type, niveau, recherche interne en temps réel. Vos clients trouvent le bon produit en moins de 2 clics, ce qui augmente vos conversions." },
  { icon: Star, titre: "Avis vérifiés authentiques", desc: "Collectez des avis certifiés uniquement de vrais acheteurs, répondez publiquement, signalez les abusifs. La preuve sociale est le levier n°1 de conversion — Novakou l'intègre au cœur de votre boutique." },
];

const TUNNELS: Fonction[] = [
  { icon: GripVertical, titre: "Éditeur drag-and-drop fluide", desc: "Glissez, déposez, réorganisez chaque bloc en temps réel. Hero, témoignages, compteur d'urgence, FAQ, bouton de paiement — tout se configure visuellement. Le résultat est professionnel, que vous soyez débutant ou expert." },
  { icon: Sparkles, titre: "Génération IA complète en 30 secondes", desc: "Décrivez votre produit en 2 phrases, l'IA génère un tunnel complet avec titre accrocheur, description de vente, sections structurées et appels à l'action optimisés. Basé sur des données de conversion du marché africain." },
  { icon: Timer, titre: "Compteurs d'urgence par visiteur", desc: "Countdown unique par visiteur (pas partagé), alertes de rareté, offres limitées dans le temps avec remise automatique. Ces leviers de conversion sont responsables de 25 % à 40 % des ventes sur les tunnels bien configurés." },
  { icon: TrendingUp, titre: "Upsell & order bumps natifs", desc: "Augmentez votre panier moyen avec des offres complémentaires affichées au bon moment : order bump sur la page de paiement (+25 % de panier moyen), upsell post-achat quand l'enthousiasme est au maximum." },
  { icon: GitCompare, titre: "Tableaux comparatifs intégrés", desc: "Montrez clairement pourquoi votre offre est le meilleur choix : comparaison avec la concurrence, différences entre vos forfaits, tableau des bénéfices inclus. Les acheteurs informés convertissent 3× plus." },
  { icon: BarChart3, titre: "A/B testing automatisé", desc: "Testez deux versions de votre tunnel (titre, couleur du bouton, image, prix) sur des audiences divisées automatiquement. Novakou garde la version gagnante et pause l'autre. Aucune stat à lire, le système décide pour vous." },
];

const PRICING: Fonction[] = [
  { icon: Percent, titre: "Codes promo", desc: "Réductions en pourcentage ou montant fixe, appliquées en temps réel sur la page de paiement." },
  { icon: ShoppingCart, titre: "Order bumps & upsells", desc: "Une offre additionnelle en une case à cocher au paiement, puis un upsell juste après l'achat." },
  { icon: Package, titre: "Packs & abonnements", desc: "Bundles à prix réduit, abonnements mensuels ou annuels avec facturation automatique." },
  { icon: CreditCard, titre: "Paiement en 3×", desc: "Disponible pour les formations de plus de 30 000 FCFA, pour lever le frein du prix." },
];

/* ─── Encaisser ──────────────────────────────────────────────── */
const PAIEMENTS: Fonction[] = [
  { icon: Smartphone, titre: "Mobile Money intégré nativement", desc: "Intégration native Orange Money, Wave, MTN MoMo, Moov, M-Pesa. Novakou est la seule plateforme à les proposer tous sans configuration supplémentaire." },
  { icon: CreditCard, titre: "Cartes & paiements internationaux", desc: "Visa, Mastercard, SEPA, PayPal, Apple Pay. Parfait pour la diaspora africaine en France, Belgique, Canada et les clients internationaux qui veulent suivre une formation de votre catalogue. Paiement en 3× disponible pour les formations > 30 000 FCFA." },
  { icon: Lock, titre: "Sécurité bancaire SSL/TLS", desc: "Chaque transaction est chiffrée avec les standards bancaires SSL/TLS. Conformité PCI DSS pour les paiements par carte. Vos clients voient le cadenas de sécurité et achètent en toute confiance — les taux d'abandon au checkout sont réduits de 40 %." },
  { icon: Globe, titre: "Afrique francophone + international", desc: "Couverture Mobile Money dans plusieurs pays africains : Sénégal, Côte d'Ivoire, Cameroun, Togo, Bénin, Mali, Burkina Faso et plus. L'international via Stripe." },
];

const RETRAITS: Fonction[] = [
  { icon: Gauge, titre: "Retraits rapides sous 24-48 h", desc: "Demandez un retrait depuis votre tableau de bord, recevez votre argent sous 24 h sur Mobile Money ou sous 48 h sur compte bancaire. Pas de seuil minimum abusif — retirez dès 100 FCFA." },
  { icon: Receipt, titre: "Factures PDF automatiques conformes", desc: "Chaque vente génère et envoie automatiquement une facture PDF professionnelle à l'acheteur : numéro de facture, TVA si applicable, détail de la commande, coordonnées du vendeur. Aucun travail administratif pour vous." },
];

const OPERATEURS: { nom: string; couleur: string }[] = [
  { nom: "Wave", couleur: "#1dc3f2" },
  { nom: "Orange Money", couleur: "#ff6b00" },
  { nom: "MTN MoMo", couleur: "#ffcb05" },
  { nom: "Moov Money", couleur: "#0091d0" },
  { nom: "M-Pesa", couleur: "#3cb44a" },
  { nom: "Visa · Mastercard", couleur: "#0e1512" },
  { nom: "PayPal", couleur: "#003087" },
  { nom: "Virement SEPA", couleur: "#5c6b62" },
];

/* ─── Créer ──────────────────────────────────────────────────── */
const IA: Fonction[] = [
  { icon: GraduationCap, titre: "Structure de formation en 10 secondes", desc: "Donnez votre sujet (ex : « Marketing digital pour PME africaines »), l'IA génère un plan complet avec modules, leçons, objectifs pédagogiques et durée estimée. Économisez 3-4 heures de conception pédagogique dès votre premier cours." },
  { icon: Pencil, titre: "Copywriting de vente qui convertit", desc: "Pages de vente, titres accrocheurs, descriptions de produits, séquences email, posts réseaux sociaux — des textes adaptés aux codes culturels et aux attentes de l'Afrique francophone." },
  { icon: HelpCircle, titre: "Quiz et évaluations automatiques", desc: "Générez des QCM pertinents, des exercices pratiques et des études de cas pour chaque module de votre formation en un clic." },
  { icon: Bot, titre: "Chatbot support apprenant 24/7", desc: "Configurez un assistant IA qui répond aux questions de vos apprenants à toute heure avec le contexte de votre formation. Disponibilité permanente, même quand vous dormez." },
  { icon: Languages, titre: "Contexte culturel africain intégré", desc: "L'IA intègre des références, exemples et cas d'usage pertinents pour le marché africain : noms, devises, situations professionnelles locales, plateformes de paiement régionales. Vos textes générés sonnent locaux, pas traduits." },
  { icon: Brain, titre: "Optimisation SEO assistée", desc: "Suggestions de titres optimisés pour Google, mots-clés à intégrer dans vos descriptions, meta descriptions générées automatiquement, score de lisibilité. Vos produits remontent dans les recherches Google sans effort technique." },
];

const VIDEO: Fonction[] = [
  { icon: UploadCloud, titre: "Upload direct sans limite", desc: "Glissez vos fichiers vidéo jusqu'à 10 Go par fichier, sans limite de durée totale. Traitement automatique en arrière-plan pendant que vous continuez à travailler. Formats acceptés : MP4, MOV, AVI, WebM." },
  { icon: ShieldCheck, titre: "Protection DRM anti-piratage", desc: "Vos vidéos ne peuvent pas être téléchargées, enregistrées ou partagées sans autorisation. Filigrane numérique avec le nom de l'acheteur, chiffrement des flux vidéo, désactivation du clic droit. Votre contenu reste votre propriété et votre source de revenus." },
  { icon: Tv, titre: "Streaming adaptatif 3G/4G/fibre", desc: "Le lecteur Novakou s'adapte automatiquement à la vitesse de connexion : qualité 240p en 3G, 720p en 4G, 1080p en fibre. Aucun buffering frustrant pour vos apprenants en Afrique, quelle que soit leur connexion." },
  { icon: BarChart3, titre: "Analytics de visionnage détaillés", desc: "Voyez exactement où chaque apprenant en est dans chaque vidéo, quel pourcentage a regardé chaque module, où les gens s'arrêtent et re-regardent. Ces données vous permettent d'améliorer votre contenu là où il perd les apprenants." },
  { icon: Captions, titre: "Sous-titres automatiques en français", desc: "Génération automatique de sous-titres en français pour toutes vos vidéos. Améliore l'accessibilité pour les apprenants malentendants, facilite la compréhension dans des environnements bruyants, et booste le SEO de vos contenus vidéo." },
  { icon: Database, titre: "Stockage et bande passante illimités", desc: "Aucune limite de stockage, aucune limite de bande passante, aucun frais supplémentaire selon le nombre de vues. Hébergez 1 ou 100 formations avec autant de vidéos que nécessaire pour le même tarif." },
];

const CERTIFICATS: Fonction[] = [
  { icon: Award, titre: "Certificats PDF automatiques", desc: "Vos apprenants reçoivent un certificat PDF personnalisé avec leur nom, la date et votre signature numérique dès qu'ils atteignent 100 % de la formation. Augmente la motivation des apprenants et la valeur perçue de vos formations." },
];

/* ─── Automatiser ────────────────────────────────────────────── */
const EMAILS: Fonction[] = [
  { icon: Mail, titre: "23 séquences email prêtes à l'emploi", desc: "Bienvenue personnalisé, relance panier abandonné (3 emails), suivi post-achat J+1/J+3/J+7, rappel de progression, demande d'avis, offre de montée en gamme. 23 templates conçus pour le marché africain, modifiables en 2 clics." },
  { icon: BellRing, titre: "Notifications email, SMS et push", desc: "Alertez vos clients selon les événements importants (achat, livraison, accès, nouveau module disponible) via email, SMS court ou notification push navigateur. Paramétrez finement quelle alerte va sur quel canal selon le type d'événement." },
  { icon: ShoppingCart, titre: "Récupération panier abandonné", desc: "65 % des visiteurs commencent un achat sans le finir. Novakou envoie automatiquement 3 emails de relance intelligents (1 h, 24 h, 72 h après l'abandon) avec des arguments adaptés à l'objection probable de chaque étape." },
];

const AUTOMATISATIONS: Fonction[] = [
  { icon: Workflow, titre: "Workflows sans code", desc: "Activez un template en 1 clic, ou composez vos propres scénarios (conditions, branches, délais) dans l'éditeur visuel. Configurez une fois, le système tourne indéfiniment à votre place." },
  { icon: Repeat, titre: "Abonnements et revenus récurrents", desc: "Créez des produits en abonnement mensuel ou annuel : accès à une communauté privée, coaching groupe mensuel, bibliothèque de ressources en continu. Facturation automatique, gestion des suspensions et reprises sans intervention manuelle." },
  { icon: UserPlus, titre: "Programme d'affiliation automatisé", desc: "Vos clients les plus satisfaits deviennent vos vendeurs. Commission paramétrable librement (20 %, 30 %, 40 %), lien de tracking unique par affilié, calcul automatique des commissions, paiement automatique à chaque vente. Zéro gestion manuelle." },
];

const AFFILIATION: Fonction[] = [
  { icon: Link2, titre: "Liens affiliés uniques et traçables", desc: "Chaque affilié reçoit un lien personnalisé (novakou.com/r/sonnom) qui trace précisément chaque clic, visite et achat généré. Attribution sur 30 jours — si un client revient acheter 3 semaines plus tard, l'affilié est tout de même crédité." },
  { icon: Percent, titre: "Commission 100 % paramétrable", desc: "Définissez librement le taux de commission : 10 %, 20 %, 30 %, 40 %, ou montant fixe. Paramétrez des commissions différentes par produit — formation principale à 30 %, ebook à 50 %, coaching à 20 %. Flexibilité totale selon votre stratégie." },
  { icon: LayoutDashboard, titre: "Dashboard affilié complet", desc: "Chaque affilié a son propre espace pour suivre ses clics en temps réel, ses ventes générées, ses commissions accumulées et en attente de paiement, son lien personnel et les ressources marketing mises à disposition." },
  { icon: Wallet, titre: "Paiement automatique des commissions", desc: "Les commissions sont calculées instantanément à chaque vente et versées automatiquement sur le moyen de paiement choisi par l'affilié : Wave, Orange Money, MTN, PayPal ou virement. Aucune gestion manuelle de votre côté." },
  { icon: BarChart3, titre: "Analytics par affilié en temps réel", desc: "Identifiez vos affiliés les plus performants (clics, taux de conversion, revenus générés), comparez leurs performances dans le temps, envoyez-leur des ressources supplémentaires pour les aider à vendre plus. Transformez vos meilleurs affiliés en partenaires stratégiques." },
  { icon: Megaphone, titre: "Kit marketing prêt à l'emploi", desc: "Fournissez à vos affiliés visuels aux formats Reels/Stories/Posts, textes de vente copywrités, emails prêts à envoyer, arguments de vente et FAQ. Plus ils ont d'outils, plus ils vendent — et plus vous gagnez." },
];

/* ─── Comparaison, témoignages, FAQ ──────────────────────────── */
const COMPARAISON: [string, boolean, boolean, boolean][] = [
  ["Mobile Money (Wave, Orange, MTN)", true, false, false],
  ["Mobile Money Afrique francophone", true, false, false],
  ["Tunnels de vente (30+ blocs)", true, true, false],
  ["Génération IA de tunnels et textes", true, false, false],
  ["Hébergement vidéo inclus sans limite", true, true, false],
  ["Protection DRM anti-piratage", true, false, false],
  ["Certificats automatiques PDF", true, false, false],
  ["Programme d'affiliation natif", true, true, false],
  ["Séquences email 23 templates inclus", true, true, false],
  ["Zéro abonnement fixe mensuel", true, false, true],
  ["Commission ≤ 10 %", true, false, false],
  ["Countdown par visiteur unique", true, false, false],
  ["Assistant IA contexte africain", true, false, false],
  ["Récupération panier abandonné auto", true, false, false],
  ["Retraits sous 24-48 h", true, true, true],
];

const TEMOIGNAGES = [
  { initiales: "AK", nom: "Aminata K.", lieu: "Dakar, Sénégal", domaine: "Formation Comptabilité", citation: "Novakou m'a permis de vendre mes formations en Excel à des comptables en Afrique francophone. Le Mobile Money change tout — mes clients paient avec Wave en quelques secondes." },
  { initiales: "ID", nom: "Ibrahim D.", lieu: "Abidjan, Côte d'Ivoire", domaine: "Marketing Digital", citation: "L'assistant IA m'a aidé à créer mon tunnel de vente rapidement. L'outil est intuitif et puissant. J'aurais dû commencer sur Novakou bien avant." },
  { initiales: "FN", nom: "Fatou N.", lieu: "Douala, Cameroun", domaine: "Design Canva", citation: "Avant Novakou, je ne savais pas comment accepter les paiements. Maintenant mes clients paient facilement par Wave ou Orange Money. Les automatisations gèrent tout à ma place." },
];

const POURQUOI = [
  {
    titre: "Les paiements que votre audience utilise vraiment",
    p1: "En Afrique francophone, la majorité de la population utilise un service de Mobile Money au quotidien. Novakou intègre nativement Wave, Orange Money, MTN MoMo, et Moov Money — permettant à vos clients de payer en quelques secondes avec leur téléphone, sans compte bancaire requis.",
    p2: "Cette intégration n'est pas en option, n'est pas un module payant : elle est au cœur de la plateforme.",
  },
  {
    titre: "Une boutique qui se vend même quand vous dormez",
    p1: "73 % des ventes enregistrées sur Novakou ont lieu hors des heures ouvrées classiques — la nuit, le week-end, les jours fériés. C'est parce que vos clients sont au Sénégal, en Côte d'Ivoire, au Cameroun, en France et au Canada — dans des fuseaux horaires différents. Votre boutique, elle, est ouverte 24h/24 et 7j/7.",
    p2: "Les automatisations Novakou — email de bienvenue, accès immédiat à la formation, séquences de suivi — s'activent instantanément à chaque vente, à toute heure, sans aucune intervention de votre part. Configurez une fois, récoltez indéfiniment.",
  },
  {
    titre: "Hébergez vos vidéos sans compromis",
    p1: "Beaucoup de créateurs africains hébergent leurs vidéos sur YouTube (public, sans contrôle d'accès) ou Vimeo (coûteux, conçu pour les marchés occidentaux). Novakou offre un hébergement vidéo professionnel inclus dans votre compte : streaming adaptatif pour les connexions 3G/4G africaines, protection DRM anti-téléchargement, player brandé à vos couleurs, analytics de visionnage module par module.",
    p2: "Aucun frais supplémentaire, aucune limite de stockage ou de bande passante. Vos vidéos restent votre propriété — elles ne peuvent être ni téléchargées, ni partagées, ni re-publiées sans votre autorisation.",
  },
  {
    titre: "Un assistant IA qui parle africain",
    p1: "Les outils IA génériques génèrent des textes qui sonnent américains ou européens — avec des références culturelles, des exemples de revenus en dollars et des situations qui ne correspondent pas à votre audience. L'assistant IA Novakou est entraîné sur les données du marché francophone africain.",
    p2: "Il génère des titres de formations, des pages de vente, des plans de cours et des emails qui résonnent avec les créateurs et acheteurs d'Afrique francophone. Les textes générés utilisent les bons exemples, les bonnes devises (FCFA, EUR), les bons arguments culturels. Résultat : des taux de conversion significativement plus élevés que sur des outils génériques.",
  },
];

const FAQ: { q: string; a: string }[] = [
  { q: "Les fonctionnalités sont-elles vraiment toutes incluses sans frais supplémentaires ?", a: "Oui, absolument. Novakou ne propose pas de modules payants séparés. Boutique, tunnels de vente, assistant IA, paiements Mobile Money, hébergement vidéo illimité, certificats automatiques, programme d'affiliation, automatisations email — tout est inclus dès votre inscription, que vous fassiez 1 ou 1 000 ventes par mois. Vous ne payez que la commission de 10 % sur les ventes réalisées." },
  { q: "Quels pays africains sont couverts pour les paiements Mobile Money ?", a: "Novakou couvre plusieurs pays africains en Mobile Money : Sénégal (Wave, Orange Money), Côte d'Ivoire (Wave, Orange Money, MTN), Cameroun (Orange Money, MTN), Mali, Burkina Faso, Togo, Bénin, et d'autres pays en Afrique francophone. Pour les clients internationaux, les paiements par carte bancaire Visa/Mastercard et PayPal sont également disponibles." },
  { q: "Comment fonctionne la commission de 10 % ? Y a-t-il d'autres frais cachés ?", a: "Vous ne payez rien tant que vous ne vendez pas. Lorsqu'une vente est réalisée, Novakou prélève 10 % du montant de la transaction. Il n'y a aucun abonnement mensuel, aucun frais d'installation, aucun frais de stockage vidéo, aucun frais pour les emails automatiques. La commission de 10 % est le seul et unique coût. À titre de comparaison, Systeme.io facture 27 €/mois minimum + leur commission, et Teachable prend jusqu'à 10 % + frais de traitement." },
  { q: "Combien de produits, de formations et de vidéos puis-je publier ?", a: "Il n'y a aucune limite au nombre de produits, de formations, d'ebooks ou de vidéos que vous pouvez publier sur Novakou. Le stockage vidéo est illimité, la bande passante de streaming est illimitée, le nombre de pages de vente est illimité. Créez autant de contenu que vous le souhaitez sans contrainte technique." },
  { q: "L'hébergement vidéo est-il vraiment sécurisé contre le téléchargement ?", a: "Oui. Novakou utilise une protection DRM (Digital Rights Management) qui empêche techniquement le téléchargement des vidéos. Cela inclut : désactivation du clic droit, chiffrement du flux vidéo (HLS encrypté), filigrane numérique avec le nom et l'email de l'acheteur pour traçabilité, et blocage des outils de capture d'écran sur les navigateurs supportés. Vos vidéos ne peuvent pas être téléchargées et redistribuées." },
  { q: "Comment fonctionne l'assistant IA et est-il adapté au marché africain ?", a: "L'assistant IA Novakou est basé sur un modèle de langage avancé entraîné et affiné sur des données de contenu francophone africain. Il comprend les références culturelles, les exemples pertinents pour l'Afrique, les montants en FCFA et EUR, les situations professionnelles locales. Il peut générer des plans de cours complets, des pages de vente, des descriptions de produits, des emails de séquences, des titres optimisés SEO. Tout est entièrement modifiable après génération." },
  { q: "Puis-je connecter mon propre nom de domaine (monsite.com) à ma boutique Novakou ?", a: "Oui. Vous pouvez connecter votre propre nom de domaine gratuitement à votre boutique Novakou. Les instructions techniques sont disponibles dans votre tableau de bord (configuration DNS CNAME en quelques clics). Votre boutique sera accessible sur votre propre domaine, avec le certificat SSL inclus, et votre marque visible partout sans référence à Novakou." },
  { q: "Comment fonctionne le programme d'affiliation pour mes clients ?", a: "Vous activez le programme d'affiliation en 2 clics dans votre tableau de bord. Chaque affilié reçoit un lien unique traçable. Vous définissez librement le taux de commission (10 % à 50 %, ou montant fixe). Les affiliés ont accès à leur propre espace pour suivre leurs performances. Les commissions sont calculées automatiquement et versées sur le moyen de paiement de l'affilié (Wave, Orange Money, PayPal) sans intervention manuelle de votre part." },
  { q: "Les automatisations sont-elles difficiles à configurer ?", a: "Non. Novakou propose 23 templates d'automatisations prêts à l'emploi pour les cas les plus courants : email de bienvenue, relance panier abandonné, rappel de progression, demande d'avis, offre upsell post-achat. Activez un template en 1 clic, personnalisez les textes si vous le souhaitez, et c'est opérationnel. Pour les automatisations avancées (conditions, branches logiques, délais personnalisés), un éditeur visuel est disponible." },
  { q: "Est-ce que Novakou est adapté aux débutants qui n'ont aucune expérience technique ?", a: "Novakou est conçu pour être utilisé sans aucune connaissance technique. Création de compte en 3 minutes, boutique active immédiatement, premier produit publié en moins d'une heure, paiements configurés sans connaissance en développement web. Tous les outils sont accompagnés de guides étape par étape et de tutoriels vidéo. Le support est disponible en français, disponible sur WhatsApp pour les questions urgentes." },
];

const FAMILLES = [
  { id: "vendre", label: "Vendre", icon: Store },
  { id: "encaisser", label: "Encaisser", icon: Wallet },
  { id: "creer", label: "Créer", icon: Sparkles },
  { id: "automatiser", label: "Automatiser", icon: Zap },
];

/* ─── Briques ────────────────────────────────────────────────── */
function ListeFonctions({ items, cols = 2 }: { items: Fonction[]; cols?: 1 | 2 | 3 }) {
  return (
    <ul className={`nkp-feat-list${cols === 1 ? " nkp-feat-list--1" : cols === 3 ? " nkp-feat-list--3" : ""}`}>
      {items.map((f) => (
        <li key={f.titre}>
          <span className="nkp-ic" aria-hidden="true">
            <f.icon strokeWidth={1.75} />
          </span>
          <div>
            <b>{f.titre}</b>
            <p>{f.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function CarteFonction({
  id,
  icon: Icon,
  titre,
  lead,
  visuel,
  items,
  cols = 2,
  span,
  rows = false,
  bande = false,
  ancreLegacy,
}: {
  id: string;
  icon: LucideIcon;
  titre: string;
  lead: ReactNode;
  visuel?: ReactNode;
  items: Fonction[];
  cols?: 1 | 2 | 3;
  span: 4 | 5 | 6 | 7 | 8 | 12;
  rows?: boolean;
  bande?: boolean;
  /** Ancien identifiant d'onglet encore cité ailleurs (ex. #tunnels). */
  ancreLegacy?: string;
}) {
  const entete = (
    <>
      {ancreLegacy && <span id={ancreLegacy} className="nkp-anchor" />}
      <div className="nkp-feat__top">
        <span className="nkp-ic" aria-hidden="true">
          <Icon strokeWidth={1.75} />
        </span>
        <h3 id={`${id}-titre`}>{titre}</h3>
      </div>
      <p className="nkp-feat__lead">{lead}</p>
    </>
  );
  return (
    <article
      id={id}
      className={`nkp-card nkp-card--hover nkp-reveal nkp-span-${span}${rows ? " nkp-rows-2" : ""}${bande ? " nkp-feat--band" : ""}`}
      aria-labelledby={`${id}-titre`}
    >
      <div className="nkp-card__core">
        {bande ? (
          <>
            <div>
              {entete}
              <ListeFonctions items={items} cols={cols} />
            </div>
            {visuel && <div className="nkp-feat__vis">{visuel}</div>}
          </>
        ) : (
          <>
            {entete}
            {visuel && <div className="nkp-feat__vis">{visuel}</div>}
            <ListeFonctions items={items} cols={cols} />
          </>
        )}
      </div>
    </article>
  );
}

function Oui() {
  return (
    <span className="nkp-table__ok" aria-label="Oui">
      <Check strokeWidth={3} aria-hidden="true" />
    </span>
  );
}
function Non() {
  return (
    <span className="nkp-table__ko" aria-label="Non">
      <X strokeWidth={3} aria-hidden="true" />
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function FonctionnalitesPage() {
  return (
    <CoquePublique>
      {/* FAQPage JSON-LD : mêmes questions que l'accordéon (rich results). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }),
        }}
      />

      <EnTetePage
        eyebrow="Plateforme complète"
        titre={
          <>
            Tout ce qu'il faut pour <em>vendre en ligne</em> en Afrique.
          </>
        }
        sousTitre="Boutique, tunnels de vente, paiements Mobile Money (Wave, Orange, MTN), assistant IA adapté au contexte africain, hébergement vidéo sécurisé, certificats automatiques, automatisations et programme d'affiliation. Tout inclus. Zéro abonnement fixe."
        actions={
          <>
            <BoutonVerre href="/inscription?role=vendeur" variante="primary" taille="lg" fleche>
              Commencer gratuitement
            </BoutonVerre>
            <BoutonVerre href="/tarifs" taille="lg">
              Voir les tarifs
            </BoutonVerre>
          </>
        }
        meta={["Zéro abonnement — 10 % par vente", "Mobile Money & carte bancaire", "Boutique prête en 3 minutes"]}
      >
        <nav aria-label="Familles de fonctionnalités" className="nkp-chips">
          {FAMILLES.map((f) => (
            <a key={f.id} href={`#${f.id}`} className="nkp-chip">
              <span className="nkp-chip__ic" aria-hidden="true">
                <f.icon strokeWidth={2} />
              </span>
              {f.label}
            </a>
          ))}
        </nav>
      </EnTetePage>

      {/* ── Preuve chiffrée ── */}
      <section className="nkp-section nkp-section--tight" aria-label="Novakou en chiffres">
        <div className="nkp-wrap">
          <div className="nkp-kpis nkp-kpis--band">
            <div className="nkp-kpi nkp-reveal">
              <div className="n">
                <span data-count="30">30</span>
                <em>+</em>
              </div>
              <p>blocs de construction pour vos tunnels</p>
            </div>
            <div className="nkp-kpi nkp-reveal">
              <div className="n">
                <span data-count="17">17</span>
              </div>
              <p>pays africains couverts en Mobile Money</p>
            </div>
            <div className="nkp-kpi nkp-reveal">
              <div className="n">
                <span data-count="23">23</span>
              </div>
              <p>templates d'emails automatiques inclus</p>
            </div>
            <div className="nkp-kpi nkp-reveal">
              <div className="n">
                10<em>%</em>
              </div>
              <p>de commission seulement, pas d'abonnement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VENDRE ── */}
      <section id="vendre" className="nkp-section" aria-labelledby="vendre-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-reveal">
            <span className="nkp-tag">Vendre</span>
            <h2 id="vendre-titre">Une vitrine et des tunnels qui convertissent</h2>
            <p>Votre boutique est en ligne dès la création du compte. Vos tunnels de vente guident chaque visiteur jusqu'au paiement, sans une ligne de code.</p>
          </div>
          <div className="nkp-bento">
            <CarteFonction
              id="boutique"
              icon={Store}
              titre="Votre boutique en ligne en 3 minutes"
              lead="Publiez vos formations, ebooks, templates et coaching sur une vitrine professionnelle clé en main. Aucune connaissance technique requise — votre boutique est active dès que vous créez votre compte, avec votre branding, vos couleurs et votre domaine personnalisé."
              visuel={<VisuelBoutique />}
              items={BOUTIQUE}
              span={7}
            />
            <CarteFonction
              id="funnels"
              ancreLegacy="tunnels"
              icon={Workflow}
              titre="Des tunnels qui convertissent à chaque clic"
              lead="Builder visuel drag-and-drop avec 30+ blocs prêts à l'emploi, génération automatique par IA et templates optimisés pour le marché africain. Construisez des pages de vente professionnelles qui guident chaque visiteur vers l'achat."
              visuel={<VisuelTunnel />}
              items={TUNNELS}
              cols={1}
              span={5}
              rows
            />
            <CarteFonction
              id="pricing"
              icon={Tag}
              titre="Pricing flexible"
              lead="Forfaits, promos, coupons : chaque levier de prix est natif, sans plugin."
              items={PRICING}
              cols={2}
              span={7}
            />
          </div>
        </div>
      </section>

      {/* ── ENCAISSER ── */}
      <section id="encaisser" className="nkp-section nkp-section--tint" aria-labelledby="encaisser-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-reveal">
            <span className="nkp-tag">Encaisser</span>
            <h2 id="encaisser-titre">Encaissez comme vos clients paient vraiment</h2>
            <p>Le Mobile Money est natif sur Novakou, pas un ajout. Carte bancaire et PayPal pour la diaspora, retraits rapides vers votre compte.</p>
          </div>
          <div className="nkp-bento">
            <CarteFonction
              id="paiements"
              icon={Wallet}
              titre="Encaissez partout en Afrique et dans le monde"
              lead="Orange Money, Wave, MTN MoMo, Moov Money, cartes Visa / Mastercard, PayPal, virement SEPA. Vos clients paient avec le moyen qu'ils utilisent au quotidien — aucune friction, maximum de conversions."
              visuel={<VisuelPaiement />}
              items={PAIEMENTS}
              span={7}
              rows
            />
            <CarteFonction
              id="retraits"
              icon={Gauge}
              titre="Retraits rapides, factures automatiques"
              lead="Vos fonds arrivent sur votre solde dès la vente confirmée. Vous les retirez quand vous voulez."
              visuel={<VisuelRetrait />}
              items={RETRAITS}
              cols={1}
              span={5}
            />
            <article className="nkp-card nkp-reveal nkp-span-5" aria-labelledby="couverture-titre">
              <div className="nkp-card__core">
                <div className="nkp-feat__top">
                  <span className="nkp-ic" aria-hidden="true">
                    <Globe strokeWidth={1.75} />
                  </span>
                  <h3 id="couverture-titre">Tous les moyens de paiement de vos clients</h3>
                </div>
                <p className="nkp-feat__lead">Le client choisit son pays, puis ne voit que les moyens réellement encaissables chez lui. Vous n'avez rien à configurer.</p>
                <div className="nkp-ops mt-5">
                  {OPERATEURS.map((o) => (
                    <span key={o.nom} className="nkp-op">
                      <i style={{ background: o.couleur }} aria-hidden="true" />
                      {o.nom}
                    </span>
                  ))}
                </div>
                <div className="nkp-card__foot">
                  <Link href="/documentation-paiements" className="nkp-link">
                    Lire la documentation des paiements
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── CRÉER ── */}
      <section id="creer" className="nkp-section" aria-labelledby="creer-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-reveal">
            <span className="nkp-tag">Créer</span>
            <h2 id="creer-titre">Créez plus vite, hébergez sans compromis</h2>
            <p>Un assistant IA qui comprend votre marché, un hébergement vidéo sécurisé inclus et des certificats générés pour chaque apprenant.</p>
          </div>
          <div className="nkp-bento">
            <CarteFonction
              id="ia"
              icon={Sparkles}
              titre="Un assistant IA qui comprend le marché africain"
              lead="Générez des plans de cours complets, rédigez vos pages de vente, créez des quiz pertinents, structurez vos modules pédagogiques. Notre IA est entraînée sur des données du marché francophone africain — les textes générés résonnent avec votre audience, pas avec celle du marché américain."
              visuel={<VisuelIA />}
              items={IA}
              span={7}
              rows
            />
            <CarteFonction
              id="video"
              icon={PlayCircle}
              titre="Hébergez vos vidéos en toute sécurité"
              lead="Uploadez directement sur Novakou — pas besoin de YouTube, Vimeo ou d'un service tiers. Streaming adaptatif qui s'adapte à la connexion de vos apprenants (de la 3G à la fibre), protection anti-téléchargement avancée et lecteur brandé à vos couleurs."
              visuel={<VisuelVideo />}
              items={VIDEO}
              cols={1}
              span={5}
              rows
            />
            <CarteFonction
              id="certificats"
              icon={Award}
              titre="Certificats automatiques"
              lead="Un diplôme est généré pour chaque apprenant qui termine votre formation."
              visuel={<VisuelCertificat />}
              items={CERTIFICATS}
              cols={1}
              span={12}
              bande
            />
          </div>
        </div>
      </section>

      {/* ── AUTOMATISER ── */}
      <section id="automatiser" className="nkp-section nkp-section--tint" aria-labelledby="automatiser-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-reveal">
            <span className="nkp-tag">Automatiser</span>
            <h2 id="automatiser-titre">Vendez et accompagnez sans être connecté H24</h2>
            <p>Emails automatiques, workflows sans code, affiliation : configurez une fois, le système tourne ensuite indéfiniment à votre place. 73 % des ventes Novakou se font hors des heures ouvrées.</p>
          </div>
          <div className="nkp-bento">
            <CarteFonction
              id="emails"
              icon={Mail}
              titre="Emails automatiques"
              lead="Séquences de bienvenue, relances de paniers abandonnés, notifications multi-canaux : tout est prêt, modifiable en 2 clics."
              visuel={<VisuelFlux />}
              items={EMAILS}
              cols={1}
              span={5}
            />
            <CarteFonction
              id="automatisations"
              icon={Zap}
              titre="Automatisations sans code"
              lead="Emails automatiques de bienvenue, séquences de nurturing, relances de paniers abandonnés, certificats automatiques, notifications multi-canaux — configurez une fois, le système tourne ensuite indéfiniment à votre place."
              visuel={<VisuelWorkflow />}
              items={AUTOMATISATIONS}
              cols={1}
              span={7}
            />
            <CarteFonction
              id="affiliation"
              icon={Users}
              titre="Vos clients deviennent vos meilleurs vendeurs"
              lead="Créez votre programme d'affiliation en 5 minutes. Chaque affilié reçoit un lien traçable unique, un tableau de bord dédié pour suivre ses performances, et ses commissions sont calculées et payées automatiquement à chaque vente générée."
              visuel={<VisuelAffiliation />}
              items={AFFILIATION}
              cols={2}
              span={12}
              bande
            />
          </div>
        </div>
      </section>

      {/* ── COMPARAISON ── */}
      <section className="nkp-section" aria-labelledby="comparaison-titre">
        <div className="nkp-wrap nkp-wrap--md">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Comparaison</span>
            <h2 id="comparaison-titre">Novakou face à la concurrence</h2>
            <p>Les autres plateformes n'ont pas été conçues pour l'Afrique. Novakou, si.</p>
          </div>
          <div className="nkp-bezel nkp-bezel--float nkp-reveal">
            <div className="nkp-core">
              <div className="nkp-scroll">
                <table className="nkp-table">
                  <thead>
                    <tr>
                      <th scope="col">Fonctionnalité</th>
                      <th scope="col" className="nova">
                        Novakou
                      </th>
                      <th scope="col">Systeme.io</th>
                      <th scope="col">Gumroad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARAISON.map(([label, nova, sys, gum]) => (
                      <tr key={label}>
                        <th scope="row">{label}</th>
                        <td className="nova">{nova ? <Oui /> : <Non />}</td>
                        <td>{sys ? <Oui /> : <Non />}</td>
                        <td>{gum ? <Oui /> : <Non />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <p className="nkp-table-note">Comparaison indicative basée sur les offres standards du marché.</p>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="temoignages-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Témoignages</span>
            <h2 id="temoignages-titre">Ils créent et vendent sur Novakou</h2>
            <p>Des créateurs africains qui ont transformé leur expertise en revenus récurrents grâce aux fonctionnalités Novakou.</p>
          </div>
          <div className="nkp-grid-3">
            {TEMOIGNAGES.map((t) => (
              <figure key={t.nom} className="nkp-card nkp-card--hover nkp-quote nkp-reveal m-0">
                <div className="nkp-card__core">
                  <div className="stars" aria-label="5 étoiles sur 5">
                    ★★★★★
                  </div>
                  <blockquote>« {t.citation} »</blockquote>
                  <figcaption className="who">
                    <span className="nkp-av" aria-hidden="true">
                      {t.initiales}
                    </span>
                    <div>
                      <b>{t.nom}</b>
                      <small>
                        {t.domaine} · {t.lieu}
                      </small>
                    </div>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── POURQUOI NOVAKOU ── */}
      <section className="nkp-section" aria-labelledby="pourquoi-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Pourquoi Novakou</span>
            <h2 id="pourquoi-titre">La plateforme construite pour les créateurs africains</h2>
            <p>Novakou n'est pas une adaptation d'un outil américain. C'est une plateforme conçue dès la première ligne de code pour les réalités du marché africain : connexions mobiles, paiements locaux, audiences francophones.</p>
          </div>
          <div className="nkp-grid-2">
            {POURQUOI.map((b, i) => (
              <article key={b.titre} className="nkp-card nkp-reveal">
                <div className="nkp-card__core">
                  <span className="nkp-eyebrow self-start">0{i + 1}</span>
                  <h3 className="mt-4">{b.titre}</h3>
                  <div className="nkp-prose mt-3 text-[.95rem]">
                    <p>{b.p1}</p>
                    <p>{b.p2}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="nkp-section nkp-section--tint" aria-labelledby="faq-titre">
        <div className="nkp-wrap">
          <div className="nkp-head nkp-head--center nkp-reveal">
            <span className="nkp-tag">Questions fréquentes</span>
            <h2 id="faq-titre">Questions fréquentes sur les fonctionnalités Novakou</h2>
          </div>
          <div className="nkp-reveal">
            <Accordeon items={FAQ} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="nkp-section nkp-section--top0 mt-16" aria-labelledby="cta-titre">
        <div className="nkp-wrap">
          <div className="nkp-bezel nkp-bezel--dark nkp-bezel--xl nkp-bezel--float nkp-reveal">
            <div className="nkp-cta">
              <span className="nkp-tag nkp-tag--dark">Rejoignez 850+ créateurs africains</span>
              <h2 id="cta-titre">Lancez votre business en ligne aujourd'hui.</h2>
              <p>10 % de commission. Zéro abonnement. Toutes les fonctionnalités incluses. Mobile Money natif. Commencez en 3 minutes.</p>
              <div className="nkp-actions">
                <BoutonVerre href="/inscription?role=vendeur" variante="white" taille="lg" fleche>
                  Créer mon compte gratuitement
                </BoutonVerre>
                <BoutonVerre href="/guides" variante="white" taille="lg">
                  Voir les guides gratuits
                </BoutonVerre>
              </div>
              <small>Gratuit tant que vous ne vendez pas · Sans carte bancaire · Prêt en 3 minutes</small>
            </div>
          </div>
        </div>
      </section>
    </CoquePublique>
  );
}
