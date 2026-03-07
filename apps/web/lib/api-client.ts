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
  get: () => fetchApi<ApiProfile>("/api/profile"),

  update: (data: Record<string, unknown>) =>
    fetchApi<ApiProfile>("/api/profile", { method: "PATCH", body: JSON.stringify(data) }),
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
};

// ── Type Mappers (API types → local store types) ──

import type { Service, Order, Transaction, Conversation, ChatMessage } from "@/lib/demo-data";

export function mapApiServiceToLocal(s: ApiService): Service {
  return {
    id: s.id,
    title: s.title,
    category: s.categoryName,
    subcategory: s.subCategoryName,
    description: s.descriptionText || "",
    tags: s.tags,
    price: s.basePrice,
    deliveryDays: s.deliveryDays,
    revisions: s.revisions,
    status: s.status as Service["status"],
    views: s.views,
    clicks: s.clicks,
    orders: s.orderCount,
    revenue: s.revenue,
    conversionRate: s.clicks > 0 ? Math.round((s.orderCount / s.clicks) * 100 * 10) / 10 : 0,
    image: s.mainImage || s.images[0] || "",
    createdAt: s.createdAt.slice(0, 10),
    packages: {
      basic: { name: s.packages.basic.name, price: s.packages.basic.price, delivery: s.packages.basic.deliveryDays, revisions: s.packages.basic.revisions, description: s.packages.basic.description },
      standard: { name: s.packages.standard.name, price: s.packages.standard.price, delivery: s.packages.standard.deliveryDays, revisions: s.packages.standard.revisions, description: s.packages.standard.description },
      premium: { name: s.packages.premium.name, price: s.packages.premium.price, delivery: s.packages.premium.deliveryDays, revisions: s.packages.premium.revisions, description: s.packages.premium.description },
    },
    faq: s.faq,
    extras: s.extras,
  };
}

export function mapApiOrderToLocal(o: ApiOrder): Order {
  return {
    id: o.id,
    serviceId: o.serviceId,
    serviceTitle: o.serviceTitle,
    category: o.category,
    clientName: o.clientName,
    clientAvatar: o.clientAvatar,
    clientCountry: o.clientCountry,
    status: o.status as Order["status"],
    amount: o.amount,
    createdAt: o.createdAt.slice(0, 10),
    deadline: o.deadline.slice(0, 10),
    deliveredAt: o.deliveredAt,
    packageType: o.packageType as Order["packageType"],
    progress: o.progress,
    revisionsLeft: o.revisionsLeft,
    messages: o.messages.map((m) => ({
      id: m.id,
      sender: m.sender as "freelance" | "client",
      senderName: m.senderName,
      content: m.content,
      timestamp: m.timestamp,
      type: m.type as "text" | "file" | "system",
      fileName: m.fileName,
      fileSize: m.fileSize,
    })),
    timeline: o.timeline.map((t) => ({
      id: t.id,
      type: t.type as "created" | "started" | "delivered" | "revision" | "completed" | "cancelled" | "message",
      title: t.title,
      description: t.description,
      timestamp: t.timestamp,
    })),
    files: o.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedBy: f.uploadedBy as "freelance" | "client",
      uploadedAt: f.uploadedAt,
      url: f.url,
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
