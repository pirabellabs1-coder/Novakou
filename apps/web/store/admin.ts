"use client";

import { create } from "zustand";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  users: { totalUsers: number; freelances: number; clients: number; agencies: number };
  orders: { total: number; active: number; completed: number; gmv: number; byStatus: Record<string, number> };
  services: { total: number; pendingModeration: number; active: number; paused: number; refused: number };
  finances: { platformRevenue: number; escrowFunds: number; pendingWithdrawals: number; totalTransactions: number };
  disputes: { total: number };
  reviews: { total: number; avgRating: number; reported: number };
  crossSpace?: {
    activeFreelancers: number;
    activeClients: number;
    freelanceServices: number;
    agencyServices: number;
  };
  monthlyRevenue: { month: string; revenue: number; commission: number; orders: number }[];
  recentOrders: { id: string; serviceTitle: string; clientName: string; freelanceName: string; amount: number; status: string; createdAt: string }[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string }[];
  traffic?: {
    activeSessions: number;
    todayPageViews: number;
    todayUniques: number;
    avgSessionDuration: number;
    topPages: { path: string; views: number }[];
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  status: string;
  country: string;
  kycLevel: number;
  createdAt: string;
  lastLoginAt: string;
  ordersCount: number;
  revenue: number;
  totalSpent: number;
}

export interface AdminOrder {
  id: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  clientId: string;
  clientName: string;
  freelanceId: string;
  freelanceName: string;
  status: string;
  amount: number;
  commission: number;
  packageType: string;
  deadline: string;
  progress: number;
  messagesCount: number;
  filesCount: number;
  createdAt: string;
  updatedAt: string;
  // Full detail fields (only when fetching single order)
  messages?: unknown[];
  timeline?: unknown[];
  files?: unknown[];
}

export interface AdminTransaction {
  id: string;
  userId: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  date: string;
  method?: string;
  orderId?: string;
}

export interface AdminFinanceSummary {
  platformRevenue: number;
  escrowFunds: number;
  pendingWithdrawals: number;
  totalPayments: number;
  totalWithdrawn: number;
  totalRefunded: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  monthlyBreakdown: { month: string; revenue: number; commission: number; orders: number }[];
}

export interface AdminKycRequest {
  userId: string;
  name: string;
  email: string;
  role: string;
  currentLevel: number;
  nextLevel: number;
  createdAt: string;
  requestId?: string;
}

export interface AdminDispute {
  id: string;
  serviceTitle: string;
  clientId: string;
  clientName: string;
  freelanceId: string;
  freelanceName: string;
  amount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  timeline: { id: string; type: string; title: string; description: string; timestamp: string }[];
}

export interface AdminBlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  status: string;
  views: number;
  metaTitle: string;
  metaDescription: string;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  order: number;
  status: string;
  servicesCount: number;
}

export interface AdminConfig {
  maintenanceMode: boolean;
  enabledCurrencies: string[];
  defaultCurrency: string;
  enabledPaymentMethods: string[];
  commissions: Record<string, number>;
  plans: Record<string, { price: number; commission: number; maxServices: number; maxCandidatures: number; boostsPerMonth: number }>;
  announcementBanner: { enabled: boolean; message: string; type: string; dismissible: boolean };
  moderation: { autoApproveServices: boolean; requireKycForPublish: boolean; minKycLevel: number };
  languages: string[];
  supportEmail: string;
  platformName: string;
}

export interface AdminAnalytics {
  revenueByCategory: { category: string; revenue: number; orders: number; percentage: number }[];
  topCountries: { country: string; revenue: number; users: number; orders: number }[];
  registrationTrends: { month: string; freelances: number; clients: number; agencies: number; total: number }[];
  conversionFunnel: { step: string; count: number; rate: number }[];
  servicePerformance: { totalViews: number; totalClicks: number; avgCTR: number; avgConversion: number; avgRating: number; topServices: unknown[] };
  revenueTrends: { month: string; revenue: number; commission: number; orders: number }[];
  reviewStats: { distribution: { stars: number; count: number }[]; avgQualite: number; avgCommunication: number; avgDelai: number; reported: number };
  trafficAnalytics?: {
    pageViewsTrend: { date: string; views: number }[];
    sessionsTrend: { date: string; sessions: number }[];
    topReferrers: { referrer: string; count: number }[];
    utmBreakdown: { source: string; medium: string; count: number }[];
    deviceBreakdown: { mobile: number; tablet: number; desktop: number };
    bounceRate: number;
    avgSessionDuration: number;
    totalPageViews: number;
    uniqueVisitors: number;
    totalSessions: number;
  };
}

export interface AdminService {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId?: string;
  freelanceName: string;
  freelanceId: string;
  price: number;
  status: string;
  views: number;
  orders: number;
  rating: number;
  refuseReason?: string;
  createdAt: string;
}

export interface AdminAuditEntry {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId?: string;
  targetUserName?: string;
  details: string | Record<string, unknown>;
  createdAt: string;
}

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  adminRole: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

// ── API helpers ──

async function fetchAdmin<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `API Error ${res.status}`);
  }
  return res.json();
}

// ── Store ──────────────────────────────────────────────────────────────────

interface AdminState {
  loading: Record<string, boolean>;
  error: Record<string, string | null>;

  // Auto-refresh configuration (in milliseconds)
  refreshInterval: number;
  setRefreshInterval: (ms: number) => void;
  lastRefreshedAt: Record<string, number>;

  // Data
  dashboardStats: AdminDashboardStats | null;
  users: AdminUser[];
  orders: AdminOrder[];
  orderDetail: AdminOrder | null;
  transactions: AdminTransaction[];
  financeSummary: AdminFinanceSummary | null;
  kycRequests: AdminKycRequest[];
  kycSummary: { total: number; byLevel: Record<string, number> } | null;
  disputes: AdminDispute[];
  disputeSummary: { total: number; resolved: number; totalAmountInDispute: number } | null;
  blogArticles: AdminBlogArticle[];
  categories: AdminCategory[];
  config: AdminConfig | null;
  analytics: AdminAnalytics | null;
  auditLog: AdminAuditEntry[];
  services: AdminService[];
  teamMembers: AdminTeamMember[];

  // Sync actions
  syncDashboard: () => Promise<void>;
  syncUsers: () => Promise<void>;
  syncOrders: () => Promise<void>;
  syncOrderDetail: (id: string) => Promise<void>;
  syncServices: () => Promise<void>;
  syncFinances: () => Promise<void>;
  syncKyc: () => Promise<void>;
  syncDisputes: () => Promise<void>;
  syncBlog: () => Promise<void>;
  syncCategories: () => Promise<void>;
  syncConfig: () => Promise<void>;
  syncAnalytics: () => Promise<void>;
  syncAuditLog: () => Promise<void>;
  syncTeam: () => Promise<void>;

  // Team actions
  inviteMember: (data: { email: string; name: string; adminRole: string }) => Promise<boolean>;
  updateMemberRole: (memberId: string, adminRole: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;

  // User actions
  suspendUser: (userId: string) => Promise<boolean>;
  banUser: (userId: string) => Promise<boolean>;
  reactivateUser: (userId: string) => Promise<boolean>;
  changeUserRole: (userId: string, role: string) => Promise<boolean>;
  changeUserPlan: (userId: string, plan: string) => Promise<boolean>;

  // Order actions
  forceDelivery: (orderId: string) => Promise<boolean>;
  forceCancel: (orderId: string) => Promise<boolean>;
  releaseEscrow: (orderId: string) => Promise<boolean>;
  refundOrder: (orderId: string) => Promise<boolean>;

  // Service actions
  approveService: (serviceId: string) => Promise<boolean>;
  refuseService: (serviceId: string, reason: string) => Promise<boolean>;
  featureService: (serviceId: string) => Promise<boolean>;
  pauseService: (serviceId: string) => Promise<boolean>;
  deleteService: (serviceId: string) => Promise<boolean>;

  // Finance actions
  blockTransaction: (id: string) => Promise<boolean>;
  unblockTransaction: (id: string) => Promise<boolean>;
  approveTransaction: (id: string) => Promise<boolean>;

  // KYC actions
  approveKyc: (userId: string, level: number, requestId?: string) => Promise<boolean>;
  refuseKyc: (userId: string, reason: string, requestId?: string) => Promise<boolean>;

  // Dispute actions
  examineDispute: (orderId: string) => Promise<boolean>;
  resolveDispute: (orderId: string, verdict: string, resolution?: string) => Promise<boolean>;

  // Blog actions
  createArticle: (data: Record<string, unknown>) => Promise<boolean>;
  updateArticle: (id: string, data: Record<string, unknown>) => Promise<boolean>;
  deleteArticle: (id: string) => Promise<boolean>;

  // Config actions
  updateConfig: (data: Record<string, unknown>) => Promise<boolean>;

  // Notification actions
  sendNotification: (data: { title: string; message: string; type?: string; target?: Record<string, unknown>; channel?: string }) => Promise<{ success: boolean; count: number; failedEmails?: number; message?: string } | null>;
}

// Default auto-refresh interval: 30 seconds
export const DEFAULT_REFRESH_INTERVAL = 30_000;

export const useAdminStore = create<AdminState>()((set, get) => ({
  loading: {},
  error: {},
  refreshInterval: DEFAULT_REFRESH_INTERVAL,
  setRefreshInterval: (ms: number) => set({ refreshInterval: ms }),
  lastRefreshedAt: {},
  dashboardStats: null,
  users: [],
  orders: [],
  orderDetail: null,
  transactions: [],
  financeSummary: null,
  kycRequests: [],
  kycSummary: null,
  disputes: [],
  disputeSummary: null,
  blogArticles: [],
  categories: [],
  config: null,
  analytics: null,
  auditLog: [],
  services: [],
  teamMembers: [],

  // ── Sync actions ──

  syncDashboard: async () => {
    set({ loading: { ...get().loading, dashboard: true } });
    try {
      const stats = await fetchAdmin<AdminDashboardStats>("/api/admin/dashboard");
      set({
        dashboardStats: stats,
        loading: { ...get().loading, dashboard: false },
        error: { ...get().error, dashboard: null },
        lastRefreshedAt: { ...get().lastRefreshedAt, dashboard: Date.now() },
      });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, dashboard: false }, error: { ...get().error, dashboard: (e as Error).message } });
    }
  },

  syncUsers: async () => {
    set({ loading: { ...get().loading, users: true } });
    try {
      const { users } = await fetchAdmin<{ users: AdminUser[] }>("/api/admin/users");
      set({ users, loading: { ...get().loading, users: false }, error: { ...get().error, users: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, users: false }, error: { ...get().error, users: (e as Error).message } });
    }
  },

  syncOrders: async () => {
    set({ loading: { ...get().loading, orders: true } });
    try {
      const { orders } = await fetchAdmin<{ orders: AdminOrder[] }>("/api/admin/orders");
      set({ orders, loading: { ...get().loading, orders: false }, error: { ...get().error, orders: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, orders: false }, error: { ...get().error, orders: (e as Error).message } });
    }
  },

  syncOrderDetail: async (id: string) => {
    set({ loading: { ...get().loading, orderDetail: true } });
    try {
      const { order } = await fetchAdmin<{ order: AdminOrder }>(`/api/admin/orders/${id}`);
      set({ orderDetail: order, loading: { ...get().loading, orderDetail: false } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, orderDetail: false }, error: { ...get().error, orderDetail: (e as Error).message } });
    }
  },

  syncServices: async () => {
    set({ loading: { ...get().loading, services: true } });
    try {
      const data = await fetchAdmin<{ services: AdminService[] }>("/api/admin/services");
      set({ services: data.services, loading: { ...get().loading, services: false }, error: { ...get().error, services: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, services: false }, error: { ...get().error, services: (e as Error).message } });
    }
  },

  syncFinances: async () => {
    set({ loading: { ...get().loading, finances: true } });
    try {
      const data = await fetchAdmin<{ transactions: AdminTransaction[]; summary: AdminFinanceSummary }>("/api/admin/finances");
      set({
        transactions: data.transactions,
        financeSummary: data.summary,
        loading: { ...get().loading, finances: false },
        error: { ...get().error, finances: null },
        lastRefreshedAt: { ...get().lastRefreshedAt, finances: Date.now() },
      });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, finances: false }, error: { ...get().error, finances: (e as Error).message } });
    }
  },

  syncKyc: async () => {
    set({ loading: { ...get().loading, kyc: true } });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await fetchAdmin<{ queue: any[]; summary: { total: number; byLevel: Record<string, number> } }>("/api/admin/kyc");
      // Map queue to include requestId
      const queue: AdminKycRequest[] = (data.queue || []).map((r) => ({
        userId: r.userId,
        name: r.userName || r.name,
        email: r.userEmail || r.email,
        role: r.userRole || r.role,
        currentLevel: r.currentLevel,
        nextLevel: r.nextLevel,
        createdAt: r.createdAt,
        requestId: r.requestId,
      }));
      set({ kycRequests: queue, kycSummary: data.summary, loading: { ...get().loading, kyc: false }, error: { ...get().error, kyc: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, kyc: false }, error: { ...get().error, kyc: (e as Error).message } });
    }
  },

  syncDisputes: async () => {
    set({ loading: { ...get().loading, disputes: true } });
    try {
      const data = await fetchAdmin<{ disputes: AdminDispute[]; summary: { total: number; resolved: number; totalAmountInDispute: number } }>("/api/admin/disputes");
      set({ disputes: data.disputes, disputeSummary: data.summary, loading: { ...get().loading, disputes: false }, error: { ...get().error, disputes: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, disputes: false }, error: { ...get().error, disputes: (e as Error).message } });
    }
  },

  syncBlog: async () => {
    set({ loading: { ...get().loading, blog: true } });
    try {
      const data = await fetchAdmin<{ articles: AdminBlogArticle[] }>("/api/admin/blog");
      set({ blogArticles: data.articles, loading: { ...get().loading, blog: false }, error: { ...get().error, blog: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, blog: false }, error: { ...get().error, blog: (e as Error).message } });
    }
  },

  syncCategories: async () => {
    set({ loading: { ...get().loading, categories: true } });
    try {
      const { categories } = await fetchAdmin<{ categories: AdminCategory[] }>("/api/admin/categories");
      set({ categories, loading: { ...get().loading, categories: false }, error: { ...get().error, categories: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, categories: false }, error: { ...get().error, categories: (e as Error).message } });
    }
  },

  syncConfig: async () => {
    set({ loading: { ...get().loading, config: true } });
    try {
      const data = await fetchAdmin<{ config: AdminConfig }>("/api/admin/config");
      set({ config: data.config, loading: { ...get().loading, config: false }, error: { ...get().error, config: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, config: false }, error: { ...get().error, config: (e as Error).message } });
    }
  },

  syncAnalytics: async () => {
    set({ loading: { ...get().loading, analytics: true } });
    try {
      const analytics = await fetchAdmin<AdminAnalytics>("/api/admin/analytics");
      set({
        analytics,
        loading: { ...get().loading, analytics: false },
        error: { ...get().error, analytics: null },
        lastRefreshedAt: { ...get().lastRefreshedAt, analytics: Date.now() },
      });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, analytics: false }, error: { ...get().error, analytics: (e as Error).message } });
    }
  },

  syncAuditLog: async () => {
    set({ loading: { ...get().loading, auditLog: true } });
    try {
      const { entries } = await fetchAdmin<{ entries: AdminAuditEntry[] }>("/api/admin/audit-log");
      set({ auditLog: entries, loading: { ...get().loading, auditLog: false }, error: { ...get().error, auditLog: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, auditLog: false }, error: { ...get().error, auditLog: (e as Error).message } });
    }
  },

  syncTeam: async () => {
    set({ loading: { ...get().loading, team: true } });
    try {
      const { members } = await fetchAdmin<{ members: AdminTeamMember[] }>("/api/admin/team");
      set({ teamMembers: members, loading: { ...get().loading, team: false }, error: { ...get().error, team: null } });
    } catch (e: unknown) {
      set({ loading: { ...get().loading, team: false }, error: { ...get().error, team: (e as Error).message } });
    }
  },

  // ── Team actions ──

  inviteMember: async (data) => {
    try {
      await fetchAdmin("/api/admin/team", { method: "POST", body: JSON.stringify(data) });
      await get().syncTeam();
      return true;
    } catch { return false; }
  },

  updateMemberRole: async (memberId, adminRole) => {
    try {
      await fetchAdmin("/api/admin/team", { method: "PATCH", body: JSON.stringify({ memberId, adminRole }) });
      await get().syncTeam();
      return true;
    } catch { return false; }
  },

  removeMember: async (memberId) => {
    try {
      await fetchAdmin(`/api/admin/team?id=${memberId}`, { method: "DELETE" });
      await get().syncTeam();
      return true;
    } catch { return false; }
  },

  // ── User actions ──

  suspendUser: async (userId) => {
    try {
      await fetchAdmin(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify({ status: "suspendu" }) });
      await get().syncUsers();
      return true;
    } catch { return false; }
  },

  banUser: async (userId) => {
    try {
      await fetchAdmin(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify({ status: "banni" }) });
      await get().syncUsers();
      return true;
    } catch { return false; }
  },

  reactivateUser: async (userId) => {
    try {
      await fetchAdmin(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify({ status: "actif" }) });
      await get().syncUsers();
      return true;
    } catch { return false; }
  },

  changeUserRole: async (userId, role) => {
    try {
      await fetchAdmin(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify({ role }) });
      await get().syncUsers();
      return true;
    } catch { return false; }
  },

  changeUserPlan: async (userId, plan) => {
    try {
      await fetchAdmin(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify({ plan }) });
      await get().syncUsers();
      return true;
    } catch { return false; }
  },

  // ── Order actions ──

  forceDelivery: async (orderId) => {
    try {
      await fetchAdmin(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ action: "force_delivery" }) });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  forceCancel: async (orderId) => {
    try {
      await fetchAdmin(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ action: "force_cancel" }) });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  releaseEscrow: async (orderId) => {
    try {
      await fetchAdmin(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ action: "release_escrow" }) });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  refundOrder: async (orderId) => {
    try {
      await fetchAdmin(`/api/admin/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ action: "refund" }) });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  // ── Service actions ──

  approveService: async (serviceId) => {
    try {
      await fetchAdmin(`/api/admin/services/${serviceId}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) });
      await get().syncServices();
      return true;
    } catch { return false; }
  },

  refuseService: async (serviceId, reason) => {
    try {
      await fetchAdmin(`/api/admin/services/${serviceId}`, { method: "PATCH", body: JSON.stringify({ action: "refuse", reason }) });
      await get().syncServices();
      return true;
    } catch { return false; }
  },

  featureService: async (serviceId) => {
    try {
      await fetchAdmin(`/api/admin/services/${serviceId}`, { method: "PATCH", body: JSON.stringify({ action: "feature" }) });
      await get().syncServices();
      return true;
    } catch { return false; }
  },

  pauseService: async (serviceId) => {
    try {
      await fetchAdmin(`/api/admin/services/${serviceId}`, { method: "PATCH", body: JSON.stringify({ action: "pause" }) });
      await get().syncServices();
      return true;
    } catch { return false; }
  },

  deleteService: async (serviceId) => {
    try {
      await fetchAdmin(`/api/admin/services/${serviceId}`, { method: "PATCH", body: JSON.stringify({ action: "delete" }) });
      await get().syncServices();
      return true;
    } catch { return false; }
  },

  // ── Finance actions ──

  blockTransaction: async (id) => {
    try {
      await fetchAdmin(`/api/admin/finances/${id}`, { method: "PATCH", body: JSON.stringify({ action: "block" }) });
      await get().syncFinances();
      return true;
    } catch { return false; }
  },

  unblockTransaction: async (id) => {
    try {
      await fetchAdmin(`/api/admin/finances/${id}`, { method: "PATCH", body: JSON.stringify({ action: "unblock" }) });
      await get().syncFinances();
      return true;
    } catch { return false; }
  },

  approveTransaction: async (id) => {
    try {
      await fetchAdmin(`/api/admin/finances/${id}`, { method: "PATCH", body: JSON.stringify({ action: "approve" }) });
      await get().syncFinances();
      return true;
    } catch { return false; }
  },

  // ── KYC actions ──

  approveKyc: async (userId, level, requestId) => {
    try {
      await fetchAdmin("/api/admin/kyc", { method: "POST", body: JSON.stringify({ action: "approve", userId, level, requestId }) });
      await get().syncKyc();
      return true;
    } catch { return false; }
  },

  refuseKyc: async (userId, reason, requestId) => {
    try {
      await fetchAdmin("/api/admin/kyc", { method: "POST", body: JSON.stringify({ action: "refuse", userId, reason, requestId }) });
      await get().syncKyc();
      return true;
    } catch { return false; }
  },

  // ── Dispute actions ──

  examineDispute: async (orderId) => {
    try {
      await fetchAdmin("/api/admin/disputes", { method: "POST", body: JSON.stringify({ action: "examine", orderId }) });
      await get().syncDisputes();
      return true;
    } catch { return false; }
  },

  resolveDispute: async (orderId, verdict, resolution) => {
    try {
      await fetchAdmin("/api/admin/disputes", { method: "POST", body: JSON.stringify({ action: "resolve", orderId, verdict, resolution }) });
      await get().syncDisputes();
      return true;
    } catch { return false; }
  },

  // ── Blog actions ──

  createArticle: async (data) => {
    try {
      await fetchAdmin("/api/admin/blog", { method: "POST", body: JSON.stringify(data) });
      await get().syncBlog();
      return true;
    } catch { return false; }
  },

  updateArticle: async (id, data) => {
    try {
      await fetchAdmin("/api/admin/blog", { method: "PATCH", body: JSON.stringify({ id, ...data }) });
      await get().syncBlog();
      return true;
    } catch { return false; }
  },

  deleteArticle: async (id) => {
    try {
      await fetchAdmin(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      await get().syncBlog();
      return true;
    } catch { return false; }
  },

  // ── Config actions ──

  updateConfig: async (data) => {
    try {
      const res = await fetchAdmin<{ config: AdminConfig }>("/api/admin/config", { method: "PATCH", body: JSON.stringify(data) });
      set({ config: res.config });
      return true;
    } catch { return false; }
  },

  // ── Notification actions ──

  sendNotification: async (data) => {
    try {
      const result = await fetchAdmin<{ success: boolean; count: number; failedEmails?: number; message?: string }>("/api/admin/notifications/send", { method: "POST", body: JSON.stringify(data) });
      return result;
    } catch { return null; }
  },
}));
