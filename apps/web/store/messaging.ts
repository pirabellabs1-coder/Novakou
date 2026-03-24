// ============================================================
// FreelanceHigh — Unified Messaging Store (API-first)
// Real-time via Socket.io when available, polling fallback
// ============================================================

import { create } from "zustand";
import { useToastStore } from "@/store/toast";
import type { Socket } from "socket.io-client";

function showToast(type: "error" | "success" | "info", message: string) {
  try {
    useToastStore.getState().addToast(type, message);
  } catch {
    console.error("[MessagingStore toast fallback]", message);
  }
}

// ── Types ──

export type ConversationType = "direct" | "group" | "order" | "admin";
export type MessageContentType = "text" | "file" | "image" | "system" | "voice" | "call_audio" | "call_video" | "call_missed";
export type UserRole = "freelance" | "client" | "agence" | "admin";
export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface MessageParticipant {
  id: string;
  name: string;
  avatar: string;
  role: UserRole | string;
  online: boolean;
}

export interface LinkPreviewData {
  title: string;
  description: string;
  image?: string;
  domain: string;
  url?: string;
}

export interface UnifiedMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole | string;
  content: string;
  type: MessageContentType;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  fileType?: string;
  fileSizeBytes?: number;
  createdAt: string;
  readBy: string[];
  status: MessageDeliveryStatus;
  audioUrl?: string;
  audioDuration?: number;
  callDuration?: number;
  transcription?: string;
  editedAt?: string;
  deletedAt?: string;
  linkPreview?: LinkPreviewData;
  linkPreviews?: LinkPreviewData[];
  /** Retry count for failed messages */
  _retryCount?: number;
}

export interface UnifiedConversation {
  id: string;
  type: ConversationType;
  participants: MessageParticipant[];
  title?: string;
  orderId?: string;
  orderNumber?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: UnifiedMessage[];
}

interface MessagingState {
  conversations: UnifiedConversation[];
  currentUserId: string;
  currentUserRole: UserRole;
  isSynced: boolean;
  isLoading: boolean;
  selectedConversationId: string | null;

  // Core actions
  setCurrentUser: (userId: string, role: UserRole) => void;
  setSelectedConversation: (convId: string | null) => void;

  // API-first messaging
  syncFromApi: () => Promise<void>;
  loadMessages: (convId: string) => Promise<void>;
  sendMessage: (convId: string, content: string, type?: MessageContentType, fileName?: string, fileSize?: string, audioUrl?: string, audioDuration?: number, fileUrl?: string, fileType?: string, storagePath?: string) => Promise<void>;
  markConversationRead: (convId: string) => Promise<void>;
  editMessage: (convId: string, messageId: string, newContent: string) => Promise<boolean>;
  deleteMessage: (convId: string, messageId: string) => Promise<boolean>;
  retryMessage: (convId: string, messageId: string) => Promise<void>;

  // Conversation management
  createConversation: (participants: MessageParticipant[], type: ConversationType, title?: string, orderId?: string) => string;
  addSystemMessage: (convId: string, content: string) => void;
  getMyConversations: () => UnifiedConversation[];
  getAllConversations: () => UnifiedConversation[];

  // Socket.io integration
  setupSocketListeners: (socket: Socket) => () => void;

  // Polling
  _pollingInterval: ReturnType<typeof setInterval> | null;
  startPolling: () => void;
  stopPolling: () => void;
}

// ── Helpers ──

let _msgCounter = Date.now();
function genTempId() {
  _msgCounter++;
  return `temp-${_msgCounter}`;
}

function mapApiConversation(c: Record<string, unknown>, currentUserId: string): UnifiedConversation {
  const participants = ((c.participants as Array<Record<string, unknown>>) || []).map((p) => ({
    id: (p.id as string) || "",
    name: (p.name as string) || "Utilisateur",
    avatar: (p.avatar as string) || ((p.name as string) || "U").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
    role: ((p.role as string) || "client") as UserRole,
    online: (p.online as boolean) || false,
  }));

  return {
    id: c.id as string,
    type: ((c.type as string) || "direct") as ConversationType,
    participants,
    title: c.title as string | undefined,
    orderId: c.orderId as string | undefined,
    orderNumber: c.orderNumber as string | undefined,
    lastMessage: (c.lastMessage as string) || "",
    lastMessageTime: (c.lastMessageTime as string) || new Date().toISOString(),
    unreadCount: (c.unreadCount as number) || 0,
    messages: [], // Messages loaded separately
  };
}

function mapApiMessage(m: Record<string, unknown>): UnifiedMessage {
  const linkPreviewData = m.linkPreviewData as LinkPreviewData[] | null;
  const mapped: UnifiedMessage = {
    id: (m.id as string) || "",
    senderId: (m.senderId as string) || "",
    senderName: (m.senderName as string) || "Utilisateur",
    senderRole: ((m.senderRole as string) || "client") as UserRole,
    content: (m.content as string) || "",
    type: ((m.type as string) || "text") as MessageContentType,
    fileName: m.fileName as string | undefined,
    fileSize: m.fileSize as string | undefined,
    fileUrl: m.fileUrl as string | undefined,
    fileType: m.fileType as string | undefined,
    fileSizeBytes: m.fileSizeBytes as number | undefined,
    createdAt: (m.createdAt as string) || (m.timestamp as string) || new Date().toISOString(),
    readBy: [],
    status: ((m.status as string) || "sent") as MessageDeliveryStatus,
    audioUrl: m.audioUrl as string | undefined,
    audioDuration: m.audioDuration as number | undefined,
    transcription: m.transcription as string | undefined,
    callDuration: m.callDuration as number | undefined,
    editedAt: m.editedAt as string | undefined,
    deletedAt: m.deletedAt as string | undefined,
  };

  if (m.read) {
    mapped.status = "read";
  }

  if (linkPreviewData && Array.isArray(linkPreviewData) && linkPreviewData.length > 0) {
    mapped.linkPreviews = linkPreviewData;
    mapped.linkPreview = linkPreviewData[0];
  }

  return mapped;
}

// ── Store ──

export const useMessagingStore = create<MessagingState>()((set, get) => ({
  conversations: [],
  currentUserId: "",
  currentUserRole: "freelance" as UserRole,
  isSynced: false,
  isLoading: false,
  selectedConversationId: null,
  _pollingInterval: null,

  setCurrentUser: (userId, role) => set({ currentUserId: userId, currentUserRole: role }),

  setSelectedConversation: (convId) => set({ selectedConversationId: convId }),

  // ── Sync conversations from API ──
  syncFromApi: async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      const { currentUserId } = get();

      const apiConversations: UnifiedConversation[] = (data.conversations || []).map(
        (c: Record<string, unknown>) => mapApiConversation(c, currentUserId)
      );

      // Merge with existing conversations to preserve loaded messages
      set((s) => {
        const merged = apiConversations.map((apiConv) => {
          const existing = s.conversations.find((c) => c.id === apiConv.id);
          if (existing) {
            return {
              ...apiConv,
              messages: existing.messages, // Keep loaded messages
              participants: apiConv.participants, // Update participant info
            };
          }
          return apiConv;
        });

        return { conversations: merged, isSynced: true, isLoading: false };
      });
    } catch (err) {
      console.error("[MessagingStore syncFromApi]", err);
      set({ isLoading: false });
    }
  },

  // ── Load messages for a conversation ──
  loadMessages: async (convId) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      if (!res.ok) return;
      const data = await res.json();

      const messages: UnifiedMessage[] = (data.messages || []).map(
        (m: Record<string, unknown>) => mapApiMessage(m)
      );

      set((s) => ({
        conversations: s.conversations.map((conv) =>
          conv.id === convId ? { ...conv, messages, unreadCount: 0 } : conv
        ),
      }));
    } catch (err) {
      console.error("[MessagingStore loadMessages]", err);
    }
  },

  // ── Send message with optimistic update ──
  sendMessage: async (convId, content, type = "text", fileName, fileSize, audioUrl, audioDuration, fileUrl, fileType, storagePath) => {
    const { currentUserId, currentUserRole } = get();
    const tempId = genTempId();

    // Find sender name from participants
    const conv = get().conversations.find((c) => c.id === convId);
    const me = conv?.participants.find((p) => p.id === currentUserId);

    const newMessage: UnifiedMessage = {
      id: tempId,
      senderId: currentUserId,
      senderName: me?.name ?? "Vous",
      senderRole: currentUserRole,
      content,
      type,
      fileName,
      fileSize,
      fileUrl,
      fileType,
      audioUrl,
      audioDuration,
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      status: "sending",
      _retryCount: 0,
    };

    const lastMessageText =
      type === "voice" ? "Message vocal" :
      type === "file" ? (fileName ?? content) :
      type === "call_audio" ? "Appel audio" :
      type === "call_video" ? "Appel video" :
      type === "call_missed" ? "Appel manque" :
      content;

    // Optimistic update
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessage: lastMessageText,
              lastMessageTime: newMessage.createdAt,
            }
          : c
      ),
    }));

    // Persist via API
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, fileName, fileSize, fileUrl, fileType, audioUrl, audioDuration, storagePath }),
      });

      if (res.ok) {
        const data = await res.json();
        const serverMessage = data.message;

        // Replace temp message with server version
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId
                      ? {
                          ...m,
                          id: serverMessage.id,
                          status: "sent" as const,
                          createdAt: serverMessage.createdAt || m.createdAt,
                          audioUrl: serverMessage.audioUrl || m.audioUrl,
                          audioDuration: serverMessage.audioDuration || m.audioDuration,
                          fileUrl: serverMessage.fileUrl || m.fileUrl,
                        }
                      : m
                  ),
                }
              : c
          ),
        }));

        // Simulate delivered after 1s
        setTimeout(() => {
          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === serverMessage.id && m.status === "sent"
                        ? { ...m, status: "delivered" as const }
                        : m
                    ),
                  }
                : c
            ),
          }));
        }, 1000);
      } else {
        // Mark as failed
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === tempId ? { ...m, status: "failed" as const } : m
                  ),
                }
              : c
          ),
        }));
      }
    } catch (err) {
      console.error("[MessagingStore sendMessage]", err);
      // Mark as failed
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === tempId ? { ...m, status: "failed" as const } : m
                ),
              }
            : c
        ),
      }));

      // Auto-retry after 2s (max 2 retries)
      const retryCount = newMessage._retryCount || 0;
      if (retryCount < 2) {
        setTimeout(() => {
          const state = get();
          const msg = state.conversations
            .find((c) => c.id === convId)
            ?.messages.find((m) => m.id === tempId);
          if (msg && msg.status === "failed") {
            // Remove failed message and resend
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id === convId
                  ? { ...c, messages: c.messages.filter((m) => m.id !== tempId) }
                  : c
              ),
            }));
            get().sendMessage(convId, content, type, fileName, fileSize, audioUrl, audioDuration, fileUrl, fileType, storagePath);
          }
        }, retryCount === 0 ? 2000 : 5000);
      }
    }
  },

  // ── Retry a failed message ──
  retryMessage: async (convId, messageId) => {
    const conv = get().conversations.find((c) => c.id === convId);
    const msg = conv?.messages.find((m) => m.id === messageId);
    if (!msg || msg.status !== "failed") return;

    // Remove the failed message
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId
          ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) }
          : c
      ),
    }));

    // Resend
    await get().sendMessage(
      convId, msg.content, msg.type, msg.fileName, msg.fileSize,
      msg.audioUrl, msg.audioDuration, msg.fileUrl, msg.fileType
    );
  },

  // ── Mark conversation as read ──
  markConversationRead: async (convId) => {
    const { currentUserId } = get();

    // Optimistic update
    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.id === convId
          ? {
              ...conv,
              unreadCount: 0,
              messages: conv.messages.map((m) =>
                m.senderId !== currentUserId && m.status !== "read"
                  ? { ...m, status: "read" as const, readBy: [...m.readBy, currentUserId] }
                  : m
              ),
            }
          : conv
      ),
    }));

    // Persist
    try {
      await fetch(`/api/conversations/${convId}/read`, { method: "POST" });
    } catch (err) {
      console.error("[MessagingStore markConversationRead]", err);
    }
  },

  // ── Edit message ──
  editMessage: async (convId, messageId, newContent) => {
    // Optimistic update
    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.id === convId
          ? {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === messageId
                  ? { ...m, content: newContent, editedAt: new Date().toISOString() }
                  : m
              ),
            }
          : conv
      ),
    }));

    try {
      const res = await fetch(`/api/conversations/${convId}/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast("error", (data as Record<string, string>).error || "Erreur lors de la modification");
        await get().loadMessages(convId);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[MessagingStore editMessage]", err);
      showToast("error", "Erreur lors de la modification");
      await get().loadMessages(convId);
      return false;
    }
  },

  // ── Delete message ──
  deleteMessage: async (convId, messageId) => {
    // Optimistic update
    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.id === convId
          ? {
              ...conv,
              messages: conv.messages.map((m) =>
                m.id === messageId
                  ? { ...m, content: "Ce message a ete supprime", deletedAt: new Date().toISOString() }
                  : m
              ),
            }
          : conv
      ),
    }));

    try {
      const res = await fetch(`/api/conversations/${convId}/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast("error", (data as Record<string, string>).error || "Erreur lors de la suppression");
        await get().loadMessages(convId);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[MessagingStore deleteMessage]", err);
      showToast("error", "Erreur lors de la suppression");
      await get().loadMessages(convId);
      return false;
    }
  },

  // ── Create conversation (local optimistic) ──
  createConversation: (participants, type, title, orderId) => {
    const id = genTempId();
    const newConv: UnifiedConversation = {
      id,
      type,
      participants,
      title,
      orderId,
      lastMessage: "",
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: [],
    };

    set((s) => ({
      conversations: [newConv, ...s.conversations],
    }));

    return id;
  },

  addSystemMessage: (convId, content) => {
    const newMessage: UnifiedMessage = {
      id: genTempId(),
      senderId: "system",
      senderName: "Systeme",
      senderRole: "admin",
      content,
      type: "system",
      createdAt: new Date().toISOString(),
      readBy: [],
      status: "sent",
    };

    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.id === convId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: content,
              lastMessageTime: newMessage.createdAt,
            }
          : conv
      ),
    }));
  },

  getMyConversations: () => {
    const { conversations, currentUserId } = get();
    return conversations.filter((c) => c.participants.some((p) => p.id === currentUserId));
  },

  getAllConversations: () => get().conversations,

  // ── Socket.io event listeners ──
  setupSocketListeners: (socket: Socket) => {
    const handleNewMessage = (data: { conversationId: string; message: Record<string, unknown> }) => {
      const { currentUserId, selectedConversationId } = get();
      const msg = mapApiMessage(data.message);

      // Don't add our own messages (already added optimistically)
      if (msg.senderId === currentUserId) return;

      set((s) => {
        const conv = s.conversations.find((c) => c.id === data.conversationId);
        if (!conv) return s;

        const isSelected = data.conversationId === selectedConversationId;

        return {
          conversations: s.conversations.map((c) =>
            c.id === data.conversationId
              ? {
                  ...c,
                  messages: [...c.messages, msg],
                  lastMessage: msg.content,
                  lastMessageTime: msg.createdAt,
                  unreadCount: isSelected ? c.unreadCount : c.unreadCount + 1,
                }
              : c
          ),
        };
      });

      // Show toast if not in the conversation
      if (data.conversationId !== selectedConversationId) {
        const excerpt = msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : "");
        showToast("info", `${msg.senderName}: ${excerpt}`);
      }

      // Play notification sound
      if (typeof window !== "undefined") {
        import("@/lib/webrtc/sounds").then(({ playMessageSound }) => {
          playMessageSound();
        }).catch(() => {});
      }
    };

    const handleMessageRead = (data: { conversationId: string; userId: string; readAt: string }) => {
      const { currentUserId } = get();
      if (data.userId === currentUserId) return;

      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.senderId === currentUserId && m.status !== "read"
                    ? { ...m, status: "read" as const }
                    : m
                ),
              }
            : c
        ),
      }));
    };

    const handleMessageEdited = (data: { conversationId: string; messageId: string; content: string; editedAt: string }) => {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === data.messageId
                    ? { ...m, content: data.content, editedAt: data.editedAt }
                    : m
                ),
              }
            : c
        ),
      }));
    };

    const handleMessageDeleted = (data: { conversationId: string; messageId: string; deletedAt: string }) => {
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === data.conversationId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === data.messageId
                    ? { ...m, content: "Ce message a ete supprime", deletedAt: data.deletedAt }
                    : m
                ),
              }
            : c
        ),
      }));
    };

    const handleUserOnline = (data: { userId: string; online: boolean }) => {
      set((s) => ({
        conversations: s.conversations.map((c) => ({
          ...c,
          participants: c.participants.map((p) =>
            p.id === data.userId ? { ...p, online: data.online } : p
          ),
        })),
      }));
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:read", handleMessageRead);
    socket.on("message:edited", handleMessageEdited);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("user:online", handleUserOnline);

    // Return cleanup function
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:read", handleMessageRead);
      socket.off("message:edited", handleMessageEdited);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("user:online", handleUserOnline);
    };
  },

  // ── Polling fallback ──
  startPolling: () => {
    const existing = get()._pollingInterval;
    if (existing) return; // Already polling

    const interval = setInterval(() => {
      get().syncFromApi();
      // Also reload messages for selected conversation
      const { selectedConversationId } = get();
      if (selectedConversationId) {
        get().loadMessages(selectedConversationId);
      }
    }, 3000);

    set({ _pollingInterval: interval });
  },

  stopPolling: () => {
    const interval = get()._pollingInterval;
    if (interval) {
      clearInterval(interval);
      set({ _pollingInterval: null });
    }
  },
}));
