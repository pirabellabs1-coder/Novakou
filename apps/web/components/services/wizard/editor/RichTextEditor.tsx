"use client";

import { useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface RichTextEditorProps {
  content: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
  placeholder?: string;
  minHeight?: number;
  simplified?: boolean;
}

// Store markdown as { type: "markdown", text: "..." }
function getMarkdownText(content: Record<string, unknown> | null): string {
  if (!content) return "";
  if (content.type === "markdown" && typeof content.text === "string") return content.text;
  // Legacy Tiptap JSON — extract text
  if (content.type === "doc") {
    try {
      return extractTextFromTiptap(content);
    } catch {
      return "";
    }
  }
  return "";
}

function extractTextFromTiptap(node: Record<string, unknown>): string {
  if (node.type === "text" && typeof node.text === "string") return node.text;
  if (Array.isArray(node.content)) {
    return (node.content as Record<string, unknown>[])
      .map((child) => extractTextFromTiptap(child))
      .join(node.type === "paragraph" ? "\n\n" : "");
  }
  return "";
}

const TOOLBAR_ACTIONS = [
  { icon: "format_bold", label: "Gras", prefix: "**", suffix: "**" },
  { icon: "format_italic", label: "Italique", prefix: "_", suffix: "_" },
  { icon: "strikethrough_s", label: "Barré", prefix: "~~", suffix: "~~" },
  { icon: "code", label: "Code", prefix: "`", suffix: "`" },
  { icon: "link", label: "Lien", prefix: "[", suffix: "](url)" },
] as const;

const BLOCK_ACTIONS = [
  { icon: "title", label: "Titre", prefix: "## " },
  { icon: "format_list_bulleted", label: "Liste", prefix: "- " },
  { icon: "format_list_numbered", label: "Liste numérotée", prefix: "1. " },
  { icon: "format_quote", label: "Citation", prefix: "> " },
  { icon: "data_object", label: "Bloc de code", prefix: "```\n", suffix: "\n```" },
] as const;

const COLOR_PRESETS = [
  { label: "Rouge", value: "#ef4444" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Vert", value: "#22c55e" },
  { label: "Violet", value: "#a855f7" },
  { label: "Orange", value: "#f97316" },
  { label: "Rose", value: "#ec4899" },
] as const;

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Décrivez votre service en détail...",
  minHeight = 400,
  simplified = false,
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const markdown = getMarkdownText(content);

  const handleChange = useCallback((text: string) => {
    onChange({ type: "markdown", text });
  }, [onChange]);

  const insertFormatting = useCallback((prefix: string, suffix?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const suf = suffix ?? prefix;

    const newText = text.substring(0, start) + prefix + (selected || "texte") + suf + text.substring(end);
    handleChange(newText);

    // Restore cursor position
    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + prefix.length + (selected ? selected.length : 4) + suf.length;
      textarea.setSelectionRange(
        selected ? start + prefix.length : start + prefix.length,
        selected ? start + prefix.length + selected.length : start + prefix.length + 5
      );
    });
  }, [handleChange]);

  const insertBlock = useCallback((prefix: string, suffix?: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;

    // Find start of current line
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const suf = suffix ?? "";

    const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart) + suf;
    handleChange(newText);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart + prefix.length, lineStart + prefix.length);
    });
  }, [handleChange]);

  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const charCount = markdown.length;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setIsPreview(false)}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
            !isPreview ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Écrire
        </button>
        <button
          onClick={() => setIsPreview(true)}
          className={`px-4 py-2.5 text-sm font-semibold transition-colors flex items-center gap-1.5 ${
            isPreview ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="material-symbols-outlined text-sm">visibility</span>
          Prévisualiser
        </button>
        <div className="ml-auto flex items-center pr-3">
          <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Markdown</span>
        </div>
      </div>

      {/* Toolbar */}
      {!isPreview && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-white/5 bg-white/[0.02] flex-wrap">
          {TOOLBAR_ACTIONS.map((action) => (
            <button
              key={action.icon}
              onClick={() => insertFormatting(action.prefix, action.suffix)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={action.label}
            >
              <span className="material-symbols-outlined text-base">{action.icon}</span>
            </button>
          ))}
          <div className="w-px h-5 bg-white/10 mx-1" />
          {BLOCK_ACTIONS.map((action) => (
            <button
              key={action.icon}
              onClick={() => insertBlock(action.prefix, "suffix" in action ? action.suffix : undefined)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title={action.label}
            >
              <span className="material-symbols-outlined text-base">{action.icon}</span>
            </button>
          ))}
          {!simplified && (
            <>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <button
                onClick={() => insertBlock("| Colonne 1 | Colonne 2 |\n| --- | --- |\n| ", " | |\n")}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Tableau"
              >
                <span className="material-symbols-outlined text-base">table</span>
              </button>
              <button
                onClick={() => insertFormatting("![alt](", ")")}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Image"
              >
                <span className="material-symbols-outlined text-base">image</span>
              </button>
              <button
                onClick={() => insertBlock("---\n")}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Séparateur"
              >
                <span className="material-symbols-outlined text-base">horizontal_rule</span>
              </button>
              <div className="w-px h-5 bg-white/10 mx-1" />
              {/* Color picker */}
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Couleur du texte"
                >
                  <span className="material-symbols-outlined text-base">format_color_text</span>
                </button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-white/10 rounded-lg p-2 z-50 shadow-xl">
                    <div className="grid grid-cols-3 gap-1.5">
                      {COLOR_PRESETS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => {
                            insertFormatting(`<span style="color:${color.value}">`, "</span>");
                            setShowColorPicker(false);
                          }}
                          className="w-7 h-7 rounded-md border border-white/10 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color.value }}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Highlight */}
              <button
                onClick={() => insertFormatting("<mark>", "</mark>")}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Surligner"
              >
                <span className="material-symbols-outlined text-base">highlight</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Editor or Preview */}
      {isPreview ? (
        <div
          className="prose prose-invert prose-sm max-w-none p-4 [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_th]:border [&_th]:border-white/20 [&_th]:bg-white/5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-sm [&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_mark]:bg-yellow-500/30 [&_mark]:text-yellow-200 [&_mark]:px-1 [&_mark]:rounded"
          style={{ minHeight: `${minHeight}px` }}
        >
          {markdown ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{markdown}</ReactMarkdown>
          ) : (
            <p className="text-slate-500 italic">Rien à prévisualiser...</p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={markdown}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-slate-200 font-mono leading-relaxed focus:outline-none resize-none p-4"
          style={{ minHeight: `${minHeight}px` }}
        />
      )}

      {/* Character count */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-slate-500">
        <span className="text-[10px]">
          Utilisez **gras**, _italique_, ## titres, - listes, [liens](url)
        </span>
        <span>{charCount} caractères · {wordCount} mots</span>
      </div>
    </div>
  );
}
