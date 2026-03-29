// ============================================================
// FreelanceHigh — Comprehensive Demo Data
// All data for the fully functional freelance dashboard
// ============================================================

export interface Service {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  tags: string[];
  price: number;
  deliveryDays: number;
  revisions: number;
  status: "actif" | "pause" | "brouillon" | "en_attente" | "vedette" | "refuse";
  views: number;
  clicks: number;
  orders: number;
  revenue: number;
  conversionRate: number;
  image: string;
  createdAt: string;
  packages: {
    basic: { name: string; price: number; delivery: number; revisions: number; description: string };
    standard: { name: string; price: number; delivery: number; revisions: number; description: string };
    premium: { name: string; price: number; delivery: number; revisions: number; description: string };
  };
  faq: { question: string; answer: string }[];
  extras: { label: string; price: number }[];
  isBoosted?: boolean;
  rating?: number;
  ratingCount?: number;
  totalContacts?: number;
  slug?: string;
}

export interface Order {
  id: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  clientName: string;
  clientAvatar: string;
  clientCountry: string;
  freelanceName?: string;
  status: "en_attente" | "en_cours" | "livre" | "revision" | "termine" | "annule" | "litige";
  amount: number;
  platformFee: number;
  freelancerPayout: number;
  createdAt: string;
  deadline: string;
  deliveredAt: string | null;
  packageType: "basic" | "standard" | "premium";
  progress: number;
  messages: OrderMessage[];
  timeline: TimelineEvent[];
  files: OrderFile[];
  revisionsLeft: number;
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

export interface Transaction {
  id: string;
  type: "vente" | "retrait" | "commission" | "remboursement" | "bonus";
  description: string;
  amount: number;
  status: "complete" | "en_attente" | "echoue";
  date: string;
  orderId?: string;
  method?: string;
}

export interface Conversation {
  id: string;
  contactName: string;
  contactAvatar: string;
  contactRole: "client" | "agence" | "support";
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
  orderId?: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  sender: "me" | "them";
  content: string;
  timestamp: string;
  type: "text" | "image" | "file";
  fileName?: string;
  fileSize?: string;
  read: boolean;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  images: string[];
  link: string;
  featured: boolean;
  createdAt: string;
  order: number;
}

export interface FreelancerProfile {
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
}

export interface AvailabilitySlot {
  day: number; // 0=Lun, 1=Mar, ..., 6=Dim
  dayName: string;
  available: boolean;
  startTime: string;
  endTime: string;
}

export interface NotificationSetting {
  id: string;
  label: string;
  category: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  commission: number;
  features: string[];
  servicesLimit: number | null;
  candidaturesLimit: number | null;
  boostLimit: number;
  current: boolean;
}

// ============================================================
// DEMO DATA
// ============================================================

export const INITIAL_SERVICES: Service[] = [];
/** @deprecated Use INITIAL_SERVICES */
export const DEMO_SERVICES = INITIAL_SERVICES;

export const INITIAL_ORDERS: Order[] = [];
/** @deprecated Use INITIAL_ORDERS */
export const DEMO_ORDERS = INITIAL_ORDERS;

export const INITIAL_TRANSACTIONS: Transaction[] = [];
/** @deprecated Use INITIAL_TRANSACTIONS */
export const DEMO_TRANSACTIONS = INITIAL_TRANSACTIONS;

export const INITIAL_CONVERSATIONS: Conversation[] = [];
/** @deprecated Use INITIAL_CONVERSATIONS */
export const DEMO_CONVERSATIONS = INITIAL_CONVERSATIONS;

export const INITIAL_PORTFOLIO: PortfolioProject[] = [];
/** @deprecated Use INITIAL_PORTFOLIO */
export const DEMO_PORTFOLIO = INITIAL_PORTFOLIO;

export const DEMO_PROFILE: FreelancerProfile = {
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
  links: {
    linkedin: "",
    github: "",
    portfolio: "",
    behance: "",
  },
  completionPercent: 0,
};

/** @deprecated Availability is loaded from the API via syncFromApi(). Initial state is []. */
export const DEMO_AVAILABILITY: AvailabilitySlot[] = [];

/** @deprecated Notification settings are loaded from the API. Initial state is []. */
export const DEMO_NOTIFICATION_SETTINGS: NotificationSetting[] = [];

export const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: "decouverte",
    name: "Découverte",
    price: 0,
    commission: 12,
    features: ["5 services actifs", "10 candidatures/mois", "Commission 12%", "Support email", "Profil public"],
    servicesLimit: 5,
    candidaturesLimit: 10,
    boostLimit: 0,
    current: false,
  },
  {
    id: "ascension",
    name: "Ascension",
    price: 15,
    commission: 5,
    features: ["15 services actifs", "30 candidatures/mois", "3 boosts/mois", "Commission 5%", "1 certification IA/mois", "Statistiques avancees", "Support prioritaire"],
    servicesLimit: 15,
    candidaturesLimit: 30,
    boostLimit: 3,
    current: true,
  },
  {
    id: "sommet",
    name: "Sommet",
    price: 29.99,
    commission: 0,
    features: ["Services illimites", "Candidatures illimitees", "10 boosts/mois", "Commission 1€/vente", "Certifications IA illimitees", "Outils productivite", "Cles API", "Support dedie"],
    servicesLimit: null,
    candidaturesLimit: null,
    boostLimit: 10,
    current: false,
  },
  {
    id: "agence_starter",
    name: "Agence Starter",
    price: 20,
    commission: 5,
    features: ["Services illimites", "Candidatures illimitees", "Commission 5%", "5 boosts/mois", "Jusqu'a 5 membres", "CRM clients", "10 GB stockage", "Support prioritaire"],
    servicesLimit: null,
    candidaturesLimit: null,
    boostLimit: 5,
    current: false,
  },
  {
    id: "empire",
    name: "Empire",
    price: 65,
    commission: 0,
    features: ["Tout de Sommet", "0% commission", "20 boosts/mois", "25 membres equipe", "CRM clients", "100 GB cloud", "Support VIP dedie"],
    servicesLimit: null,
    candidaturesLimit: null,
    boostLimit: 20,
    current: false,
  },
];

// Revenue data for charts
export const MONTHLY_REVENUE: { month: string; revenue: number; orders: number }[] = [];

export const WEEKLY_ORDERS: { week: string; orders: number }[] = [];

export const PROFILE_VIEWS: { date: string; views: number }[] = [];

export const TRAFFIC_SOURCES: { name: string; value: number; color: string }[] = [];

export const INVOICES: { id: string; date: string; amount: number; description: string; status: "payee" | "en_attente" }[] = [];
