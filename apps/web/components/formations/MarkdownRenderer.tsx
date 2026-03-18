"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-slate max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-600 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:bg-slate-100 dark:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-900 prose-pre:rounded-xl prose-img:rounded-xl prose-table:border-collapse prose-th:bg-slate-50 dark:bg-slate-800/50 prose-th:border prose-th:border-slate-200 dark:border-slate-700 prose-th:px-3 prose-th:py-2 prose-td:border prose-td:border-slate-200 dark:border-slate-700 prose-td:px-3 prose-td:py-2 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
