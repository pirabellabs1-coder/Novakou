/**
 * Dev Data Store — Server-side JSON file persistence for ALL entities.
 * Follows the same pattern as dev-store.ts (users).
 * Activated when DEV_MODE=true in .env.local
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "lib", "dev");

// ── Types ──────────────────────────────────────────────────────────────────

export interface StoredService {
  id: string;
  userId: string;
  slug: string;
  title: string;
  language: string;
  description: unknown;
  descriptionText: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  tags: string[];
  basePrice: number;
  deliveryDays: number;
  revisions: number;
  packages: {
    basic: PackageTier;
    standard: PackageTier;
    premium: PackageTier;
    features?: PackageFeature[];
  };
  options: StoredServiceOption[];
  expressEnabled: boolean;
  expressPrice: number;
  expressDaysReduction: number;
  instructionsRequired: boolean;
  instructionsContent: unknown;
  images: string[];
  mainImage: string;
  videoUrl: string;
  status: "brouillon" | "en_attente" | "actif" | "pause" | "refuse";
  refuseReason?: string;
  views: number;
  clicks: number;
  orderCount: number;
  revenue: number;
  rating: number;
  ratingCount: number;
  isBoosted: boolean;
  boostedUntil: string | null;
  boostTier: string | null;
  metaTitle: string;
  metaDescription: string;
  seoScore: number;
  faq: { question: string; answer: string }[];
  extras: { label: string; price: number }[];
  vendorName: string;
  vendorAvatar: string;
  vendorUsername: string;
  vendorCountry: string;
  vendorBadges: string[];
  vendorRating: number;
  vendorPlan: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageTier {
  name: string;
  price: number;
  deliveryDays: number;
  revisions: number;
  description: string;
  features?: string[];
}

export interface PackageFeature {
  id: string;
  label: string;
  includedInBasic: boolean;
  includedInStandard: boolean;
  includedInPremium: boolean;
}

export interface StoredServiceOption {
  id: string;
  title: string;
  description: string;
  extraPrice: number;
  extraDays: number;
  isRecommended: boolean;
  sortOrder: number;
  expressEnabled: boolean;
  expressPrice?: number;
  expressDaysReduction?: number;
}

export interface StoredOrder {
  id: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  clientCountry: string;
  freelanceId: string;
  status: "en_attente" | "en_cours" | "livre" | "revision" | "termine" | "annule" | "litige";
  amount: number;
  commission: number;
  packageType: "basic" | "standard" | "premium";
  requirements?: string;
  deadline: string;
  deliveredAt: string | null;
  completedAt: string | null;
  progress: number;
  revisionsLeft: number;
  messages: OrderMessage[];
  timeline: TimelineEvent[];
  files: OrderFile[];
  reviewed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderMessage {
  id: string;
  sender: "freelance" | "client";
  senderName: string;
  content: string;
  timestamp: string;
  type: "text" | "file" | "system";
  fileName?: string;
  fileSize?: string;
}

export interface TimelineEvent {
  id: string;
  type: "created" | "started" | "delivered" | "revision" | "completed" | "cancelled" | "message";
  title: string;
  description: string;
  timestamp: string;
}

export interface OrderFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: "freelance" | "client";
  uploadedAt: string;
  url: string;
}

export interface StoredTransaction {
  id: string;
  userId: string;
  type: "vente" | "retrait" | "commission" | "remboursement" | "bonus" | "boost";
  description: string;
  amount: number;
  status: "complete" | "en_attente" | "echoue";
  date: string;
  orderId?: string;
  method?: string;
}

export interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "message" | "payment" | "system" | "service" | "boost";
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface StoredBoost {
  id: string;
  serviceId: string;
  userId: string;
  tier: "standard" | "premium" | "ultime";
  price: number;
  startedAt: string;
  expiresAt: string;
  viewsGenerated: number;
  clicksGenerated: number;
  ordersGenerated: number;
}

export interface StoredProfile {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  photo: string;
  coverPhoto: string;
  title: string;
  bio: string;
  city: string;
  country: string;
  hourlyRate: number;
  skills: { name: string; level: "debutant" | "intermediaire" | "expert" }[];
  languages: { name: string; level: string }[];
  education: { title: string; school: string; year: string; type: "diplome" | "certificat" | "formation" }[];
  links: { linkedin: string; github: string; portfolio: string; behance: string };
  completionPercent: number;
  badges: string[];
  availability: { day: number; dayName: string; available: boolean; startTime: string; endTime: string }[];
  vacationMode: boolean;
}

export interface StoredProject {
  id: string;
  clientId: string;
  clientName: string;
  clientCountry: string;
  clientRating: number;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  urgency: "normale" | "urgente" | "tres_urgente";
  contractType: "ponctuel" | "long_terme" | "recurrent";
  skills: string[];
  proposals: number;
  status: "ouvert" | "pourvu" | "ferme";
  postedAt: string;
}

export interface StoredCandidature {
  id: string;
  projectId: string;
  projectTitle: string;
  clientName: string;
  freelanceId: string;
  motivation: string;
  proposedPrice: number;
  deliveryDays: number;
  status: "en_attente" | "vue" | "acceptee" | "refusee";
  submittedAt: string;
}

export interface StoredOffre {
  id: string;
  freelanceId: string;
  client: string;
  clientEmail: string;
  title: string;
  amount: number;
  delay: string;
  revisions: number;
  description: string;
  validityDays: number;
  status: "en_attente" | "vue" | "acceptee" | "refusee" | "expiree";
  sentAt: string;
  expiresAt: string;
}

export interface StoredConversation {
  id: string;
  participants: string[];
  contactName: string;
  contactAvatar: string;
  contactRole: "client" | "agence" | "support";
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
  orderId?: string;
  messages: ChatMsg[];
}

export interface ChatMsg {
  id: string;
  senderId: string;
  sender: "me" | "them";
  content: string;
  timestamp: string;
  type: "text" | "image" | "file";
  fileName?: string;
  fileSize?: string;
  read: boolean;
}

export interface StoredReview {
  id: string;
  orderId: string;
  serviceId: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  clientCountry: string;
  freelanceId: string;
  serviceTitle: string;
  qualite: number;
  communication: number;
  delai: number;
  rating: number;
  comment: string;
  reply: string | null;
  repliedAt: string | null;
  helpful: number;
  reported: boolean;
  createdAt: string;
}

// ── File Helpers ──────────────────────────────────────────────────────────

function ensureDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function readJson<T>(filename: string, defaultValue: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      writeJson(filename, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function writeJson<T>(filename: string, data: T): void {
  try {
    ensureDir();
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // ignore write errors in dev
  }
}

// ── Slug Generator ──────────────────────────────────────────────────────────

function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}-${Date.now().toString(36)}`;
}

// ── Category Mapping ──────────────────────────────────────────────────────

const CATEGORY_MAP: Record<string, { name: string; slug: string; subs: Record<string, string> }> = {
  "cat-dev-web": { name: "Développement Web", slug: "developpement-web", subs: { "sub-frontend": "Frontend", "sub-backend": "Backend", "sub-fullstack": "Full-Stack", "sub-cms": "CMS/WordPress", "sub-ecommerce": "E-commerce" } },
  "cat-design": { name: "Design & Graphisme", slug: "design-graphisme", subs: { "sub-logo": "Logo & Identité", "sub-ui-ux": "UI/UX Design", "sub-illustration": "Illustration", "sub-print": "Print", "sub-motion": "Motion Design" } },
  "cat-redaction": { name: "Rédaction & Contenu", slug: "redaction-contenu", subs: { "sub-redaction-web": "Rédaction Web", "sub-copywriting": "Copywriting", "sub-traduction": "Traduction", "sub-transcription": "Transcription" } },
  "cat-marketing": { name: "Marketing Digital", slug: "marketing-digital", subs: { "sub-seo": "SEO", "sub-social-media": "Social Media", "sub-email-marketing": "Email Marketing", "sub-pub": "Publicité" } },
  "cat-video": { name: "Vidéo & Animation", slug: "video-animation", subs: { "sub-montage": "Montage Vidéo", "sub-animation-2d": "Animation 2D", "sub-animation-3d": "Animation 3D", "sub-motion-graphics": "Motion Graphics" } },
  "cat-formation": { name: "Formation & Coaching", slug: "formation-coaching", subs: { "sub-dev-formation": "Développement", "sub-design-formation": "Design", "sub-marketing-formation": "Marketing", "sub-business": "Business" } },
};

export function getCategoryName(id: string): string {
  return CATEGORY_MAP[id]?.name ?? id;
}

export function getSubCategoryName(catId: string, subId: string): string {
  return CATEGORY_MAP[catId]?.subs[subId] ?? subId;
}

// ── Service Store ──────────────────────────────────────────────────────────

const SERVICES_FILE = "services.json";

function getDefaultServices(): StoredService[] {
  return [];
}

function createSeedService(
  id: string, userId: string, title: string, catId: string, subId: string,
  price: number, days: number, status: StoredService["status"],
  views: number, orders: number, revenue: number, image: string
): StoredService {
  return {
    id,
    userId,
    slug: generateSlug(title),
    title,
    language: "fr",
    description: { type: "markdown", text: `Description détaillée de ${title}. Ce service est proposé par un freelance expérimenté sur FreelanceHigh.` },
    descriptionText: `Description détaillée de ${title}`,
    categoryId: catId,
    categoryName: getCategoryName(catId),
    subCategoryId: subId,
    subCategoryName: getSubCategoryName(catId, subId),
    tags: title.toLowerCase().split(/\s+/).filter(t => t.length > 2).slice(0, 5),
    basePrice: price,
    deliveryDays: days,
    revisions: 2,
    packages: {
      basic: { name: "Basique", price, deliveryDays: days + 2, revisions: 1, description: `Version basique de ${title}` },
      standard: { name: "Standard", price: Math.round(price * 1.8), deliveryDays: days, revisions: 3, description: `Version complète de ${title}` },
      premium: { name: "Premium", price: Math.round(price * 3), deliveryDays: Math.max(1, days - 1), revisions: 5, description: `Version premium all-inclusive de ${title}` },
    },
    options: [],
    expressEnabled: false,
    expressPrice: 0,
    expressDaysReduction: 0,
    instructionsRequired: false,
    instructionsContent: null,
    images: [image],
    mainImage: image,
    videoUrl: "",
    status,
    views,
    clicks: Math.round(views * 0.05),
    orderCount: orders,
    revenue,
    rating: orders > 0 ? 4.5 + Math.random() * 0.5 : 0,
    ratingCount: orders > 0 ? Math.max(1, Math.round(orders * 0.7)) : 0,
    isBoosted: false,
    boostedUntil: null,
    boostTier: null,
    metaTitle: title,
    metaDescription: `${title} - Service professionnel sur FreelanceHigh`,
    seoScore: Math.floor(40 + Math.random() * 40),
    faq: [],
    extras: [],
    vendorName: "Gildas Lissanon",
    vendorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    vendorUsername: "gildas-dev",
    vendorCountry: "CI",
    vendorBadges: ["Vérifié", "Pro"],
    vendorRating: 4.8,
    vendorPlan: "pro",
    createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const serviceStore = {
  getAll(): StoredService[] {
    return readJson<StoredService[]>(SERVICES_FILE, getDefaultServices());
  },

  getByUser(userId: string): StoredService[] {
    return this.getAll().filter((s) => s.userId === userId);
  },

  getActive(): StoredService[] {
    return this.getAll().filter((s) => s.status === "actif" || s.status === "en_attente");
  },

  getFeedServices(): StoredService[] {
    return this.getAll().filter((s) => s.status === "actif");
  },

  getById(id: string): StoredService | null {
    return this.getAll().find((s) => s.id === id) ?? null;
  },

  create(data: Omit<StoredService, "id" | "slug" | "createdAt" | "updatedAt" | "views" | "clicks" | "orderCount" | "revenue" | "rating" | "ratingCount" | "seoScore">): StoredService {
    const services = this.getAll();
    const service: StoredService = {
      ...data,
      id: `svc_${Date.now().toString(36)}`,
      slug: generateSlug(data.title),
      views: 0,
      clicks: 0,
      orderCount: 0,
      revenue: 0,
      rating: 0,
      ratingCount: 0,
      seoScore: calculateSeoScore(data),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    services.unshift(service);
    writeJson(SERVICES_FILE, services);
    return service;
  },

  update(id: string, updates: Partial<StoredService>): StoredService | null {
    const services = this.getAll();
    const idx = services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    services[idx] = { ...services[idx], ...updates, updatedAt: new Date().toISOString() };
    if (updates.title || updates.metaTitle || updates.metaDescription || updates.tags) {
      services[idx].seoScore = calculateSeoScore(services[idx]);
    }
    writeJson(SERVICES_FILE, services);
    return services[idx];
  },

  delete(id: string): boolean {
    const services = this.getAll();
    const filtered = services.filter((s) => s.id !== id);
    if (filtered.length === services.length) return false;
    writeJson(SERVICES_FILE, filtered);
    return true;
  },

  toggleStatus(id: string): StoredService | null {
    const service = this.getById(id);
    if (!service) return null;
    const newStatus = service.status === "actif" ? "pause" : "actif";
    return this.update(id, { status: newStatus });
  },

  incrementViews(id: string): void {
    const services = this.getAll();
    const idx = services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      services[idx].views += 1;
      writeJson(SERVICES_FILE, services);
    }
  },

  incrementClicks(id: string): void {
    const services = this.getAll();
    const idx = services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      services[idx].clicks += 1;
      writeJson(SERVICES_FILE, services);
    }
  },
};

// ── SEO Score Calculator ──────────────────────────────────────────────────

function calculateSeoScore(service: Partial<StoredService>): number {
  let score = 0;

  // Title: 20 points
  const title = service.metaTitle || service.title || "";
  if (title.length >= 30 && title.length <= 60) score += 20;
  else if (title.length >= 10) score += 10;

  // Description: 20 points
  const desc = service.metaDescription || "";
  if (desc.length >= 120 && desc.length <= 160) score += 20;
  else if (desc.length >= 50) score += 10;

  // Tags: 15 points
  const tags = service.tags || [];
  if (tags.length >= 5) score += 15;
  else if (tags.length >= 3) score += 10;
  else if (tags.length >= 1) score += 5;

  // Images: 15 points
  const images = service.images || [];
  if (images.length >= 3) score += 15;
  else if (images.length >= 1) score += 8;

  // Description text length: 15 points
  const descText = service.descriptionText || "";
  if (descText.length >= 300) score += 15;
  else if (descText.length >= 100) score += 8;

  // FAQ: 10 points
  const faq = service.faq || [];
  if (faq.length >= 3) score += 10;
  else if (faq.length >= 1) score += 5;

  // Packages complete: 5 points
  if (service.packages?.basic && service.packages?.standard && service.packages?.premium) score += 5;

  return Math.min(100, score);
}

// ── Order Store ──────────────────────────────────────────────────────────

const ORDERS_FILE = "orders.json";

function getDefaultOrders(): StoredOrder[] {
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getDefaultOrdersLegacy(): StoredOrder[] {
  const now = new Date().toISOString();
  return [
    {
      id: "ORD-1024", serviceId: "s5", serviceTitle: "Design Dashboard SaaS", category: "UI/UX Design",
      clientId: "dev-client-1", clientName: "TechCorp Inc.", clientAvatar: "TC", clientCountry: "FR",
      freelanceId: "dev-freelance-1", status: "en_cours", amount: 850, commission: 127.5,
      packageType: "premium", deadline: "2026-03-10", deliveredAt: null, completedAt: null,
      progress: 65, revisionsLeft: 3,
      messages: [
        { id: "m1", sender: "client", senderName: "TechCorp Inc.", content: "Bonjour ! On aimerait un dashboard moderne pour notre SaaS B2B.", timestamp: "2026-02-15T10:00:00", type: "text" },
        { id: "m2", sender: "freelance", senderName: "Vous", content: "Parfait ! J'ai bien noté vos besoins.", timestamp: "2026-02-15T10:30:00", type: "text" },
      ],
      timeline: [
        { id: "t1", type: "created", title: "Commande créée", description: "Forfait Premium - Design Dashboard SaaS", timestamp: "2026-02-15T09:00:00" },
        { id: "t2", type: "started", title: "Travail démarré", description: "Vous avez commencé à travailler", timestamp: "2026-02-15T10:30:00" },
      ],
      files: [
        { id: "f1", name: "brief-dashboard.pdf", size: "1.2 MB", type: "pdf", uploadedBy: "client", uploadedAt: "2026-02-15T09:15:00", url: "#" },
      ],
      createdAt: "2026-02-15T09:00:00", updatedAt: now,
    },
    {
      id: "ORD-1019", serviceId: "s4", serviceTitle: "API Backend Node.js", category: "Développement",
      clientId: "dev-client-1", clientName: "Lamine Diallo", clientAvatar: "LD", clientCountry: "SN",
      freelanceId: "dev-freelance-1", status: "livre", amount: 1200, commission: 180,
      packageType: "premium", deadline: "2026-02-20", deliveredAt: "2026-02-18", completedAt: null,
      progress: 100, revisionsLeft: 2,
      messages: [
        { id: "m1", sender: "client", senderName: "Lamine Diallo", content: "J'ai besoin d'une API pour mon app de livraison.", timestamp: "2026-01-20T08:00:00", type: "text" },
        { id: "m2", sender: "freelance", senderName: "Vous", content: "Voici le code source complet.", timestamp: "2026-02-18T16:00:00", type: "text" },
      ],
      timeline: [
        { id: "t1", type: "created", title: "Commande créée", description: "Forfait Premium - API Backend", timestamp: "2026-01-20T08:00:00" },
        { id: "t2", type: "started", title: "Travail démarré", description: "Développement en cours", timestamp: "2026-01-21T09:00:00" },
        { id: "t3", type: "delivered", title: "Livraison effectuée", description: "Code source + documentation livrés", timestamp: "2026-02-18T16:00:00" },
      ],
      files: [
        { id: "f1", name: "api-source-code.zip", size: "8.5 MB", type: "zip", uploadedBy: "freelance", uploadedAt: "2026-02-18T16:00:00", url: "#" },
      ],
      createdAt: "2026-01-20T08:00:00", updatedAt: now,
    },
    {
      id: "ORD-1016", serviceId: "s7", serviceTitle: "Audit SEO E-commerce", category: "Marketing Digital",
      clientId: "dev-client-1", clientName: "Auto-Focus SARL", clientAvatar: "AF", clientCountry: "CI",
      freelanceId: "dev-freelance-1", status: "en_attente", amount: 450, commission: 67.5,
      packageType: "standard", deadline: "2026-03-15", deliveredAt: null, completedAt: null,
      progress: 0, revisionsLeft: 1,
      messages: [
        { id: "m1", sender: "client", senderName: "Auto-Focus SARL", content: "Nous aimerions un audit SEO complet.", timestamp: "2026-02-28T11:00:00", type: "text" },
      ],
      timeline: [
        { id: "t1", type: "created", title: "Commande créée", description: "Forfait Standard - Audit SEO", timestamp: "2026-02-28T11:00:00" },
      ],
      files: [],
      createdAt: "2026-02-28T11:00:00", updatedAt: now,
    },
    {
      id: "ORD-1012", serviceId: "s1", serviceTitle: "Logo Startup FinTech", category: "Identité visuelle",
      clientId: "dev-client-1", clientName: "Moussa Keita", clientAvatar: "MK", clientCountry: "ML",
      freelanceId: "dev-freelance-1", status: "revision", amount: 150, commission: 22.5,
      packageType: "premium", deadline: "2026-02-28", deliveredAt: null, completedAt: null,
      progress: 80, revisionsLeft: 2,
      messages: [
        { id: "m1", sender: "client", senderName: "Moussa Keita", content: "J'aimerais un logo pour ma startup FinTech.", timestamp: "2026-02-10T14:00:00", type: "text" },
        { id: "m2", sender: "freelance", senderName: "Vous", content: "Voici 3 propositions de logo.", timestamp: "2026-02-14T10:00:00", type: "text" },
        { id: "m3", sender: "client", senderName: "Moussa Keita", content: "J'aime le concept 2, couleurs plus vives svp.", timestamp: "2026-02-15T08:00:00", type: "text" },
      ],
      timeline: [
        { id: "t1", type: "created", title: "Commande créée", description: "Forfait Premium - Logo FinTech", timestamp: "2026-02-10T14:00:00" },
        { id: "t2", type: "started", title: "Travail démarré", description: "Recherche et brainstorming", timestamp: "2026-02-11T09:00:00" },
        { id: "t3", type: "delivered", title: "Première livraison", description: "3 concepts envoyés", timestamp: "2026-02-14T10:00:00" },
        { id: "t4", type: "revision", title: "Révision demandée", description: "Ajustement couleurs", timestamp: "2026-02-15T08:00:00" },
      ],
      files: [
        { id: "f1", name: "logos-v1.pdf", size: "5.1 MB", type: "pdf", uploadedBy: "freelance", uploadedAt: "2026-02-14T10:00:00", url: "#" },
      ],
      createdAt: "2026-02-10T14:00:00", updatedAt: now,
    },
    {
      id: "ORD-1008", serviceId: "s2", serviceTitle: "Pack 5 Articles Blog", category: "Contenu",
      clientId: "dev-client-1", clientName: "Marie Dupont", clientAvatar: "MD", clientCountry: "FR",
      freelanceId: "dev-freelance-1", status: "termine", amount: 300, commission: 45,
      packageType: "standard", deadline: "2026-01-20", deliveredAt: "2026-01-18", completedAt: "2026-01-19",
      progress: 100, revisionsLeft: 0,
      messages: [
        { id: "m1", sender: "client", senderName: "Marie Dupont", content: "Merci pour ce travail excellent !", timestamp: "2026-01-19T11:00:00", type: "text" },
      ],
      timeline: [
        { id: "t1", type: "created", title: "Commande créée", description: "Pack Articles", timestamp: "2026-01-05T10:00:00" },
        { id: "t2", type: "started", title: "Travail démarré", description: "Rédaction en cours", timestamp: "2026-01-06T09:00:00" },
        { id: "t3", type: "delivered", title: "Livraison effectuée", description: "5 articles livrés", timestamp: "2026-01-18T15:00:00" },
        { id: "t4", type: "completed", title: "Commande terminée", description: "Client satisfait", timestamp: "2026-01-19T11:00:00" },
      ],
      files: [
        { id: "f1", name: "articles-blog-pack.zip", size: "1.8 MB", type: "zip", uploadedBy: "freelance", uploadedAt: "2026-01-18T15:00:00", url: "#" },
      ],
      createdAt: "2026-01-05T10:00:00", updatedAt: now,
    },
    {
      id: "ORD-1003", serviceId: "s4", serviceTitle: "Application Mobile React Native", category: "Développement",
      clientId: "dev-client-1", clientName: "Ibrahim Traore", clientAvatar: "IT", clientCountry: "BF",
      freelanceId: "dev-freelance-1", status: "annule", amount: 700, commission: 105,
      packageType: "premium", deadline: "2026-01-15", deliveredAt: null, completedAt: null,
      progress: 25, revisionsLeft: 5,
      messages: [
        { id: "m1", sender: "client", senderName: "Ibrahim Traore", content: "Je dois annuler, changement de budget.", timestamp: "2025-12-28T10:00:00", type: "text" },
      ],
      timeline: [
        { id: "t1", type: "created", title: "Commande créée", description: "App Mobile", timestamp: "2025-12-15T10:00:00" },
        { id: "t2", type: "started", title: "Travail démarré", description: "Architecture", timestamp: "2025-12-16T09:00:00" },
        { id: "t3", type: "cancelled", title: "Commande annulée", description: "Annulée par le client", timestamp: "2025-12-28T10:00:00" },
      ],
      files: [],
      createdAt: "2025-12-15T10:00:00", updatedAt: now,
    },
  ];
}

export const orderStore = {
  getAll(): StoredOrder[] {
    return readJson<StoredOrder[]>(ORDERS_FILE, getDefaultOrders());
  },

  getByFreelance(userId: string): StoredOrder[] {
    return this.getAll().filter((o) => o.freelanceId === userId);
  },

  getByClient(userId: string): StoredOrder[] {
    return this.getAll().filter((o) => o.clientId === userId);
  },

  getById(id: string): StoredOrder | null {
    return this.getAll().find((o) => o.id === id) ?? null;
  },

  update(id: string, updates: Partial<StoredOrder>): StoredOrder | null {
    const orders = this.getAll();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx] = { ...orders[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJson(ORDERS_FILE, orders);
    return orders[idx];
  },

  addMessage(orderId: string, message: Omit<OrderMessage, "id">): StoredOrder | null {
    const orders = this.getAll();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    const msg: OrderMessage = { ...message, id: `m${Date.now()}` };
    orders[idx].messages.push(msg);
    orders[idx].updatedAt = new Date().toISOString();
    writeJson(ORDERS_FILE, orders);
    return orders[idx];
  },

  addFile(orderId: string, file: Omit<OrderFile, "id">): StoredOrder | null {
    const orders = this.getAll();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    const f: OrderFile = { ...file, id: `f${Date.now()}` };
    orders[idx].files.push(f);
    orders[idx].updatedAt = new Date().toISOString();
    writeJson(ORDERS_FILE, orders);
    return orders[idx];
  },

  deliver(orderId: string, message: string, files: Omit<OrderFile, "id">[]): StoredOrder | null {
    const orders = this.getAll();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    orders[idx].status = "livre";
    orders[idx].progress = 100;
    orders[idx].deliveredAt = now;
    orders[idx].updatedAt = now;
    orders[idx].timeline.push({
      id: `t${Date.now()}`, type: "delivered",
      title: "Livraison effectuée", description: message || "Commande livrée",
      timestamp: now,
    });
    if (message) {
      orders[idx].messages.push({
        id: `m${Date.now()}`, sender: "freelance", senderName: "Vous",
        content: message, timestamp: now, type: "text",
      });
    }
    for (const file of files) {
      orders[idx].files.push({ ...file, id: `f${Date.now()}${Math.random().toString(36).slice(2, 4)}` });
    }
    writeJson(ORDERS_FILE, orders);

    // Update service stats
    const service = serviceStore.getById(orders[idx].serviceId);
    if (service) {
      serviceStore.update(service.id, { orderCount: service.orderCount + 1 });
    }

    return orders[idx];
  },

  accept(orderId: string): StoredOrder | null {
    const orders = this.getAll();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    orders[idx].status = "en_cours";
    orders[idx].progress = 10;
    orders[idx].updatedAt = now;
    orders[idx].timeline.push({
      id: `t${Date.now()}`, type: "started",
      title: "Travail démarré", description: "Vous avez commencé à travailler",
      timestamp: now,
    });
    writeJson(ORDERS_FILE, orders);
    return orders[idx];
  },
};

// ── Transaction Store ──────────────────────────────────────────────────────

const TRANSACTIONS_FILE = "transactions.json";

function getDefaultTransactions(): StoredTransaction[] {
  return [];
}

export const transactionStore = {
  getAll(): StoredTransaction[] {
    return readJson<StoredTransaction[]>(TRANSACTIONS_FILE, getDefaultTransactions());
  },

  getByUser(userId: string): StoredTransaction[] {
    return this.getAll().filter((t) => t.userId === userId);
  },

  add(tx: Omit<StoredTransaction, "id">): StoredTransaction {
    const transactions = this.getAll();
    const newTx: StoredTransaction = { ...tx, id: `tx_${Date.now().toString(36)}` };
    transactions.unshift(newTx);
    writeJson(TRANSACTIONS_FILE, transactions);
    return newTx;
  },

  getSummary(userId: string): { available: number; pending: number; totalEarned: number; commissionThisMonth: number } {
    const txs = this.getByUser(userId);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

    let available = 0;
    let pending = 0;
    let totalEarned = 0;
    let commissionThisMonth = 0;

    for (const tx of txs) {
      if (tx.type === "vente" && tx.status === "complete") {
        available += tx.amount;
        totalEarned += tx.amount;
      } else if (tx.type === "vente" && tx.status === "en_attente") {
        pending += tx.amount;
      } else if (tx.type === "commission" && tx.status === "complete") {
        available += tx.amount; // negative
        if (tx.date >= monthStart) commissionThisMonth += Math.abs(tx.amount);
      } else if (tx.type === "retrait" && tx.status === "complete") {
        available += tx.amount; // negative
      } else if (tx.type === "bonus" && tx.status === "complete") {
        available += tx.amount;
        totalEarned += tx.amount;
      }
    }

    return { available: Math.max(0, available), pending, totalEarned, commissionThisMonth };
  },
};

// ── Notification Store ──────────────────────────────────────────────────────

const NOTIFICATIONS_FILE = "notifications.json";

function getDefaultNotifications(): StoredNotification[] {
  return [];
}

export const notificationStore = {
  getAll(): StoredNotification[] {
    return readJson<StoredNotification[]>(NOTIFICATIONS_FILE, getDefaultNotifications());
  },

  getByUser(userId: string): StoredNotification[] {
    return this.getAll().filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getUnreadCount(userId: string): number {
    return this.getByUser(userId).filter((n) => !n.read).length;
  },

  add(notification: Omit<StoredNotification, "id" | "createdAt">): StoredNotification {
    const notifications = this.getAll();
    const n: StoredNotification = {
      ...notification,
      id: `notif_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    notifications.unshift(n);
    writeJson(NOTIFICATIONS_FILE, notifications);
    return n;
  },

  markRead(id: string): void {
    const notifications = this.getAll();
    const idx = notifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notifications[idx].read = true;
      writeJson(NOTIFICATIONS_FILE, notifications);
    }
  },

  markAllRead(userId: string): void {
    const notifications = this.getAll();
    for (const n of notifications) {
      if (n.userId === userId) n.read = true;
    }
    writeJson(NOTIFICATIONS_FILE, notifications);
  },
};

// ── Boost Store ──────────────────────────────────────────────────────────

const BOOSTS_FILE = "boosts.json";

export const BOOST_TIERS = {
  standard: { name: "Boost Standard", duration: 3, price: 9.99, estimatedViews: 500 },
  premium: { name: "Boost Premium", duration: 7, price: 24.99, estimatedViews: 1500 },
  ultime: { name: "Boost Ultime", duration: 30, price: 79.99, estimatedViews: 5000 },
};

export const boostStore = {
  getAll(): StoredBoost[] {
    return readJson<StoredBoost[]>(BOOSTS_FILE, []);
  },

  getByService(serviceId: string): StoredBoost[] {
    return this.getAll().filter((b) => b.serviceId === serviceId);
  },

  getByUser(userId: string): StoredBoost[] {
    return this.getAll().filter((b) => b.userId === userId);
  },

  getActiveBoost(serviceId: string): StoredBoost | null {
    const boosts = this.getByService(serviceId);
    const now = new Date();
    return boosts.find((b) => new Date(b.expiresAt) > now) ?? null;
  },

  activate(serviceId: string, userId: string, tier: keyof typeof BOOST_TIERS): StoredBoost {
    const boosts = this.getAll();
    const tierConfig = BOOST_TIERS[tier];
    const now = new Date();
    const expires = new Date(now.getTime() + tierConfig.duration * 24 * 60 * 60 * 1000);

    const boost: StoredBoost = {
      id: `boost_${Date.now().toString(36)}`,
      serviceId,
      userId,
      tier,
      price: tierConfig.price,
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      viewsGenerated: 0,
      clicksGenerated: 0,
      ordersGenerated: 0,
    };

    boosts.push(boost);
    writeJson(BOOSTS_FILE, boosts);

    // Update service
    serviceStore.update(serviceId, {
      isBoosted: true,
      boostedUntil: expires.toISOString(),
      boostTier: tier,
    });

    // Create transaction
    transactionStore.add({
      userId,
      type: "boost",
      description: `${tierConfig.name} - ${tierConfig.duration} jours`,
      amount: -tierConfig.price,
      status: "complete",
      date: now.toISOString().slice(0, 10),
    });

    // Create notification
    notificationStore.add({
      userId,
      title: "Boost activé",
      message: `${tierConfig.name} activé pour ${tierConfig.duration} jours`,
      type: "boost",
      read: false,
      link: "/dashboard/services",
    });

    return boost;
  },
};

// ── Profile Store ──────────────────────────────────────────────────────────

const PROFILES_FILE = "profiles.json";

function getDefaultProfiles(): Record<string, StoredProfile> {
  return {
    "dev-freelance-1": {
      userId: "dev-freelance-1",
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      photo: "",
      coverPhoto: "",
      title: "",
      bio: "",
      city: "",
      country: "",
      hourlyRate: 0,
      skills: [],
      languages: [],
      education: [],
      links: { linkedin: "", github: "", portfolio: "", behance: "" },
      completionPercent: 0,
      badges: [],
      availability: [
        { day: 0, dayName: "Lundi", available: true, startTime: "09:00", endTime: "18:00" },
        { day: 1, dayName: "Mardi", available: true, startTime: "09:00", endTime: "18:00" },
        { day: 2, dayName: "Mercredi", available: true, startTime: "09:00", endTime: "18:00" },
        { day: 3, dayName: "Jeudi", available: true, startTime: "09:00", endTime: "18:00" },
        { day: 4, dayName: "Vendredi", available: true, startTime: "09:00", endTime: "16:00" },
        { day: 5, dayName: "Samedi", available: false, startTime: "10:00", endTime: "13:00" },
        { day: 6, dayName: "Dimanche", available: false, startTime: "10:00", endTime: "13:00" },
      ],
      vacationMode: false,
    },
  };
}

export const profileStore = {
  get(userId: string): StoredProfile | null {
    const profiles = readJson<Record<string, StoredProfile>>(PROFILES_FILE, getDefaultProfiles());
    return profiles[userId] ?? null;
  },

  update(userId: string, updates: Partial<StoredProfile>): StoredProfile {
    const profiles = readJson<Record<string, StoredProfile>>(PROFILES_FILE, getDefaultProfiles());
    if (!profiles[userId]) {
      profiles[userId] = { ...getDefaultProfiles()["dev-freelance-1"], userId, ...updates };
    } else {
      profiles[userId] = { ...profiles[userId], ...updates };
    }

    // Recalculate completion
    const p = profiles[userId];
    let filled = 0;
    const total = 10;
    if (p.firstName && p.lastName) filled++;
    if (p.photo) filled++;
    if (p.title) filled++;
    if (p.bio && p.bio.length > 20) filled++;
    if (p.skills.length >= 3) filled++;
    if (p.languages.length >= 1) filled++;
    if (p.links.linkedin || p.links.github || p.links.portfolio) filled++;
    if (p.hourlyRate > 0) filled++;
    if (p.city && p.country) filled++;
    if (p.phone) filled++;
    profiles[userId].completionPercent = Math.round((filled / total) * 100);

    writeJson(PROFILES_FILE, profiles);
    return profiles[userId];
  },
};

// ── Stats Calculator ──────────────────────────────────────────────────────

export function calculateStats(userId: string) {
  const services = serviceStore.getByUser(userId);
  const orders = orderStore.getByFreelance(userId);
  const transactions = transactionStore.getByUser(userId);
  const summary = transactionStore.getSummary(userId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Revenue by month (last 12 months)
  const monthlyRevenue: { month: string; revenue: number; orders: number }[] = [];
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthTxs = transactions.filter((t) => t.type === "vente" && t.status === "complete" && t.date.startsWith(monthKey));
    const monthOrders = orders.filter((o) => o.status === "termine" && o.completedAt?.startsWith(monthKey));
    monthlyRevenue.push({
      month: months[d.getMonth()],
      revenue: monthTxs.reduce((sum, t) => sum + t.amount, 0),
      orders: monthOrders.length,
    });
  }

  // Active orders
  const activeOrders = orders.filter((o) => ["en_attente", "en_cours", "revision"].includes(o.status));
  const completedOrders = orders.filter((o) => o.status === "termine");

  // Reviews
  const reviews = reviewStore.getByFreelance(userId);
  const totalReviews = reviews.length;
  const avgQualite = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.qualite, 0) / totalReviews : 0;
  const avgCommunication = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.communication, 0) / totalReviews : 0;
  const avgDelai = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.delai, 0) / totalReviews : 0;

  // Average rating from reviews (not services)
  const avgRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Views this month
  const viewsThisMonth = services.reduce((sum, s) => sum + s.views, 0);

  // Conversion rate
  const totalClicks = services.reduce((sum, s) => sum + s.clicks, 0);
  const totalOrders = services.reduce((sum, s) => sum + s.orderCount, 0);
  const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

  // Weekly orders (last 8 weeks from real orders)
  const weeklyOrders: { week: string; orders: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekOrders = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= weekStart && d < weekEnd;
    });
    weeklyOrders.push({ week: `S${8 - i}`, orders: weekOrders.length });
  }

  // Profile views (aggregate from service views, simulated daily)
  const totalProfileViews = services.reduce((sum, s) => sum + s.views, 0);
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const profileViews = dayNames.map((date, i) => ({
    date,
    views: Math.round((totalProfileViews / 7) * (0.6 + Math.sin(i * 0.9) * 0.4)),
  }));

  return {
    summary,
    monthlyRevenue,
    activeOrders: activeOrders.length,
    completedOrders: completedOrders.length,
    totalOrders: orders.length,
    avgRating: Math.round(avgRating * 10) / 10,
    viewsThisMonth,
    conversionRate: Math.round(conversionRate * 10) / 10,
    servicesCount: {
      total: services.length,
      active: services.filter((s) => s.status === "actif").length,
      paused: services.filter((s) => s.status === "pause").length,
      draft: services.filter((s) => s.status === "brouillon").length,
      pending: services.filter((s) => s.status === "en_attente").length,
    },
    revenueThisMonth: monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0,
    totalReviews,
    avgQualite: Math.round(avgQualite * 10) / 10,
    avgCommunication: Math.round(avgCommunication * 10) / 10,
    avgDelai: Math.round(avgDelai * 10) / 10,
    weeklyOrders,
    profileViews,
  };
}

// ── Review Store ──────────────────────────────────────────────────────────

const REVIEWS_FILE = "reviews.json";

function getDefaultReviews(): StoredReview[] {
  return [];
}

export const reviewStore = {
  getAll(): StoredReview[] {
    return readJson<StoredReview[]>(REVIEWS_FILE, getDefaultReviews());
  },

  getByFreelance(freelanceId: string): StoredReview[] {
    return this.getAll().filter((r) => r.freelanceId === freelanceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getByClient(clientId: string): StoredReview[] {
    return this.getAll().filter((r) => r.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getByService(serviceId: string): StoredReview[] {
    return this.getAll().filter((r) => r.serviceId === serviceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getByOrder(orderId: string): StoredReview | null {
    return this.getAll().find((r) => r.orderId === orderId) ?? null;
  },

  getById(id: string): StoredReview | null {
    return this.getAll().find((r) => r.id === id) ?? null;
  },

  create(data: {
    orderId: string;
    serviceId: string;
    clientId: string;
    clientName: string;
    clientAvatar: string;
    clientCountry: string;
    freelanceId: string;
    serviceTitle: string;
    qualite: number;
    communication: number;
    delai: number;
    comment: string;
  }): StoredReview {
    const reviews = this.getAll();
    const rating = Math.round(((data.qualite + data.communication + data.delai) / 3) * 10) / 10;

    const review: StoredReview = {
      id: `rev_${Date.now().toString(36)}`,
      ...data,
      rating,
      reply: null,
      repliedAt: null,
      helpful: 0,
      reported: false,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(review);
    writeJson(REVIEWS_FILE, reviews);

    // Mark order as reviewed
    orderStore.update(data.orderId, { reviewed: true });

    // Recalculate service rating
    const serviceReviews = this.getAll().filter((r) => r.serviceId === data.serviceId);
    const avgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
    serviceStore.update(data.serviceId, {
      rating: Math.round(avgRating * 10) / 10,
      ratingCount: serviceReviews.length,
    });

    // Create notification for freelance
    notificationStore.add({
      userId: data.freelanceId,
      title: "Nouvel avis reçu",
      message: `${data.clientName} a laissé un avis ${rating}/5 sur "${data.serviceTitle}"`,
      type: "order",
      read: false,
      link: "/dashboard/avis",
    });

    return review;
  },

  reply(reviewId: string, replyText: string): StoredReview | null {
    const reviews = this.getAll();
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;
    reviews[idx].reply = replyText;
    reviews[idx].repliedAt = new Date().toISOString();
    writeJson(REVIEWS_FILE, reviews);
    return reviews[idx];
  },

  report(reviewId: string): StoredReview | null {
    const reviews = this.getAll();
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;
    reviews[idx].reported = true;
    writeJson(REVIEWS_FILE, reviews);
    return reviews[idx];
  },

  markHelpful(reviewId: string): StoredReview | null {
    const reviews = this.getAll();
    const idx = reviews.findIndex((r) => r.id === reviewId);
    if (idx === -1) return null;
    reviews[idx].helpful += 1;
    writeJson(REVIEWS_FILE, reviews);
    return reviews[idx];
  },
};

// ── Conversation Store ──────────────────────────────────────────────────────

const CONVERSATIONS_FILE = "conversations.json";

function getDefaultConversations(): StoredConversation[] {
  return [];
}

export const conversationStore = {
  getAll(): StoredConversation[] {
    return readJson<StoredConversation[]>(CONVERSATIONS_FILE, getDefaultConversations());
  },

  getByUser(userId: string): StoredConversation[] {
    return this.getAll().filter((c) => c.participants.includes(userId));
  },

  getById(id: string): StoredConversation | null {
    return this.getAll().find((c) => c.id === id) ?? null;
  },

  sendMessage(convId: string, senderId: string, content: string, type: "text" | "image" | "file" = "text", fileName?: string, fileSize?: string): StoredConversation | null {
    const convs = this.getAll();
    const idx = convs.findIndex((c) => c.id === convId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const msg: ChatMsg = {
      id: `cm_${Date.now().toString(36)}`,
      senderId,
      sender: "me",
      content,
      timestamp: now,
      type,
      fileName,
      fileSize,
      read: true,
    };
    convs[idx].messages.push(msg);
    convs[idx].lastMessage = content;
    convs[idx].lastMessageTime = now;
    writeJson(CONVERSATIONS_FILE, convs);

    // Simulate auto-reply after 2 seconds (stored immediately for persistence)
    setTimeout(() => {
      const replies = [
        "Merci pour votre message, je vous réponds rapidement !",
        "Bien reçu, je regarde ça et je reviens vers vous.",
        "D'accord, c'est noté. Je m'en occupe.",
        "Parfait, merci pour ces précisions !",
        "Je comprends, laissez-moi vérifier et je vous tiens informé.",
      ];
      const autoReply: ChatMsg = {
        id: `cm_${(Date.now() + 1).toString(36)}`,
        senderId: "auto",
        sender: "them",
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: new Date().toISOString(),
        type: "text",
        read: false,
      };
      const currentConvs = this.getAll();
      const cIdx = currentConvs.findIndex((c) => c.id === convId);
      if (cIdx !== -1) {
        currentConvs[cIdx].messages.push(autoReply);
        currentConvs[cIdx].lastMessage = autoReply.content;
        currentConvs[cIdx].lastMessageTime = autoReply.timestamp;
        currentConvs[cIdx].unread += 1;
        writeJson(CONVERSATIONS_FILE, currentConvs);
      }
    }, 2000);

    return convs[idx];
  },

  markRead(convId: string): void {
    const convs = this.getAll();
    const idx = convs.findIndex((c) => c.id === convId);
    if (idx !== -1) {
      convs[idx].unread = 0;
      for (const m of convs[idx].messages) m.read = true;
      writeJson(CONVERSATIONS_FILE, convs);
    }
  },
};

// ── Project Store ──────────────────────────────────────────────────────────

const PROJECTS_FILE = "projects.json";

export const projectStore = {
  getAll(): StoredProject[] {
    return readJson<StoredProject[]>(PROJECTS_FILE, []);
  },

  getOpen(): StoredProject[] {
    return this.getAll().filter((p) => p.status === "ouvert");
  },

  getById(id: string): StoredProject | null {
    return this.getAll().find((p) => p.id === id) ?? null;
  },

  incrementProposals(id: string): void {
    const projects = this.getAll();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      projects[idx].proposals += 1;
      writeJson(PROJECTS_FILE, projects);
    }
  },
};

// ── Candidature Store ──────────────────────────────────────────────────────

const CANDIDATURES_FILE = "candidatures.json";

export const candidatureStore = {
  getAll(): StoredCandidature[] {
    return readJson<StoredCandidature[]>(CANDIDATURES_FILE, []);
  },

  getByFreelance(freelanceId: string): StoredCandidature[] {
    return this.getAll()
      .filter((c) => c.freelanceId === freelanceId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  create(data: Omit<StoredCandidature, "id" | "status" | "submittedAt">): StoredCandidature {
    const candidatures = this.getAll();
    const c: StoredCandidature = {
      ...data,
      id: `cand_${Date.now().toString(36)}`,
      status: "en_attente",
      submittedAt: new Date().toISOString(),
    };
    candidatures.unshift(c);
    writeJson(CANDIDATURES_FILE, candidatures);
    return c;
  },

  update(id: string, updates: Partial<StoredCandidature>): StoredCandidature | null {
    const candidatures = this.getAll();
    const idx = candidatures.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    candidatures[idx] = { ...candidatures[idx], ...updates };
    writeJson(CANDIDATURES_FILE, candidatures);
    return candidatures[idx];
  },
};

// ── Offre Store ──────────────────────────────────────────────────────────

const OFFRES_FILE = "offres.json";

export const offreStore = {
  getAll(): StoredOffre[] {
    return readJson<StoredOffre[]>(OFFRES_FILE, []);
  },

  getByFreelance(freelanceId: string): StoredOffre[] {
    return this.getAll()
      .filter((o) => o.freelanceId === freelanceId)
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  },

  create(data: Omit<StoredOffre, "id" | "status" | "sentAt" | "expiresAt">): StoredOffre {
    const offres = this.getAll();
    const now = new Date();
    const expires = new Date(now.getTime() + data.validityDays * 24 * 60 * 60 * 1000);
    const o: StoredOffre = {
      ...data,
      id: `off_${Date.now().toString(36)}`,
      status: "en_attente",
      sentAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    offres.unshift(o);
    writeJson(OFFRES_FILE, offres);
    return o;
  },

  update(id: string, updates: Partial<StoredOffre>): StoredOffre | null {
    const offres = this.getAll();
    const idx = offres.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    offres[idx] = { ...offres[idx], ...updates };
    writeJson(OFFRES_FILE, offres);
    return offres[idx];
  },

  delete(id: string): boolean {
    const offres = this.getAll();
    const filtered = offres.filter((o) => o.id !== id);
    if (filtered.length === offres.length) return false;
    writeJson(OFFRES_FILE, filtered);
    return true;
  },
};

// ── Export SEO score calculator for API use ──────────────────────────────

export { calculateSeoScore };
