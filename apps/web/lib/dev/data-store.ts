/**
 * Dev Data Store — Server-side JSON file persistence for ALL entities.
 * Follows the same pattern as dev-store.ts (users).
 * Activated when DEV_MODE=true in .env.local
 */

import fs from "fs";
import path from "path";

// Resolve DATA_DIR: try multiple paths for compatibility (local dev, Vercel serverless, monorepo root)
function resolveDataDir(): string {
  const candidates = [
    path.join(process.cwd(), "lib", "dev"),
    path.join(__dirname, "..", "..", "lib", "dev"),
    path.join(process.cwd(), "apps", "web", "lib", "dev"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  // Fallback: create at cwd path
  const fallback = candidates[0];
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
}

const DATA_DIR = resolveDataDir();

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
  status: "brouillon" | "en_attente" | "actif" | "vedette" | "pause" | "refuse";
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
  freelanceName?: string;
  status: "en_attente" | "en_cours" | "livre" | "revision" | "termine" | "annule" | "litige";
  amount: number;
  commission: number;
  packageType: "basic" | "standard" | "premium" | "custom";
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
  // Dispute fields (set when status === "litige")
  disputeStatus?: "ouvert" | "en_examen" | "resolu";
  disputeReason?: string;
  disputeVerdict?: "freelance" | "client" | "partiel" | null;
  disputeVerdictNote?: string | null;
  disputePartialPercent?: number | null;
  disputeResolvedAt?: string | null;
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
  type: "created" | "started" | "delivered" | "revision" | "completed" | "cancelled" | "message" | "dispute";
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
  status: "complete" | "en_attente" | "echoue" | "bloque";
  date: string;
  orderId?: string;
  method?: string;
}

export interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "message" | "payment" | "system" | "service" | "boost" | "offer" | "review" | "agency" | "course" | "product";
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
  portfolio?: { id: string; title: string; description: string; image: string; link?: string; skills: string[]; featured: boolean }[];
  team?: { id: string; name: string; role: string; avatar: string; skills: string[]; freelanceUsername?: string }[];
  caseStudies?: { id: string; title: string; description: string; image: string; category: string; keyResult?: string }[];
  workProcess?: { step: number; title: string; description: string }[];
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
  clientId?: string;
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
  type: "text" | "image" | "file" | "voice" | "call_audio" | "call_video" | "call_missed" | "system" | "offer";
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  fileType?: string;
  fileSizeBytes?: number;
  audioUrl?: string;
  audioDuration?: number;
  callDuration?: number;
  read: boolean;
  editedAt?: string;
  deletedAt?: string;
  linkPreviewData?: { title: string; description: string; image?: string; domain: string; url?: string }[];
  offerData?: {
    offerId: string;
    title: string;
    amount: number;
    delay: string;
    revisions: number;
    description: string;
    status: string;
    validityDays: number;
    expiresAt: string;
  };
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

// ── File Helpers (with in-memory cache for Vercel serverless) ─────────────

const IS_VERCEL = !!process.env.VERCEL;

// In-memory cache: on Vercel the filesystem is read-only, so we read seed
// files once and keep mutations in memory (lost between cold starts, which
// is acceptable for demo/dev mode).
const memoryCache = new Map<string, unknown>();
const mtimeCache = new Map<string, number>();

function ensureDir(): void {
  if (IS_VERCEL) return; // read-only filesystem
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}

function invalidateCache(filename: string): void {
  memoryCache.delete(filename);
}

function readJson<T>(filename: string, defaultValue: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      memoryCache.set(filename, defaultValue);
      mtimeCache.set(filename, 0);
      if (!IS_VERCEL) writeJson(filename, defaultValue);
      return defaultValue;
    }
    // Check if file was modified externally (compare mtime)
    const stat = fs.statSync(filePath);
    const fileMtime = stat.mtimeMs;
    const cachedMtime = mtimeCache.get(filename) ?? 0;
    if (memoryCache.has(filename) && fileMtime <= cachedMtime) {
      return memoryCache.get(filename) as T;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as T;
    memoryCache.set(filename, parsed);
    mtimeCache.set(filename, fileMtime);
    return parsed;
  } catch {
    memoryCache.set(filename, defaultValue);
    return defaultValue;
  }
}

function writeJson<T>(filename: string, data: T): void {
  // Always update in-memory cache
  memoryCache.set(filename, data);
  if (IS_VERCEL) return; // read-only filesystem on Vercel
  try {
    ensureDir();
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    // Update mtime cache after write
    const stat = fs.statSync(filePath);
    mtimeCache.set(filename, stat.mtimeMs);
  } catch {
    // ignore write errors
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

const SEED_VENDORS = [
  { name: "Moussa Diallo", avatar: "https://i.pravatar.cc/200?u=moussa-diallo", username: "moussa-diallo", country: "SN" },
  { name: "Aminata Koné", avatar: "https://i.pravatar.cc/200?u=aminata-kone", username: "aminata-kone", country: "CI" },
  { name: "Jean-Baptiste Nguema", avatar: "https://i.pravatar.cc/200?u=jb-nguema", username: "jb-nguema", country: "CM" },
  { name: "Fatou Sow", avatar: "https://i.pravatar.cc/200?u=fatou-sow", username: "fatou-sow", country: "SN" },
  { name: "Kofi Asante", avatar: "https://i.pravatar.cc/200?u=kofi-asante", username: "kofi-asante", country: "GH" },
  { name: "Claire Dubois", avatar: "https://i.pravatar.cc/200?u=claire-dubois", username: "claire-dubois", country: "FR" },
  { name: "Ibrahim Traoré", avatar: "https://i.pravatar.cc/200?u=ibrahim-traore", username: "ibrahim-traore", country: "BF" },
  { name: "Nadia Benali", avatar: "https://i.pravatar.cc/200?u=nadia-benali", username: "nadia-benali", country: "MA" },
  { name: "Ousmane Barry", avatar: "https://i.pravatar.cc/200?u=ousmane-barry", username: "ousmane-barry", country: "GN" },
  { name: "Awa Diop", avatar: "https://i.pravatar.cc/200?u=awa-diop", username: "awa-diop", country: "SN" },
  { name: "Pierre Kamga", avatar: "https://i.pravatar.cc/200?u=pierre-kamga", username: "pierre-kamga", country: "CM" },
  { name: "Mariame Coulibaly", avatar: "https://i.pravatar.cc/200?u=mariame-coulibaly", username: "mariame-coulibaly", country: "ML" },
  { name: "Yves Mensah", avatar: "https://i.pravatar.cc/200?u=yves-mensah", username: "yves-mensah", country: "TG" },
  { name: "Léa Fontaine", avatar: "https://i.pravatar.cc/200?u=lea-fontaine", username: "lea-fontaine", country: "FR" },
  { name: "Abdoulaye Ndiaye", avatar: "https://i.pravatar.cc/200?u=abdoulaye-ndiaye", username: "abdoulaye-ndiaye", country: "SN" },
  { name: "Rachida El Amrani", avatar: "https://i.pravatar.cc/200?u=rachida-elamrani", username: "rachida-elamrani", country: "MA" },
  { name: "Sékou Camara", avatar: "https://i.pravatar.cc/200?u=sekou-camara", username: "sekou-camara", country: "GN" },
  { name: "Bintou Sangaré", avatar: "https://i.pravatar.cc/200?u=bintou-sangare", username: "bintou-sangare", country: "CI" },
];

function getDefaultServices(): StoredService[] {
  return []; // Clean slate — no seed data
}

function _getDefaultServicesOriginal(): StoredService[] {
  return [
    // ── Développement Web (3) ──
    createSeedService(
      "srv-seed-001", "user-freelance-001",
      "Création de site web React & Next.js sur mesure",
      "cat-dev-web", "sub-frontend",
      250, 7, "actif", 3200, 87, 87 * 250,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-002", "user-freelance-002",
      "Développement API REST & GraphQL avec Node.js",
      "cat-dev-web", "sub-backend",
      180, 5, "actif", 1800, 52, 52 * 180,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-003", "user-freelance-003",
      "Site e-commerce complet avec Shopify ou WooCommerce",
      "cat-dev-web", "sub-ecommerce",
      400, 14, "actif", 2500, 35, 35 * 400,
      "/images/placeholder-service.jpg"
    ),
    // ── Design & Graphisme (3) ──
    createSeedService(
      "srv-seed-004", "user-freelance-004",
      "Création de logo professionnel et charte graphique",
      "cat-design", "sub-logo",
      80, 3, "actif", 4800, 195, 195 * 80,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-005", "user-freelance-005",
      "Design UI/UX complet pour application mobile",
      "cat-design", "sub-ui-ux",
      350, 10, "actif", 2100, 42, 42 * 350,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-006", "user-freelance-006",
      "Illustration personnalisée pour livre ou projet digital",
      "cat-design", "sub-illustration",
      120, 5, "actif", 1500, 68, 68 * 120,
      "/images/placeholder-service.jpg"
    ),
    // ── Rédaction & Contenu (3) ──
    createSeedService(
      "srv-seed-007", "user-freelance-007",
      "Rédaction d'articles SEO optimisés en français",
      "cat-redaction", "sub-redaction-web",
      45, 2, "actif", 3600, 180, 180 * 45,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-008", "user-freelance-008",
      "Copywriting persuasif pour pages de vente",
      "cat-redaction", "sub-copywriting",
      100, 3, "actif", 2800, 95, 95 * 100,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-009", "user-freelance-009",
      "Traduction professionnelle français-anglais",
      "cat-redaction", "sub-traduction",
      35, 1, "actif", 4200, 200, 200 * 35,
      "/images/placeholder-service.jpg"
    ),
    // ── Marketing Digital (3) ──
    createSeedService(
      "srv-seed-010", "user-freelance-010",
      "Audit SEO complet et plan d'optimisation",
      "cat-marketing", "sub-seo",
      150, 5, "actif", 2600, 73, 73 * 150,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-011", "user-freelance-011",
      "Gestion de réseaux sociaux pendant 30 jours",
      "cat-marketing", "sub-social-media",
      200, 7, "actif", 3100, 110, 110 * 200,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-012", "user-freelance-012",
      "Campagne publicitaire Facebook & Instagram Ads",
      "cat-marketing", "sub-pub",
      300, 5, "actif", 1900, 48, 48 * 300,
      "/images/placeholder-service.jpg"
    ),
    // ── Vidéo & Animation (3) ──
    createSeedService(
      "srv-seed-013", "user-freelance-013",
      "Montage vidéo professionnel YouTube ou corporate",
      "cat-video", "sub-montage",
      90, 3, "actif", 3500, 145, 145 * 90,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-014", "user-freelance-014",
      "Animation 2D explicative pour votre entreprise",
      "cat-video", "sub-animation-2d",
      250, 7, "actif", 1700, 38, 38 * 250,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-015", "user-freelance-015",
      "Motion graphics pour publicité et réseaux sociaux",
      "cat-video", "sub-motion-graphics",
      180, 5, "actif", 2200, 62, 62 * 180,
      "/images/placeholder-service.jpg"
    ),
    // ── Formation & Coaching (3) ──
    createSeedService(
      "srv-seed-016", "user-freelance-016",
      "Formation complète React & Next.js en visio",
      "cat-formation", "sub-dev-formation",
      500, 14, "actif", 1200, 25, 25 * 500,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-017", "user-freelance-017",
      "Coaching design Figma pour débutants",
      "cat-formation", "sub-design-formation",
      75, 3, "actif", 2900, 130, 130 * 75,
      "/images/placeholder-service.jpg"
    ),
    createSeedService(
      "srv-seed-018", "user-freelance-018",
      "Stratégie marketing digital pour PME africaines",
      "cat-formation", "sub-business",
      200, 7, "actif", 1600, 55, 55 * 200,
      "/images/placeholder-service.jpg"
    ),
  ].map((svc, i) => {
    const vendor = SEED_VENDORS[i % SEED_VENDORS.length];
    // Assign a single badge per vendor based on index for variety
    const badgePool = ["Verifie", "Pro", "Top Rated", "Elite", "Verifie", "Pro"];
    const vendorBadge = badgePool[i % badgePool.length];
    return {
      ...svc,
      vendorName: vendor.name,
      vendorAvatar: vendor.avatar,
      vendorUsername: vendor.username,
      vendorCountry: vendor.country,
      vendorBadges: [vendorBadge],
    };
  });
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
    description: { type: "markdown", text: `Description détaillée de ${title}. Ce service est proposé par un freelance expérimenté sur Novakou.` },
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
    images: [image || `https://picsum.photos/seed/${id}/800/500`],
    mainImage: image || `https://picsum.photos/seed/${id}/800/500`,
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
    metaDescription: `${title} - Service professionnel sur Novakou`,
    seoScore: Math.floor(40 + Math.random() * 40),
    faq: [],
    extras: [],
    vendorName: "",
    vendorAvatar: "",
    vendorUsername: "",
    vendorCountry: "CI",
    vendorBadges: [],
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
    return this.getAll().filter((s) => s.status === "actif" || s.status === "vedette");
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
  return []; // Clean slate
}

function _getDefaultOrdersLegacy(): StoredOrder[] {
  const now = new Date().toISOString();
  return [
    {
      id: "ORD-1024", serviceId: "s5", serviceTitle: "Design Dashboard SaaS", category: "UI/UX Design",
      clientId: "dev-client-1", clientName: "TechCorp Inc.", clientAvatar: "TC", clientCountry: "FR",
      freelanceId: "user-freelance-001", status: "en_cours", amount: 850, commission: 127.5,
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
      freelanceId: "user-freelance-001", status: "livre", amount: 1200, commission: 180,
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
      freelanceId: "user-freelance-001", status: "en_attente", amount: 450, commission: 67.5,
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
      freelanceId: "user-freelance-001", status: "revision", amount: 150, commission: 22.5,
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
      id: "ORD-1010", serviceId: "s8", serviceTitle: "Charte Graphique Complète", category: "Design",
      clientId: "dev-client-1", clientName: "Ousmane Ndiaye", clientAvatar: "ON", clientCountry: "SN",
      freelanceId: "user-freelance-001", status: "termine" as const, amount: 600, commission: 90,
      packageType: "premium" as const, deadline: "2026-02-10", deliveredAt: "2026-02-08", completedAt: "2026-02-09",
      progress: 100, revisionsLeft: 0,
      messages: [
        { id: "m1", sender: "client" as const, senderName: "Ousmane Ndiaye", content: "Excellent travail sur la charte !", timestamp: "2026-02-09T14:00:00", type: "text" as const },
      ],
      timeline: [
        { id: "t1", type: "created" as const, title: "Commande créée", description: "Forfait Premium - Charte Graphique", timestamp: "2026-01-25T09:00:00" },
        { id: "t2", type: "started" as const, title: "Travail démarré", description: "Recherche visuelle", timestamp: "2026-01-26T10:00:00" },
        { id: "t3", type: "delivered" as const, title: "Livraison effectuée", description: "Charte graphique complète livrée", timestamp: "2026-02-08T16:00:00" },
        { id: "t4", type: "completed" as const, title: "Commande terminée", description: "Client satisfait", timestamp: "2026-02-09T14:00:00" },
      ],
      files: [
        { id: "f1", name: "charte-graphique-v1.pdf", size: "15.2 MB", type: "pdf", uploadedBy: "freelance", uploadedAt: "2026-02-08T16:00:00", url: "#" },
      ],
      createdAt: "2026-01-25T09:00:00", updatedAt: now,
    },
    {
      id: "ORD-1009", serviceId: "s3", serviceTitle: "Landing Page Responsive", category: "Développement Web",
      clientId: "dev-client-1", clientName: "Awa Traore", clientAvatar: "AT", clientCountry: "ML",
      freelanceId: "user-freelance-001", status: "termine" as const, amount: 350, commission: 52.5,
      packageType: "standard" as const, deadline: "2026-01-30", deliveredAt: "2026-01-28", completedAt: "2026-01-29",
      progress: 100, revisionsLeft: 0,
      messages: [
        { id: "m1", sender: "client" as const, senderName: "Awa Traore", content: "La page est superbe, merci !", timestamp: "2026-01-29T10:00:00", type: "text" as const },
      ],
      timeline: [
        { id: "t1", type: "created" as const, title: "Commande créée", description: "Forfait Standard - Landing Page", timestamp: "2026-01-15T11:00:00" },
        { id: "t2", type: "started" as const, title: "Travail démarré", description: "Développement en cours", timestamp: "2026-01-16T09:00:00" },
        { id: "t3", type: "delivered" as const, title: "Livraison effectuée", description: "Landing page livrée", timestamp: "2026-01-28T14:00:00" },
        { id: "t4", type: "completed" as const, title: "Commande terminée", description: "Validée par le client", timestamp: "2026-01-29T10:00:00" },
      ],
      files: [],
      createdAt: "2026-01-15T11:00:00", updatedAt: now,
    },
    {
      id: "ORD-1008", serviceId: "s2", serviceTitle: "Pack 5 Articles Blog", category: "Contenu",
      clientId: "dev-client-1", clientName: "Marie Dupont", clientAvatar: "MD", clientCountry: "FR",
      freelanceId: "user-freelance-001", status: "termine", amount: 300, commission: 45,
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
      id: "ORD-1005", serviceId: "s3", serviceTitle: "Refonte Site E-commerce", category: "Développement Web",
      clientId: "dev-client-1", clientName: "Fatou Sow", clientAvatar: "FS", clientCountry: "SN",
      freelanceId: "user-freelance-001", freelanceName: "Gildas Lissanon", status: "litige" as const, amount: 950, commission: 142.5,
      packageType: "premium" as const, deadline: "2026-03-20", deliveredAt: "2026-03-18", completedAt: null,
      progress: 100, revisionsLeft: 0,
      disputeStatus: "ouvert",
      disputeReason: "Le client conteste la conformité de la livraison",
      messages: [
        { id: "m1", sender: "client", senderName: "Fatou Sow", content: "Le site ne correspond pas au brief fourni.", timestamp: "2026-03-22T14:00:00", type: "text" as const },
        { id: "m2", sender: "freelance", senderName: "Gildas Lissanon", content: "J'ai suivi les specifications exactes du cahier des charges.", timestamp: "2026-03-22T15:30:00", type: "text" as const },
      ],
      timeline: [
        { id: "t1", type: "created" as const, title: "Commande créée", description: "Forfait Premium - Refonte E-commerce", timestamp: "2026-03-01T10:00:00" },
        { id: "t2", type: "started" as const, title: "Travail démarré", description: "Développement en cours", timestamp: "2026-03-02T09:00:00" },
        { id: "t3", type: "delivered" as const, title: "Livraison effectuée", description: "Site livré avec documentation", timestamp: "2026-03-18T16:00:00" },
        { id: "t4", type: "dispute" as const, title: "Litige ouvert", description: "Le client conteste la conformité de la livraison", timestamp: "2026-03-22T14:00:00" },
      ],
      files: [
        { id: "f1", name: "site-ecommerce-v1.zip", size: "12.3 MB", type: "zip", uploadedBy: "freelance", uploadedAt: "2026-03-18T16:00:00", url: "#" },
      ],
      createdAt: "2026-03-01T10:00:00", updatedAt: now,
    } as StoredOrder,
    {
      id: "ORD-1004", serviceId: "s6", serviceTitle: "Campagne Marketing Digital", category: "Marketing",
      clientId: "dev-client-1", clientName: "Amadou Diallo", clientAvatar: "AD", clientCountry: "GN",
      freelanceId: "user-freelance-001", freelanceName: "Gildas Lissanon", status: "litige" as const, amount: 500, commission: 75,
      packageType: "standard" as const, deadline: "2026-03-12", deliveredAt: "2026-03-11", completedAt: null,
      progress: 100, revisionsLeft: 1,
      disputeStatus: "ouvert",
      disputeReason: "Résultats non conformes aux objectifs promis",
      messages: [
        { id: "m1", sender: "client", senderName: "Amadou Diallo", content: "Les résultats promis n'ont pas été atteints.", timestamp: "2026-03-15T09:00:00", type: "text" as const },
      ],
      timeline: [
        { id: "t1", type: "created" as const, title: "Commande créée", description: "Forfait Standard - Campagne Marketing", timestamp: "2026-02-25T08:00:00" },
        { id: "t2", type: "delivered" as const, title: "Livraison effectuée", description: "Rapport de campagne envoyé", timestamp: "2026-03-11T17:00:00" },
        { id: "t3", type: "dispute" as const, title: "Litige ouvert", description: "Résultats non conformes aux objectifs", timestamp: "2026-03-15T09:00:00" },
      ],
      files: [],
      createdAt: "2026-02-25T08:00:00", updatedAt: now,
    } as StoredOrder,
    {
      id: "ORD-1003", serviceId: "s4", serviceTitle: "Application Mobile React Native", category: "Développement",
      clientId: "dev-client-1", clientName: "Ibrahim Traore", clientAvatar: "IT", clientCountry: "BF",
      freelanceId: "user-freelance-001", status: "annule", amount: 700, commission: 105,
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

  create(data: Omit<StoredOrder, "id" | "createdAt" | "updatedAt">): StoredOrder {
    const orders = this.getAll();
    const now = new Date().toISOString();
    const order: StoredOrder = {
      ...data,
      id: `ORD-${Date.now().toString(36).toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
    };
    orders.unshift(order);
    writeJson(ORDERS_FILE, orders);
    return order;
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

  autoCancelStale(): string[] {
    const orders = this.getAll();
    const now = Date.now();
    const THREE_DAYS_MS = 72 * 60 * 60 * 1000;
    const cancelled: string[] = [];
    for (const order of orders) {
      if (order.status === "en_attente" && (now - new Date(order.createdAt).getTime()) > THREE_DAYS_MS) {
        order.status = "annule";
        order.updatedAt = new Date().toISOString();
        order.timeline.push({
          id: `t${Date.now()}_${order.id}`, type: "cancelled",
          title: "Commande annulee automatiquement",
          description: "Le freelance n'a pas accepte la commande dans le delai de 3 jours.",
          timestamp: new Date().toISOString(),
        });
        cancelled.push(order.id);
      }
    }
    if (cancelled.length > 0) writeJson(ORDERS_FILE, orders);
    return cancelled;
  },

  autoValidateStale(): string[] {
    const orders = this.getAll();
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const validated: string[] = [];
    for (const order of orders) {
      if (order.status === "livre" && order.deliveredAt && (now - new Date(order.deliveredAt).getTime()) > SEVEN_DAYS_MS) {
        order.status = "termine";
        order.completedAt = new Date().toISOString();
        order.progress = 100;
        order.updatedAt = new Date().toISOString();
        order.timeline.push({
          id: `t${Date.now()}_${order.id}`, type: "completed",
          title: "Commande validee automatiquement",
          description: "Le client n'a pas repondu dans le delai de 7 jours. Les fonds ont ete liberes.",
          timestamp: new Date().toISOString(),
        });
        validated.push(order.id);
      }
    }
    if (validated.length > 0) writeJson(ORDERS_FILE, orders);
    return validated;
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

  update(id: string, updates: Partial<StoredTransaction>): StoredTransaction | null {
    const transactions = this.getAll();
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    transactions[idx] = { ...transactions[idx], ...updates };
    writeJson(TRANSACTIONS_FILE, transactions);
    return transactions[idx];
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

  /**
   * Nettoyer les boosts expires — desactiver isBoosted sur les services concernes.
   * A appeler periodiquement (ex: dans un cron ou au chargement du dashboard).
   */
  cleanupExpired(): number {
    const now = new Date();
    let cleaned = 0;
    const allBoosts = this.getAll();
    const expiredServiceIds = new Set<string>();

    for (const boost of allBoosts) {
      if (new Date(boost.expiresAt) <= now) {
        expiredServiceIds.add(boost.serviceId);
      }
    }

    for (const serviceId of expiredServiceIds) {
      // Verifier qu'il n'y a pas de boost actif pour ce service
      const activeBoost = this.getActiveBoost(serviceId);
      if (!activeBoost) {
        const service = serviceStore.getById(serviceId);
        if (service && service.isBoosted) {
          serviceStore.update(serviceId, {
            isBoosted: false,
            boostTier: null,
          });
          cleaned++;
        }
      }
    }

    return cleaned;
  },
};

// ── Profile Store ──────────────────────────────────────────────────────────

const PROFILES_FILE = "profiles.json";

function getDefaultProfiles(): Record<string, StoredProfile> {
  return {
    "user-freelance-001": {
      userId: "user-freelance-001",
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
  _loadProfiles(): Record<string, StoredProfile> {
    const raw = readJson<Record<string, StoredProfile> | unknown[]>(PROFILES_FILE, getDefaultProfiles());
    // Fix: if profiles.json is an array (legacy/empty), convert to default object
    if (Array.isArray(raw) || typeof raw !== "object" || raw === null) {
      const defaults = getDefaultProfiles();
      writeJson(PROFILES_FILE, defaults);
      // Also update memory cache
      memoryCache.set(PROFILES_FILE, defaults);
      return defaults;
    }
    // If it's an object but empty, populate with defaults
    if (Object.keys(raw).length === 0) {
      const defaults = getDefaultProfiles();
      writeJson(PROFILES_FILE, defaults);
      memoryCache.set(PROFILES_FILE, defaults);
      return defaults;
    }
    return raw as Record<string, StoredProfile>;
  },

  get(userId: string): StoredProfile | null {
    const profiles = this._loadProfiles();
    return profiles[userId] ?? null;
  },

  update(userId: string, updates: Partial<StoredProfile>): StoredProfile {
    const profiles = this._loadProfiles();
    if (!profiles[userId]) {
      profiles[userId] = { ...getDefaultProfiles()["user-freelance-001"], userId, ...updates };
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // Tendance : comparaison mois courant vs mois precedent
    revenueTrend: (() => {
      const current = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0;
      const previous = monthlyRevenue[monthlyRevenue.length - 2]?.revenue ?? 0;
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    })(),
    ordersTrend: (() => {
      const current = monthlyRevenue[monthlyRevenue.length - 1]?.orders ?? 0;
      const previous = monthlyRevenue[monthlyRevenue.length - 2]?.orders ?? 0;
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 1000) / 10;
    })(),
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
  return []; // Clean slate
}

function _getDefaultReviewsLegacy(): StoredReview[] {
  return [
    { id: "rev-seed-001", orderId: "ORD-1008", serviceId: "srv-seed-007", clientId: "dev-client-1", clientName: "Marie Dupont", clientAvatar: "MD", clientCountry: "FR", freelanceId: "user-freelance-007", serviceTitle: "Rédaction d'articles SEO optimisés en français", qualite: 5, communication: 5, delai: 4, rating: 4.7, comment: "Travail excellent, articles bien structurés et optimisés. Je recommande vivement !", reply: "Merci Marie, ce fut un plaisir de travailler avec vous !", repliedAt: "2026-01-20T10:00:00", helpful: 12, reported: false, createdAt: "2026-01-19T14:00:00" },
    { id: "rev-seed-002", orderId: "ORD-1024", serviceId: "srv-seed-005", clientId: "dev-client-2", clientName: "TechCorp Inc.", clientAvatar: "TC", clientCountry: "FR", freelanceId: "user-freelance-005", serviceTitle: "Design UI/UX complet pour application mobile", qualite: 5, communication: 5, delai: 5, rating: 5.0, comment: "Design incroyable, exactement ce qu'on cherchait pour notre application. Professionnel et réactif.", reply: null, repliedAt: null, helpful: 8, reported: false, createdAt: "2026-02-25T09:00:00" },
    { id: "rev-seed-003", orderId: "ORD-1019", serviceId: "srv-seed-002", clientId: "dev-client-3", clientName: "Lamine Diallo", clientAvatar: "LD", clientCountry: "SN", freelanceId: "user-freelance-002", serviceTitle: "Développement API REST & GraphQL avec Node.js", qualite: 5, communication: 4, delai: 5, rating: 4.7, comment: "API bien documentée et fonctionnelle. Livré en avance, très pro.", reply: "Merci Lamine ! L'API tourne bien, n'hésitez pas pour la maintenance.", repliedAt: "2026-02-20T11:00:00", helpful: 15, reported: false, createdAt: "2026-02-19T16:00:00" },
    { id: "rev-seed-004", orderId: "ORD-1012", serviceId: "srv-seed-004", clientId: "dev-client-4", clientName: "Moussa Keita", clientAvatar: "MK", clientCountry: "ML", freelanceId: "user-freelance-004", serviceTitle: "Création de logo professionnel et charte graphique", qualite: 4, communication: 5, delai: 4, rating: 4.3, comment: "Logo magnifique, bonne communication tout au long du projet.", reply: null, repliedAt: null, helpful: 6, reported: false, createdAt: "2026-02-16T10:00:00" },
    { id: "rev-seed-005", orderId: "ORD-1016", serviceId: "srv-seed-010", clientId: "dev-client-5", clientName: "Auto-Focus SARL", clientAvatar: "AF", clientCountry: "CI", freelanceId: "user-freelance-010", serviceTitle: "Audit SEO complet et plan d'optimisation", qualite: 5, communication: 5, delai: 5, rating: 5.0, comment: "Audit très complet avec des recommandations actionnables. Notre trafic a augmenté de 40% en 2 mois.", reply: "Ravi des résultats ! On continue avec le plan d'optimisation.", repliedAt: "2026-03-05T14:00:00", helpful: 22, reported: false, createdAt: "2026-03-04T09:00:00" },
    { id: "rev-seed-006", orderId: "ORD-extra-001", serviceId: "srv-seed-001", clientId: "dev-client-6", clientName: "Sophie Martin", clientAvatar: "SM", clientCountry: "FR", freelanceId: "user-freelance-001", serviceTitle: "Création de site web React & Next.js sur mesure", qualite: 5, communication: 4, delai: 4, rating: 4.3, comment: "Site web rapide et bien conçu. Quelques ajustements mineurs mais globalement excellent.", reply: null, repliedAt: null, helpful: 9, reported: false, createdAt: "2026-02-10T11:00:00" },
    { id: "rev-seed-007", orderId: "ORD-extra-002", serviceId: "srv-seed-013", clientId: "dev-client-7", clientName: "Ahmed Bah", clientAvatar: "AB", clientCountry: "GN", freelanceId: "user-freelance-013", serviceTitle: "Montage vidéo professionnel YouTube ou corporate", qualite: 5, communication: 5, delai: 5, rating: 5.0, comment: "Montage exceptionnel ! Transitions fluides, musique parfaite. Notre chaîne YouTube a gagné 2000 abonnés.", reply: "Merci Ahmed ! Content que la vidéo ait eu cet impact.", repliedAt: "2026-03-01T16:00:00", helpful: 18, reported: false, createdAt: "2026-02-28T14:00:00" },
    { id: "rev-seed-008", orderId: "ORD-extra-003", serviceId: "srv-seed-011", clientId: "dev-client-8", clientName: "Fatima Ouédraogo", clientAvatar: "FO", clientCountry: "BF", freelanceId: "user-freelance-011", serviceTitle: "Gestion de réseaux sociaux pendant 30 jours", qualite: 4, communication: 5, delai: 5, rating: 4.7, comment: "Notre engagement Instagram a triplé. Contenu créatif et adapté à notre audience africaine.", reply: null, repliedAt: null, helpful: 11, reported: false, createdAt: "2026-03-10T08:00:00" },
  ];
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
  const now = new Date();
  return [
    {
      id: "conv-seed-1",
      participants: ["dev-1773299214975", "dev-1773366800521"],
      contactName: "Gildas LISSANON",
      contactAvatar: "GL",
      contactRole: "client",
      lastMessage: "Bonjour, je suis interesse par votre service de developpement web.",
      lastMessageTime: new Date(now.getTime() - 30 * 60000).toISOString(),
      unread: 1,
      online: true,
      messages: [
        {
          id: "cm_seed_1",
          senderId: "dev-1773366800521",
          sender: "them",
          content: "Bonjour, je suis interesse par votre service de developpement web.",
          timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
          type: "text",
          read: false,
        },
      ],
    },
    {
      id: "conv-seed-2",
      participants: ["dev-admin-1", "dev-1773299214975"],
      contactName: "Gildas LISSANON",
      contactAvatar: "GL",
      contactRole: "support",
      lastMessage: "Votre profil a ete verifie avec succes. Bienvenue sur Novakou !",
      lastMessageTime: new Date(now.getTime() - 2 * 3600000).toISOString(),
      unread: 0,
      online: false,
      messages: [
        {
          id: "cm_seed_2",
          senderId: "dev-admin-1",
          sender: "me",
          content: "Bienvenue sur Novakou ! N'hesitez pas a nous contacter si vous avez des questions.",
          timestamp: new Date(now.getTime() - 5 * 3600000).toISOString(),
          type: "text",
          read: true,
        },
        {
          id: "cm_seed_3",
          senderId: "dev-1773299214975",
          sender: "them",
          content: "Merci beaucoup ! J'ai une question sur la verification KYC.",
          timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(),
          type: "text",
          read: true,
        },
        {
          id: "cm_seed_4",
          senderId: "dev-admin-1",
          sender: "me",
          content: "Votre profil a ete verifie avec succes. Bienvenue sur Novakou !",
          timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(),
          type: "text",
          read: true,
        },
      ],
    },
    {
      id: "conv-seed-3",
      participants: ["dev-admin-1", "dev-1773366800521"],
      contactName: "Gildas LISSANON",
      contactAvatar: "GL",
      contactRole: "client",
      lastMessage: "Merci pour votre aide concernant ma commande.",
      lastMessageTime: new Date(now.getTime() - 6 * 3600000).toISOString(),
      unread: 0,
      online: true,
      messages: [
        {
          id: "cm_seed_5",
          senderId: "dev-admin-1",
          sender: "me",
          content: "Bonjour, comment puis-je vous aider ?",
          timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(),
          type: "text",
          read: true,
        },
        {
          id: "cm_seed_6",
          senderId: "dev-1773366800521",
          sender: "them",
          content: "Merci pour votre aide concernant ma commande.",
          timestamp: new Date(now.getTime() - 6 * 3600000).toISOString(),
          type: "text",
          read: true,
        },
      ],
    },
  ];
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

  sendMessage(convId: string, senderId: string, content: string, type: "text" | "image" | "file" | "offer" | "system" = "text", fileName?: string, fileSize?: string, linkPreviewData?: { title: string; description: string; image?: string; domain: string; url?: string }[], fileUrl?: string, fileType?: string, offerData?: ChatMsg["offerData"]): StoredConversation | null {
    const convs = this.getAll();
    const idx = convs.findIndex((c) => c.id === convId);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const msg: ChatMsg = {
      id: `cm_${Date.now().toString(36)}`,
      senderId,
      sender: type === "system" ? "them" : "me",
      content,
      timestamp: now,
      type,
      fileName,
      fileSize,
      fileUrl,
      fileType,
      read: type === "system" ? false : true,
      linkPreviewData: linkPreviewData && linkPreviewData.length > 0 ? linkPreviewData : undefined,
      offerData,
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

  create(data: { participants: string[]; contactName: string; contactAvatar: string; contactRole: StoredConversation["contactRole"]; orderId?: string }): StoredConversation {
    const convs = this.getAll();

    // Check if conversation already exists between same participants (+ optional orderId)
    const existing = convs.find((c) => {
      const sameParticipants =
        c.participants.length === data.participants.length &&
        data.participants.every((p) => c.participants.includes(p));
      if (data.orderId) return sameParticipants && c.orderId === data.orderId;
      return sameParticipants;
    });

    if (existing) return existing;

    const conv: StoredConversation = {
      id: `conv_${Date.now().toString(36)}`,
      participants: data.participants,
      contactName: data.contactName,
      contactAvatar: data.contactAvatar,
      contactRole: data.contactRole,
      lastMessage: "",
      lastMessageTime: new Date().toISOString(),
      unread: 0,
      online: false,
      orderId: data.orderId,
      messages: [],
    };

    convs.unshift(conv);
    writeJson(CONVERSATIONS_FILE, convs);
    return conv;
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

  create(data: Omit<StoredProject, "id" | "proposals" | "status" | "postedAt">): StoredProject {
    const projects = this.getAll();
    const project: StoredProject = {
      ...data,
      id: `proj_${Date.now().toString(36)}`,
      proposals: 0,
      status: "ouvert",
      postedAt: new Date().toISOString(),
    };
    projects.unshift(project);
    writeJson(PROJECTS_FILE, projects);
    return project;
  },

  update(id: string, data: Partial<StoredProject>): StoredProject | null {
    const projects = this.getAll();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    projects[idx] = { ...projects[idx], ...data };
    writeJson(PROJECTS_FILE, projects);
    return projects[idx];
  },

  delete(id: string): boolean {
    const projects = this.getAll();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    projects.splice(idx, 1);
    writeJson(PROJECTS_FILE, projects);
    return true;
  },

  updateStatus(id: string, status: string): void {
    this.update(id, { status } as Partial<StoredProject>);
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

  getByProject(projectId: string): StoredCandidature[] {
    return this.getAll()
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  },

  getById(id: string): StoredCandidature | null {
    return this.getAll().find((c) => c.id === id) || null;
  },

  updateStatus(id: string, status: string): StoredCandidature | null {
    return this.update(id, { status } as Partial<StoredCandidature>);
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

  getByClient(clientId: string, clientEmail: string): StoredOffre[] {
    return this.getAll()
      .filter((o) => o.clientId === clientId || (clientEmail && o.clientEmail === clientEmail))
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  },

  getById(id: string): StoredOffre | null {
    return this.getAll().find((o) => o.id === id) || null;
  },

  updateStatus(id: string, status: string): StoredOffre | null {
    return this.update(id, { status } as Partial<StoredOffre>);
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

// ── KYC Request Store ──────────────────────────────────────────────────

export interface StoredKycRequest {
  id: string;
  userId: string;
  level: 2 | 3 | 4;
  documentType: "phone" | "cni" | "passeport" | "permis" | "diplome" | "certificat" | "siret" | "registre_commerce" | "CNI" | "PASSEPORT" | "PERMIS" | "KBIS" | "REGISTRE_COMMERCE" | "LICENCE";
  documentUrl: string;
  status: "en_attente" | "approuve" | "refuse";
  reason: string;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  // Extended KYC submission fields
  type?: "individual" | "agency";
  // Individual fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  city?: string;
  address?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  // Agency fields
  agencyName?: string;
  siretNumber?: string;
  legalRepName?: string;
  email?: string;
  phone?: string;
  registrationDocUrl?: string;
  representativeIdUrl?: string;
}

const KYC_FILE = "kyc-requests.json";

export const kycRequestStore = {
  getAll(): StoredKycRequest[] {
    return readJson<StoredKycRequest[]>(KYC_FILE, []);
  },

  getByUser(userId: string): StoredKycRequest[] {
    return this.getAll().filter((k) => k.userId === userId);
  },

  getById(id: string): StoredKycRequest | undefined {
    return this.getAll().find((k) => k.id === id);
  },

  getPending(): StoredKycRequest[] {
    return this.getAll().filter((k) => k.status === "en_attente");
  },

  getUserLevel(userId: string): number {
    const requests = this.getByUser(userId);
    const approved = requests.filter((k) => k.status === "approuve");
    if (approved.some((k) => k.level === 4)) return 4;
    if (approved.some((k) => k.level === 3)) return 3;
    if (approved.some((k) => k.level === 2)) return 2;
    return 1;
  },

  create(data: Omit<StoredKycRequest, "id" | "status" | "createdAt" | "reviewedAt" | "reviewedBy" | "reason">): StoredKycRequest {
    const all = this.getAll();
    const req: StoredKycRequest = {
      ...data,
      id: `kyc_${Date.now().toString(36)}`,
      status: "en_attente",
      reason: "",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };
    all.unshift(req);
    writeJson(KYC_FILE, all);
    return req;
  },

  update(id: string, updates: Partial<StoredKycRequest>): StoredKycRequest | null {
    const all = this.getAll();
    const idx = all.findIndex((k) => k.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates };
    writeJson(KYC_FILE, all);
    return all[idx];
  },
};

// ── KYC Personal Info Store ───────────────────────────────────────────

export interface StoredKycPersonalInfo {
  userId: string;
  firstName: string;
  lastName: string;
  country: string;
  city: string;
  address: string;
  dateOfBirth: string;
  updatedAt: string;
}

const KYC_PERSONAL_INFO_FILE = "kyc-personal-info.json";

export const kycPersonalInfoStore = {
  getAll(): StoredKycPersonalInfo[] {
    return readJson<StoredKycPersonalInfo[]>(KYC_PERSONAL_INFO_FILE, []);
  },

  getByUser(userId: string): StoredKycPersonalInfo | null {
    const all = this.getAll();
    return all.find((p) => p.userId === userId) || null;
  },

  upsert(
    userId: string,
    data: Omit<StoredKycPersonalInfo, "userId" | "updatedAt">
  ): StoredKycPersonalInfo {
    const all = this.getAll();
    const idx = all.findIndex((p) => p.userId === userId);
    const entry: StoredKycPersonalInfo = {
      ...data,
      userId,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      all[idx] = entry;
    } else {
      all.push(entry);
    }
    writeJson(KYC_PERSONAL_INFO_FILE, all);
    return entry;
  },
};

// ── Contact Store ─────────────────────────────────────────────────────

export interface StoredContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

const CONTACT_FILE = "contact-messages.json";

export const contactStore = {
  getAll(): StoredContactMessage[] {
    return readJson<StoredContactMessage[]>(CONTACT_FILE, []);
  },

  create(data: Omit<StoredContactMessage, "id" | "createdAt">): StoredContactMessage {
    const all = this.getAll();
    const msg: StoredContactMessage = {
      ...data,
      id: `contact_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    all.unshift(msg);
    writeJson(CONTACT_FILE, all);
    return msg;
  },
};

// ── Invoice Store ─────────────────────────────────────────────────────

export interface StoredInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  transactionId: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  type: "service" | "formation" | "produit" | "abonnement";
  description: string;
  amount: number;
  currency: string;
  commission: number;
  commissionRate: number;
  tax: number;
  taxRate: number;
  totalPaid: number;
  netAmount: number;
  paymentMethod: string;
  status: "payee" | "en_attente" | "remboursee" | "annulee";
  pdfUrl: string | null;
  createdAt: string;
}

const INVOICES_FILE = "invoices.json";

let invoiceCounter = 100;

function getNextInvoiceNumber(): string {
  invoiceCounter++;
  return `INV-${String(invoiceCounter).padStart(6, "0")}`;
}

export const invoiceStore = {
  getAll(): StoredInvoice[] {
    return readJson<StoredInvoice[]>(INVOICES_FILE, []);
  },

  getByUser(userId: string): StoredInvoice[] {
    const all = this.getAll();
    return all.filter((inv) => inv.buyerId === userId || inv.sellerId === userId);
  },

  getByBuyer(buyerId: string): StoredInvoice[] {
    const all = this.getAll();
    return all.filter((inv) => inv.buyerId === buyerId);
  },

  getBySeller(sellerId: string): StoredInvoice[] {
    const all = this.getAll();
    return all.filter((inv) => inv.sellerId === sellerId);
  },

  getById(id: string): StoredInvoice | null {
    const all = this.getAll();
    return all.find((inv) => inv.id === id || inv.invoiceNumber === id) || null;
  },

  create(data: Omit<StoredInvoice, "id" | "invoiceNumber" | "createdAt" | "pdfUrl">): StoredInvoice {
    const all = this.getAll();
    const invoice: StoredInvoice = {
      ...data,
      id: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      invoiceNumber: getNextInvoiceNumber(),
      pdfUrl: null,
      createdAt: new Date().toISOString(),
    };
    all.unshift(invoice);
    writeJson(INVOICES_FILE, all);
    return invoice;
  },

  /**
   * Auto-generer une facture a partir d'une commande completee.
   */
  createFromOrder(order: {
    id: string;
    serviceTitle: string;
    amount: number;
    commission: number;
    clientId: string;
    clientName: string;
    freelanceId: string;
    freelanceName: string;
    paymentMethod?: string;
  }): StoredInvoice {
    const commissionRate = order.amount > 0 ? (order.commission / order.amount) * 100 : 0;
    return this.create({
      orderId: order.id,
      transactionId: `TX-${Date.now().toString(36)}`,
      buyerId: order.clientId,
      buyerName: order.clientName,
      buyerEmail: "",
      sellerId: order.freelanceId,
      sellerName: order.freelanceName,
      sellerEmail: "",
      type: "service",
      description: order.serviceTitle,
      amount: order.amount,
      currency: "EUR",
      commission: order.commission,
      commissionRate: Math.round(commissionRate),
      tax: 0,
      taxRate: 0,
      totalPaid: order.amount,
      netAmount: order.amount - order.commission,
      paymentMethod: order.paymentMethod || "carte_bancaire",
      status: "payee",
    });
  },
};

// ── Rank System ──────────────────────────────────────────────────────

export interface UserRank {
  level: string;
  label: string;
  icon: string;
  color: string;
  minSales: number;
}

export const RANK_LEVELS: UserRank[] = [
  { level: "new_seller", label: "Nouveau vendeur", icon: "storefront", color: "text-slate-400", minSales: 0 },
  { level: "rising_talent", label: "Rising Talent", icon: "trending_up", color: "text-blue-400", minSales: 5 },
  { level: "professional", label: "Professionnel", icon: "workspace_premium", color: "text-purple-400", minSales: 25 },
  { level: "top_rated", label: "Top Rated", icon: "star", color: "text-amber-400", minSales: 50 },
  { level: "elite_expert", label: "Elite Expert", icon: "diamond", color: "text-emerald-400", minSales: 100 },
];

export function getUserRank(completedSales: number): UserRank {
  for (let i = RANK_LEVELS.length - 1; i >= 0; i--) {
    if (completedSales >= RANK_LEVELS[i].minSales) {
      return RANK_LEVELS[i];
    }
  }
  return RANK_LEVELS[0];
}

export function getNextRank(completedSales: number): { nextRank: UserRank | null; salesNeeded: number; progress: number } {
  const currentRank = getUserRank(completedSales);
  const currentIdx = RANK_LEVELS.findIndex((r) => r.level === currentRank.level);
  if (currentIdx >= RANK_LEVELS.length - 1) {
    return { nextRank: null, salesNeeded: 0, progress: 100 };
  }
  const nextRank = RANK_LEVELS[currentIdx + 1];
  const salesNeeded = nextRank.minSales - completedSales;
  const rangeStart = currentRank.minSales;
  const rangeEnd = nextRank.minSales;
  const progress = rangeEnd > rangeStart
    ? Math.round(((completedSales - rangeStart) / (rangeEnd - rangeStart)) * 100)
    : 0;
  return { nextRank, salesNeeded, progress };
}

// ── Export SEO score calculator for API use ──────────────────────────────

export { calculateSeoScore };
