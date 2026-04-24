"use client";

import { useState } from "react";

export function CodeSnippet({ code, language = "bash", label }: { code: string; language?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative bg-[#0d1117] text-gray-100 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          {label && <span className="ml-3 text-[11px] text-gray-400 font-mono">{label}</span>}
        </div>
        <button
          onClick={async () => {
            try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* noop */ }
          }}
          className="text-[11px] text-gray-400 hover:text-white inline-flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[13px]">{copied ? "check" : "content_copy"}</span>
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12.5px] leading-relaxed font-mono"><code>{code}</code></pre>
      <div className="absolute top-2 right-16 text-[10px] text-gray-500 uppercase tracking-widest pointer-events-none">{language}</div>
    </div>
  );
}
