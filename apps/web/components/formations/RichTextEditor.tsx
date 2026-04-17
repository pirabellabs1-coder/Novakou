"use client";

import { useEditor, EditorContent, Node, mergeAttributes } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { useRef, useState, useCallback, useEffect } from "react";
import { useToastStore } from "@/store/toast";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
};

// ─── Color presets ────────────────────────────────────────────────────────────
const TEXT_COLORS: { label: string; value: string }[] = [
  { label: "Noir", value: "#18181b" },
  { label: "Gris", value: "#71717a" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Jaune", value: "#eab308" },
  { label: "Vert", value: "#16a34a" },
  { label: "Bleu", value: "#2563eb" },
  { label: "Violet", value: "#9333ea" },
];

const HIGHLIGHT_COLORS: { label: string; value: string }[] = [
  { label: "Jaune", value: "#fef08a" },
  { label: "Vert", value: "#bbf7d0" },
  { label: "Bleu", value: "#bfdbfe" },
  { label: "Rose", value: "#fbcfe8" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Gris", value: "#e5e7eb" },
];

// ─── YouTube / Vimeo URL parser ───────────────────────────────────────────────
function parseVideoEmbed(rawUrl: string): string | null {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

// ─── Custom Video Embed node (iframe) ─────────────────────────────────────────
const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
    };
  },
  parseHTML() {
    return [
      {
        tag: "div[data-video-embed]",
        getAttrs: (el: HTMLElement | string) => {
          if (typeof el === "string") return false;
          return { src: el.querySelector("iframe")?.getAttribute("src") ?? null };
        },
      },
      {
        tag: "iframe[src*=\"youtube.com\"], iframe[src*=\"vimeo.com\"]",
        getAttrs: (el: HTMLElement | string) => {
          if (typeof el === "string") return false;
          return { src: el.getAttribute("src") };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    const src = HTMLAttributes.src as string | null;
    if (!src) return ["div", { "data-video-embed": "" }] as const;
    return [
      "div",
      mergeAttributes({ "data-video-embed": "", class: "rte-video-embed" }),
      [
        "iframe",
        {
          src,
          frameborder: "0",
          allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
          allowfullscreen: "true",
        },
      ],
    ] as const;
  },
});

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Décrivez votre produit en détail…",
  minHeight = 320,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: { class: "rounded-lg max-w-full my-3" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#006e2f] underline", rel: "noopener noreferrer", target: "_blank" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      VideoEmbed,
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rte-content focus:outline-none text-zinc-900 leading-relaxed px-5 py-4",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  });

  // Close color popovers when clicking outside
  useEffect(() => {
    if (!textColorOpen && !highlightOpen) return;
    const close = () => {
      setTextColorOpen(false);
      setHighlightOpen(false);
    };
    const t = setTimeout(() => {
      document.addEventListener("click", close);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", close);
    };
  }, [textColorOpen, highlightOpen]);

  const uploadImage = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "portfolio");
      const res = await fetch("/api/upload/image", { method: "POST", body: form });
      const data = await res.json();
      if (data.url) {
        editor?.chain().focus().setImage({ src: data.url }).run();
        setImageModalOpen(false);
      } else {
        useToastStore.getState().addToast("error", data.error ?? "Échec de l'upload");
      }
    } catch (err) {
      console.error(err);
      useToastStore.getState().addToast("error", "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  }, [editor]);

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = "";
  };

  const applyLink = () => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
      editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkInputOpen(false);
    setLinkUrl("");
  };

  const insertImageFromUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    const safe = url.startsWith("http") ? url : `https://${url}`;
    editor?.chain().focus().setImage({ src: safe }).run();
    setImageUrl("");
    setImageModalOpen(false);
  };

  const insertVideo = () => {
    const embed = parseVideoEmbed(videoUrl);
    if (!embed) {
      setVideoError("Lien invalide. Collez un URL YouTube ou Vimeo.");
      return;
    }
    editor?.chain().focus().insertContent({
      type: "videoEmbed",
      attrs: { src: embed },
    }).run();
    setVideoUrl("");
    setVideoError(null);
    setVideoModalOpen(false);
  };

  if (!editor) return null;

  // Inline styles for rich content
  const rteStyles = `
    .rte-content { font-size: 15px; }
    .rte-content h1 { font-size: 1.875rem; font-weight: 800; letter-spacing: -0.025em; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #18181b; }
    .rte-content h2 { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; margin-top: 1.25rem; margin-bottom: 0.5rem; color: #18181b; }
    .rte-content h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #18181b; }
    .rte-content p { margin-bottom: 0.75rem; }
    .rte-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
    .rte-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
    .rte-content li { margin-bottom: 0.25rem; }
    .rte-content li > p { margin-bottom: 0; }
    .rte-content blockquote { border-left: 4px solid #22c55e; padding-left: 1rem; margin: 1rem 0; color: #52525b; font-style: italic; }
    .rte-content a { color: #006e2f; text-decoration: underline; text-underline-offset: 2px; }
    .rte-content strong { font-weight: 700; color: #18181b; }
    .rte-content em { font-style: italic; }
    .rte-content u { text-decoration: underline; }
    .rte-content s { text-decoration: line-through; color: #71717a; }
    .rte-content img { border-radius: 0.5rem; max-width: 100%; height: auto; margin: 0.75rem 0; }
    .rte-content hr { border: 0; border-top: 1px solid #e4e4e7; margin: 1.25rem 0; }
    .rte-content mark { padding: 0 2px; border-radius: 2px; }
    .rte-content .rte-video-embed { position: relative; padding-bottom: 56.25%; height: 0; margin: 0.75rem 0; border-radius: 0.5rem; overflow: hidden; background: #000; }
    .rte-content .rte-video-embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
    .rte-content p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #a1a1aa; pointer-events: none; float: left; height: 0; }
  `;

  const btn = (opts: {
    onClick: () => void;
    active?: boolean;
    icon: string;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={opts.onClick}
      disabled={opts.disabled}
      title={opts.title}
      className={`p-2 transition-colors disabled:opacity-30 ${
        opts.active ? "bg-[#006e2f] text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{opts.icon}</span>
    </button>
  );

  return (
    <div className="border border-zinc-200 bg-white">
      <style dangerouslySetInnerHTML={{ __html: rteStyles }} />
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-px border-b border-zinc-200 bg-[#f9f9f9] px-2 py-1.5">
        {/* Paragraph style dropdown */}
        <select
          value={
            editor.isActive("heading", { level: 1 }) ? "h1" :
            editor.isActive("heading", { level: 2 }) ? "h2" :
            editor.isActive("heading", { level: 3 }) ? "h3" : "p"
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") editor.chain().focus().setParagraph().run();
            else if (v === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (v === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
            else if (v === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className="px-2 py-1.5 mr-1 text-xs font-bold text-zinc-900 bg-white border border-zinc-200 outline-none focus:ring-1 focus:ring-[#22c55e] appearance-none cursor-pointer"
        >
          <option value="p">Paragraphe</option>
          <option value="h1">Titre 1</option>
          <option value="h2">Titre 2</option>
          <option value="h3">Titre 3</option>
        </select>

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {btn({ onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold"), icon: "format_bold", title: "Gras (Ctrl+B)" })}
        {btn({ onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic"), icon: "format_italic", title: "Italique (Ctrl+I)" })}
        {btn({ onClick: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive("underline"), icon: "format_underlined", title: "Souligné (Ctrl+U)" })}
        {btn({ onClick: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike"), icon: "format_strikethrough", title: "Barré" })}
        {btn({ onClick: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote"), icon: "format_quote", title: "Citation" })}

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {/* Text color picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setTextColorOpen((s) => !s); setHighlightOpen(false); }}
            title="Couleur du texte"
            className="p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[18px]">format_color_text</span>
            <span className="material-symbols-outlined text-[12px]">arrow_drop_down</span>
          </button>
          {textColorOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-200 shadow-lg p-2 w-48"
            >
              <div className="grid grid-cols-4 gap-1">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(c.value).run();
                      setTextColorOpen(false);
                    }}
                    title={c.label}
                    className="w-9 h-9 rounded border border-zinc-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setTextColorOpen(false);
                }}
                className="w-full mt-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border-t border-zinc-100"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>

        {/* Highlight picker */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setHighlightOpen((s) => !s); setTextColorOpen(false); }}
            title="Surligner"
            className="p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors flex items-center gap-0.5"
          >
            <span className="material-symbols-outlined text-[18px]">format_ink_highlighter</span>
            <span className="material-symbols-outlined text-[12px]">arrow_drop_down</span>
          </button>
          {highlightOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-200 shadow-lg p-2 w-44"
            >
              <div className="grid grid-cols-3 gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setHighlight({ color: c.value }).run();
                      setHighlightOpen(false);
                    }}
                    title={c.label}
                    className="w-10 h-9 rounded border border-zinc-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setHighlightOpen(false);
                }}
                className="w-full mt-2 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 border-t border-zinc-100"
              >
                Retirer
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {btn({ onClick: () => editor.chain().focus().setTextAlign("left").run(), active: editor.isActive({ textAlign: "left" }), icon: "format_align_left", title: "Aligner à gauche" })}
        {btn({ onClick: () => editor.chain().focus().setTextAlign("center").run(), active: editor.isActive({ textAlign: "center" }), icon: "format_align_center", title: "Centrer" })}
        {btn({ onClick: () => editor.chain().focus().setTextAlign("right").run(), active: editor.isActive({ textAlign: "right" }), icon: "format_align_right", title: "Aligner à droite" })}

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {btn({ onClick: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList"), icon: "format_list_bulleted", title: "Liste à puces" })}
        {btn({ onClick: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList"), icon: "format_list_numbered", title: "Liste numérotée" })}

        <div className="w-px h-6 bg-zinc-200 mx-1" />

        {btn({
          onClick: () => {
            if (editor.isActive("link")) {
              editor.chain().focus().unsetLink().run();
            } else {
              setLinkUrl("");
              setLinkInputOpen(true);
            }
          },
          active: editor.isActive("link"),
          icon: editor.isActive("link") ? "link_off" : "link",
          title: editor.isActive("link") ? "Retirer le lien" : "Ajouter un lien",
        })}

        {btn({
          onClick: () => { setImageUrl(""); setImageModalOpen(true); },
          icon: uploading ? "hourglass_empty" : "add_photo_alternate",
          title: "Insérer une image",
          disabled: uploading,
        })}

        {btn({
          onClick: () => { setVideoUrl(""); setVideoError(null); setVideoModalOpen(true); },
          icon: "smart_display",
          title: "Insérer une vidéo (YouTube / Vimeo)",
        })}

        {btn({ onClick: () => editor.chain().focus().setHorizontalRule().run(), icon: "horizontal_rule", title: "Séparateur" })}

        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFilePicked} className="hidden" />

        <div className="flex-1" />

        {btn({ onClick: () => editor.chain().focus().undo().run(), icon: "undo", title: "Annuler (Ctrl+Z)", disabled: !editor.can().undo() })}
        {btn({ onClick: () => editor.chain().focus().redo().run(), icon: "redo", title: "Refaire (Ctrl+Y)", disabled: !editor.can().redo() })}
      </div>

      {/* Link input row */}
      {linkInputOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#f9f9f9] border-b border-zinc-200">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">URL</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyLink(); }
              if (e.key === "Escape") { setLinkInputOpen(false); setLinkUrl(""); }
            }}
            autoFocus
            placeholder="https://…"
            className="flex-1 bg-white border border-zinc-200 focus:ring-1 focus:ring-[#22c55e] py-1.5 px-3 text-xs text-zinc-900 outline-none"
          />
          <button type="button" onClick={applyLink} className="px-3 py-1.5 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors">
            OK
          </button>
          <button type="button" onClick={() => { setLinkInputOpen(false); setLinkUrl(""); }} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">
            Annuler
          </button>
        </div>
      )}

      {/* Image modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setImageModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">Insérer une image</h3>
              <button type="button" onClick={() => setImageModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  Coller un URL d&apos;image
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertImageFromUrl(); } }}
                    placeholder="https://exemple.com/image.jpg"
                    className="flex-1 bg-white border border-zinc-200 focus:ring-1 focus:ring-[#22c55e] py-2 px-3 text-sm text-zinc-900 outline-none rounded-lg"
                  />
                  <button
                    type="button"
                    disabled={!imageUrl.trim()}
                    onClick={insertImageFromUrl}
                    className="px-4 py-2 bg-[#006e2f] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#22c55e] disabled:opacity-30 transition-colors rounded-lg"
                  >
                    Insérer
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-100" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">OU</span>
                <div className="flex-1 h-px bg-zinc-100" />
              </div>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-zinc-200 hover:border-[#006e2f] hover:bg-[#006e2f]/5 transition-colors rounded-lg flex flex-col items-center justify-center gap-1 text-zinc-600 hover:text-[#006e2f]"
              >
                <span className="material-symbols-outlined text-[24px]">{uploading ? "hourglass_empty" : "cloud_upload"}</span>
                <span className="text-xs font-semibold">
                  {uploading ? "Upload en cours…" : "Uploader depuis votre appareil"}
                </span>
                <span className="text-[10px] text-zinc-400">JPEG, PNG, GIF, WebP — Max 5 MB</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setVideoModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900">Insérer une vidéo</h3>
              <button type="button" onClick={() => setVideoModalOpen(false)} className="text-zinc-400 hover:text-zinc-900">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  Lien YouTube ou Vimeo
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); setVideoError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); insertVideo(); } }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  autoFocus
                  className="w-full bg-white border border-zinc-200 focus:ring-1 focus:ring-[#22c55e] py-2 px-3 text-sm text-zinc-900 outline-none rounded-lg"
                />
                {videoError && (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium">{videoError}</p>
                )}
                <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                  Formats acceptés : <code>youtube.com/watch?v=…</code>, <code>youtu.be/…</code>, <code>youtube.com/shorts/…</code>, <code>vimeo.com/…</code>
                </p>
              </div>

              <div className="flex items-center gap-2 justify-end pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!videoUrl.trim()}
                  onClick={insertVideo}
                  className="px-4 py-2 bg-[#006e2f] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#22c55e] disabled:opacity-30 transition-colors rounded-lg"
                >
                  Insérer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Editor canvas */}
      <div className="relative" style={{ minHeight }}>
        <EditorContent editor={editor} />
        {uploading && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-zinc-900 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
            Upload…
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f9f9f9] border-t border-zinc-200 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
        <span>{editor.storage.characterCount?.characters?.() ?? editor.getText().length} caractères</span>
        <span>Glissez-déposez une image ou cliquez sur l&apos;icône</span>
      </div>
    </div>
  );
}
