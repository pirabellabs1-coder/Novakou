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
  status: "actif" | "pause" | "brouillon";
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
}

export interface Order {
  id: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  clientName: string;
  clientAvatar: string;
  clientCountry: string;
  status: "en_attente" | "en_cours" | "livre" | "revision" | "termine" | "annule" | "litige";
  amount: number;
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

export const DEMO_AVAILABILITY: AvailabilitySlot[] = [
  { day: 0, dayName: "Lundi", available: true, startTime: "09:00", endTime: "18:00" },
  { day: 1, dayName: "Mardi", available: true, startTime: "09:00", endTime: "18:00" },
  { day: 2, dayName: "Mercredi", available: true, startTime: "09:00", endTime: "18:00" },
  { day: 3, dayName: "Jeudi", available: true, startTime: "09:00", endTime: "18:00" },
  { day: 4, dayName: "Vendredi", available: true, startTime: "09:00", endTime: "16:00" },
  { day: 5, dayName: "Samedi", available: false, startTime: "10:00", endTime: "13:00" },
  { day: 6, dayName: "Dimanche", available: false, startTime: "10:00", endTime: "13:00" },
];

export const DEMO_NOTIFICATION_SETTINGS: NotificationSetting[] = [
  { id: "n1", label: "Nouvelle commande", category: "Commandes", email: true, push: true, sms: false },
  { id: "n2", label: "Commande livree", category: "Commandes", email: true, push: true, sms: false },
  { id: "n3", label: "Revision demandee", category: "Commandes", email: true, push: true, sms: true },
  { id: "n4", label: "Nouveau message", category: "Messages", email: false, push: true, sms: false },
  { id: "n5", label: "Paiement recu", category: "Finances", email: true, push: true, sms: true },
  { id: "n6", label: "Retrait traite", category: "Finances", email: true, push: false, sms: false },
  { id: "n7", label: "Nouvelle candidature", category: "Candidatures", email: true, push: true, sms: false },
  { id: "n8", label: "Avis recu", category: "Avis", email: true, push: true, sms: false },
  { id: "n9", label: "Rappel de delai", category: "Commandes", email: true, push: true, sms: true },
];

export const DEMO_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Gratuit",
    price: 0,
    commission: 20,
    features: ["3 services actifs", "5 candidatures/mois", "Support email", "Profil public"],
    servicesLimit: 3,
    candidaturesLimit: 5,
    boostLimit: 0,
    current: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 15,
    commission: 15,
    features: ["15 services actifs", "20 candidatures/mois", "1 boost/mois", "Certifications IA", "Support prioritaire", "Badge Pro"],
    servicesLimit: 15,
    candidaturesLimit: 20,
    boostLimit: 1,
    current: true,
  },
  {
    id: "business",
    name: "Business",
    price: 45,
    commission: 10,
    features: ["Services illimites", "Candidatures illimitees", "5 boosts/mois", "Cles API", "Analytics avances", "Badge Business", "Support dedie"],
    servicesLimit: null,
    candidaturesLimit: null,
    boostLimit: 5,
    current: false,
  },
];

// Revenue data for charts
export const MONTHLY_REVENUE: { month: string; revenue: number; orders: number }[] = [];

export const WEEKLY_ORDERS: { week: string; orders: number }[] = [];

export const PROFILE_VIEWS: { date: string; views: number }[] = [];

export const TRAFFIC_SOURCES: { name: string; value: number; color: string }[] = [];

export const INVOICES: { id: string; date: string; amount: number; description: string; status: "payee" | "en_attente" }[] = [];
