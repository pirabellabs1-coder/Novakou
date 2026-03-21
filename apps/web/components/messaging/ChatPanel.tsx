"use client";

import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./MessageBubble";
import { VoiceRecorder } from "./voice/VoiceRecorder";
import { ImageLightbox } from "./ImageLightbox";
import type { UnifiedConversation, MessageContentType } from "@/store/messaging";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "webp",
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",
  "mp4", "webm", "mov",
  "zip", "rar", "7z",
];

interface ChatPanelProps {
  conversation: UnifiedConversation | null;
  currentUserId: string;
  onSendMessage: (content: string, type?: MessageContentType, fileName?: string, fileSize?: string, audioUrl?: string, audioDuration?: number, fileUrl?: string, fileType?: string) => void;
  onMarkRead: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onDeleteMessage?: (messageId: string) => void;
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
): Promise<{ url: string; name: string; size: number; type: string } | null> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "message-attachments");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload/file");

    // Support cancellation via AbortSignal
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
          resolve({ url: data.file.url, name: data.file.name, size: data.file.size, type: data.file.type });
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
  onSendMessage,
  onMarkRead,
  onEditMessage,
  onDeleteMessage,
  showAdminActions = false,
  onSendSystemMessage,
  onStartAudioCall,
  onStartVideoCall,
  onMobileBack,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "voice" | "calls" | "files">("all");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadAbortRef = useRef<AbortController | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  useEffect(() => {
    if (conversation) onMarkRead();
  }, [conversation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss error
  useEffect(() => {
    if (uploadError) {
      const timer = setTimeout(() => setUploadError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [uploadError]);

  function handleSend() {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
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
      if (error) {
        setUploadError(error);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Upload files in parallel
    const abortController = new AbortController();
    uploadAbortRef.current = abortController;

    // Track progress per file
    let completedCount = 0;
    const totalCount = validFiles.length;

    const uploadPromises = validFiles.map(async (file) => {
      setUploadProgress({
        fileName: totalCount > 1 ? `${file.name} (${completedCount + 1}/${totalCount})` : file.name,
        progress: 0,
      });

      try {
        const result = await uploadFileToServer(
          file,
          (pct) => {
            setUploadProgress({
              fileName: totalCount > 1 ? `${file.name} (${completedCount + 1}/${totalCount})` : file.name,
              progress: pct,
            });
          },
          abortController.signal
        );

        if (result) {
          const isImage = file.type.startsWith("image/");
          const isVideo = file.type.startsWith("video/");
          const msgType: MessageContentType = isImage ? "image" : "file";
          const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
          onSendMessage(file.name, msgType, file.name, sizeStr, undefined, undefined, result.url, file.type);
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
    setIsRecording(false);
    try {
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
      const result = await uploadFileToServer(file);
      const audioUrl = result?.url || URL.createObjectURL(blob);
      onSendMessage("Message vocal", "voice", undefined, undefined, audioUrl, duration);
    } catch {
      // Fallback to local URL in case of upload failure
      const audioUrl = URL.createObjectURL(blob);
      onSendMessage("Message vocal", "voice", undefined, undefined, audioUrl, duration);
    }
  }, [onSendMessage]);

  // Drag and drop handlers
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 p-4">
        <div className="text-center">
          {onMobileBack && (
            <button
              onClick={onMobileBack}
              className="md:hidden mb-4 px-4 py-2 text-sm text-primary font-semibold hover:bg-primary/10 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
              Retour aux conversations
            </button>
          )}
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl md:text-4xl text-primary/40">forum</span>
          </div>
          <p className="font-medium text-slate-400 text-sm md:text-base">Aucun message pour le moment</p>
          <p className="text-xs mt-2 text-slate-600">Vos conversations avec vos clients apparaitront ici</p>
        </div>
      </div>
    );
  }

  const otherParticipants = conversation.participants.filter((p) => p.id !== currentUserId);
  const displayName = conversation.title || otherParticipants.map((p) => p.name).join(", ") || "Conversation";
  const isOnline = otherParticipants.some((p) => p.online);

  // Filter messages
  const filteredMessages = conversation.messages.filter((msg) => {
    if (messageFilter === "all") return true;
    if (messageFilter === "voice") return msg.type === "voice";
    if (messageFilter === "calls") return msg.type === "call_audio" || msg.type === "call_video" || msg.type === "call_missed";
    if (messageFilter === "files") return msg.type === "file" || msg.type === "image";
    return true;
  });

  return (
    <div
      className="flex-1 flex flex-col min-w-0 relative"
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

      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-6 py-3 md:py-4 border-b border-border-dark flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {/* Mobile back button */}
          {onMobileBack && (
            <button
              onClick={onMobileBack}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Retour aux conversations"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
          )}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
              {otherParticipants[0]?.avatar ?? "?"}
            </div>
            {isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-background-dark rounded-full" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">
              {isOnline ? "En ligne" : "Hors ligne"}
              {conversation.orderId && ` · ${conversation.orderId}`}
              {otherParticipants.length > 1 && ` · ${otherParticipants.length} participants`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
          {conversation.orderId && (
            <a
              href={`/dashboard/commandes/${conversation.orderId}`}
              className="hidden sm:flex text-xs text-primary font-bold hover:underline items-center gap-1 mr-2"
            >
              Voir la commande <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>
          )}

          <button
            onClick={onStartAudioCall}
            className="p-2 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-emerald-500/10 transition-colors"
            title="Appel audio"
          >
            <span className="material-symbols-outlined text-lg">call</span>
          </button>
          <button
            onClick={onStartVideoCall}
            className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
            title="Appel video"
          >
            <span className="material-symbols-outlined text-lg">videocam</span>
          </button>

          {showAdminActions && onSendSystemMessage && (
            <button
              onClick={() => {
                const msg = prompt("Message systeme a envoyer:");
                if (msg) onSendSystemMessage(msg);
              }}
              className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Envoyer un message systeme"
            >
              <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
            </button>
          )}
          <button className="p-2 text-slate-400 hover:text-primary rounded-lg hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-lg">info</span>
          </button>
        </div>
      </div>

      {/* Message filter bar */}
      <div className="flex items-center gap-0.5 md:gap-1 px-2 md:px-4 py-1.5 md:py-2 border-b border-border-dark/50 overflow-x-auto">
        {(["all", "voice", "calls", "files"] as const).map((filter) => {
          const labels = {
            all: { label: "Tous", icon: "forum" },
            voice: { label: "Vocaux", icon: "mic" },
            calls: { label: "Appels", icon: "call" },
            files: { label: "Fichiers", icon: "attach_file" },
          };
          const { label, icon } = labels[filter];
          return (
            <button
              key={filter}
              onClick={() => setMessageFilter(filter)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                messageFilter === filter
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:text-slate-300 hover:bg-border-dark/50"
              )}
            >
              <span className="material-symbols-outlined text-sm">{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 md:space-y-3">
        {filteredMessages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          const prevMsg = i > 0 ? filteredMessages[i - 1] : null;
          const showSenderInfo = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === "system");

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              showSenderInfo={showSenderInfo}
              onEdit={onEditMessage}
              onDelete={onDeleteMessage}
              onImageClick={(url) => setLightboxImage(url)}
            />
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Upload progress / error */}
      {(uploadProgress || uploadError) && (
        <div className="px-4 py-2 border-t border-border-dark/50">
          {uploadProgress && (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-sm text-primary animate-spin">progress_activity</span>
              <div className="flex-1">
                <p className="text-xs text-slate-400 truncate">{uploadProgress.fileName}</p>
                <div className="w-full h-1.5 bg-border-dark rounded-full mt-1">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${uploadProgress.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-slate-500">{uploadProgress.progress}%</span>
              <button
                onClick={handleCancelUpload}
                className="p-1 text-slate-400 hover:text-red-400 rounded transition-colors"
                title="Annuler l'upload"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 text-red-400">
              <span className="material-symbols-outlined text-sm">error</span>
              <p className="text-xs">{uploadError}</p>
              <button onClick={() => setUploadError(null)} className="ml-auto text-slate-500 hover:text-slate-300">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border-dark p-2 md:p-4 flex-shrink-0">
        <div className="flex gap-1.5 md:gap-3 items-end">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-2 md:p-2.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
            aria-label="Joindre un fichier"
          >
            <span className="material-symbols-outlined text-xl md:text-2xl">attach_file</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",")}
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          {isRecording ? (
            <VoiceRecorder onSend={handleVoiceSend} />
          ) : (
            <>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Tapez votre message..."
                className="flex-1 px-4 py-2.5 bg-neutral-dark border border-border-dark rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
              />
              <VoiceRecorder onSend={handleVoiceSend} />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-semibold text-sm transition-all",
                  input.trim()
                    ? "bg-primary text-white hover:bg-primary/90"
                    : "bg-border-dark text-slate-500"
                )}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
