"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import { useCallback, useState } from "react";

interface FormationRichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const COLOR_PRESETS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#3b82f6", "#a855f7", "#ec4899", "#6b7280",
];

export function FormationRichEditor({
  content,
  onChange,
  placeholder = "Décrivez en détail...",
  minHeight = 300,
}: FormationRichEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
    ],
    content: content || "",
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 [&_table]:border-collapse [&_table]:w-full [&_th]:border [&_th]:border-slate-300 [&_th]:dark:border-slate-600 [&_th]:bg-slate-100 dark:bg-slate-800 [&_th]:dark:bg-slate-800 [&_th]:px-3 [&_th]:py-2 [&_td]:border [&_td]:border-slate-200 dark:border-slate-700 [&_td]:dark:border-slate-700 [&_td]:px-3 [&_td]:py-2`,
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL de l'image :");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return <div className="h-[300px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-wrap">
        {/* Text formatting */}
        <ToolBtn
          icon="format_bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolBtn
          icon="format_italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolBtn
          icon="format_underlined"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolBtn
          icon="strikethrough_s"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <ToolBtn
          icon="code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        />

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Headings */}
        <ToolBtn
          icon="format_h1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolBtn
          icon="format_h2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolBtn
          icon="format_h3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Lists */}
        <ToolBtn
          icon="format_list_bulleted"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolBtn
          icon="format_list_numbered"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolBtn
          icon="format_quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Alignment */}
        <ToolBtn icon="format_align_left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} />
        <ToolBtn icon="format_align_center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} />
        <ToolBtn icon="format_align_right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} />

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Color */}
        <div className="relative">
          <ToolBtn icon="format_color_text" onClick={() => setShowColorPicker(!showColorPicker)} />
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 z-50 shadow-xl">
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                    className="w-6 h-6 rounded border border-slate-200 dark:border-slate-700 dark:border-slate-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                className="w-full mt-1.5 text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Réinitialiser
              </button>
            </div>
          )}
        </div>

        <ToolBtn
          icon="highlight"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight({ color: "#fde68a" }).run()}
        />

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* Insert */}
        <div className="relative">
          <ToolBtn icon="link" active={editor.isActive("link")} onClick={() => setShowLinkInput(!showLinkInput)} />
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-900 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 z-50 shadow-xl flex gap-2">
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="text-xs bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 rounded px-2 py-1 w-48 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
                autoFocus
              />
              <button onClick={insertLink} className="text-xs text-primary font-bold">OK</button>
              {editor.isActive("link") && (
                <button onClick={() => { editor.chain().focus().unsetLink().run(); setShowLinkInput(false); }} className="text-xs text-red-500 font-bold">
                  Suppr
                </button>
              )}
            </div>
          )}
        </div>

        <ToolBtn icon="image" onClick={insertImage} />
        <ToolBtn icon="table" onClick={insertTable} />
        <ToolBtn icon="horizontal_rule" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
        <ToolBtn icon="data_object" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500">
        <span>Tiptap WYSIWYG</span>
        <span>
          {editor.storage.characterCount.characters()} caractères · {editor.storage.characterCount.words()} mots
        </span>
      </div>
    </div>
  );
}

function ToolBtn({
  icon,
  active,
  onClick,
  size = "md",
}: {
  icon: string;
  active?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${size === "sm" ? "p-0.5" : "p-1.5"} rounded-lg transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      <span className={`material-symbols-outlined ${size === "sm" ? "text-sm" : "text-base"}`}>{icon}</span>
    </button>
  );
}
