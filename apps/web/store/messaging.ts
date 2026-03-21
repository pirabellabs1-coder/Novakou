// ============================================================
// FreelanceHigh — Unified Messaging Store
// Store Zustand dedie a la messagerie cross-roles
// Remplacable par une API WebSocket plus tard
// ============================================================

import { create } from "zustand";

// Show a toast error message without importing @/store/dashboard.
// We use dynamic import() instead of require() because Turbopack still
// treats require() as a static dependency — even inside a function body —
// which can cause "Cannot access 'y' before initialization" (TDZ error)
// when Turbopack evaluates messaging.ts before dashboard.ts finishes.
async function showErrorToast(message: string) {
  try {
    const { useToastStore } = await import("@/store/dashboard");
    useToastStore.getState().addToast("error", message);
  } catch {
    // Toast unavailable — silent fallback
    console.error("[MessagingStore toast fallback]", message);
  }
}

// ── Types ──

export type ConversationType = "direct" | "group" | "order" | "admin";
export type MessageContentType = "text" | "file" | "image" | "system" | "voice" | "call_audio" | "call_video" | "call_missed";
export type UserRole = "freelance" | "client" | "agence" | "admin";

export interface MessageParticipant {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  online: boolean;
}

export interface LinkPreviewData {
  title: string;
  description: string;
  image?: string;
  domain: string;
  url?: string;
}

export type MessageDeliveryStatus = "sending" | "sent" | "delivered" | "read";

export interface UnifiedMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  type: MessageContentType;
  fileName?: string;
  fileSize?: string;
  fileUrl?: string;
  fileType?: string;
  fileSizeBytes?: number;
  createdAt: string;
  readBy: string[];
  /** Delivery status: sending → sent → delivered → read */
  status: MessageDeliveryStatus;
  audioUrl?: string;
  audioDuration?: number;
  callDuration?: number;
  transcription?: string;
  editedAt?: string;
  deletedAt?: string;
  linkPreview?: LinkPreviewData;
  linkPreviews?: LinkPreviewData[];
}

export interface UnifiedConversation {
  id: string;
  type: ConversationType;
  participants: MessageParticipant[];
  title?: string;
  orderId?: string;
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

  // Actions
  setCurrentUser: (userId: string, role: UserRole) => void;
  sendMessage: (convId: string, content: string, type?: MessageContentType, fileName?: string, fileSize?: string, audioUrl?: string, audioDuration?: number, fileUrl?: string, fileType?: string) => void;
  markConversationRead: (convId: string) => void;
  createConversation: (participants: MessageParticipant[], type: ConversationType, title?: string, orderId?: string) => string;
  getMyConversations: () => UnifiedConversation[];
  getAllConversations: () => UnifiedConversation[];
  addSystemMessage: (convId: string, content: string) => void;

  // Edit & Delete
  editMessage: (convId: string, messageId: string, newContent: string) => void;
  deleteMessage: (convId: string, messageId: string) => void;

  // API sync
  syncFromApi: () => Promise<void>;
  apiSendMessage: (convId: string, content: string, type?: MessageContentType, fileName?: string, fileSize?: string, fileUrl?: string, fileType?: string) => Promise<void>;
  apiEditMessage: (convId: string, messageId: string, newContent: string) => Promise<boolean>;
  apiDeleteMessage: (convId: string, messageId: string) => Promise<boolean>;
}

// ── Demo Data ──

const DEMO_PARTICIPANTS: Record<string, MessageParticipant> = {
  "u1": { id: "u1", name: "Amadou Diallo", avatar: "AD", role: "freelance", online: true },
  "u2": { id: "u2", name: "Fatou Ndiaye", avatar: "FN", role: "freelance", online: false },
  "u3": { id: "u3", name: "Kofi Asante", avatar: "KA", role: "freelance", online: true },
  "u5": { id: "u5", name: "Ibrahim Keita", avatar: "IK", role: "freelance", online: false },
  "u6": { id: "u6", name: "Marie Dupont", avatar: "MD", role: "client", online: true },
  "u7": { id: "u7", name: "Jean-Pierre Lefebvre", avatar: "JL", role: "client", online: false },
  "u8": { id: "u8", name: "Sophie Martin", avatar: "SM", role: "client", online: true },
  "u11": { id: "u11", name: "Studio Digital Dakar", avatar: "SD", role: "agence", online: true },
  "u12": { id: "u12", name: "Agence Creatif CI", avatar: "AC", role: "agence", online: false },
  "admin-1": { id: "admin-1", name: "Admin Principal", avatar: "AP", role: "admin", online: true },
  // Real dev users
  "dev-1773299214975": { id: "dev-1773299214975", name: "Gildas LISSANON", avatar: "GL", role: "freelance", online: true },
  "dev-1773366800521": { id: "dev-1773366800521", name: "Gildas LISSANON", avatar: "GL", role: "client", online: true },
  "dev-admin-1": { id: "dev-admin-1", name: "Admin FreelanceHigh", avatar: "AF", role: "admin", online: true },
};

function p(id: string): MessageParticipant {
  return DEMO_PARTICIPANTS[id] ?? { id, name: "Inconnu", avatar: "??", role: "client", online: false };
}

function msg(id: string, senderId: string, content: string, type: MessageContentType = "text", minutesAgo: number = 0): UnifiedMessage {
  const sender = DEMO_PARTICIPANTS[senderId];
  return {
    id,
    senderId,
    senderName: sender?.name ?? "Inconnu",
    senderRole: sender?.role ?? "client",
    content,
    type,
    createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    readBy: [senderId],
    status: "sent",
  };
}

// Generate a tiny valid WAV data URL (0.5s silence) for demo voice messages
function makeDemoAudioUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    const sampleRate = 8000;
    const numSamples = sampleRate / 2; // 0.5 second
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    // WAV header
    const writeStr = (offset: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, numSamples * 2, true);
    // Silent samples (all zeros)
    const blob = new Blob([buffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  } catch {
    return "";
  }
}

let _demoAudioUrl: string | null = null;
function getDemoAudioUrl(): string {
  if (_demoAudioUrl === null) _demoAudioUrl = makeDemoAudioUrl();
  return _demoAudioUrl;
}

function voiceMsg(id: string, senderId: string, audioDuration: number, minutesAgo: number): UnifiedMessage {
  const sender = DEMO_PARTICIPANTS[senderId];
  return {
    id,
    senderId,
    senderName: sender?.name ?? "Inconnu",
    senderRole: sender?.role ?? "client",
    content: "Message vocal",
    type: "voice",
    audioUrl: getDemoAudioUrl(),
    audioDuration,
    transcription: "Bonjour, je voulais discuter du projet en cours...",
    createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    readBy: [senderId],
    status: "sent",
  };
}

function callMsg(id: string, senderId: string, callType: "call_audio" | "call_video" | "call_missed", callDuration: number, minutesAgo: number): UnifiedMessage {
  const sender = DEMO_PARTICIPANTS[senderId];
  const labels = { call_audio: "Appel audio", call_video: "Appel video", call_missed: "Appel manque" };
  return {
    id,
    senderId,
    senderName: sender?.name ?? "Inconnu",
    senderRole: sender?.role ?? "client",
    content: labels[callType],
    type: callType,
    callDuration,
    createdAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    readBy: [senderId],
    status: "sent",
  };
}

const DEMO_CONVERSATIONS: UnifiedConversation[] = [];

// ── Helpers ──

let _msgCounter = 100;
function genMsgId() {
  _msgCounter++;
  return `msg-${_msgCounter}-${Date.now()}`;
}

let _convCounter = 100;
function genConvId() {
  _convCounter++;
  return `conv-${_convCounter}`;
}

// ── Store ──

// Helper to map a StoredConversation (from API) to UnifiedConversation
function mapStoredToUnified(stored: {
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
  messages: { id: string; senderId: string; sender: string; content: string; timestamp: string; type: string; fileName?: string; fileSize?: string; fileUrl?: string; fileType?: string; read: boolean; linkPreviewData?: LinkPreviewData[] }[];
}, currentUserId: string): UnifiedConversation {
  // Build participants from stored data
  const otherParticipantId = stored.participants.find((p) => p !== currentUserId) || stored.participants[0];
  const participants: MessageParticipant[] = stored.participants.map((pid) => {
    if (pid === currentUserId) {
      return DEMO_PARTICIPANTS[pid] || { id: pid, name: "Vous", avatar: "V", role: "freelance" as UserRole, online: true };
    }
    return DEMO_PARTICIPANTS[pid] || {
      id: pid,
      name: stored.contactName,
      avatar: stored.contactAvatar,
      role: (stored.contactRole === "support" ? "admin" : stored.contactRole) as UserRole,
      online: stored.online,
    };
  });

  const messages: UnifiedMessage[] = stored.messages.map((m) => {
    const sender = DEMO_PARTICIPANTS[m.senderId];
    const readBy = m.read ? [currentUserId, m.senderId] : [m.senderId];
    // Derive delivery status: if read by recipient → read, else if not from current user → delivered, else sent
    const isMine = m.senderId === currentUserId || m.sender === "me";
    let status: MessageDeliveryStatus = "sent";
    if (isMine) {
      if (m.read || readBy.length > 1) {
        status = "read";
      } else {
        status = "delivered"; // API-persisted messages are at least delivered
      }
    } else {
      status = "delivered";
    }
    const mapped: UnifiedMessage = {
      id: m.id,
      senderId: m.senderId,
      senderName: sender?.name ?? (m.sender === "me" ? "Vous" : stored.contactName),
      senderRole: sender?.role ?? ("client" as UserRole),
      content: m.content,
      type: (m.type || "text") as MessageContentType,
      fileName: m.fileName,
      fileSize: m.fileSize,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      createdAt: m.timestamp,
      readBy,
      status,
    };
    if (m.linkPreviewData && m.linkPreviewData.length > 0) {
      mapped.linkPreviews = m.linkPreviewData;
      mapped.linkPreview = m.linkPreviewData[0];
    }
    return mapped;
  });

  return {
    id: stored.id,
    type: stored.orderId ? "order" : "direct",
    participants,
    title: stored.orderId ? `Commande ${stored.orderId}` : undefined,
    orderId: stored.orderId,
    lastMessage: stored.lastMessage,
    lastMessageTime: stored.lastMessageTime,
    unreadCount: stored.unread,
    messages,
  };
}

export const useMessagingStore = create<MessagingState>()((set, get) => ({
  conversations: DEMO_CONVERSATIONS,
  currentUserId: "u1", // Default pour le demo
  currentUserRole: "freelance" as UserRole,
  isSynced: false,

  setCurrentUser: (userId, role) => set({ currentUserId: userId, currentUserRole: role }),

  sendMessage: (convId, content, type = "text", fileName, fileSize, audioUrl, audioDuration, fileUrl, fileType) => {
    const { currentUserId, currentUserRole } = get();
    const participant = DEMO_PARTICIPANTS[currentUserId];

    const newMessage: UnifiedMessage = {
      id: genMsgId(),
      senderId: currentUserId,
      senderName: participant?.name ?? "Vous",
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
      status: "sent",
    };

    const lastMessageText =
      type === "voice" ? "Message vocal" :
      type === "file" ? (fileName ?? content) :
      type === "call_audio" ? "Appel audio" :
      type === "call_video" ? "Appel video" :
      type === "call_missed" ? "Appel manque" :
      content;

    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.id === convId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: lastMessageText,
              lastMessageTime: newMessage.createdAt,
            }
          : conv
      ),
    }));

    // Simulate delivery status progression: sent -> delivered after 500ms
    setTimeout(() => {
      set((s) => ({
        conversations: s.conversations.map((conv) =>
          conv.id === convId
            ? {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === newMessage.id && m.status === "sent"
                    ? { ...m, status: "delivered" as const }
                    : m
                ),
              }
            : conv
        ),
      }));
    }, 500);

    // Auto-detect URLs and fetch link previews for local messages (max 3)
    if (type === "text" && typeof window !== "undefined") {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
      const urls = content.match(urlRegex);
      if (urls && urls.length > 0) {
        const urlsToPreview = urls.slice(0, 3);
        Promise.all(
          urlsToPreview.map((url) =>
            fetch("/api/link-preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url }),
            })
              .then((res) => res.json())
              .then((data) => data.preview as LinkPreviewData | null)
              .catch(() => null)
          )
        ).then((results) => {
          const previews = results.filter((p): p is LinkPreviewData => p !== null);
          if (previews.length > 0) {
            set((s) => ({
              conversations: s.conversations.map((conv) =>
                conv.id === convId
                  ? {
                      ...conv,
                      messages: conv.messages.map((m) =>
                        m.id === newMessage.id
                          ? { ...m, linkPreviews: previews, linkPreview: previews[0] }
                          : m
                      ),
                    }
                  : conv
              ),
            }));
          }
        });
      }
    }

    // Simuler une reponse automatique apres 2 secondes
    if (type === "text") {
      setTimeout(() => {
        const conv = get().conversations.find((c) => c.id === convId);
        if (!conv) return;

        const otherParticipant = conv.participants.find((p) => p.id !== currentUserId);
        if (!otherParticipant) return;

        const replies = [
          "Merci pour votre message ! Je reviens vers vous rapidement.",
          "Bien recu, je regarde ca.",
          "Parfait, c'est note !",
          "Merci ! Je vous tiens au courant.",
          "D'accord, je m'en occupe.",
        ];
        const reply = replies[Math.floor(Math.random() * replies.length)];

        const autoReply: UnifiedMessage = {
          id: genMsgId(),
          senderId: otherParticipant.id,
          senderName: otherParticipant.name,
          senderRole: otherParticipant.role,
          content: reply,
          type: "text",
          createdAt: new Date().toISOString(),
          readBy: [otherParticipant.id],
          status: "delivered",
        };

        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: [...c.messages, autoReply],
                  lastMessage: reply,
                  lastMessageTime: autoReply.createdAt,
                  unreadCount: c.unreadCount + 1,
                }
              : c
          ),
        }));

        // Play notification sound for incoming message
        if (typeof window !== "undefined") {
          import("@/lib/webrtc/sounds").then(({ playMessageSound }) => {
            playMessageSound();
          }).catch(() => {});
        }

        // Create in-app notification for the incoming message (local/demo mode)
        if (typeof window !== "undefined") {
          const excerpt = reply.slice(0, 50) + (reply.length > 50 ? "..." : "");
          fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              create: true,
              title: "Nouveau message",
              message: `${otherParticipant.name} : ${excerpt}`,
              type: "message",
              link: "/dashboard/messages",
            }),
          }).catch(() => {});
        }
      }, 2000);
    }
  },

  markConversationRead: (convId) => {
    const { currentUserId } = get();
    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.id === convId
          ? {
              ...conv,
              unreadCount: 0,
              messages: conv.messages.map((m) => {
                const alreadyRead = m.readBy.includes(currentUserId);
                if (alreadyRead) return m;
                const newReadBy = [...m.readBy, currentUserId];
                // Update status to "read" when the other user reads it
                return { ...m, readBy: newReadBy, status: "read" as const };
              }),
            }
          : conv
      ),
    }));
  },

  createConversation: (participants, type, title, orderId) => {
    const id = genConvId();
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

  getMyConversations: () => {
    const { conversations, currentUserId } = get();
    return conversations.filter((c) => c.participants.some((p) => p.id === currentUserId));
  },

  getAllConversations: () => {
    return get().conversations;
  },

  addSystemMessage: (convId, content) => {
    const newMessage: UnifiedMessage = {
      id: genMsgId(),
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

  syncFromApi: async () => {
    try {
      const res = await fetch("/api/conversations");
      if (!res.ok) return;
      const data = await res.json();
      const { currentUserId } = get();
      const apiConversations: UnifiedConversation[] = (data.conversations || []).map(
        (c: Parameters<typeof mapStoredToUnified>[0]) => mapStoredToUnified(c, currentUserId)
      );
      if (apiConversations.length > 0) {
        set({ conversations: apiConversations, isSynced: true });
      } else {
        set({ isSynced: true });
      }
    } catch (err) {
      console.error("[MessagingStore syncFromApi]", err);
    }
  },

  editMessage: (convId, messageId, newContent) => {
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
  },

  deleteMessage: (convId, messageId) => {
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
  },

  apiSendMessage: async (convId, content, type = "text", fileName, fileSize, fileUrl, fileType) => {
    const { currentUserId, currentUserRole } = get();
    const participant = DEMO_PARTICIPANTS[currentUserId];

    // Optimistic local update
    const newMessage: UnifiedMessage = {
      id: genMsgId(),
      senderId: currentUserId,
      senderName: participant?.name ?? "Vous",
      senderRole: currentUserRole,
      content,
      type,
      fileName,
      fileSize,
      fileUrl,
      fileType,
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      status: "sending",
    };

    const lastMessageText =
      type === "voice" ? "Message vocal" :
      type === "file" ? (fileName ?? content) :
      content;

    set((s) => ({
      conversations: s.conversations.map((conv) =>
        conv.id === convId
          ? {
              ...conv,
              messages: [...conv.messages, newMessage],
              lastMessage: lastMessageText,
              lastMessageTime: newMessage.createdAt,
            }
          : conv
      ),
    }));

    // Auto-detect URLs for link previews on text messages (max 3)
    let linkPreviewDataArray: LinkPreviewData[] = [];
    if (type === "text") {
      const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
      const urls = content.match(urlRegex);
      if (urls && urls.length > 0) {
        const urlsToPreview = urls.slice(0, 3);
        try {
          const results = await Promise.all(
            urlsToPreview.map((url) =>
              fetch("/api/link-preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
              })
                .then((res) => res.json())
                .then((data) => data.preview as LinkPreviewData | null)
                .catch(() => null)
            )
          );
          linkPreviewDataArray = results.filter((p): p is LinkPreviewData => p !== null);
          if (linkPreviewDataArray.length > 0) {
            // Update the message optimistically with the previews
            set((s) => ({
              conversations: s.conversations.map((conv) =>
                conv.id === convId
                  ? {
                      ...conv,
                      messages: conv.messages.map((m) =>
                        m.id === newMessage.id
                          ? { ...m, linkPreviews: linkPreviewDataArray, linkPreview: linkPreviewDataArray[0] }
                          : m
                      ),
                    }
                  : conv
              ),
            }));
          }
        } catch {
          // Non-blocking: link preview is best-effort
        }
      }
    }

    // Persist via API
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type, fileName, fileSize, fileUrl, fileType, linkPreviewData: linkPreviewDataArray.length > 0 ? linkPreviewDataArray : undefined }),
      });
      if (res.ok) {
        // Update status from "sending" to "sent" after successful API persistence
        set((s) => ({
          conversations: s.conversations.map((conv) =>
            conv.id === convId
              ? {
                  ...conv,
                  messages: conv.messages.map((m) =>
                    m.id === newMessage.id && m.status === "sending"
                      ? { ...m, status: "sent" as const }
                      : m
                  ),
                }
              : conv
          ),
        }));
        // Simulate "delivered" status after a short delay (server-side delivery confirmation)
        setTimeout(() => {
          set((s) => ({
            conversations: s.conversations.map((conv) =>
              conv.id === convId
                ? {
                    ...conv,
                    messages: conv.messages.map((m) =>
                      m.id === newMessage.id && m.status === "sent"
                        ? { ...m, status: "delivered" as const }
                        : m
                    ),
                  }
                : conv
            ),
          }));
        }, 1000);
      }
      // Refresh from API after auto-reply delay
      setTimeout(() => get().syncFromApi(), 3000);
    } catch (err) {
      console.error("[MessagingStore apiSendMessage]", err);
    }
  },

  apiEditMessage: async (convId, messageId, newContent) => {
    // Optimistic update
    get().editMessage(convId, messageId, newContent);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        // Show error toast with server message
        try {
          const data = await res.json();
          await showErrorToast(data.error || "Erreur lors de la modification du message");
        } catch {
          await showErrorToast("Erreur lors de la modification du message");
        }
        // Revert on failure — re-sync from API
        await get().syncFromApi();
        return false;
      }
      return true;
    } catch (err) {
      console.error("[MessagingStore apiEditMessage]", err);
      await showErrorToast("Erreur lors de la modification du message");
      await get().syncFromApi();
      return false;
    }
  },

  apiDeleteMessage: async (convId, messageId) => {
    // Optimistic update
    get().deleteMessage(convId, messageId);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages/${messageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        // Show error toast with server message
        try {
          const data = await res.json();
          await showErrorToast(data.error || "Erreur lors de la suppression du message");
        } catch {
          await showErrorToast("Erreur lors de la suppression du message");
        }
        await get().syncFromApi();
        return false;
      }
      return true;
    } catch (err) {
      console.error("[MessagingStore apiDeleteMessage]", err);
      await showErrorToast("Erreur lors de la suppression du message");
      await get().syncFromApi();
      return false;
    }
  },
}));
