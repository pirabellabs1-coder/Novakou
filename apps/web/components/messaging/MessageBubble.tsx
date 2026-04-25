"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { UnifiedMessage } from "@/store/messaging";
import { VoicePlayer } from "./voice/VoicePlayer";
import { MessageContextMenu } from "./MessageContextMenu";
import { LinkPreview } from "./LinkPreview";

const ROLE_COLORS: Record<string, string> = {
  freelance: "text-emerald-400",
  client: "text-blue-400",
  agence: "text-amber-400",
  admin: "text-red-400",
};

/** Get icon and color for a file type */
function getFileTypeInfo(fileName?: string, fileType?: string): { icon: string; color: string; label: string } {
  const ext = (fileName?.split(".").pop() || "").toLowerCase();
  const mime = (fileType || "").toLowerCase();

  if (mime === "application/pdf" || ext === "pdf")
    return { icon: "picture_as_pdf", color: "text-red-400", label: "PDF" };
  if (mime.includes("word") || ext === "doc" || ext === "docx")
    return { icon: "description", color: "text-blue-400", label: "Word" };
  if (mime.includes("spreadsheet") || mime.includes("excel") || ext === "xls" || ext === "xlsx")
    return { icon: "table_chart", color: "text-emerald-400", label: "Excel" };
  if (mime.includes("presentation") || mime.includes("powerpoint") || ext === "ppt" || ext === "pptx")
    return { icon: "slideshow", color: "text-amber-400", label: "PowerPoint" };
  if (ext === "txt" || mime.includes("text/plain"))
    return { icon: "article", color: "text-slate-400", label: "Texte" };
  if (ext === "zip" || ext === "rar" || ext === "7z" || mime.includes("zip") || mime.includes("rar"))
    return { icon: "folder_zip", color: "text-yellow-400", label: "Archive" };
  if (mime.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext))
    return { icon: "movie", color: "text-purple-400", label: "Video" };
  return { icon: "insert_drive_file", color: "text-slate-400", label: ext.toUpperCase() || "Fichier" };
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

/** Detect if text contains a markdown table */
function containsMarkdownTable(text: string): boolean {
  return /\|.+\|[\r\n]+\|[-:\s|]+\|/m.test(text);
}

/** Parse markdown table into rows, handling separator rows */
function parseMarkdownTable(tableText: string): { headers: string[]; rows: string[][] } | null {
  const lines = tableText.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 3) return null;

  const parseLine = (line: string): string[] =>
    line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length);

  const headers = parseLine(lines[0]);
  if (headers.length === 0) return null;

  // Line 1 should be separator (---|---)
  const sepLine = lines[1].trim();
  if (!/^[\s|:-]+$/.test(sepLine)) return null;

  const rows = lines.slice(2).map(parseLine);
  return { headers, rows };
}

/** Render text content with markdown table support */
function renderTextContent(content: string): React.ReactNode {
  if (!containsMarkdownTable(content)) {
    return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{content}</p>;
  }

  // Split content into text and table segments
  const segments: React.ReactNode[] = [];
  // Match table blocks: lines starting with | that include a separator row
  const tableRegex = /(?:^|\n)((?:\|.+\|[ \t]*\n?)+)/gm;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let segIdx = 0;

  const fullContent = content;
  tableRegex.lastIndex = 0;

  while ((match = tableRegex.exec(fullContent)) !== null) {
    const tableBlock = match[1].trim();
    const parsed = parseMarkdownTable(tableBlock);
    if (!parsed) continue;

    // Text before the table
    const before = fullContent.slice(lastIndex, match.index).trim();
    if (before) {
      segments.push(
        <p key={`t${segIdx++}`} className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{before}</p>
      );
    }

    // Render table
    segments.push(
      <div key={`tbl${segIdx++}`} className="my-2 overflow-x-auto">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr>
              {parsed.headers.map((h, i) => (
                <th key={i} className="px-2 py-1.5 text-left font-semibold border border-border-dark/30 bg-white/5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parsed.rows.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "" : "bg-white/[0.02]"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1.5 border border-border-dark/20">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    lastIndex = match.index + match[0].length;
  }

  // Text after last table
  const after = fullContent.slice(lastIndex).trim();
  if (after) {
    segments.push(
      <p key={`t${segIdx++}`} className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{after}</p>
    );
  }

  return segments.length > 0 ? <>{segments}</> : (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{content}</p>
  );
}

function formatCallDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} sec`;
  return `${m} min ${s.toString().padStart(2, "0")} sec`;
}

// Extract URLs from text
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  return text.match(urlRegex) || [];
}

interface MessageBubbleProps {
  message: UnifiedMessage;
  isOwn: boolean;
  showSenderInfo?: boolean;
  conversationId?: string;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  showSenderInfo = true,
  conversationId,
  onEdit,
  onDelete,
  onRetry,
  onImageClick,
}: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const isDeleted = !!message.deletedAt;
  const isEdited = !!message.editedAt;

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.selectionStart = editInputRef.current.value.length;
    }
  }, [isEditing]);

  function handleEditSave() {
    if (editContent.trim() && editContent.trim() !== message.content && onEdit) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  }

  function handleEditCancel() {
    setEditContent(message.content);
    setIsEditing(false);
  }

  function handleDeleteConfirm() {
    if (onDelete) {
      onDelete(message.id);
    }
    setShowDeleteConfirm(false);
  }

  // System messages
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-xs">info</span>
          {message.content}
        </div>
      </div>
    );
  }

  // Call entries
  if (message.type === "call_audio" || message.type === "call_video" || message.type === "call_missed") {
    const isMissed = message.type === "call_missed";
    const isVideo = message.type === "call_video";
    const icon = isMissed ? "phone_missed" : isVideo ? "videocam" : "call";
    const duration = message.callDuration ? formatCallDuration(message.callDuration) : "";

    return (
      <div className="flex justify-center my-2">
        <div
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 border",
            isMissed
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          )}
        >
          <span className="material-symbols-outlined text-sm">{icon}</span>
          <span>
            {isMissed && "Appel manque"}
            {message.type === "call_audio" && `Appel audio${duration ? ` - ${duration}` : ""}`}
            {message.type === "call_video" && `Appel video${duration ? ` - ${duration}` : ""}`}
          </span>
          <span className="text-slate-500">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    );
  }

  // URLs for link preview
  const urls = message.type === "text" && !isDeleted ? extractUrls(message.content) : [];
  const resolvedPreviews = message.linkPreviews ?? (message.linkPreview ? [message.linkPreview] : []);

  return (
    <div className={cn("flex gap-3 group", isOwn ? "flex-row-reverse" : "")}>
      {/* Avatar */}
      {!isOwn && showSenderInfo && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 mt-1">
          {message.senderName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
        </div>
      )}

      <div className={cn("max-w-[85%] md:max-w-[70%]", !isOwn && !showSenderInfo && "ml-11")}>
        {/* Sender info */}
        {!isOwn && showSenderInfo && (
          <p className="text-xs mb-1">
            <span className={cn("font-semibold", ROLE_COLORS[message.senderRole] || "text-slate-400")}>
              {message.senderName}
            </span>
            <span className="text-slate-600 ml-1.5 text-[10px] capitalize">{message.senderRole}</span>
          </p>
        )}

        <div className="flex items-start gap-1">
          {/* Context menu (before bubble for own messages) */}
          {isOwn && (
            <div className="flex-shrink-0 mt-2">
              <MessageContextMenu
                messageCreatedAt={message.createdAt}
                isOwn={isOwn}
                isDeleted={isDeleted}
                onEdit={() => {
                  setEditContent(message.content);
                  setIsEditing(true);
                }}
                onDelete={() => setShowDeleteConfirm(true)}
              />
            </div>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "rounded-2xl px-4 py-3 flex-1",
              isDeleted
                ? "bg-neutral-dark/50 border border-border-dark/50"
                : isOwn
                  ? "bg-primary/10 rounded-tr-md"
                  : "bg-neutral-dark border border-border-dark rounded-tl-md"
            )}
          >
            {/* Deleted message */}
            {isDeleted ? (
              <p className="text-sm italic text-slate-500">{message.content}</p>
            ) : isEditing ? (
              /* Inline edit mode */
              <div className="space-y-2">
                <textarea
                  ref={editInputRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSave();
                    }
                    if (e.key === "Escape") {
                      handleEditCancel();
                    }
                  }}
                  className="w-full bg-background-dark border border-primary/30 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
                  rows={2}
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={handleEditCancel}
                    className="px-3 py-1 text-xs text-slate-400 hover:text-slate-300 rounded-md hover:bg-white/5 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={!editContent.trim() || editContent.trim() === message.content}
                    className="px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Voice message */}
                {message.type === "voice" && message.audioUrl ? (
                  <VoicePlayer
                    audioUrl={message.audioUrl}
                    duration={message.audioDuration ?? 0}
                    transcription={message.transcription}
                    isOwn={isOwn}
                    messageId={message.id}
                    conversationId={conversationId}
                  />
                ) : message.type === "image" && message.fileUrl ? (
                  /* Image with inline preview */
                  <div className="space-y-2">
                    {imageError ? (
                      <div className="flex items-center gap-3 bg-background-dark/50 rounded-lg px-3 py-3 max-w-[240px] md:max-w-[300px]">
                        <span className="material-symbols-outlined text-slate-500">broken_image</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-400">{message.fileName || "Image"}</p>
                          <p className="text-[10px] text-slate-500">Image indisponible</p>
                        </div>
                        <a
                          href={message.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                          download={message.fileName}
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                        </a>
                      </div>
                    ) : (
                      <button
                        onClick={() => onImageClick?.(message.fileUrl!)}
                        className="block rounded-lg overflow-hidden max-w-[240px] md:max-w-[300px] hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={message.fileUrl}
                          alt={message.fileName ?? "Image"}
                          className="w-full h-auto object-cover rounded-lg"
                          loading="lazy"
                          onError={() => setImageError(true)}
                        />
                      </button>
                    )}
                    {message.fileName && !imageError && (
                      <p className="text-[10px] text-slate-500">{message.fileName}</p>
                    )}
                  </div>
                ) : message.type === "image" ? (
                  /* Image without URL (legacy) */
                  <div className="flex items-center gap-3 bg-background-dark/50 rounded-lg px-3 py-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">image</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">{message.fileName ?? message.content}</p>
                      {message.fileSize && <p className="text-[10px] text-slate-500">{message.fileSize}</p>}
                    </div>
                    <button
                      onClick={() => onImageClick?.(message.fileUrl || "")}
                      className="text-slate-400 hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                    </button>
                  </div>
                ) : message.type === "file" && message.fileType?.startsWith("video/") && message.fileUrl ? (
                  /* Video inline player */
                  <div className="space-y-2">
                    <div className="rounded-lg overflow-hidden max-w-[240px] md:max-w-[300px]">
                      <video
                        src={message.fileUrl}
                        controls
                        preload="metadata"
                        className="w-full rounded-lg"
                      >
                        Votre navigateur ne supporte pas la lecture video.
                      </video>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-slate-500 truncate flex-1">{message.fileName ?? "Video"}</p>
                      {message.fileSize && <p className="text-[10px] text-slate-500">{message.fileSize}</p>}
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-primary transition-colors flex-shrink-0"
                        download={message.fileName}
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                      </a>
                    </div>
                  </div>
                ) : message.type === "file" ? (
                  /* File attachment (documents, archives, etc.) */
                  (() => {
                    const ft = getFileTypeInfo(message.fileName, message.fileType);
                    return (
                      <div className="flex items-center gap-3 bg-background-dark/50 rounded-lg px-3 py-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className={cn("material-symbols-outlined text-sm", ft.color)}>{ft.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">{message.fileName ?? message.content}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded">{ft.label}</span>
                            {message.fileSize && <span className="text-[10px] text-slate-500">{message.fileSize}</span>}
                          </div>
                        </div>
                        {message.fileUrl ? (
                          <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-primary transition-colors"
                            download={message.fileName}
                          >
                            <span className="material-symbols-outlined text-lg">download</span>
                          </a>
                        ) : (
                          <button className="text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-lg">download</span>
                          </button>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* Text message — with markdown table support */
                  renderTextContent(message.content)
                )}

                {/* Link previews (up to 3) */}
                {resolvedPreviews.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {resolvedPreviews.slice(0, 3).map((preview, i) => (
                      <LinkPreview key={i} preview={preview} />
                    ))}
                  </div>
                )}
                {urls.length > 0 && resolvedPreviews.length === 0 && (
                  <div className="mt-2 space-y-2">
                    {urls.slice(0, 3).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-primary hover:underline truncate"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Timestamp + edited + read/delivery receipts — inline WhatsApp style */}
            {!isEditing && (
              <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-3 -mb-1 relative top-1">
                {isEdited && !isDeleted && (
                  <span className="text-[10px] text-slate-500 italic">modifie</span>
                )}
                <span className="text-[10px] text-slate-500 leading-none">{formatTime(message.createdAt)}</span>
                {isOwn && !isDeleted && message.status === "failed" && (
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[10px] text-red-400" title="Echec d'envoi">error</span>
                    {onRetry && (
                      <button
                        onClick={() => onRetry(message.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium"
                        title="Reessayer"
                      >
                        <span className="material-symbols-outlined text-[10px]">refresh</span>
                      </button>
                    )}
                  </span>
                )}
                {isOwn && !isDeleted && message.status !== "failed" && (
                  <span
                    className={cn(
                      "material-symbols-outlined text-[11px] leading-none",
                      message.status === "read"
                        ? "text-blue-400"
                        : "text-slate-500"
                    )}
                    title={
                      message.status === "read"
                        ? "Lu"
                        : message.status === "delivered"
                          ? "Livre"
                          : message.status === "sending"
                            ? "Envoi en cours"
                            : "Envoye"
                    }
                  >
                    {message.status === "sending"
                      ? "schedule"
                      : message.status === "delivered" || message.status === "read"
                        ? "done_all"
                        : "done"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-neutral-dark border border-border-dark rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-2">Supprimer ce message ?</h3>
            <p className="text-xs text-slate-400 mb-4">
              Le contenu du message sera remplace par &quot;Ce message a ete supprime&quot;.
              Cette action est irreversible.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-300 rounded-lg hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
