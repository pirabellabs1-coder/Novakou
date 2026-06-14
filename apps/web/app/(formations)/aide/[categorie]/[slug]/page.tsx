import Link from "next/link";
import {
  Clock,
  MessageSquare,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://novakou.com";

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ categorie: a.category, slug: a.slug }));
}

/** Tronque sans couper de mot pour rester ≤155 chars en meta description. */
function truncateMeta(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max - 30 ? slice.slice(0, lastSpace) : slice).trim() + "…";
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { categorie, slug } = await params;
  const a = getArticleBySlug(slug);
  if (!a) return { title: "Article introuvable" };
  const cat = getCategory(a.category);
  const title = `${a.title} — Centre d'aide`;
  const description = truncateMeta(a.excerpt, 155);
  const ogImage = `${BASE_URL}/api/og?type=guide&title=${encodeURIComponent(a.title)}&subtitle=${encodeURIComponent(cat?.title ?? "Centre d'aide Novakou")}`;
  const url = `${BASE_URL}/aide/${categorie}/${a.slug}`;

  return {
    title,
    description,
    keywords: a.tags,
    alternates: { canonical: `/aide/${categorie}/${a.slug}` },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: a.lastUpdated,
      modifiedTime: a.lastUpdated,
      authors: ["Équipe Novakou"],
      tags: a.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: a.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
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

  // JSON-LD Article — datePublished depuis lastUpdated faute de mieux,
  // author = "Équipe Novakou", publisher = Organization Novakou avec logo.
  const articleUrl = `${BASE_URL}/aide/${cat.slug}/${article.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.lastUpdated,
    dateModified: article.lastUpdated,
    author: {
      "@type": "Organization",
      name: "Équipe Novakou",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Novakou",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    image: `${BASE_URL}/api/og?type=guide&title=${encodeURIComponent(article.title)}&subtitle=${encodeURIComponent(cat.title)}`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    articleSection: cat.title,
    keywords: article.tags?.join(", "),
    inLanguage: "fr-FR",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Centre d'aide", item: `${BASE_URL}/aide` },
      { "@type": "ListItem", position: 3, name: cat.title, item: `${BASE_URL}/aide/${cat.slug}` },
      { "@type": "ListItem", position: 4, name: article.title, item: articleUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
            <Clock size={14} />
            {article.readingMin} min de lecture
          </span>
          <span className="inline-flex items-center gap-1">
            <RefreshCw size={14} />
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
              <ThumbsUp size={16} />
              Oui, merci
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-200">
              <ThumbsDown size={16} />
              Pas vraiment
            </button>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold ml-auto"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              <MessageSquare size={16} />
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
