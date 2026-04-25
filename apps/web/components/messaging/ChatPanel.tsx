"use client";

import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./voice/VoiceRecorder";
import { ImageLightbox } from "./ImageLightbox";
import { OfferBubble } from "./OfferBubble";
import { InlineOfferForm } from "./InlineOfferForm";
import type { UnifiedConversation, MessageContentType } from "@/store/messaging";
import { useToastStore } from "@/store/toast";

declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (prompt: string, options?: { model?: string; temperature?: number; max_tokens?: number }) => Promise<{ message?: { content: string } } | string>;
      };
    };
  }
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",
  "mp4", "webm", "mov",
  "zip", "rar", "7z",
];

// Detect garbage: technical IDs, URLs, long filenames
function isGarbageDisplay(str: string): boolean {
  if (!str) return false;
  const s = str.trim();
  if (s.length < 3) return false;
  if (/^(https?:\/\/|data:|blob:)/i.test(s)) return true;
  if (/^c[a-z0-9]{20,}$/i.test(s)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return true;
  if (s.length >= 24 && /^[a-z0-9_./-]+$/i.test(s) && !s.includes(" ")) return true;
  return false;
}

function sanitizeDisplay(text: string, fallback: string): string {
  if (!text || isGarbageDisplay(text.trim())) return fallback;
  return text;
}

interface ChatPanelProps {
  conversation: UnifiedConversation | null;
  currentUserId: string;
  currentUserRole?: string;
  onSendMessage: (content: string, type?: MessageContentType, fileName?: string, fileSize?: string, audioUrl?: string, audioDuration?: number, fileUrl?: string, fileType?: string, storagePath?: string) => void;
  onMarkRead: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onRetryMessage?: (messageId: string) => void;
  onSendOffer?: (data: { title: string; amount: number; delay: string; revisions: number; description: string; validityDays: number }) => Promise<boolean>;
  onAcceptOffer?: (offerId: string) => Promise<void>;
  onRefuseOffer?: (offerId: string) => Promise<void>;
  showAdminActions?: boolean;
  onSendSystemMessage?: (content: string) => void;
  onStartAudioCall?: () => void;
  onStartVideoCall?: () => void;
  onMobileBack?: () => void;
}

function uploadFileToServer(
  file: File,
  onProgress?: (pct: number) => void,
  abortSignal?: AbortSignal
): Promise<{ url: string; path: string; name: string; size: number; type: string } | null> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "message-attachments");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/file");

    if (abortSignal) {
      abortSignal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Upload annule"));
      });
    }

    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.success && data.file) {
          resolve({ url: data.file.url, path: data.file.path || '', name: data.file.name, size: data.file.size, type: data.file.type });
        } else {
          reject(new Error(data.error || "Upload echoue"));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || "Upload echoue"));
        } catch {
          reject(new Error("Upload echoue"));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Erreur reseau"));
    xhr.send(formData);
  });
}

export function ChatPanel({
  conversation,
  currentUserId,
  currentUserRole = "freelance",
  onSendMessage,
  onMarkRead,
  onEditMessage,
  onDeleteMessage,
  onRetryMessage,
  onSendOffer,
  onAcceptOffer,
  onRefuseOffer,
  showAdminActions = false,
  onSendSystemMessage,
  onStartAudioCall,
  onStartVideoCall,
  onMobileBack,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const [puterReady, setPuterReady] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const isUserScrolledUpRef = useRef(false);

  // Smart auto-scroll
  const scrollToBottom = useCallback((force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 150;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    if (force || isNearBottom || !isUserScrolledUpRef.current) {
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 150;
    isUserScrolledUpRef.current = container.scrollHeight - container.scrollTop - container.clientHeight > threshold;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages?.length, scrollToBottom]);

  useEffect(() => {
    isUserScrolledUpRef.current = false;
    scrollToBottom(true);
  }, [conversation?.id, scrollToBottom]);

  useEffect(() => {
    if (conversation) onMarkRead();
  }, [conversation?.id, onMarkRead]);

  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  // Puter SDK readiness
  useEffect(() => {
    const check = () => { if (window.puter) { setPuterReady(true); return true; } return false; };
    if (check()) return;
    const interval = setInterval(() => { if (check()) clearInterval(interval); }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleAiSuggest = useCallback(async () => {
    if (!conversation || !puterReady || aiSuggesting) return;
    const msgs = (conversation.messages || []).slice(-10);
    if (msgs.length === 0) {
      useToastStore.getState().addToast("error", "Aucun message pour contexte");
      return;
    }

    setAiSuggesting(true);
    try {
      const context = msgs.map((m) => `${m.senderName} (${m.senderRole}): ${m.content}`).join("\n");
      const prompt = `Tu es un assistant de messagerie pour une plateforme de formations en ligne (Afrique francophone).
Voici les derniers messages d'une conversation :

${context}

Suggère une réponse professionnelle, courtoise et utile que le vendeur pourrait envoyer. La réponse doit :
- Être en français
- Être concise (2-4 phrases max)
- Être adaptée au contexte de la conversation
- Ne pas commencer par "Bonjour" si la conversation est déjà engagée

Retourne UNIQUEMENT le texte de la réponse suggérée, sans guillemets ni explication.`;

      const res = await window.puter!.ai.chat(prompt, {
        model: "claude-sonnet-4-6",
        temperature: 0.7,
        max_tokens: 300,
      });

      const result = typeof res === "string" ? res : res?.message?.content;
      if (result) {
        setInput(result.trim());
      }
    } catch (err) {
      console.error("[AI Suggest]", err);
      useToastStore.getState().addToast("error", "IA indisponible. Réessayez.");
    } finally {
      setAiSuggesting(false);
    }
  }, [conversation, puterReady, aiSuggesting]);

  function handleSend() {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
    isUserScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom(true), 50);
  }

  function validateFile(file: File): string | null {
    if (file.size > MAX_FILE_SIZE) {
      return `Le fichier "${file.name}" depasse la taille maximale de 25 MB`;
    }
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Le type de fichier "${ext}" n'est pas autorise`;
    }
    return null;
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files) return;
    const validFiles = Array.from(files).filter((file) => {
      const error = validateFile(file);
      if (error) { setUploadError(error); return false; }
      return true;
    });
    if (validFiles.length === 0) return;

    const abortController = new AbortController();
    uploadAbortRef.current = abortController;
    let completedCount = 0;
    const totalCount = validFiles.length;

    const uploadPromises = validFiles.map(async (file) => {
      setUploadProgress({
        fileName: totalCount > 1 ? `${file.name} (${completedCount + 1}/${totalCount})` : file.name,
        progress: 0,
      });
      try {
        const result = await uploadFileToServer(file, (pct) => {
          setUploadProgress({
            fileName: totalCount > 1 ? `${file.name} (${completedCount + 1}/${totalCount})` : file.name,
            progress: pct,
          });
        }, abortController.signal);
        if (result) {
          const isImage = file.type.startsWith("image/");
          const msgType: MessageContentType = isImage ? "image" : "file";
          const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          onSendMessage(file.name, msgType, file.name, sizeStr, undefined, undefined, result.url, file.type, result.path);
        }
        completedCount++;
      } catch (err) {
        if (err instanceof Error && err.message === "Upload annule") return;
        setUploadError(err instanceof Error ? err.message : "Upload echoue");
      }
    });

    await Promise.allSettled(uploadPromises);
    setUploadProgress(null);
    uploadAbortRef.current = null;
  }

  function handleCancelUpload() {
    uploadAbortRef.current?.abort();
    setUploadProgress(null);
    uploadAbortRef.current = null;
  }

  const handleVoiceSend = useCallback(async (blob: Blob, duration: number) => {
    // Derive file extension from actual MIME type
    const mime = blob.type || "audio/webm";
    let ext = "webm";
    if (mime.includes("mp4") || mime.includes("m4a")) ext = "m4a";
    else if (mime.includes("ogg")) ext = "ogg";
    else if (mime.includes("mp3") || mime.includes("mpeg")) ext = "mp3";

    try {
      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mime });
      const result = await uploadFileToServer(file);
      if (!result?.path) {
        useToastStore.getState().addToast("error", "Erreur lors de l'envoi du message vocal");
        return;
      }
      const audioUrl = result.url;
      onSendMessage("Message vocal", "voice", undefined, undefined, audioUrl, duration, undefined, undefined, result.path);
    } catch {
      useToastStore.getState().addToast("error", "Erreur lors de l'envoi du message vocal");
    }
  }, [onSendMessage]);

  // Drag and drop
  function handleDragEnter(e: DragEvent) { e.preventDefault(); dragCounterRef.current++; if (e.dataTransfer.types.includes("Files")) setIsDragging(true); }
  function handleDragLeave(e: DragEvent) { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current === 0) setIsDragging(false); }
  function handleDragOver(e: DragEvent) { e.preventDefault(); }
  function handleDrop(e: DragEvent) { e.preventDefault(); dragCounterRef.current = 0; setIsDragging(false); if (e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files); }

  // ── Empty state ──
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 p-4 min-h-0">
        <div className="text-center">
          {onMobileBack && (
            <button onClick={onMobileBack} className="md:hidden mb-4 px-4 py-2 text-sm text-primary font-semibold hover:bg-primary/10 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
              Retour aux conversations
            </button>
          )}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl md:text-4xl text-primary/40">forum</span>
          </div>
          <p className="font-medium text-slate-400 text-sm md:text-base">Selectionnez une conversation</p>
          <p className="text-xs mt-2 text-slate-600">Vos messages apparaitront ici</p>
        </div>
      </div>
    );
  }

  const otherParticipants = (conversation.participants || []).filter((p) => p.id !== currentUserId);
  // Sanitize display name — never show technical IDs
  const rawName = conversation.title || otherParticipants.map((p) => p.name).join(", ") || "";
  const displayName = sanitizeDisplay(rawName, otherParticipants.length > 0 ? "Utilisateur" : "Conversation");
  const isOnline = otherParticipants.some((p) => p.online);
  const filteredMessages = conversation.messages || [];

  return (
    <div
      className="flex-1 flex flex-col min-h-0 min-w-0 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-primary/5 border-2 border-dashed border-primary/40 rounded-lg flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-primary/60">cloud_upload</span>
            <p className="text-sm text-primary/80 font-medium mt-2">Deposez vos fichiers ici</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-border-dark flex-shrink-0 bg-background-dark/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {onMobileBack && (
            <button onClick={onMobileBack} className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0" aria-label="Retour">
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          )}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {(() => {
                const av = otherParticipants[0]?.avatar ?? "";
                if (!av || isGarbageDisplay(av) || av.length > 3) {
                  const name = otherParticipants[0]?.name ?? "U";
                  return sanitizeDisplay(name, "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                }
                return av.slice(0, 2);
              })()}
            </div>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-background-dark rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">
              {isOnline ? "En ligne" : "Hors ligne"}
              {otherParticipants[0]?.role && ` · ${String(otherParticipants[0].role).charAt(0).toUpperCase() + String(otherParticipants[0].role).slice(1)}`}
              {conversation.orderId && ` · Commande #${(conversation.orderNumber || conversation.orderId.slice(-6)).toUpperCase()}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          {conversation.orderId && (
            <a href={`/dashboard/commandes/${conversation.orderId}`} className="hidden sm:flex text-xs text-primary font-bold hover:underline items-center gap-1 mr-2">
              Voir la commande <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          )}
          {onStartAudioCall && (
            <button onClick={onStartAudioCall} className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-colors" title="Appel audio">
              <span className="material-symbols-outlined text-lg">call</span>
            </button>
          )}
          {onStartVideoCall && (
            <button onClick={onStartVideoCall} className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors" title="Appel video">
              <span className="material-symbols-outlined text-lg">videocam</span>
            </button>
          )}
          {showAdminActions && onSendSystemMessage && (
            <button onClick={() => { const msg = prompt("Message systeme:"); if (msg) onSendSystemMessage(msg); }} className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" title="Message systeme">
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain p-2 md:p-4 space-y-2 md:space-y-3"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">chat</span>
              <p className="text-sm text-slate-500">Aucun message</p>
              <p className="text-xs text-slate-600 mt-1">Envoyez le premier message !</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg, i) => {
            const isOwn = msg.senderId === currentUserId;
            const prevMsg = i > 0 ? filteredMessages[i - 1] : null;
            const showSenderInfo = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === "system");

            // Render offer messages as OfferBubble
            if (msg.type === "offer" && msg.offerData) {
              return (
                <div key={msg.id} className={cn("flex flex-col gap-1 px-1 md:px-4 my-3 max-w-full overflow-hidden", isOwn ? "items-end" : "items-start")}>
                  {showSenderInfo && <p className="text-xs font-semibold text-slate-500 mb-1">{msg.senderName}</p>}
                  <OfferBubble
                    offer={msg.offerData}
                    isMine={isOwn}
                    currentUserRole={currentUserRole}
                    onAccept={onAcceptOffer}
                    onRefuse={onRefuseOffer}
                  />
                  <p className="text-[10px] text-slate-600 mt-0.5">{new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              );
            }

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={isOwn}
                showSenderInfo={showSenderInfo}
                conversationId={conversation.id}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onRetry={onRetryMessage}
                onImageClick={(url) => setLightboxImage(url)}
              />
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Upload progress */}
      {(uploadProgress || uploadError) && (
        <div className="px-4 py-2 border-t border-border-dark/50 flex-shrink-0">
          {uploadProgress && (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-sm text-primary animate-spin">progress_activity</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400 truncate">{uploadProgress.fileName}</p>
                <div className="w-full h-1.5 bg-border-dark rounded-full mt-1">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress.progress}%` }} />
                </div>
              </div>
              <span className="text-xs text-slate-500">{uploadProgress.progress}%</span>
              <button onClick={handleCancelUpload} className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors" title="Annuler">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 text-red-400">
              <span className="material-symbols-outlined text-sm">error</span>
              <p className="text-xs truncate">{uploadError}</p>
              <button onClick={() => setUploadError(null)} className="ml-auto text-slate-500 hover:text-slate-300">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Input ── */}
      {/* Inline offer form */}
      {showOfferForm && conversation && (
        <div className="border-t border-border-dark p-3 md:p-4 bg-background-dark/80 backdrop-blur-sm">
          <InlineOfferForm
            recipientName={(conversation.participants || []).find((p) => p.id !== currentUserId)?.name || "le destinataire"}
            conversationId={conversation.id}
            onSubmit={async (data) => {
              if (onSendOffer) {
                const ok = await onSendOffer(data);
                if (ok) setShowOfferForm(false);
                return ok;
              }
              return false;
            }}
            onCancel={() => setShowOfferForm(false)}
          />
        </div>
      )}

      <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />

      {/* Input bar */}
      <div className="border-t border-border-dark p-2 md:p-4 flex-shrink-0 bg-background-dark/80 backdrop-blur-sm">
        <div className="flex gap-1.5 md:gap-3 items-end">
          <button onClick={() => fileRef.current?.click()} className="p-2 md:p-2.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0" aria-label="Joindre un fichier">
            <span className="material-symbols-outlined text-xl md:text-2xl">attach_file</span>
          </button>
          <input ref={fileRef} type="file" multiple accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")} className="hidden" onChange={(e) => handleFileUpload(e.target.files)} />

          {/* Offer button — visible for freelance/agence */}
          {onSendOffer && !showOfferForm && (
            <button onClick={() => setShowOfferForm(true)}
              className="p-2 md:p-2.5 rounded-lg text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors flex-shrink-0" aria-label="Faire une offre"
              title="Envoyer une offre personnalisee">
              <span className="material-symbols-outlined text-xl md:text-2xl">local_offer</span>
            </button>
          )}

          {/* AI Suggestion button */}
          <button
            onClick={handleAiSuggest}
            disabled={aiSuggesting || !puterReady}
            className={cn(
              "p-2 md:p-2.5 rounded-lg transition-colors flex-shrink-0",
              aiSuggesting
                ? "text-violet-400 bg-violet-500/10 animate-pulse"
                : "text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 disabled:opacity-30"
            )}
            aria-label="Suggestion IA"
            title="Suggestion IA"
          >
            <span className={cn("material-symbols-outlined text-xl md:text-2xl", aiSuggesting && "animate-spin")}>
              {aiSuggesting ? "progress_activity" : "auto_awesome"}
            </span>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ecrire un message..."
            className="flex-1 min-w-0 px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <VoiceRecorder onSend={handleVoiceSend} />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "p-2.5 rounded-lg font-semibold text-sm transition-all flex-shrink-0",
              input.trim() ? "bg-primary text-white hover:bg-primary/90" : "bg-border-dark text-slate-500"
            )}
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>

      {lightboxImage && <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
    </div>
  );
}
