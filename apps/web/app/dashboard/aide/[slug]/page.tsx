"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getArticleBySlug,
  getCategoryById,
  HELP_ARTICLES,
} from "@/lib/help-articles";

type FeedbackState = "none" | "positive" | "negative";

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const article = getArticleBySlug(slug);
  const category = article ? getCategoryById(article.category) : undefined;

  const [feedback, setFeedback] = useState<FeedbackState>("none");

  // Related articles
  const relatedArticles = article
    ? article.relatedArticles
        .map((s) => HELP_ARTICLES.find((a) => a.slug === s))
        .filter(Boolean)
    : [];

  // 404 state
  if (!article) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 space-y-4">
        <span className="material-symbols-outlined text-slate-600 text-6xl">
          search_off
        </span>
        <h1 className="text-2xl font-extrabold text-slate-200">
          Article introuvable
        </h1>
        <p className="text-slate-400">
          L&apos;article que vous recherchez n&apos;existe pas ou a ete
          deplace.
        </p>
        <Link
          href="/dashboard/aide"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors mt-4"
        >
          <span className="material-symbols-outlined text-lg">
            arrow_back
          </span>
          Retour au centre d&apos;aide
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm flex-wrap">
        <Link
          href="/dashboard/aide"
          className="text-slate-500 hover:text-primary transition-colors"
        >
          Aide
        </Link>
        <span className="material-symbols-outlined text-slate-600 text-base">
          chevron_right
        </span>
        <button
          onClick={() => {
            /* Navigate to aide with category filter — using Link would be ideal but we keep it simple */
          }}
          className="text-slate-500 hover:text-primary transition-colors"
        >
          {category?.name ?? "Categorie"}
        </button>
        <span className="material-symbols-outlined text-slate-600 text-base">
          chevron_right
        </span>
        <span className="text-slate-300 font-medium truncate max-w-[260px]">
          {article.title}
        </span>
      </nav>

      {/* Back link */}
      <Link
        href="/dashboard/aide"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
      >
        <span className="material-symbols-outlined text-base">
          arrow_back
        </span>
        Retour au centre d&apos;aide
      </Link>

      {/* Article header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          {category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">
                {category.icon}
              </span>
              {category.name}
            </span>
          )}
          <span className="text-xs text-slate-500">
            Mis a jour le{" "}
            {new Date(article.updatedAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
          {article.title}
        </h1>
      </header>

      {/* Article content */}
      <article
        className="prose-custom"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Feedback section */}
      <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-300">
          Cet article vous a-t-il ete utile ?
        </p>
        {feedback === "none" ? (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setFeedback("positive")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-slate-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/[0.06] transition-all text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">
                thumb_up
              </span>
              Oui
            </button>
            <button
              onClick={() => setFeedback("negative")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.05] border border-white/10 text-slate-400 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/[0.06] transition-all text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">
                thumb_down
              </span>
              Non
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span
              className={`material-symbols-outlined text-lg ${
                feedback === "positive"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {feedback === "positive" ? "check_circle" : "info"}
            </span>
            <p className="text-sm text-slate-400">
              {feedback === "positive"
                ? "Merci pour votre retour ! Nous sommes ravis que cet article vous ait ete utile."
                : "Merci pour votre retour. Nous travaillons a ameliorer notre contenu."}
            </p>
          </div>
        )}
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">
              auto_awesome
            </span>
            Articles connexes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedArticles.map((related) => {
              if (!related) return null;
              const relCat = getCategoryById(related.category);
              return (
                <Link
                  key={related.id}
                  href={`/dashboard/aide/${related.slug}`}
                  className="group flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:border-primary/30 hover:bg-primary/[0.04] transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      {relCat?.icon ?? "article"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-slate-200 group-hover:text-primary transition-colors truncate">
                      {related.title}
                    </h3>
                    <p className="text-xs text-slate-500 capitalize mt-0.5">
                      {relCat?.name}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center text-slate-600 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-base">
                      chevron_right
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <div className="flex items-center justify-between p-5 rounded-xl bg-white/[0.03] border border-white/10">
        <div>
          <p className="text-sm font-semibold text-slate-300">
            Besoin d&apos;aide supplementaire ?
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Notre equipe de support est la pour vous.
          </p>
        </div>
        <Link
          href="/dashboard/messages"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">chat</span>
          Contacter
        </Link>
      </div>

      {/* Inline styles for article content rendering */}
      <style jsx global>{`
        .prose-custom {
          color: #94a3b8;
          line-height: 1.75;
          font-size: 0.9375rem;
        }
        .prose-custom h3 {
          color: #e2e8f0;
          font-weight: 700;
          font-size: 1.05rem;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .prose-custom p {
          margin-bottom: 0.875rem;
        }
        .prose-custom ul,
        .prose-custom ol {
          padding-left: 1.5rem;
          margin-bottom: 0.875rem;
        }
        .prose-custom ul {
          list-style-type: disc;
        }
        .prose-custom ol {
          list-style-type: decimal;
        }
        .prose-custom li {
          margin-bottom: 0.375rem;
        }
        .prose-custom strong {
          color: #cbd5e1;
          font-weight: 600;
        }
        .prose-custom kbd {
          background-color: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0.25rem;
          padding: 0.125rem 0.375rem;
          font-size: 0.8125rem;
          font-family: ui-monospace, monospace;
          color: #e2e8f0;
        }
        .prose-custom a {
          color: rgb(14, 124, 102);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .prose-custom a:hover {
          color: rgb(16, 185, 129);
        }
      `}</style>
    </div>
  );
}
