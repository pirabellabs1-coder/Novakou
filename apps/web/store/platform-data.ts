// ============================================================
// FreelanceHigh — Platform-wide Global Data Store
// Centralized state for ALL spaces: admin, freelance, client, agency
// Every action here has REAL impact across the entire site.
// ============================================================

import { create } from "zustand";

// ── Types ──

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "freelance" | "client" | "agence" | "admin";
  plan: "gratuit" | "pro" | "business" | "agence";
  country: string;
  countryFlag: string;
  registeredAt: string;
  lastLogin: string;
  kyc: number;
  status: "actif" | "suspendu" | "banni";
  avatar: string;
  suspendReason?: string;
}

export interface PlatformOrder {
  id: string;
  serviceTitle: string;
  category: string;
  freelanceId: string;
  freelanceName: string;
  clientId: string;
  clientName: string;
  agencyId?: string;
  status: "en_attente" | "en_cours" | "livre" | "revision" | "termine" | "annule" | "litige";
  amount: number;
  commission: number;
  createdAt: string;
  deadline: string;
  deliveredAt: string | null;
  progress: number;
  escrowStatus: "held" | "released" | "disputed" | "refunded";
}

export interface PlatformTransaction {
  id: string;
  type: "paiement" | "commission" | "retrait" | "remboursement" | "abonnement";
  userId: string;
  userName?: string;
  amount: number;
  status: "complete" | "en_attente" | "echoue" | "bloque";
  date: string;
  method?: string;
  orderId?: string;
  description?: string;
}

export interface PlatformService {
  id: string;
  title: string;
  description?: string;
  category: string;
  freelanceId: string;
  freelanceName: string;
  agencyId?: string;
  price: number;
  status: "actif" | "en_attente" | "refuse" | "pause" | "vedette";
  views: number;
  orders: number;
  rating: number;
  createdAt: string;
  refuseReason?: string;
}

export interface PlatformCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string;
  order: number;
  status: "actif" | "inactif";
  servicesCount: number;
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  status: "brouillon" | "programme" | "publie";
  publishedAt: string | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  metaTitle?: string;
  metaDescription?: string;
}

export interface PlatformDispute {
  id: string;
  orderId: string;
  orderTitle: string;
  clientId: string;
  clientName: string;
  freelanceId: string;
  freelanceName: string;
  amount: number;
  reason: string;
  clientArgument: string;
  freelanceArgument: string;
  status: "ouvert" | "en_examen" | "resolu";
  verdict?: "client" | "freelance" | "partiel" | "annulation";
  verdictNote?: string;
  partialPercent?: number;
  openedAt: string;
  resolvedAt?: string;
  priority: "haute" | "moyenne" | "basse";
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: "annonce" | "maintenance" | "fonctionnalite" | "promotion";
  target: "tous" | "freelance" | "client" | "agence" | "pro" | "business";
  channel: "in-app" | "email" | "les-deux";
  sentAt: string;
  read: boolean;
}

export interface PlatformConfig {
  siteName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcementBanner: string;
  commissions: { gratuit: number; pro: number; business: number; agence: number };
  plans: {
    name: string;
    price: number;
    annualPrice: number;
    commission: number;
    maxServices: number | null;
    maxCandidatures: number | null;
    boostPerMonth: number;
    certificationIA: boolean;
    apiAccess: boolean;
    maxMembers: number | null;
    storage: string | null;
  }[];
  enabledPaymentMethods: string[];
  enabledCurrencies: string[];
}

export interface AuditEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "admin_action" | "message" | "order" | "kyc" | "system";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface KycRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  requestedLevel: number;
  currentLevel: number;
  documentType: string;
  submittedAt: string;
  status: "en_attente" | "approuve" | "refuse";
  reviewedBy?: string;
  reviewedAt?: string;
  refuseReason?: string;
}

export interface AgencyMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: "online" | "busy" | "offline";
  activeOrders: number;
  completedOrders: number;
  revenue: number;
  occupation: number;
}

export interface AgencyProject {
  id: string;
  name: string;
  client: string;
  memberId: string;
  memberName: string;
  status: "en_attente" | "en_cours" | "conception" | "actif" | "termine";
  progress: number;
  budget: number;
  deadline: string;
}

export interface AgencyClient {
  id: string;
  name: string;
  totalSpent: number;
  ordersCount: number;
  lastOrder: string;
  satisfaction: number;
}

export interface ClientProject {
  id: string;
  name: string;
  freelanceName: string;
  progress: number;
  status: string;
  statusColor: string;
  barColor: string;
  dueDate: string;
  budget: number;
}

export interface ClientOrder {
  id: string;
  name: string;
  ref: string;
  status: string;
  amount: number;
  date: string;
}

// ── Demo Data ──

const PLATFORM_USERS: PlatformUser[] = [
  { id: "u1", name: "Amadou Diallo", email: "amadou@email.com", role: "freelance", plan: "pro", country: "Sénégal", countryFlag: "🇸🇳", registeredAt: "2025-08-15", lastLogin: "2026-03-05", kyc: 3, status: "actif", avatar: "AD" },
  { id: "u2", name: "Fatou Sow", email: "fatou@email.com", role: "freelance", plan: "gratuit", country: "Sénégal", countryFlag: "🇸🇳", registeredAt: "2025-09-01", lastLogin: "2026-03-05", kyc: 3, status: "actif", avatar: "FS" },
  { id: "u3", name: "Marie Dupont", email: "marie@email.com", role: "client", plan: "gratuit", country: "France", countryFlag: "🇫🇷", registeredAt: "2025-10-10", lastLogin: "2026-03-04", kyc: 2, status: "actif", avatar: "MD" },
  { id: "u4", name: "Ibrahim Traoré", email: "ibrahim@email.com", role: "freelance", plan: "business", country: "Côte d'Ivoire", countryFlag: "🇨🇮", registeredAt: "2025-07-20", lastLogin: "2026-03-05", kyc: 4, status: "actif", avatar: "IT" },
  { id: "u5", name: "TechCorp Inc.", email: "techcorp@email.com", role: "client", plan: "pro", country: "France", countryFlag: "🇫🇷", registeredAt: "2025-11-01", lastLogin: "2026-03-05", kyc: 2, status: "actif", avatar: "TC" },
  { id: "u6", name: "Kofi Mensah", email: "kofi@email.com", role: "freelance", plan: "gratuit", country: "Ghana", countryFlag: "🇬🇭", registeredAt: "2025-12-01", lastLogin: "2026-03-03", kyc: 2, status: "actif", avatar: "KM" },
  { id: "u7", name: "Nadia Fall", email: "nadia@email.com", role: "freelance", plan: "pro", country: "Sénégal", countryFlag: "🇸🇳", registeredAt: "2026-01-05", lastLogin: "2026-03-05", kyc: 3, status: "actif", avatar: "NF" },
  { id: "u8", name: "Auto-Focus SARL", email: "autofocus@email.com", role: "client", plan: "gratuit", country: "Côte d'Ivoire", countryFlag: "🇨🇮", registeredAt: "2025-11-15", lastLogin: "2026-03-02", kyc: 2, status: "actif", avatar: "AF" },
  { id: "u9", name: "TechCorp Agency", email: "agency@techcorp.com", role: "agence", plan: "agence", country: "France", countryFlag: "🇫🇷", registeredAt: "2025-06-01", lastLogin: "2026-03-05", kyc: 4, status: "actif", avatar: "TA" },
  { id: "u10", name: "Lamine Diallo", email: "lamine@email.com", role: "client", plan: "gratuit", country: "Sénégal", countryFlag: "🇸🇳", registeredAt: "2025-10-20", lastLogin: "2026-03-04", kyc: 2, status: "actif", avatar: "LD" },
  { id: "u11", name: "Sophie Kamara", email: "sophie@email.com", role: "freelance", plan: "gratuit", country: "Mali", countryFlag: "🇲🇱", registeredAt: "2025-11-10", lastLogin: "2026-03-01", kyc: 2, status: "actif", avatar: "SK" },
  { id: "u12", name: "Moussa Keita", email: "moussa@email.com", role: "client", plan: "gratuit", country: "Mali", countryFlag: "🇲🇱", registeredAt: "2026-01-15", lastLogin: "2026-03-03", kyc: 1, status: "actif", avatar: "MK" },
  { id: "u13", name: "Jean-Pierre Martin", email: "jp@email.com", role: "freelance", plan: "gratuit", country: "France", countryFlag: "🇫🇷", registeredAt: "2026-02-20", lastLogin: "2026-03-04", kyc: 1, status: "actif", avatar: "JM" },
  { id: "u14", name: "Aissatou Barry", email: "aissatou@email.com", role: "client", plan: "pro", country: "Guinée", countryFlag: "🇬🇳", registeredAt: "2026-02-01", lastLogin: "2026-03-05", kyc: 2, status: "actif", avatar: "AB" },
  { id: "u15", name: "Omar Ndiaye", email: "omar@email.com", role: "freelance", plan: "pro", country: "Sénégal", countryFlag: "🇸🇳", registeredAt: "2025-08-01", lastLogin: "2026-02-28", kyc: 3, status: "suspendu", avatar: "ON", suspendReason: "Livraisons en retard répétées" },
];

const PLATFORM_CATEGORIES: PlatformCategory[] = [
  { id: "cat1", name: "Développement Web", slug: "developpement-web", icon: "code", color: "#6C2BD9", description: "Sites web, applications, APIs et développement full-stack", order: 1, status: "actif", servicesCount: 3 },
  { id: "cat2", name: "Design & Graphisme", slug: "design-graphisme", icon: "palette", color: "#EC4899", description: "UI/UX, logos, identité visuelle, illustrations", order: 2, status: "actif", servicesCount: 3 },
  { id: "cat3", name: "Marketing Digital", slug: "marketing-digital", icon: "campaign", color: "#F59E0B", description: "SEO, publicité, réseaux sociaux, email marketing", order: 3, status: "actif", servicesCount: 2 },
  { id: "cat4", name: "Rédaction & Contenu", slug: "redaction-contenu", icon: "edit_note", color: "#10B981", description: "Articles, copywriting, traduction, transcription", order: 4, status: "actif", servicesCount: 1 },
  { id: "cat5", name: "Développement Mobile", slug: "developpement-mobile", icon: "smartphone", color: "#3B82F6", description: "Applications iOS, Android, React Native, Flutter", order: 5, status: "actif", servicesCount: 1 },
  { id: "cat6", name: "DevOps & Cloud", slug: "devops-cloud", icon: "cloud", color: "#6366F1", description: "Infrastructure, CI/CD, AWS, Docker, Kubernetes", order: 6, status: "actif", servicesCount: 1 },
  { id: "cat7", name: "Formation", slug: "formation", icon: "school", color: "#14B8A6", description: "Cours en ligne, mentorat, coaching technique", order: 7, status: "actif", servicesCount: 1 },
  { id: "cat8", name: "Intelligence Artificielle", slug: "intelligence-artificielle", icon: "psychology", color: "#8B5CF6", description: "Machine learning, chatbots, automatisation IA", order: 8, status: "actif", servicesCount: 0 },
  { id: "cat9", name: "Vidéo & Animation", slug: "video-animation", icon: "movie", color: "#EF4444", description: "Montage vidéo, motion design, 3D", order: 9, status: "actif", servicesCount: 0 },
  { id: "cat10", name: "Musique & Audio", slug: "musique-audio", icon: "music_note", color: "#D946EF", description: "Production musicale, voix off, podcast", order: 10, status: "inactif", servicesCount: 0 },
];

const PLATFORM_ORDERS: PlatformOrder[] = [
  { id: "CMD-342", serviceTitle: "Design Dashboard SaaS", category: "Design & Graphisme", freelanceId: "u1", freelanceName: "Amadou D.", clientId: "u5", clientName: "TechCorp Inc.", status: "en_cours", amount: 850, commission: 127.5, createdAt: "2026-02-15", deadline: "2026-03-10", deliveredAt: null, progress: 65, escrowStatus: "held" },
  { id: "CMD-341", serviceTitle: "API Backend Node.js", category: "Développement Web", freelanceId: "u4", freelanceName: "Ibrahim T.", clientId: "u10", clientName: "Lamine Diallo", status: "livre", amount: 1200, commission: 180, createdAt: "2026-01-20", deadline: "2026-02-20", deliveredAt: "2026-02-18", progress: 100, escrowStatus: "held" },
  { id: "CMD-340", serviceTitle: "Audit SEO E-commerce", category: "Marketing Digital", freelanceId: "u1", freelanceName: "Amadou D.", clientId: "u8", clientName: "Auto-Focus SARL", status: "en_attente", amount: 450, commission: 67.5, createdAt: "2026-02-28", deadline: "2026-03-15", deliveredAt: null, progress: 0, escrowStatus: "held" },
  { id: "CMD-339", serviceTitle: "Logo Startup FinTech", category: "Design & Graphisme", freelanceId: "u2", freelanceName: "Fatou S.", clientId: "u12", clientName: "Moussa Keita", status: "revision", amount: 150, commission: 22.5, createdAt: "2026-02-10", deadline: "2026-02-28", deliveredAt: null, progress: 80, escrowStatus: "held" },
  { id: "CMD-338", serviceTitle: "Pack 5 Articles Blog", category: "Rédaction & Contenu", freelanceId: "u7", freelanceName: "Nadia F.", clientId: "u3", clientName: "Marie Dupont", status: "termine", amount: 300, commission: 45, createdAt: "2026-01-05", deadline: "2026-01-20", deliveredAt: "2026-01-18", progress: 100, escrowStatus: "released" },
  { id: "CMD-337", serviceTitle: "Application React Native", category: "Développement Mobile", freelanceId: "u4", freelanceName: "Ibrahim T.", clientId: "u5", clientName: "TechCorp Inc.", status: "termine", amount: 2400, commission: 360, createdAt: "2025-12-01", deadline: "2026-01-15", deliveredAt: "2026-01-12", progress: 100, escrowStatus: "released" },
  { id: "CMD-336", serviceTitle: "Design UI/UX Mobile", category: "Design & Graphisme", freelanceId: "u2", freelanceName: "Fatou S.", clientId: "u8", clientName: "Auto-Focus SARL", status: "termine", amount: 600, commission: 90, createdAt: "2025-11-15", deadline: "2025-12-10", deliveredAt: "2025-12-08", progress: 100, escrowStatus: "released" },
  { id: "CMD-335", serviceTitle: "SEO Technique", category: "Marketing Digital", freelanceId: "u11", freelanceName: "Sophie K.", clientId: "u3", clientName: "Marie Dupont", status: "termine", amount: 350, commission: 52.5, createdAt: "2025-11-01", deadline: "2025-11-20", deliveredAt: "2025-11-18", progress: 100, escrowStatus: "released" },
  { id: "CMD-334", serviceTitle: "Campagne Ads Q1", category: "Marketing Digital", freelanceId: "u7", freelanceName: "Nadia F.", clientId: "u5", clientName: "TechCorp Inc.", agencyId: "u9", status: "en_cours", amount: 5200, commission: 416, createdAt: "2026-02-01", deadline: "2026-03-20", deliveredAt: null, progress: 85, escrowStatus: "held" },
  { id: "CMD-333", serviceTitle: "Refonte E-commerce", category: "Développement Web", freelanceId: "u1", freelanceName: "Amadou D.", clientId: "u10", clientName: "Lamine Diallo", agencyId: "u9", status: "en_cours", amount: 12500, commission: 1000, createdAt: "2026-01-10", deadline: "2026-03-15", deliveredAt: null, progress: 65, escrowStatus: "held" },
  { id: "CMD-329", serviceTitle: "API Gestion Flotte", category: "Développement Web", freelanceId: "u4", freelanceName: "Ibrahim T.", clientId: "u10", clientName: "Lamine Diallo", status: "litige", amount: 3500, commission: 280, createdAt: "2025-12-10", deadline: "2026-01-20", deliveredAt: "2026-01-22", progress: 100, escrowStatus: "disputed" },
  { id: "CMD-328", serviceTitle: "Branding Complet", category: "Design & Graphisme", freelanceId: "u2", freelanceName: "Fatou S.", clientId: "u12", clientName: "Moussa Keita", status: "annule", amount: 700, commission: 0, createdAt: "2025-11-20", deadline: "2025-12-15", deliveredAt: null, progress: 25, escrowStatus: "refunded" },
];

const PLATFORM_TRANSACTIONS: PlatformTransaction[] = [
  { id: "ptx1", type: "paiement", userId: "u5", userName: "TechCorp Inc.", amount: 850, status: "en_attente", date: "2026-02-15", orderId: "CMD-342", description: "Paiement commande CMD-342" },
  { id: "ptx2", type: "paiement", userId: "u10", userName: "Lamine Diallo", amount: 1200, status: "complete", date: "2026-01-20", orderId: "CMD-341", description: "Paiement commande CMD-341" },
  { id: "ptx3", type: "commission", userId: "platform", userName: "FreelanceHigh", amount: 180, status: "complete", date: "2026-02-18", orderId: "CMD-341", description: "Commission CMD-341 (15%)" },
  { id: "ptx4", type: "retrait", userId: "u1", userName: "Amadou Diallo", amount: 500, status: "complete", date: "2026-02-20", method: "Wave", description: "Retrait Wave" },
  { id: "ptx5", type: "paiement", userId: "u8", userName: "Auto-Focus SARL", amount: 450, status: "en_attente", date: "2026-02-28", orderId: "CMD-340", description: "Paiement commande CMD-340" },
  { id: "ptx6", type: "paiement", userId: "u12", userName: "Moussa Keita", amount: 150, status: "en_attente", date: "2026-02-10", orderId: "CMD-339", description: "Paiement commande CMD-339" },
  { id: "ptx7", type: "paiement", userId: "u3", userName: "Marie Dupont", amount: 300, status: "complete", date: "2026-01-05", orderId: "CMD-338", description: "Paiement commande CMD-338" },
  { id: "ptx8", type: "commission", userId: "platform", userName: "FreelanceHigh", amount: 45, status: "complete", date: "2026-01-18", orderId: "CMD-338", description: "Commission CMD-338 (15%)" },
  { id: "ptx9", type: "paiement", userId: "u5", userName: "TechCorp Inc.", amount: 2400, status: "complete", date: "2025-12-01", orderId: "CMD-337", description: "Paiement commande CMD-337" },
  { id: "ptx10", type: "commission", userId: "platform", userName: "FreelanceHigh", amount: 360, status: "complete", date: "2026-01-12", orderId: "CMD-337", description: "Commission CMD-337 (15%)" },
  { id: "ptx11", type: "retrait", userId: "u4", userName: "Ibrahim Traoré", amount: 2000, status: "complete", date: "2026-01-15", method: "SEPA", description: "Retrait SEPA" },
  { id: "ptx12", type: "abonnement", userId: "u1", userName: "Amadou Diallo", amount: 15, status: "complete", date: "2026-03-01", description: "Abonnement Pro - Mars 2026" },
  { id: "ptx13", type: "abonnement", userId: "u9", userName: "TechCorp Agency", amount: 99, status: "complete", date: "2026-03-01", description: "Abonnement Agence - Mars 2026" },
  { id: "ptx14", type: "retrait", userId: "u2", userName: "Fatou Sow", amount: 800, status: "complete", date: "2026-02-10", method: "Orange Money", description: "Retrait Orange Money" },
  { id: "ptx15", type: "remboursement", userId: "u12", userName: "Moussa Keita", amount: 700, status: "complete", date: "2025-12-16", orderId: "CMD-328", description: "Remboursement CMD-328 annulée" },
  { id: "ptx16", type: "retrait", userId: "u7", userName: "Nadia Fall", amount: 400, status: "en_attente", date: "2026-03-04", method: "Wave", description: "Retrait Wave en attente" },
];

const PLATFORM_SERVICES: PlatformService[] = [
  { id: "ps1", title: "Design Dashboard SaaS", description: "Création de dashboard complet pour applications SaaS avec design system", category: "Design & Graphisme", freelanceId: "u1", freelanceName: "Amadou D.", price: 850, status: "actif", views: 3200, orders: 8, rating: 4.9, createdAt: "2025-08-20" },
  { id: "ps2", title: "API Backend Node.js", description: "Développement d'APIs RESTful et GraphQL avec Node.js, Express, Fastify", category: "Développement Web", freelanceId: "u4", freelanceName: "Ibrahim T.", price: 1200, status: "actif", views: 2800, orders: 12, rating: 4.8, createdAt: "2025-07-25" },
  { id: "ps3", title: "Logo Design Pro", description: "Création de logos professionnels avec charte graphique complète", category: "Design & Graphisme", freelanceId: "u2", freelanceName: "Fatou S.", price: 150, status: "actif", views: 4500, orders: 24, rating: 5.0, createdAt: "2025-09-05" },
  { id: "ps4", title: "Rédaction Blog SEO", description: "Rédaction d'articles de blog optimisés SEO en français et anglais", category: "Rédaction & Contenu", freelanceId: "u7", freelanceName: "Nadia F.", price: 60, status: "actif", views: 1800, orders: 15, rating: 4.7, createdAt: "2025-12-01" },
  { id: "ps5", title: "Audit SEO Technique", description: "Audit complet de votre site : technique, on-page, off-page", category: "Marketing Digital", freelanceId: "u11", freelanceName: "Sophie K.", price: 350, status: "actif", views: 1200, orders: 6, rating: 4.6, createdAt: "2025-11-10" },
  { id: "ps6", title: "App React Native", description: "Applications mobiles cross-platform avec React Native", category: "Développement Mobile", freelanceId: "u4", freelanceName: "Ibrahim T.", price: 2400, status: "actif", views: 2100, orders: 5, rating: 4.9, createdAt: "2025-08-01" },
  { id: "ps7", title: "Design UI/UX Figma", description: "Maquettes UI/UX professionnelles sur Figma avec prototypage", category: "Design & Graphisme", freelanceId: "u2", freelanceName: "Fatou S.", agencyId: "u9", price: 600, status: "actif", views: 3000, orders: 10, rating: 4.8, createdAt: "2025-09-15" },
  { id: "ps8", title: "DevOps Cloud Setup", description: "Configuration infrastructure cloud AWS/GCP avec CI/CD", category: "DevOps & Cloud", freelanceId: "u6", freelanceName: "Kofi M.", price: 800, status: "en_attente", views: 0, orders: 0, rating: 0, createdAt: "2026-03-01" },
  { id: "ps9", title: "Formation Python", description: "Cours de programmation Python pour débutants et intermédiaires", category: "Formation", freelanceId: "u11", freelanceName: "Sophie K.", price: 200, status: "en_attente", views: 0, orders: 0, rating: 0, createdAt: "2026-03-02" },
  { id: "ps10", title: "Campagne Google Ads", description: "Gestion complète de campagnes Google Ads et Facebook Ads", category: "Marketing Digital", freelanceId: "u7", freelanceName: "Nadia F.", price: 500, status: "actif", views: 900, orders: 3, rating: 4.5, createdAt: "2026-01-10" },
  { id: "ps11", title: "Site WordPress Pro", description: "Création de site vitrine ou e-commerce WordPress", category: "Développement Web", freelanceId: "u13", freelanceName: "Jean-Pierre M.", price: 400, status: "en_attente", views: 0, orders: 0, rating: 0, createdAt: "2026-03-03" },
];

const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: "blog1", title: "Comment gagner 3 000€/mois en freelance depuis Dakar", slug: "gagner-3000-euros-freelance-dakar",
    content: "Le freelancing en Afrique francophone connaît une croissance exponentielle. Avec les bonnes compétences et la bonne stratégie, il est tout à fait possible de générer des revenus confortables depuis Dakar, Abidjan ou toute autre ville africaine.\n\n## Les compétences les plus demandées\n\nLe développement web reste la compétence la plus lucrative, suivi du design UI/UX et du marketing digital. Les freelances maîtrisant React, Node.js ou Python peuvent facturer entre 30€ et 80€ de l'heure.\n\n## Construire sa réputation\n\nSur FreelanceHigh, commencez par proposer des prix compétitifs pour vos premiers services. Livrez un travail de qualité exceptionnelle et demandez systématiquement des avis à vos clients. En 3 à 6 mois, vous aurez suffisamment d'avis positifs pour augmenter vos tarifs.\n\n## Gérer ses finances\n\nAvec les paiements Mobile Money intégrés à FreelanceHigh, vous recevez vos gains directement sur Orange Money ou Wave. Pensez à mettre de côté 20% de vos revenus pour les impôts et investissez dans votre formation continue.",
    excerpt: "Découvrez les stratégies concrètes pour atteindre 3 000€ de revenus mensuels en freelance depuis l'Afrique.",
    coverImage: "", category: "Conseils", tags: ["freelance", "revenus", "afrique", "dakar"],
    author: "Lissanon Gildas", status: "publie", publishedAt: "2026-02-15", scheduledAt: null,
    createdAt: "2026-02-10", updatedAt: "2026-02-15", views: 2450,
    metaTitle: "Comment gagner 3000€/mois en freelance depuis Dakar — FreelanceHigh",
    metaDescription: "Guide complet pour devenir freelance rentable en Afrique francophone.",
  },
  {
    id: "blog2", title: "Les 10 erreurs à éviter quand on débute en freelance", slug: "10-erreurs-debutant-freelance",
    content: "Débuter en freelance est excitant mais semé d'embûches. Voici les erreurs les plus courantes et comment les éviter.\n\n## 1. Sous-estimer ses tarifs\n\nBeaucoup de débutants bradent leurs prix par peur de ne pas trouver de clients. C'est une erreur : des tarifs trop bas attirent des clients difficiles et vous épuisent.\n\n## 2. Ne pas avoir de contrat\n\nToujours définir le périmètre de la mission par écrit. Sur FreelanceHigh, le système d'escrow et les forfaits clairement définis vous protègent.\n\n## 3. Accepter tous les projets\n\nApprenez à dire non aux projets qui ne correspondent pas à vos compétences ou qui sont mal rémunérés.\n\n## 4. Négliger sa communication\n\nRépondez rapidement aux messages de vos clients. Une bonne communication est souvent plus valorisée que la perfection technique.\n\n## 5. Ne pas investir dans son profil\n\nUn profil complet avec photo professionnelle, portfolio et certifications inspire confiance et génère plus de commandes.",
    excerpt: "Les pièges classiques du freelancing et comment les contourner pour réussir dès le départ.",
    coverImage: "", category: "Conseils", tags: ["débutant", "erreurs", "freelance", "conseils"],
    author: "Lissanon Gildas", status: "publie", publishedAt: "2026-02-28", scheduledAt: null,
    createdAt: "2026-02-25", updatedAt: "2026-02-28", views: 1820,
  },
  {
    id: "blog3", title: "Success Story : Ibrahim, développeur à Abidjan, facture 5 000€/mois", slug: "success-story-ibrahim-developpeur-abidjan",
    content: "Ibrahim Traoré, développeur full-stack à Abidjan, nous raconte son parcours. Parti de zéro il y a 2 ans, il facture aujourd'hui plus de 5 000€ par mois sur FreelanceHigh.\n\n## Le début\n\n\"J'ai commencé avec un plan gratuit et un seul service : développement d'APIs Node.js. Mon premier client m'a laissé 5 étoiles et ça a tout changé.\"\n\n## La montée en puissance\n\n\"Après 3 mois et 10 commandes terminées, j'ai obtenu le badge Top Rated. Les demandes ont afflué. J'ai augmenté mes prix de 40% et les clients continuaient de venir.\"\n\n## Aujourd'hui\n\n\"Je suis passé au plan Business. Avec la commission réduite à 10%, je garde plus de mes gains. Je forme aussi d'autres développeurs via mes services de formation.\"",
    excerpt: "Comment Ibrahim est passé de 0 à 5 000€/mois en freelance depuis Abidjan en 2 ans.",
    coverImage: "", category: "Success Stories", tags: ["success", "développeur", "abidjan", "témoignage"],
    author: "Lissanon Gildas", status: "publie", publishedAt: "2026-03-01", scheduledAt: null,
    createdAt: "2026-02-28", updatedAt: "2026-03-01", views: 3100,
  },
  {
    id: "blog4", title: "Guide complet du paiement Mobile Money pour les freelances", slug: "guide-paiement-mobile-money-freelances",
    content: "Le Mobile Money est la méthode de paiement préférée en Afrique francophone. Voici comment en tirer le meilleur parti sur FreelanceHigh...",
    excerpt: "Tout ce que vous devez savoir sur les paiements Orange Money, Wave et MTN MoMo sur FreelanceHigh.",
    coverImage: "", category: "Tutoriels", tags: ["mobile money", "paiement", "orange money", "wave"],
    author: "Lissanon Gildas", status: "brouillon", publishedAt: null, scheduledAt: null,
    createdAt: "2026-03-03", updatedAt: "2026-03-03", views: 0,
  },
];

const PLATFORM_DISPUTES: PlatformDispute[] = [
  {
    id: "lit1", orderId: "CMD-329", orderTitle: "API Gestion Flotte", clientId: "u10", clientName: "Lamine Diallo",
    freelanceId: "u4", freelanceName: "Ibrahim Traoré", amount: 3500,
    reason: "Livraison non conforme au cahier des charges",
    clientArgument: "L'API livrée ne gère pas les endpoints de géolocalisation qui étaient dans le brief initial. Documentation incomplète. Tests unitaires absents.",
    freelanceArgument: "La géolocalisation n'était pas mentionnée dans le forfait choisi. C'est un extra qui n'a pas été commandé. L'API principale fonctionne parfaitement.",
    status: "ouvert", openedAt: "2026-01-25", priority: "haute",
  },
  {
    id: "lit2", orderId: "CMD-320", orderTitle: "Design Brochure", clientId: "u3", clientName: "Marie Dupont",
    freelanceId: "u11", freelanceName: "Sophie Kamara", amount: 250,
    reason: "Retard de livraison excessif",
    clientArgument: "La livraison devait être faite le 15 février. Nous sommes le 5 mars et je n'ai toujours rien reçu. Aucune communication depuis 10 jours.",
    freelanceArgument: "J'ai eu un problème de santé qui m'a empêché de travailler pendant 2 semaines. J'ai prévenu le client mais il refuse l'extension de délai.",
    status: "en_examen", openedAt: "2026-03-01", priority: "moyenne",
  },
];

const KYC_REQUESTS: KycRequest[] = [
  { id: "kyc1", userId: "u13", userName: "Jean-Pierre Martin", userEmail: "jp@email.com", userAvatar: "JM", requestedLevel: 3, currentLevel: 1, documentType: "Carte nationale d'identité", submittedAt: "2026-03-02", status: "en_attente" },
  { id: "kyc2", userId: "u6", userName: "Kofi Mensah", userEmail: "kofi@email.com", userAvatar: "KM", requestedLevel: 3, currentLevel: 2, documentType: "Passeport", submittedAt: "2026-03-01", status: "en_attente" },
  { id: "kyc3", userId: "u12", userName: "Moussa Keita", userEmail: "moussa@email.com", userAvatar: "MK", requestedLevel: 2, currentLevel: 1, documentType: "Téléphone vérifié", submittedAt: "2026-03-03", status: "en_attente" },
  { id: "kyc4", userId: "u14", userName: "Aissatou Barry", userEmail: "aissatou@email.com", userAvatar: "AB", requestedLevel: 3, currentLevel: 2, documentType: "Carte nationale d'identité", submittedAt: "2026-02-28", status: "en_attente" },
];

const PLATFORM_NOTIFICATIONS: PlatformNotification[] = [
  { id: "notif1", title: "Bienvenue sur FreelanceHigh !", message: "Nous sommes ravis de vous accueillir. Complétez votre profil pour commencer.", type: "annonce", target: "tous", channel: "les-deux", sentAt: "2026-03-01", read: true },
  { id: "notif2", title: "Nouvelle fonctionnalité : Certifications IA", message: "Testez vos compétences et obtenez des badges certifiés par IA.", type: "fonctionnalite", target: "freelance", channel: "in-app", sentAt: "2026-02-20", read: false },
  { id: "notif3", title: "Offre spéciale : Plan Pro à -50%", message: "Passez au plan Pro pour seulement 7,50€/mois le premier mois !", type: "promotion", target: "tous", channel: "email", sentAt: "2026-02-15", read: true },
];

const DEFAULT_CONFIG: PlatformConfig = {
  siteName: "FreelanceHigh",
  maintenanceMode: false,
  maintenanceMessage: "FreelanceHigh est en maintenance. Nous revenons très bientôt !",
  announcementBanner: "",
  commissions: { gratuit: 20, pro: 15, business: 10, agence: 8 },
  plans: [
    { name: "Gratuit", price: 0, annualPrice: 0, commission: 20, maxServices: 3, maxCandidatures: 5, boostPerMonth: 0, certificationIA: false, apiAccess: false, maxMembers: null, storage: null },
    { name: "Pro", price: 15, annualPrice: 144, commission: 15, maxServices: 15, maxCandidatures: 20, boostPerMonth: 1, certificationIA: true, apiAccess: false, maxMembers: null, storage: null },
    { name: "Business", price: 45, annualPrice: 432, commission: 10, maxServices: null, maxCandidatures: null, boostPerMonth: 5, certificationIA: true, apiAccess: true, maxMembers: null, storage: null },
    { name: "Agence", price: 99, annualPrice: 950, commission: 8, maxServices: null, maxCandidatures: null, boostPerMonth: 10, certificationIA: true, apiAccess: true, maxMembers: 20, storage: "50 GB" },
  ],
  enabledPaymentMethods: ["Carte bancaire", "SEPA", "PayPal", "Orange Money", "Wave", "MTN Mobile Money"],
  enabledCurrencies: ["EUR", "FCFA", "USD", "GBP", "MAD"],
};

const ADMIN_REVENUE: Record<string, { month: string; revenue: number; commissions: number }[]> = {
  "7j": [
    { month: "Lun", revenue: 4800, commissions: 720 }, { month: "Mar", revenue: 5200, commissions: 780 },
    { month: "Mer", revenue: 4900, commissions: 735 }, { month: "Jeu", revenue: 6100, commissions: 915 },
    { month: "Ven", revenue: 7200, commissions: 1080 }, { month: "Sam", revenue: 3800, commissions: 570 },
    { month: "Dim", revenue: 2200, commissions: 330 },
  ],
  "30j": [
    { month: "S1", revenue: 32000, commissions: 4800 }, { month: "S2", revenue: 35000, commissions: 5250 },
    { month: "S3", revenue: 38000, commissions: 5700 }, { month: "S4", revenue: 40200, commissions: 6030 },
  ],
  "90j": [
    { month: "Jan", revenue: 115000, commissions: 17250 }, { month: "Fév", revenue: 128000, commissions: 19200 },
    { month: "Mar", revenue: 145200, commissions: 21780 },
  ],
  "12m": [
    { month: "Avr", revenue: 85000, commissions: 12750 }, { month: "Mai", revenue: 92000, commissions: 13800 },
    { month: "Jun", revenue: 98000, commissions: 14700 }, { month: "Jul", revenue: 105000, commissions: 15750 },
    { month: "Aoû", revenue: 110000, commissions: 16500 }, { month: "Sep", revenue: 108000, commissions: 16200 },
    { month: "Oct", revenue: 115000, commissions: 17250 }, { month: "Nov", revenue: 122000, commissions: 18300 },
    { month: "Déc", revenue: 130000, commissions: 19500 }, { month: "Jan", revenue: 128000, commissions: 19200 },
    { month: "Fév", revenue: 138000, commissions: 20700 }, { month: "Mar", revenue: 145200, commissions: 21780 },
  ],
};

const AGENCY_MEMBERS: AgencyMember[] = [
  { id: "u1", name: "Amadou D.", role: "Développeur", avatar: "AD", status: "online", activeOrders: 2, completedOrders: 15, revenue: 28500, occupation: 80 },
  { id: "u2", name: "Fatou S.", role: "Designer UI", avatar: "FS", status: "online", activeOrders: 1, completedOrders: 24, revenue: 18000, occupation: 60 },
  { id: "u7", name: "Nadia F.", role: "Marketing", avatar: "NF", status: "busy", activeOrders: 1, completedOrders: 10, revenue: 12000, occupation: 90 },
  { id: "u4", name: "Ibrahim T.", role: "Développeur", avatar: "IT", status: "online", activeOrders: 2, completedOrders: 20, revenue: 45000, occupation: 85 },
  { id: "u6", name: "Kofi M.", role: "DevOps", avatar: "KM", status: "offline", activeOrders: 1, completedOrders: 5, revenue: 8000, occupation: 40 },
  { id: "u11", name: "Sophie K.", role: "Rédactrice", avatar: "SK", status: "online", activeOrders: 0, completedOrders: 8, revenue: 6500, occupation: 30 },
];

const AGENCY_PROJECTS: AgencyProject[] = [
  { id: "ap1", name: "Refonte e-commerce Dakar Shop", client: "Dakar Shop SARL", memberId: "u1", memberName: "Amadou D.", status: "en_cours", progress: 65, budget: 12500, deadline: "2026-03-15" },
  { id: "ap2", name: "App mobile livraison", client: "QuickDeliver", memberId: "u4", memberName: "Ibrahim T.", status: "en_cours", progress: 40, budget: 18000, deadline: "2026-04-01" },
  { id: "ap3", name: "Campagne ads Q1 2026", client: "FashionAfrik", memberId: "u7", memberName: "Nadia F.", status: "actif", progress: 85, budget: 5200, deadline: "2026-03-20" },
  { id: "ap4", name: "Audit sécurité cloud", client: "FinTech CI", memberId: "u6", memberName: "Kofi M.", status: "en_attente", progress: 10, budget: 8000, deadline: "2026-03-25" },
  { id: "ap5", name: "Design système mobile", client: "HealthApp", memberId: "u2", memberName: "Fatou S.", status: "en_cours", progress: 30, budget: 9500, deadline: "2026-04-10" },
];

const AGENCY_CLIENTS: AgencyClient[] = [
  { id: "u5", name: "TechCorp Inc.", totalSpent: 25600, ordersCount: 5, lastOrder: "2026-02-15", satisfaction: 4.8 },
  { id: "u10", name: "Lamine Diallo", totalSpent: 16000, ordersCount: 3, lastOrder: "2026-01-10", satisfaction: 4.5 },
  { id: "u3", name: "Marie Dupont", totalSpent: 10150, ordersCount: 4, lastOrder: "2026-02-15", satisfaction: 4.9 },
  { id: "u8", name: "Auto-Focus SARL", totalSpent: 9050, ordersCount: 3, lastOrder: "2026-02-28", satisfaction: 4.6 },
  { id: "u12", name: "Moussa Keita", totalSpent: 850, ordersCount: 2, lastOrder: "2026-02-10", satisfaction: 4.2 },
];

const AGENCY_REVENUE = [
  { month: "Sep", value: 98000 }, { month: "Oct", value: 112000 }, { month: "Nov", value: 125000 },
  { month: "Déc", value: 118000 }, { month: "Jan", value: 135000 }, { month: "Fév", value: 145200 },
];

const CLIENT_PROJECTS: ClientProject[] = [
  { id: "cp1", name: "Refonte Site E-commerce", freelanceName: "Amadou D.", progress: 75, status: "En cours", statusColor: "text-primary", barColor: "bg-primary", dueDate: "15 Mar 2026", budget: 12500 },
  { id: "cp2", name: "Développement API Mobile", freelanceName: "Ibrahim T.", progress: 32, status: "Phase de test", statusColor: "text-blue-400", barColor: "bg-blue-500", dueDate: "01 Avr 2026", budget: 18000 },
  { id: "cp3", name: "Identité Visuelle Startup", freelanceName: "Fatou S.", progress: 90, status: "Finalisation", statusColor: "text-orange-400", barColor: "bg-orange-500", dueDate: "10 Mar 2026", budget: 9500 },
];

const CLIENT_ORDERS: ClientOrder[] = [
  { id: "co1", name: "Pack Maintenance Annuel", ref: "CMD-342", status: "En cours", amount: 850, date: "2026-02-15" },
  { id: "co2", name: "Audit SEO - Trimestriel", ref: "CMD-340", status: "En attente", amount: 450, date: "2026-02-28" },
  { id: "co3", name: "Pack Articles Blog", ref: "CMD-338", status: "Terminé", amount: 300, date: "2026-01-05" },
];

// ── Store Interface ──

interface PlatformDataState {
  // Data
  users: PlatformUser[];
  orders: PlatformOrder[];
  transactions: PlatformTransaction[];
  services: PlatformService[];
  categories: PlatformCategory[];
  blogArticles: BlogArticle[];
  disputes: PlatformDispute[];
  kycRequests: KycRequest[];
  notifications: PlatformNotification[];
  config: PlatformConfig;
  agencyMembers: AgencyMember[];
  agencyProjects: AgencyProject[];
  agencyClients: AgencyClient[];
  clientProjects: ClientProject[];
  clientOrders: ClientOrder[];
  adminRevenue: typeof ADMIN_REVENUE;
  agencyRevenue: typeof AGENCY_REVENUE;
  auditLog: AuditEntry[];
  userNotifications: UserNotification[];

  // ── Audit & Notification Actions ──
  logAudit: (entry: Omit<AuditEntry, "id" | "createdAt">) => void;
  addUserNotification: (notif: Omit<UserNotification, "id" | "createdAt" | "read">) => void;
  markUserNotificationRead: (id: string) => void;
  getUserNotifications: (userId: string) => UserNotification[];

  // ── User Actions ──
  updateUser: (id: string, data: Partial<PlatformUser>) => void;
  suspendUser: (id: string, reason: string) => void;
  banUser: (id: string) => void;
  reactivateUser: (id: string) => void;
  changeUserRole: (id: string, role: PlatformUser["role"]) => void;
  changeUserPlan: (id: string, plan: PlatformUser["plan"]) => void;
  verifyUserKyc: (id: string, level: number) => void;

  // ── Service Actions ──
  setServices: (services: PlatformService[]) => void;
  approveService: (id: string) => void;
  refuseService: (id: string, reason: string) => void;
  deleteService: (id: string) => void;
  featureService: (id: string) => void;
  unfeatureService: (id: string) => void;
  pauseService: (id: string) => void;
  updateService: (id: string, data: Partial<PlatformService>) => void;

  // ── Order Actions ──
  updateOrderStatus: (id: string, status: PlatformOrder["status"]) => void;
  forceDelivery: (id: string) => void;
  forceCancel: (id: string) => void;
  releaseEscrow: (id: string) => void;
  refundOrder: (id: string) => void;

  // ── Category Actions ──
  addCategory: (cat: Omit<PlatformCategory, "id" | "servicesCount">) => void;
  updateCategory: (id: string, data: Partial<PlatformCategory>) => void;
  deleteCategory: (id: string) => void;

  // ── Blog Actions ──
  addArticle: (article: Omit<BlogArticle, "id" | "views" | "createdAt" | "updatedAt">) => void;
  updateArticle: (id: string, data: Partial<BlogArticle>) => void;
  publishArticle: (id: string) => void;
  unpublishArticle: (id: string) => void;
  deleteArticle: (id: string) => void;

  // ── Dispute Actions ──
  resolveDispute: (id: string, verdict: PlatformDispute["verdict"], note: string, partialPercent?: number) => void;
  startExamineDispute: (id: string) => void;

  // ── KYC Actions ──
  approveKyc: (id: string) => void;
  refuseKyc: (id: string, reason: string) => void;

  // ── Notification Actions ──
  sendNotification: (notif: Omit<PlatformNotification, "id" | "sentAt" | "read">) => void;

  // ── Transaction Actions ──
  blockTransaction: (id: string) => void;
  unblockTransaction: (id: string) => void;
  addRefundTransaction: (orderId: string, amount: number, userId: string, userName: string) => void;

  // ── Config Actions ──
  updateConfig: (data: Partial<PlatformConfig>) => void;
  updatePlanConfig: (index: number, data: Partial<PlatformConfig["plans"][0]>) => void;
  updateCommissions: (commissions: PlatformConfig["commissions"]) => void;
  toggleMaintenanceMode: () => void;
  setAnnouncementBanner: (text: string) => void;
}

// ── Helper ──
let _nextId = 100;
function genId(prefix: string) {
  _nextId++;
  return `${prefix}${_nextId}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ── Store ──

export const usePlatformDataStore = create<PlatformDataState>()((set, get) => ({
  // Initial data
  users: PLATFORM_USERS,
  orders: PLATFORM_ORDERS,
  transactions: PLATFORM_TRANSACTIONS,
  services: PLATFORM_SERVICES,
  categories: PLATFORM_CATEGORIES,
  blogArticles: BLOG_ARTICLES,
  disputes: PLATFORM_DISPUTES,
  kycRequests: KYC_REQUESTS,
  notifications: PLATFORM_NOTIFICATIONS,
  config: DEFAULT_CONFIG,
  agencyMembers: AGENCY_MEMBERS,
  agencyProjects: AGENCY_PROJECTS,
  agencyClients: AGENCY_CLIENTS,
  clientProjects: CLIENT_PROJECTS,
  clientOrders: CLIENT_ORDERS,
  adminRevenue: ADMIN_REVENUE,
  agencyRevenue: AGENCY_REVENUE,
  auditLog: [],
  userNotifications: [],

  // ── Audit & Notification Actions ──
  logAudit: (entry) => set(s => ({
    auditLog: [{ ...entry, id: genId("audit"), createdAt: new Date().toISOString() }, ...s.auditLog],
  })),

  addUserNotification: (notif) => set(s => ({
    userNotifications: [{ ...notif, id: genId("unotif"), createdAt: new Date().toISOString(), read: false }, ...s.userNotifications],
  })),

  markUserNotificationRead: (id) => set(s => ({
    userNotifications: s.userNotifications.map(n => n.id === id ? { ...n, read: true } : n),
  })),

  getUserNotifications: (userId) => {
    return get().userNotifications.filter(n => n.userId === userId);
  },

  // ── User Actions ──
  updateUser: (id, data) => set(s => ({
    users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
  })),

  suspendUser: (id, reason) => {
    const user = get().users.find(u => u.id === id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, status: "suspendu" as const, suspendReason: reason } : u),
      services: s.services.map(sv => sv.freelanceId === id && sv.status === "actif" ? { ...sv, status: "pause" as const } : sv),
    }));
    get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "suspend_user", targetUserId: id, targetUserName: user?.name, details: { reason } });
    get().addUserNotification({ userId: id, title: "Compte suspendu", message: `Votre compte a ete suspendu. Raison: ${reason}`, type: "admin_action", link: "/dashboard/parametres" });
  },

  banUser: (id) => {
    const user = get().users.find(u => u.id === id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, status: "banni" as const } : u),
      services: s.services.map(sv => sv.freelanceId === id ? { ...sv, status: "pause" as const } : sv),
    }));
    get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "ban_user", targetUserId: id, targetUserName: user?.name });
    get().addUserNotification({ userId: id, title: "Compte banni", message: "Votre compte a ete banni de la plateforme.", type: "admin_action" });
  },

  reactivateUser: (id) => {
    const user = get().users.find(u => u.id === id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, status: "actif" as const, suspendReason: undefined } : u),
    }));
    get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "reactivate_user", targetUserId: id, targetUserName: user?.name });
    get().addUserNotification({ userId: id, title: "Compte reactive", message: "Votre compte a ete reactive. Bienvenue de retour !", type: "admin_action" });
  },

  changeUserRole: (id, role) => {
    const user = get().users.find(u => u.id === id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, role } : u),
    }));
    get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "change_role", targetUserId: id, targetUserName: user?.name, details: { oldRole: user?.role, newRole: role } });
  },

  changeUserPlan: (id, plan) => {
    const user = get().users.find(u => u.id === id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, plan } : u),
    }));
    get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "change_plan", targetUserId: id, targetUserName: user?.name, details: { oldPlan: user?.plan, newPlan: plan } });
    get().addUserNotification({ userId: id, title: "Plan modifie", message: `Votre plan a ete change vers ${plan}.`, type: "admin_action", link: "/dashboard/abonnement" });
  },

  verifyUserKyc: (id, level) => {
    const user = get().users.find(u => u.id === id);
    set(s => ({
      users: s.users.map(u => u.id === id ? { ...u, kyc: level } : u),
    }));
    get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "verify_kyc", targetUserId: id, targetUserName: user?.name, details: { level } });
    get().addUserNotification({ userId: id, title: "KYC verifie", message: `Votre verification KYC niveau ${level} a ete approuvee.`, type: "kyc" });
  },

  // ── Service Actions ──
  setServices: (services) => set({ services }),

  approveService: (id) => set(s => {
    const svc = s.services.find(sv => sv.id === id);
    const catName = svc?.category;
    return {
      services: s.services.map(sv => sv.id === id ? { ...sv, status: "actif" as const } : sv),
      categories: s.categories.map(c => c.name === catName ? { ...c, servicesCount: c.servicesCount + 1 } : c),
    };
  }),

  refuseService: (id, reason) => set(s => ({
    services: s.services.map(sv => sv.id === id ? { ...sv, status: "refuse" as const, refuseReason: reason } : sv),
  })),

  deleteService: (id) => set(s => {
    const svc = s.services.find(sv => sv.id === id);
    const catName = svc?.category;
    const wasActive = svc?.status === "actif" || svc?.status === "vedette";
    return {
      services: s.services.filter(sv => sv.id !== id),
      categories: wasActive
        ? s.categories.map(c => c.name === catName ? { ...c, servicesCount: Math.max(0, c.servicesCount - 1) } : c)
        : s.categories,
    };
  }),

  featureService: (id) => set(s => ({
    services: s.services.map(sv => sv.id === id ? { ...sv, status: "vedette" as const } : sv),
  })),

  unfeatureService: (id) => set(s => ({
    services: s.services.map(sv => sv.id === id ? { ...sv, status: "actif" as const } : sv),
  })),

  pauseService: (id) => set(s => ({
    services: s.services.map(sv => sv.id === id ? { ...sv, status: "pause" as const } : sv),
  })),

  updateService: (id, data) => set(s => ({
    services: s.services.map(sv => sv.id === id ? { ...sv, ...data } : sv),
  })),

  // ── Order Actions ──
  updateOrderStatus: (id, status) => set(s => ({
    orders: s.orders.map(o => o.id === id ? { ...o, status } : o),
  })),

  forceDelivery: (id) => set(s => ({
    orders: s.orders.map(o => o.id === id ? { ...o, status: "termine" as const, progress: 100, deliveredAt: today(), escrowStatus: "released" as const } : o),
  })),

  forceCancel: (id) => set(s => ({
    orders: s.orders.map(o => o.id === id ? { ...o, status: "annule" as const, escrowStatus: "refunded" as const } : o),
  })),

  releaseEscrow: (id) => set(s => ({
    orders: s.orders.map(o => o.id === id ? { ...o, escrowStatus: "released" as const, status: "termine" as const } : o),
  })),

  refundOrder: (id) => set(s => {
    const order = s.orders.find(o => o.id === id);
    const newTx: PlatformTransaction = {
      id: genId("ptx"), type: "remboursement", userId: order?.clientId || "", userName: order?.clientName,
      amount: order?.amount || 0, status: "complete", date: today(), orderId: id,
      description: `Remboursement ${id}`,
    };
    return {
      orders: s.orders.map(o => o.id === id ? { ...o, status: "annule" as const, escrowStatus: "refunded" as const } : o),
      transactions: [...s.transactions, newTx],
    };
  }),

  // ── Category Actions ──
  addCategory: (cat) => set(s => ({
    categories: [...s.categories, { ...cat, id: genId("cat"), servicesCount: 0 }],
  })),

  updateCategory: (id, data) => set(s => ({
    categories: s.categories.map(c => c.id === id ? { ...c, ...data } : c),
  })),

  deleteCategory: (id) => set(s => ({
    categories: s.categories.filter(c => c.id !== id),
  })),

  // ── Blog Actions ──
  addArticle: (article) => set(s => ({
    blogArticles: [...s.blogArticles, {
      ...article, id: genId("blog"), views: 0,
      createdAt: today(), updatedAt: today(),
    }],
  })),

  updateArticle: (id, data) => set(s => ({
    blogArticles: s.blogArticles.map(a => a.id === id ? { ...a, ...data, updatedAt: today() } : a),
  })),

  publishArticle: (id) => set(s => ({
    blogArticles: s.blogArticles.map(a => a.id === id ? { ...a, status: "publie" as const, publishedAt: today(), updatedAt: today() } : a),
  })),

  unpublishArticle: (id) => set(s => ({
    blogArticles: s.blogArticles.map(a => a.id === id ? { ...a, status: "brouillon" as const, updatedAt: today() } : a),
  })),

  deleteArticle: (id) => set(s => ({
    blogArticles: s.blogArticles.filter(a => a.id !== id),
  })),

  // ── Dispute Actions ──
  resolveDispute: (id, verdict, note, partialPercent) => {
    set(s => {
      const dispute = s.disputes.find(d => d.id === id);
      if (!dispute) return {};

      let newEscrowStatus: PlatformOrder["escrowStatus"] = "released";
      let newOrderStatus: PlatformOrder["status"] = "termine";
      const newTransactions = [...s.transactions];

      if (verdict === "client") {
        newEscrowStatus = "refunded";
        newOrderStatus = "annule";
        newTransactions.push({
          id: genId("ptx"), type: "remboursement", userId: dispute.clientId, userName: dispute.clientName,
          amount: dispute.amount, status: "complete", date: today(), orderId: dispute.orderId,
          description: `Remboursement litige ${dispute.orderId} — en faveur du client`,
        });
      } else if (verdict === "partiel" && partialPercent) {
        const refundAmount = Math.round(dispute.amount * partialPercent / 100);
        newEscrowStatus = "released";
        newOrderStatus = "termine";
        newTransactions.push({
          id: genId("ptx"), type: "remboursement", userId: dispute.clientId, userName: dispute.clientName,
          amount: refundAmount, status: "complete", date: today(), orderId: dispute.orderId,
          description: `Remboursement partiel ${partialPercent}% — litige ${dispute.orderId}`,
        });
      } else if (verdict === "annulation") {
        newEscrowStatus = "refunded";
        newOrderStatus = "annule";
        newTransactions.push({
          id: genId("ptx"), type: "remboursement", userId: dispute.clientId, userName: dispute.clientName,
          amount: dispute.amount, status: "complete", date: today(), orderId: dispute.orderId,
          description: `Annulation mutuelle — litige ${dispute.orderId}`,
        });
      }

      return {
        disputes: s.disputes.map(d => d.id === id ? {
          ...d, status: "resolu" as const, verdict, verdictNote: note,
          partialPercent, resolvedAt: today(),
        } : d),
        orders: s.orders.map(o => o.id === dispute.orderId ? { ...o, status: newOrderStatus, escrowStatus: newEscrowStatus } : o),
        transactions: newTransactions,
      };
    });
    const dispute = get().disputes.find(d => d.id === id);
    if (dispute) {
      const verdictLabels: Record<string, string> = { client: "en faveur du client", freelance: "en faveur du freelance", partiel: `partiel (${partialPercent}%)`, annulation: "annulation mutuelle" };
      get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "resolve_dispute", targetUserId: dispute.clientId, targetUserName: dispute.clientName, details: { orderId: dispute.orderId, verdict, note } });
      const verdictStr = verdict ? (verdictLabels[verdict] ?? verdict) : "inconnu";
      get().addUserNotification({ userId: dispute.clientId, title: "Litige resolu", message: `Le litige sur la commande ${dispute.orderTitle} a ete resolu: ${verdictStr}.`, type: "admin_action", link: "/client/commandes" });
      get().addUserNotification({ userId: dispute.freelanceId, title: "Litige resolu", message: `Le litige sur la commande ${dispute.orderTitle} a ete resolu: ${verdictStr}.`, type: "admin_action", link: "/dashboard/commandes" });
    }
  },

  startExamineDispute: (id) => set(s => ({
    disputes: s.disputes.map(d => d.id === id ? { ...d, status: "en_examen" as const } : d),
  })),

  // ── KYC Actions ──
  approveKyc: (id) => {
    set(s => {
      const req = s.kycRequests.find(k => k.id === id);
      return {
        kycRequests: s.kycRequests.map(k => k.id === id ? { ...k, status: "approuve" as const, reviewedAt: today(), reviewedBy: "Admin" } : k),
        users: req ? s.users.map(u => u.id === req.userId ? { ...u, kyc: req.requestedLevel } : u) : s.users,
      };
    });
    const req = get().kycRequests.find(k => k.id === id);
    if (req) {
      get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "approve_kyc", targetUserId: req.userId, targetUserName: req.userName, details: { level: req.requestedLevel } });
      get().addUserNotification({ userId: req.userId, title: "KYC approuve", message: `Votre verification KYC niveau ${req.requestedLevel} a ete approuvee.`, type: "kyc", link: "/dashboard/profil" });
    }
  },

  refuseKyc: (id, reason) => {
    set(s => ({
      kycRequests: s.kycRequests.map(k => k.id === id ? { ...k, status: "refuse" as const, refuseReason: reason, reviewedAt: today(), reviewedBy: "Admin" } : k),
    }));
    const req = get().kycRequests.find(k => k.id === id);
    if (req) {
      get().logAudit({ adminId: "admin-1", adminName: "Admin Principal", action: "refuse_kyc", targetUserId: req.userId, targetUserName: req.userName, details: { reason } });
      get().addUserNotification({ userId: req.userId, title: "KYC refuse", message: `Votre verification KYC niveau ${req.requestedLevel} a ete refusee. Raison: ${reason}`, type: "kyc", link: "/dashboard/profil" });
    }
  },

  // ── Notification Actions ──
  sendNotification: (notif) => set(s => ({
    notifications: [...s.notifications, { ...notif, id: genId("notif"), sentAt: today(), read: false }],
  })),

  // ── Transaction Actions ──
  blockTransaction: (id) => set(s => ({
    transactions: s.transactions.map(t => t.id === id ? { ...t, status: "bloque" as const } : t),
  })),

  unblockTransaction: (id) => set(s => ({
    transactions: s.transactions.map(t => t.id === id ? { ...t, status: "en_attente" as const } : t),
  })),

  addRefundTransaction: (orderId, amount, userId, userName) => set(s => ({
    transactions: [...s.transactions, {
      id: genId("ptx"), type: "remboursement" as const, userId, userName,
      amount, status: "complete" as const, date: today(), orderId,
      description: `Remboursement manuel ${orderId}`,
    }],
  })),

  // ── Config Actions ──
  updateConfig: (data) => set(s => ({
    config: { ...s.config, ...data },
  })),

  updatePlanConfig: (index, data) => set(s => ({
    config: {
      ...s.config,
      plans: s.config.plans.map((p, i) => i === index ? { ...p, ...data } : p),
    },
  })),

  updateCommissions: (commissions) => set(s => ({
    config: { ...s.config, commissions },
  })),

  toggleMaintenanceMode: () => set(s => ({
    config: { ...s.config, maintenanceMode: !s.config.maintenanceMode },
  })),

  setAnnouncementBanner: (text) => set(s => ({
    config: { ...s.config, announcementBanner: text },
  })),
}));

// ── Computed helpers ──

export function computeAdminStats(state: PlatformDataState) {
  const totalUsers = state.users.length;
  const freelances = state.users.filter(u => u.role === "freelance").length;
  const clients = state.users.filter(u => u.role === "client").length;
  const agencies = state.users.filter(u => u.role === "agence").length;
  const activeOrders = state.orders.filter(o => ["en_cours", "en_attente", "revision", "livre"].includes(o.status)).length;
  const gmv = state.orders.filter(o => o.status !== "annule").reduce((s, o) => s + o.amount, 0);
  const commissions = state.orders.filter(o => ["termine", "livre"].includes(o.status)).reduce((s, o) => s + o.commission, 0);
  const disputes = state.orders.filter(o => o.status === "litige").length;
  const pendingModeration = state.services.filter(s => s.status === "en_attente").length;
  const pendingKyc = state.kycRequests.filter(k => k.status === "en_attente").length;
  const avgOrderValue = state.orders.length > 0 ? Math.round(gmv / state.orders.filter(o => o.status !== "annule").length) : 0;
  const completedOrders = state.orders.filter(o => o.status === "termine").length;
  const totalNonCancelled = state.orders.filter(o => o.status !== "annule").length;
  const completionRate = totalNonCancelled > 0 ? ((completedOrders / totalNonCancelled) * 100).toFixed(1) : "0";
  const escrowTotal = state.orders.filter(o => o.escrowStatus === "held").reduce((s, o) => s + o.amount, 0);
  const totalCategories = state.categories.filter(c => c.status === "actif").length;
  const totalArticles = state.blogArticles.filter(a => a.status === "publie").length;

  const usersByCountry: Record<string, { flag: string; count: number }> = {};
  state.users.forEach(u => {
    if (!usersByCountry[u.country]) usersByCountry[u.country] = { flag: u.countryFlag, count: 0 };
    usersByCountry[u.country].count++;
  });
  const topCountries = Object.entries(usersByCountry)
    .map(([country, d]) => ({ country, flag: d.flag, users: d.count }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 5);

  const ordersByStatus = {
    en_attente: state.orders.filter(o => o.status === "en_attente").length,
    en_cours: state.orders.filter(o => o.status === "en_cours").length,
    livre: state.orders.filter(o => o.status === "livre").length,
    revision: state.orders.filter(o => o.status === "revision").length,
    termine: completedOrders,
    annule: state.orders.filter(o => o.status === "annule").length,
    litige: disputes,
  };

  const revenueByCategory: Record<string, number> = {};
  state.orders.filter(o => o.status !== "annule").forEach(o => {
    revenueByCategory[o.category] = (revenueByCategory[o.category] || 0) + o.amount;
  });
  const topCategories = Object.entries(revenueByCategory)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    totalUsers, freelances, clients, agencies,
    activeOrders, gmv, commissions, disputes, pendingModeration, pendingKyc,
    avgOrderValue, completionRate, topCountries, escrowTotal,
    totalCategories, totalArticles, ordersByStatus, topCategories,
    rolePie: [
      { name: "Freelances", value: freelances, color: "#dc2626" },
      { name: "Clients", value: clients, color: "#3b82f6" },
      { name: "Agences", value: agencies, color: "#a855f7" },
    ],
  };
}

export function computeClientStats(state: PlatformDataState, clientId: string) {
  const myOrders = state.orders.filter(o => o.clientId === clientId);
  const activeProjects = myOrders.filter(o => ["en_cours", "en_attente", "revision"].includes(o.status)).length;
  const totalSpent = myOrders.filter(o => o.status !== "annule").reduce((s, o) => s + o.amount, 0);
  const completedOrders = myOrders.filter(o => o.status === "termine").length;
  const uniqueFreelances = new Set(myOrders.map(o => o.freelanceId)).size;
  return { activeProjects, totalSpent, completedOrders, uniqueFreelances };
}

export function computeAgencyStats(state: PlatformDataState, agencyId: string) {
  const agencyOrders = state.orders.filter(o => o.agencyId === agencyId);
  const totalCA = agencyOrders.filter(o => o.status !== "annule").reduce((s, o) => s + o.amount, 0);
  const activeProjects = state.agencyProjects.filter(p => ["en_cours", "conception", "actif"].includes(p.status)).length;
  const totalMembers = state.agencyMembers.length;
  const activeOrderCount = agencyOrders.filter(o => ["en_cours", "en_attente", "revision"].includes(o.status)).length;
  const completedOrderCount = agencyOrders.filter(o => o.status === "termine").length;
  const totalNonCancelled = agencyOrders.filter(o => o.status !== "annule").length;
  const satisfaction = totalNonCancelled > 0 ? Math.round((completedOrderCount / totalNonCancelled) * 100) : 0;
  const avgOccupation = state.agencyMembers.length > 0 ? Math.round(state.agencyMembers.reduce((s, m) => s + m.occupation, 0) / state.agencyMembers.length) : 0;
  return { totalCA, activeProjects, totalMembers, activeOrderCount, satisfaction, avgOccupation };
}

export function computeAdminFinanceStats(state: PlatformDataState) {
  const completedTx = state.transactions.filter(t => t.status === "complete");
  const platformRevenue = completedTx.filter(t => t.type === "commission").reduce((s, t) => s + t.amount, 0);
  const escrowFunds = state.orders.filter(o => o.escrowStatus === "held").reduce((s, o) => s + o.amount, 0);
  const pendingWithdrawals = state.transactions.filter(t => t.type === "retrait" && t.status === "en_attente").reduce((s, t) => s + t.amount, 0);
  const totalRefunds = completedTx.filter(t => t.type === "remboursement").reduce((s, t) => s + t.amount, 0);
  const totalPayments = completedTx.filter(t => t.type === "paiement").reduce((s, t) => s + t.amount, 0);
  const subscriptionRevenue = completedTx.filter(t => t.type === "abonnement").reduce((s, t) => s + t.amount, 0);

  return { platformRevenue, escrowFunds, pendingWithdrawals, totalRefunds, totalPayments, subscriptionRevenue };
}

export function computeAdminAnalytics(state: PlatformDataState) {
  const totalUsers = state.users.length;
  const recentUsers = state.users.filter(u => u.registeredAt >= "2026-03-01").length;
  const completedOrders = state.orders.filter(o => o.status === "termine");
  const gmv = state.orders.filter(o => o.status !== "annule").reduce((s, o) => s + o.amount, 0);
  const avgOrderValue = completedOrders.length > 0 ? Math.round(completedOrders.reduce((s, o) => s + o.amount, 0) / completedOrders.length) : 0;
  const totalNonCancelled = state.orders.filter(o => o.status !== "annule").length;
  const conversionRate = totalUsers > 0 ? ((totalNonCancelled / totalUsers) * 100).toFixed(1) : "0";

  const revByCategory: Record<string, number> = {};
  state.orders.filter(o => o.status !== "annule").forEach(o => {
    revByCategory[o.category] = (revByCategory[o.category] || 0) + o.amount;
  });
  const revenueByCategory = Object.entries(revByCategory)
    .map(([category, revenue]) => ({ category, revenue, pct: gmv > 0 ? Math.round((revenue / gmv) * 100) : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const usersByCountry: Record<string, { flag: string; count: number; revenue: number }> = {};
  state.users.forEach(u => {
    if (!usersByCountry[u.country]) usersByCountry[u.country] = { flag: u.countryFlag, count: 0, revenue: 0 };
    usersByCountry[u.country].count++;
  });
  state.orders.filter(o => o.status !== "annule").forEach(o => {
    const freelance = state.users.find(u => u.id === o.freelanceId);
    if (freelance && usersByCountry[freelance.country]) {
      usersByCountry[freelance.country].revenue += o.amount;
    }
  });
  const topCountries = Object.entries(usersByCountry)
    .map(([country, d]) => ({ country, flag: d.flag, users: d.count, revenue: d.revenue }))
    .sort((a, b) => b.users - a.users);

  const registrations = [
    { day: "Lun", value: 3 }, { day: "Mar", value: 5 }, { day: "Mer", value: 4 },
    { day: "Jeu", value: 6 }, { day: "Ven", value: 8 }, { day: "Sam", value: 2 }, { day: "Dim", value: 1 },
  ];

  const visitMultiplier = 10;
  const funnel = [
    { step: "Visite site", value: totalUsers * visitMultiplier, pct: 100 },
    { step: "Inscription", value: totalUsers, pct: Math.round(100 / visitMultiplier) },
    { step: "Profil complété", value: state.users.filter(u => u.kyc >= 2).length, pct: +(state.users.filter(u => u.kyc >= 2).length / (totalUsers * visitMultiplier) * 100).toFixed(1) },
    { step: "Premier achat/service", value: totalNonCancelled, pct: +(totalNonCancelled / (totalUsers * visitMultiplier) * 100).toFixed(1) },
    { step: "Client récurrent", value: Math.round(totalNonCancelled * 0.36), pct: +(totalNonCancelled * 0.36 / (totalUsers * visitMultiplier) * 100).toFixed(1) },
  ];

  const retentionM1 = totalUsers > 0 ? Math.round((state.users.filter(u => u.lastLogin >= "2026-02-01").length / totalUsers) * 100) : 0;

  return { totalUsers, recentUsers, avgOrderValue, conversionRate, revenueByCategory, topCountries, registrations, funnel, retentionM1 };
}
