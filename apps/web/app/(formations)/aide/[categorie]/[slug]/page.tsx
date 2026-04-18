import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ARTICLES,
  CATEGORIES,
  getArticleBySlug,
  getCategory,
  getArticlesByCategory,
} from "@/lib/help/articles";
import { renderMarkdown } from "@/lib/help/markdown";

type Params = { params: Promise<{ categorie: string; slug: string }> };

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ categorie: a.category, slug: a.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const a = getArticleBySlug(slug);
  if (!a) return { title: "Article introuvable" };
  return {
    title: `${a.title} — Centre d'aide Novakou`,
    description: a.excerpt,
    keywords: a.tags,
  };
}

export default async function HelpArticlePage({ params }: Params) {
  const { categorie, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article || article.category !== categorie) notFound();

  const cat = getCategory(article.category);
  if (!cat) notFound();

  const related = getArticlesByCategory(cat.slug)
    .filter((a) => a.slug !== article.slug)
    .slice(0, 4);

  const dateStr = new Date(article.lastUpdated).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Breadcrumb */}
      <nav className="max-w-4xl mx-auto px-5 md:px-8 pt-6 flex items-center gap-1 text-xs text-slate-500">
        <Link href="/aide" className="hover:text-slate-900">Centre d&apos;aide</Link>
        <span>/</span>
        <Link href={`/aide/${cat.slug}`} className="hover:text-slate-900">{cat.title}</Link>
        <span>/</span>
        <span className="text-slate-900 font-bold truncate">{article.title}</span>
      </nav>

      <article className="max-w-4xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* Category badge */}
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold text-white mb-4"
          style={{ background: cat.color }}
        >
          <span className="material-symbols-outlined text-[14px]">{cat.icon}</span>
          {cat.title}
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {article.title}
        </h1>
        <p className="text-base md:text-lg text-slate-500 mt-3 leading-relaxed">{article.excerpt}</p>

        <div className="flex items-center gap-4 mt-5 pb-6 border-b border-slate-200 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            {article.readingMin} min de lecture
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">update</span>
            Mis à jour le {dateStr}
          </span>
        </div>

        {/* Article body */}
        <div className="mt-8 max-w-none">{renderMarkdown(article.body)}</div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-slate-200">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Sujets abordés
            </p>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((t) => (
                <span key={t} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="mt-10 p-6 rounded-2xl bg-white border border-slate-200">
          <p className="text-sm font-bold text-slate-900 mb-3">Cet article vous a-t-il aidé ?</p>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
              <span className="material-symbols-outlined text-[16px]">thumb_up</span>
              Oui, merci
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200">
              <span className="material-symbols-outlined text-[16px]">thumb_down</span>
              Pas vraiment
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold ml-auto"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              Contacter le support
            </Link>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-4xl mx-auto px-5 md:px-8 pb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
            Articles similaires
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {related.map((a) => (
              <Link
                key={a.slug}
                href={`/aide/${a.category}/${a.slug}`}
                className="p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all"
              >
                <p className="text-sm font-bold text-slate-900">{a.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.excerpt}</p>
                <p className="text-[11px] text-slate-400 mt-2">{a.readingMin} min →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Categories strip */}
      <section className="max-w-4xl mx-auto px-5 md:px-8 pb-14">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">
          Explorer d&apos;autres catégories
        </h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/aide/${c.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-bold text-slate-700"
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center text-white"
                style={{ background: c.color }}
              >
                <span className="material-symbols-outlined text-[12px]">{c.icon}</span>
              </span>
              {c.title}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
