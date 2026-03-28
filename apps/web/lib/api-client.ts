/**
 * API Client — Fonctions d'accès aux API routes FreelanceHigh
 * Utilisé par les composants et les stores pour communiquer avec le backend.
 */

// ── Types de réponse API (mappés depuis StoredService, etc.) ──

export interface ApiService {
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
    basic: { name: string; price: number; deliveryDays: number; revisions: number; description: string };
    standard: { name: string; price: number; deliveryDays: number; revisions: number; description: string };
    premium: { name: string; price: number; deliveryDays: number; revisions: number; description: string };
  };
  options: unknown[];
  images: string[];
  mainImage: string;
  videoUrl: string;
  status: string;
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

export interface ApiOrder {
  id: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  clientCountry: string;
  freelanceId: string;
  freelanceName: string;
  status: string;
  amount: number;
  commission: number;
  packageType: string;
  deadline: string;
  deliveredAt: string | null;
  completedAt: string | null;
  progress: number;
  revisionsLeft: number;
  messages: { id: string; sender: string; senderName: string; content: string; timestamp: string; type: string; fileName?: string; fileSize?: string }[];
  timeline: { id: string; type: string; title: string; description: string; timestamp: string }[];
  files: { id: string; name: string; size: string; type: string; uploadedBy: string; uploadedAt: string; url: string }[];
  escrowStatus?: string;
  platformFee?: number;
  freelancerPayout?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTransaction {
  id: string;
  userId: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  orderId?: string;
  method?: string;
}

export interface ApiNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface ApiConversation {
  id: string;
  participants: string[];
  contactName: string;
  contactAvatar: string;
  contactRole: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
  orderId?: string;
  messages: { id: string; senderId: string; sender: string; content: string; timestamp: string; type: string; fileName?: string; fileSize?: string; read: boolean }[];
}

export interface ApiProfile {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  photo: string;
  title: string;
  bio: string;
  city: string;
  country: string;
  hourlyRate: number;
  skills: { name: string; level: string }[];
  languages: { name: string; level: string }[];
  links: { linkedin: string; github: string; portfolio: string; behance: string };
  completionPercent: number;
  badges: string[];
  availability: { day: number; dayName: string; available: boolean; startTime: string; endTime: string }[];
  vacationMode: boolean;
}

export interface ApiFinanceSummary {
  available: number;
  pending: number;
  totalEarned: number;
  commissionThisMonth: number;
  totalSpent?: number;
}

export interface ApiStats {
  summary: ApiFinanceSummary;
  monthlyRevenue: { month: string; revenue: number; orders: number }[];
  activeOrders: number;
  completedOrders: number;
  totalOrders: number;
  avgRating: number;
  viewsThisMonth: number;
  conversionRate: number;
  servicesCount: { total: number; active: number; paused: number; draft: number; pending: number };
  revenueThisMonth: number;
  totalReviews: number;
  avgQualite: number;
  avgCommunication: number;
  avgDelai: number;
  weeklyOrders: { week: string; orders: number }[];
  profileViews: { date: string; views: number }[];
}

export interface ApiReview {
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

export interface ApiReviewSummary {
  totalReviews: number;
  avgRating: number;
  avgQualite: number;
  avgCommunication: number;
  avgDelai: number;
  starDistribution: { stars: number; count: number; percent: number }[];
}

// ── API Client ──

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API Error ${res.status}`);
  }
  return res.json();
}

// ── Services ──

export const servicesApi = {
  list: () => fetchApi<ApiService[]>("/api/services"),

  get: (id: string) => fetchApi<ApiService>(`/api/services/${id}`),

  create: (data: Record<string, unknown>) =>
    fetchApi<ApiService>("/api/services", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi<ApiService>(`/api/services/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/services/${id}`, { method: "DELETE" }),

  toggle: (id: string) =>
    fetchApi<ApiService>(`/api/services/${id}/toggle`, { method: "POST" }),

  boost: (id: string, tier: string) =>
    fetchApi<unknown>(`/api/services/${id}/boost`, { method: "POST", body: JSON.stringify({ tier }) }),

  getBoost: (id: string) =>
    fetchApi<unknown>(`/api/services/${id}/boost`),

  getSeo: (id: string) =>
    fetchApi<unknown>(`/api/services/${id}/seo`),

  updateSeo: (id: string, data: Record<string, unknown>) =>
    fetchApi<unknown>(`/api/services/${id}/seo`, { method: "PATCH", body: JSON.stringify(data) }),
};

// ── Orders ──

export const ordersApi = {
  list: (status?: string) => {
    const url = status ? `/api/orders?status=${status}` : "/api/orders";
    return fetchApi<{ orders: ApiOrder[] }>(url);
  },

  get: (id: string) => fetchApi<{ order: ApiOrder }>(`/api/orders/${id}`).then((r) => r.order),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi<{ order: ApiOrder }>(`/api/orders/${id}`, { method: "PATCH", body: JSON.stringify(data) }).then((r) => r.order),

  sendMessage: (id: string, data: { content: string; type?: string; fileName?: string; fileSize?: string }) =>
    fetchApi<{ order: ApiOrder }>(`/api/orders/${id}/messages`, { method: "POST", body: JSON.stringify(data) }).then((r) => r.order),
};

// ── Finances ──

export const financesApi = {
  summary: () => fetchApi<ApiFinanceSummary>("/api/finances/summary"),

  transactions: () => fetchApi<{ transactions: ApiTransaction[] }>("/api/finances/transactions"),

  withdrawal: (data: { amount: number; method: string; details?: string }) =>
    fetchApi<{ transaction: ApiTransaction }>("/api/finances/withdrawal", { method: "POST", body: JSON.stringify(data) }),
};

// ── Profile ──

export const profileApi = {
  get: async (): Promise<ApiProfile> => {
    const res = await fetchApi<{ profile: ApiProfile } | ApiProfile>("/api/profile");
    // Handle both { profile: {...} } and direct {...} response shapes
    return "profile" in res && res.profile ? res.profile : res as ApiProfile;
  },

  update: async (data: Record<string, unknown>): Promise<ApiProfile> => {
    const res = await fetchApi<{ profile: ApiProfile } | ApiProfile>("/api/profile", { method: "PATCH", body: JSON.stringify(data) });
    return "profile" in res && res.profile ? res.profile : res as ApiProfile;
  },
};

// ── Notifications ──

export const notificationsApi = {
  list: () => fetchApi<{ notifications: ApiNotification[]; unreadCount: number }>("/api/notifications"),

  markRead: (id: string) =>
    fetchApi<unknown>("/api/notifications", { method: "POST", body: JSON.stringify({ id }) }),

  markAllRead: () =>
    fetchApi<unknown>("/api/notifications", { method: "POST", body: JSON.stringify({ all: true }) }),
};

// ── Stats ──

export const statsApi = {
  get: () => fetchApi<ApiStats>("/api/stats"),
};

// ── Reviews ──

export const reviewsApi = {
  getByFreelance: (freelanceId?: string) => {
    const url = freelanceId ? `/api/reviews?freelanceId=${freelanceId}` : "/api/reviews";
    return fetchApi<{ reviews: ApiReview[]; summary: ApiReviewSummary }>(url);
  },

  getByClient: () =>
    fetchApi<{ reviews: ApiReview[]; summary: ApiReviewSummary }>("/api/reviews?role=client"),

  getByService: (serviceId: string) =>
    fetchApi<{ reviews: ApiReview[]; summary: ApiReviewSummary }>(`/api/reviews?serviceId=${serviceId}`),

  getByOrder: (orderId: string) =>
    fetchApi<{ reviews: ApiReview[]; summary: ApiReviewSummary }>(`/api/reviews?orderId=${orderId}`),

  create: (data: { orderId: string; qualite: number; communication: number; delai: number; comment?: string }) =>
    fetchApi<{ review: ApiReview }>("/api/reviews", { method: "POST", body: JSON.stringify(data) }),

  reply: (reviewId: string, reply: string) =>
    fetchApi<{ review: ApiReview }>(`/api/reviews/${reviewId}/reply`, { method: "POST", body: JSON.stringify({ reply }) }),

  report: (reviewId: string) =>
    fetchApi<{ review: ApiReview }>(`/api/reviews/${reviewId}/report`, { method: "POST" }),

  markHelpful: (reviewId: string) =>
    fetchApi<{ review: ApiReview }>(`/api/reviews/${reviewId}/helpful`, { method: "POST" }),
};

// ── Projects ──

export const projectsApi = {
  list: () => fetchApi<{ projects: Record<string, unknown>[] }>("/api/projects"),

  create: (data: Record<string, unknown>) =>
    fetchApi<{ project: Record<string, unknown> }>("/api/projects", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    fetchApi<{ project: Record<string, unknown> }>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/projects/${id}`, { method: "DELETE" }),
};

// ── Candidatures ──

export const candidaturesApi = {
  list: () => fetchApi<{ candidatures: Record<string, unknown>[] }>("/api/candidatures"),

  getByProject: (projectId: string) =>
    fetchApi<{ candidatures: Record<string, unknown>[] }>(`/api/projects/${projectId}/bids`),

  accept: (id: string) =>
    fetchApi<unknown>(`/api/candidatures/${id}/accept`, { method: "POST" }),

  reject: (id: string) =>
    fetchApi<unknown>(`/api/candidatures/${id}/refuse`, { method: "POST" }),
};

// ── Offres (proposals received by client) ──

export const offresApi = {
  list: () => fetchApi<{ offres: Record<string, unknown>[] }>("/api/offres"),

  accept: (id: string) =>
    fetchApi<unknown>(`/api/offres/${id}/accept`, { method: "POST" }),

  reject: (id: string) =>
    fetchApi<unknown>(`/api/offres/${id}/refuse`, { method: "POST" }),
};

// ── Affiliation ──

export interface ApiAffiliationTier {
  id: string;
  name: string;
  range: string;
  icon: string;
  gradient: string;
  status: "unlocked" | "current" | "locked";
  statusLabel: string;
  benefits: string[];
}

export interface ApiAffiliationReward {
  id: string;
  reward: string;
  date: string;
  status: "verse" | "active" | "en_attente";
  value: string;
}

export interface ApiAffiliationFriend {
  id: string;
  name: string;
  date: string;
  gender: string;
  status: "active" | "pending";
}

export interface ApiAffiliationData {
  referralLink: string;
  currentTier: string;
  totalReferrals: number;
  totalEarnings: number;
  conversionRate: number;
  progressToNext: number;
  nextTier: string;
  nextTierThreshold: number;
  tiers: ApiAffiliationTier[];
  rewards: ApiAffiliationReward[];
  invitedFriends: ApiAffiliationFriend[];
}

export const affiliationApi = {
  get: () => fetchApi<ApiAffiliationData>("/api/affiliation"),

  invite: (email: string, message?: string) =>
    fetchApi<{ success: boolean; message: string }>("/api/affiliation", {
      method: "POST",
      body: JSON.stringify({ action: "invite", email, message }),
    }),
};

// ── Automation ──

export interface ApiAutomationTrigger {
  id: string;
  icon: string;
  label: string;
  category: string;
}

export interface ApiAutomationCondition {
  id: string;
  icon: string;
  label: string;
  valueType: "number" | "select" | "text";
  options?: string[];
}

export interface ApiAutomationAction {
  id: string;
  icon: string;
  label: string;
  hasMessage?: boolean;
}

export interface ApiAutomationScenario {
  id: string;
  name: string;
  active: boolean;
  trigger: ApiAutomationTrigger;
  conditions: { condition: ApiAutomationCondition; value: string }[];
  actions: { action: ApiAutomationAction; message?: string }[];
  triggerCount: number;
  lastTriggered?: string;
  createdAt: string;
}

export interface ApiAutomationData {
  triggers: ApiAutomationTrigger[];
  conditions: ApiAutomationCondition[];
  actions: ApiAutomationAction[];
  scenarios: ApiAutomationScenario[];
}

export interface ApiAutomationHistoryEntry {
  id: string;
  scenarioId: string;
  scenarioName: string;
  action: string;
  time: string;
  badge: string;
}

export const automationApi = {
  get: () => fetchApi<ApiAutomationData>("/api/automation"),

  createScenario: (scenario: Omit<ApiAutomationScenario, "id" | "triggerCount" | "createdAt">) =>
    fetchApi<{ scenario: ApiAutomationScenario }>("/api/automation", {
      method: "POST",
      body: JSON.stringify({ action: "create", scenario }),
    }),

  updateScenario: (id: string, scenario: Omit<ApiAutomationScenario, "id" | "triggerCount" | "createdAt">) =>
    fetchApi<{ scenario: ApiAutomationScenario }>("/api/automation", {
      method: "POST",
      body: JSON.stringify({ action: "update", id, scenario }),
    }),

  duplicateScenario: (id: string) =>
    fetchApi<{ scenario: ApiAutomationScenario }>("/api/automation", {
      method: "POST",
      body: JSON.stringify({ action: "duplicate", id }),
    }),

  toggleScenario: (id: string, active: boolean) =>
    fetchApi<{ success: boolean }>("/api/automation", {
      method: "POST",
      body: JSON.stringify({ action: "toggle", id, active }),
    }),

  deleteScenario: (id: string) =>
    fetchApi<{ success: boolean }>("/api/automation", {
      method: "POST",
      body: JSON.stringify({ action: "delete", id }),
    }),

  history: () =>
    fetchApi<{ history: ApiAutomationHistoryEntry[] }>("/api/automation", {
      method: "POST",
      body: JSON.stringify({ action: "history" }),
    }),
};

// ── Productivite ──

export interface ApiProductiviteSession {
  id: string;
  label: string;
  start: string;
  end: string | null;
  durationSeconds: number;
  status: "running" | "paused" | "stopped";
  amount: number;
  date: string;
}

export const productiviteApi = {
  getSessions: (date?: string) => {
    const url = date ? `/api/productivite?date=${date}` : "/api/productivite";
    return fetchApi<{ sessions: ApiProductiviteSession[] }>(url);
  },

  startSession: (label: string) =>
    fetchApi<{ session: ApiProductiviteSession }>("/api/productivite", {
      method: "POST",
      body: JSON.stringify({ action: "start", label }),
    }),

  pauseSession: (id: string) =>
    fetchApi<{ session: ApiProductiviteSession }>("/api/productivite", {
      method: "POST",
      body: JSON.stringify({ action: "pause", id }),
    }),

  resumeSession: (id: string) =>
    fetchApi<{ session: ApiProductiviteSession }>("/api/productivite", {
      method: "POST",
      body: JSON.stringify({ action: "resume", id }),
    }),

  stopSession: (id: string) =>
    fetchApi<{ session: ApiProductiviteSession }>("/api/productivite", {
      method: "POST",
      body: JSON.stringify({ action: "stop", id }),
    }),
};

// ── Certifications ──

export interface ApiCertification {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  questionCount: number;
  passingScore: number;
  durationMinutes: number;
}

export interface ApiCertificationQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
}

export interface ApiCertificationResult {
  id: string;
  certificationId: string;
  certificationName?: string;
  certificationCategory?: string;
  score: number;
  passed: boolean;
  date: string;
  answers: number[];
  totalQuestions?: number;
  correctCount?: number;
  questionResults?: {
    questionId: string;
    question: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
  certificateId?: string | null;
}

export const certificationsApi = {
  list: () => fetchApi<{ certifications: ApiCertification[]; results: ApiCertificationResult[] }>("/api/certifications"),

  getQuestions: (certId: string) =>
    fetchApi<{ questions: ApiCertificationQuestion[] }>(`/api/certifications/${certId}/questions`),

  submitResult: (certId: string, answers: number[]) =>
    fetchApi<{ result: ApiCertificationResult }>("/api/certifications", {
      method: "POST",
      body: JSON.stringify({ action: "submit", certificationId: certId, answers }),
    }),
};

// ── Favorites ──

export interface ApiFavorite {
  id: string;
  targetId: string;
  type: "freelance" | "service" | "agence";
  name: string;
  avatar: string;
  rating: number;
  specialty: string;
  addedAt: string;
}

export const favoritesApi = {
  list: () => fetchApi<{ favorites: ApiFavorite[] }>("/api/favorites"),

  add: (data: { targetId: string; type: string; name: string; avatar: string; rating: number; specialty: string }) =>
    fetchApi<{ success: boolean; favorite: ApiFavorite }>("/api/favorites", { method: "POST", body: JSON.stringify(data) }),

  remove: (targetId: string, type: string) =>
    fetchApi<{ success: boolean }>("/api/favorites", { method: "POST", body: JSON.stringify({ action: "remove", targetId, type }) }),
};

// ── Payment Methods ──

export interface ApiPaymentMethod {
  id: string;
  type: "card" | "momo" | "bank" | "paypal";
  label: string;
  last4?: string;
  brand?: string;
  provider?: string;
  phone?: string;
  email?: string;
  bankName?: string;
  iban?: string;
  expiresAt?: string;
  isDefault: boolean;
  createdAt: string;
}

export const paymentMethodsApi = {
  list: () => fetchApi<{ methods: ApiPaymentMethod[] }>("/api/payment-methods"),

  add: (data: Record<string, unknown>) =>
    fetchApi<{ success: boolean; method: ApiPaymentMethod }>("/api/payment-methods", { method: "POST", body: JSON.stringify(data) }),

  remove: (id: string) =>
    fetchApi<{ success: boolean }>("/api/payment-methods", { method: "POST", body: JSON.stringify({ action: "delete", id }) }),

  setDefault: (id: string) =>
    fetchApi<{ success: boolean }>("/api/payment-methods", { method: "POST", body: JSON.stringify({ action: "set-default", id }) }),
};

// ── Support Tickets ──

export interface ApiSupportTicket {
  id: string;
  subject: string;
  category: string;
  message: string;
  priority: "basse" | "normale" | "haute" | "urgente";
  status: "ouvert" | "en_cours" | "resolu" | "ferme";
  responses: { id: string; from: "support" | "user"; message: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export const supportTicketsApi = {
  list: () => fetchApi<{ tickets: ApiSupportTicket[] }>("/api/support-tickets"),

  create: (data: { subject: string; category: string; message: string; priority?: string }) =>
    fetchApi<{ success: boolean; ticket: ApiSupportTicket }>("/api/support-tickets", { method: "POST", body: JSON.stringify(data) }),

  reply: (ticketId: string, message: string) =>
    fetchApi<{ success: boolean; ticket: ApiSupportTicket }>("/api/support-tickets", { method: "POST", body: JSON.stringify({ action: "reply", ticketId, message }) }),
};

// ── Sessions ──

export interface ApiSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  isCurrent: boolean;
  lastActive: string;
  createdAt: string;
}

export const sessionsApi = {
  list: () => fetchApi<{ sessions: ApiSession[] }>("/api/sessions"),

  revoke: (sessionId: string) =>
    fetchApi<{ success: boolean }>("/api/sessions", { method: "POST", body: JSON.stringify({ action: "revoke", sessionId }) }),

  revokeAll: () =>
    fetchApi<{ success: boolean }>("/api/sessions", { method: "POST", body: JSON.stringify({ action: "revoke-all" }) }),
};

// ── Search (semantic/keyword) ──

export interface ApiSearchResult {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  reviews: number;
  hourlyRate: number;
  location: string;
  skills: string[];
  bio: string;
  completionRate: number;
  responseTime: string;
  matchScore: number;
  type: "freelance" | "agence" | "service";
  description?: string;
}

export const searchApi = {
  search: (params: { q: string; skills?: string[]; budget?: number; type?: string }) => {
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    if (params.skills?.length) sp.set("skills", params.skills.join(","));
    if (params.budget) sp.set("budget", params.budget.toString());
    if (params.type) sp.set("type", params.type);
    return fetchApi<{ results: ApiSearchResult[]; entities: { skills: string[]; budget: number | null; type: string | null } }>(`/api/search?${sp.toString()}`);
  },
};

// ── File Upload ──

export const uploadApi = {
  file: async (file: File, context?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (context) formData.append("context", context);
    const res = await fetch("/api/upload/file", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    return res.json() as Promise<{ success: boolean; file: { id: string; name: string; size: number; type: string; url: string; uploadedAt: string } }>;
  },
};

// ── Invoices ──

export const invoicesApi = {
  sendByEmail: (invoiceId: string) =>
    fetchApi<{ success: boolean }>(`/api/invoices/${invoiceId}/email`, { method: "POST" }),
};

// ── Feed ──

export const feedApi = {
  list: (params?: { q?: string; category?: string; minPrice?: number; maxPrice?: number; sort?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set("q", params.q);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.minPrice) searchParams.set("minPrice", params.minPrice.toString());
    if (params?.maxPrice) searchParams.set("maxPrice", params.maxPrice.toString());
    if (params?.sort) searchParams.set("sort", params.sort);
    const qs = searchParams.toString();
    return fetchApi<{ services: ApiService[] }>(`/api/feed${qs ? `?${qs}` : ""}`);
  },
};

// ── Conversations ──

export const conversationsApi = {
  list: () => fetchApi<{ conversations: ApiConversation[] }>("/api/conversations"),

  getMessages: (id: string) => fetchApi<{ messages: ApiConversation["messages"] }>(`/api/conversations/${id}/messages`),

  sendMessage: (id: string, data: { content: string; type?: string; fileName?: string; fileSize?: string }) =>
    fetchApi<unknown>(`/api/conversations/${id}/messages`, { method: "POST", body: JSON.stringify(data) }),

  markRead: (id: string) =>
    fetchApi<unknown>(`/api/conversations/${id}/read`, { method: "POST" }),

  create: (data: { participantId: string; contactName: string; contactAvatar?: string; contactRole?: string; orderId?: string }) =>
    fetchApi<{ conversation: ApiConversation }>("/api/conversations", { method: "POST", body: JSON.stringify(data) }),
};

// ── Propositions ──

export interface ApiProposition {
  id: string;
  serviceId: string;
  freelanceId: string;
  clientId: string;
  projectId: string | null;
  title: string;
  description: string;
  amount: number;
  deliveryDays: number;
  revisions: number;
  status: string;
  viewedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  expiresAt: string | null;
  orderId: string | null;
  service?: { id: string; title: string; slug?: string; images?: string[] };
  freelance?: { id: string; name: string; image?: string | null };
  client?: { id: string; name: string; image?: string | null };
  order?: { id: string; status: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const propositionsApi = {
  list: (role?: "freelance" | "client") => {
    const url = role ? `/api/propositions?role=${role}` : "/api/propositions";
    return fetchApi<{ propositions: ApiProposition[] }>(url);
  },

  get: (id: string) =>
    fetchApi<{ proposition: ApiProposition }>(`/api/propositions/${id}`).then((r) => r.proposition),

  create: (data: { serviceId: string; clientId: string; projectId?: string; title?: string; description?: string; amount?: number; deliveryDays?: number; revisions?: number }) =>
    fetchApi<{ proposition: ApiProposition }>("/api/propositions", { method: "POST", body: JSON.stringify(data) }),

  accept: (id: string) =>
    fetchApi<{ success: boolean; orderId: string }>(`/api/propositions/${id}`, { method: "PATCH", body: JSON.stringify({ action: "accept" }) }),

  reject: (id: string) =>
    fetchApi<{ success: boolean }>(`/api/propositions/${id}`, { method: "PATCH", body: JSON.stringify({ action: "reject" }) }),
};

// ── Service Tracking ──

export const trackingApi = {
  trackView: (serviceId: string) =>
    fetchApi<{ success: boolean }>(`/api/services/${serviceId}/track-view`, { method: "POST" }),

  trackClick: (serviceId: string) =>
    fetchApi<{ success: boolean }>(`/api/services/${serviceId}/track-click`, { method: "POST" }),
};

// ── Wallet (Freelance & Agency) ──

export interface ApiWallet {
  id: string;
  balance: number;
  pending: number;
  totalEarned: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiWalletTransaction {
  id: string;
  freelanceWalletId: string | null;
  agencyWalletId: string | null;
  type: string;
  amount: number;
  description: string;
  status: string;
  orderId: string | null;
  withdrawalMethod: string | null;
  externalRef: string | null;
  createdAt: string;
}

export const walletApi = {
  get: (section?: "transactions") => {
    const url = section ? `/api/wallet?section=${section}` : "/api/wallet";
    return fetchApi<{ wallet: ApiWallet; transactions: ApiWalletTransaction[] }>(url);
  },

  withdraw: (amount: number, method: string, details?: string) =>
    fetchApi<{ wallet?: ApiWallet; transaction: ApiWalletTransaction }>("/api/wallet", {
      method: "POST",
      body: JSON.stringify({ amount, method, details }),
    }),
};

// ── Admin Wallet ──

export interface ApiAdminWallet {
  id: string;
  totalFeesHeld: number;
  totalFeesReleased: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiAdminTransaction {
  id: string;
  adminWalletId: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  orderId: string | null;
  boostId: string | null;
  status: string;
  createdAt: string;
}

export interface ApiAdminPayout {
  id: string;
  adminWalletId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export const adminWalletApi = {
  get: (section?: "transactions" | "payouts") => {
    const url = section ? `/api/admin/wallet?section=${section}` : "/api/admin/wallet";
    return fetchApi<{ wallet: ApiAdminWallet; transactions?: ApiAdminTransaction[]; payouts?: ApiAdminPayout[] }>(url);
  },

  createPayout: (amount: number, method: string) =>
    fetchApi<{ payout: ApiAdminPayout }>("/api/admin/wallet", { method: "POST", body: JSON.stringify({ amount, method }) }),
};

// ── Agency Team Members ──

export interface ApiAgencyTeamMember {
  id: string;
  agencyId: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: string;
  activeOrders: number;
  revenue: number;
  joinedAt: string;
}

export const agencyTeamApi = {
  list: () =>
    fetchApi<{ members: ApiAgencyTeamMember[] }>("/api/agence/equipe"),

  invite: (email: string, role: string) =>
    fetchApi<{ success: boolean; member: ApiAgencyTeamMember; message: string }>("/api/agence/equipe", {
      method: "POST",
      body: JSON.stringify({ email, role }),
    }),

  updateRole: (memberId: string, role: string) =>
    fetchApi<{ success: boolean }>(`/api/agence/equipe/${memberId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  remove: (memberId: string) =>
    fetchApi<{ success: boolean }>(`/api/agence/equipe/${memberId}`, {
      method: "DELETE",
    }),
};

// ── Type Mappers (API types → local store types) ──

import type { Service, Order, Transaction, Conversation, ChatMessage } from "@/lib/demo-data";

export function mapApiServiceToLocal(s: ApiService): Service {
  const pkgs = s.packages || {} as ApiService["packages"];
  const basic = pkgs.basic || { name: "Basique", price: s.basePrice || 0, deliveryDays: s.deliveryDays || 7, revisions: 1, description: "" };
  const standard = pkgs.standard || { name: "Standard", price: Math.round((s.basePrice || 0) * 1.8), deliveryDays: s.deliveryDays || 7, revisions: 3, description: "" };
  const premium = pkgs.premium || { name: "Premium", price: Math.round((s.basePrice || 0) * 3), deliveryDays: s.deliveryDays || 7, revisions: 5, description: "" };
  const images = s.images || [];

  return {
    id: s.id,
    title: s.title,
    category: s.categoryName || "",
    subcategory: s.subCategoryName || "",
    description: s.descriptionText || "",
    tags: s.tags || [],
    price: s.basePrice || 0,
    deliveryDays: s.deliveryDays || 7,
    revisions: s.revisions || 1,
    status: (s.status || "en_attente").toLowerCase() as Service["status"],
    views: s.views || 0,
    clicks: s.clicks || 0,
    orders: s.orderCount || 0,
    revenue: s.revenue || 0,
    conversionRate: (s.clicks || 0) > 0 ? Math.round(((s.orderCount || 0) / s.clicks) * 100 * 10) / 10 : 0,
    image: s.mainImage || images[0] || "",
    createdAt: (s.createdAt || new Date().toISOString()).slice(0, 10),
    packages: {
      basic: { name: basic.name, price: basic.price, delivery: basic.deliveryDays, revisions: basic.revisions, description: basic.description || "" },
      standard: { name: standard.name, price: standard.price, delivery: standard.deliveryDays, revisions: standard.revisions, description: standard.description || "" },
      premium: { name: premium.name, price: premium.price, delivery: premium.deliveryDays, revisions: premium.revisions, description: premium.description || "" },
    },
    faq: s.faq || [],
    extras: s.extras || [],
    isBoosted: s.isBoosted || false,
    rating: s.rating || 0,
    ratingCount: s.ratingCount || 0,
    totalContacts: (s as unknown as Record<string, unknown>).totalContacts as number || 0,
    slug: s.slug || "",
  };
}

export function mapApiOrderToLocal(o: ApiOrder): Order {
  return {
    id: o.id,
    serviceId: o.serviceId,
    serviceTitle: o.serviceTitle,
    category: o.category,
    clientName: o.clientName || "Client",
    clientAvatar: o.clientAvatar,
    clientCountry: o.clientCountry,
    freelanceName: o.freelanceName || "Freelance",
    status: (o.status || "en_attente").toLowerCase() as Order["status"],
    amount: o.amount,
    createdAt: (o.createdAt || new Date().toISOString()).slice(0, 10),
    deadline: (o.deadline || new Date().toISOString()).slice(0, 10),
    deliveredAt: o.deliveredAt,
    packageType: o.packageType as Order["packageType"],
    progress: o.progress,
    revisionsLeft: o.revisionsLeft,
    messages: (o.messages || []).map((m) => ({
      id: m.id,
      sender: m.sender as "freelance" | "client",
      senderName: m.senderName || "",
      content: m.content || "",
      timestamp: m.timestamp || "",
      type: (m.type || "text") as "text" | "file" | "system",
      fileName: m.fileName,
      fileSize: m.fileSize,
    })),
    timeline: (o.timeline || []).map((t) => ({
      id: t.id,
      type: (t.type || "message") as "created" | "started" | "delivered" | "revision" | "completed" | "cancelled" | "message",
      title: t.title || "",
      description: t.description || "",
      timestamp: t.timestamp || "",
    })),
    files: (o.files || []).map((f) => ({
      id: f.id,
      name: f.name || "",
      size: f.size || "",
      type: f.type || "file",
      uploadedBy: (f.uploadedBy || "freelance") as "freelance" | "client",
      uploadedAt: f.uploadedAt || "",
      url: f.url || "#",
    })),
  };
}

export function mapApiTransactionToLocal(t: ApiTransaction): Transaction {
  return {
    id: t.id,
    type: t.type as Transaction["type"],
    description: t.description,
    amount: t.amount,
    status: t.status as Transaction["status"],
    date: t.date,
    orderId: t.orderId,
    method: t.method,
  };
}

export function mapApiConversationToLocal(c: ApiConversation): Conversation {
  return {
    id: c.id,
    contactName: c.contactName,
    contactAvatar: c.contactAvatar,
    contactRole: c.contactRole as Conversation["contactRole"],
    lastMessage: c.lastMessage,
    lastMessageTime: c.lastMessageTime,
    unread: c.unread,
    online: c.online,
    orderId: c.orderId,
    messages: c.messages.map((m) => ({
      id: m.id,
      sender: m.sender as ChatMessage["sender"],
      content: m.content,
      timestamp: m.timestamp,
      type: m.type as ChatMessage["type"],
      fileName: m.fileName,
      fileSize: m.fileSize,
      read: m.read,
    })),
  };
}
