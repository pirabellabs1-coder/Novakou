"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useLocale } from "next-intl";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: number;
  placeholder?: string;
  /** Variables dynamiques disponibles (pour les emails) */
  variables?: { key: string; label: string }[];
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 400,
  placeholder,
  variables,
}: MarkdownEditorProps) {
  const locale = useLocale();
  const fr = locale === "fr";
  const [preview, setPreview] = useState<"edit" | "live" | "preview">("live");

  const insertVariable = (varKey: string) => {
    onChange(value + `{{${varKey}}}`);
  };

  return (
    <div className="w-full" data-color-mode="light">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {(
            [
              { key: "edit", label: fr ? "Éditeur" : "Editor" },
              { key: "live", label: "Split" },
              { key: "preview", label: "Preview" },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setPreview(m.key)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                preview === m.key
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Variables buttons */}
        {variables && variables.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">
              {fr ? "Variables :" : "Variables:"}
            </span>
            {variables.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors font-medium"
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        preview={preview}
        height={height}
        textareaProps={{
          placeholder:
            placeholder ||
            (fr
              ? "Écrivez votre contenu en Markdown..."
              : "Write your content in Markdown..."),
        }}
        className="!rounded-xl !border-slate-200 dark:border-slate-700"
      />
    </div>
  );
}
