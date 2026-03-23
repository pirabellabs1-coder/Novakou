"use client";

import { create } from "zustand";
import {
  ordersApi, financesApi, reviewsApi, statsApi, notificationsApi, profileApi,
  projectsApi, candidaturesApi, offresApi, favoritesApi, paymentMethodsApi,
  supportTicketsApi, sessionsApi, invoicesApi,
  type ApiOrder, type ApiTransaction, type ApiNotification,
  type ApiReview, type ApiReviewSummary, type ApiStats, type ApiFinanceSummary,
  type ApiFavorite, type ApiPaymentMethod, type ApiSupportTicket, type ApiSession,
} from "@/lib/api-client";

// ── Client-specific types ──

export interface ClientProject {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: { type: "fixed" | "hourly"; min: number; max: number };
  deadline: string;
  skills: string[];
  urgency: "normale" | "urgente" | "tres_urgente";
  visibility: "public" | "prive";
  status: "ouvert" | "pourvu" | "ferme" | "brouillon" | "actif" | "termine";
  candidatures: number;
  progress: number;
  createdAt: string;
}

export interface ClientActivity {
  id: string;
  type: "commande" | "projet" | "avis" | "paiement" | "candidature";
  message: string;
  link: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface ClientProposal {
  id: string;
  freelanceId: string;
  freelanceName: string;
  freelanceAvatar: string;
  freelanceType: "freelance" | "agence";
  projectTitle: string;
  description: string;
  amount: number;
  delay: string;
  skills: string[];
  status: "en_attente" | "acceptee" | "refusee" | "expiree";
  createdAt: string;
  expiresAt: string;
}

export interface ClientDispute {
  id: string;
  orderId: string;
  orderTitle: string;
  category: string;
  description: string;
  status: "en_cours" | "resolu" | "en_attente";
  createdAt: string;
  timeline: { date: string; event: string; by: string }[];
}

export interface ClientFavorite {
  id: string;
  targetId: string;
  type: "freelance" | "service" | "agence";
  name: string;
  avatar: string;
  rating: number;
  specialty: string;
  addedAt: string;
}

export interface ClientInvoice {
  id: string;
  orderId: string;
  serviceTitle: string;
  amount: number;
  status: "payee" | "en_attente" | "remboursee";
  date: string;
  pdfUrl: string;
}

// ── Client Store ──

interface ClientState {
  // Loading & error per domain
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  lastSyncAt: string | null;

  // Data from API
  stats: ApiStats | null;
  financeSummary: ApiFinanceSummary | null;
  projects: ClientProject[];
  orders: ApiOrder[];
  favorites: ClientFavorite[];
  reviews: ApiReview[];
  reviewSummary: ApiReviewSummary | null;
  disputes: ClientDispute[];
  invoices: ClientInvoice[];
  notifications: ApiNotification[];
  unreadCount: number;
  transactions: ApiTransaction[];
  proposals: ClientProposal[];
  activities: ClientActivity[];
  paymentMethods: ApiPaymentMethod[];
  supportTickets: ApiSupportTicket[];
  sessions: ApiSession[];

  // Filters
  projectFilter: string;
  orderFilter: string;
  reviewTab: string;
  disputeFilter: string;
  invoicePeriod: string;

  // Computed getters
  activeOrdersCount: () => number;
  unreadNotificationsCount: () => number;
  pendingReviewsCount: () => number;

  // Actions — sync from API
  syncAll: () => Promise<void>;
  syncProjects: () => Promise<void>;
  syncOrders: () => Promise<void>;
  syncFavorites: () => Promise<void>;
  syncReviews: () => Promise<void>;
  syncDisputes: () => Promise<void>;
  syncInvoices: () => Promise<void>;
  syncNotifications: () => Promise<void>;
  syncTransactions: () => Promise<void>;
  syncProposals: () => Promise<void>;
  syncStats: () => Promise<void>;
  syncPaymentMethods: () => Promise<void>;
  syncSupportTickets: () => Promise<void>;
  syncSessions: () => Promise<void>;

  // CRUD actions
  createProject: (data: Record<string, unknown>) => Promise<boolean>;
  updateProject: (id: string, data: Record<string, unknown>) => Promise<boolean>;
  closeProject: (id: string) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  acceptCandidature: (projectId: string, candidatureId: string) => Promise<boolean>;
  rejectCandidature: (projectId: string, candidatureId: string) => Promise<boolean>;
  validateDelivery: (orderId: string) => Promise<boolean>;
  requestRevision: (orderId: string, comment: string) => Promise<boolean>;
  openDispute: (orderId: string, data: Record<string, unknown>) => Promise<boolean>;
  submitReview: (data: { orderId: string; qualite: number; communication: number; delai: number; comment?: string }) => Promise<boolean>;
  toggleFavorite: (type: ClientFavorite["type"], targetId: string, name: string, avatar: string, rating: number, specialty: string) => Promise<boolean>;
  addPaymentMethod: (data: Record<string, unknown>) => Promise<boolean>;
  removePaymentMethod: (id: string) => Promise<boolean>;
  setDefaultPaymentMethod: (id: string) => Promise<boolean>;
  createSupportTicket: (data: { subject: string; category: string; message: string; priority?: string }) => Promise<boolean>;
  replySupportTicket: (ticketId: string, message: string) => Promise<boolean>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  revokeAllSessions: () => Promise<boolean>;
  sendInvoiceByEmail: (invoiceId: string) => Promise<boolean>;
  reportReview: (reviewId: string) => Promise<boolean>;
  acceptProposal: (id: string) => Promise<boolean>;
  rejectProposal: (id: string) => Promise<boolean>;
  markNotificationRead: (id: string) => Promise<boolean>;
  updateProfile: (data: Record<string, unknown>) => Promise<boolean>;
  updateSettings: (data: Record<string, unknown>) => Promise<boolean>;

  // Filter setters
  setProjectFilter: (filter: string) => void;
  setOrderFilter: (filter: string) => void;
  setReviewTab: (tab: string) => void;
  setDisputeFilter: (filter: string) => void;
  setInvoicePeriod: (period: string) => void;
}

export const useClientStore = create<ClientState>()((set, get) => ({
  // Initial state — all zeros/empty
  loading: {},
  error: {},
  lastSyncAt: null,
  stats: null,
  financeSummary: null,
  projects: [],
  orders: [],
  favorites: [],
  reviews: [],
  reviewSummary: null,
  disputes: [],
  invoices: [],
  notifications: [],
  unreadCount: 0,
  transactions: [],
  proposals: [],
  activities: [],
  paymentMethods: [],
  supportTickets: [],
  sessions: [],
  projectFilter: "all",
  orderFilter: "all",
  reviewTab: "all",
  disputeFilter: "all",
  invoicePeriod: "all",

  // Computed getters
  activeOrdersCount: () => get().orders.filter((o) => o.status === "en_cours").length,
  unreadNotificationsCount: () => get().unreadCount,
  pendingReviewsCount: () => {
    const { orders, reviews } = get();
    return orders.filter((o) => o.status === "termine" && !reviews.find((r) => r.orderId === o.id)).length;
  },

  // Sync all data from APIs
  syncAll: async () => {
    set({ loading: { ...get().loading, all: true } });
    try {
      const [projectsRes, ordersRes, financeRes, transactionsRes, reviewsRes, statsRes, notifRes, proposalsRes] = await Promise.allSettled([
        projectsApi.list(),
        ordersApi.list(),
        financesApi.summary(),
        financesApi.transactions(),
        reviewsApi.getByClient(),
        statsApi.get(),
        notificationsApi.list(),
        offresApi.list(),
      ]);

      const updates: Partial<ClientState> = {
        loading: { ...get().loading, all: false },
        error: { ...get().error, all: null },
        lastSyncAt: new Date().toISOString(),
      };

      if (projectsRes.status === "fulfilled") {
        updates.projects = (projectsRes.value.projects || []).map((p: any) => ({
          id: p.id,
          title: p.title || "",
          category: p.category || "",
          description: p.description || "",
          budget: { type: (p.budget?.type || "fixed") as "fixed" | "hourly", min: p.budgetMin ?? p.budget?.min ?? 0, max: p.budgetMax ?? p.budget?.max ?? 0 },
          deadline: p.deadline || "",
          skills: p.skills || [],
          urgency: p.urgency || "normale",
          visibility: p.visibility || "public",
          status: p.status || "brouillon",
          candidatures: p.candidatures || 0,
          progress: p.progress || 0,
          createdAt: p.createdAt || "",
        }));
      }
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
      if (proposalsRes.status === "fulfilled") {
        updates.proposals = (proposalsRes.value.offres || []).map((o: any) => ({
          id: o.id,
          freelanceId: o.freelanceId || "",
          freelanceName: o.freelanceName || o.client || "",
          freelanceAvatar: o.freelanceAvatar || "",
          freelanceType: (o.freelanceType || "freelance") as "freelance" | "agence",
          projectTitle: o.projectTitle || o.title || "",
          description: o.description || "",
          amount: o.amount || 0,
          delay: o.delay || "",
          skills: o.skills || [],
          status: (o.status || "en_attente") as ClientProposal["status"],
          createdAt: o.createdAt || "",
          expiresAt: o.expiresAt || "",
        }));
      }

      // Build disputes from orders with litige status
      if (updates.orders) {
        updates.disputes = updates.orders
          .filter((o) => o.status === "litige")
          .map((o) => ({
            id: `dispute-${o.id}`,
            orderId: o.id,
            orderTitle: o.serviceTitle,
            category: o.category,
            description: "",
            status: "en_cours" as const,
            createdAt: o.updatedAt || o.createdAt,
            timeline: [{ date: o.updatedAt || o.createdAt, event: "Litige ouvert", by: "client" }],
          }));
      }

      // Build invoices from completed/active orders
      if (updates.orders) {
        updates.invoices = updates.orders
          .filter((o) => o.status === "termine" || o.status === "livre" || o.status === "en_cours")
          .map((o) => ({
            id: `inv-${o.id}`,
            orderId: o.id,
            serviceTitle: o.serviceTitle,
            amount: o.amount,
            status: (o.status === "termine" ? "payee" : "en_attente") as ClientInvoice["status"],
            date: o.createdAt,
            pdfUrl: `/api/invoices/${o.id}/pdf`,
          }));
      }

      // Build activity feed from orders, reviews, projects
      const activities: ClientActivity[] = [];
      if (updates.orders) {
        updates.orders.slice(0, 5).forEach((o) => {
          activities.push({
            id: `order-${o.id}`,
            type: "commande",
            message: `Commande #${o.id.slice(-4)} — ${o.serviceTitle}`,
            link: `/client/commandes/${o.id}`,
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
            message: `Avis ${r.rating}/5 laissé pour ${r.serviceTitle}`,
            link: "/client/avis",
            icon: "star",
            color: "text-amber-400",
            createdAt: r.createdAt,
          });
        });
      }
      if (updates.projects) {
        updates.projects.slice(0, 3).forEach((p) => {
          activities.push({
            id: `project-${p.id}`,
            type: "projet",
            message: `Projet "${p.title}" — ${p.candidatures} candidature(s)`,
            link: `/client/projets/${p.id}`,
            icon: "work",
            color: "text-emerald-400",
            createdAt: p.createdAt,
          });
        });
      }
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      updates.activities = activities.slice(0, 10);

      set(updates as ClientState);
    } catch {
      set({ loading: { ...get().loading, all: false } });
    }
  },

  syncProjects: async () => {
    set({ loading: { ...get().loading, projects: true } });
    try {
      const { projects } = await projectsApi.list();
      set({
        projects: (projects || []).map((p: any) => ({
          id: p.id,
          title: p.title || "",
          category: p.category || "",
          description: p.description || "",
          budget: { type: (p.budget?.type || "fixed") as "fixed" | "hourly", min: p.budgetMin ?? p.budget?.min ?? 0, max: p.budgetMax ?? p.budget?.max ?? 0 },
          deadline: p.deadline || "",
          skills: p.skills || [],
          urgency: p.urgency || "normale",
          visibility: p.visibility || "public",
          status: p.status || "brouillon",
          candidatures: p.candidatures || 0,
          progress: p.progress || 0,
          createdAt: p.createdAt || "",
        })),
        loading: { ...get().loading, projects: false },
        error: { ...get().error, projects: null },
      });
    } catch {
      set({ loading: { ...get().loading, projects: false } });
    }
  },

  syncOrders: async () => {
    set({ loading: { ...get().loading, orders: true } });
    try {
      const { orders } = await ordersApi.list();
      set({ orders, loading: { ...get().loading, orders: false }, error: { ...get().error, orders: null } });
    } catch {
      set({ loading: { ...get().loading, orders: false } });
    }
  },

  syncFavorites: async () => {
    set({ loading: { ...get().loading, favorites: true } });
    try {
      const { favorites } = await favoritesApi.list();
      set({
        favorites: favorites.map((f) => ({
          id: f.id,
          targetId: f.targetId,
          type: f.type,
          name: f.name,
          avatar: f.avatar,
          rating: f.rating,
          specialty: f.specialty,
          addedAt: f.addedAt,
        })),
        loading: { ...get().loading, favorites: false },
        error: { ...get().error, favorites: null },
      });
    } catch {
      set({ loading: { ...get().loading, favorites: false } });
    }
  },

  syncReviews: async () => {
    set({ loading: { ...get().loading, reviews: true } });
    try {
      const { reviews, summary } = await reviewsApi.getByClient();
      set({ reviews, reviewSummary: summary, loading: { ...get().loading, reviews: false }, error: { ...get().error, reviews: null } });
    } catch {
      set({ loading: { ...get().loading, reviews: false } });
    }
  },

  syncDisputes: async () => {
    // Built from orders with status "litige"
    set({ loading: { ...get().loading, disputes: true } });
    try {
      const { orders } = get();
      const disputes: ClientDispute[] = orders
        .filter((o) => o.status === "litige")
        .map((o) => ({
          id: `dispute-${o.id}`,
          orderId: o.id,
          orderTitle: o.serviceTitle,
          category: o.category,
          description: "",
          status: "en_cours" as const,
          createdAt: o.updatedAt || o.createdAt,
          timeline: [{ date: o.updatedAt || o.createdAt, event: "Litige ouvert", by: "client" }],
        }));
      set({ disputes, loading: { ...get().loading, disputes: false }, error: { ...get().error, disputes: null } });
    } catch {
      set({ loading: { ...get().loading, disputes: false } });
    }
  },

  syncInvoices: async () => {
    // Built from completed orders
    set({ loading: { ...get().loading, invoices: true } });
    try {
      const { orders } = get();
      const invoices: ClientInvoice[] = orders
        .filter((o) => o.status === "termine" || o.status === "livre" || o.status === "en_cours")
        .map((o) => ({
          id: `inv-${o.id}`,
          orderId: o.id,
          serviceTitle: o.serviceTitle,
          amount: o.amount,
          status: (o.status === "termine" ? "payee" : "en_attente") as ClientInvoice["status"],
          date: o.createdAt,
          pdfUrl: `/api/invoices/${o.id}/pdf`,
        }));
      set({ invoices, loading: { ...get().loading, invoices: false }, error: { ...get().error, invoices: null } });
    } catch {
      set({ loading: { ...get().loading, invoices: false } });
    }
  },

  syncNotifications: async () => {
    set({ loading: { ...get().loading, notifications: true } });
    try {
      const { notifications, unreadCount } = await notificationsApi.list();
      set({ notifications, unreadCount, loading: { ...get().loading, notifications: false }, error: { ...get().error, notifications: null } });
    } catch {
      set({ loading: { ...get().loading, notifications: false } });
    }
  },

  syncTransactions: async () => {
    set({ loading: { ...get().loading, transactions: true } });
    try {
      const { transactions } = await financesApi.transactions();
      set({ transactions, loading: { ...get().loading, transactions: false }, error: { ...get().error, transactions: null } });
    } catch {
      set({ loading: { ...get().loading, transactions: false } });
    }
  },

  syncProposals: async () => {
    set({ loading: { ...get().loading, proposals: true } });
    try {
      const { offres } = await offresApi.list();
      set({
        proposals: (offres || []).map((o: any) => ({
          id: o.id,
          freelanceId: o.freelanceId || "",
          freelanceName: o.freelanceName || o.client || "",
          freelanceAvatar: o.freelanceAvatar || "",
          freelanceType: (o.freelanceType || "freelance") as "freelance" | "agence",
          projectTitle: o.projectTitle || o.title || "",
          description: o.description || "",
          amount: o.amount || 0,
          delay: o.delay || "",
          skills: o.skills || [],
          status: (o.status || "en_attente") as ClientProposal["status"],
          createdAt: o.createdAt || "",
          expiresAt: o.expiresAt || "",
        })),
        loading: { ...get().loading, proposals: false },
        error: { ...get().error, proposals: null },
      });
    } catch {
      set({ loading: { ...get().loading, proposals: false } });
    }
  },

  syncStats: async () => {
    set({ loading: { ...get().loading, stats: true } });
    try {
      const stats = await statsApi.get();
      set({ stats, loading: { ...get().loading, stats: false }, error: { ...get().error, stats: null } });
    } catch {
      set({ loading: { ...get().loading, stats: false } });
    }
  },

  syncPaymentMethods: async () => {
    set({ loading: { ...get().loading, paymentMethods: true } });
    try {
      const { methods } = await paymentMethodsApi.list();
      set({ paymentMethods: methods, loading: { ...get().loading, paymentMethods: false }, error: { ...get().error, paymentMethods: null } });
    } catch {
      set({ loading: { ...get().loading, paymentMethods: false } });
    }
  },

  syncSupportTickets: async () => {
    set({ loading: { ...get().loading, supportTickets: true } });
    try {
      const { tickets } = await supportTicketsApi.list();
      set({ supportTickets: tickets, loading: { ...get().loading, supportTickets: false }, error: { ...get().error, supportTickets: null } });
    } catch {
      set({ loading: { ...get().loading, supportTickets: false } });
    }
  },

  syncSessions: async () => {
    set({ loading: { ...get().loading, sessions: true } });
    try {
      const { sessions } = await sessionsApi.list();
      set({ sessions, loading: { ...get().loading, sessions: false }, error: { ...get().error, sessions: null } });
    } catch {
      set({ loading: { ...get().loading, sessions: false } });
    }
  },

  // CRUD actions

  createProject: async (data) => {
    try {
      await projectsApi.create(data);
      await get().syncProjects();
      return true;
    } catch { return false; }
  },

  updateProject: async (id, data) => {
    try {
      await projectsApi.update(id, data);
      set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...data } as ClientProject : p) }));
      return true;
    } catch { return false; }
  },

  closeProject: async (id) => {
    try {
      await projectsApi.update(id, { status: "ferme" });
      set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, status: "termine" as const } : p) }));
      return true;
    } catch { return false; }
  },

  deleteProject: async (id) => {
    try {
      await projectsApi.delete(id);
      set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
      return true;
    } catch { return false; }
  },

  acceptCandidature: async (_projectId, candidatureId) => {
    try {
      await candidaturesApi.accept(candidatureId);
      return true;
    } catch { return false; }
  },

  rejectCandidature: async (_projectId, candidatureId) => {
    try {
      await candidaturesApi.reject(candidatureId);
      return true;
    } catch { return false; }
  },

  validateDelivery: async (orderId) => {
    try {
      await ordersApi.update(orderId, { status: "termine" });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  requestRevision: async (orderId, comment) => {
    try {
      await ordersApi.update(orderId, { status: "revision", revisionComment: comment });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  openDispute: async (orderId, data) => {
    try {
      await ordersApi.update(orderId, { status: "litige", ...data });
      await get().syncOrders();
      return true;
    } catch { return false; }
  },

  submitReview: async (data) => {
    try {
      await reviewsApi.create(data);
      await get().syncReviews();
      return true;
    } catch { return false; }
  },

  toggleFavorite: async (type, targetId, name, avatar, rating, specialty) => {
    try {
      const exists = get().favorites.find((f) => f.targetId === targetId && f.type === type);
      if (exists) {
        await favoritesApi.remove(targetId, type);
        set((s) => ({ favorites: s.favorites.filter((f) => !(f.targetId === targetId && f.type === type)) }));
      } else {
        await favoritesApi.add({ targetId, type, name, avatar, rating, specialty });
        set((s) => ({
          favorites: [...s.favorites, { id: `fav-${Date.now()}`, targetId, type, name, avatar, rating, specialty, addedAt: new Date().toISOString() }],
        }));
      }
      return true;
    } catch { return false; }
  },

  addPaymentMethod: async (data) => {
    try {
      await paymentMethodsApi.add(data);
      await get().syncPaymentMethods();
      return true;
    } catch { return false; }
  },

  removePaymentMethod: async (id) => {
    try {
      await paymentMethodsApi.remove(id);
      set((s) => ({ paymentMethods: s.paymentMethods.filter((m) => m.id !== id) }));
      return true;
    } catch { return false; }
  },

  setDefaultPaymentMethod: async (id) => {
    try {
      await paymentMethodsApi.setDefault(id);
      set((s) => ({ paymentMethods: s.paymentMethods.map((m) => ({ ...m, isDefault: m.id === id })) }));
      return true;
    } catch { return false; }
  },

  createSupportTicket: async (data) => {
    try {
      const { ticket } = await supportTicketsApi.create(data);
      set((s) => ({ supportTickets: [ticket, ...s.supportTickets] }));
      return true;
    } catch { return false; }
  },

  replySupportTicket: async (ticketId, message) => {
    try {
      const { ticket } = await supportTicketsApi.reply(ticketId, message);
      set((s) => ({ supportTickets: s.supportTickets.map((t) => t.id === ticketId ? ticket : t) }));
      return true;
    } catch { return false; }
  },

  revokeSession: async (sessionId) => {
    try {
      await sessionsApi.revoke(sessionId);
      set((s) => ({ sessions: s.sessions.filter((se) => se.id !== sessionId) }));
      return true;
    } catch { return false; }
  },

  revokeAllSessions: async () => {
    try {
      await sessionsApi.revokeAll();
      set((s) => ({ sessions: s.sessions.filter((se) => se.isCurrent) }));
      return true;
    } catch { return false; }
  },

  sendInvoiceByEmail: async (invoiceId) => {
    try {
      await invoicesApi.sendByEmail(invoiceId);
      return true;
    } catch { return false; }
  },

  reportReview: async (reviewId) => {
    try {
      await reviewsApi.report(reviewId);
      return true;
    } catch { return false; }
  },

  acceptProposal: async (id) => {
    try {
      await offresApi.accept(id);
      await get().syncProposals();
      return true;
    } catch { return false; }
  },

  rejectProposal: async (id) => {
    try {
      await offresApi.reject(id);
      await get().syncProposals();
      return true;
    } catch { return false; }
  },

  markNotificationRead: async (id) => {
    try {
      await notificationsApi.markRead(id);
      await get().syncNotifications();
      return true;
    } catch { return false; }
  },

  updateProfile: async (data) => {
    try {
      await profileApi.update(data);
      return true;
    } catch { return false; }
  },

  updateSettings: async (data) => {
    try {
      await profileApi.update(data);
      return true;
    } catch { return false; }
  },

  // Filter setters
  setProjectFilter: (filter) => set({ projectFilter: filter }),
  setOrderFilter: (filter) => set({ orderFilter: filter }),
  setReviewTab: (tab) => set({ reviewTab: tab }),
  setDisputeFilter: (filter) => set({ disputeFilter: filter }),
  setInvoicePeriod: (period) => set({ invoicePeriod: period }),
}));
