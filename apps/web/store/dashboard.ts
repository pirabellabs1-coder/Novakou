"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  INITIAL_SERVICES, INITIAL_ORDERS, INITIAL_TRANSACTIONS, INITIAL_CONVERSATIONS,
  INITIAL_PORTFOLIO, DEMO_PROFILE, DEMO_AVAILABILITY, DEMO_NOTIFICATION_SETTINGS,
  type Service, type Order, type Transaction, type Conversation, type ChatMessage,
  type PortfolioProject, type FreelancerProfile, type AvailabilitySlot,
  type NotificationSetting, type OrderMessage, type OrderFile,
} from "@/lib/demo-data";
import {
  servicesApi, ordersApi, financesApi, profileApi, notificationsApi, conversationsApi, statsApi, reviewsApi,
  affiliationApi, automationApi,
  mapApiServiceToLocal, mapApiOrderToLocal, mapApiTransactionToLocal, mapApiConversationToLocal,
  type ApiNotification, type ApiReview, type ApiReviewSummary, type ApiStats,
  type ApiAffiliationData, type ApiAutomationData, type ApiAutomationScenario,
} from "@/lib/api-client";

// ============================================================
// Toast store
// ============================================================
export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ============================================================
// Dashboard store — all freelance dashboard state
// ============================================================
interface DashboardState {
  // API sync
  isLoading: boolean;
  lastSyncAt: string | null;
  syncFromApi: () => Promise<void>;

  // Notifications (from API)
  apiNotifications: ApiNotification[];
  unreadCount: number;
  unreadMessages: number;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Services
  services: Service[];
  addService: (service: Omit<Service, "id" | "views" | "clicks" | "orders" | "revenue" | "conversionRate" | "createdAt"> & { extras?: Service["extras"] }) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  deleteService: (id: string) => void;
  toggleServiceStatus: (id: string) => void;
  // API-backed service operations
  apiCreateService: (data: Record<string, unknown>) => Promise<string | null>;
  apiDeleteService: (id: string) => Promise<boolean>;
  apiToggleService: (id: string) => Promise<boolean>;

  // Orders
  orders: Order[];
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  addOrderMessage: (orderId: string, message: Omit<OrderMessage, "id">) => void;
  addOrderFile: (orderId: string, file: Omit<OrderFile, "id">) => void;
  // API-backed order operations
  apiAcceptOrder: (id: string) => Promise<boolean>;
  apiDeliverOrder: (id: string, message: string, files: Omit<OrderFile, "id">[]) => Promise<boolean>;
  apiSendOrderMessage: (orderId: string, content: string) => Promise<boolean>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "id">) => void;
  apiRequestWithdrawal: (amount: number, method: string) => Promise<boolean>;

  // Conversations
  conversations: Conversation[];
  sendMessage: (convId: string, content: string, type?: ChatMessage["type"], fileName?: string, fileSize?: string) => void;
  markConversationRead: (convId: string) => void;
  apiSendMessage: (convId: string, content: string) => Promise<boolean>;

  // Portfolio
  portfolio: PortfolioProject[];
  addPortfolioProject: (project: Omit<PortfolioProject, "id" | "createdAt" | "order">) => void;
  updatePortfolioProject: (id: string, updates: Partial<PortfolioProject>) => void;
  deletePortfolioProject: (id: string) => void;
  reorderPortfolio: (projects: PortfolioProject[]) => void;

  // Profile
  profile: FreelancerProfile;
  updateProfile: (updates: Partial<FreelancerProfile>) => void;
  apiSaveProfile: (updates: Partial<FreelancerProfile>) => Promise<boolean>;

  // Availability
  availability: AvailabilitySlot[];
  vacationMode: boolean;
  updateAvailability: (day: number, updates: Partial<AvailabilitySlot>) => void;
  toggleVacationMode: () => Promise<void>;

  // Notifications settings
  notificationSettings: NotificationSetting[];
  updateNotificationSetting: (id: string, updates: Partial<NotificationSetting>) => void;

  // Settings
  settings: {
    language: string;
    theme: "clair" | "sombre";
    twoFactorEnabled: boolean;
  };
  updateSettings: (updates: Partial<DashboardState["settings"]>) => void;

  // Reviews
  reviews: ApiReview[];
  reviewSummary: ApiReviewSummary | null;
  syncReviews: () => Promise<void>;
  apiReplyToReview: (reviewId: string, reply: string) => Promise<boolean>;
  apiReportReview: (reviewId: string) => Promise<boolean>;
  apiMarkHelpful: (reviewId: string) => Promise<boolean>;

  // Stats (from API)
  stats: ApiStats | null;
  syncStats: () => Promise<void>;

  // Subscription
  currentPlan: string;
  changePlan: (planId: string) => void;

  // Affiliation
  affiliation: ApiAffiliationData | null;
  affiliationLoading: boolean;
  syncAffiliation: () => Promise<void>;
  sendInvite: (email: string, message?: string) => Promise<boolean>;

  // Automation
  automation: ApiAutomationData | null;
  automationLoading: boolean;
  syncAutomation: () => Promise<void>;
  createScenario: (scenario: Omit<ApiAutomationScenario, "id" | "triggerCount" | "createdAt">) => Promise<boolean>;
  toggleScenario: (id: string, active: boolean) => Promise<boolean>;
  deleteScenario: (id: string) => Promise<boolean>;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      // API sync
      isLoading: false,
      lastSyncAt: null,

      syncFromApi: async () => {
        set({ isLoading: true });
        try {
          const [servicesRes, ordersRes, transactionsRes, conversationsRes, profileRes, notificationsRes, statsRes, reviewsRes] = await Promise.allSettled([
            servicesApi.list(),
            ordersApi.list(),
            financesApi.transactions(),
            conversationsApi.list(),
            profileApi.get(),
            notificationsApi.list(),
            statsApi.get(),
            reviewsApi.getByFreelance(),
          ]);

          const updates: Partial<DashboardState> = {
            lastSyncAt: new Date().toISOString(),
            isLoading: false,
          };

          if (servicesRes.status === "fulfilled") {
            updates.services = (servicesRes.value ?? []).map(mapApiServiceToLocal);
          }
          if (ordersRes.status === "fulfilled") {
            updates.orders = (ordersRes.value?.orders ?? []).map(mapApiOrderToLocal);
          }
          if (transactionsRes.status === "fulfilled") {
            updates.transactions = (transactionsRes.value?.transactions ?? []).map(mapApiTransactionToLocal);
          }
          if (conversationsRes.status === "fulfilled") {
            updates.conversations = (conversationsRes.value?.conversations ?? []).map(mapApiConversationToLocal);
          }
          if (profileRes.status === "fulfilled") {
            const p = profileRes.value;
            updates.profile = {
              firstName: p.firstName,
              lastName: p.lastName,
              username: p.username,
              email: p.email,
              phone: p.phone,
              photo: p.photo,
              coverPhoto: (p as unknown as Record<string, unknown>).coverPhoto as string || "",
              title: p.title,
              bio: p.bio,
              city: p.city,
              country: p.country,
              hourlyRate: p.hourlyRate,
              skills: p.skills as FreelancerProfile["skills"],
              languages: p.languages,
              education: (p as unknown as Record<string, unknown>).education as FreelancerProfile["education"] || [],
              links: p.links,
              completionPercent: p.completionPercent,
            };
            if (p.availability) {
              updates.availability = p.availability;
            }
            if (p.vacationMode !== undefined) {
              updates.vacationMode = p.vacationMode;
            }
          }
          if (notificationsRes.status === "fulfilled") {
            updates.apiNotifications = (notificationsRes.value?.notifications ?? []) as ApiNotification[];
            updates.unreadCount = notificationsRes.value?.unreadCount ?? 0;
          }
          if (statsRes.status === "fulfilled") {
            updates.stats = statsRes.value;
          }
          if (reviewsRes.status === "fulfilled") {
            updates.reviews = reviewsRes.value?.reviews ?? [];
            updates.reviewSummary = reviewsRes.value?.summary ?? null;
          }

          set(updates);
        } catch (err) {
          console.error("[Dashboard Sync] Error:", err);
          set({ isLoading: false });
        }
      },

      // Notifications (API)
      apiNotifications: [],
      unreadCount: 0,
      unreadMessages: 0,
      refreshNotifications: async () => {
        try {
          const data = await notificationsApi.list();
          const notifications = (data?.notifications ?? []) as ApiNotification[];
          const messageNotifs = notifications.filter(
            (n) => n.type === "message" && !n.read
          ).length;
          set({
            apiNotifications: notifications,
            unreadCount: data?.unreadCount ?? 0,
            unreadMessages: messageNotifs,
          });
        } catch (err) {
          console.error("[Notifications] Error:", err);
        }
      },
      markNotificationRead: async (id: string) => {
        try {
          await notificationsApi.markRead(id);
          set((s) => ({
            apiNotifications: s.apiNotifications.map((n) => n.id === id ? { ...n, read: true } : n),
            unreadCount: Math.max(0, s.unreadCount - 1),
          }));
        } catch (err) {
          console.error("[Notification markRead] Error:", err);
        }
      },
      markAllNotificationsRead: async () => {
        try {
          await notificationsApi.markAllRead();
          set((s) => ({
            apiNotifications: s.apiNotifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          }));
        } catch (err) {
          console.error("[Notifications markAllRead] Error:", err);
        }
      },

      // Services
      services: INITIAL_SERVICES,
      addService: (service) => {
        const id = "s" + (Date.now().toString(36));
        const newService: Service = {
          ...service,
          id,
          extras: service.extras || [],
          views: 0,
          clicks: 0,
          orders: 0,
          revenue: 0,
          conversionRate: 0,
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ services: [newService, ...s.services] }));
      },
      updateService: (id, updates) =>
        set((s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, ...updates } : sv)) })),
      deleteService: (id) =>
        set((s) => ({ services: s.services.filter((sv) => sv.id !== id) })),
      toggleServiceStatus: (id) =>
        set((s) => ({
          services: s.services.map((sv) =>
            sv.id === id ? { ...sv, status: sv.status === "actif" ? "pause" : "actif" } : sv
          ),
        })),

      // API-backed service operations
      apiCreateService: async (data) => {
        try {
          const result = await servicesApi.create(data);
          const localService = mapApiServiceToLocal(result);
          set((s) => ({ services: [localService, ...s.services] }));
          return result.id;
        } catch (err) {
          console.error("[Service create] Error:", err);
          return null;
        }
      },
      apiDeleteService: async (id) => {
        try {
          await servicesApi.delete(id);
          set((s) => ({ services: s.services.filter((sv) => sv.id !== id) }));
          return true;
        } catch (err) {
          console.error("[Service delete] Error:", err);
          return false;
        }
      },
      apiToggleService: async (id) => {
        try {
          const result = await servicesApi.toggle(id);
          const local = mapApiServiceToLocal(result);
          set((s) => ({
            services: s.services.map((sv) => (sv.id === id ? local : sv)),
          }));
          return true;
        } catch (err) {
          console.error("[Service toggle] Error:", err);
          return false;
        }
      },

      // Orders
      orders: INITIAL_ORDERS,
      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const updates: Partial<Order> = { status };
            if (status === "livre") {
              updates.deliveredAt = new Date().toISOString();
              updates.progress = 100;
              updates.timeline = [
                ...o.timeline,
                { id: "t" + Date.now(), type: "delivered", title: "Livraison effectuée", description: "Vous avez livré la commande", timestamp: new Date().toISOString() },
              ];
            }
            if (status === "en_cours" && o.status === "en_attente") {
              updates.progress = 10;
              updates.timeline = [
                ...o.timeline,
                { id: "t" + Date.now(), type: "started", title: "Travail démarré", description: "Vous avez commencé le travail", timestamp: new Date().toISOString() },
              ];
            }
            if (status === "termine") {
              updates.progress = 100;
              updates.timeline = [
                ...o.timeline,
                { id: "t" + Date.now(), type: "completed", title: "Commande terminée", description: "Le client a validé la livraison", timestamp: new Date().toISOString() },
              ];
            }
            return { ...o, ...updates };
          }),
        })),
      addOrderMessage: (orderId, message) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, messages: [...o.messages, { ...message, id: "m" + Date.now() }] }
              : o
          ),
        })),
      addOrderFile: (orderId, file) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, files: [...o.files, { ...file, id: "f" + Date.now() }] }
              : o
          ),
        })),

      // API-backed order operations
      apiAcceptOrder: async (id) => {
        try {
          const result = await ordersApi.update(id, { status: "en_cours" });
          const local = mapApiOrderToLocal(result);
          set((s) => ({ orders: s.orders.map((o) => (o.id === id ? local : o)) }));
          return true;
        } catch (err) {
          console.error("[Order accept] Error:", err);
          return false;
        }
      },
      apiDeliverOrder: async (id, message, files) => {
        try {
          const result = await ordersApi.update(id, { deliveryMessage: message, deliveryFiles: files });
          const local = mapApiOrderToLocal(result);
          set((s) => ({ orders: s.orders.map((o) => (o.id === id ? local : o)) }));
          return true;
        } catch (err) {
          console.error("[Order deliver] Error:", err);
          return false;
        }
      },
      apiSendOrderMessage: async (orderId, content) => {
        try {
          const result = await ordersApi.sendMessage(orderId, { content });
          const local = mapApiOrderToLocal(result);
          set((s) => ({ orders: s.orders.map((o) => (o.id === orderId ? local : o)) }));
          return true;
        } catch (err) {
          console.error("[Order message] Error:", err);
          return false;
        }
      },

      // Transactions
      transactions: INITIAL_TRANSACTIONS,
      addTransaction: (tx) => {
        const id = "tx" + Date.now();
        set((s) => ({ transactions: [{ ...tx, id }, ...s.transactions] }));
      },
      apiRequestWithdrawal: async (amount, method) => {
        try {
          await financesApi.withdrawal({ amount, method });
          // Refresh transactions after withdrawal
          const txRes = await financesApi.transactions();
          set({ transactions: txRes.transactions.map(mapApiTransactionToLocal) });
          return true;
        } catch (err) {
          console.error("[Withdrawal] Error:", err);
          return false;
        }
      },

      // Conversations
      conversations: INITIAL_CONVERSATIONS,
      sendMessage: (convId, content, type = "text", fileName, fileSize) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            if (c.id !== convId) return c;
            const newMsg: ChatMessage = {
              id: "cm" + Date.now(),
              sender: "me",
              content,
              timestamp: new Date().toISOString(),
              type,
              fileName,
              fileSize,
              read: true,
            };
            return {
              ...c,
              messages: [...c.messages, newMsg],
              lastMessage: content,
              lastMessageTime: new Date().toISOString(),
            };
          }),
        })),
      markConversationRead: (convId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
              : c
          ),
        })),
      apiSendMessage: async (convId, content) => {
        try {
          // Optimistic update
          const msg: ChatMessage = {
            id: "cm" + Date.now(),
            sender: "me",
            content,
            timestamp: new Date().toISOString(),
            type: "text",
            read: true,
          };
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? { ...c, messages: [...c.messages, msg], lastMessage: content, lastMessageTime: new Date().toISOString() }
                : c
            ),
          }));
          // API call
          await conversationsApi.sendMessage(convId, { content });
          // Refresh after auto-reply delay
          setTimeout(async () => {
            try {
              const data = await conversationsApi.list();
              set({ conversations: data.conversations.map(mapApiConversationToLocal) });
            } catch { /* ignore */ }
          }, 3000);
          return true;
        } catch (err) {
          console.error("[Message send] Error:", err);
          return false;
        }
      },

      // Portfolio
      portfolio: INITIAL_PORTFOLIO,
      addPortfolioProject: (project) => {
        const id = "p" + Date.now();
        const order = get().portfolio.length;
        set((s) => ({
          portfolio: [
            ...s.portfolio,
            { ...project, id, createdAt: new Date().toISOString().slice(0, 10), order },
          ],
        }));
      },
      updatePortfolioProject: (id, updates) =>
        set((s) => ({
          portfolio: s.portfolio.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deletePortfolioProject: (id) =>
        set((s) => ({ portfolio: s.portfolio.filter((p) => p.id !== id) })),
      reorderPortfolio: (projects) => set({ portfolio: projects }),

      // Profile
      profile: DEMO_PROFILE,
      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),
      apiSaveProfile: async (updates) => {
        try {
          const result = await profileApi.update(updates as Record<string, unknown>);
          set((s) => ({
            profile: {
              ...s.profile,
              firstName: result.firstName,
              lastName: result.lastName,
              username: result.username,
              email: result.email,
              phone: result.phone,
              photo: result.photo,
              coverPhoto: (result as unknown as Record<string, unknown>).coverPhoto as string || s.profile.coverPhoto,
              title: result.title,
              bio: result.bio,
              city: result.city,
              country: result.country,
              hourlyRate: result.hourlyRate,
              skills: result.skills as FreelancerProfile["skills"],
              languages: result.languages,
              education: (result as unknown as Record<string, unknown>).education as FreelancerProfile["education"] || s.profile.education,
              links: result.links,
              completionPercent: result.completionPercent,
            },
          }));
          return true;
        } catch (err) {
          console.error("[Profile save] Error:", err);
          return false;
        }
      },

      // Availability
      availability: DEMO_AVAILABILITY,
      vacationMode: false,
      updateAvailability: (day, updates) =>
        set((s) => ({
          availability: s.availability.map((a) => (a.day === day ? { ...a, ...updates } : a)),
        })),
      toggleVacationMode: async () => {
        const newMode = !get().vacationMode;
        try {
          await profileApi.update({ vacationMode: newMode });
          set((s) => {
            if (newMode) {
              return {
                vacationMode: newMode,
                services: s.services.map((sv) =>
                  sv.status === "actif" ? { ...sv, status: "pause" as const } : sv
                ),
              };
            }
            return { vacationMode: newMode };
          });
        } catch {
          // Revert: state not changed since we only update on success
        }
      },

      // Notifications
      notificationSettings: DEMO_NOTIFICATION_SETTINGS,
      updateNotificationSetting: (id, updates) =>
        set((s) => ({
          notificationSettings: s.notificationSettings.map((n) =>
            n.id === id ? { ...n, ...updates } : n
          ),
        })),

      // Settings
      settings: {
        language: "fr",
        theme: "sombre" as const,
        twoFactorEnabled: false,
      },
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      // Reviews
      reviews: [],
      reviewSummary: null,
      syncReviews: async () => {
        try {
          const data = await reviewsApi.getByFreelance();
          set({ reviews: data?.reviews ?? [], reviewSummary: data?.summary ?? null });
        } catch (err) {
          console.error("[Reviews sync] Error:", err);
        }
      },
      apiReplyToReview: async (reviewId, reply) => {
        try {
          const result = await reviewsApi.reply(reviewId, reply);
          set((s) => ({
            reviews: s.reviews.map((r) => (r.id === reviewId ? result.review : r)),
          }));
          return true;
        } catch (err) {
          console.error("[Review reply] Error:", err);
          return false;
        }
      },
      apiReportReview: async (reviewId) => {
        try {
          const result = await reviewsApi.report(reviewId);
          set((s) => ({
            reviews: s.reviews.map((r) => (r.id === reviewId ? result.review : r)),
          }));
          return true;
        } catch (err) {
          console.error("[Review report] Error:", err);
          return false;
        }
      },
      apiMarkHelpful: async (reviewId) => {
        try {
          const result = await reviewsApi.markHelpful(reviewId);
          set((s) => ({
            reviews: s.reviews.map((r) => (r.id === reviewId ? result.review : r)),
          }));
          return true;
        } catch (err) {
          console.error("[Review helpful] Error:", err);
          return false;
        }
      },

      // Stats
      stats: null,
      syncStats: async () => {
        try {
          const data = await statsApi.get();
          set({ stats: data });
        } catch (err) {
          console.error("[Stats sync] Error:", err);
        }
      },

      // Subscription
      currentPlan: "pro",
      changePlan: (planId) => set({ currentPlan: planId }),

      // Affiliation
      affiliation: null,
      affiliationLoading: false,
      syncAffiliation: async () => {
        set({ affiliationLoading: true });
        try {
          const data = await affiliationApi.get();
          set({ affiliation: data, affiliationLoading: false });
        } catch (err) {
          console.error("[Affiliation sync] Error:", err);
          set({ affiliationLoading: false });
        }
      },
      sendInvite: async (email, message) => {
        try {
          await affiliationApi.invite(email, message);
          return true;
        } catch (err) {
          console.error("[Affiliation invite] Error:", err);
          return false;
        }
      },

      // Automation
      automation: null,
      automationLoading: false,
      syncAutomation: async () => {
        set({ automationLoading: true });
        try {
          const data = await automationApi.get();
          set({ automation: data, automationLoading: false });
        } catch (err) {
          console.error("[Automation sync] Error:", err);
          set({ automationLoading: false });
        }
      },
      createScenario: async (scenario) => {
        try {
          const result = await automationApi.createScenario(scenario);
          set((s) => {
            if (!s.automation) return s;
            return {
              automation: {
                ...s.automation,
                scenarios: [...s.automation.scenarios, result.scenario],
              },
            };
          });
          return true;
        } catch (err) {
          console.error("[Automation create] Error:", err);
          return false;
        }
      },
      toggleScenario: async (id, active) => {
        try {
          await automationApi.toggleScenario(id, active);
          set((s) => {
            if (!s.automation) return s;
            return {
              automation: {
                ...s.automation,
                scenarios: s.automation.scenarios.map((sc) =>
                  sc.id === id ? { ...sc, active } : sc
                ),
              },
            };
          });
          return true;
        } catch (err) {
          console.error("[Automation toggle] Error:", err);
          return false;
        }
      },
      deleteScenario: async (id) => {
        try {
          await automationApi.deleteScenario(id);
          set((s) => {
            if (!s.automation) return s;
            return {
              automation: {
                ...s.automation,
                scenarios: s.automation.scenarios.filter((sc) => sc.id !== id),
              },
            };
          });
          return true;
        } catch (err) {
          console.error("[Automation delete] Error:", err);
          return false;
        }
      },
    }),
    {
      name: "freelancehigh-dashboard-v2",
      partialize: (state) => ({
        services: state.services,
        orders: state.orders,
        transactions: state.transactions,
        conversations: state.conversations,
        portfolio: state.portfolio,
        profile: state.profile,
        availability: state.availability,
        vacationMode: state.vacationMode,
        notificationSettings: state.notificationSettings,
        settings: state.settings,
        currentPlan: state.currentPlan,
        reviews: state.reviews,
        reviewSummary: state.reviewSummary,
        stats: state.stats,
      }),
    }
  )
);
