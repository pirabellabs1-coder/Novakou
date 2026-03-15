"use client";

import { create } from "zustand";
import {
  servicesApi, ordersApi, financesApi, reviewsApi, statsApi, notificationsApi,
  type ApiService, type ApiOrder, type ApiTransaction, type ApiNotification,
  type ApiReview, type ApiReviewSummary, type ApiStats, type ApiFinanceSummary,
} from "@/lib/api-client";

// ── Agency-specific types ──

export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: "proprietaire" | "manager" | "freelance" | "commercial";
  status: "actif" | "inactif" | "invite";
  activeOrders: number;
  revenue: number;
  joinedAt: string;
}

export interface AgencyClient {
  id: string;
  name: string;
  email: string;
  avatar: string;
  country: string;
  totalOrders: number;
  totalRevenue: number;
  firstOrderAt: string;
  lastOrderAt: string;
  status: "actif" | "inactif";
  notes: string;
}

export interface AgencyActivity {
  id: string;
  type: "commande" | "membre" | "service" | "avis" | "paiement";
  message: string;
  link: string;
  icon: string;
  color: string;
  createdAt: string;
}

// ── Agency Store ──

interface AgencyState {
  // Loading
  isLoading: boolean;
  lastSyncAt: string | null;

  // Dashboard stats
  stats: ApiStats | null;
  financeSummary: ApiFinanceSummary | null;

  // Services
  services: ApiService[];

  // Orders
  orders: ApiOrder[];

  // Team
  members: AgencyMember[];

  // Clients
  clients: AgencyClient[];

  // Reviews
  reviews: ApiReview[];
  reviewSummary: ApiReviewSummary | null;

  // Notifications
  notifications: ApiNotification[];
  unreadCount: number;

  // Transactions
  transactions: ApiTransaction[];

  // Activity feed
  activities: AgencyActivity[];

  // Filters
  serviceFilter: string;
  orderFilter: string;
  orderSearch: string;
  timePeriod: "7d" | "30d" | "3m" | "6m" | "1y";

  // Actions — sync from API
  syncAll: () => Promise<void>;
  syncServices: () => Promise<void>;
  syncOrders: () => Promise<void>;
  syncFinances: () => Promise<void>;
  syncReviews: () => Promise<void>;
  syncStats: () => Promise<void>;
  syncNotifications: () => Promise<void>;

  // Service actions
  toggleService: (id: string) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;

  // Order actions
  deliverOrder: (id: string, message: string) => Promise<boolean>;

  // Finance actions
  requestWithdrawal: (amount: number, method: string) => Promise<boolean>;

  // Review actions
  replyToReview: (reviewId: string, reply: string) => Promise<boolean>;

  // Filter setters
  setServiceFilter: (filter: string) => void;
  setOrderFilter: (filter: string) => void;
  setOrderSearch: (search: string) => void;
  setTimePeriod: (period: AgencyState["timePeriod"]) => void;
}

export const useAgencyStore = create<AgencyState>()((set, get) => ({
  // Initial state — all zeros/empty
  isLoading: false,
  lastSyncAt: null,
  stats: null,
  financeSummary: null,
  services: [],
  orders: [],
  members: [],
  clients: [],
  reviews: [],
  reviewSummary: null,
  notifications: [],
  unreadCount: 0,
  transactions: [],
  activities: [],
  serviceFilter: "all",
  orderFilter: "all",
  orderSearch: "",
  timePeriod: "30d",

  // Sync all data from APIs
  syncAll: async () => {
    set({ isLoading: true });
    try {
      const [servicesRes, ordersRes, financeRes, transactionsRes, reviewsRes, statsRes, notifRes] = await Promise.allSettled([
        servicesApi.list(),
        ordersApi.list(),
        financesApi.summary(),
        financesApi.transactions(),
        reviewsApi.getByFreelance(),
        statsApi.get(),
        notificationsApi.list(),
      ]);

      const updates: Partial<AgencyState> = { isLoading: false, lastSyncAt: new Date().toISOString() };

      if (servicesRes.status === "fulfilled") updates.services = servicesRes.value;
      if (ordersRes.status === "fulfilled") updates.orders = ordersRes.value.orders;
      if (financeRes.status === "fulfilled") updates.financeSummary = financeRes.value;
      if (transactionsRes.status === "fulfilled") updates.transactions = transactionsRes.value.transactions;
      if (reviewsRes.status === "fulfilled") {
        updates.reviews = reviewsRes.value.reviews;
        updates.reviewSummary = reviewsRes.value.summary;
      }
      if (statsRes.status === "fulfilled") updates.stats = statsRes.value;
      if (notifRes.status === "fulfilled") {
        updates.notifications = notifRes.value.notifications;
        updates.unreadCount = notifRes.value.unreadCount;
      }

      // Build activity feed from recent orders, reviews, etc.
      const activities: AgencyActivity[] = [];
      if (updates.orders) {
        updates.orders.slice(0, 5).forEach((o) => {
          activities.push({
            id: `order-${o.id}`,
            type: "commande",
            message: `Nouvelle commande #${o.id.slice(-4)} de ${o.clientName}`,
            link: `/agence/commandes/${o.id}`,
            icon: "shopping_cart",
            color: "text-blue-400",
            createdAt: o.createdAt,
          });
        });
      }
      if (updates.reviews) {
        updates.reviews.slice(0, 3).forEach((r) => {
          activities.push({
            id: `review-${r.id}`,
            type: "avis",
            message: `${r.clientName} a laisse un avis ${r.rating}/5`,
            link: "/agence/avis",
            icon: "star",
            color: "text-amber-400",
            createdAt: r.createdAt,
          });
        });
      }
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      updates.activities = activities.slice(0, 10);

      // Build clients list from orders
      if (updates.orders) {
        const clientMap = new Map<string, AgencyClient>();
        for (const order of updates.orders) {
          const existing = clientMap.get(order.clientId);
          if (existing) {
            existing.totalOrders += 1;
            existing.totalRevenue += order.amount;
            if (order.createdAt < existing.firstOrderAt) existing.firstOrderAt = order.createdAt;
            if (order.createdAt > existing.lastOrderAt) existing.lastOrderAt = order.createdAt;
          } else {
            clientMap.set(order.clientId, {
              id: order.clientId,
              name: order.clientName,
              email: "",
              avatar: order.clientAvatar || "",
              country: order.clientCountry || "",
              totalOrders: 1,
              totalRevenue: order.amount,
              firstOrderAt: order.createdAt,
              lastOrderAt: order.createdAt,
              status: "actif",
              notes: "",
            });
          }
        }
        updates.clients = Array.from(clientMap.values());
      }

      set(updates as AgencyState);
    } catch {
      set({ isLoading: false });
    }
  },

  syncServices: async () => {
    try {
      const services = await servicesApi.list();
      set({ services });
    } catch { /* silently fail */ }
  },

  syncOrders: async () => {
    try {
      const { orders } = await ordersApi.list();
      set({ orders });
    } catch { /* silently fail */ }
  },

  syncFinances: async () => {
    try {
      const [summaryRes, txRes] = await Promise.allSettled([
        financesApi.summary(),
        financesApi.transactions(),
      ]);
      if (summaryRes.status === "fulfilled") set({ financeSummary: summaryRes.value });
      if (txRes.status === "fulfilled") set({ transactions: txRes.value.transactions });
    } catch { /* silently fail */ }
  },

  syncReviews: async () => {
    try {
      const { reviews, summary } = await reviewsApi.getByFreelance();
      set({ reviews, reviewSummary: summary });
    } catch { /* silently fail */ }
  },

  syncStats: async () => {
    try {
      const stats = await statsApi.get();
      set({ stats });
    } catch { /* silently fail */ }
  },

  syncNotifications: async () => {
    try {
      const { notifications, unreadCount } = await notificationsApi.list();
      set({ notifications, unreadCount });
    } catch { /* silently fail */ }
  },

  // Service actions
  toggleService: async (id: string) => {
    try {
      await servicesApi.toggle(id);
      await get().syncServices();
      return true;
    } catch { return false; }
  },

  deleteService: async (id: string) => {
    try {
      await servicesApi.delete(id);
      set((s) => ({ services: s.services.filter((sv) => sv.id !== id) }));
      return true;
    } catch { return false; }
  },

  // Order actions
  deliverOrder: async (id: string, message: string) => {
    try {
      await ordersApi.update(id, { status: "livre", deliveryMessage: message });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  // Finance actions
  requestWithdrawal: async (amount: number, method: string) => {
    try {
      await financesApi.withdrawal({ amount, method });
      await get().syncFinances();
      return true;
    } catch { return false; }
  },

  // Review actions
  replyToReview: async (reviewId: string, reply: string) => {
    try {
      await reviewsApi.reply(reviewId, reply);
      await get().syncReviews();
      return true;
    } catch { return false; }
  },

  // Filter setters
  setServiceFilter: (filter) => set({ serviceFilter: filter }),
  setOrderFilter: (filter) => set({ orderFilter: filter }),
  setOrderSearch: (search) => set({ orderSearch: search }),
  setTimePeriod: (period) => set({ timePeriod: period }),
}));
